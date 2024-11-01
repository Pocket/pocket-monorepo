import { BaseEvent } from './base';
import { PocketEventType } from '../events';

export interface ExportReady extends BaseEvent {
  // 'source': 'account-data-deleter';
  'detail-type': PocketEventType.EXPORT_READY;
  detail: {
    encodedId: string;
    requestId: string;
    archiveUrl: string;
  };
}
