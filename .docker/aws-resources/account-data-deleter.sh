#!/bin/bash
set -x

SQS=(
pocket-account-data-delete-queue
)

for sqs_queue in "${SQS[@]}"; do
  awslocal sqs create-queue --queue-name "${sqs_queue}"
done

bash "$(dirname "${BASH_SOURCE[0]}")/dynamodb.sh"
bash "$(dirname "${BASH_SOURCE[0]}")/eventbus.sh"

set +x