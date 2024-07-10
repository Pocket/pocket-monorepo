import { Construct } from 'constructs';
import { App, S3Backend, TerraformStack } from 'cdktf';
import { config } from './config';
import {
  ApplicationSQSQueue,
  PocketVPC,
} from '@pocket-tools/terraform-modules';
import { provider as awsProvider, dataAwsSnsTopic } from '@cdktf/provider-aws';
import { SqsLambda } from './sqsLambda';
import { provider as archiveProvider } from '@cdktf/provider-archive';
import { provider as nullProvider } from '@cdktf/provider-null';
import { provider as localProvider } from '@cdktf/provider-local';
import { ApiGateway } from './apiGateway';

class FxAWebhookProxy extends TerraformStack {
  constructor(scope: Construct, name: string) {
    super(scope, name);

    new awsProvider.AwsProvider(this, 'aws', {
      region: 'us-east-1',
      defaultTags: [{ tags: config.tags }],
    });
    new archiveProvider.ArchiveProvider(this, 'archive-provider');
    new nullProvider.NullProvider(this, 'null-provider');
    new localProvider.LocalProvider(this, 'local-provider');

    new S3Backend(this, {
      bucket: `mozilla-pocket-team-${config.environment.toLowerCase()}-terraform-state`,
      dynamodbTable: `mozilla-pocket-team-${config.environment.toLowerCase()}-terraform-state`,
      key: config.name,
      region: 'us-east-1',
    });

    const vpc = new PocketVPC(this, 'pocket-shared-vpc');

    const sqs = new ApplicationSQSQueue(this, 'sqs-queue', {
      name: `${config.prefix}-Queue`,
      maxReceiveCount: 3,
      visibilityTimeoutSeconds: 300,
      messageRetentionSeconds: 604800, // Set retention to 7 days in case we get a lot of events to process.. unlikely, but safer.
    });

    const alertSNSTopic = this.getSlackSnsTopic();

    new SqsLambda(this, 'proxy-lambda', vpc, sqs.sqsQueue, alertSNSTopic);
    new ApiGateway(this, 'apigateway-lambda', vpc, sqs.sqsQueue, alertSNSTopic);
  }

  /**
   * Get the sns topic for slack
   * @private
   */
  private getSlackSnsTopic() {
    return new dataAwsSnsTopic.DataAwsSnsTopic(this, 'backend_notifications', {
      name: `Backend-${config.environment}-ChatBot`,
    });
  }
}

const app = new App();
new FxAWebhookProxy(app, 'fxa-webhook-proxy');
app.synth();
