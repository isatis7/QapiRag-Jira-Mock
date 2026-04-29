// ...existing code...
FROM node:20-alpine
WORKDIR /app

# Copy package manifests. If a package-lock.json is present we will use npm ci for reproducible builds,
# otherwise fall back to npm install to allow development convenience.
COPY package*.json ./

# Install dependencies: prefer npm ci when lockfile exists, else npm install --production
RUN sh -c 'if [ -f package-lock.json ]; then npm ci --only=production; else npm install --production; fi'

COPY server.js ./
EXPOSE 3000
CMD ["node","server.js"]

