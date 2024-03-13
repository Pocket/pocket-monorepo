FROM ghcr.io/apollographql/router:v1.42.0@sha256:a39b87b6a90b248cb6ecc9c449e9cab4b6d837325e0c57f9adfa6d705b39a670

USER root

RUN apt-get update && apt-get install -y curl

USER router

COPY ./config/router.yaml /config/router.yaml

COPY ./rhai ./rhai

CMD ["--config", "/config/router.yaml"]
