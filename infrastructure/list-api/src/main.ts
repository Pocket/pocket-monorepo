import { provider as archiveProvider } from '@cdktf/provider-archive';
import { provider as awsProvider } from '@cdktf/provider-aws';
import { provider as localProvider } from '@cdktf/provider-local';
import { provider as nullProvider } from '@cdktf/provider-null';
import { Construct } from 'constructs';
import { App, S3Backend, TerraformStack } from 'cdktf';
import { config } from './config/index.ts';

class ListAPI extends TerraformStack {
  constructor(scope: Construct, name: string) {
    super(scope, name);

    new awsProvider.AwsProvider(this, 'aws', {
      region: 'us-east-1',
      defaultTags: [{ tags: config.tags }],
    });
    new nullProvider.NullProvider(this, 'null-provider');
    new localProvider.LocalProvider(this, 'local-provider');
    new archiveProvider.ArchiveProvider(this, 'archive-provider');

    new S3Backend(this, {
      bucket: `mozilla-pocket-team-${config.environment.toLowerCase()}-terraform-state`,
      dynamodbTable: `mozilla-pocket-team-${config.environment.toLowerCase()}-terraform-state`,
      key: config.name,
      region: 'us-east-1',
    });
  }
}

const app = new App();
new ListAPI(app, 'list-api');
app.synth();
