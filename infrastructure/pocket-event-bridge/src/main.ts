import { Construct } from 'constructs';
import { App, S3Backend, TerraformStack } from 'cdktf';
import { provider as awsProvider, dataAwsSnsTopic } from '@cdktf/provider-aws';
import { provider as localProvider } from '@cdktf/provider-local';
import { provider as nullProvider } from '@cdktf/provider-null';
import {
  ApplicationEventBus,
  //ApplicationEventBusProps,
  PocketVPC,
} from '@pocket-tools/terraform-modules';
//import { ProspectEvents } from './event-rules/prospect-events/prospectEventRules.ts';
import { provider as archiveProvider } from '@cdktf/provider-archive';
import { config } from './config/index.ts';
//import { AccountDeleteMonitorEvents } from './event-rules/account-delete-monitor/index.ts';
//import { AllEventsRule } from './event-rules/all-events/allEventRules.ts';
import { PocketEventToTopic } from './eventBridge.ts';
import { PocketEventType } from '@pocket-tools/event-bridge';

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

    //const alarmSnsTopic = this.getAlarmSnsTopic();

    // VPC for accessing non-public resources, e.g. elasticsearch
    // for the corpus event lambda consumer
    new PocketVPC(this, 'pocket-shared-vpc');

    /* 
    const eventBusProps: ApplicationEventBusProps = {
      name: `${config.prefix}-Shared-Event-Bus`,
      tags: config.tags,
    };

   const sharedPocketEventBus = new ApplicationEventBus(
      this,
      'shared-event-bus',
      eventBusProps,
    ); */

    //this.createEventRules(sharedPocketEventBus, alarmSnsTopic);

    /****************
     * The following events use an older pattern, but are still in use,
     * and different enough to not warrant trying to standardize at the moment.
     ****************/

    // Events for Account Delete Monitor service
    //new AccountDeleteMonitorEvents(this, 'adm-events', alarmSnsTopic);

    // prospect events (note that the following behaves differently in prod
    // versus dev - check the file for more details)
    /*
    new ProspectEvents(
      this,
      'prospect-events',
      sharedPocketEventBus,
      alarmSnsTopic,
    );
    */

    // All events that have a detail type in the bus.
    //new AllEventsRule(this, 'all-events', sharedPocketEventBus, alarmSnsTopic);
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
        'detail-type': [
          PocketEventType.EXPORT_READY,
          PocketEventType.EXPORT_PART_COMPLETE,
        ],
        source: ['account-data-deleter', 'shareable-lists'],
      },
    });
  }
}

const app = new App();
new PocketEventBus(app, config.nameLower);
app.synth();
