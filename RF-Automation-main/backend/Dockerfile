# Use lightweight Linux image (Alpine)
FROM node:18-alpine

# 1. Install fping inside the container
# We also install 'libcap' to allow setting permissions without sudo
RUN apk add --no-cache fping libcap

# 2. Set fping permissions automatically during build
# This removes the need to run 'sudo' on the server
RUN setcap cap_net_raw=ep /usr/bin/fping

# Set working directory
WORKDIR /app

# 3. Copy package files and install dependencies
COPY package*.json ./
RUN npm install

# 4. Copy source code
COPY . .

# 5. Expose the API port
EXPOSE 3000

# 6. Start the application
CMD ["node", "server.js"]
