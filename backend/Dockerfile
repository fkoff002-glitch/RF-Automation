FROM node:18-alpine

# Install fping and libcap
RUN apk add --no-cache fping libcap

# Set fping permissions (skip if it fails - works in Render)
RUN setcap cap_net_raw=ep /usr/sbin/fping || true

# Set working directory
WORKDIR /usr/src/app

# Copy package files (including package-lock.json)
COPY package*.json ./

# Install dependencies using npm ci (faster, more reliable)
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

# Start the application
CMD ["node", "server.js"]
