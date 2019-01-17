import { Observable } from 'rxjs/index';

export function unpack<T>(o: Observable<T>): any {

  let r;

  o.subscribe(
    v => { r = v; },
    e => {
      console.log('error', e, typeof(e));
      r = e;
    }
    );

  console.assert(r !== undefined);

  return r;
}
