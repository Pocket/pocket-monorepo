# Typescript Logger

This repository contains code to quickly set up an unleash client with our logging library. This is basically a wrapper around the unleash client initializer, but it removes a little bit of boilerplate.

The bigger value proposition is that for development and testing, this library provides a mock client which can be bootstrapped with data for testing. Creating it requires a good amount of boilerplate code, so it removes the need for that in your test files.

## Usage Notes

The production client will initialize asynchronously and may not be ready immediately when the application is started. Consuming applications should ensure that feature flag values can fall back on sensible defaults.

## Mock Examples

See [tests](./src/index.spec.ts) for examples of using and seeding the mock client.
