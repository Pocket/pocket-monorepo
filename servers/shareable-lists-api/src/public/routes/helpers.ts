import { Request, Response, NextFunction } from 'express';
import { validationResult } from 'express-validator';
import { PrismaClient } from '@prisma/client';

/**
 * This method validates the request made to the endpoint
 * @param req
 * @param res
 * @param next
 */
export function validate(req: Request, res: Response, next: NextFunction) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res
      .status(400)
      .json({ errors: errors.array() })
      .setHeader('Content-Type', 'application/json');
  }
  next();
}

/**
 * This method returns an array of urls (list item urls) if found for a user
 * @param userId
 * @param url
 * @param db
 */
export async function getShareableListItemUrlsForUser(
  userId: number | bigint,
  url: string,
  db: PrismaClient
): Promise<string[] | null> {
  const listItems = await db.listItem.findMany({
    where: {
      url,
      list: {
        userId,
      },
    },
  });

  const urls = [];
  listItems.forEach(function (item) {
    urls.push(item.url);
  });

  return urls;
}
