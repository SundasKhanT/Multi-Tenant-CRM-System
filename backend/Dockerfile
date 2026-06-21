# ---- Build stage ----
FROM node:22-alpine AS builder

WORKDIR /app

# Install deps (including dev deps needed for nest build)
COPY package*.json ./
RUN npm ci

# Copy the rest of the source
COPY . .

# Generate Prisma client (uses your schema.prisma, including custom output path if set)
RUN npx prisma generate

# Build the NestJS app -> outputs to /app/dist
RUN npm run build

# ---- Production stage ----
FROM node:22-alpine AS production

WORKDIR /app

ENV NODE_ENV=production

# Copy only what's needed to run
COPY package*.json ./
RUN npm ci --omit=dev

# Copy built output and generated Prisma client from the builder stage
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/prisma ./prisma

EXPOSE 3000

CMD ["node", "dist/main"]