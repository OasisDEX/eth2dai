import * as React from 'react';

import classnames from 'classnames';
import * as styles from './Checkbox.scss';

type CheckboxProps =
  React.HTMLAttributes<HTMLInputElement> & {
    name: string,
    value?: string | string[] | number;
    checked?: boolean;
    disabled?: boolean;
    dataTestId?: string
  };

export const Checkbox = (props: CheckboxProps) => {
  const { children, className, dataTestId, ...otherProps } = props;

  return (
    <label className={classnames(
      styles.checkbox,
      className
    )}
           data-test-id={dataTestId}
    >
      <input
        type="checkbox"
        {...otherProps}
      />
      <span>{children}</span>
    </label>
  );
};
