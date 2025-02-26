SQS=(
pocket-shareablelist-export-queue
)

for sqs_queue in "${SQS[@]}"; do
  awslocal sqs create-queue --queue-name "${sqs_queue}"
done

#!/bin/bash
set -x
bash "$(dirname "${BASH_SOURCE[0]}")/eventbus.sh"

set +x