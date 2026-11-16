import copy
import fcntl
import json
import logging
import os
from pathlib import Path
import re
import subprocess
import time
import urllib.error
import urllib.request
import uuid

REPOSITORY = "tiramisulabs/seyfert-web"
ROUTER = "seyfert-router"


def command(*args, input=None, check=True):
    result = subprocess.run(args, input=input, text=True, capture_output=True, timeout=180)
    if check and result.returncode:
        raise RuntimeError(f"{args[0]} failed: {result.stderr.strip()}")
    return result


def github(path, method="GET", body=None):
    args = ["gh", "api", f"repos/{REPOSITORY}/{path}", "--method", method]
    if body is not None:
        args += ["--input", "-"]
    result = command(*args, input=None if body is None else json.dumps(body))
    return json.loads(result.stdout) if result.stdout.strip() else None


def sha(value):
    if not isinstance(value, str) or not re.fullmatch(r"[0-9a-f]{40}", value):
        raise ValueError("GitHub returned an invalid commit SHA")
    return value


def preview_channel(number):
    if type(number) is not int or number < 1:
        raise ValueError("Invalid pull request number")
    return f"preview-{number}"


def preview_allowed(pr):
    return (
        pr["state"] == "open"
        and pr["base"]["ref"] == "main"
        and pr["head"]["repo"] is not None
        and pr["head"]["repo"]["full_name"] == REPOSITORY
        and pr["author_association"] in {"OWNER", "MEMBER", "COLLABORATOR"}
    )


def desired_targets():
    targets = {"production": sha(github("commits/main")["sha"])}
    page = 1
    while True:
        prs = github(f"pulls?state=open&per_page=100&page={page}")
        for pr in prs:
            if preview_allowed(pr):
                targets[preview_channel(pr["number"])] = sha(pr["head"]["sha"])
        if len(prs) < 100:
            return targets
        page += 1


def target_is_current(channel, revision):
    if channel == "production":
        return sha(github("commits/main")["sha"]) == revision
    pr = github(f"pulls/{int(channel.removeprefix('preview-'))}")
    return preview_allowed(pr) and sha(pr["head"]["sha"]) == revision


def origin(channel):
    if channel == "production":
        return "https://www.seyfert.dev"
    number = int(channel.removeprefix("preview-"))
    preview_channel(number)
    return f"https://pr-{number}.seyfert.dev"


def image_tag(channel, revision):
    sha(revision)
    prefix = "main" if channel == "production" else f"pr-{int(channel.removeprefix('preview-'))}"
    return f"ghcr.io/{REPOSITORY}:{prefix}-{revision}"


def nginx_config(deployments):
    upstreams, previous, revisions = [], [], []
    for channel, deployment in sorted(deployments.items()):
        hosts = ["seyfert.dev", "www.seyfert.dev"] if channel == "production" else [origin(channel)[8:]]
        for name in [deployment["container"], deployment.get("previous", "")]:
            if name and not re.fullmatch(r"seyfert-[a-z0-9-]+", name):
                raise ValueError("Invalid deployment container name")
        revision = sha(deployment["revision"])
        for host in hosts:
            upstreams.append(f"        {host} {deployment['container']};")
            previous.append(f"        {host} \"{deployment.get('previous', '')}\";")
            revisions.append(f"        {host} {revision};")
    maps = "\n".join(
        f"    map $host ${name} {{\n        default \"\";\n" + "\n".join(rows) + "\n    }"
        for name, rows in [("site", upstreams), ("previous", previous), ("revision", revisions)]
    )
    return f'''pid /tmp/nginx.pid;
worker_processes auto;
error_log /dev/stderr warn;
events {{ worker_connections 1024; }}
http {{
    access_log /dev/stdout;
    client_body_temp_path /tmp/client;
    proxy_temp_path /tmp/proxy;
    fastcgi_temp_path /tmp/fastcgi;
    uwsgi_temp_path /tmp/uwsgi;
    scgi_temp_path /tmp/scgi;
    resolver 127.0.0.11 ipv6=off valid=5s;
{maps}
    map "$host:$uri" $site_cache {{
        default "no-store";
        ~^(www\\.)?seyfert\\.dev:/_next/static/ "public, max-age=31536000, immutable";
        ~^(www\\.)?seyfert\\.dev: "no-cache, max-age=0, must-revalidate";
    }}
    map $host $robots {{
        default "noindex, nofollow";
        seyfert.dev "";
        www.seyfert.dev "";
    }}
    server {{
        listen 8080;
        proxy_set_header Host $host;
        proxy_set_header X-Forwarded-Proto $http_x_forwarded_proto;
        proxy_buffering off;
        proxy_hide_header Cache-Control;
        add_header Cache-Control $site_cache always;
        add_header X-Robots-Tag $robots always;
        add_header X-Seyfert-Revision $revision always;
        location = /healthz {{ return 200 "ready\\n"; }}
        location / {{
            if ($site = "") {{ return 404; }}
            proxy_pass http://$site:3000;
        }}
        location /_next/static/ {{
            if ($site = "") {{ return 404; }}
            proxy_intercept_errors on;
            error_page 404 = @previous_asset;
            proxy_pass http://$site:3000;
        }}
        location @previous_asset {{
            if ($previous = "") {{ return 404; }}
            proxy_pass http://$previous:3000;
        }}
    }}
}}
'''


