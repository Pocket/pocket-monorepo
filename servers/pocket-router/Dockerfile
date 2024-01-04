FROM ghcr.io/apollographql/router:v1.36.0

COPY ./config/router.yaml /config/router.yaml

COPY ./rhai ./rhai

CMD ["--config", "/config/router.yaml"]
