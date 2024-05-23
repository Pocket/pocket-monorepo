FROM ghcr.io/apollographql/router:v1.47.0@sha256:c74f914bd21d2eed8ac41d4407db3f895945c93398a9207e171c24e3ea700bba

USER root

RUN apt-get update && apt-get install -y curl

USER router

COPY ./config/router.yaml /config/router.yaml

COPY ./rhai ./rhai

CMD ["--config", "/config/router.yaml"]
