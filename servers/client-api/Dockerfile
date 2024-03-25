FROM ghcr.io/apollographql/router:v1.43.0@sha256:f9f7f01fb1db7c29e159f78093762110c328f840ce1b12f3401e953917a42fa3

USER root

RUN apt-get update && apt-get install -y curl

USER router

COPY ./config/router.yaml /config/router.yaml

COPY ./rhai ./rhai

CMD ["--config", "/config/router.yaml"]
