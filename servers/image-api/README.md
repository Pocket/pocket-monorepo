# Image API

Provides a graphql image type that provides basic image metadata and any requested cache urls.

## Local Development

### Setup your .env

Copy the .env.example to .env and update the image endpoint to the one you want to use.

### Startup

Run the following commands locally to start development.

```bash
npm ci
docker-compose up
```

Go to [http://localhost:4867/](http://localhost:4867/) and following the querying section

Note that this system uses docker because we need a local redis server for our underlying dataloader and caching.

## Querying

This api is only queryable as a subtype from any response on the Pocket Graph. It purposely does not have a top level query.

Given that, it is queryable during development using the following representation format.

```graphql
query {
  _entities(
    representations: {
      url: "https://s3.amazonaws.com/pocket-curatedcorpusapi-prod-images/fc2283a2-63d5-4c5c-995b-36bb5b054f47.jpeg"
      __typename: "Image"
    }
  ) {
    ... on Image {
      url
      width
      height
      cachedImages(
        imageOptions: [{ id: "image-id-test", width: 540, height: 12 }]
      ) {
        id
        url
        width
        height
      }
    }
  }
}
```
