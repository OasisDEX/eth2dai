import * as React from 'react';

export function inject<A, B extends {}>(
  Wrapped: React.ComponentType<A & B>,
  props: B
): React.ComponentType<A> {
  return class extends React.Component<A> {
    public render() {
      return <Wrapped { ...{ ...props as any, ...this.props as any } }/>;
    }
  };
}
