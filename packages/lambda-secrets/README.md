# Lambda Secrets

This package is used to obtain a secret from the [Lambda Layer cache](https://aws.amazon.com/blogs/compute/using-the-aws-parameter-and-secrets-lambda-extension-to-cache-parameters-and-secrets/) when enabled.

## Usage

```typescript
import {fetchSecret} from '@pocket-tools/lambda-secrets';
const secret = fetchSecret('/Lambda/Super/Secret');
console.log(secret.superSecretValue);
```

This also assumes that the secret stored in Secrets Manager is a JSON based value, which it almost always is.
