import { ProspectEvent } from '@pocket-tools/event-bridge';
import { ProspectEventHandler } from '../../snowplow/prospect/prospectEventHandler';

export function prospectEventConsumer(event: ProspectEvent) {
  new ProspectEventHandler().process(event);
}
