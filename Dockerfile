FROM node:14.17.1
ARG APP_ENV

RUN test "$APP_ENV" = "test" || test "$APP_ENV" = "production"
ENV NODE_ENV=$APP_ENV

WORKDIR /usr/src/app
COPY ["package.json", "package-lock.json*", "npm-shrinkwrap.json*", "./"]

RUN npm install --production --silent && mv node_modules ../
COPY . .

EXPOSE 80
CMD ["npm", "start"]