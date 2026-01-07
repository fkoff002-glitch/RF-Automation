# Use Node.js 18 Alpine image
FROM node:18-alpine

# 1. Install fping and libcap for permissions
RUN apk add --no-cache fping libcap

# 2. Grant fping permissions automatically
RUN setcap cap_net_raw=ep /usr/sbin/fping || true

# 3. Set working directory
WORKDIR /app

# 4. Copy ALL files from current folder (backend/)
# This is safer than copying specific files one by one
COPY . .

# 5. Install dependencies
# If package.json is empty or missing, this step will show the real error
RUN npm install

# 6. Expose port
EXPOSE 3000

# 7. Start command
CMD ["node", "server.js"]
