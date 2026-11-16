# seyfert-docs

This is a Next.js application generated with
[Create Fumadocs](https://github.com/fuma-nama/fumadocs).

Run development server:

```bash
npm run dev
# or
pnpm dev
# or
yarn dev
```

Open http://localhost:3000 with your browser to see the result.

## Hosting on Toor

Automatic production deployments and PR previews are described in
[the deployment guide](deploy/README.md). Once enabled, that updater owns the
running releases; the commands below are for manual/bootstrap hosting.

The Docker image builds the API reference and MDX content, then runs Next.js's
standalone server as a non-root user. Search, image optimization, redirects, and
the hourly GitHub/npm revalidation continue to run on the server.

Builds use two page workers. Turbopack also sizes its MDX compilation pool from
the CPUs available to the build, so use a dedicated builder with CPU affinity
and a memory limit. Build the Linux image in CI or on a separate machine:

```bash
docker buildx create --name seyfert-build --driver docker-container \
  --driver-opt cpuset-cpus=0-1 --driver-opt memory=10g --driver-opt memory-swap=10g
docker buildx build --builder seyfert-build --platform linux/amd64 --load \
  -t seyfert-web:20261116-1 .
docker save seyfert-web:20261116-1 | gzip -1 | ssh toor 'gzip -d | docker load'
```

On Toor, run Compose from the matching source directory. It uses the existing
`toor-proxy` Docker network:

```bash
SEYFERT_IMAGE_TAG=20261116-1 docker compose up -d --no-build --wait
```

Set `SEYFERT_IMAGE_TAG` in the deployment's `.env` file to keep subsequent Compose
commands on the same release. Keep the previous image tag for rollback:

```bash
SEYFERT_IMAGE_TAG=previous-release docker compose up -d --no-build --wait
```

In Nginx Proxy Manager, forward `seyfert.dev` and `www.seyfert.dev` to
`http://seyfert-web:3000`, enable HTTPS, and point their DNS records at Toor's
public ingress. The container does not publish a host port.

To run the built image outside Toor:

```bash
docker run --rm -p 127.0.0.1:3000:3000 seyfert-web:20261116-1
```

## Learn More

To learn more about Next.js and Fumadocs, take a look at the following
resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js
  features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.
- [Fumadocs](https://fumadocs.vercel.app) - learn about Fumadocs
