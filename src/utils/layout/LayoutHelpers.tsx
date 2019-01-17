import classnames from 'classnames';
import * as React from 'react';

import * as styles from './LayoutHelpers.scss';

type BorderBoxProps =
  React.HTMLAttributes<HTMLDivElement> &
  {
    className?: any,
    children?: any,
    padding?: 'md' | 'sm' | 'none',
  };

type Padding = 'smPadding' | 'mdPadding' | 'nonePadding';

export const BorderBox = ({ className, children, padding, ...props }: BorderBoxProps) => {
  const paddingStyle = (padding || 'md') + 'Padding' as Padding;
  return (
    <div
      className={classnames(styles.borderBox, styles[paddingStyle], className)}
      {...props}
    >
      {children}
    </div>
  );
};

type HrColor = 'lightHr' | 'darkHr';

type HrProps =
React.HTMLAttributes<HTMLHRElement> & {
  color?: 'light' | 'dark',
  className?: any,
};

export const Hr = ({ color, className, ...props }: HrProps) => {
  const colorHr = (color || 'light') + 'Hr' as HrColor;
  return (<hr
    className={classnames(styles.hr, styles[colorHr], className)}
    {...props}
  />);
};
