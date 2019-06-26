import { BigNumber } from 'bignumber.js';
import classnames from 'classnames';
import * as React from 'react';

import { zero } from '../zero';
import * as styles from './Text.scss';

export const InfoLabel = ({ children, className, ...props }:
      { children: any, className?: string } | any) => (
  <span
    className={classnames({ [styles.infoLabel]: true, [className]: className })}
    {...props}>
    {children}
  </span>
);

export const Muted = ({ children, className, ...props }:
      { children: any, className?: string } | any) => (
  <span
    className={classnames({ [styles.muted]: true, [className]: className })}
    {...props}>
    {children}
  </span>
);

export const RedSpan = ({ children, className }: { children: any, className?: any }) => (
  <span className={classnames({ [styles.redSpan]: true, [className]: className })}>
    {children}
  </span>
);

export const GreenSpan = ({ children, className }: { children: any, className?: any }) => (
  <span className={classnames({ [styles.greenSpan]: true, [className]: className })}>
    {children}
  </span>
);

export const SellBuySpan = ({ children, type }:
                              { children: any, type: string }) => {
  switch (type) {
    case 'sell':
      return (<RedSpan className={styles.buySellSpan}>{children}</RedSpan>);
    case 'buy':
      return (<GreenSpan className={styles.buySellSpan}>{children}</GreenSpan>);
    default:
      return (<span className={styles.buySellSpan}>{children}</span>);
  }
};

// Colored span - red if value is smaller than middleValue, green if is greater
export const BoundarySpan = ({ children, value, middleValue = zero, middleAs = 'neutral' }:
                              { children: any, value: BigNumber,
                                middleValue?: BigNumber,
                                middleAs?: 'greater' | 'lower' | 'neutral' }) => {
  if (middleValue) {
    if (value.gt(middleValue) || (value.eq(middleValue) && middleAs === 'greater')) {
      return (<GreenSpan>{children}</GreenSpan>);
    }
    if (value.lt(middleValue) || (value.eq(middleValue) && middleAs === 'lower')) {
      return (<RedSpan>{children}</RedSpan>);
    }
  }
  return (<span>{children}</span>);
};

export const Currency = ({ value, theme = 'none' }: {
  value: string,
  theme?: 'bold' | 'semi-bold' | 'medium' | 'none'
}) => (
  <span data-test-id="currency" className={classnames(styles.currency, theme)}>{value}</span>
);
