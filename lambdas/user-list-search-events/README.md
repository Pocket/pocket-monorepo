# User List Search Events

For a given set of User List events, this service will push messages to SQS so that the User List Search Indexing Lambda will index the item in a Users List.

This replaces indexing a user's list from an outdated Kinesis Stream and replaces the UserListSearchKinesisToSQS lambdas.

NOTE: While we could remove sending this data to an SQS queue and do the indexing here, we do not because the SQS queues give us the ability to prioritize and parallelize indexing. For instance we have an SQS queue and lambda that only handles Premium Upgrade indexing so that real time user indexing is fast.