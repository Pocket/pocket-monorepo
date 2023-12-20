 #!/bin/bash
set -x

awslocal events create-event-bus --name PocketEventBridge-Shared-Event-Bus