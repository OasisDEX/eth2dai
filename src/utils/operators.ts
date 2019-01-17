import { Observable } from 'rxjs';

export const withSingleFrom = <U>(other: Observable<U>) => <T>(source: Observable<T>) =>
  new Observable<[T, U?]>(observer => {
    let latest: T;
    const subscription = source.subscribe({
      next(t) { latest = t; observer.next([t, undefined]); },
      error(err) { observer.error(err); },
      complete() { observer.complete(); }
    });
    subscription.add(other.subscribe({
      next(u) { observer.next([latest, u]); },
      error(err) { observer.error(err); },
      complete() { observer.complete(); }
    }));
    return subscription;
  });

// emits the first item satisfying the predicate and all items not satisfying the predicate
export const firstOfOrTrue = <T>(predicate: (item: T) => boolean) => (source: Observable<T>) =>
  new Observable<T>(observer => {
    let satisfied: boolean = false;
    return source.subscribe({
      next(t) {
        if (predicate(t)) {
          if (!satisfied) observer.next(t);
          satisfied = true;
        } else {
          observer.next(t);
        }
      },
      error(err) { observer.error(err); },
      complete() { observer.complete(); }
    });
  });
