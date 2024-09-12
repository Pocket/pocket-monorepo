FROM ghcr.io/apollographql/router:v1.54.0@sha256:bea56795ddf7990b19a4a3f54b5ebd32da2e5144b0c4bc0262c00095a2b9ed3d

USER root

RUN apt-get update && apt-get install -y curl

USER router

COPY ./config/router.yaml /config/router.yaml

COPY ./rhai ./rhai

CMD ["--config", "/config/router.yaml"]
