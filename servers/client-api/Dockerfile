FROM ghcr.io/apollographql/router:v1.46.0@sha256:4f1757f6bf42a717fc1338681f2a738fe9cd52dd6b4e1a8f6f5ef13406bc73ce

USER root

RUN apt-get update && apt-get install -y curl

USER router

COPY ./config/router.yaml /config/router.yaml

COPY ./rhai ./rhai

CMD ["--config", "/config/router.yaml"]
