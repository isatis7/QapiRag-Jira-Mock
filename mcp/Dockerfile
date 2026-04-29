FROM node:20-alpine
WORKDIR /app
COPY package.json ./
# Use npm install so dependencies are installed even without a package-lock.json
# npm ci requires a lockfile; avoid silent failure by not forcing ignore on errors
RUN npm install --production
COPY server.js ./
EXPOSE 3000
CMD ["node","server.js"]
