import * as React from 'react';
import { Observable, Subscription } from 'rxjs';

export function connect<R, E = {}>(
  WrappedComponent: React.ComponentType<R & E>,
  state$: Observable<R>,
  dontRenderTooEarly: boolean = true
): React.ComponentType<E> {
  return class extends React.Component<E> {
    private subscription!: Subscription;
    private loaded: boolean = false;

    public componentWillMount() {
      this.subscription = state$.subscribe((v: R) => {
        this.loaded = true;
        this.setState(v);
      });
    }

    public componentWillUnmount() {
      this.subscription.unsubscribe();
    }

    public render() {
      if (dontRenderTooEarly && !this.loaded) {
        return null;
      }
      return <WrappedComponent {...{
        ...(this.props as any),
        ...(this.state as any),
      }} />;
    }
  };
}
