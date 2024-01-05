FROM ghcr.io/apollographql/router:v1.37.0

# Need root to install curl
USER root

RUN apt-get install -y --reinstall debian-archive-keyring && \
    apt-get update && \
   apt-get install -y curl

# Switch back to the router user
USER router

COPY ./config/router.yaml /config/router.yaml

COPY ./rhai ./rhai

CMD ["--config", "/config/router.yaml"]
