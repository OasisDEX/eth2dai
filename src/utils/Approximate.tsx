import * as React from 'react';

export const Approximate = (props: any) => (
  <span {...props}>
    ~&nbsp;{props.children}
  </span>
);
