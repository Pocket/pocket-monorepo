FROM ghcr.io/apollographql/router:v1.56.0@sha256:b6a69cb14c73d890e32a5ab3c47508d322b1c69afdce9bce61cb7aed6f43b4ed

USER root

RUN apt-get update && apt-get install -y curl

USER router

COPY ./config/router.yaml /config/router.yaml

COPY ./rhai ./rhai

CMD ["--config", "/config/router.yaml"]
