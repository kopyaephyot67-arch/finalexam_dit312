FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install --only=production && npm cache clean --force
COPY . .
RUN mkdir -p uploads
EXPOSE 3001
CMD ["node", "index.js"]