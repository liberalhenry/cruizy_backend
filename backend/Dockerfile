# Server (API, Echtzeit, Hintergrundaufträge). Baukontext: Wurzel des Repositorys.
FROM node:22-bookworm-slim AS build
WORKDIR /app/backend
COPY backend/package.json backend/package-lock.json backend/.npmrc ./
# optional: Zertifikat eines Firmen-Proxys (docker build --secret id=extra_ca,src=…)
RUN --mount=type=secret,id=extra_ca,target=/tmp/extra-ca.crt,required=false \
    if [ -s /tmp/extra-ca.crt ]; then export NODE_EXTRA_CA_CERTS=/tmp/extra-ca.crt; fi; \
    npm ci --no-audit --no-fund
COPY backend/tsconfig.json ./
COPY backend/src ./src
COPY backend/scripts ./scripts
RUN npx tsc -p tsconfig.json \
 && cp -r src/db/migrations dist/src/db/migrations \
 && npm prune --omit=dev --no-audit --no-fund

FROM node:22-bookworm-slim
ENV NODE_ENV=production \
    TEXTS_DIR=/app/shared/texts \
    DATA_DIR=/data \
    PORT=3000 \
    HOST=0.0.0.0 \
    NODE_OPTIONS=--max-old-space-size=768
WORKDIR /app/backend
COPY --from=build /app/backend/node_modules ./node_modules
COPY --from=build /app/backend/dist ./dist
COPY backend/package.json ./
COPY shared/texts /app/shared/texts
RUN mkdir -p /data && chown node:node /data
USER node
EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=5s --start-period=30s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:3000/api/gesund').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"
# Signale und Zombie-Prozesse: „init: true“ in docker-compose.yml
CMD ["node", "dist/src/index.js"]
