FROM node:16.18.1-slim
WORKDIR /root/app
COPY . .
RUN yarn install --frozen-lockfile && yarn cache clean
EXPOSE 3000
CMD [ "yarn", "run", "start" ]
