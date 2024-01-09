import _ from 'lodash';
import s from 'underscore.string';
import intMaskMaps from './intMaskMaps';
import Mask from './mask';

const maskSym = Symbol('Mask memoize');

// Convert integers into 64 character strings to obfuscate their true values.
export default class IntMask {
  private readonly val;

  constructor(val) {
    this.val = val;
  }

  static encode(val) {
    return new this(val).encode();
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

  // Inject encoded characters at specific positions in the mask.
  merge(encodedString, mask) {
    const result = _.toArray(mask);

    // Inject encoded characters at specific points of the mask.
    intMaskMaps.positionMap.forEach(function (decodedIndex, encodedIndex: any) {
      result[encodedIndex] = encodedString.charAt(decodedIndex);
    });

    return result.join('');
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
      .map(function (val, i) {
        const outIndex = Math.floor((charSeed + i + 1) % 5); // always 0->5
        const optAry = intMaskMaps.intMap.get(parseInt(val));
        return optAry[outIndex];
      })
      .value()
      .join('');
  }

  // Maps to PHP: IntMask#randomStringHash
  getMask() {
    this[maskSym] = this[maskSym] || Mask.create(this.val);

    return this[maskSym];
  }
}
