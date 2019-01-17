import * as React from 'react';

export const FlexLayoutRow = ({ children }: { children: any }) => (
  <div
    style={{
      display: 'flex',
      marginBottom: '24px',
      justifyContent: 'space-between',
      // flexWrap: 'wrap'
    }}
  >
    {children}
  </div>
);
