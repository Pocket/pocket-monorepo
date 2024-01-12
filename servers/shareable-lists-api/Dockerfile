# Debian GNU/Linux 11 (bullseye)
FROM node:18-slim@sha256:b175cd7f3358c399f7bcee9b1032b86b71b1afa4cfb4dd0db55d66f871475a3e

ARG GIT_SHA
ENV GIT_SHA=${GIT_SHA}
ENV NODE_ENV=production

WORKDIR /usr/src/app
COPY . .
RUN apt-get update && \
  apt-get install -y \
    curl && \
  rm -rf /var/lib/apt/lists/*

ENV PORT 4029
EXPOSE ${PORT}

CMD ["npm", "start"]
