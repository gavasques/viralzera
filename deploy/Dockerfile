# ===== Stage 1: Build Frontend =====
FROM node:20-slim AS frontend-builder
WORKDIR /app

# Copiar dependências do root (frontend)
COPY package*.json ./
RUN npm ci

# Copiar código do frontend e configs
COPY index.html ./
COPY vite.config.js ./
COPY tailwind.config.js ./
COPY postcss.config.js ./
COPY components.json ./
COPY jsconfig.json ./
COPY src ./src

# Build do frontend (gera /app/dist)
ARG VITE_API_URL=/api
ENV VITE_API_URL=$VITE_API_URL
RUN npm run build

# ===== Stage 2: Build Server (gera prisma client) =====
FROM node:20-slim AS server-builder
WORKDIR /app/server

COPY server/package*.json ./
RUN npm ci

# Copiar código do server com prisma schema
COPY server/prisma ./prisma
COPY server/src ./src

# Gerar Prisma Client
RUN npx prisma generate

# ===== Stage 3: Produção =====
FROM node:20-slim AS production
WORKDIR /app

# Dependências do sistema
RUN apt-get update && apt-get install -y --no-install-recommends \
    curl \
    openssl \
    && rm -rf /var/lib/apt/lists/*

# Dependências de produção do server
COPY server/package*.json ./
RUN npm ci --omit=dev

# Prisma schema + client gerado
COPY server/prisma ./prisma
COPY --from=server-builder /app/server/node_modules/.prisma ./node_modules/.prisma
COPY --from=server-builder /app/server/node_modules/@prisma ./node_modules/@prisma

# Código do server
COPY --from=server-builder /app/server/src ./src

# Frontend compilado
COPY --from=frontend-builder /app/dist ./dist

ENV NODE_ENV=production
ENV PORT=5000
EXPOSE 5000

HEALTHCHECK --interval=30s --timeout=5s --start-period=40s --retries=3 \
    CMD curl -f http://localhost:5000/_health || exit 1

CMD ["node", "src/index.js"]
