export enum ErrorCodes {
  INTERNAL_SERVER_ERROR = 'INTERNAL_SERVER_ERROR',
}

const errorHeaders = {
  INTERNAL_SERVER_ERROR: {
    'X-Error-Code': 198,
    en: 'Internal Server Error',
  },
};

export function getErrorHeaders(errorCode: ErrorCodes, language = 'en') {
  //todo: proxy should handle localization based on web repo request.
  return {
    'X-Error-Code': errorHeaders[errorCode]['X-Error-Code'],
    'X-Error': errorHeaders[errorCode][language],
  };
}
