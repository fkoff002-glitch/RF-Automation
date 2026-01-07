FROM node:18-alpine

# Install fping and libcap
RUN apk add --no-cache fping libcap

# Set fping permissions
RUN setcap cap_net_raw=ep /usr/sbin/fping || true

# Set working directory
WORKDIR /usr/src/app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install --omit=dev

# Copy application files
COPY . .

# Expose port
EXPOSE 3000

# Start the application
CMD ["node", "server.js"]
