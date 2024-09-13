#!/bin/bash
set -x

SQS=(
UserListSearch-Dev-UserListImport
UserListSearch-Dev-UserItemsUpdate
UserListSearch-Dev-UserItemsDelete
UserListSearch-Dev-UserItemsUpdateBackfill
UserListSearch-Dev-UserListImportBackfill
)

for sqs_queue in "${SQS[@]}"; do
  awslocal sqs create-queue --queue-name ${sqs_queue}
done

# Delete if exists
awslocal opensearch delete-domain --domain-name 'user-list-search' || true
awslocal opensearch create-domain --domain-name 'user-list-search' --domain-endpoint-options "{ \"CustomEndpoint\":\"http://localhost:4566/user-list-search\", \"CustomEndpointEnabled\": true }"


health="none"
tries=0

# we try 40 times with a 3 second sleep in-between - 120 seconds total
while [ $health != "green" -a $tries -lt 40 ]
do
  # curl the health check url and parse the json for the 'status' key
  # (jq is not installed in the app image for json parsing, but we've got python, so...)
  health=$(curl -sb -H "Accept: application/json" "http://localhost:4566/user-list-search/_cluster/health" | python3 -c "import sys, json; print(json.load(sys.stdin)['status'])")

  # initially, the health check url will return nothing. if so, default the
  # $health variable back to 'none'
  if [ "$health" == "" ]
  then
    echo "no status found in response. defaulting back to 'none'..."
    health="none"
  fi

  tries=$(( tries+1 ))
  sleep 3
done

corpus_langs=(
  en_luc
  de
  es
  fr
  it
)
# if we have a healthy cluster, create the index
if [ $health == "green" ]
then
  curl -vX PUT "http://localhost:4566/user-list-search/list" --header "Content-Type: application/json" -d @"$(dirname ${BASH_SOURCE[0]})/elasticsearch/esindex_list.json"
  echo "elasticsearch list index created!"
  sleep 1

  curl -vX PUT "http://localhost:4566/user-list-search/list/_settings" -H "Content-Type: application/json" -d @"$(dirname ${BASH_SOURCE[0]})/elasticsearch/slow-query-log-thresholds.json"
  echo "elasticsearch slow log thresholds set for list index!"
  sleep 1

  for lang in "${corpus_langs[@]}"; do
    curl -vX PUT "http://localhost:4566/user-list-search/corpus_${lang}" --header "Content-Type: application/json" -d @"$(dirname ${BASH_SOURCE[0]})/elasticsearch/esindex_corpus_${lang}.json"
    echo "elasticsearch corpus (${lang}) index created!"
    sleep 1

    curl -vX PUT "http://localhost:4566/user-list-search/corpus_${lang}/_settings" --header "Content-Type: application/json" -d @"$(dirname ${BASH_SOURCE[0]})/elasticsearch/slow-query-log-thresholds.json"
    echo "elasticsearch slow log thresholds set for corpus (${lang}) index!"
    sleep 1
  done

else
  echo "no healthy cluster found after 60 seconds. index not created. :("
fi


set +x






