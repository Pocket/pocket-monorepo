#!/bin/bash
set -xe
# Script to convert a serverless v1 postgresql to serverless v2
# Steps from https://aws.amazon.com/blogs/database/upgrade-from-amazon-aurora-serverless-v1-to-v2-with-minimal-downtime/

DATABASE_IDENTIFIER=
GREEN_DATABASE_IDENTIFIER=featureflags-dev-green
SMALL_DATABASE_IDENTIFIER=featureflags-dev
ACCOUNT_ID=
REGION=us-east-1

# Set AWS_PAGER to an empty string to disable the pager
export AWS_PAGER=""

echo 'creating new replication param groups'
aws rds create-db-cluster-parameter-group \
 --db-cluster-parameter-group-name aurora-postgres-with-replication \
 --description 'Aurora Postgres 13 With Replication Enabled' \
 --db-parameter-group-family aurora-postgresql13 \
 --no-paginate

aws rds modify-db-cluster-parameter-group \
 --db-cluster-parameter-group-name aurora-postgres-with-replication \
 --parameters 'ParameterName=rds.logical_replication,ParameterValue=1,ApplyMethod=pending-reboot' \
 --no-paginate

echo 'attaching new param group'

aws rds modify-db-cluster \
 --db-cluster-identifier $DATABASE_IDENTIFIER \
 --db-cluster-parameter-group-name aurora-postgres-with-replication \
 --apply-immediately \
 --no-paginate

echo "According to Amazon there needs to be a more then 10 minute delay between these too operations, so we wait 15 minutes now to be safe."
sleep 900


echo 'mopdifiying to provisioned'
output=$(aws rds modify-db-cluster --db-cluster-identifier $DATABASE_IDENTIFIER --engine-mode provisioned --allow-engine-mode-change --db-cluster-instance-class db.r5.xlarge --apply-immediately --no-paginate )
PROVISIONED_INSTANCE_IDENTIFIER=$(echo $output | jq -r '.DBCluster.DBClusterMembers[0].DBInstanceIdentifier')

 aws rds wait db-instance-available \
 --db-instance-identifier $PROVISIONED_INSTANCE_IDENTIFIER \
 --no-paginate

aws rds wait db-cluster-available \
 --db-cluster-identifier $DATABASE_IDENTIFIER \
 --no-paginate

# # Execute the create-blue-green-deployment command
deployment_output=$(aws rds create-blue-green-deployment \
  --source arn:aws:rds:$REGION:$ACCOUNT_ID:cluster:$DATABASE_IDENTIFIER \
  --blue-green-deployment-name $GREEN_DATABASE_IDENTIFIER \
  --target-engine-version 16.1 \
  --target-db-cluster-parameter-group-name default.aurora-postgresql16 \
  --no-paginate)

# Extract the DB cluster identifier from the output
blue_green_deployment_id=$(echo $deployment_output | jq -r '.BlueGreenDeployment.BlueGreenDeploymentIdentifier')

# Function to check the status of the blue-green deployment
check_green_deployment_status() {
    blue_green_check=$(aws rds describe-blue-green-deployments --filters Name=blue-green-deployment-identifier,Values=$blue_green_deployment_id)
    status=$(echo $blue_green_check | jq -r '.BlueGreenDeployments[0].Status')
    echo "Deployment Status: $status"
}

# Wait for the blue-green deployment to be in a desired state (e.g., "available")
while true; do
    check_green_deployment_status
    if [ "$status" == "AVAILABLE" ]; then
        echo "Blue-Green Deployment Complete!"
        green_cluster_id=$(echo $blue_green_check | jq -r '.BlueGreenDeployments[0].Target' | sed "s/arn:aws:rds:$REGION:$ACCOUNT_ID:cluster://g")
        break
    fi
    sleep 30  # Adjust the sleep duration as needed
done

echo 'enabling v2 scaling'
aws rds modify-db-cluster \
 --db-cluster-identifier $green_cluster_id \
 --serverless-v2-scaling-configuration MinCapacity=4,MaxCapacity=32 \
 --no-paginate

echo 'creating v2 instance'
 aws rds create-db-instance \
 --db-instance-identifier $SMALL_DATABASE_IDENTIFIER-serverless \
 --db-instance-class db.serverless \
 --engine aurora-postgresql \
 --db-cluster-identifier $green_cluster_id \
 --no-paginate

aws rds wait db-instance-available \
 --db-instance-identifier $SMALL_DATABASE_IDENTIFIER-serverless \
 --no-paginate

echo 'failing green database over' 
aws rds failover-db-cluster \
 --db-cluster-identifier $green_cluster_id \
 --target-db-instance-identifier $SMALL_DATABASE_IDENTIFIER-serverless \
 --no-paginate

aws rds wait db-cluster-available \
 --db-cluster-identifier $green_cluster_id \
 --no-paginate

echo 'Go ahead and remove the first instance'
echo 'Ready! switch over in the console!'