#!/bin/bash
set -x
bash "$(dirname "${BASH_SOURCE[0]}")/dynamodb.sh"

set +x