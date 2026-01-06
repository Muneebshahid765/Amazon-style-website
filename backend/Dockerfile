FROM node:20-alpine AS base

WORKDIR /app

COPY package*.json ./

FROM base AS dependencies

RUN npm ci --only=production

FROM base AS build

RUN npm ci

COPY . .

FROM base AS production

ENV NODE_ENV=production

COPY --from=dependencies /app/node_modules ./node_modules
COPY --from=build /app .

RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

USER nodejs

EXPOSE 5000

CMD ["node", "server.js"]
