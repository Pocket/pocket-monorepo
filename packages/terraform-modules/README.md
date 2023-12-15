# terraform-modules

This is a collection of terraform typescript cdk modules
that @Pocket uses in various services.

## Why?

Our goals for this project are as follows:

- To have as little infrastructure code as possible in repos.
- To have as little *duplicated* infrastructure code as possible in repos.
- To provide reasonable defaults for our most common AWS services.
- To provide an as-simple-as-possible-while-still-configurable API to our most common AWS services by abstraction.

## Repository Structure

The bulk of the code for this repository is broken up into two folders:

- `/src/base`: Contains abstractions of AWS services, e.g. an ECS or Redis Cluster, or an SQS Queue
- `/src/pocket`: Contains higher level abstractions that are specific to Pocket's infrastructure, e.g. an ALB-backed application or our PagerDuty config

See the `README` file in each of these respective directories to learn more. (Coming soon.)

## Testing

### Snapshot Testing

Snapshot testing ensures that our components produce predictable output when synthesized.

When a snapshot test is first run, it generates a snapshot (in a `__snapshots__` directory) that is used to compare future synthesizing against a known, expected output. If a component changes, it's likely that the expected snapshot should change. If you are making a PR that changes a component, you should also update the related snapshot file. This can be done by running the test command with additional flags instructing Jest to re-build the snapshot based on the new state of the component:

`npm test -- -u`

The above will update any necessary snapshot files to be used on future test runs.

As you can infer from the above, snapshots do not test the actual infrastructure result of running the synthesized terraform, meaning components should be tested manually (see below) to ensure they are performing the expected tasks prior to writing snapshot tests.

### Testing in AWS

While snapshot testing is great for things like regressions, it doesn't actually tell us if the code we've provided (e.g. the configuration of a particular AWS service) can be built in AWS.

You can use the existing `example.ts` file to test the modules in this repo.

1. Install [tfenv](https://github.com/tfutils/tfenv)
2. Run `tfenv use` to ensure you are on the same terraform version this repo is built for (defined in `.terraform-version`).
3. Run `npm install`
4. Run `npm run build:dev`
5. `cd` into the generated `cdktf.out/stacks/acme-example` directory
6. Run `terraform init`
7. Run `terraform validate` to validate the generated JSON (debugging level 1)

To test against our infrastructure (debugging level 2):

1. Log into terraform `terraform login` if not already. You will be prompted to save an API token.
2. Run `$(maws)` and select the 👉dev👈 backend SSO role (triple check that you are in DEV)
3. Run `terraform plan`, alternately in repo root run `cdktf plan`
4. Check one more time that you are in the dev account
5. Check with your teammates that it's okay to blow up the dev infra, then run `terraform apply`, alternately in repo root run `cdktf apply`
6. Clean up your mess by running `terraform destroy` when you're all done, alternately in repo root run `cdktf destroy`

Note that this isn't a full end-to-end verification, and will hang on domain certificate steps, but the above should surface most generated terraform issues.

### Testing in Dependent Repos

Sometimes it is useful to develop the module while consuming it in another repo.

1. Run `npm link` in the root of this repo
2. In the consumer repo run `npm link @pocket-tools/terraform-modules`
3. In this repo run `npm run watch`
4. Profit in the consumer repo - meaning, test deploying your application to AWS (probably in the dev account)

When you are done be sure to:
1. `npm unlink` in this repo
2. `npm unlink @pocket-tools/terraform-modules` in the consuming repo
