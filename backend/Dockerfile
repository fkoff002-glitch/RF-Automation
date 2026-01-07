# Use Debian Bullseye (Stable & standard permissions)
FROM node:18-bullseye

# 1. Install fping
RUN apt-get update && apt-get install -y fping

# 2. THE FIX: Apply SUID (Set User ID) permission
# This forces fping to always run with root privileges, 
# which works better in containers than 'setcap'
RUN chmod 4755 /usr/bin/fping

# 3. Verify installation during build (Debugging)
RUN fping -v

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
