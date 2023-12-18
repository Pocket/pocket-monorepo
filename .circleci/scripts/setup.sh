#!/bin/bash

set -e

dir=$(dirname "$0")
while [[ "$1" ]]; do
   case "$1" in
      --aws)
          "${dir}"/setup_aws.sh
          ;;
    esac
    shift
done
