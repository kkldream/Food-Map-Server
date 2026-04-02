FROM node:20-bookworm-slim

RUN apt-get update && apt-get install -y \
    python3 \
    make \
    g++ \
    libcairo2-dev \
    libpango1.0-dev \
    libjpeg-dev \
    libgif-dev \
    librsvg2-dev \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /root/app

COPY package.json yarn.lock ./
RUN corepack enable && yarn install --frozen-lockfile --network-timeout 300000 && yarn cache clean

COPY . .
EXPOSE 3000
CMD [ "yarn", "run", "start" ]
