/**
 * Function for reordering keys in case the order is not preserved when loading,
 * or some keys are missing.
 * @param keys keys passed to the dataloader (must be string or numeric)
 * @param results the response from the server/cache containing the data
 * @param keyColumn the column in the response array which corresponds to
 * the key values passed
 * @returns an results (or null) that match the shape of the keys input
 */
export function orderAndMap<
  T extends number | string,
  C extends keyof R,
  R extends { [key in C]: T },
>(keys: readonly T[], results: R[], keyColumn: C): Array<R | null> {
  const resultMapping = results.reduce(
    (keyMap, currentNote) => {
      keyMap[currentNote[keyColumn]] = currentNote;
      return keyMap;
    },
    {} as Record<T, R>,
  );
  return keys.map((key) => resultMapping[key]);
}
