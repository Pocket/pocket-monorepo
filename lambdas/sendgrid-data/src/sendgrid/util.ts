export function* chunkArray(array: any, batch_size: number): Generator<[]> {
  for (let i = 0; i < array.length; i += batch_size) {
    yield array.slice(i, i + batch_size);
  }
}
