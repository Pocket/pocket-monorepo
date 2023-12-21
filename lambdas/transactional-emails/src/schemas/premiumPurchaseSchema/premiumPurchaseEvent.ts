import { Purchase } from './purchase';
import { User } from './user';

export class PremiumPurchaseEvent {
  'purchase': Purchase;
  'user': User;

  private static discriminator: string | undefined = undefined;
  private static attributeTypeMap: Array<{
    name: string;
    baseName: string;
    type: string;
  }> = [
    {
      name: 'purchase',
      baseName: 'purchase',
      type: 'Purchase',
    },
    {
      name: 'user',
      baseName: 'user',
      type: 'User',
    },
  ];

  public static getAttributeTypeMap() {
    return PremiumPurchaseEvent.attributeTypeMap;
  }
}
