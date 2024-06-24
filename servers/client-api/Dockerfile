FROM ghcr.io/apollographql/router:v1.49.1@sha256:15d3be157f71622b3405276f8af9483e0c17346628ca118356e16754db4f5727

USER root

RUN apt-get update && apt-get install -y curl

USER router

COPY ./config/router.yaml /config/router.yaml

COPY ./rhai ./rhai

CMD ["--config", "/config/router.yaml"]
