import json
import os
from pathlib import Path
import re
from reconcile import github, origin, preview_allowed, preview_channel, sha


def target(event_name, event, revision, load_pr):
    if event_name == "pull_request":
        pr = event["pull_request"]
    elif event_name == "workflow_dispatch" and event.get("inputs", {}).get("preview_pr"):
        number = event["inputs"]["preview_pr"]
        if not re.fullmatch(r"[1-9][0-9]*", number):
            raise ValueError("preview_pr must be a pull request number")
        pr = load_pr(int(number))
    else:
        return {"ref": revision, "head": revision, "tag": f"main-{revision}", "origin": "", "environment": "production"}
    if not preview_allowed(pr):
        raise ValueError("Automatic previews require an open, same-repository PR from a collaborator")
    number = pr["number"]
    head = sha(pr["head"]["sha"])
    return {
        "ref": f"refs/pull/{number}/merge", "head": head, "tag": f"pr-{number}-{head}",
        "origin": origin(preview_channel(number)), "environment": "preview",
    }


def main():
    event = json.loads(Path(os.environ["GITHUB_EVENT_PATH"]).read_text())
    result = target(os.environ["GITHUB_EVENT_NAME"], event, os.environ["GITHUB_SHA"], lambda number: github(f"pulls/{number}"))
    with open(os.environ["GITHUB_OUTPUT"], "a") as output:
        for name, value in result.items():
            output.write(f"{name}={value}\n")


if __name__ == "__main__":
    main()
