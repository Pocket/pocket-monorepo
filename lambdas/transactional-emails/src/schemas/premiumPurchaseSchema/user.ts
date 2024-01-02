export class User {
  'email': string;
  'encodedId': string;
  'id': number;

  private static discriminator: string | undefined = undefined;

  private static attributeTypeMap: Array<{
    name: string;
    baseName: string;
    type: string;
  }> = [
    {
      name: 'email',
      baseName: 'email',
      type: 'string',
    },
    {
      name: 'encodedId',
      baseName: 'encodedId',
      type: 'string',
    },
    {
      name: 'id',
      baseName: 'id',
      type: 'number',
    },
  ];

  public static getAttributeTypeMap() {
    return User.attributeTypeMap;
  }
}
