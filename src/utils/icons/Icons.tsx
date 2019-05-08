import classnames from 'classnames';
import * as React from 'react';
import { Button, ButtonProps } from '../forms/Buttons';
import * as styles from './Icons.scss';
import { SvgImage } from './utils';

export const InfoIcon = (props: React.HTMLAttributes<HTMLDivElement>) => {
  const { className, ...otherProps } = props;
  return (
    <div
      className={classnames(styles.infoIcon, className)}
      {...otherProps}
    >i</div>
  );
};

export const ButtonIcon = (props: ButtonProps & { image: any }) => {
  const { className, image, ...otherProps } = props;
  return (
    <Button
      size="unsized"
      className={className}
      {...otherProps}>
      <SvgImage className={styles.btnIcon} image={image}/>
    </Button>
  );
};

export type ProgressIconProps = React.HTMLAttributes<HTMLDivElement> & {
  light?: boolean,
  size?: 'sm' | 'lg',
};

export const ProgressIcon = (props: ProgressIconProps) => {
  const { className, light, size, ...otherProps } = props;
  return (
    <div
      className={classnames(styles.progressIcon, className, {
        [styles.progressIconLight]: light,
        [styles.progressIconSm]: size === 'sm',
        [styles.progressIconLg]: size === 'lg',
      })}
      {...otherProps}
    />
  );
};
