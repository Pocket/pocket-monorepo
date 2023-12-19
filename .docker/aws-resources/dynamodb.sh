#!/bin/bash
set -x

apt-get install jq -y

files=($(ls "$(dirname ${BASH_SOURCE[0]})/dynamodb/"))

for json_file_name in "${files[@]}"; do
  file_path=$(dirname "${BASH_SOURCE[0]}")/dynamodb/${json_file_name}
  table_name=$(jq -r '.TableName' "$file_path")
  # start fresh and delete the table if it exists
  awslocal dynamodb delete-table --table-name ${table_name} || true
  awslocal dynamodb create-table --cli-input-json file://$file_path
done

set +x