import { Construct } from 'constructs';
import { App, S3Backend, TerraformStack } from 'cdktf';
import { provider as awsProvider } from '@cdktf/provider-aws';
import {
  provider as pagerdutyProvider,
  dataPagerdutyEscalationPolicy,
} from '@cdktf/provider-pagerduty';
import { provider as localProvider } from '@cdktf/provider-local';
import { provider as nullProvider } from '@cdktf/provider-null';
import {
  ApplicationEventBus,
  ApplicationEventBusProps,
} from '@pocket-tools/terraform-modules';
import { UserApiEvents } from './event-rules/user-api-events/userApiEventRules.js';
import { ProspectEvents } from './event-rules/prospect-events/prospectEventRules.js';
import { CollectionApiEvents } from './event-rules/collection-events/collectionApiEventRules.js';
import { ShareableListEvents } from './event-rules/shareable-lists-api-events/shareableListEventRules.js';
import { ShareableListItemEvents } from './event-rules/shareable-lists-api-events/shareableListItemEventRules.js';
import { ListApiEvents } from './event-rules/list-api-events/listApiEventRules.js';
import { PocketPagerDuty } from '@pocket-tools/terraform-modules';
import { provider as archiveProvider } from '@cdktf/provider-archive';
import { config } from './config/index.js';
import { UserEventsSchema } from './events-schema/userEvents.js';
import { AccountDeleteMonitorEvents } from './event-rules/account-delete-monitor/index.js';
import { QueueCheckDeleteSchema } from './events-schema/queueCheckDelete.js';
import { UserMergeEventSchema } from './events-schema/userMergeEvent.js';
import { PremiumPurchaseEvent } from './events-schema/premiumPurchaseEvent.js';
import { ForgotPasswordRequestEvent } from './events-schema/ForgotPasswordRequestEvent.js';
import { PremiumPurchase } from './event-rules/premium-purchase/index.js';
import { UserRegistrationEventRule } from './event-rules/user-registration/userRegistrationEventRule.js';
import { UserRegistrationEventSchema } from './events-schema/userRegistrationEventSchema.js';
import { AllEventsRule } from './event-rules/all-events/allEventRules.js';
import { ForgotPassword as ForgotPasswordRequest } from './event-rules/forgot-password-request/index.js';

class PocketEventBus extends TerraformStack {
  constructor(scope: Construct, name: string) {
    super(scope, name);

    new awsProvider.AwsProvider(this, 'aws', {
      region: 'us-east-1',
      defaultTags: [{ tags: config.tags }],
    });
    new pagerdutyProvider.PagerdutyProvider(this, 'pagerduty_provider', {
      token: undefined,
    });
    new localProvider.LocalProvider(this, 'local_provider');
    new nullProvider.NullProvider(this, 'null_provider');
    new archiveProvider.ArchiveProvider(this, 'archive_provider');

    new S3Backend(this, {
      bucket: `mozilla-pocket-team-${config.environment.toLowerCase()}-terraform-state`,
      dynamodbTable: `mozilla-pocket-team-${config.environment.toLowerCase()}-terraform-state`,
      key: config.name,
      region: 'us-east-1',
    });

    const eventBusProps: ApplicationEventBusProps = {
      name: `${config.prefix}-Shared-Event-Bus`,
      tags: config.tags,
    };

    const sharedPocketEventBus = new ApplicationEventBus(
      this,
      'shared-event-bus',
      eventBusProps,
    );

    const pagerDuty = this.createPagerDuty();

    // CUSTOM EVENTS & CONSUMERS

    // user-api events
    new UserApiEvents(this, 'user-api-events', sharedPocketEventBus, pagerDuty);

    // prospect events (note that the following behaves differently in prod
    // versus dev - check the file for more details)
    new ProspectEvents(
      this,
      'prospect-events',
      sharedPocketEventBus,
      pagerDuty,
    );

    // Events for Account Delete Monitor service
    new AccountDeleteMonitorEvents(this, 'adm-events', pagerDuty);

    //'Premium Purchase' event, currently emitted by web-repo
    new PremiumPurchase(this, 'premium-purchase', pagerDuty);

    //'User Registration' event, currently emitted by web-repo
    new UserRegistrationEventRule(this, 'user-registration', pagerDuty);

    // All events that have a detail type in the bus.
    new AllEventsRule(this, 'all-events', sharedPocketEventBus, pagerDuty);

    //'Forgot Password Request' event, currently emitted by web-repo
    new ForgotPasswordRequest(this, 'forgot-password', pagerDuty);

    new CollectionApiEvents(
      this,
      'collection-events',
      sharedPocketEventBus,
      pagerDuty,
    );
    //TODO add collection events open api schema from aws

    // Shareable List Events for Shareable Lists API service
    new ShareableListEvents(
      this,
      'shareable-list-events',
      sharedPocketEventBus,
      pagerDuty,
    );

    // Shareable List Item Events for Shareable Lists API service
    new ShareableListItemEvents(
      this,
      'shareable-list-item-events',
      sharedPocketEventBus,
      pagerDuty,
    );

    // list-api events
    new ListApiEvents(this, 'list-api-events', sharedPocketEventBus, pagerDuty);

    //Schema
    new UserEventsSchema(this, 'user-api-events-schema');
    new QueueCheckDeleteSchema(this, 'queue-delete-schema');
    new UserMergeEventSchema(this, 'user-merge-event-shema');
    new PremiumPurchaseEvent(this, 'premium-purchase-event-schema');
    new ForgotPasswordRequestEvent(
      this,
      'forgot-password-request-event-schema',
    );
    new UserRegistrationEventSchema(this, `user-registration-event-schema`);
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
new PocketEventBus(app, config.nameLower);
app.synth();
