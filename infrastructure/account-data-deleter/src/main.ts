import { config } from './config/index.ts';
import { DataDeleterApp, DataDeleterAppConfig } from './dataDeleterApp.ts';
import { BatchDeleteLambdaResources } from './lambda/batchDeleteLambdaResources.ts';
import { EventLambda } from './lambda/eventLambda.ts';

import { provider as archiveProvider } from '@cdktf/provider-archive';
import {
  provider as awsProvider,
  dataAwsCallerIdentity,
  dataAwsIamPolicyDocument,
  dataAwsKmsAlias,
  dataAwsRegion,
  dataAwsSnsTopic,
  s3Bucket,
  s3BucketLifecycleConfiguration,
  s3BucketNotification,
  snsTopicSubscription,
  sqsQueue,
  sqsQueuePolicy,
} from '@cdktf/provider-aws';

import { provider as localProvider } from '@cdktf/provider-local';
import { provider as nullProvider } from '@cdktf/provider-null';
import {
  ApplicationSQSQueue,
  ApplicationSqsSnsTopicsSubscription,
  PocketVPC,
  ApplicationDynamoDBTable,
  ApplicationDynamoDBTableCapacityMode,
  SnsSqsSubscriptionProps,
} from '@pocket-tools/terraform-modules';

import {
  App,
  S3Backend,
  TerraformResource,
  TerraformStack,
  Token,
} from 'cdktf';
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

    const exportStateDb = new ApplicationDynamoDBTable(
      this,
      'export-request-state',
      {
        tags: config.tags,
        prefix: `${config.shortName}-${config.environment}-Export-Request-State`,
        capacityMode: ApplicationDynamoDBTableCapacityMode.ON_DEMAND,
        preventDestroyTable: true,
        tableConfig: {
          pointInTimeRecovery: {
            enabled: true,
          },
          ttl: {
            enabled: true,
            attributeName: 'expiresAt',
          },
          hashKey: 'requestId',
          attribute: [
            {
              name: 'requestId',
              type: 'S',
            },
          ],
        },
      },
    );

    const exportRequestQueue = new ApplicationSQSQueue(
      this,
      'export-request-consumer-queue',
      {
        name: config.envVars.exportRequestQueueName,
        tags: config.tags,
        visibilityTimeoutSeconds: 1800,
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

    const annotationsExportQueue = new ApplicationSQSQueue(
      this,
      'annotations-export-consumer-queue',
      {
        name: config.envVars.annotationsExportQueueName,
        tags: config.tags,
        visibilityTimeoutSeconds: 1800,
        messageRetentionSeconds: 1209600, //14 days
        //need to set maxReceiveCount to enable DLQ
        maxReceiveCount: 3,
      },
    );

    this.exportTopicSubscriptions(
      exportRequestQueue.sqsQueue,
      {
        name: `${config.envVars.exportRequestQueueName}-SNS`,
        snsTopicArn: `arn:aws:sns:${pocketVpc.region}:${pocketVpc.accountId}:${config.lambda.snsTopicName.listEvents}`,
        filterPolicyScope: 'MessageBody',
        filterPolicy: JSON.stringify({
          'detail-type': ['list-export-requested'],
        }),
      },
      {
        name: `${config.envVars.exportRequestQueueName}-Status-SNS`,
        snsTopicArn: `arn:aws:sns:${pocketVpc.region}:${pocketVpc.accountId}:${config.lambda.snsTopicName.exportUpdateEvents}`,
        filterPolicyScope: 'MessageBody',
        filterPolicy: JSON.stringify({
          'detail-type': ['export-part-complete'],
        }),
      },
    );

    // Bucket for exports plus auto-expiry rules
    const exportBucket = new s3Bucket.S3Bucket(this, 'list-export-bucket', {
      bucket: `com.getpocket-${config.environment.toLowerCase()}.list-exports`,
      tags: config.tags,
    });
    const partsPrefix = 'parts';
    const archivesPrefix = 'archives';
    new s3BucketLifecycleConfiguration.S3BucketLifecycleConfiguration(
      this,
      'list-export-parts-lifecycle-rule',
      {
        bucket: exportBucket.bucket,
        rule: [
          {
            filter: {
              prefix: `${partsPrefix}/`,
            },
            id: 'list-export-part-10days-expire',
            status: 'Enabled',
            expiration: { days: 10 },
          },
          {
            filter: {
              prefix: `${archivesPrefix}/`,
            },
            id: 'list-export-archive-3days-expire',
            status: 'Enabled',
            expiration: { days: 3 },
          },
        ],
      },
    );

    // !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
    // NOTE  - This is click ops because we're running into circular import/dependency
    // issues when trying to grant assume role access to the task execution role,
    // to assume this user. And we also need to use a user (not a role) in order
    // to create more long-lived signed urls for user exports
    // see https://docs.aws.amazon.com/AmazonS3/latest/userguide/using-presigned-url.html#who-presigned-url
    // Create IAM user to generate a signedUrl which has up to 7 days
    // expiry (otherwise it's limited to the ssion token)
    // const signedUrlUser = new iamUser.IamUser(
    //   this,
    //   'export-signedurl-iam-user',
    //   {
    //     name: 'export-signedurl',
    //     tags: config.tags,
    //   },
    // );

    // // Allow the task role to assume the role for getting s3 signed urls
    // const s3GetPolicy = new dataAwsIamPolicyDocument.DataAwsIamPolicyDocument(
    //   this,
    //   's3-export-read',
    //   {
    //     statement: [
    //       {
    //         effect: 'Allow',
    //         actions: ['s3:GetObject'],
    //         resources: [`${exportBucket.arn}/*`],
    //       },
    //     ],
    //   },
    // );

    // new iamUserPolicy.IamUserPolicy(this, 'export-signedurl-policy', {
    //   name: 'export-signedurl-access-policy',
    //   user: signedUrlUser.name,
    //   policy: s3GetPolicy.json,
    // });
    // const accessKey = new iamAccessKey.IamAccessKey(this, 'signedurl-user', {
    //   user: signedUrlUser.name,
    // });
    // So instead we are going to clickops save this into secrets manager and retrieve
    // it via encrypted environment variables

    const listBatchImport = new ApplicationSQSQueue(
      this,
      'batch-import-queue',
      {
        name: config.envVars.listImportBatchQueue,
        tags: config.tags,
        visibilityTimeoutSeconds: 600,
        messageRetentionSeconds: 1209600, //14 days
        //need to set maxReceiveCount to enable DLQ
        maxReceiveCount: 3,
      },
    );

    const fileImportResources = this.createFileImportPipeline();

    const dataDeleterAppConfig: DataDeleterAppConfig = {
      region: region,
      caller: caller,
      secretsManagerKmsAlias: this.getSecretsManagerKmsAlias(),
      snsTopic: this.getCodeDeploySnsTopic(),
      batchDeleteQueue: batchDeleteQueue.sqsQueue,
      listExportQueue: listExportQueue.sqsQueue,
      exportRequestQueue: exportRequestQueue.sqsQueue,
      annotationsExportQueue: annotationsExportQueue.sqsQueue,
      exportStateDb: exportStateDb.dynamodb,
      listExportBucket: exportBucket,
      listExportPartsPrefix: partsPrefix,
      listExportArchivesPrefix: archivesPrefix,
      importFileQueue: fileImportResources.queue.sqsQueue,
      importBatchQueue: listBatchImport.sqsQueue,
      listImportBucket: fileImportResources.bucket,
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

  private exportTopicSubscriptions(
    forwardQueue: sqsQueue.SqsQueue,
    exportRequest: SnsSqsSubscriptionProps,
    exportStatus: SnsSqsSubscriptionProps,
  ) {
    const snsTopicDlq = new sqsQueue.SqsQueue(this, 'sns-topic-dql', {
      name: `${config.envVars.listExportQueueName}-SNS-Topic-DLQ`,
      tags: config.tags,
    });
    // Forward export requests to SQS from the list topic
    const requestSubscription = new snsTopicSubscription.SnsTopicSubscription(
      this,
      'sns-subscription',
      {
        topicArn: exportRequest.snsTopicArn,
        protocol: 'sqs',
        endpoint: forwardQueue.arn,
        redrivePolicy: JSON.stringify({
          deadLetterTargetArn: snsTopicDlq.arn,
        }),
        filterPolicy: exportRequest.filterPolicy,
        filterPolicyScope: exportRequest.filterPolicyScope,
        dependsOn: [snsTopicDlq],
      },
    );
    const statusSubscription = new snsTopicSubscription.SnsTopicSubscription(
      this,
      'sns-subscription-status',
      {
        topicArn: exportStatus.snsTopicArn,
        protocol: 'sqs',
        endpoint: forwardQueue.arn,
        redrivePolicy: JSON.stringify({
          deadLetterTargetArn: snsTopicDlq.arn,
        }),
        filterPolicy: exportStatus.filterPolicy,
        filterPolicyScope: exportStatus.filterPolicyScope,
        dependsOn: [snsTopicDlq],
      },
    );
    // Create policies for SNS to the SQS and DLQ
    // Can't use multiple ApplicationSqsSnsTopicSubsriptions because
    // the policy gets overridden/chosen randomly
    [
      { name: 'sns-sqs', resource: forwardQueue },
      { name: 'sns-dlq', resource: snsTopicDlq },
    ].forEach((queue) => {
      const policy = new dataAwsIamPolicyDocument.DataAwsIamPolicyDocument(
        this,
        `${queue.name}-policy-document`,
        {
          statement: [
            {
              effect: 'Allow',
              actions: ['sqs:SendMessage'],
              resources: [queue.resource.arn],
              principals: [
                {
                  identifiers: ['sns.amazonaws.com'],
                  type: 'Service',
                },
              ],
              condition: [
                {
                  test: 'ArnEquals',
                  variable: 'aws:SourceArn',
                  values: [exportRequest.snsTopicArn, exportStatus.snsTopicArn],
                },
              ],
            },
          ],
          dependsOn: [queue.resource] as TerraformResource[],
        },
      ).json;

      new sqsQueuePolicy.SqsQueuePolicy(this, `${queue.name}-policy`, {
        queueUrl: queue.resource.url,
        policy: policy,
      });
    });
    return [requestSubscription, statusSubscription];
  }

  /**
   * Create bucket for file imports, with notifications
   * on upload to an SQS queue
   */
  private createFileImportPipeline() {
    // Bucket for exports plus auto-expiry rules
    const importBucket = new s3Bucket.S3Bucket(this, 'list-import-bucket', {
      bucket: `com.getpocket-${config.environment.toLowerCase()}.list-imports`,
      tags: config.tags,
    });
    new s3BucketLifecycleConfiguration.S3BucketLifecycleConfiguration(
      this,
      'list-imports-lifecycle-rule',
      {
        bucket: importBucket.bucket,
        rule: [
          {
            id: 'list-import-file-7-days-expire',
            status: 'Enabled',
            expiration: { days: 7 },
          },
        ],
      },
    );
    const listImportQueue = new ApplicationSQSQueue(
      this,
      'list-import-file-queue',
      {
        name: config.envVars.listImportFileQueue,
        tags: config.tags,
        visibilityTimeoutSeconds: 1800,
        messageRetentionSeconds: 1209600, //14 days
        //need to set maxReceiveCount to enable DLQ
        maxReceiveCount: 3,
      },
    );
    const queuePolicy = new dataAwsIamPolicyDocument.DataAwsIamPolicyDocument(
      this,
      'enqueue-from-import-bucket',
      {
        statement: [
          {
            actions: ['sqs:SendMessage'],
            condition: [
              {
                test: 'ArnEquals',
                values: [importBucket.arn],
                variable: 'aws:SourceArn',
              },
            ],
            effect: 'Allow',
            principals: [
              {
                identifiers: ['*'],
                type: '*',
              },
            ],
            resources: [listImportQueue.sqsQueue.arn],
          },
        ],
      },
    );

    new sqsQueuePolicy.SqsQueuePolicy(
      this,
      'enqueue-from-import-bucket-policy-atttachment',
      {
        policy: Token.asString(queuePolicy.json),
        queueUrl: listImportQueue.sqsQueue.id,
      },
    );

    new s3BucketNotification.S3BucketNotification(this, 'bucket_notification', {
      bucket: importBucket.id,
      queue: [
        {
          events: ['s3:ObjectCreated:*'],
          queueArn: Token.asString(listImportQueue.sqsQueue.arn),
        },
      ],
    });
    return { bucket: importBucket, queue: listImportQueue };
  }
}

const app = new App();
new AccountDataDeleter(app, config.constructName);
app.synth();
