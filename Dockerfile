# ============================================================
# CreatiHub — Docker Dockerfile (works on Railway, Fly.io, etc.)
# ============================================================
FROM node:20-slim

WORKDIR /app

# Install ffmpeg + fonts for video composition (poster image + TTS audio -> MP4)
# fonts-dejavu-core enables ffmpeg drawtext for placeholder poster text overlay
RUN apt-get update && apt-get install -y --no-install-recommends ffmpeg fonts-dejavu-core && rm -rf /var/lib/apt/lists/*

# Install only production deps
COPY package.json package-lock.json ./
RUN npm ci --omit=dev

# Copy app source (all server-side JS modules)
COPY server.js db.js db-pg.js ai.js paystack.js cryptoPay.js backup.js generator.js learn-seed.js training-ai.js training-seed.js ./

# Copy static frontend assets
COPY public ./public

# The runtime DB is regenerated from seed data on first boot.
# Just ensure the data directory exists and is writable.
RUN mkdir -p /app/data

# Railway provides PORT automatically — don't hardcode it
# ENV NODE_ENV=production
EXPOSE 3000

# Health check: Railway/Docker will ping /health every 30s
HEALTHCHECK --interval=30s --timeout=10s --start-period=15s --retries=3 \
  CMD node -e "require('http').get('http://localhost:'+(process.env.PORT||3000)+'/health',r=>process.exit(r.statusCode===200?0:1)).on('error',()=>process.exit(1))"

CMD ["node", "server.js"]
