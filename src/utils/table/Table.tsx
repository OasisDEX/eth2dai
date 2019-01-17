import classnames from 'classnames';
import * as React from 'react';

import * as styles from './Table.scss';

export const Table = ({ children, align, scrollable, className }:
      { children: any,
        align?: 'right' | 'left' | 'center',
        scrollable?: any,
        className?: any }) => (
  <table className={ classnames({ [styles.table] : true,
    [styles.extendOnBorders]: true,
    [styles[align || 'left']]: align,
    [styles.scrollable]: scrollable,
    [className]: className
  }) }>
    {children}
  </table>
);

export type RowClickableProps = React.HTMLAttributes<HTMLTableRowElement> & {
  clickable: boolean,
  onClick?: () => void,
  children: any,
  highlighted?: boolean,
};

// Required:
// onClick - function to do on click
// clickable - param if row is clickable; boolean or observable
// Optional: additional custom className, props
export const RowClickable = (props: RowClickableProps) => {
  const { children, onClick, clickable, className, highlighted, ...trProps } = props;
  return (
    <tr
      className={classnames(className, {
        [styles.clickable]: clickable,
        [styles.trHighlighted]: highlighted,
      })}
      onClick={clickable ? onClick : undefined}
      tabIndex={undefined}
      {...trProps}
    >
      {children}
    </tr>
  );
};

export const RowHighlighted = (props: React.HTMLAttributes<HTMLTableRowElement>) => {
  const { children, className, ...trProps } = props;
  return (
    <tr
      className={classnames(styles.trHighlighted, className)}
      {...trProps}
    >
      {children}
    </tr>
  );
};
