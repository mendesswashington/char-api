FROM node:18

WORKDIR /usr/app

COPY ["package.json", "package-lock.json", "./"]

RUN npm install

COPY . .

EXPOSE 7777

CMD ["node", "src/server", "index.js"]