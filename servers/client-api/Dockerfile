FROM ghcr.io/apollographql/router:v1.43.2@sha256:278e2a635f45c98c02586a2bf86e38fc8609c00ad9a642c294f3e20262167945

USER root

RUN apt-get update && apt-get install -y curl

USER router

COPY ./config/router.yaml /config/router.yaml

COPY ./rhai ./rhai

CMD ["--config", "/config/router.yaml"]
