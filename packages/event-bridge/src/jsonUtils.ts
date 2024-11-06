import { isArray, isEmpty, isObject, transform } from 'lodash';

/**
 * For a given object, remove all empty objects from it
 * @param obj Object to remove empty objects from
 * @returns Object that has all empty objects removed {}
 */
export const removeEmptyObjects = (obj: Record<string, any>): any => {
  if (isArray(obj)) {
    // Recursively clean each element in the array
    return obj
      .map(removeEmptyObjects) // Apply cleaning to each element
      .filter(
        (value) => !(isObject(value) && !isArray(value) && isEmpty(value)),
      ); // Remove empty objects
  } else if (isObject(obj) && !isArray(obj)) {
    // Recursively clean each property in the object
    return transform(
      obj,
      (result, value, key) => {
        const cleanedValue = removeEmptyObjects(value);
        if (
          !(
            isObject(cleanedValue) &&
            !isArray(cleanedValue) &&
            isEmpty(cleanedValue)
          )
        ) {
          result[key] = cleanedValue;
        }
      },
      {},
    );
  }
  return obj; // Return the value if it's neither an array nor an object
};
