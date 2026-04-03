FROM node:20-bookworm-slim

WORKDIR /root/app

COPY package.json pnpm-lock.yaml ./
RUN corepack enable && pnpm install --frozen-lockfile

COPY . .
RUN pnpm build

EXPOSE 3000
CMD [ "node", "dist/server.js" ]
