# Use Debian Bullseye (More stable for network tools than Alpine)
FROM node:18-bullseye

# 1. Install fping and capability tools
RUN apt-get update && apt-get install -y fping libcap2-bin

# 2. FIX: Apply Network Capabilities
# This allows fping to open network sockets without needing full root SUID
# We verify the path is correct (/usr/bin/fping on Debian)
RUN setcap cap_net_raw+ep /usr/bin/fping

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
