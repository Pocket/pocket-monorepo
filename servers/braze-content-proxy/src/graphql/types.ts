import { ScheduledSurfaceItem } from '../routes/types';

//todo: in future, we can extend it to codegen types from graphql schema
/**
 * The shape of the query returned by Client API that contains curated items
 * scheduled for a given day on a given Pocket Hits surface.
 */
export type ClientApiResponse = {
  data: {
    scheduledSurface: {
      items: ScheduledSurfaceItem[];
    };
  };
};
