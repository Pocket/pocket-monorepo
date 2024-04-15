FROM ghcr.io/apollographql/router:v1.44.0@sha256:e298b698078c31e988dfe2328adb67c75d57d0a66f8a4cf194c573cf55d0edea

USER root

RUN apt-get update && apt-get install -y curl

USER router

COPY ./config/router.yaml /config/router.yaml

COPY ./rhai ./rhai

CMD ["--config", "/config/router.yaml"]
