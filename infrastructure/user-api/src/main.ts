import { Construct } from 'constructs';
import { App, S3Backend, TerraformStack } from 'cdktf';
import { provider as awsProvider } from '@cdktf/provider-aws';
import { config } from './config/index.ts';
import { PocketVPC } from '@pocket-tools/terraform-modules';
import { provider as localProvider } from '@cdktf/provider-local';
import { provider as nullProvider } from '@cdktf/provider-null';
import * as fs from 'fs';

class UserAPI extends TerraformStack {
  constructor(scope: Construct, name: string) {
    super(scope, name);

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

    new PocketVPC(this, 'pocket-vpc');
  }
}

const app = new App();
const stack = new UserAPI(app, 'user-api');
const tfEnvVersion = fs.readFileSync('.terraform-version', 'utf8');
stack.addOverride('terraform.required_version', tfEnvVersion);
app.synth();
