import classnames from 'classnames';
import * as React from 'react';

import * as styles from './Icons.scss';

export const InfoIcon = (props: React.HTMLAttributes<HTMLDivElement>) => {
  const { className, ...otherProps } = props;
  return (
    <div
      className={classnames(styles.infoIcon, className)}
      {...otherProps}
    >i</div>
  );
};

export type ProgressIconProps = React.HTMLAttributes<HTMLDivElement> & {
  light?: boolean,
  small?: boolean,
};

export const ProgressIcon = (props: ProgressIconProps) => {
  const { className, light, small, ...otherProps } = props;
  return (
    <div
      className={classnames(styles.progressIcon, className, {
        [styles.progressIconLight]: light,
        [styles.progressIconSm]: small,
      })}
      {...otherProps}
    />
  );
};
