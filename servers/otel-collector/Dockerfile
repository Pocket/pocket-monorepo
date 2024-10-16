# Use an alpine image as our base image, this allows us to define our own entry point script and have access to sh or bash, which the otel image does not have
FROM alpine:3@sha256:beefdbd8a1da6d2915566fde36db9db0b524eb737fc57cd1367effd16dc0d06d
RUN apk add nginx curl

# Copy the otelcol-contrib binary from the official image
COPY --from=otel/opentelemetry-collector-contrib:0.111.0@sha256:a2a52e43c1a80aa94120ad78c2db68780eb90e6d11c8db5b3ce2f6a0cc6b5029 /otelcol-contrib /otelcol-contrib
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