import json
import io
from email.message import Message
from pathlib import Path
import tempfile
from types import SimpleNamespace
import unittest
import urllib.error
from unittest.mock import Mock, call, patch
import build_target
import reconcile

OLD = "a" * 40
NEW = "b" * 40


def pull_request(**changes):
    pr = {
        "number": 36, "state": "open", "author_association": "MEMBER",
        "base": {"ref": "main"},
        "head": {"sha": NEW, "repo": {"full_name": reconcile.REPOSITORY}},
    }
    pr.update(changes)
    return pr


class DeploymentTests(unittest.TestCase):
    def setUp(self):
        self.directory = tempfile.TemporaryDirectory()
        self.addCleanup(self.directory.cleanup)
        self.root = Path(self.directory.name)
        self.production = {"container": "seyfert-web", "revision": OLD, "image": "sha256:old"}
        self.state = {"deployments": {"production": self.production}, "failed": {}, "requested": {}}
        (self.root / "state.json").write_text(json.dumps(self.state))
        self.manager = reconcile.Reconciler(self.root)

    def stub_deployment(self):
        for name in ["route", "save", "probe", "purge_cache", "origin_probe", "public_probe", "remove"]:
            setattr(self.manager, name, Mock())
        self.manager.start = Mock(return_value="seyfert-production-candidate")
        self.manager.pull = Mock(return_value="sha256:old")
        self.manager.deployment_status = Mock(return_value=123)

    def test_dispatch_previews_use_merge_tree_and_head_identity(self):
        load = Mock(return_value=pull_request())
        result = build_target.target("workflow_dispatch", {"inputs": {"preview_pr": "36"}}, OLD, load)
        self.assertEqual(result["ref"], "refs/pull/36/merge")
        self.assertEqual(result["head"], NEW)
        self.assertEqual(result["tag"], f"pr-36-{NEW}")
        load.assert_called_once_with(36)

    def test_fork_and_closed_pr_dispatches_cannot_publish_previews(self):
        for pr in [pull_request(head={"sha": NEW, "repo": {"full_name": "someone/fork"}}), pull_request(state="closed")]:
            with self.subTest(pr=pr), self.assertRaises(ValueError):
                build_target.target("workflow_dispatch", {"inputs": {"preview_pr": "36"}}, OLD, lambda _: pr)

    def test_stale_candidate_never_changes_routes(self):
        self.stub_deployment()
        self.manager.deploy("production", NEW, "sha256:new", lambda: False)
        self.manager.route.assert_not_called()
        self.manager.remove.assert_called_once_with("seyfert-production-candidate")
        self.assertEqual(self.manager.state["deployments"]["production"], self.production)

    def test_failed_candidate_keeps_production_and_blocks_the_same_image(self):
        self.stub_deployment()
        self.manager.probe.side_effect = RuntimeError("missing runtime dependency")
        with self.assertRaisesRegex(RuntimeError, "runtime dependency"):
            self.manager.deploy("production", NEW, "sha256:new", lambda: True)
        self.manager.route.assert_not_called()
        self.assertEqual(self.manager.state["failed"]["production"], "sha256:new")
        self.assertIn(call("production", NEW, "failure", 123), self.manager.deployment_status.call_args_list)
        self.manager.start.reset_mock()
        self.manager.pull = Mock(return_value="sha256:new")
        with patch.object(reconcile, "command", return_value=SimpleNamespace(stdout="")):
            self.manager.reconcile({"production": NEW})
        self.manager.start.assert_not_called()

    def test_public_failure_restores_routing_and_removes_the_candidate(self):
        self.stub_deployment()
        self.manager.public_probe.side_effect = RuntimeError("wrong revision served")
        with self.assertRaisesRegex(RuntimeError, "wrong revision"):
            self.manager.deploy("production", NEW, "sha256:new", lambda: True)
        self.assertEqual(self.manager.route.call_args_list[-1], call(self.state["deployments"]))
        self.assertEqual(self.manager.purge_cache.call_count, 2)
        self.manager.remove.assert_called_once_with("seyfert-production-candidate")
        self.assertEqual(self.manager.state["deployments"], self.state["deployments"])
        self.manager.save.assert_not_called()

    def test_cache_failure_during_rollback_still_removes_candidate(self):
        self.stub_deployment()
        self.manager.purge_cache.side_effect = RuntimeError("Cloudflare unavailable")
        with self.assertRaisesRegex(RuntimeError, "Cloudflare"):
            self.manager.deploy("production", NEW, "sha256:new", lambda: True)
        self.manager.remove.assert_called_once_with("seyfert-production-candidate")
        self.assertEqual(self.manager.state["deployments"], self.state["deployments"])

    def test_closing_preview_removes_both_revisions_without_touching_production(self):
        self.manager.state["deployments"]["preview-36"] = {
            "container": "seyfert-preview-36-new", "previous": "seyfert-preview-36-old",
            "revision": NEW, "deployment_id": 123,
        }
        self.stub_deployment()
        with patch.object(reconcile, "command", return_value=SimpleNamespace(stdout="")), \
             patch.object(reconcile, "github", return_value=pull_request(state="closed")):
            self.manager.reconcile({"production": OLD})
        self.manager.route.assert_called_once_with({"production": self.production})
        self.assertEqual(self.manager.remove.call_args_list, [call("seyfert-preview-36-new"), call("seyfert-preview-36-old")])
        self.manager.deployment_status.assert_called_once_with("preview-36", NEW, "inactive", 123)
        self.assertEqual(self.manager.state["deployments"], {"production": self.production})

    def test_missing_preview_is_requested_once_even_when_dispatch_returns_no_body(self):
        self.stub_deployment()
        self.manager.pull = Mock(return_value=None)
        with patch.object(reconcile, "command", return_value=SimpleNamespace(stdout="")), \
             patch.object(reconcile, "github", side_effect=[{"workflow_runs": []}, None]) as api:
            self.manager.reconcile({"production": OLD, "preview-36": NEW})
            self.manager.reconcile({"production": OLD, "preview-36": NEW})
        self.assertEqual(api.call_count, 2)
        self.assertEqual(self.manager.state["requested"], {"preview-36": NEW})

    def test_existing_pr_workflow_does_not_get_a_duplicate_dispatch(self):
        self.stub_deployment()
        self.manager.pull = Mock(return_value=None)
        run = {"pull_requests": [{"number": 36, "head": {"sha": NEW}}]}
        with patch.object(reconcile, "command", return_value=SimpleNamespace(stdout="")), \
             patch.object(reconcile, "github", return_value={"workflow_runs": [run]}) as api:
            self.manager.reconcile({"production": OLD, "preview-36": NEW})
        api.assert_called_once_with("actions/workflows/deploy.yml/runs?per_page=100")

    def test_accepted_empty_github_response_does_not_raise_after_dispatch(self):
        with patch.object(reconcile, "command", return_value=SimpleNamespace(stdout="")):
            self.assertIsNone(reconcile.github("actions/workflows/deploy.yml/dispatches", "POST", {"ref": "main"}))

    def test_missing_from_open_list_is_not_deleted_if_pr_is_still_open(self):
        self.manager.state["deployments"]["preview-36"] = {
            "container": "seyfert-preview-36-current", "revision": NEW, "image": "sha256:current",
        }
        self.stub_deployment()
        self.manager.pull.side_effect = lambda channel, _: "sha256:old" if channel == "production" else "sha256:current"
        with patch.object(reconcile, "command", return_value=SimpleNamespace(stdout="")), \
             patch.object(reconcile, "github", return_value=pull_request()):
            self.manager.reconcile({"production": OLD})
        self.manager.remove.assert_not_called()
        self.assertIn("preview-36", self.manager.state["deployments"])

    def test_github_error_before_cleanup_does_not_change_routes_or_state(self):
        self.manager.state["deployments"]["preview-36"] = {
            "container": "seyfert-preview-36-current", "revision": NEW, "image": "sha256:current",
        }
        self.stub_deployment()
        with patch.object(reconcile, "github", side_effect=RuntimeError("GitHub unavailable")), \
             self.assertRaisesRegex(RuntimeError, "GitHub unavailable"):
            self.manager.reconcile({"production": OLD})
        self.manager.route.assert_not_called()
        self.manager.remove.assert_not_called()
        self.manager.save.assert_not_called()

    def test_cloudflare_challenge_is_reported_as_unverified_public_route(self):
        headers = Message()
        headers["Cf-Mitigated"] = "challenge"
        error = urllib.error.HTTPError("https://www.seyfert.dev", 403, "Forbidden", headers, io.BytesIO())
        with patch.object(reconcile.urllib.request, "urlopen", side_effect=error), self.assertLogs(level="WARNING"):
            self.assertFalse(self.manager.public_probe("production", NEW))

    def test_other_public_403_responses_still_fail_deployment(self):
        error = urllib.error.HTTPError("https://www.seyfert.dev", 403, "Forbidden", Message(), io.BytesIO())
        with patch.object(reconcile.urllib.request, "urlopen", side_effect=error), \
             patch.object(reconcile.time, "monotonic", side_effect=[0, 31]), \
             self.assertRaisesRegex(RuntimeError, "HTTP Error 403"):
            self.manager.public_probe("production", NEW)

    def test_failed_cleanup_purge_keeps_preview_state_for_the_next_attempt(self):
        preview = {"container": "seyfert-preview-36-current", "revision": NEW, "image": "sha256:current"}
        self.manager.state["deployments"]["preview-36"] = preview
        self.stub_deployment()
        self.manager.purge_cache.side_effect = RuntimeError("Cache purge failed")
        with patch.object(reconcile, "github", return_value=pull_request(state="closed")), \
             self.assertRaisesRegex(RuntimeError, "Cache purge failed"):
            self.manager.reconcile({"production": OLD})
        self.manager.remove.assert_not_called()
        self.manager.save.assert_not_called()
        self.assertEqual(self.manager.state["deployments"]["preview-36"], preview)
        self.assertEqual(self.manager.route.call_args_list[-1], call(self.manager.state["deployments"]))

    def test_rebuilt_image_for_the_same_commit_is_promoted(self):
        self.stub_deployment()
        self.manager.pull.return_value = "sha256:rebuilt"
        self.manager.deploy = Mock()
        with patch.object(reconcile, "command", return_value=SimpleNamespace(stdout="")):
            self.manager.reconcile({"production": OLD})
        args = self.manager.deploy.call_args.args
        self.assertEqual(args[:3], ("production", OLD, "sha256:rebuilt"))

    def test_missing_credential_helper_is_not_treated_as_a_pending_build(self):
        result = SimpleNamespace(returncode=1, stderr='docker-credential-secretservice: executable file not found in $PATH')
        with patch.object(reconcile, "command", return_value=result), \
             self.assertRaisesRegex(RuntimeError, "credential-secretservice"):
            self.manager.pull("production", OLD)


if __name__ == "__main__":
    unittest.main()
