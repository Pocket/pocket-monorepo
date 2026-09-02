FROM ghcr.io/apollographql/router:v1.61.13@sha256:638d2a337b89a33c95dd8adc7582965b0535de33afce12d2f9e6c4b1260caf24

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
