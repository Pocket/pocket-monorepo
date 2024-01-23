/**
 * Return an object conforming to the User graphql definition.
 *
 * @param parent // a List
 * @param args
 * @param context
 * @param info
 */
export const UserResolver = (parent, args, context, info) => {
  // very basic data transformation!
  return {
    id: parent.userId.toString(),
  };
};
