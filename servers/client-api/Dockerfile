FROM ghcr.io/apollographql/router:v1.55.0@sha256:6bd7e62f87a023569aba6b3f7229b3ad4d5618744de601a0857ec78308eb7d7c

USER root

RUN apt-get update && apt-get install -y curl

USER router

COPY ./config/router.yaml /config/router.yaml

COPY ./rhai ./rhai

CMD ["--config", "/config/router.yaml"]
