import _ from 'lodash';
import crypto from 'crypto';

//mimicing web repo behavior:
//https://github.com/Pocket/Web/blob/881d5b51646b3ccd0d7f7c7206510f263d9fef03/shared/classes/IntMask.php
// LETTER_INDEX is used in combination with MD5_RANDOMIZER to map the few
// letters returned in an md5, [a-f], into a larger set of characters to
// contribute the the obfuscation, and is less clearly a md5.
type LetterRandomizerOptions = {
  letterIndex: Map<string, number>;
  md5Randomizer: Map<string, string[]>;
};

// Mix up chars from the md5 hash such that it is not so obviously an md5.
class LetterRandomizer {
  private lastChar: string;
  private options: LetterRandomizerOptions;

  constructor(options: LetterRandomizerOptions) {
    this.lastChar = '';
    this.options = options;
  }

  get(char) {
    const lastCharModifier = this.options.letterIndex.get(this.lastChar);
    const result =
      this.options.md5Randomizer.get(char)[lastCharModifier] || char;

    this.lastChar = char;

    return result;
  }
}

type MaskOptions = {
  salt1: string;
  salt2: string;
  letterRandomizerOptions: LetterRandomizerOptions;
};

// Create a 64 character string which can be used to hide values within.
// Maps to PHP: IntMask#randomStringHash
export default class Mask {
  private seed: any;
  private options: MaskOptions;

  constructor(seed, options: MaskOptions) {
    this.seed = seed;
    this.options = options;
  }

  static create(seed, options: MaskOptions) {
    return new this(seed, options).create();
  }

  create() {
    const root = this.getMd5Root();
    const randomizer = new LetterRandomizer(
      this.options.letterRandomizerOptions,
    );

    return _.chain(root)
      .toArray()
      .map(randomizer.get.bind(randomizer))
      .value()
      .join('');
  }

  getMd5Root() {
    return [
      this.getMd5(this.options.salt1),
      this.getMd5(this.options.salt2),
    ].join('');
  }

  getMd5(salt) {
    const str = [this.seed, salt].join('');

    return crypto.createHash('md5').update(str).digest('hex');
  }
}
