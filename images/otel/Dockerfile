FROM alpine:latest

COPY --from=otel/opentelemetry-collector-contrib:latest /otelcol-contrib /otelcol-contrib

COPY otel-collector-config.yaml /etc/otelcol-contrib/config.yaml
COPY entrypont.sh /entrypont.sh
RUN chmod a+x /entrypont.sh

ENV GOOGLE_APPLICATION_CREDENTIALS=/etc/otelcol-contrib/key.json
WORKDIR /

ENTRYPOINT [ "./entrypont.sh" ]

CMD [ "/otelcol-contrib", "--config", "/etc/otelcol-contrib/config.yaml" ]