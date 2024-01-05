type AsyncFunction<O> = (...args: any[]) => Promise<O>;

interface TimeItOptions {
  // Function identifier for console logging
  name?: string;
  // How many times to re-run the function
  // Default = 100
  times?: number;
  // Whether to return all timing data to the calling function.
  // Default = false;
  returnValues?: boolean;
  // Whether to print logging data to the console
  // Deafult = true;
  printToConsole?: boolean;
}

/**
 * Factory function for repeatedly calling an async method and reporting
 * time taken to execute (in ms). By default, prints a summary to the
 * console (min, max, average). This can be disabled by setting
 * `option.printToConsole` to false.
 * Option to return all values by setting `options.returnValues` to `true`.
 * Use with function currying.
 *
 * Example:
 * ```
 * import { setTimeout } from timers/promises;
 * // Writes summary data to the console by default
 * const options = { name: 'sleep', times: 10 };
 * await timeIt(setTimeout, options)(10) // sleeps for 10 seconds, 10 times
 * ```
 * @param callback function to invoke, for timing
 * @param options TimeItOptions
 * @returns array of numbers with length `options.time` if `options.returnvalues`
 * is `true`; otherwise `undefined`.
 */
export function timeIt(
  callback: AsyncFunction<any>,
  options: TimeItOptions
): AsyncFunction<undefined | number[]> {
  return async function wrapper(...args: any[]) {
    const {
      name = 'function',
      times = 100,
      returnValues = false,
      printToConsole = true,
    } = options;
    const timeRecords = Array(times);
    let n = 0;
    let min = Infinity;
    let max = 0;
    while (n < times) {
      const start = Date.now();
      await callback(...args);
      const end = Date.now();
      const time = end - start;
      timeRecords[n] = time;
      if (time < min) {
        min = time;
      }
      if (time > max) {
        max = time;
      }
      n++;
    }
    const average =
      timeRecords.reduce((total, curr) => total + curr, 0) / times;
    if (printToConsole) {
      console.log(
        `${name}: average ${average} ms over ${times} trials (min: ${min}, max: ${max})`
      );
    }
    if (returnValues) {
      return timeRecords;
    }
  };
}
