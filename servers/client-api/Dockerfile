FROM ghcr.io/apollographql/router:v1.43.1@sha256:5592df2ddf4224e448159539792a3b84cd685a4e72d739def397db8d14065d5f

USER root

RUN apt-get update && apt-get install -y curl

USER router

COPY ./config/router.yaml /config/router.yaml

COPY ./rhai ./rhai

CMD ["--config", "/config/router.yaml"]
