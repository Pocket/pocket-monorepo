#!/bin/bash
set -x
bash "$(dirname "${BASH_SOURCE[0]}")/account-data-deleter.sh"
set +x