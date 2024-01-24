FROM ghcr.io/apollographql/router:v1.38.0@sha256:056a191a308bd1df33e35977835a45e62c699a7f22865eaf556d6e48260f3f32

USER root

RUN apt-get update && apt-get install -y curl

USER router

COPY ./config/router.yaml /config/router.yaml

COPY ./rhai ./rhai

CMD ["--config", "/config/router.yaml"]
