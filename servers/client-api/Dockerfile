FROM ghcr.io/apollographql/router:v1.50.0@sha256:59aef3beaf6c8839c12ed5284ac20cdfb510f311d293a40d6fb373deec093cda

USER root

RUN apt-get update && apt-get install -y curl

USER router

COPY ./config/router.yaml /config/router.yaml

COPY ./rhai ./rhai

CMD ["--config", "/config/router.yaml"]
