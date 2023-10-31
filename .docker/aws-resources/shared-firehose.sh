#!/bin/bash
set -euo pipefail

STREAMS=('dev-user-action-to-braveheart')

for stream in "${STREAMS[@]}"; do
  awslocal firehose create-delivery-stream --delivery-stream-name "${stream}"
done
set +x