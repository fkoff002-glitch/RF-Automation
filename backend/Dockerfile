# Use standard Node.js 18 image (Debian-based, not Alpine)
# This is much more stable for network tools like fping
FROM node:18

# 1. Install fping
RUN apt-get update && apt-get install -y fping

# 2. Grant Root Permissions (SUID)
# This allows fping to open network sockets safely
RUN chmod u+s /usr/bin/fping

# 3. Clean up to keep image size down
RUN rm -rf /var/lib/apt/lists/*

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
