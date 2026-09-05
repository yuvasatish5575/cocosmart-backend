FROM node:22-bookworm-slim

WORKDIR /app

# python3/make/g++ let npm build argon2's native addon; openssl is required
# by Prisma's query engine binary at runtime.
RUN apt-get update \
    && apt-get install -y --no-install-recommends python3 make g++ openssl ca-certificates \
    && rm -rf /var/lib/apt/lists/*

COPY package.json package-lock.json ./
RUN npm ci

COPY . .
RUN npx prisma generate
RUN npm run build

ENV NODE_ENV=production
EXPOSE 4000

# Applies any pending migrations, seeds baseline data (idempotent — every
# seed write is an upsert/guarded create), then starts the API.
CMD ["sh", "-c", "npx prisma migrate deploy && node dist/prisma/seed.js && node dist/src/server.js"]
