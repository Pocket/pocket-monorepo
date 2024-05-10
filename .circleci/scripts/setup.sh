#!/bin/bash

set -e

dir=$(dirname "$0")
while [[ "$1" ]]; do
   case "$1" in
      --db)
          "${dir}"/setup_db.sh
          ;;
      --aws=*)
          # Extract the value after '='
          "${dir}"/setup_aws.sh --scope="${1#*=}"
          ;;
    esac
    shift
done
