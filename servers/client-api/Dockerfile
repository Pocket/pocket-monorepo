FROM ghcr.io/apollographql/router:v1.37.0@sha256:4a4da934358f3ecb348ee0f21c47bc22457c77699688857ba6a5d22f8025180d

USER root

RUN apt-get update && apt-get install -y curl

USER router

COPY ./config/router.yaml /config/router.yaml

COPY ./rhai ./rhai

CMD ["--config", "/config/router.yaml"]
