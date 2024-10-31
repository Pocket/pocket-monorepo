export interface EventBridgeBase {
  account: string;
  id: string;
  region: string;
  time: Date;
  version: string;

  // Theses are overriden by the actual events with their types
  source: string;
  'detail-type': string;
  detail: object;
}
