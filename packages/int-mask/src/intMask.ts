import _ from 'lodash';
import s from 'underscore.string';
import Mask from './mask';

const maskSym = Symbol('Mask memoize');

export type IntMaskOptions = {
  characterMap: Map<string, number>;
  positionMap: Map<number, number>;
  md5Randomizer: Map<string, string[]>;
  letterIndex: Map<string, number>;
  salt1: string;
  salt2: string;
};

// Convert integers into 64 character strings to obfuscate their true values.
export class IntMask {
  private options: IntMaskOptions;
  private val;

  private intMap;

  constructor(val, options: IntMaskOptions) {
    this.val = val;
    this.options = options;
    this.intMap = new Map();
    this.buildMap();
  }

  buildMap() {
    this.options.characterMap.forEach((val, key) => {
      const intVal = this.intMap.get(val) || [];
      intVal.push(key);
      this.intMap.set(val, intVal);
    });
  }

  static encode(val, options: IntMaskOptions) {
    return new this(val, options).encode();
  }

  static decode(val, options: IntMaskOptions) {
    return new this(val, options).decode();
  }

  // Primary logic flow:
  // 1. Encode the provided value.
  // 2. Construct a mask to hide the values within.
  // 3. Merge the encoded values into specific positions in the map.
  encode() {
    const encodedString = this.encodeChars();
    const mask = this.getMask();

    return this.merge(encodedString, mask);
  }

  // Primary logic flow:
  // 1. Encode the provided value.
  // 2. Construct a mask to hide the values within.
  // 3. Merge the encoded values into specific positions in the map.
  decode() {
    const encodedString = this.decodeChars();

    return this.unmerge(encodedString);
  }

  // Inject encoded characters at specific positions in the mask.
  merge(encodedString, mask): string {
    const result = _.toArray(mask);

    // Inject encoded characters at specific points of the mask.
    this.options.positionMap.forEach(function (
      decodedIndex,
      encodedIndex: any,
    ) {
      result[encodedIndex] = encodedString.charAt(decodedIndex);
    });

    return result.join('');
  }

  unmerge(encodedString): number {
    const result = [];

    // Remove encoded at specific points of the mask.
    this.options.positionMap.forEach((decodedIndex, encodedIndex: any) => {
      result[decodedIndex] = encodedString.charAt(encodedIndex);
    });

    const result1 = result.join('').replace(/^0*/, '');

    return parseInt(result1);
  }

  // Create a basic 16 charater string with value replacement to obfuscate the
  // original values.
  // Maps to PHP: IntMask#encodeChar execept this encodes all characters at
  // once.
  encodeChars() {
    const str = s.lpad(this.val, 16, '0');

    // Use the mask to produce a consistent output value for any given input
    // value.
    const charSeed = parseInt(this.getMask().match(/[0-9]/)[0] || '1');

    return _.chain(str)
      .toArray()
      .map((val, i) => {
        const outIndex = Math.floor((charSeed + i + 1) % 5); // always 0->5
        const optAry = this.intMap.get(parseInt(val));
        return optAry[outIndex];
      })
      .value()
      .join('');
  }

  // Maps to PHP: IntMask#decodeChar execept this decodes all characters at
  // once.
  decodeChars() {
    // Use the mask to produce a consistent output value for any given input
    // value.
    return _.chain(this.val)
      .toArray()
      .map((val, i) => {
        return this.options.characterMap.get(val) ?? val;
      })
      .value()
      .join('');
  }

  // Maps to PHP: IntMask#randomStringHash
  getMask() {
    this[maskSym] =
      this[maskSym] ||
      Mask.create(this.val, {
        salt1: this.options.salt1,
        salt2: this.options.salt2,
        letterRandomizerOptions: {
          letterIndex: this.options.letterIndex,
          md5Randomizer: this.options.md5Randomizer,
        },
      });

    return this[maskSym];
  }
}
