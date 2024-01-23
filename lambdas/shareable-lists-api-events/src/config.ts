export const config = {
  apiEndpoint:
    process.env.SHAREABLE_LISTS_API_URI ||
    'https://shareablelistsapi.getpocket.dev',
  deleteUserDataPath: '/deleteUserData',
};
