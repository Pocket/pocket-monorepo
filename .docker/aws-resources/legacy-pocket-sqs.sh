#!/bin/bash
set -x

SQS=(
pocket-notification-queue
pocket-items-to-resolve
pocket-items-to-resolve-backfill
pocket-publisher-data-queue
PermLib-UserMain
PermLib-ItemMain
pocket-list-delete-queue
fxa-events-queue
)


for sqs_queue in "${SQS[@]}"; do
  awslocal sqs create-queue --queue-name "${sqs_queue}"
done

set +x
