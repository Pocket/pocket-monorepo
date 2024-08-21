## Workflows

This repository consists of the following workflows:

* `pull-request.yml` - Ran on every single Pull Request and performs basic checks of the whole repo like Linting and Unit Tests
* `status-checks.yml` - Triggered on completion of other workflows and is used as the singluar Github Required Status check, since Github does not support Requiring Workflows that are skipped based on path filtering. Note: IF you add a new workflow it must be added to this array to be part of the Github Checks
* `<service-name>.yml` - A workflow represnting a singluar service in the monorepo.

There are also the following re-usable workflows:

* `build-and-push-image.yml` - Used to either build & push a docker image to production/development or to just build on pull request
* `test-integrations.yml` - Used to run tests of a service against the `docker-compose.yml` environment.

And then there are composite Github Actions:

* `containerize` - Used to build a microservice into a docker image from our monorepo
* `install-pnpm-and-node` - Used to install PNPM and Node, and dependencies based on our `.nvmrc` and pnpm version in `package.json`

All of the re-usable workflows and actions can be used by other repositories in the Pocket organization.
