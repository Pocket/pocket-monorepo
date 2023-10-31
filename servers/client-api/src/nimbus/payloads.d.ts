/**
 * Define the shape of the main payload that we use to share client data with
 * Nimbus. Nimbus will use these to pass enrollment events upstream to Glean.
 *
 * These should also === the payloads that the event backend is ETLing up to BigQuery;
 * In the planned future, when clients send events to Glean directly, they would be
 * expected to take this shape as well.
 */
export interface NimbusEventPayload {
  client_id: string;
  context: {
    lang?: string;
    consumer_key?: string;
    user?: UserDataPayload;
  };
}

export interface UserDataPayload {
  user_id: string;
  is_premium: boolean;
  email_address: string;
}
