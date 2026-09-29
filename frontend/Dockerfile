# Web-App und Moderationswerkzeug, ausgeliefert von Caddy (TLS, Weiterleitung an die API).
# Baukontext: Wurzel des Repositorys.
FROM node:22-bookworm-slim AS build
WORKDIR /app/frontend
COPY frontend/package.json frontend/package-lock.json ./
RUN --mount=type=secret,id=extra_ca,target=/tmp/extra-ca.crt,required=false \
    if [ -s /tmp/extra-ca.crt ]; then export NODE_EXTRA_CA_CERTS=/tmp/extra-ca.crt; fi; \
    npm ci --no-audit --no-fund
COPY shared/texts /app/shared/texts
COPY frontend/ ./
RUN npm run build

FROM caddy:2-alpine
COPY deploy/Caddyfile /etc/caddy/Caddyfile
COPY --from=build /app/frontend/dist /srv
