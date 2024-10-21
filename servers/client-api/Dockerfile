FROM ghcr.io/apollographql/router:v1.56.0@sha256:b6a69cb14c73d890e32a5ab3c47508d322b1c69afdce9bce61cb7aed6f43b4ed

USER root

RUN apt-get update && apt-get install -y curl jq gawk

# Copy the entrypoint script into the container
COPY entrypoint.sh /usr/local/bin/entrypoint.sh

# Make sure the entrypoint script has executable permissions
RUN chmod a+x /usr/local/bin/entrypoint.sh

USER router

COPY ./config/router.yaml /config/router.yaml

COPY ./rhai ./rhai

# Set the entrypoint to the script
ENTRYPOINT ["/usr/local/bin/entrypoint.sh"]

CMD ["--config", "/config/router.yaml"]
