import { Resource, TerraformStack } from 'cdktf';
import { Construct } from 'constructs';

// used to test individual static functions within component classes
// generates a basic/empty construct Resource to provide context
export class TestResource extends Resource {
  constructor(scope: TerraformStack | Construct, name: string) {
    super(scope, name);
  }
}
