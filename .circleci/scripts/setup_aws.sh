#!/bin/bash
set -e

sudo apt-get update && sudo apt-get install -y python3-pip
pip3 install boto3 awscli-local awscli --no-build-isolation

# Default value for scope
scope=""
# Loop through the arguments
while [ "$#" -gt 0 ]; do
    case $1 in
        --scope=*)
            # Extract the value after '='
            scope="${1#*=}"
            ;;
    esac
    shift
done

script=".docker/aws-resources/${scope}.sh"

# Check if the script exists
if [ -f "$script" ]; then
    echo "Executing script: $script"
    # Execute the script
    bash "$script"
fi
