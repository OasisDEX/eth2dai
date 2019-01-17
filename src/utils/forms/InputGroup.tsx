import * as React from 'react';

import classnames from 'classnames';
import * as styles from './InputGroup.scss';

type InputGroupProps =
  React.HTMLAttributes<HTMLDivElement> &
  { color?: 'red' | 'grey',
    sizer?: 'sm' | 'md' | 'lg' | 'unsized',
    disabled?: boolean,
    hasError?: boolean };

export const InputGroup = (props: InputGroupProps) => {
  const { children, className, color, sizer, hasError, disabled, ...otherProps } = props;
  return (
    <div className={classnames(styles.inputGroup,
                               className,
                               styles[color || 'grey'], {
                                 [styles.red]: hasError,
                                 [styles.disabled]: disabled,
                                 [styles[sizer || 'unsized']]: sizer !== undefined && sizer,
                               }
      )} {...otherProps}>
      {children}
    </div>
  );
};

export const InputGroupAddon = ({ children, className, border, ...props }:
                                  { children: any,
                                    className?: string,
                                    border: 'left' | 'right' | 'none' | 'both'
                                  } | any) => (
  <div className={classnames(styles.addon, {
    [styles.inputGroupAddonBorderRight] : ['right', 'both'].includes(border),
    [styles.inputGroupAddonBorderLeft] : ['left', 'both'].includes(border),
    [className]: className })} {...props}>
    {children}
  </div>
);
