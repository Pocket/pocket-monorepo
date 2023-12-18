#!/bin/bash
set -x

TABLE_DEFINITIONS=(
  'articles'
  'article_images'
  'content'
  'historic_slugs'
  'publishers'
)

for json_file in "${TABLE_DEFINITIONS[@]}"; do
  # start fresh and delete the table if it exists
  awslocal dynamodb delete-table --table-name ${json_file} || true
  awslocal dynamodb create-table --cli-input-json file://$(dirname "${BASH_SOURCE[0]}")/syndication-api-dynamodb/${json_file}.json
done

set +x