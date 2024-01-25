# Pocket Monorepo

This repo contains all the Pocket Typescript systems built as a monorepo but deployed as microservices. For services that power Recomendations or Pocket Curated Content see the [Content Monorepo](https://github.com/pocket/content-monorepo)

## What's inside?

This Repo includes the following packages/servers:

### Folder structure

- `servers`: all our typescript microservices required for running baseline Pocket.
- `lambdas`: all our lambda listeners that are made up of SQS Queue processers or API Gateways
- `infrastructure`: all of the terraform infrastructure that is used to deploy each microservice
- `packages/eslint-config-custom`: `eslint` configurations
- `packages/tsconfig`: `tsconfig.json`s used throughout the monorepo
- `packages/apollo-utils`: holds helpers for all services that boot up graphql. It also includes tracing libraries and hoists apollo in node-modules so that we do not have to keep defining apollo in all services.
- `packages/ts-logger`: helper library to add json structured logging to all our services.
- `packages/tracing`: helper library to add tracing to all our services.
- `packags/terraform-modules`: a set of modules built for Pocket based on the Terraform CDK, used to deploy our infrastructure.
- `.docker/aws-resources`: all aws resources that are used by the monorepo, if something is used here, but owned by a service not in this repository, it resides in the legacy files, otherwise each service will have its own script or prefixed resources.
- `.docker/mysql-8-resources`: all mysql resources, prefixed with a number letter system so that docker executes database creation in a specific order. All services share a single docker server, but have their own databases unless they read from our legacy (mono) database.
- `.docker/postgres-resources`: similar to mysql but for services that use postgres.

Each package/app is 100% [TypeScript](https://www.typescriptlang.org/).

### Utilities

This Turborepo has some additional tools already setup for you:

- [TypeScript](https://www.typescriptlang.org/) for static type checking
- [ESLint](https://eslint.org/) for code linting
- [Prettier](https://prettier.io) for code formatting

## Using the Repo

To build all apps and packages, run the following command:

```bash
cd pocket-monorepo
pnpm build
```

### Develop

#### All

To develop all apps and packages, run the following commands:

```bash
cp .env.example .env
cd pocket-monorepo
docker compose up --wait
pnpm dev
```

This will bring up the docker shared services (MySQL, Memcached, Redis) and then run all the apps in a dev mode.

#### Specific Server

To run a specific server, run the following:

```bash
cp .env.example .env
cd pocket-monorepo
docker compose up --wait
pnpm dev --filter=annotations-api...
```

Where annotations-api is the server name from package.json you want to run. `...` prefixed informs turborepo to include all dependent workspace packages.

You can expand this to run multiple specific servers as well like:
```pnpm run dev --filter=list-api... --filter=feature-flags...```

### Testing

### Updating Packages

To update packages this repository uses Renovate on a pr by pr basis and you can initiate that [here](https://github.com/Pocket/pocket-monorepo/issues/7)

In some cases it may be easier to update packages locally, like updating all development depencies at once.

To select and update *development* dependencices, interactively you can use the following command ran at the root of the repository.

```bash
pnpm update -iDLr
```

To select and update *production* and *optional* dependencices, interactively you can use the following command ran at the root of the repository.

```bash
pnpm update -iPLr
```

## Useful Links

Learn more about the power of Turborepo:

- [Tasks](https://turbo.build/repo/docs/core-concepts/monorepos/running-tasks)
- [Caching](https://turbo.build/repo/docs/core-concepts/caching)
- [Remote Caching](https://turbo.build/repo/docs/core-concepts/remote-caching)
- [Filtering](https://turbo.build/repo/docs/core-concepts/monorepos/filtering)
- [Configuration Options](https://turbo.build/repo/docs/reference/configuration)
- [CLI Usage](https://turbo.build/repo/docs/reference/command-line-reference)
