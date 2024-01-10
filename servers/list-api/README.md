# list-api

This repo contains the GraphQL subgraph for viewing and managing a user's List in Pocket. It is part of the effort to migrate from a monolithic architecture to microservices.

## Important Note

This app is currently designed to run in the US/Central timezone. This is mostly due to the fact that the primary database used runs in the same timezone.

## Getting Started

- Copy `.env.example` and rename to `.env` file.
  - Add path to desired parser domain in `.env` file - this could be production, dev, or a local instance of the parser
- Run `docker-compose up`

### Running queries

This service requires auth. Being an Implementing Service (subgraph), it receives request headers from the Gateway. For the context of this service, the `userid` header is required to indicate an authenticated request.

So in order to test operations in this service using the GraphQL playground, the `userid` header **MUST** be set in the `HTTP_HEADERS` panel

```json
{
  "userid": "12345"
}
```

### Testing user item resolver on the Item entity

```graphql
query {
  _entities(representations: { id: "123", __typename: "User" }) {
    ... on User {
      savedItems {
        edges {
          node {
            id
          }
        }
      }
    }
  }
}
```

### Localstack setup

- to access localstack in aws-cli, setup the credentials and config files in the ~/.aws file for default profile.
- for test environment, make sure the access and secret keys are set as environment variables for the test.

### Run test suites

#### Unit tests

From the repo root

```
$ npm ci
$ npm run test
```

#### Functional/Integration tests

Currently our functional tests require a mysql database backend. This is included in the docker-compose.yml for deploying the app. In the future, we'll probably update to use a docker flow specific for testing.

```
$ docker-compose up
$ npm run test-integrations
$ docker-compose down
```

## Tutorials

### Adding a new batch processor for events

Due to rate limits on external services, sometimes it's necessary to batch up requests to these services. One example is our unified events kinesis stream, which consumes events emitted on every mutation (and sometimes more than one event -- e.g. adding a favorited item). Because of the large volume, the events are stored in an internal queue and processed on a schedule.

The pattern for implementing a new batch consumer service is as follows:

#### Update config/index.ts

Add any required configuration under the external service that will eventually consume the event data. See existing config file for an example for sending events to a kinesis stream. You should include any information necessary for the handler function, as well as the events that the batch processor should listen on.

#### Create a handler function

Create a handler function. This function will be invoked by the batch processor on an array of events. Your handler function should not interrupt the program on error, but should properly log failed events so that they could be recovered if needed. The handler function should be async, and should perform any data transformations necessary from the event payload.

#### Start a batch processor

A new instance of `EventBatchProcessor` must be created in `main.ts`. It should listen on the `ItemEventEmitter` instance that's passed into the graphql context. Once it is created, it will automatically start listening for events and sending them to the handler function on the specified schedule.
