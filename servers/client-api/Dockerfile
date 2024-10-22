FROM ghcr.io/apollographql/router:v1.57.0@sha256:e74e50a2dd2048b3d05b5e226a3c1a09f5f9268f481d5848fd8a82722152de53

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
