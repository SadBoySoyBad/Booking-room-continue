# ---------- Stage 1: Build ----------
FROM node:lts-alpine AS builder

WORKDIR /app
COPY . .

RUN npm install
RUN npm run build

# ---------- Stage 2: Runtime ----------
FROM node:lts-alpine

WORKDIR /app
COPY --from=builder /app /app

ENV NODE_ENV=production
ENV NITRO_PORT=3000
ENV NITRO_HOST=0.0.0.0

EXPOSE 3000

CMD ["node", ".output/server/index.mjs"]
