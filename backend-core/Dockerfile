FROM node:alpine
WORKDIR /usr/src/app/
ENV NODE_ENV production
COPY package.json /usr/src/app/
COPY package-lock.json /usr/src/app/
COPY node_modules /usr/src/app/node_modules
COPY dist/ /usr/src/app/
COPY swagger.json /usr/src/app/swagger.json
COPY swagger-connectivity.json /usr/src/app/swagger-connectivity.json
CMD ["node", "--unhandled-rejections=strict", "main.js"]
