# Deployments on Toor

Pushes to `main` build production. Open PRs targeting `main` build previews at
`https://pr-<number>.seyfert.dev`. The workflow checks out the PR's merge ref,
so previews include the current base branch as well as the PR changes.

GitHub Actions builds Linux/amd64 images with two available CPU cores and a
10 GiB memory limit. It starts each standalone image and checks pages, search,
redirects, embeds, image optimization, and JavaScript/CSS before publishing to
`ghcr.io/tiramisulabs/seyfert-web`. Tags are `main-<commit>` and
`pr-<number>-<head-commit>`; the OCI revision label records the actual checked-out
commit, including the merge commit for previews.

Toor downloads finished images. It does not build application code. No inbound
SSH connection or public deployment webhook is required.

## Activation and ownership

The canonical hosting code is this directory. Installed copies live at
`/home/toor/services/seyfert-web/automation`. Updates to the host scripts and
router configuration must be installed separately from application image
deployments; PR code never updates or executes the host updater.

The host uses the `toor` user's existing GitHub CLI authentication. GHCR's Docker
authentication is stored in `automation/docker`, separately from other Docker
registry credentials. `cloudflare.json` selects the `seyfert.dev` zone and
`cloudflare.token` grants Cache Purge for that zone. Neither credential belongs
in the repository or application image.

After the workflow is published on `main` and its first production image is
available, enable the installed user timer:

```bash
systemctl --user enable --now seyfert-deploy.timer
```

User lingering keeps the timer active without an SSH session. It checks again
one minute after each reconciliation finishes. Existing eligible PRs that have
no build are requested through `workflow_dispatch`.

```bash
systemctl --user status seyfert-deploy.timer
journalctl --user -u seyfert-deploy.service --since today
systemctl --user start seyfert-deploy.service
```

Stop automatic changes before manually intervening:

```bash
systemctl --user stop seyfert-deploy.timer
```

## Promotion and rollback

`reconcile.py` reads the current main commit and the complete open-PR list before
changing deployments. GitHub/API failures leave existing deployments running.
Each downloaded image must identify the expected repository and PR head.

A candidate starts separately and must pass its healthcheck and standalone
smoke checks. The updater checks GitHub again before switching, discarding a
candidate whose branch moved or PR closed during preparation. It then reloads
the router and checks the expected revision over HTTPS through the origin proxy,
then through the public domain. Failed origin checks or unchallenged public
checks restore the previous routing and remove the candidate. A Cloudflare
anti-bot challenge is reported in the GitHub deployment description; it does not
claim public verification or reject an otherwise healthy origin. Promotions,
rollbacks, and preview cleanup purge Cloudflare's zone cache. Cached responses,
including 404s, were observed in this zone despite `no-store`, so origin headers
alone are not used as an invalidation guarantee.

`state.json` records the active image, container, revision, previous container,
and GitHub deployment ID for each environment. State is committed after those
checks. The previous container remains available for static assets from
an already-open browser tab. Older containers and unused Seyfert images are
removed. A candidate that fails its internal checks is not started repeatedly
until a different image is published.

GitHub's deployment statuses expose the environment URL and deployment result.
The updater does not post PR comments.

## Preview boundaries and cleanup

Automatic previews require a same-repository PR from an owner, member, or
collaborator. Forks and other contributors do not automatically execute on Toor.
PRs that are already open can also be requested explicitly:

```bash
gh workflow run deploy.yml --ref main -f preview_pr=36
```

Preview containers run as UID 1000 with a read-only root filesystem, 1 GiB RAM,
one CPU, a PID limit, and no host mounts, Docker socket, or production secrets.
Their internal Docker network has no outbound access or route to the homelab;
external data needed by the docs is collected during the CI build. Requests
made by browser JavaScript still use the browser's network normally.

The shared router attaches to that network and `toor-proxy`, with IP forwarding
disabled. Nginx Proxy Manager terminates HTTPS. The preview DNS wildcard uses
first-level hostnames, covered by Cloudflare's existing Universal SSL.

Previews send `X-Robots-Tag: noindex, nofollow` and `Cache-Control: no-store`.
Their metadata and Discord embed URLs point to their own hostname. Production
HTML requires revalidation; hashed static assets remain immutable.

Closing or merging a PR removes its route, active and previous containers, and
unused images on the next reconciliation. The URL then returns 404 and its
GitHub deployment is marked inactive.

## Checks

```bash
actionlint .github/workflows/deploy.yml
python3 -m unittest discover -s deploy -p 'test_*.py'
```

`smoke.mjs` runs inside each candidate container before publication and again
before promotion on Toor. Build, CI publication, candidate readiness, public
verification, and GitHub deployment status are separate steps.
