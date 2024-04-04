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
import { provider as localProvider } from '@cdktf/provider-local';
import { provider as nullProvider } from '@cdktf/provider-null';
import {
  provider as pagerdutyProvider,
  dataPagerdutyEscalationPolicy,
} from '@cdktf/provider-pagerduty';
import {
  ApplicationSQSQueue,
  PocketPagerDuty,
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
    new pagerdutyProvider.PagerdutyProvider(this, 'pagerduty-provider', {
      token: undefined,
    });

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
    const pagerDuty = this.createPagerDuty();
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

    const dataDeleterAppConfig: DataDeleterAppConfig = {
      pagerDuty: pagerDuty,
      region: region,
      caller: caller,
      secretsManagerKmsAlias: this.getSecretsManagerKmsAlias(),
      snsTopic: this.getCodeDeploySnsTopic(),
      batchDeleteQueue: batchDeleteQueue.sqsQueue,
      batchDeleteDLQ: batchDeleteQueue.deadLetterQueue,
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

  /**
   * Create PagerDuty service for alerts
   * @private
   */
  private createPagerDuty() {
    // don't create any pagerduty resources if in dev
    if (config.isDev) {
      return undefined;
    }

    const nonCriticalEscalationPolicyId =
      new dataPagerdutyEscalationPolicy.DataPagerdutyEscalationPolicy(
        this,
        'non_critical_escalation_policy',
        {
          name: 'Pocket On-Call: Default Non-Critical - Tier 2+ (Former Backend Temporary Holder)',
        },
      ).id;

    return new PocketPagerDuty(this, 'pagerduty', {
      prefix: config.prefix,
      service: {
        // This is a Tier 2 service and as such only raises non-critical alarms.
        criticalEscalationPolicyId: nonCriticalEscalationPolicyId,
        nonCriticalEscalationPolicyId: nonCriticalEscalationPolicyId,
      },
    });
  }
}

const app = new App();
new AccountDataDeleter(app, config.constructName);
app.synth();
