import { config } from './config/index.ts';

import { provider as archiveProvider } from '@cdktf/provider-archive';
import { provider as awsProvider } from '@cdktf/provider-aws';

import { provider as localProvider } from '@cdktf/provider-local';
import { provider as nullProvider } from '@cdktf/provider-null';
import { App, S3Backend, TerraformStack } from 'cdktf';
import { Construct } from 'constructs';

class AccountDeleteMonitor extends TerraformStack {
  constructor(
    scope: Construct,
    private name: string,
  ) {
    super(scope, name);

    new archiveProvider.ArchiveProvider(this, 'archive_provider');
    new awsProvider.AwsProvider(this, 'aws', {
      region: 'us-east-1',
      defaultTags: [{ tags: config.tags }],
    });
    new localProvider.LocalProvider(this, 'local_provider');
    new nullProvider.NullProvider(this, 'null_provider');

    new S3Backend(this, {
      bucket: `mozilla-pocket-team-${config.environment.toLowerCase()}-terraform-state`,
      dynamodbTable: `mozilla-pocket-team-${config.environment.toLowerCase()}-terraform-state`,
      key: config.name,
      region: 'us-east-1',
    });
  }
}

const app = new App();
new AccountDeleteMonitor(app, 'account-delete-monitor');
app.synth();
