FROM ghcr.io/apollographql/router:v1.58.0@sha256:91747e573d6b1574729b157073595af68dd4d63afde0af5f1e6752a235c281e5

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
