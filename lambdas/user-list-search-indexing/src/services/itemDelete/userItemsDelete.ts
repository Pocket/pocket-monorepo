import { UserItemsSqsMessage } from "../../types";

/**
 *
 * @param body
 */
export const processBody = async (body: string): Promise<boolean> => {
  const messageBody: UserItemsSqsMessage = JSON.parse(body);

  for (const user of messageBody.userItems) {
    const { userId, itemIds } = user;

    console.log(`Started processing sqs items`, {
      userId,
      itemIds,
    });

    const listItems = itemIds.map((itemId) => {
      return { itemId, userId };
    });

    console.log(`Items to process`, {
      userId,
      listItemsCount: listItems.length,
    });

    if (listItems.length > 0) {
      //TODO: Make call to User list search to delete list items
    }

    console.log(`Completed processing items`, {
      userId,
    });
  }

  return true;
};
