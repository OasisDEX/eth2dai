export function withPrevious(array: any[]): any[] {
  return array.reduce(
    ({ result, last }, item) => ({ result: result.concat([[item, last]]), last: item }),
    { result: [] }
  ).result;
}

export function withNext<T>(array: T[]): Array<[T, T?]> {
  return array.reduceRight<{ result: Array<[T, T?]>, last?: T }>(
    ({ result, last }, item) => ({ result: [[item, last], ...result], last: item }),
    { result: [] }
  ).result;
}
