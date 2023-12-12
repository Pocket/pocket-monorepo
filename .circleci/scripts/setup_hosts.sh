#!/bin/bash
set -e

# Add host entries to match local docker development names.

echo "Adding service hosts records"


declare -a arr=("redis")

for i in "${arr[@]}"; do
    echo 127.0.0.1 "$i" | sudo tee -a /etc/hosts
done

