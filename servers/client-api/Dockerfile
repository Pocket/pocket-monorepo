FROM ghcr.io/apollographql/router:v1.48.0@sha256:d48614def2adc2e8c6eb516bd2180a4d8cfa53c8e4e75cf88cc254742b3d4ea8

USER root

RUN apt-get update && apt-get install -y curl

USER router

COPY ./config/router.yaml /config/router.yaml

COPY ./rhai ./rhai

CMD ["--config", "/config/router.yaml"]
