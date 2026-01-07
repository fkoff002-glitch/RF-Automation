# Use Debian Bullseye (Standard Stable Linux)
FROM node:18-bullseye

# 1. Install standard system ping (iputils-ping)
# We do NOT apply any special permissions (chmod/setcap) to avoid breaking it.
RUN apt-get update && apt-get install -y iputils-ping

# 2. Set working directory
WORKDIR /app

# 3. Copy ALL files
COPY . .

# 4. Install dependencies
RUN npm install

# 5. Expose port
EXPOSE 3000

# 6. Start command
CMD ["node", "server.js"]
