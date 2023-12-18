#!/bin/bash
set -x

S3=(
shareable-lists-api-local-images
)

for s3_bucket in "${S3[@]}"; do
  awslocal s3 mb s3://"${s3_bucket}"
  awslocal s3api put-bucket-acl --bucket "${s3_bucket}" --acl public-read
done

set +x