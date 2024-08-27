FROM ghcr.io/apollographql/router:v1.52.1@sha256:b16b1cb64f88ceb3485f5e524ade1b4c4a2039a2b1be851be122e79b9d5a6ded

USER root

RUN apt-get update && apt-get install -y curl

USER router

COPY ./config/router.yaml /config/router.yaml

COPY ./rhai ./rhai

CMD ["--config", "/config/router.yaml"]
