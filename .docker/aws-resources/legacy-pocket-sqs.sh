#!/bin/bash
set -x

SQS=(
PermLib-Dev-UserMain
pocket-items-to-resolve
web-user-list-fix-queue-20191003
pocket-push-queue
pocket-notification-queue
pocket-push-feedback-queue
dev-push-feedback
web-hits-delivery-queue
web-data-migrations
dev-notification
dev-push
dev-push-feedback
dev-notification-step
dev-publisher-data
dev-sendgrid-logger
dev-sendgrid-email-send
dev-process-action
dev-stripe-events-proess
dev-tags-locale-process
dev-search-item
dev-generic
dev-search-item-update
dev-eoy-2014-setup
dev-action-process-queue
dev-posted-items-share
dev-convert-stf-to-notification
dev-recommended-action-processing
pocket-items-to-resolve
pocket-items-to-resolve-backfill
web-user-list-fix-queue-20191003
Web-Dev-Public-LongJobsQueue
Web-Dev-Public-Error-LongJobsQueue
PermLib-Dev-ItemMain
pocket-perm-library-item-main
pocket-premium-backfill-user-main
pocket-publisher-data-queue
PermLib-Local-ItemMain
pocket-list-delete-queue
)


for sqs_queue in "${SQS[@]}"; do
  awslocal sqs create-queue --queue-name "${sqs_queue}"
done

set +x
