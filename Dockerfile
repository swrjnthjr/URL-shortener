FROM node:20.12-alpine

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci --omit=dev --ignore-scripts

COPY server.js ./
COPY src ./src
COPY public ./public
COPY migrations ./migrations
COPY scripts ./scripts

ENV NODE_ENV=production
EXPOSE 3000

CMD ["node", "server.js"]
