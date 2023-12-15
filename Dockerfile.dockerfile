FROM node:18@sha256:67cb6aae3415f1a5106579aa1400b18368860f922d55fcac589f6c2af104bad5
WORKDIR /usr/src/app

ARG GIT_SHA

ENV NODE_ENV=production
ENV PORT 4006
ENV TZ=US/CENTRAL
ENV GIT_SHA=${GIT_SHA}

EXPOSE ${PORT}

CMD ["npm", "start"]

# TODO: https://github.com/moby/moby/issues/735