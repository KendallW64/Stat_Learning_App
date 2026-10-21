FROM node:24-bookworm-slim
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build && mkdir -p /app/.runtime && chown -R node:node /app/.runtime
ENV NODE_ENV=production PORT=3000
USER node
EXPOSE 3000
CMD ["node", "--use-env-proxy", "server/index.js"]
