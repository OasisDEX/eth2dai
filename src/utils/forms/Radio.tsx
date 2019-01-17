import * as React from 'react';

import classnames from 'classnames';
import * as styles from './Radio.scss';

type RadioProps =
  React.HTMLAttributes<HTMLInputElement> & {
    // sizer?: 'sm',
    hasError?: boolean,
    name: string,
    value?: string | string[] | number;
    checked?: boolean;
    disabled?: boolean;
    dataTestId?: string
  };

export const Radio = (props: RadioProps) => {
  const { children, className, hasError, dataTestId, ...otherProps } = props;

  return (
    <label className={classnames(
      styles.radio,
      className,
      {
        [styles.hasError]: hasError,
      })}
           data-test-id={dataTestId}
    >
      <input
        type="radio"
        {...otherProps}
      />
      <span>
        { children }
      </span>
    </label>
  );
};
