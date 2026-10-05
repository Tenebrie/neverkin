FROM node:24-alpine3.20

ARG DOCKER_UID
ARG DOCKER_GID

# Install ts-shared dependencies
WORKDIR /app/ts-shared
COPY ./app/ts-shared/package.json ./app/ts-shared/package-lock.json* ./
RUN --mount=type=cache,target=/.cache npm install

# Zod Schema library
WORKDIR /library/zod-schema
COPY ./library/tsconfig.json /library/
COPY ./library/zod-schema/package.json ./library/zod-schema/package-lock.json* ./
COPY ./library/zod-schema/tsconfig.json ./
RUN --mount=type=cache,target=/.cache npm install

# Install rhea dependencies
WORKDIR /app/rhea
COPY ./app/rhea-backend/package.json ./app/rhea-backend/package-lock.json* ./
RUN --mount=type=cache,target=/.cache npm install

EXPOSE 3000
