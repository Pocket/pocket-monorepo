#!/bin/sh

# Fetch ECS metadata
ECS_METADATA=$(curl -s ${ECS_CONTAINER_METADATA_URI_V4}/task)
echo "$ECS_METADATA"

# Extract specific values from the metadata (example)
# Note: For some reason we can't save the sed cleanup into a variable, so we just copy pasta it everywhere.
ECS_TASK_ARN=$(echo $ECS_METADATA | sed 's/\\/\\\\/g'| jq -r '.TaskARN')
ECS_CLUSTER=$(echo "$ECS_METADATA" | sed 's/\\/\\\\/g' | jq -r '.Cluster')
ECS_CONTAINER_ARN=$(echo "$ECS_METADATA"| sed 's/\\/\\\\/g' | jq -r '.Containers[0].ContainerARN')
ECS_ACCOUNT_ID=$(echo "$ECS_CONTAINER_ARN" | cut -d ':' -f5)
ECS_CONTAINER_NAME=$(echo "$ECS_METADATA" | sed 's/\\/\\\\/g' | jq -r '.Containers[0].Name')
ECS_CONTAINER_ID=$(echo "$ECS_METADATA"| sed 's/\\/\\\\/g' | jq -r '.Containers[0].DockerId')
ECS_LAUNCH_TYPE=$(echo "$ECS_METADATA" | sed 's/\\/\\\\/g'| jq -r '.LaunchType')
ECS_TASK_FAMILY=$(echo "$ECS_METADATA" | sed 's/\\/\\\\/g'| jq -r '.Family')
ECS_TASK_REVISION=$(echo "$ECS_METADATA" | sed 's/\\/\\\\/g'| jq -r '.Revision')
ECS_REGION=$(echo "$ECS_METADATA" | sed 's/\\/\\\\/g' | jq -r '.AvailabilityZone')
ECS_LOG_GROUP_NAME=$(echo "$ECS_METADATA" | sed 's/\\/\\\\/g' | jq -r '.Containers[0].LogOptions."awslogs-group"')
ECS_LOG_STREAM_NAME=$(echo "$ECS_METADATA"| sed 's/\\/\\\\/g' | jq -r '.Containers[0].LogOptions."awslogs-stream"')

# Export these values as environment variables
export CLOUD_PROVIDER="aws"
export CLOUD_PLATFORM="aws_ecs"
export CONTAINER_NAME=$(hostname) # or use ECS_CONTAINER_NAME
export CONTAINER_ID="$ECS_CONTAINER_ID"
export AWS_ECS_CONTAINER_ARN="$ECS_CONTAINER_ARN"
export AWS_ECS_CLUSTER_ARN="$ECS_CLUSTER"
export AWS_ECS_LAUNCHTYPE="$ECS_LAUNCH_TYPE"
export AWS_ECS_TASK_ARN="$ECS_TASK_ARN"
export AWS_ECS_TASK_FAMILY="$ECS_TASK_FAMILY"
export AWS_ECS_TASK_REVISION="$ECS_TASK_REVISION"
export CLOUD_ACCOUNT_ID="$ECS_ACCOUNT_ID"
export CLOUD_REGION="$ECS_REGION"
export CLOUD_RESOURCE_ID="$ECS_CONTAINER_ARN"
export CLOUD_AVAILABILITY_ZONE="$ECS_AVAILABILITY_ZONE"
export AWS_LOG_GROUP_NAMES="[$ECS_LOG_GROUP_NAME]"
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
exec "$@"
