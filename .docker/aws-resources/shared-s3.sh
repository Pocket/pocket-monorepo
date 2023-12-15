#!/bin/bash
set -x

S3=('pocket-syndicated-images-dev' 'pocket-publisher-assets' 'pocket-developer-assets' 'pocket-profile-images' 'pocketusercache.com' 'pocket-web-prod-datamigrations' 'pocket-syndicated-publisher-images-dev')

for s3_bucket in "${S3[@]}"; do
  awslocal s3 mb s3://"${s3_bucket}"
  awslocal s3api put-bucket-acl --bucket "${s3_bucket}" --acl public-read
done

set +x
