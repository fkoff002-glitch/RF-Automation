# Use Node.js 18 Alpine base image
FROM node:18-alpine

# Install fping and libcap (for setcap)
RUN apk add --no-cache fping libcap

# Set fping permissions (correct path for Alpine Linux)
RUN setcap cap_net_raw=ep /usr/sbin/fping

# Set working directory
WORKDIR /usr/src/app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy application files
COPY . .

# Create a non-root user for security
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001 && \
    chown -R nodejs:nodejs /usr/src/app

USER nodejs

# Expose port
EXPOSE 3000

# Start the application
CMD ["node", "server.js"]
