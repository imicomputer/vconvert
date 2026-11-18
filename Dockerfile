FROM node:20-bookworm-slim AS build

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY tsconfig.json ./
COPY src ./src
RUN npm run build

FROM node:20-bookworm-slim

ENV NODE_ENV=production \
    PORT=3000 \
    UPLOAD_DIR=/data/uploads

RUN apt-get update \
    && apt-get install -y --no-install-recommends ffmpeg mesa-va-drivers \
    && rm -rf /var/lib/apt/lists/* \
    && mkdir -p /data/uploads /tmp/uploads \
    && chown -R node:node /data /tmp/uploads

WORKDIR /app

COPY --chown=node:node package.json package-lock.json ./
RUN npm ci --omit=dev && npm cache clean --force
COPY --from=build --chown=node:node /app/dist ./dist
COPY --chown=node:node public ./public

USER node

EXPOSE 3000

CMD ["node", "dist/index.js"]
