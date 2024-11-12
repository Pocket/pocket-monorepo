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
import { ShareableListEvents } from './event-rules/shareable-lists-api-events/shareableListEventRules';
import { ShareableListItemEvents } from './event-rules/shareable-lists-api-events/shareableListItemEventRules';
import { ListApiEvents } from './event-rules/list-api-events/listApiEventRules';
import { provider as archiveProvider } from '@cdktf/provider-archive';
import { config } from './config';
import { AccountDeleteMonitorEvents } from './event-rules/account-delete-monitor';
import { PremiumPurchase } from './event-rules/premium-purchase';
import { UserRegistrationEventRule } from './event-rules/user-registration/userRegistrationEventRule';
import { AllEventsRule } from './event-rules/all-events/allEventRules';
import { ForgotPassword as ForgotPasswordRequest } from './event-rules/forgot-password-request';
import { SharesApiEvents } from './event-rules/shares-api-events/pocketShareEventRules';
import { SearchApiEvents } from './event-rules/search-api-events/pocketSearchEventRules';
import { CorpusEvents } from './event-rules/corpus-events/corpusEventRules';
import { ListExportReady } from './event-rules/list-export-request-ready';
import { PocketEventToTopic } from './eventBridge';
import { PocketEventType } from '@pocket-tools/event-bridge';
import { CollectionApiEvents } from './event-rules/collection-events/collectionApiEventRules';

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

    // We are deploying to sets of the same event rules, one for old way of creating event consumers, and one for the new way.
    // We are doing it this way so that we can rename the topics to a standard naming convention and not break existing infra.
    // Also all topics must be created before anything can consumer it.
    this.createOldEventRules(sharedPocketEventBus, alarmSnsTopic);
    this.createEventRules(sharedPocketEventBus, alarmSnsTopic);

    /****************
     * The following events use an older pattern, but are still in use,
     * and different enough to not warrant trying to standardize at the moment.
     ****************/

    // Events for Account Delete Monitor service
    new AccountDeleteMonitorEvents(this, 'adm-events', alarmSnsTopic);
    // prospect events (note that the following behaves differently in prod
    // versus dev - check the file for more details)
    new ProspectEvents(
      this,
      'prospect-events',
      sharedPocketEventBus,
      alarmSnsTopic,
    );
    // All events that have a detail type in the bus.
    new AllEventsRule(this, 'all-events', sharedPocketEventBus, alarmSnsTopic);
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

  private createEventRules(
    sharedPocketEventBus: ApplicationEventBus,
    alarmSnsTopic: dataAwsSnsTopic.DataAwsSnsTopic,
  ) {
    // User Account Events
    new PocketEventToTopic(this, 'user-events-topic', {
      eventBusName: sharedPocketEventBus.bus.name,
      snsAlarmTopic: alarmSnsTopic,
      prefix: config.prefix,
      name: 'UserEvents',
      tags: config.tags,
      eventPattern: {
        'detail-type': [
          PocketEventType.ACCOUNT_DELETION,
          PocketEventType.ACCOUNT_EMAIL_UPDATED,
          PocketEventType.ACCOUNT_PASSWORD_CHANGED,
        ],
        source: ['user-events'],
      },
    });

    // Premium Purchase Events
    new PocketEventToTopic(this, 'premium-purchase-topic', {
      eventBusName: sharedPocketEventBus.bus.name,
      snsAlarmTopic: alarmSnsTopic,
      prefix: config.prefix,
      name: 'PremiumPurchaseEvents',
      tags: config.tags,
      eventPattern: {
        'detail-type': [PocketEventType.PREMIUM_PURCHASE],
        source: ['web-repo'],
      },
    });

    // User Registration Events
    new PocketEventToTopic(this, 'user-registration-topic', {
      eventBusName: sharedPocketEventBus.bus.name,
      snsAlarmTopic: alarmSnsTopic,
      prefix: config.prefix,
      name: 'UserRegistrationEvents',
      tags: config.tags,
      eventPattern: {
        'detail-type': [PocketEventType.ACCOUNT_REGISTRATION],
        source: ['web-repo'],
      },
    });

    // Forgot Password Events
    new PocketEventToTopic(this, 'forgot-password-topic', {
      eventBusName: sharedPocketEventBus.bus.name,
      snsAlarmTopic: alarmSnsTopic,
      prefix: config.prefix,
      name: 'ForgotPasswordEvents',
      tags: config.tags,
      eventPattern: {
        'detail-type': [PocketEventType.FORGOT_PASSWORD],
        source: ['web-repo'],
      },
    });

    // Collection Events
    new PocketEventToTopic(this, 'collection-events-topic', {
      eventBusName: sharedPocketEventBus.bus.name,
      snsAlarmTopic: alarmSnsTopic,
      prefix: config.prefix,
      name: 'CollectionEvents',
      tags: config.tags,
      eventPattern: {
        'detail-type': [
          PocketEventType.COLLECTION_UPDATED,
          PocketEventType.COLLECTION_CREATED,
        ],
        source: ['collection-events'],
      },
    });

    // Shareable List Events
    new PocketEventToTopic(this, 'shareable-list-events-topic', {
      eventBusName: sharedPocketEventBus.bus.name,
      snsAlarmTopic: alarmSnsTopic,
      prefix: config.prefix,
      name: 'ShareableListEvents',
      tags: config.tags,
      eventPattern: {
        'detail-type': [
          PocketEventType.SHAREABLE_LIST_CREATED,
          PocketEventType.SHAREABLE_LIST_UPDATED,
          PocketEventType.SHAREABLE_LIST_DELETED,
          PocketEventType.SHAREABLE_LIST_HIDDEN,
          PocketEventType.SHAREABLE_LIST_UNHIDDEN,
          PocketEventType.SHAREABLE_LIST_PUBLISHED,
          PocketEventType.SHAREABLE_LIST_UNPUBLISHED,
        ],
        source: ['shareable-list-events'],
      },
    });

    new PocketEventToTopic(this, 'shareable-list-item-events-topic', {
      eventBusName: sharedPocketEventBus.bus.name,
      snsAlarmTopic: alarmSnsTopic,
      prefix: config.prefix,
      name: 'ShareableListItemEvents',
      tags: config.tags,
      eventPattern: {
        'detail-type': [
          PocketEventType.SHAREABLE_LIST_ITEM_CREATED,
          PocketEventType.SHAREABLE_LIST_ITEM_UPDATED,
          PocketEventType.SHAREABLE_LIST_ITEM_DELETED,
        ],
        source: ['shareable-list-item-events'],
      },
    });

    new PocketEventToTopic(this, 'list-events-topic', {
      eventBusName: sharedPocketEventBus.bus.name,
      snsAlarmTopic: alarmSnsTopic,
      prefix: config.prefix,
      name: 'ListEvents',
      tags: config.tags,
      eventPattern: {
        'detail-type': [
          PocketEventType.ADD_ITEM,
          PocketEventType.DELETE_ITEM,
          PocketEventType.FAVORITE_ITEM,
          PocketEventType.UNFAVORITE_ITEM,
          PocketEventType.ARCHIVE_ITEM,
          PocketEventType.UNARCHIVE_ITEM,
          PocketEventType.ADD_TAGS,
          PocketEventType.REPLACE_TAGS,
          PocketEventType.CLEAR_TAGS,
          PocketEventType.REMOVE_TAGS,
          PocketEventType.RENAME_TAG,
          PocketEventType.DELETE_TAG,
          PocketEventType.EXPORT_REQUESTED,
        ],
        source: ['list-api'],
      },
    });

    new PocketEventToTopic(this, 'share-events-topic', {
      eventBusName: sharedPocketEventBus.bus.name,
      snsAlarmTopic: alarmSnsTopic,
      prefix: config.prefix,
      name: 'ShareEvents',
      tags: config.tags,
      eventPattern: {
        'detail-type': [
          PocketEventType.SHARE_CREATED,
          PocketEventType.SHARE_CONTEXT_UPDATED,
        ],
        source: ['shares-api-events'],
      },
    });

    new PocketEventToTopic(this, 'search-events-topic', {
      eventBusName: sharedPocketEventBus.bus.name,
      snsAlarmTopic: alarmSnsTopic,
      prefix: config.prefix,
      name: 'SearchEvents',
      tags: config.tags,
      eventPattern: {
        'detail-type': [PocketEventType.SEARCH_RESPONSE_GENERATED],
        source: ['search-api-events'],
      },
    });

    new PocketEventToTopic(this, 'corpus-events-topic', {
      eventBusName: sharedPocketEventBus.bus.name,
      snsAlarmTopic: alarmSnsTopic,
      prefix: config.prefix,
      name: 'CorpusEvents',
      tags: config.tags,
      eventPattern: {
        'detail-type': [
          PocketEventType.CORPUS_ITEM_ADDED,
          PocketEventType.CORPUS_ITEM_REMOVED,
          PocketEventType.CORPUS_ITEM_UPDATED,
        ],
        source: ['curation-migration-datasync'], // ??
      },
    });

    new PocketEventToTopic(this, 'list-export-ready-event-topic', {
      eventBusName: sharedPocketEventBus.bus.name,
      snsAlarmTopic: alarmSnsTopic,
      prefix: config.prefix,
      name: 'ListExportReadyEvents',
      tags: config.tags,
      eventPattern: {
        'detail-type': [PocketEventType.EXPORT_READY],
        source: ['account-data-deleter'],
      },
    });
  }

  /**
   * TODO: Follow up and delete all these rules and folders after updating all the consumers to use the new topic.
   * // https://mozilla-hub.atlassian.net/browse/POCKET-10821
   * @param sharedPocketEventBus
   * @param alarmSnsTopic
   */
  private createOldEventRules(
    sharedPocketEventBus: ApplicationEventBus,
    alarmSnsTopic: dataAwsSnsTopic.DataAwsSnsTopic,
  ) {
    // user-api events
    new UserApiEvents(
      this,
      'user-api-events',
      sharedPocketEventBus,
      alarmSnsTopic,
    );

    //'Premium Purchase' event, currently emitted by web-repo
    new PremiumPurchase(this, 'premium-purchase', alarmSnsTopic);

    //'User Registration' event, currently emitted by web-repo
    new UserRegistrationEventRule(this, 'user-registration', alarmSnsTopic);

    //'Forgot Password Request' event, currently emitted by web-repo
    new ForgotPasswordRequest(this, 'forgot-password', alarmSnsTopic);

    new CollectionApiEvents(
      this,
      'collection-events',
      sharedPocketEventBus,
      alarmSnsTopic,
    );

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

    // List export is available
    new ListExportReady(
      this,
      'list-export-ready-event',
      sharedPocketEventBus,
      alarmSnsTopic,
    );
  }
}

const app = new App();
new PocketEventBus(app, config.nameLower);
app.synth();
