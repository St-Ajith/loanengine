# --- Stage 1: build the Vite app ---
FROM node:lts-alpine AS build

ENV NPM_CONFIG_UPDATE_NOTIFIER=false
ENV NPM_CONFIG_FUND=false

WORKDIR /app

# Install dependencies separately so this layer caches across rebuilds.
COPY package*.json ./
RUN npm ci

# Bring in the source and produce dist/
COPY . ./
RUN npm run build

# --- Stage 2: serve the built dist/ with Caddy ---
FROM caddy:alpine

WORKDIR /app

# Caddy config first (so we can format it before adding the rest)
COPY Caddyfile ./
RUN caddy fmt Caddyfile --overwrite

# Copy the built static assets out of the build stage
COPY --from=build /app/dist ./dist

# Serve
CMD ["caddy", "run", "--config", "Caddyfile", "--adapter", "caddyfile"]
