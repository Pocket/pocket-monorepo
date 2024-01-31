#!/usr/bin/env bash
# ./run_ecs_task.sh task_def commands
#
# task_def: one of - Backfill; ItemProcess; Apollo
# commands: a string of json-encoded array elements, e.g. '"npm", "run", "test"' (notice no [ or ])
#
# e.g.      ./run_ecs_task.sh Backfill '"npm", "run", "build"'

taskDefinition=$1
shift

case "$taskDefinition" in
	Backfill)
	;;
	ItemProcess)
	;;
	Apollo)
	;;
	*)
		echo "x unsupported task definition. try: Backfill; ItemProcess; Apollo"
		exit 1
	;;
esac


COMMAND=${1:-}

echo ecs run-task \
   --cluster UserListSearch-Prod --task-definition UserListSearch-Prod-"$taskDefinition" \
   --overrides "{ \"containerOverrides\": [ { \"name\": \"node\", \"command\": [$COMMAND]} ]}" \
   --network-configuration "awsvpcConfiguration={subnets=[subnet-610bdb3b, subnet-cc66bde0, subnet-b2a036fa,  subnet-d09eb8ec],securityGroups=[sg-0bab147168eae0b8d],assignPublicIp=ENABLED}" \
   --launch-type "FARGATE"
aws ecs run-task \
   --cluster UserListSearch-Prod --task-definition UserListSearch-Prod-"$taskDefinition" \
   --overrides "{ \"containerOverrides\": [ { \"name\": \"node\", \"command\": [$COMMAND]} ]}" \
   --network-configuration "awsvpcConfiguration={subnets=[subnet-610bdb3b, subnet-cc66bde0, subnet-b2a036fa,  subnet-d09eb8ec],securityGroups=[sg-0bab147168eae0b8d],assignPublicIp=ENABLED}" \
   --launch-type "FARGATE"
