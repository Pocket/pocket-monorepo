import { Construct } from 'constructs';
import { App, S3Backend, TerraformStack } from 'cdktf';
import { provider as awsProvider, dataAwsSnsTopic } from '@cdktf/provider-aws';
import { provider as localProvider } from '@cdktf/provider-local';
import { provider as nullProvider } from '@cdktf/provider-null';
import {
  ApplicationEventBus,
  ApplicationEventBusProps,
  PocketVPC,
} from '@pocket-tools/terraform-modules';
import { UserApiEvents } from './event-rules/user-api-events/userApiEventRules';
import { ProspectEvents } from './event-rules/prospect-events/prospectEventRules';
import { CollectionApiEvents } from './event-rules/collection-events/collectionApiEventRules';
import { ShareableListEvents } from './event-rules/shareable-lists-api-events/shareableListEventRules';
import { ShareableListItemEvents } from './event-rules/shareable-lists-api-events/shareableListItemEventRules';
import { ListApiEvents } from './event-rules/list-api-events/listApiEventRules';
import { provider as archiveProvider } from '@cdktf/provider-archive';
import { config } from './config';
import { UserEventsSchema } from './events-schema/userEvents';
import { AccountDeleteMonitorEvents } from './event-rules/account-delete-monitor';
import { QueueCheckDeleteSchema } from './events-schema/queueCheckDelete';
import { UserMergeEventSchema } from './events-schema/userMergeEvent';
import { PremiumPurchaseEvent } from './events-schema/premiumPurchaseEvent';
import { ForgotPasswordRequestEvent } from './events-schema/ForgotPasswordRequestEvent';
import { PremiumPurchase } from './event-rules/premium-purchase';
import { UserRegistrationEventRule } from './event-rules/user-registration/userRegistrationEventRule';
import { UserRegistrationEventSchema } from './events-schema/userRegistrationEventSchema';
import { AllEventsRule } from './event-rules/all-events/allEventRules';
import { ForgotPassword as ForgotPasswordRequest } from './event-rules/forgot-password-request';
import { SharesApiEvents } from './event-rules/shares-api-events/pocketShareEventRules';
import { SearchApiEvents } from './event-rules/search-api-events/pocketSearchEventRules';
import { CorpusEvents } from './event-rules/corpus-events/corpusEventRules';

class PocketEventBus extends TerraformStack {
  constructor(scope: Construct, name: string) {
    super(scope, name);

    new awsProvider.AwsProvider(this, 'aws', {
      region: 'us-east-1',
      defaultTags: [{ tags: config.tags }],
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

    const alarmSnsTopic = this.getAlarmSnsTopic();

    // VPC for accessing non-public resources, e.g. elasticsearch
    // for the corpus event lambda consumer
    new PocketVPC(this, 'pocket-shared-vpc');

    const eventBusProps: ApplicationEventBusProps = {
      name: `${config.prefix}-Shared-Event-Bus`,
      tags: config.tags,
    };

    const sharedPocketEventBus = new ApplicationEventBus(
      this,
      'shared-event-bus',
      eventBusProps,
    );

    // CUSTOM EVENTS & CONSUMERS

    // user-api events
    new UserApiEvents(
      this,
      'user-api-events',
      sharedPocketEventBus,
      alarmSnsTopic,
    );

    // prospect events (note that the following behaves differently in prod
    // versus dev - check the file for more details)
    new ProspectEvents(
      this,
      'prospect-events',
      sharedPocketEventBus,
      alarmSnsTopic,
    );

    // Events for Account Delete Monitor service
    new AccountDeleteMonitorEvents(this, 'adm-events', alarmSnsTopic);

    //'Premium Purchase' event, currently emitted by web-repo
    new PremiumPurchase(this, 'premium-purchase', alarmSnsTopic);

    //'User Registration' event, currently emitted by web-repo
    new UserRegistrationEventRule(this, 'user-registration', alarmSnsTopic);

    // All events that have a detail type in the bus.
    new AllEventsRule(this, 'all-events', sharedPocketEventBus, alarmSnsTopic);

    //'Forgot Password Request' event, currently emitted by web-repo
    new ForgotPasswordRequest(this, 'forgot-password', alarmSnsTopic);

    new CollectionApiEvents(
      this,
      'collection-events',
      sharedPocketEventBus,
      alarmSnsTopic,
    );
    //TODO add collection events open api schema from aws

    // Shareable List Events for Shareable Lists API service
    new ShareableListEvents(
      this,
      'shareable-list-events',
      sharedPocketEventBus,
      alarmSnsTopic,
    );

    // Shareable List Item Events for Shareable Lists API service
    new ShareableListItemEvents(
      this,
      'shareable-list-item-events',
      sharedPocketEventBus,
      alarmSnsTopic,
    );

    // list-api events
    new ListApiEvents(
      this,
      'list-api-events',
      sharedPocketEventBus,
      alarmSnsTopic,
    );
    // shares-api events
    new SharesApiEvents(
      this,
      'shares-api-events',
      sharedPocketEventBus,
      alarmSnsTopic,
    );
    // search-api events
    new SearchApiEvents(
      this,
      'search-api-events',
      sharedPocketEventBus,
      alarmSnsTopic,
    );
    // Corpus Events (uses the default bus, not the shared event bus)
    new CorpusEvents(this, 'corpus-events', alarmSnsTopic);

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
   * Get the sns topic for alarm
   * @private
   */
  private getAlarmSnsTopic() {
    return new dataAwsSnsTopic.DataAwsSnsTopic(this, 'backend_notifications', {
      name: `Backend-${config.environment}-ChatBot`,
    });
  }
}

const app = new App();
new PocketEventBus(app, config.nameLower);
app.synth();
