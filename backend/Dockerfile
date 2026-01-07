# Use Node.js 18 Alpine image
FROM node:18-alpine

# 1. Install fping
RUN apk add --no-cache fping

# 2. FORCE REBUILD: Fixing permissions
RUN echo "Applying SUID to fping..."

# 3. Grant Root Permissions to fping (The Fix)
# We use chmod 4755 to set the SUID bit.
# This allows fping to open raw network sockets even if the app isn't root.
RUN chmod 4755 /usr/sbin/fping

# 4. Set working directory
WORKDIR /app

# 5. Copy ALL files
COPY . .

# 6. Install dependencies
RUN npm install

# 7. Expose port
EXPOSE 3000

# 8. Start command
CMD ["node", "server.js"]
