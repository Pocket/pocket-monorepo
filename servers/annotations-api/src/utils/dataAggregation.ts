interface IndexableObject {
  [index: string | number | symbol]: any;
}

interface NumericObject {
  [index: string | number | symbol]: number;
}

/**
 * Given a list of indexable objects of type T and key Key, group by key and return
 * aggregated count.
 * Example:
 * `groupByCount([{id: 'a'}, {id: 'b'}, {id: 'a'}])` returns `{'a': 2, 'b': 1}`
 * @param data list of objects, minimally with property `key`
 * @param key the key to group by
 * @returns Record with count of objects in `data` grouped by key
 */
export function groupByCount<T extends IndexableObject, Key extends keyof T>(
  data: T[],
  key: Key,
): Record<T[Key], number> {
  return data.reduce(
    (counts, element) => {
      if (key in element) {
        counts[element[key]] != null
          ? (counts[element[key]] += 1)
          : (counts[element[key]] = 1);
      }
      return counts;
    },
    {} as Record<T[Key], number>,
  );
}

/**
 * Given two objects that contain numeric values, return a single object which
 * sums the values by key. The objects need not contain only the same keys.
 * Example:
 * `sumByKey({a: 5, b: 10}, {a: 1, b: 2, c: 4})` returns `{a: 6, b: 12, c: 4}`
 * @param base the first object to sum
 * @param addition the second object to sum
 */
export function sumByKey<T extends NumericObject, Key extends keyof T>(
  base: T | undefined,
  addition: T | undefined,
): Record<T[Key], number> {
  if (addition == null) {
    return { ...base };
  }
  return Object.entries(addition).reduce(
    (total, [key, value]) => {
      total[key] != null ? (total[key] += value) : (total[key] = value);
      return total;
    },
    { ...base } as Record<T[Key], number>,
  );
}
