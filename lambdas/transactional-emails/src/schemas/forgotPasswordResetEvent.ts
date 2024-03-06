export type FogotPasswordResetEvent = {
  passwordResetInfo: PasswordResetInfo;
  user: User;
};

type User = {
  email: string;
  encodedId: string;
  id: number;
};

type PasswordResetInfo = {
  resetPasswordToken: string;
  resetPasswordUsername: string;
  timestamp: string;
};
