import { config } from './config';
import { DataDeleterApp, DataDeleterAppConfig } from './dataDeleterApp';
import { BatchDeleteLambdaResources } from './lambda/batchDeleteLambdaResources';
import { EventLambda } from './lambda/eventLambda';

import { provider as archiveProvider } from '@cdktf/provider-archive';
import {
  provider as awsProvider,
  dataAwsCallerIdentity,
  dataAwsKmsAlias,
  dataAwsRegion,
  dataAwsSnsTopic,
} from '@cdktf/provider-aws';
import { S3Bucket } from '@cdktf/provider-aws/lib/s3-bucket';
import { S3BucketLifecycleConfiguration } from '@cdktf/provider-aws/lib/s3-bucket-lifecycle-configuration';
import { provider as localProvider } from '@cdktf/provider-local';
import { provider as nullProvider } from '@cdktf/provider-null';
import {
  ApplicationSQSQueue,
  ApplicationSqsSnsTopicSubscription,
  PocketVPC,
} from '@pocket-tools/terraform-modules';

import { App, S3Backend, TerraformStack } from 'cdktf';
import { Construct } from 'constructs';

class AccountDataDeleter extends TerraformStack {
  constructor(scope: Construct, name: string) {
    super(scope, name);

    new archiveProvider.ArchiveProvider(this, 'archive-provider');
    new awsProvider.AwsProvider(this, 'aws', {
      region: 'us-east-1',
      defaultTags: [{ tags: config.tags }],
    });
    new localProvider.LocalProvider(this, 'local-provider');
    new nullProvider.NullProvider(this, 'null-provider');

    new S3Backend(this, {
      bucket: `mozilla-pocket-team-${config.environment.toLowerCase()}-terraform-state`,
      dynamodbTable: `mozilla-pocket-team-${config.environment.toLowerCase()}-terraform-state`,
      key: config.name,
      region: 'us-east-1',
    });

    const caller = new dataAwsCallerIdentity.DataAwsCallerIdentity(
      this,
      'caller',
    );
    const region = new dataAwsRegion.DataAwsRegion(this, 'region');
    const pocketVpc = new PocketVPC(this, 'pocket-vpc');

    const batchDeleteQueue = new ApplicationSQSQueue(
      this,
      'batch-delete-consumer-queue',
      {
        name: config.envVars.sqsBatchDeleteQueueName,
        tags: config.tags,
        visibilityTimeoutSeconds: 10000,
        messageRetentionSeconds: 1209600, //14 days
        //need to set maxReceiveCount to enable DLQ
        maxReceiveCount: 3,
      },
    );

    const listExportQueue = new ApplicationSQSQueue(
      this,
      'list-export-consumer-queue',
      {
        name: config.envVars.listExportQueueName,
        tags: config.tags,
        visibilityTimeoutSeconds: 1800,
        messageRetentionSeconds: 1209600, //14 days
        //need to set maxReceiveCount to enable DLQ
        maxReceiveCount: 3,
      },
    );

    new ApplicationSqsSnsTopicSubscription(
      this,
      'list-events-sns-subscription',
      {
        name: `${config.envVars.listExportQueueName}-SNS`,
        snsTopicArn: `arn:aws:sns:${pocketVpc.region}:${pocketVpc.accountId}:${config.lambda.snsTopicName.listEvents}`,
        sqsQueue: listExportQueue.sqsQueue,
        filterPolicyScope: 'MessageBody',
        filterPolicy: JSON.stringify({
          'detail-type': ['list-export-requested'],
        }),
        tags: config.tags,
      },
    );

    // Bucket for exports plus auto-expiry rules
    const exportBucket = new S3Bucket(this, 'list-export-bucket', {
      bucket: `com.getpocket-${config.environment.toLowerCase()}.list-exports`,
      tags: config.tags,
    });
    const partsPrefix = 'parts';
    const archivesPrefix = 'archives';
    new S3BucketLifecycleConfiguration(
      this,
      'list-export-parts-lifecycle-rule',
      {
        bucket: exportBucket.bucket,
        rule: [
          {
            filter: {
              prefix: `${partsPrefix}/`,
            },
            id: 'list-export-part-15days-expire',
            status: 'Enabled',
            expiration: { days: 15 },
          },
          {
            filter: {
              prefix: `${archivesPrefix}/`,
            },
            id: 'list-export-archive-30days-expire',
            status: 'Enabled',
            expiration: { days: 30 },
          },
        ],
      },
    );

    const dataDeleterAppConfig: DataDeleterAppConfig = {
      region: region,
      caller: caller,
      secretsManagerKmsAlias: this.getSecretsManagerKmsAlias(),
      snsTopic: this.getCodeDeploySnsTopic(),
      batchDeleteQueue: batchDeleteQueue.sqsQueue,
      batchDeleteDLQ: batchDeleteQueue.deadLetterQueue,
      listExportQueue: listExportQueue.sqsQueue,
      listExportDLQ: listExportQueue.deadLetterQueue,
      listExportBucket: exportBucket.bucket,
      listExportPartsPrefix: partsPrefix,
      listExportArchivesPrefix: archivesPrefix,
    };
    new DataDeleterApp(this, 'data-deleter-app', dataDeleterAppConfig);

    // lambda stack to batch delete userIds
    new BatchDeleteLambdaResources(this, 'batchDeleteLambda', pocketVpc);

    // some other lambda stack
    new EventLambda(this, 'event-consumer', { vpc: pocketVpc });
  }

  /**
   * Get secrets manager kms alias
   * @private
   */
  private getSecretsManagerKmsAlias() {
    return new dataAwsKmsAlias.DataAwsKmsAlias(this, 'kms_alias', {
      name: 'alias/aws/secretsmanager',
    });
  }

  /**
   * Get the sns topic for code deploy
   * @private
   */
  private getCodeDeploySnsTopic() {
    return new dataAwsSnsTopic.DataAwsSnsTopic(this, 'backend_notifications', {
      name: `Backend-${config.environment}-ChatBot`,
    });
  }
}

const app = new App();
new AccountDataDeleter(app, config.constructName);
app.synth();
