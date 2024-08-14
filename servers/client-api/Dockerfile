FROM ghcr.io/apollographql/router:v1.52.0@sha256:7885ebd1270959680e94c5d15b9631a062335dfb6547d294f57023d898563be6

USER root

RUN apt-get update && apt-get install -y curl

USER router

COPY ./config/router.yaml /config/router.yaml

COPY ./rhai ./rhai

CMD ["--config", "/config/router.yaml"]
