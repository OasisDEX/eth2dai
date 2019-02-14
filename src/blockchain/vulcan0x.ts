import { fromPairs, toPairs } from 'lodash';
import { Observable } from 'rxjs';
import { ajax } from 'rxjs/ajax';
import { map } from 'rxjs/operators';

function filterize(filter: any): string {
  switch (typeof(filter)) {
    case 'number':
      return `${filter}`;
    case 'string':
      return `"${filter}"`;
    case 'object':
      return filter.length === undefined ?
        '{' + toPairs(filter).map(([k, v]) => `${k}: ${filterize(v)}`).join(', ') + '}' :
        '[' + (filter as []).map((v: any) => filterize(v)).join(', ') + ']';
    default:
      throw new Error(`unknown filter type: ${typeof(filter)}`);
  }
}

export function vulcan0x(
  url: string, resource: string, params: {[key: string]: any},
  filter: any, fields: string[], order: string|undefined,
  limit: number|undefined, offset: number|undefined
): Observable<any[]> {
  const options = toPairs({
    ...fromPairs(toPairs(params).map(([k, v]) => [k, filterize(v)]) as any),
    filter: filterize(filter),
    ...order ? { orderBy: order } : {},
    ...limit ? { first: limit } : {},
    ...offset ? { offset } : {},
  }).map(([k, v]) => `${k}: ${v}`).join('\n');
  return ajax({
    url,
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: {
      query:
      '{\n' +
      `    ${resource}(\n${options}\n){\n` +
      `      nodes { ${fields.join(' ')} }\n` +
      '    }\n' +
      '}'
    }
  }).pipe(
    map(({ response }) => {
      if (response.errors && response.errors[0]) {
        console.log('vulcan0x error', response.errors[0]);
        throw new Error(response.errors[0].message);
      }
      return (Object.values(response.data)[0] as {nodes: any[]}).nodes;
    })
  );
}
