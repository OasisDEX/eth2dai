import * as React from 'react';

import * as styles from './FlexLayoutRow.scss';

export const FlexLayoutRow = ({ children }: { children: any }) => (
  <div className={styles.flr}>
    {children}
  </div>
);
