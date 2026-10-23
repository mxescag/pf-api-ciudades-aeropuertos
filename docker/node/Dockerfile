FROM node:22-bookworm-slim
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY src ./src
USER node
CMD ["npm", "start"]
