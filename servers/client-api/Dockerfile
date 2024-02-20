FROM ghcr.io/apollographql/router:v1.40.1@sha256:bbbdc1f8aa5ef1710c2906f0416e0d90c385060587c82c8957b88a29d67cf044

USER root

RUN apt-get update && apt-get install -y curl

USER router

COPY ./config/router.yaml /config/router.yaml

COPY ./rhai ./rhai

CMD ["--config", "/config/router.yaml"]
