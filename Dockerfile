FROM node:20-bookworm-slim

ARG YARN_INSTALL_FLAGS="--frozen-lockfile --network-timeout 300000 --verbose"

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
RUN corepack enable \
    && node -v \
    && yarn -v \
    && echo "=== Phase 1: yarn install --ignore-scripts ===" \
    && yarn install ${YARN_INSTALL_FLAGS} --ignore-scripts \
    && echo "=== Phase 2: canvas install only ===" \
    && npm_config_build_from_source=true yarn add canvas@2.10.2 --ignore-workspace-root-check --verbose \
    && echo "=== Phase 3: rebuild scripts ===" \
    && yarn install ${YARN_INSTALL_FLAGS} \
    && yarn cache clean

COPY . .
EXPOSE 3000
CMD [ "yarn", "run", "start" ]
