import { config } from './config';
import { DataDeleterApp, DataDeleterAppConfig } from './dataDeleterApp';
import { BatchDeleteLambdaResources } from './lambda/batchDeleteLambdaResources';
import { EventLambda } from './lambda/eventLambda';

import { ArchiveProvider } from '@cdktf/provider-archive/lib/provider';
import { AwsProvider } from '@cdktf/provider-aws/lib/provider';
import { DataAwsCallerIdentity } from '@cdktf/provider-aws/lib/data-aws-caller-identity';
import { DataAwsKmsAlias } from '@cdktf/provider-aws/lib/data-aws-kms-alias';
import { DataAwsRegion } from '@cdktf/provider-aws/lib/data-aws-region';
import { DataAwsSnsTopic } from '@cdktf/provider-aws/lib/data-aws-sns-topic';
import { LocalProvider } from '@cdktf/provider-local/lib/provider';
import { NullProvider } from '@cdktf/provider-null/lib/provider';
import { PagerdutyProvider } from '@cdktf/provider-pagerduty/lib/provider';
import {
  ApplicationSQSQueue,
  PocketPagerDuty,
  PocketVPC,
} from '@pocket-tools/terraform-modules';

import {
  App,
  DataTerraformRemoteState,
  S3Backend,
  TerraformStack,
} from 'cdktf';
import { Construct } from 'constructs';

class AccountDataDeleter extends TerraformStack {
  constructor(scope: Construct, name: string) {
    super(scope, name);

    new ArchiveProvider(this, 'archive-provider');
    new AwsProvider(this, 'aws', { region: 'us-east-1' });
    new LocalProvider(this, 'local-provider');
    new NullProvider(this, 'null-provider');
    new PagerdutyProvider(this, 'pagerduty-provider', { token: undefined });

    new S3Backend(this, {
      bucket: `mozilla-pocket-team-${config.environment.toLowerCase()}-terraform-state`,
      dynamodbTable: `mozilla-pocket-team-${config.environment.toLowerCase()}-terraform-state`,
      key: config.name,
      region: 'us-east-1',
    });

    const caller = new DataAwsCallerIdentity(this, 'caller');
    const region = new DataAwsRegion(this, 'region');
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
    return new DataAwsKmsAlias(this, 'kms_alias', {
      name: 'alias/aws/secretsmanager',
    });
  }

  /**
   * Get the sns topic for code deploy
   * @private
   */
  private getCodeDeploySnsTopic() {
    return new DataAwsSnsTopic(this, 'backend_notifications', {
      name: `Backend-${config.environment}-ChatBot`,
    });
  }

  /**
   * Create PagerDuty service for alerts
   * @private
   */
  private createPagerDuty() {
    const incidentManagement = new DataTerraformRemoteState(
      this,
      'incident_management',
      {
        organization: 'Pocket',
        workspaces: {
          name: 'incident-management',
        },
      },
    );

    return new PocketPagerDuty(this, 'pagerduty', {
      prefix: config.prefix,
      service: {
        // This is a Tier 2 service and as such only raises non-critical alarms.
        criticalEscalationPolicyId: incidentManagement
          .get('policy_default_non_critical_id')
          .toString(),
        nonCriticalEscalationPolicyId: incidentManagement
          .get('policy_default_non_critical_id')
          .toString(),
      },
    });
  }
}

const app = new App();
new AccountDataDeleter(app, config.constructName);
app.synth();
