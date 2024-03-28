# Lambda Secrets

This package is used to obtain a secret or parameter from the [Lambda Layer cache](https://aws.amazon.com/blogs/compute/using-the-aws-parameter-and-secrets-lambda-extension-to-cache-parameters-and-secrets/) when enabled.

## Secrets Manaager Usage

```typescript
import {fetchSecret} from '@pocket-tools/lambda-secrets';
const secret = fetchSecret('/Lambda/Super/Secret');
console.log(secret.superSecretValue);
```

This also assumes that the secret stored in Secrets Manager is a JSON based value, which it almost always is.

## Parameter Store Usage

```typescript
import {fetchParameter} from '@pocket-tools/lambda-secrets';
const parameter = fetchParameter('/Lambda/Super/SecretParameter');
console.log(parameter);
```
