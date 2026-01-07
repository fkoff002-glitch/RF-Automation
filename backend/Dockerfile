# Use Node.js 18 Alpine base image
FROM node:18-alpine

# Install fping and libcap (for setcap)
RUN apk add --no-cache fping libcap

# Set fping permissions (CORRECT PATH FOR ALPINE)
RUN setcap cap_net_raw=ep /usr/sbin/fping || echo "Note: setcap may fail in some environments"

# Set working directory
WORKDIR /usr/src/app

# Copy package files
COPY package*.json ./

# Install dependencies (FIXED: Use npm install instead of npm ci)
RUN npm install --production

# Copy application files
COPY . .

# Expose port
EXPOSE 3000

# Start the application
CMD ["node", "server.js"]
