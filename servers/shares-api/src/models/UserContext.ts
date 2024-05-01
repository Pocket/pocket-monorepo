import { createHash } from 'node:crypto';

export type UserContext = {
  guid?: string;
  userId?: string;
};

type UserSeasoning = { userSalt: string; guidSalt: string };

export function UserContextFactory(
  salts: UserSeasoning,
  guid: string | undefined,
  userId: string | undefined,
): UserContext {
  const sha256 = (input: string) =>
    createHash('sha256').update(input, 'utf8').digest('hex');
  return {
    guid: guid ? sha256(salts.guidSalt + guid) : undefined,
    userId: userId ? sha256(salts.userSalt + userId) : undefined,
  };
}
