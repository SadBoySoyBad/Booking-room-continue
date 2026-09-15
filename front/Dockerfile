FROM node:22-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build
FROM node:22-alpine
WORKDIR /app
COPY --from=builder /app/.output ./.output
ENV NODE_ENV=production NITRO_HOST=0.0.0.0 NITRO_PORT=3000
EXPOSE 3000
CMD ["node", ".output/server/index.mjs"]
