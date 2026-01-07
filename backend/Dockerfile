# Use Node.js 18 Alpine image
FROM node:18-alpine

# 1. Install fping AND libcap (required for assigning network permissions)
RUN apk add --no-cache fping libcap

# 2. Verify fping location (usually /usr/sbin/fping)
RUN which fping

# 3. FIX: Apply Network Permissions (Belt and Braces Approach)

# Method A: Set SUID bit (Classic Unix permission)
# This forces fping to run as root user
RUN chmod u+s $(which fping)

# Method B: Set Linux Capabilities (Modern Container permission)
# This explicitly allows opening raw network sockets
RUN setcap cap_net_raw+ep $(which fping)

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
