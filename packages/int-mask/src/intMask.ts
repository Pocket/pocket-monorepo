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

  constructor(val, options?: Partial<IntMaskOptions>) {
    this.options = this.buildOptions(options || {});
    this.val = val;
    this.intMap = new Map();
    this.buildMap();
  }

  buildOptions(options: Partial<IntMaskOptions>): IntMaskOptions {
    return {
      characterMap:
        options?.characterMap ?? this.fetchMapFromEnv('CHARACTER_MAP'),
      positionMap: options?.positionMap ?? this.fetchMapFromEnv('POSITION_MAP'),
      md5Randomizer:
        options?.md5Randomizer ?? this.fetchMapFromEnv('MD5_RANDOMIZER'),
      letterIndex: options?.letterIndex ?? this.fetchMapFromEnv('LETTER_INDEX'),
      salt1: options?.salt1 ?? this.fetchFromEnv('SALT_1'),
      salt2: options?.salt2 ?? this.fetchFromEnv('SALT_2'),
    };
  }

  /**
   * Gets the value from the environment or errors
   * @param key
   * @returns
   */
  private fetchFromEnv(key: string): any {
    const envValue = process.env[key];
    if (!envValue) {
      throw new Error(`Environment variable '${key}' not found.`);
    }
    return envValue;
  }

  /**
   * Gets the value from the environment tries to make a Map or errors
   * @param key
   * @returns
   */
  private fetchMapFromEnv(key: string): Map<any, any> {
    // Parse the environment variable based on your specific requirements
    // For example, parse a JSON string into a Map
    return new Map(JSON.parse(this.fetchFromEnv(key)));
  }

  buildMap() {
    this.options.characterMap.forEach((val, key) => {
      const intVal = this.intMap.get(val) || [];
      intVal.push(key);
      this.intMap.set(val, intVal);
    });
  }

  /**
   * Use to encode any integer value into a decodable string.
   *
   * Usage: IntMask.encode(12345)
   * @param val
   * @param options Optional object of configuration, otherwise pulled from the env.
   * @returns
   */
  static encode(val, options?: Partial<IntMaskOptions>) {
    return new this(val, options).encode();
  }

  /**
   * Use to decode any string value into an integer.
   *
   * Usage: IntMask.encode(12345)
   * @param val
   * @param options Optional object of configuration, otherwise pulled from the env.
   * @returns
   */
  static decode(val, options?: Partial<IntMaskOptions>) {
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
  // 1. Decode the characters from the character map
  // 2. Extract the indexes of the values we want from our position map
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
