import classnames from 'classnames';
import * as React from 'react';

import * as styles from './Buttons.scss';

export type ButtonProps =
  React.ButtonHTMLAttributes<HTMLButtonElement> &
  {  color?: 'green' | 'red' | 'grey' | 'white' | 'greyWhite' | 'whiteOutlined',
    size?: 'xs' | 'md' | 'sm' | 'lg' | 'unsized',
    block?: boolean,
    dataTestId?: string
  };

export const Button = (props: ButtonProps) => {
  const { children, className, color, size, block, ...btnProps } = props;
  return (
  <button
  className={classnames(styles.button,
                        styles[color || 'grey'],
                        className, {
                          [styles.block]: block !== undefined && block,
                          [styles[size || 'unsized']]: size !== undefined && size
                        }
  )}
    {...btnProps}
  >
    {children}
  </button>
  );
};

type ButtonGroupProps =
  React.HTMLAttributes<HTMLDivElement> &
  { className?: any,
    children: any,
  };
export const ButtonGroup = (props: ButtonGroupProps) => {
  const { children, className, ...btnGroupProps } = props;
  return (
  <div
    className={classnames(styles.buttonGroup, className)}
    {...btnGroupProps}
  >
    { children }
  </div>);
};

export const Buttons = ({ onClick, className, children, ...props }:
                        { onClick: any, className?: string } | any) => (
  <button
    onClick={ onClick }
    className={classnames({ [styles.actionButton]: true, [className]: className })}
    {...props}>
    { children }
  </button>
);

export const CloseButton = (props: any) => {
  const { className, ...otherProps } = props;
  return (
    <Buttons
      className={classnames(styles.close, className)}
      {...otherProps}
    >
      &times;
    </Buttons>
  );
};
