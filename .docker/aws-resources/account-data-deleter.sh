#!/bin/bash
set -x

SQS=(
pocket-account-data-delete-queue
pocket-export-request-queue
pocket-list-export-queue
pocket-annotations-export-queue
pocket-list-import-batch-queue
pocket-list-import-file-queue
)

S3=(
com.getpocket.list-exports
com.getpocket.list-imports
)

for sqs_queue in "${SQS[@]}"; do
  awslocal sqs create-queue --queue-name "${sqs_queue}"
done

for s3_bucket in "${S3[@]}"; do
  awslocal s3 mb s3://"${s3_bucket}"
  awslocal s3api put-bucket-acl --bucket "${s3_bucket}" --acl public-read
done

# lifecycle rule on list-exports
awslocal s3api put-bucket-lifecycle-configuration --bucket "com.getpocket.list-exports" --lifecycle-configuration "file://$(dirname "${BASH_SOURCE[0]}")/s3/export-lifecycle-configuration.json"

bash "$(dirname "${BASH_SOURCE[0]}")/dynamodb.sh"
bash "$(dirname "${BASH_SOURCE[0]}")/eventbus.sh"

set +x
