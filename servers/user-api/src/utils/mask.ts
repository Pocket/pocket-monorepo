import _ from 'lodash';
import crypto from 'crypto';

//mimicing web repo behavior:
//https://github.com/Pocket/Web/blob/881d5b51646b3ccd0d7f7c7206510f263d9fef03/shared/classes/IntMask.php
// LETTER_INDEX is used in combination with MD5_RANDOMIZER to map the few
// letters returned in an md5, [a-f], into a larger set of characters to
// contribute the the obfuscation, and is less clearly a md5.
const LETTER_INDEX = new Map([
  ['a', 0],
  ['b', 1],
  ['c', 2],
  ['d', 3],
  ['e', 4],
  ['f', 5],
  ['0', 6],
]);

const MD5_RANDOMIZER = new Map([
  ['0', ['0']],
  ['1', ['1']],
  ['2', ['2']],
  ['3', ['3']],
  ['4', ['4']],
  ['5', ['5']],
  ['6', ['6']],
  ['7', ['7']],
  ['8', ['8']],
  ['9', ['9']],
  ['a', ['K', 'd', 'q', 'S', 'W', 'v', 'x', 'C', 'J']], // the 8th column will never be used
  ['b', ['X', 'z', 'Q', 't', 'b', 'Y', 'G', 'a', 'w']],
  ['c', ['N', 's', 'U', 'r', 'P', 'u', 'V', 'L', 'E']],
  ['d', ['f', 'T', 'p', 'k', 'j', 'I', 'l', 'A', 'B']],
  ['e', ['o', 'y', 'H', 'i', 'D', 'R', 'Z', 'c']],
  ['f', ['M', 'O', 'F', 'h', 'm', 'n', 'g', 'e']],
]);

// Mix up chars from the md5 hash such that it is not so obviously an md5.
class LetterRandomizer {
  private lastChar: string;

  constructor() {
    this.lastChar = '';
  }

  get(char) {
    const lastCharModifier = LETTER_INDEX.get(this.lastChar);
    const result = MD5_RANDOMIZER.get(char)[lastCharModifier] || char;

    this.lastChar = char;

    return result;
  }
}

// Create a 64 character string which can be used to hide values within.
// Maps to PHP: IntMask#randomStringHash
export default class Mask {
  private seed: any;

  constructor(seed) {
    this.seed = seed;
  }

  static create(seed) {
    return new this(seed).create();
  }

  create() {
    const root = this.getMd5Root();
    const randomizer = new LetterRandomizer();

    return _.chain(root)
      .toArray()
      .map(randomizer.get.bind(randomizer))
      .value()
      .join('');
  }

  getMd5Root() {
    return [this.getMd5('nw333-1'), this.getMd5('nw333-2')].join('');
  }

  getMd5(salt) {
    const str = [this.seed, salt].join('');

    return crypto.createHash('md5').update(str).digest('hex');
  }
}
