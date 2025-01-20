# Build stage
FROM node:20-slim AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy source files
COPY . .

# Build both client and server
RUN npm run build

# Production stage
FROM node:20-slim AS production

WORKDIR /app

# Copy package files and install production dependencies
COPY package*.json ./
RUN npm ci --production

# Copy built files from builder
COPY --from=builder /app/dist/client ./dist/client
COPY --from=builder /app/dist/server ./dist/server

# Create data directory
VOLUME /app/data

# Expose the port the app runs on
EXPOSE 3000

# Set environment variables
ENV NODE_ENV=production
ENV RSS_WATCHER_DATA_DIR=/app/data

# Start the application
CMD ["node", "dist/server/index.js"]