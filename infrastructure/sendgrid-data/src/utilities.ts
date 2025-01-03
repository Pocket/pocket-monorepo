import { dataAwsSsmParameter } from '@cdktf/provider-aws';
import { config } from './config/index.ts';
import { Construct } from 'constructs';

export function getEnvVariableValues(scope: Construct) {
  const sentryDsn = new dataAwsSsmParameter.DataAwsSsmParameter(
    scope,
    'sentry-dsn',
    {
      name: `/${config.name}/${config.environment}/SENTRY_DSN`,
    },
  );

  return { sentryDsn: sentryDsn.value };
}
