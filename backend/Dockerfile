# Use Node.js 18 Alpine base image
FROM node:18-alpine

# Install fping and libcap (for network permissions)
RUN apk add --no-cache fping libcap

# Set fping permissions (CORRECT PATH FOR ALPINE)
RUN setcap cap_net_raw=ep /usr/sbin/fping || echo "Warning: setcap failed, but continuing..."

# Verify fping installation
RUN fping --version && echo "fping installed successfully"

# Set working directory
WORKDIR /usr/src/app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy application files
COPY . .

# Create non-root user for security
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001 && \
    chown -R nodejs:nodejs /usr/src/app

USER nodejs

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3000/health || exit 1

# Start the application
CMD ["node", "server.js"]
