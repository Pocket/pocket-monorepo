# Pocket Monorepo

This repo contains all the Pocket Typescript systems built as a monorepo but deployed as microservices.

## What's inside?

This Turborepo includes the following packages/servers:

### Servers and Packages

- `servers`: a all our microservices, a point in time copy of our main repos right now.
- `eslint-config-custom`: `eslint` configurations (includes `eslint-config-next` and `eslint-config-prettier`)
- `tsconfig`: `tsconfig.json`s used throughout the monorepo

Each package/app is 100% [TypeScript](https://www.typescriptlang.org/).

### Utilities

This Turborepo has some additional tools already setup for you:

- [TypeScript](https://www.typescriptlang.org/) for static type checking
- [ESLint](https://eslint.org/) for code linting
- [Prettier](https://prettier.io) for code formatting

### Build

To build all apps and packages, run the following command:

```bash
cd pocket-monorepo
pnpm build
```

### Develop

To develop all apps and packages, run the following command:

```bash
cd pocket-monorepo
docker compose up --wait
pnpm dev
```

This will bring up the docker shared services (MySQL, Memcached, Redis) and then run all the apps in a dev mode.

## Useful Links

Learn more about the power of Turborepo:

- [Tasks](https://turbo.build/repo/docs/core-concepts/monorepos/running-tasks)
- [Caching](https://turbo.build/repo/docs/core-concepts/caching)
- [Remote Caching](https://turbo.build/repo/docs/core-concepts/remote-caching)
- [Filtering](https://turbo.build/repo/docs/core-concepts/monorepos/filtering)
- [Configuration Options](https://turbo.build/repo/docs/reference/configuration)
- [CLI Usage](https://turbo.build/repo/docs/reference/command-line-reference)
