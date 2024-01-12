import { PilotUser, PrismaClient } from '@prisma/client';

interface PilotUserInput {
  userId: number | bigint;
  // fields below are for potential future use
  mozillaEmployee?: boolean;
  createdBy?: string;
}

/**
 * Generates a Pilot User
 *
 * @param prisma
 * @param data
 */
export async function createPilotUserHelper(
  prisma: PrismaClient,
  data: PilotUserInput
): Promise<PilotUser> {
  return await prisma.pilotUser.create({
    data,
  });
}
