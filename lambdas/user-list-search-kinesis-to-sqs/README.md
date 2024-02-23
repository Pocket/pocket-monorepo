# User List Search Kinesis to SQS

This lambda translates data from the [Pocket Unified Event Stream](https://github.com/Pocket/spec/tree/main/unified-event-stream) to various SQS queues depending on the type of list action performed to index it for premium search.

TODO: We should deprecate this to take data from the Pocket Event Bridge and process list events for Search from that. (See User List Search Events lambda)
