FROM node:24-bookworm-slim AS build

ENV NEXT_TELEMETRY_DISABLED=1
WORKDIR /app

RUN corepack enable
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile --ignore-scripts

COPY . .
ARG SITE_URL
ARG DEPLOYMENT_ENV=production
ENV SITE_URL=${SITE_URL} DEPLOYMENT_ENV=${DEPLOYMENT_ENV}
RUN pnpm exec fumadocs-mdx && pnpm build

FROM node:24-bookworm-slim AS runner

ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    HOSTNAME=0.0.0.0 \
    PORT=3000
WORKDIR /app

ARG SITE_URL
ARG DEPLOYMENT_ENV=production
ARG GIT_SHA=unknown
ENV SITE_URL=${SITE_URL} DEPLOYMENT_ENV=${DEPLOYMENT_ENV}
LABEL org.opencontainers.image.source="https://github.com/tiramisulabs/seyfert-web" \
      org.opencontainers.image.revision=${GIT_SHA}

COPY --from=build --chown=node:node /app/.next/standalone ./
COPY --from=build --chown=node:node /app/.next/static ./.next/static
COPY --from=build --chown=node:node /app/public ./public

USER node
EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --start-period=30s \
  CMD node -e "fetch('http://127.0.0.1:3000/').then(r => process.exit(r.ok ? 0 : 1)).catch(() => process.exit(1))"

CMD ["node", "server.js"]
