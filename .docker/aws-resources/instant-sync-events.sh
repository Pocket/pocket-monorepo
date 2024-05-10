#!/bin/bash
set -x
bash "$(dirname "${BASH_SOURCE[0]}")/push-server.sh"
bash "$(dirname "${BASH_SOURCE[0]}")/eventbus.sh"

set +x