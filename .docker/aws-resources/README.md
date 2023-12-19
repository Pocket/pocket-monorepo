# AWS Resources

All aws resources that we start up via localstack are stored here. Any service in our monorepo that needs to connect to something provided by AWS can be faked here via Localstack for testing or local development.

All `.sh` files will be executed on docker compose startup locally and inside integration tests, by localstack or circleci.

## Legacy Pocket

Files pre-fixed with legacy-pocket are resources that are not owned by any service in our Monorepo and existed before Pocket defined infrastructure as code.

## DynamoDB

Define the dynamodb tables as a json file in the `./dynamodb` folder and it will be auto-created by the root level dynamodb script. Prefix your dynamodb table with the service that owns it.

## Future Optimization

In the future we can optimize integration tests by only creating resources that the specific service needs.
