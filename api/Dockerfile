# Build stage
FROM node:20-alpine AS builder
WORKDIR /api
COPY package*.json ./ 
RUN npm ci
COPY . .
RUN npm run build 
RUN mkdir -p /etc/secrets
COPY secrets/gitkarma.private-key.pem /etc/secrets/gitkarma.private-key.pem
ENV NODE_ENV=production
ENV PORT=4000
# Set Pino to log all levels in production
EXPOSE 4000
CMD ["node", "dist/app.js"]
