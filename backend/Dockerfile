# Use Debian Bullseye (Stable)
FROM node:18-bullseye

# 1. Install fping and capability tools
RUN apt-get update && apt-get install -y fping libcap2-bin

# 2. THE FIX: Find real binary and set permissions
# We use 'readlink' to ensure we aren't setting permissions on a shortcut
RUN export FPING_PATH=$(readlink -f $(which fping)) && \
    echo "Found fping at: $FPING_PATH" && \
    chmod u+s $FPING_PATH && \
    setcap cap_net_raw+ep $FPING_PATH

# 3. Verify permissions (Debugging)
RUN ls -l $(readlink -f $(which fping))
RUN getcap $(readlink -f $(which fping))

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
