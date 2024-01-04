// Ensure only an indexible type on the object is used for reordering results,
// and that the key matches
type ReorderMap<T, K extends keyof T> = {
  key: K;
  values: T[K] extends string | number | symbol ? T[K][] : never;
};

/**
 * Utility function for reordering results. Given a mapping
 * of key name and values by which the result should be ordered,
 * return a reordered list of results.
 * @param reorderMap A mapping of the key (attribute) of the
 * result set to order by, and a list of values by which the
 * result should be ordered
 * @param results results to be reordered
 * @returns results, but ordered to match the order of `values`
 * indexed by `key`.
 */
export function reorderResultByKey<T, K extends keyof T>(
  reorderMap: ReorderMap<T, K>,
  results: T[],
): T[] {
  const resMap = results.reduce((acc, element) => {
    acc[element[reorderMap.key]] = element;
    return acc;
  }, {} as any); // idk... help me with this index type
  return reorderMap.values.map((input) => resMap[input]);
}
