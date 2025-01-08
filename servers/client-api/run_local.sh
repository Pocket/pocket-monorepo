#!/bin/bash

# Export these values as environment variables
export CLOUD_PROVIDER="aws"
export CLOUD_PLATFORM="aws_ecs"
export CONTAINER_NAME=$(hostname) # or use ECS_CONTAINER_NAME
export CONTAINER_ID="abc-easy-as-123"
export AWS_ECS_CONTAINER_ARN="arn:aws:ecs:us-east-1:123456789012:container/1234567890123456789"
export AWS_ECS_CLUSTER_ARN="default"
export AWS_ECS_LAUNCHTYPE="fargate"
export AWS_ECS_TASK_ARN="arn:aws:ecs:us-east-1:123456789012:task/1234567890123456789"
export AWS_ECS_TASK_FAMILY="my-task-family"
export AWS_ECS_TASK_REVISION="1"
export CLOUD_ACCOUNT_ID="8675309"
export CLOUD_REGION="us-east-1"
export CLOUD_RESOURCE_ID="arn:aws:ecs:us-east-1:123456789012:container/1234567890123456789"
export CLOUD_AVAILABILITY_ZONE="us-east-1a"
export AWS_LOG_GROUP_NAMES="[my-log-group]"
export AWS_LOG_GROUP_ARNS="[arn:aws:logs:$ECS_REGION:$ECS_ACCOUNT_ID:log-group:$ECS_LOG_GROUP_NAME]"
export AWS_LOG_STREAM_NAMES="[$ECS_LOG_STREAM_NAME]"
export AWS_LOG_STREAM_ARNS="[arn:aws:logs:$ECS_REGION:$ECS_ACCOUNT_ID:log-group:$ECS_LOG_GROUP_NAME:log-stream:$ECS_LOG_STREAM_NAME]"

# You can also log or verify the metadata if needed
echo "CLOUD_PROVIDER=$CLOUD_PROVIDER"
echo "CLOUD_PLATFORM=$CLOUD_PLATFORM"
echo "CONTAINER_NAME=$CONTAINER_NAME"
echo "CONTAINER_ID=$CONTAINER_ID"
echo "AWS_ECS_CONTAINER_ARN=$AWS_ECS_CONTAINER_ARN"
echo "AWS_ECS_CLUSTER_ARN=$AWS_ECS_CLUSTER_ARN"
echo "AWS_ECS_LAUNCHTYPE=$AWS_ECS_LAUNCHTYPE"
echo "AWS_ECS_TASK_ARN=$AWS_ECS_TASK_ARN"
echo "AWS_ECS_TASK_FAMILY=$AWS_ECS_TASK_FAMILY"
echo "AWS_ECS_TASK_REVISION=$AWS_ECS_TASK_REVISION"
echo "CLOUD_ACCOUNT_ID=$CLOUD_ACCOUNT_ID"
echo "CLOUD_REGION=$CLOUD_REGION"
echo "CLOUD_RESOURCE_ID=$CLOUD_RESOURCE_ID"
echo "CLOUD_AVAILABILITY_ZONE=$CLOUD_AVAILABILITY_ZONE"
echo "AWS_LOG_GROUP_NAMES=$AWS_LOG_GROUP_NAMES"
echo "AWS_LOG_GROUP_ARNS=$AWS_LOG_GROUP_ARNS"
echo "AWS_LOG_STREAM_NAMES=$AWS_LOG_STREAM_NAMES"
echo "AWS_LOG_STREAM_ARNS=$AWS_LOG_STREAM_ARNS"

# Execute the original Apollo Router command passed as arguments
dotenvx run -- rover dev --supergraph-config ./config/supergraph.yaml --router-config ./config/router.yaml
