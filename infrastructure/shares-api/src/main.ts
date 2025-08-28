import { Construct } from 'constructs';
import { App, S3Backend, TerraformStack } from 'cdktf';
import {
  provider as awsProvider,
  dataAwsCallerIdentity,
  dataAwsRegion,
} from '@cdktf/provider-aws';
import { provider as localProvider } from '@cdktf/provider-local';
import { provider as nullProvider } from '@cdktf/provider-null';
import { provider as archiveProvider } from '@cdktf/provider-archive';
import { config } from './config/index.ts';
import { PocketVPC } from '@pocket-tools/terraform-modules';
import { DynamoDB } from './dynamodb.ts';

class SharesAPI extends TerraformStack {
  constructor(scope: Construct, name: string) {
    super(scope, name);

    new awsProvider.AwsProvider(this, 'aws', {
      region: 'us-east-1',
      defaultTags: [{ tags: config.tags }],
    });
    new localProvider.LocalProvider(this, 'local_provider');
    new nullProvider.NullProvider(this, 'null_provider');
    new archiveProvider.ArchiveProvider(this, 'archive-provider');

    new S3Backend(this, {
      bucket: `mozilla-pocket-team-${config.environment.toLowerCase()}-terraform-state`,
      dynamodbTable: `mozilla-pocket-team-${config.environment.toLowerCase()}-terraform-state`,
      key: config.name,
      region: 'us-east-1',
    });

    new dataAwsRegion.DataAwsRegion(this, 'region');
    new dataAwsCallerIdentity.DataAwsCallerIdentity(this, 'caller');
    new PocketVPC(this, 'pocket-vpc');
    new DynamoDB(this, 'dynamodb');
  }
}

const app = new App();
new SharesAPI(app, 'shares-api');
app.synth();
