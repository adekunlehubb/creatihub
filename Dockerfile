# ============================================================
# CreatiHub — Fly.io / Docker Dockerfile
# Fly gives a persistent volume for the JSON DB + custom domains.
# Deploy:  fly launch --no-deploy  then  fly deploy
# Docs:    https://fly.io/docs/
# ============================================================
FROM node:20-slim

WORKDIR /app

# Install only production deps
COPY package.json package-lock.json ./
RUN npm ci --omit=dev

# Copy app source (all server-side JS modules)
COPY server.js db.js db-pg.js ai.js paystack.js backup.js generator.js learn-seed.js training-ai.js training-seed.js ./

# Copy static frontend assets
COPY public ./public

# The runtime DB is regenerated from seed data on first boot.
# data/ is gitignored so we just ensure the directory exists.
RUN mkdir -p /app/data

# The JSON DB lives on a mounted volume (see fly.toml) at /data
# We mount the volume to /data and symlink so the app's ./data points there.
RUN mkdir -p /data
RUN rm -rf /app/data && ln -s /data /app/data

ENV NODE_ENV=production
ENV PORT=3000
EXPOSE 3000

CMD ["node", "server.js"]
