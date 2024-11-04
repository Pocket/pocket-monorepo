import { ValidateFunction } from 'ajv';
import { omnivoreSchema } from './schemas';
import { OmnivoreImportRecord } from './types';
import { ajv } from './ajv';

/**
 * Factory for import validator functions
 */
export class ImportValidator<T> {
  private constructor(private validatorFn: ValidateFunction<T>) {}
  get validate(): ValidateFunction<T> {
    return this.validatorFn;
  }
  static omnivore(): ImportValidator<OmnivoreImportRecord> {
    return new ImportValidator<OmnivoreImportRecord>(
      ajv.compile(omnivoreSchema),
    );
  }
}
