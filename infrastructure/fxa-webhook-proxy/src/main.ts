import { Construct } from 'constructs';
import {
  App,
  DataTerraformRemoteState,
  RemoteBackend,
  TerraformStack,
} from 'cdktf';
import { config } from './config';
import {
  ApplicationSQSQueue,
  PocketPagerDuty,
  PocketVPC,
} from '@pocket-tools/terraform-modules';
import { AwsProvider } from '@cdktf/provider-aws/lib/provider';
import { PagerdutyProvider } from '@cdktf/provider-pagerduty/lib/provider';
import { SqsLambda } from './sqsLambda';
import { ArchiveProvider } from '@cdktf/provider-archive/lib/provider';
import { NullProvider } from '@cdktf/provider-null/lib/provider';
import { LocalProvider } from '@cdktf/provider-local/lib/provider';
import { ApiGateway } from './apiGateway';

class FxAWebhookProxy extends TerraformStack {
  constructor(scope: Construct, name: string) {
    super(scope, name);

    new AwsProvider(this, 'aws', { region: 'us-east-1' });
    new PagerdutyProvider(this, 'pagerduty_provider', { token: undefined });
    new ArchiveProvider(this, 'archive-provider');
    new NullProvider(this, 'null-provider');
    new LocalProvider(this, 'local-provider');

    new RemoteBackend(this, {
      hostname: 'app.terraform.io',
      organization: 'Pocket',
      workspaces: [{ prefix: `${config.name}-` }],
    });

    const vpc = new PocketVPC(this, 'pocket-shared-vpc');
    const pagerDuty = this.createPagerDuty();

    const sqs = new ApplicationSQSQueue(this, 'sqs-queue', {
      name: `${config.prefix}-Queue`,
      maxReceiveCount: 3,
      visibilityTimeoutSeconds: 300,
      messageRetentionSeconds: 604800, // Set retention to 7 days in case we get a lot of events to process.. unlikely, but safer.
    });

    new SqsLambda(this, 'proxy-lambda', vpc, sqs.sqsQueue, pagerDuty);
    new ApiGateway(this, 'apigateway-lambda', vpc, sqs.sqsQueue, pagerDuty);
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

    const incidentManagement = new DataTerraformRemoteState(
      this,
      'incident_management',
      {
        organization: 'Pocket',
        workspaces: {
          name: 'incident-management',
        },
      }
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
new FxAWebhookProxy(app, 'fxa-webhook-proxy');
app.synth();
