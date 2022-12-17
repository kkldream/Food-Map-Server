FROM node:16.18.1-slim
WORKDIR /root/app
COPY . .
RUN yarn install --frozen-lockfile && yarn cache clean
VOLUME /root/app/.env
EXPOSE 3000
CMD [ "yarn", "start" ]
