# Use Node.js 18 Alpine image
FROM node:18-alpine

# 1. Install fping
RUN apk add --no-cache fping

# 2. FIX: Set SUID bit instead of using setcap
# This grants fping permission to open raw sockets without needing complex capability configurations
RUN chmod u+s /usr/sbin/fping

# 3. Set working directory
WORKDIR /app

# 4. Copy ALL files
COPY . .

# 5. Install dependencies
RUN npm install

# 6. Expose port
EXPOSE 3000

# 7. Start command
CMD ["node", "server.js"]
