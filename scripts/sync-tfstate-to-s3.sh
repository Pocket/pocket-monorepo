#!/bin/bash
# This script should be used as a one-off to pull the tfstate from Terraform Cloud and move it to S3 to migrate off of Terraform Cloud

# Check if at least one argument is provided
if [ $# -eq 0 ]; then
    # mozilla-pocket-team-prod-terraform-state if prod, mozilla-pocket-team-dev-terraform-state if dev
    echo "Usage: $0 <environment Dev or Prod> <s3 bucket>" 
    exit 1
fi

environment=$1
bucket=$2

workspacesToSync=(
"AccountDataDeleter"
"AccountDeleteMonitor"
"AnnotationsAPI"
"ClientAPI"
"FeatureFlags"
"FxAWebhookProxy"
"ImageAPI"
"ListAPI"
"ParserGraphQLWrapper"
"PocketEventBridge"
# Already in S3 before the move
# "SendGridData"
"ShareableListsAPI"
"SharedSnowplowConsumer"
"TransactionalEmails"
"UserAPI"
)

# Function to pull the state and then move it to a folder
pull_state() {
    name=$1
    put_here=$2
    # Really really lame workaround because the terraform cli doesn't allow selecting a workspace in an organization without a terraform object present.
    echo "terraform {
    backend \"remote\" {
        organization = \"Pocket\"
        hostname     = \"app.terraform.io\"
        workspaces {
        name = \"$name-$environment\"
        }
    }
    }" > main.tf
    rm -rf .terraform*
    terraform init
    terraform state pull > $name.tfstate
    mv $name.tfstate $put_here/
    rm -rf main.tf
    rm -rf .terraform*
}

push_state() {
    workspace=$1
    file=$2
    aws s3 cp $file s3://$bucket/$workspace --content-type "application/json"
}

stateFolder="states"
mkdir -p $stateFolder

for workspace in "${workspacesToSync[@]}"; do
    echo "Pulling $workspace"
    pull_state $workspace $stateFolder
done

for workspace in "${workspacesToSync[@]}"; do
    echo "Syncing to S3 $workspace"
    push_state $workspace "$stateFolder/$workspace.tfstate"
done

