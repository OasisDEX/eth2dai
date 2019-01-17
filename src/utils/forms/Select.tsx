import classnames from 'classnames';
import * as React from 'react';

import * as styles from './Select.scss';

type SelectProps =
  React.SelectHTMLAttributes<HTMLSelectElement>
  & { bordered?: boolean,
    sizer?: 'sm' | 'md' | 'lg' | 'unsized',
    wrapperClassName?: string,
    dataTestId?: string,
  };

export function Select(props: SelectProps) {
  const { style, bordered, sizer, className, wrapperClassName, disabled, ...selectProps } = props;

  return <div className={classnames(
              styles.wrapper, wrapperClassName, {
                [styles.wrapperBordered]: bordered,
                [styles.disabled]:  disabled ,
                [styles[sizer || 'unsized']]: sizer !== undefined && sizer }
                )}
              style={style}>
    <select className={classnames(styles.select, className)}
            disabled={disabled}
            {...selectProps}>
      {props.children}
    </select>
  </div>;
}
