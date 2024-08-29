FROM ghcr.io/apollographql/router:v1.53.0@sha256:cfa48711d26bcc7b0320c990f6bf9d135914e1ce34c93d7f2d6ccc5f8314ee1f

USER root

RUN apt-get update && apt-get install -y curl

USER router

COPY ./config/router.yaml /config/router.yaml

COPY ./rhai ./rhai

CMD ["--config", "/config/router.yaml"]
