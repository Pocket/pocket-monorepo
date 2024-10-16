#!/bin/bash
set -x

SQS=(
pocket-account-data-delete-queue
pocket-list-export-queue
)

S3=(
com.getpocket.list-exports
)

for sqs_queue in "${SQS[@]}"; do
  awslocal sqs create-queue --queue-name "${sqs_queue}"
done

for s3_bucket in "${S3[@]}"; do
  awslocal s3 mb s3://"${s3_bucket}"
  awslocal s3api put-bucket-acl --bucket "${s3_bucket}" --acl public-read
done

bash "$(dirname "${BASH_SOURCE[0]}")/dynamodb.sh"
bash "$(dirname "${BASH_SOURCE[0]}")/eventbus.sh"

set +x
