# ─── Build Stage ────────────────────────────────────────────────────────────
FROM node:20-alpine AS builder

WORKDIR /usr/src/app

# Copy package files first for better layer caching
COPY package*.json ./

# Install all dependencies (including devDependencies for build)
RUN npm ci --omit=dev

# ─── Production Stage ────────────────────────────────────────────────────────
FROM node:20-alpine

WORKDIR /usr/src/app

# Create a non-root user for security
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodeuser -u 1001

# Copy production node_modules from builder
COPY --from=builder /usr/src/app/node_modules ./node_modules

# Copy application code
COPY . .

# Change ownership to non-root user
RUN chown -R nodeuser:nodejs /usr/src/app

USER nodeuser

EXPOSE 3000

# Use node directly (not npm) for better signal handling
CMD ["node", "server.js"]
