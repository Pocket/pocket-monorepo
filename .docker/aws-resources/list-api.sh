#!/bin/bash
set -x
bash "$(dirname "${BASH_SOURCE[0]}")/eventbus.sh"
bash "$(dirname "${BASH_SOURCE[0]}")/legacy-pocket-firehose.sh"
bash "$(dirname "${BASH_SOURCE[0]}")/legacy-pocket-kinesis.sh"
bash "$(dirname "${BASH_SOURCE[0]}")/legacy-pocket-sqs.sh"

set +x