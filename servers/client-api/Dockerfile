FROM ghcr.io/apollographql/router:v1.57.1@sha256:af0215b545be424a34e4a7bec24f2a47e850e52ffa0e93d001c64c863e87899a

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

CMD ["/dist/router_wrapper.sh", "--config", "/config/router.yaml"]
