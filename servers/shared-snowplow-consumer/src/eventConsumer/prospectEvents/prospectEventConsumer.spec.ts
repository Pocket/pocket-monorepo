import { getProspectEventPayload } from './prospectEventConsumer';
import { ProspectEventPayloadSnowplow } from '../../snowplow/prospect/types';
import { testProspectData } from '../../snowplow/prospect/testData';

describe('getProspectEventPayload', () => {
  it('should convert request body to Prospect', () => {
    const expected: ProspectEventPayloadSnowplow = {
      object_version: 'new',
      prospect: testProspectData,
      eventType: 'PROSPECT_REVIEWED',
    };

    const requestBody = {
      'detail-type': 'prospect-dismiss',
      source: 'prospect-events',
      detail: testProspectData,
    };

    const payload = getProspectEventPayload(requestBody);
    expect(payload).toEqual(expected);
  });
});
