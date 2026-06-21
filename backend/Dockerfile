FROM node:22-alpine

WORKDIR /app

# Install dependencies (including dev ones needed for build)
COPY package*.json ./
RUN npm ci

# Copy your source code and Prisma schema
COPY . .

# Generate Prisma client
RUN npx prisma generate

# Build the NestJS app → creates /app/dist
RUN npm run build

# Expose port (match your app's port)
EXPOSE 3000

# Run the compiled app
CMD npx prisma migrate deploy && node dist/src/main