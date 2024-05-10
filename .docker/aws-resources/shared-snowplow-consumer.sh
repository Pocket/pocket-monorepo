#!/bin/bash
set -x

SQS=(
SharedSnowplowConsumer-Prod-SharedEventConsumer-Queue
SharedSnowplowConsumer-Prod-SharedEventConsumer-Queue-Deadletter
)

for sqs_queue in "${SQS[@]}"; do
  awslocal sqs create-queue --queue-name "${sqs_queue}"
done
bash "$(dirname "${BASH_SOURCE[0]}")/eventbus.sh"

set +x
