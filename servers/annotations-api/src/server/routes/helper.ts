import * as Sentry from '@sentry/node';
import { serverLogger } from '../';

export const successCallback = (
  dataType: string,
  userId: string,
  traceId: string,
) => {
  const successMessage = `BatchDelete: ${dataType} deletion completed for userId=${userId}, traceId=${traceId}`;
  serverLogger.info(successMessage);
};

export const failCallback = (
  module: string,
  error: Error,
  dataType: string,
  userId: string,
  traceId: string,
  annotationId?: string,
) => {
  let failMessage = `${module}: Error = Failed to delete ${dataType} for userId=${userId}, traceId=${traceId}`;
  if (annotationId) {
    failMessage = failMessage + `and annotation_id: ${annotationId}`;
  }
  Sentry.addBreadcrumb({ message: failMessage });
  Sentry.captureException(error);
  serverLogger.error(failMessage);
  serverLogger.error(error);
};
