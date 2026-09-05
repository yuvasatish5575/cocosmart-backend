FROM node:22-bookworm-slim

WORKDIR /app

# python3/make/g++ let npm build argon2's native addon.
RUN apt-get update \
    && apt-get install -y --no-install-recommends python3 make g++ ca-certificates \
    && rm -rf /var/lib/apt/lists/*

COPY package.json package-lock.json ./
RUN npm ci

COPY . .
RUN npm run build

ENV NODE_ENV=production
EXPOSE 4000

# Seeds baseline data (idempotent — every seed write is an upsert/guarded
# create) against the MongoDB instance in DATABASE_URL, then starts the API.
CMD ["sh", "-c", "node dist/src/seed.js && node dist/src/server.js"]
