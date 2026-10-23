FROM node:22.23.4-alpine

RUN apk add --no-cache poppler-utils

WORKDIR /app

COPY package*.json ./
RUN npm ci --omit=dev

COPY src/ src/

RUN mkdir -p tmp

EXPOSE 3000

CMD ["node", "src/index.js"]