def atomic_write(path, value):
    temporary = path.with_suffix(path.suffix + ".new")
    temporary.write_text(value)
    temporary.replace(path)


class Reconciler:
    def __init__(self, root):
        self.root = root
        self.state = json.loads((root / "state.json").read_text())

    def save(self):
        atomic_write(self.root / "state.json", json.dumps(self.state, indent=2) + "\n")

    def route(self, deployments):
        path = self.root / "nginx" / "nginx.conf"
        value = nginx_config(deployments)
        if path.read_text() == value:
            return
        previous = path.read_text()
        atomic_write(path, value)
        try:
            command("docker", "exec", ROUTER, "nginx", "-t")
            command("docker", "exec", ROUTER, "nginx", "-s", "reload")
        except Exception:
            atomic_write(path, previous)
            raise

    def purge_cache(self):
        config = json.loads((self.root / "cloudflare.json").read_text())
        token = (self.root / "cloudflare.token").read_text().strip()
        request = urllib.request.Request(
            f"https://api.cloudflare.com/client/v4/zones/{config['zone_id']}/purge_cache",
            headers={"Authorization": f"Bearer {token}", "Content-Type": "application/json"},
            method="POST", data=b'{"purge_everything":true}',
        )
        with urllib.request.urlopen(request, timeout=30) as response:
            if not json.load(response)["success"]:
                raise RuntimeError("Cloudflare cache purge failed")

    def remove(self, container):
        if not re.fullmatch(r"seyfert-(production|preview)-[a-z0-9-]+|seyfert-web", container):
            raise ValueError("Refusing to remove an unrelated container")
        result = command("docker", "rm", "--force", container, check=False)
        if result.returncode and "No such container" not in result.stderr:
            raise RuntimeError(result.stderr)

    def pull(self, channel, revision):
        tag = image_tag(channel, revision)
        result = command("docker", "pull", tag, check=False)
        if result.returncode:
            message = result.stderr.lower()
            if "manifest unknown" in message or f"{tag}: not found" in message:
                return None
            raise RuntimeError(result.stderr)
        image = json.loads(command("docker", "image", "inspect", tag).stdout)[0]
        labels = image["Config"].get("Labels") or {}
        if labels.get("dev.seyfert.head") != revision or labels.get("org.opencontainers.image.source") != f"https://github.com/{REPOSITORY}":
            raise RuntimeError("Image provenance does not match the requested deployment")
        if image["Config"].get("Volumes"):
            raise RuntimeError("Deployment images must not declare persistent volumes")
        return image["Id"]

    def start(self, channel, image, revision):
        container = f"seyfert-{channel}-{image.removeprefix('sha256:')[:12]}-{uuid.uuid4().hex[:8]}"
        network = "toor-proxy" if channel == "production" else "seyfert-previews"
        command(
            "docker", "run", "--detach", "--name", container, "--network", network,
            "--label", "dev.seyfert.managed=true", "--restart", "unless-stopped", "--init",
            "--user", "1000:1000",
            "--memory", "1g", "--cpus", "2" if channel == "production" else "1",
            "--pids-limit", "128", "--cap-drop", "ALL", "--security-opt", "no-new-privileges",
            "--read-only", "--tmpfs", "/tmp:rw,size=64m",
            "--tmpfs", "/app/.next/cache:rw,uid=1000,gid=1000,size=128m", image,
        )
        return container

    def probe(self, container):
        deadline = time.monotonic() + 90
        while time.monotonic() < deadline:
            status = json.loads(command("docker", "inspect", container).stdout)[0]["State"]
            if not status["Running"] or status["Health"]["Status"] == "unhealthy":
                raise RuntimeError(f"Candidate {container} is not healthy")
            if status["Health"]["Status"] == "healthy":
                script = (self.root / "smoke.mjs").read_text()
                command("docker", "exec", "-i", container, "node", "--input-type=module", input=script)
                return
            time.sleep(2)
        raise RuntimeError(f"Candidate {container} did not become healthy within 90 seconds")

    def origin_probe(self, channel, revision):
        host = origin(channel)[8:]
        for path in ["/", "/docs/learn/getting-started", "/api/search?query=Client&limit=3"]:
            deadline = time.monotonic() + 30
            while True:
                result = command("curl", "--silent", "--show-error", "--max-time", "10", "--noproxy", "*",
                                 "--resolve", f"{host}:443:127.0.0.1", "--dump-header", "-", "--output", "/dev/null",
                                 origin(channel) + path, check=False)
                lines = result.stdout.splitlines()
                headers = dict((key.lower(), value.strip()) for line in lines[1:] if ":" in line
                               for key, value in [line.split(":", 1)])
                if lines and re.match(r"HTTP/\S+ 200(?:\s|$)", lines[0]) and headers.get("x-seyfert-revision") == revision:
                    break
                if time.monotonic() >= deadline:
                    raise RuntimeError(f"HTTPS origin check failed for {host + path}: {result.stderr or result.stdout}")
                time.sleep(1)

    def public_probe(self, channel, revision):
        for path in ["/", "/docs/learn/getting-started", "/api/search?query=Client&limit=3"]:
            deadline = time.monotonic() + 30
            while True:
                try:
                    with urllib.request.urlopen(origin(channel) + path, timeout=10) as response:
                        if response.status == 200 and response.headers.get("X-Seyfert-Revision") == revision:
                            break
                        reason = f"HTTP {response.status}, revision {response.headers.get('X-Seyfert-Revision')}"
                except urllib.error.HTTPError as error:
                    with error:
                        if error.code == 403 and error.headers.get("Cf-Mitigated") == "challenge":
                            logging.warning("Cloudflare challenged the public probe for %s; HTTPS origin was verified", channel)
                            return False
                        reason = str(error)
                except (urllib.error.URLError, TimeoutError) as error:
                    reason = str(error)
                if time.monotonic() >= deadline:
                    raise RuntimeError(f"Public check failed for {origin(channel) + path}: {reason}")
                time.sleep(1)
        return True

    def deployment_status(self, channel, revision, state, deployment_id=None, description=None):
        try:
            if deployment_id is None:
                result = github("deployments", "POST", {
                    "ref": revision, "auto_merge": False, "required_contexts": [],
                    "environment": channel, "transient_environment": channel != "production",
                    "production_environment": channel == "production",
                })
                deployment_id = result["id"]
            payload = {
                "state": state, "environment_url": origin(channel), "auto_inactive": True,
            }
            if description:
                payload["description"] = description
            github(f"deployments/{deployment_id}/statuses", "POST", payload)
            return deployment_id
        except Exception as error:
            logging.warning("GitHub deployment status could not be updated: %s", error)
            return deployment_id

    def deploy(self, channel, revision, image, still_current):
        previous = self.state["deployments"].get(channel)
        deployment_id = self.deployment_status(channel, revision, "in_progress")
        try:
            container = self.start(channel, image, revision)
        except Exception:
            if deployment_id:
                self.deployment_status(channel, revision, "error", deployment_id)
            raise
        try:
            self.probe(container)
        except Exception:
            self.remove(container)
            self.state["failed"][channel] = image
            self.save()
            if deployment_id:
                self.deployment_status(channel, revision, "failure", deployment_id)
            raise
        try:
            current = still_current()
        except Exception:
            self.remove(container)
            if deployment_id:
                self.deployment_status(channel, revision, "error", deployment_id)
            raise
        if not current:
            self.remove(container)
            if deployment_id:
                self.deployment_status(channel, revision, "inactive", deployment_id)
            logging.info("Discarding outdated build for %s", channel)
            return
        deployments = copy.deepcopy(self.state["deployments"])
        entry = {"container": container, "revision": revision, "image": image}
        if previous:
            entry["previous"] = previous["container"]
        deployments[channel] = entry
        try:
            self.route(deployments)
            self.origin_probe(channel, revision)
            self.purge_cache()
            public_verified = self.public_probe(channel, revision)
        except Exception:
            try:
                self.route(self.state["deployments"])
                self.purge_cache()
            finally:
                self.remove(container)
                if deployment_id:
                    self.deployment_status(channel, revision, "failure", deployment_id)
            raise
        self.state["deployments"] = deployments
        self.state["failed"].pop(channel, None)
        self.state["requested"].pop(channel, None)
        description = "Origin verified; Cloudflare challenged the public probe" if public_verified is False else "Origin and public routes verified"
        entry["deployment_id"] = self.deployment_status(channel, revision, "success", deployment_id, description)
        self.save()
        if previous and previous.get("previous"):
            self.remove(previous["previous"])
        logging.info("Deployed %s at %s", revision, origin(channel))

    def cleanup_images(self):
        retained = set(self.state["failed"].values())
        for deployment in self.state["deployments"].values():
            retained.add(deployment["image"])
            if deployment.get("previous"):
                previous = json.loads(command("docker", "inspect", deployment["previous"]).stdout)[0]
                retained.add(previous["Image"])
        images = command("docker", "image", "ls", "--no-trunc", "--filter",
                         f"label=org.opencontainers.image.source=https://github.com/{REPOSITORY}",
                         "--format", "{{.ID}}").stdout.splitlines()
        for image in set(images) - retained:
            result = command("docker", "image", "rm", image, check=False)
            if result.returncode:
                logging.warning("An unused Seyfert image could not be removed: %s", result.stderr.strip())

    def reconcile(self, targets):
        targets = dict(targets)
        deployments = copy.deepcopy(self.state["deployments"])
        closed = {}
        for channel, value in deployments.items():
            if channel == "production" or channel in targets:
                continue
            pr = github(f"pulls/{int(channel.removeprefix('preview-'))}")
            if preview_allowed(pr):
                targets[channel] = sha(pr["head"]["sha"])
            else:
                closed[channel] = value
        for channel in closed:
            deployments.pop(channel)
        self.route(deployments)
        if closed:
            try:
                self.purge_cache()
            except Exception:
                self.route(self.state["deployments"])
                raise
        self.state["deployments"] = deployments
        self.save()
        for channel, value in closed.items():
            self.remove(value["container"])
            if value.get("previous"):
                self.remove(value["previous"])
            if value.get("deployment_id"):
                self.deployment_status(channel, value["revision"], "inactive", value["deployment_id"])
            self.state["failed"].pop(channel, None)
            self.state["requested"].pop(channel, None)
        self.save()
        referenced = {entry[key] for entry in deployments.values() for key in ["container", "previous"] if key in entry}
        containers = command("docker", "ps", "--all", "--filter", "label=dev.seyfert.managed=true", "--format", "{{.Names}}").stdout.splitlines()
        for container in containers:
            if container not in referenced:
                self.remove(container)
        for channel, revision in targets.items():
            image = self.pull(channel, revision)
            if image is None:
                if channel != "production" and self.state["requested"].get(channel) != revision:
                    number = int(channel.removeprefix("preview-"))
                    runs = github("actions/workflows/deploy.yml/runs?per_page=100")["workflow_runs"]
                    existing = any(
                        pr["number"] == number and pr["head"]["sha"] == revision
                        for run in runs for pr in run["pull_requests"]
                    )
                    if not existing:
                        github("actions/workflows/deploy.yml/dispatches", "POST", {
                            "ref": "main", "inputs": {"preview_pr": str(number)},
                        })
                        self.state["requested"][channel] = revision
                        self.save()
                continue
            active = self.state["deployments"].get(channel, {})
            if active.get("revision") == revision and active.get("image") == image:
                continue
            if self.state["failed"].get(channel) == image:
                continue
            self.deploy(channel, revision, image, lambda: target_is_current(channel, revision))
        self.cleanup_images()


def main():
    root = Path(os.environ.get("SEYFERT_DEPLOY_ROOT", "/home/toor/services/seyfert-web/automation"))
    os.environ["DOCKER_CONFIG"] = str(root / "docker")
    with (root / "lock").open("a") as lock:
        try:
            fcntl.flock(lock, fcntl.LOCK_EX | fcntl.LOCK_NB)
        except BlockingIOError:
            return
        reconciler = Reconciler(root)
        reconciler.reconcile(desired_targets())


if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO, format="%(levelname)s %(message)s")
    main()
