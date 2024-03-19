#!/bin/bash
# From https://github.com/CircleCI-Public/aws-ecs-orb/blob/master/src/scripts/update_bluegreen_service_via_task_def.sh
set -o noglob

# These variables are evaluated so the config file may contain and pass in environment variables to the parameters.
ORB_STR_CD_APP_NAME="$(circleci env subst "$ORB_STR_CD_APP_NAME")"
ORB_STR_CD_DEPLOY_GROUP_NAME="$(circleci env subst "$ORB_STR_CD_DEPLOY_GROUP_NAME")"
ORB_STR_CD_LOAD_BALANCED_CONTAINER_NAME="$(circleci env subst "$ORB_STR_CD_LOAD_BALANCED_CONTAINER_NAME")"
ORB_STR_CD_CAPACITY_PROVIDER_WEIGHT="$(circleci env subst "$ORB_STR_CD_CAPACITY_PROVIDER_WEIGHT")"
ORB_STR_CD_CAPACITY_PROVIDER_BASE="$(circleci env subst "$ORB_STR_CD_CAPACITY_PROVIDER_BASE")"
ORB_STR_CD_DEPLOYMENT_CONFIG_NAME="$(circleci env subst "$ORB_STR_CD_DEPLOYMENT_CONFIG_NAME")"
ORB_STR_PROFILE_NAME="$(circleci env subst "$ORB_STR_PROFILE_NAME")"

DEPLOYED_REVISION="${CCI_ORB_AWS_ECS_REGISTERED_TASK_DFN}"

if [ "$ORB_BOOL_ENABLE_CIRCUIT_BREAKER" == "1" ] && [ "$ORB_BOOL_VERIFY_REV_DEPLOY" == "0" ]; then
    echo "enable-circuit-breaker is set to true, but verify-revision-deploy is set to false.  verfiy-revision-deploy must be set to true to use enable-circuit-breaker."
    exit 1
fi

if [ -n "$ORB_STR_CD_CAPACITY_PROVIDER_NAME" ]; then 
    if [ -z "$ORB_STR_CD_CAPACITY_PROVIDER_WEIGHT" ] || [ -z "$ORB_STR_CD_CAPACITY_PROVIDER_BASE" ]; then 
        echo "Capacity Provider base and weight parameter must all be provided. Please try again"
        exit 1
    else 
        REVISION="{\"revisionType\": \"AppSpecContent\", \"appSpecContent\": {\"content\": \"{\\\"version\\\": 1, \\\"Resources\\\": [{\\\"TargetService\\\": {\\\"Type\\\": \\\"AWS::ECS::Service\\\", \\\"Properties\\\": {\\\"TaskDefinition\\\": \\\"${CCI_ORB_AWS_ECS_REGISTERED_TASK_DFN}\\\", \\\"LoadBalancerInfo\\\": {\\\"ContainerName\\\": \\\"$ORB_STR_CD_LOAD_BALANCED_CONTAINER_NAME\\\", \\\"ContainerPort\\\": $ORB_INT_CD_LOAD_BALANCED_CONTAINER_PORT},\\\"CapacityProviderStrategy\\\":[{\\\"CapacityProvider\\\":\\\"$ORB_STR_CD_CAPACITY_PROVIDER_NAME\\\", \\\"Base\\\":${ORB_STR_CD_CAPACITY_PROVIDER_BASE}, \\\"Weight\\\":${ORB_STR_CD_CAPACITY_PROVIDER_WEIGHT}}]}}}]}\"}}"
    fi
else
    REVISION="{\"revisionType\": \"AppSpecContent\", \"appSpecContent\": {\"content\": \"{\\\"version\\\": 1, \\\"Resources\\\": [{\\\"TargetService\\\": {\\\"Type\\\": \\\"AWS::ECS::Service\\\", \\\"Properties\\\": {\\\"TaskDefinition\\\": \\\"${CCI_ORB_AWS_ECS_REGISTERED_TASK_DFN}\\\", \\\"LoadBalancerInfo\\\": {\\\"ContainerName\\\": \\\"$ORB_STR_CD_LOAD_BALANCED_CONTAINER_NAME\\\", \\\"ContainerPort\\\": $ORB_INT_CD_LOAD_BALANCED_CONTAINER_PORT}}}}]}\"}}"
fi 

if [ -n "$ORB_STR_CD_DEPLOYMENT_CONFIG_NAME" ]; then
    set -- "$@" --deployment-config-name "${ORB_STR_CD_DEPLOYMENT_CONFIG_NAME}"
fi

DEPLOYMENT_ID=$(aws deploy create-deployment \
    --application-name "$ORB_STR_CD_APP_NAME" \
    --deployment-group-name "$ORB_STR_CD_DEPLOY_GROUP_NAME" \
    --profile "$ORB_STR_PROFILE_NAME" \
    --query deploymentId \
    --revision "${REVISION}" \
    "$@" \
    --output text)

echo "Created CodeDeploy deployment: $DEPLOYMENT_ID"

if [ "$ORB_BOOL_VERIFY_REV_DEPLOY" == "1" ]; then
    echo "Waiting for deployment to succeed."
    if aws deploy wait deployment-successful --deployment-id "${DEPLOYMENT_ID}" --profile "${ORB_STR_PROFILE_NAME}"; then
        echo "Deployment succeeded."
    elif [ "$ORB_BOOL_ENABLE_CIRCUIT_BREAKER" == "1" ]; then
        echo "Deployment failed. Rolling back."
        aws deploy stop-deployment --deployment-id "${DEPLOYMENT_ID}" --auto-rollback-enabled --profile "${ORB_STR_PROFILE_NAME}"
    else
        echo "Deployment failed. Exiting."
        exit 1
    fi
fi

echo "export CCI_ORB_AWS_ECS_DEPLOYED_REVISION='${DEPLOYED_REVISION}'" >> "$BASH_ENV"