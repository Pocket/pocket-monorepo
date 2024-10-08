#!/bin/sh
set -e
echo "$GOOGLE_APPLICATION_CREDENTIALS_JSON" > /etc/otelcol-contrib/key.json
nginx
exec "$@"