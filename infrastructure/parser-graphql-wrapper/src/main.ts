import { config } from './config/index.ts';
import { provider as archiveProvider } from '@cdktf/provider-archive';
import { provider as awsProvider } from '@cdktf/provider-aws';
import { provider as localProvider } from '@cdktf/provider-local';
import { provider as nullProvider } from '@cdktf/provider-null';
import { Construct } from 'constructs';
import { App, S3Backend, TerraformStack } from 'cdktf';
import * as fs from 'fs';

class ParserGraphQLWrapper extends TerraformStack {
  constructor(scope: Construct, name: string) {
    super(scope, name);

    new archiveProvider.ArchiveProvider(this, 'archive_provider');
    new awsProvider.AwsProvider(this, 'aws', { region: 'us-east-1' });
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
const stack = new ParserGraphQLWrapper(app, 'parser-graphql-wrapper');
const tfEnvVersion = fs.readFileSync('.terraform-version', 'utf8');
stack.addOverride('terraform.required_version', tfEnvVersion);
app.synth();
