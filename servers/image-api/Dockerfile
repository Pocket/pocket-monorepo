FROM node:16-bullseye-slim@sha256:924a8c6672fcc9f1c3c91294733db26baf58f719d4b976480a65f58b7979ece6
WORKDIR /usr/src/app

ARG GIT_SHA

COPY . .

ENV NODE_ENV=production
ENV PORT 4867
ENV GIT_SHA=${GIT_SHA}
ENV AWS_XRAY_CONTEXT_MISSING=LOG_ERROR
ENV AWS_XRAY_LOG_LEVEL=silent

EXPOSE ${PORT}

RUN apt-get update && apt-get install -y curl && rm -rf /var/lib/apt/lists/*

CMD ["npm", "start"]