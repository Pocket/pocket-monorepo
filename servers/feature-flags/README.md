# Feature Flags

This is a modified implementation of Unleash Server where we add an Apollo GraphQL Server that can provide direct Unleash assignments. Authentication for the admin interface is also modified to authenticate against Amazon Cognito.

## Directory Structure

### [Admin](./src/admin)

This contains authentication middleware that will only allow a user to access the admin interface or API if they are authenticated behind AWS Cognito. Authentication is handled by the Amazon LoadBalancer and checking for a Cognito session and JWT in the user's cookies.

### [GraphQL](./src/graphql)

This contains an Apollo Server middleware that is attached to the Unleash Server and provides a standard Apollo GraphQL Server at `/graphql`. The folder also contains the necessary resolvers and the schema is defined at [schema.graphql](./schema.graphql).

This utilizes an [Unleash Node Client](https://github.com/Unleash/unleash-client-node) that is created in [unleashClient](./src/unleashClient)

### [Unleash Client](./src/unleashClient)

This contains a modified [Unleash Node Client](https://github.com/Unleash/unleash-client-node) that is available by calling `getUnleashClient`.

The client that exists here differs from a standard client because it is initialized with a modified FeatureToggle store that will hit the unleash server database instead of hitting an API endpoint.

*Note:* The special version of the FeatureToggle store we created polls the database every minute. Because of this it can take up to a minute after a flag has been added in the interface before it shows up in the graphql response.

## Local Development

The repository is setup to be run locally via Docker. You can start the repository with `docker-compose up`. Shortly after it will be available at [http://localhost:4242](http://localhost:4242)

When developing locally with docker, a few things to note:

* On any file save the unleash server will restart to pick up your change
* Admin Authentication is bypassed
* An apollo graphql editor is available at [http://localhost:4242/graphql](http://localhost:4242/graphql)

Sample query you can use at [http://localhost:4242/graphql](http://localhost:4242/graphql)

```graphql
query {
  getUnleashAssignments(context: {sessionId: "123"}) {
    assignments {
      assigned
      name
     payload
    }
  }
}
```

### Node Version

When developing locally, we use a `.nvmrc` file combined with [nvm](https://github.com/nvm-sh/nvm) to ensure we all use the correct node version.

To use the `.nvmrc` install nvm via their [instructions](https://github.com/nvm-sh/nvm#install--update-script) and then in the root directory of the project run `nvm use`. If you don't have the right version installed locally you will need to run `nvm install` first. Those commands will automatically read the `.nvmrc` file and use/install the correct version accordingly.

## Adding Custom Activation Strategies to GraphQL

Sometimes the need arises for a custom activation strategy that Unleash does not provide. For instance, releasing by locale. For the most part it is done by following the standard [unleash client docs](https://github.com/Unleash/unleash-client-node#custom-strategies) but a few extra steps do need to be taken.

1. In the Unleash Client directory create a custom strategy per [the docs](https://github.com/Unleash/unleash-client-node#1-implement-the-custom-strategy)
2. Register the custom strategy in [index.ts](./src/unleashClient/index.ts) per [the docs](https://github.com/Unleash/unleash-client-node#2-register-your-custom-strategy)
3. If your strategy requires a new input from Clients

    a. Add the new input as optional to [schema.gql](./schema.graphql) under `UnleashProperties`

    b. Add the new input as optional to [typeDefs.ts](./src/graphql/typeDefs.ts) under `UnleashProperties`

    c. In `getAssignments` in [resolvers.ts](./src/graphql/resolvers.ts) add in default values if needed.

    d. Profit
