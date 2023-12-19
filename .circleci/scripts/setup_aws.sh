#!/bin/bash
set -e

sudo apt-get update && sudo apt-get install -y python3-pip
pip3 install boto3 awscli-local awscli --no-build-isolation


for Script in .docker/aws-resources/*.sh ; do
    bash "$Script"
done