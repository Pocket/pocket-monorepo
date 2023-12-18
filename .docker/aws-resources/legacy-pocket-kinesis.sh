#!/bin/bash
set -x

STREAMS=('analytics.user_action' 'analytics.ab_test_track' 'analytics.user_track_adv' 'analytics.web_track' 'unified_event' 'raw_event' 'item_session' 'server-log-web-request' 'foxsec.access_log')

for stream in "${STREAMS[@]}"; do
  awslocal kinesis create-stream --stream-name "${stream}" --shard-count 3
done
set +x
