import * as React from 'react';
import { Observable, Subscription } from 'rxjs';

export function connect<R, E>(
  WrappedComponent: React.ComponentType<R & E>,
  state$: Observable<R>,
): React.ComponentType<E> {
  return class extends React.Component<E> {
    private subscription!: Subscription;

    public componentWillMount() {
      this.subscription = state$.subscribe(this.setState.bind(this));
    }

    public componentWillUnmount() {
      this.subscription.unsubscribe();
    }

    public render() {
      return <WrappedComponent {...{
        ...(this.state as any),
        ...(this.props as any),
      }} />;
    }
  };
}
