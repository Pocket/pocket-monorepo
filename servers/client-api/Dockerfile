FROM ghcr.io/apollographql/router:v1.45.0@sha256:de00c0cd6d828ade45603cf5269b11bfb7908f239898c172556835d35213fcbf

USER root

RUN apt-get update && apt-get install -y curl

USER router

COPY ./config/router.yaml /config/router.yaml

COPY ./rhai ./rhai

CMD ["--config", "/config/router.yaml"]
