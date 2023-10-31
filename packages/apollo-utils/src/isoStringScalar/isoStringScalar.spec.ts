import { DateTime } from 'luxon';
import { Kind } from 'graphql';
import { isoStringScalar } from './isoStringScalar';

const isoESTDateStr = '2023-02-11T13:39:48.000-05:00';
const isoESTDateObj = new Date(isoESTDateStr);
const isoNoTzDateStr = '2023-02-11T18:39:48.000';
const isoUTCDateStr = '2023-02-11T18:39:48.000Z';
const isoUTCDateObj = new Date(isoUTCDateStr);
const mysqlDateStr = '2008-10-21 13:57:01';
const mysqlDateObj = DateTime.fromSQL(mysqlDateStr, { zone: 'UTC' }).toJSDate(); // this is a stand-in for expected data layer behavior
const mysqlNullDateStr = '0000-00-00 00:00:00';
const mysqlNullDateObj = new Date(mysqlNullDateStr);
const otherDateStr = '10/21/2008';

describe('isoStringScalar', () => {
  describe('serialize', () => {
    it('valid MySql client UTC-explicit TS Date object in, UTC ISOString out', async () => {
      const result = isoStringScalar.serialize(isoUTCDateObj);
      expect(result).toBe(isoUTCDateStr);
    });
    it('valid MySql client EST-explicit TS Date object in, UTC ISOString out', async () => {
      const result = isoStringScalar.serialize(isoESTDateObj);
      expect(result).toBe(isoUTCDateStr);
    });
    it('valid MySql client UTC-implicit TS Date object in, UTC ISOString out', async () => {
      const result = isoStringScalar.serialize(mysqlDateObj);
      expect(result).toBe('2008-10-21T13:57:01.000Z');
    });
    it('null in, null out', async () => {
      const result = isoStringScalar.serialize(null);
      expect(result).toBe(null);
    });
    it('invalid 0000-00-00 MySql client TS Date object in, Error out', async () => {
      expect(() => {
        isoStringScalar.serialize(mysqlNullDateObj);
      }).toThrow('Invalid Data Store Response: invalid Date object');
    });
    it('invalid string type in, error out', async () => {
      expect(() => {
        isoStringScalar.serialize(otherDateStr);
      }).toThrow(
        'GraphQL ISOString Scalar serializer expected a `Date` object or null',
      );
    });
  });

  describe('parseValue', () => {
    it('valid UTC-explicit String in, TS Date object out', async () => {
      const result = isoStringScalar.parseValue(isoUTCDateStr);
      expect(result).toStrictEqual(isoUTCDateObj);
    });
    it('valid empty string in, null out', async () => {
      const result = isoStringScalar.parseValue('');
      expect(result).toBe(null);
    });
    it('valid null in, null out', async () => {
      const result = isoStringScalar.parseValue(null);
      expect(result).toBe(null);
    });
    it('invalid 0000-00-00 string in, error out', async () => {
      expect(() => {
        isoStringScalar.parseValue(mysqlNullDateStr);
      }).toThrow(
        'Invalid User Input: ISOString Scalar parse expected a UTC-based, ISO-8601-compliant string',
      );
    });
    it('invalid EST-explicit String in, error out', async () => {
      expect(() => {
        isoStringScalar.parseValue(isoESTDateStr);
      }).toThrow(
        'Invalid User Input: ISOString Scalar parse expected a UTC-based, ISO-8601-compliant string',
      );
    });
    it('invalid ISO with no TZ String in, error out', async () => {
      expect(() => {
        isoStringScalar.parseValue(isoNoTzDateStr);
      }).toThrow(
        'Invalid User Input: ISOString Scalar parse expected a UTC-based, ISO-8601-compliant string',
      );
    });
    it('invalid MySQL String in, error out', async () => {
      expect(() => {
        isoStringScalar.parseValue(mysqlDateStr);
      }).toThrow(
        'Invalid User Input: ISOString Scalar parse expected a UTC-based, ISO-8601-compliant string',
      );
    });
    it('invalid other string in, error out', async () => {
      expect(() => {
        isoStringScalar.parseValue(otherDateStr);
      }).toThrow(
        'Invalid User Input: ISOString Scalar parse expected a UTC-based, ISO-8601-compliant string',
      );
    });
    it('invalid other data type in, error out', async () => {
      expect(() => {
        isoStringScalar.parseValue(1234);
      }).toThrow(
        'Invalid User Input: ISOString Scalar parse expected a value of type string or null',
      );
    });
  });

  describe('parseLiteral', () => {
    it('valid UTC-explicit AST String in, TS Date object out', async () => {
      const result = isoStringScalar.parseLiteral({
        kind: Kind.STRING,
        value: isoUTCDateStr,
      });
      expect(result).toStrictEqual(isoUTCDateObj);
    });
    it('valid empty AST String in, null out', async () => {
      const result = isoStringScalar.parseLiteral({
        kind: Kind.STRING,
        value: '',
      });
      expect(result).toStrictEqual(null);
    });
    it('invalid 0000-00-00 AST String in, error out', async () => {
      expect(() => {
        isoStringScalar.parseLiteral({
          kind: Kind.STRING,
          value: mysqlNullDateStr,
        });
      }).toThrow(
        'Invalid User Input: ISOString Scalar parse expected a UTC-based, ISO-8601-compliant string',
      );
    });
    it('valid EST-explicit AST String in, TS Date object out', async () => {
      expect(() => {
        isoStringScalar.parseLiteral({
          kind: Kind.STRING,
          value: isoESTDateStr,
        });
      }).toThrow(
        'Invalid User Input: ISOString Scalar parse expected a UTC-based, ISO-8601-compliant string',
      );
    });
    it('invalid ISO no TZ String in, error out', async () => {
      expect(() => {
        isoStringScalar.parseLiteral({
          kind: Kind.STRING,
          value: isoNoTzDateStr,
        });
      }).toThrow(
        'Invalid User Input: ISOString Scalar parse expected a UTC-based, ISO-8601-compliant string',
      );
    });
    it('invalid MySQL AST String in, error out', async () => {
      expect(() => {
        isoStringScalar.parseLiteral({
          kind: Kind.STRING,
          value: mysqlDateStr,
        });
      }).toThrow(
        'Invalid User Input: ISOString Scalar parse expected a UTC-based, ISO-8601-compliant string',
      );
    });
    it('invalid other AST String in, error out', async () => {
      expect(() => {
        isoStringScalar.parseLiteral({
          kind: Kind.STRING,
          value: otherDateStr,
        });
      }).toThrow(
        'Invalid User Input: ISOString Scalar parse expected a UTC-based, ISO-8601-compliant string',
      );
    });
  });
});
