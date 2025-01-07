# Use an alpine image as our base image, this allows us to define our own entry point script and have access to sh or bash, which the otel image does not have
FROM alpine:3
RUN apk add nginx curl

# Copy the otelcol-contrib binary from the official image
COPY --from=otel/opentelemetry-collector-contrib:0.116.1@sha256:d0ebf65280da2e1b1491d1b93648281afd353d4b9ea19160090303cec9a233bd /otelcol-contrib /otelcol-contrib
COPY otel-collector-config.yaml /etc/otelcol-contrib/config.yaml
COPY httpd.conf /etc/nginx/http.d/default.conf

COPY entrypoint.sh /entrypoint.sh
RUN chmod a+x /entrypoint.sh

#Set the ENV variable for the google credentials that will be used by the google cloud exporter and mounted via an environment variable that will be saved to this file via our entrypoint script
ENV GOOGLE_APPLICATION_CREDENTIALS=/etc/otelcol-contrib/key.json
WORKDIR /

ENTRYPOINT [ "./entrypoint.sh" ]

EXPOSE 3000

CMD [ "/otelcol-contrib", "--config", "/etc/otelcol-contrib/config.yaml" ]
