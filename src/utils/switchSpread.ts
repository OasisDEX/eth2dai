import { Observable, Subscription } from 'rxjs';

export function switchSpread<C, S>(
  switchFn: (previousState: S, state: S) => Observable<C> | undefined,
  spreadFn: (state: S, crumb: C | undefined) => S
) {
  return (source: Observable<S>) => {
    return new Observable<S>(
      subscriber => {
        let innerSub: Subscription | undefined;
        let previousCrumb: C | undefined;
        let previousState: S | undefined;

        source.subscribe({
          next(state: S) {
            try {
              const result = switchFn(previousState || state, state);
              previousState = state;
              if (!result) {
                return subscriber.next(spreadFn(state, previousCrumb));
              }
              const crumb$: Observable<C> = result;

              if (innerSub) {
                innerSub.unsubscribe();
              }
              innerSub = crumb$.subscribe({
                next(innerCrumb) {
                  subscriber.next(spreadFn(previousState!, innerCrumb));
                  previousCrumb = innerCrumb;
                },
                error(err) {
                  subscriber.error(err);
                }
              });
            } catch (err) {
              subscriber.error(err);
              return;
            }

          },
          error(err) {
            subscriber.error(err);
          },
          complete() {
            subscriber.complete();
          }
        });
      }
    );
  };
}
