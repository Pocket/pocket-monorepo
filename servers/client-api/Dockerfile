FROM ghcr.io/apollographql/router:v1.45.1@sha256:049af8959dbe9671efe8272133ae6b2be34a5242e395ef4c973d2a7158f0ce53

USER root

RUN apt-get update && apt-get install -y curl

USER router

COPY ./config/router.yaml /config/router.yaml

COPY ./rhai ./rhai

CMD ["--config", "/config/router.yaml"]
