# How to publish a new release

1. generate new docs
2. change example + version in `README.md`
3. create new Github Release
4. Update package in registry

# Generate Docs

```Bash
docker run --rm --volume "$(pwd):/terraform-docs" -u $(id -u) quay.io/terraform-docs/terraform-docs:0.16.0 markdown /terraform-docs > docs.md
```