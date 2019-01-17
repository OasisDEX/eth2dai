import classnames from 'classnames';
import * as React from 'react';

import { ProgressIcon } from '../icons/Icons';
import * as styles from './Slider.scss';

type SliderProps =
  React.ButtonHTMLAttributes<HTMLButtonElement>
  & { disabled?: boolean,
    moveOnHover?: boolean,
    blocked: boolean,
    className?: string,
    inProgress?: boolean,
  };

export function Slider(props: SliderProps) {
  const { blocked, moveOnHover, inProgress, disabled, className, ...selectProps } = props;

  return <button className={classnames(
    styles.wrapper,
    className,
    {
      [styles.disabled]: disabled,
      [styles.moveOnHover]: moveOnHover,
    }
    )}
    disabled={disabled}
    tabIndex={disabled ? undefined : 0}
    { ...selectProps }
  >
    <div className={classnames(
      styles.pointer,
      {
        [styles.pointerBlocked]: blocked,
        [styles.pointerUnblocked]: !blocked,
        [styles.inProgress]: inProgress,
      }
    )}
    data-toggle-state={ blocked ? 'disabled' : 'enabled'}
    data-test-id="toggle-button-state"/>
    {inProgress &&
      <ProgressIcon
        light={true}
        small={true}
        className={classnames(
          styles.progressIcon, {
            [styles.progressBlocked]: blocked,
            [styles.progressUnblocked]: !blocked,
          }
          )
        }/>
    }
  </button>;
}
