# ---- Builder ----
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm install --legacy-peer-deps
COPY . .
RUN npm run build

# ---- Runtime ----
FROM node:20-alpine AS runtime
WORKDIR /app
COPY package*.json ./
RUN npm install --omit=dev --legacy-peer-deps
COPY --from=builder /app/dist ./dist
EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=5s --start-period=60s \
  CMD wget -qO- --spider http://localhost:3000/ 2>&1 | grep -q 'HTTP/' || exit 1
CMD ["node", "dist/main"]
