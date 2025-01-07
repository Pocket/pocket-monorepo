FROM ghcr.io/apollographql/router:v1.59.0@sha256:b889013f3c8e94f15de7fc81001c6dd5cc166562404196bb94c4da33dba17622

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
