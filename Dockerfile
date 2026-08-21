# ============================================================
# CreatiHub — Docker Dockerfile (works on Railway, Fly.io, etc.)
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
# Just ensure the data directory exists and is writable.
RUN mkdir -p /app/data

# NOTE: On Fly.io, you can mount a volume at /data and symlink:
#   RUN rm -rf /app/data && ln -s /data /app/data
# But on Railway and most platforms, /app/data works directly.

ENV NODE_ENV=production
ENV PORT=3000
EXPOSE 3000

CMD ["node", "server.js"]
