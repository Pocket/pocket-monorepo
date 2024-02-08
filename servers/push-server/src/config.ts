import { ServiceAccount } from 'firebase-admin';

// ALL VALUES ARE FAKE FOR TESTING
export const serviceAccount: ServiceAccount = {
  projectId: process.env.GCM_PROJECT_ID || 'api-project',
  clientEmail:
    process.env.GCM_CLIENT_EMAIL ||
    'firebase-adminsdk-mttms@someproject.iam.gserviceaccount.com',
  privateKey:
    process.env.GCM_PRIVATE_KEY ||
    '-----BEGIN RSA PRIVATE KEY-----\nMIICWwIBAAKBgHOy+uDeIWSq7XI/QIZdScaa8w846fFN33WVlPVTnqJ9stl+MNz9\nO3OQhUgaMkoTFHa9bcsls/s0gZGgC3zdLtQ1vcrJ9MNDKHe5DXJrEKCJbjA90/JM\nxXl7sh443mgfCN4/S1z6Haw2J56+GRlDNBI+t72UNy+38lXCuKxGkAvtAgMBAAEC\ngYBrEz0zVuA4tifCD9+7eiKI92XytI1tkNA5lhGhaZ3qa8JVnn/CRWn77cgrjnL0\nMuxBZ9Zwp5gF5/Xxu9hl2p027yk7rbaRM3EKoN5SMl9ZXFOtTbEjMBwxG+zFBPE0\n1ubXqCahHOjwzVgIjx5BGzJDtwtX5DRFUUUQFGpYCGT3AQJBAMHKE+4IL6i6pQOb\nYODwX4WhwduUB/hAUu0ppJcL0otj6gBF0blk5BPrjaa4bJdCBNBa0UyJIhs1L6gj\n67/loLECQQCY11JXR7vLLZ/ZN5J5QM5PzWdNz4l7m3tgovpPBJoIj9bbVWVrZNTN\nqcQKOwp39vypGoace8kTq8U0c+mOu039AkB7qBHdkvWuaiL/0TcZcejSIazNC4Gm\nZI1F7ourIo0gCwp3UBYKghmTqHxEBWytfCAMP9dMSjksOV0Gop09Xy6RAkBna7wB\n5z5Bm5vAZgQtHBb+lOTEGBzVkT4JA/8QHPMFvB8Mx1obM11z1N4cdhr9Vhlda9+O\nX4yOTPriJVTzCfcZAkEAqvzZGRkOluUSRI/x+ZC6gQiRAZsmmRdzuvXMoqIxQ/+3\nt8gvZZ9wB1W+lr5emXaG2+sOQhrZiF+WRzwgj5wN6Q==\n-----END RSA PRIVATE KEY-----',
};

export const sentryDsn =
  process.env.SENTRY_DSN || 'https://dummy:dummy@sentry.io/123456';
export const numWorkers = parseInt(process.env.NUMBER_OF_WORKERS || '1', 10);
export const msBetweenStarts =
  parseInt(process.env.TIME_BETWEEN_RESTARTS || '5', 10) * 1000;
export const apns = {
  token: {
    key:
      process.env.APNS_P8_KEY ||
      '-----BEGIN EC PRIVATE KEY-----\nMHcCAQEEIHgcb8URcsLM4jO1oNCk5DhJSWtXreIegamc1whcdGR2oAoGCCqGSM49\nAwEHoUQDQgAEthlWk8+DsdFovOTShh+oKsLCTeNzEqC+1UXrGa99xHVCcqu+hr8y\nxG0gQ76zz70XCdGcqYdTlt1qK19TA+fBHw==\n-----END EC PRIVATE KEY-----',
    keyId: process.env.APNS_KEY_ID || '123456789',
    teamId: process.env.APNS_TEAM_ID || '12312313',
  },
  betaBundleId: process.env.APNS_BETA_BUNDLE_ID || 'com.beta',
  prodBundleId: process.env.APNS_PROD_BUNDLE_ID || 'com.prod',
};
