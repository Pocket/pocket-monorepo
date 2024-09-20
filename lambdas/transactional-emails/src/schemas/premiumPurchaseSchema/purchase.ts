export class Purchase {
  'amount': string;
  'cancelAtPeriodEnd': boolean;
  'isFree': boolean;
  'isTrial': boolean;
  'planInterval': string;
  'planType': string;
  'receiptId': string | null;
  'renewDate': string;

  private static discriminator: string | undefined = undefined;

  private static attributeTypeMap: Array<{
    name: string;
    baseName: string;
    type: string;
  }> = [
    {
      name: 'amount',
      baseName: 'amount',
      type: 'string',
    },
    {
      name: 'cancelAtPeriodEnd',
      baseName: 'cancelAtPeriodEnd',
      type: 'boolean',
    },
    {
      name: 'isFree',
      baseName: 'isFree',
      type: 'boolean',
    },
    {
      name: 'isTrial',
      baseName: 'isTrial',
      type: 'boolean',
    },
    {
      name: 'planInterval',
      baseName: 'planInterval',
      type: 'string',
    },
    {
      name: 'planType',
      baseName: 'planType',
      type: 'string',
    },
    {
      name: 'receiptId',
      baseName: 'receiptId',
      type: 'string',
    },
    {
      name: 'renewDate',
      baseName: 'renewDate',
      type: 'string',
    },
  ];

  public static getAttributeTypeMap() {
    return Purchase.attributeTypeMap;
  }
}
