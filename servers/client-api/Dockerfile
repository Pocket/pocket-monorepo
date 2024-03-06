FROM ghcr.io/apollographql/router:v1.40.2@sha256:86e9a3f4914482ed569c1ca1724b9ad5b26fa2337b1e6b95f5610eab32c58267

USER root

RUN apt-get update && apt-get install -y curl

USER router

COPY ./config/router.yaml /config/router.yaml

COPY ./rhai ./rhai

CMD ["--config", "/config/router.yaml"]
