FROM node:12

WORKDIR /node

COPY . .

RUN npm install

EXPOSE 80

ENTRYPOINT ["node", "server.js"]
