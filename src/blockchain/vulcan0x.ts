import { toPairs } from 'lodash';
import { Observable } from 'rxjs';
import { ajax } from 'rxjs/ajax';
import { map } from 'rxjs/operators';

function filterize(filter: any): string {
  switch (typeof(filter)) {
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
  url: string, resource: string,
  filter: any, fields: string[], order: string
): Observable<any[]> {
  return ajax({
    url,
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: {
      query:
      '{\n' +
      `    ${resource}(\n` +
      `      filter: ${filterize(filter)}\n` +
      `      orderBy: ${order}\n` +
      '    ){\n' +
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
