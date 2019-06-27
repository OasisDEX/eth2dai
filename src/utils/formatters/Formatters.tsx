import { BigNumber } from 'bignumber.js';
import * as React from 'react';

import { Omit } from '../omit';
import { Currency } from '../text/Text';
import { zero } from '../zero';
import { formatAmount, formatPercent, formatPrice, formatPriceDown, formatPriceUp } from './format';

export type FormatNumberProps = React.HTMLAttributes<HTMLSpanElement> & {
  value: BigNumber;
  token: string;
  formatter?: (v: BigNumber, t: string) => string;
  dontGroup?: boolean;
};
const FormatNumber = (props: FormatNumberProps)  => {
  const { value, token, formatter, dontGroup, ...spanProps } = props;
  const formatted: string = formatter ? formatter(value, token) : value.toString();
  const match = formatted.match(/^-?([\d,]+)((\.)(\d+?\d+?)(0*))?$/);
  const groups = dontGroup ?
    [formatted] :
    !match ?
      [] :
      match[2] ?
        [`${match[1]}${match[3]}${match[4]}`, match[5]] :
        [`${match[1]}.0`];
  return (
    <span title={value.toString()} {...spanProps}>
      {value.lt(zero) ? '-' : ''}
      {groups[0]}
      <span style={{ opacity: 0.4 }}>{groups[1]}</span>
    </span>
  );
};

export type FormatAmountProps = Omit<FormatNumberProps, 'value'> & {
  fallback?: string;
  value?: BigNumber;
  greyedNonSignZeros?: boolean;
};

export const FormatAmount = (props: FormatAmountProps) => {
  const { fallback, value, greyedNonSignZeros, token, formatter, ...spanProps } = props;
  const greyed = greyedNonSignZeros || false; // by default greyed is false
  if (fallback !== undefined && value === undefined) {
    return <span {...spanProps} >{fallback}</span>;
  }
  if (greyed) {
    return <FormatNumber formatter={formatter || formatAmount}
                         value={value as BigNumber}
                         {...props}
    />;
  }
  return <span title={value && value.toString()} {...spanProps}>{
    formatter
      ? formatter(value as BigNumber, token)
      : formatAmount(value as BigNumber, token)
  }</span>;
};

export const FormatPrice: React.SFC<any> = ({ ...props } : any) =>
  <FormatNumber formatter={formatPrice} {...props} />;

export const FormatPriceOrder: React.SFC<any> = ({ kind, ...props } : any) =>
  kind === 'sell' ?
    <FormatNumber formatter={formatPriceUp} {...props} /> :
    <FormatNumber formatter={formatPriceDown} {...props} />;

// Format percent
type FormatPercentProps = React.HTMLAttributes<HTMLSpanElement> & {
  fallback?: string;
  value?: BigNumber;
  precision?: number;
  plus?: boolean;
  multiply?: boolean;
};

// value: BigNumber to format as percent
// fallback: string to show if value is undefined
// precision: format precision, default 0
// plus: boolean, default false; if set to true adds + before positive numbers
// multiply: boolean, default false; if true the value is multiplied by 100 (value 1 means 100%)
// ...props: any props for span
export const FormatPercent = (props: FormatPercentProps) => {
  const { fallback, value, precision, plus, multiply, ...spanProps } = props;
  const v = (fallback && value === undefined) ?
    fallback :
    formatPercent(multiply ?
                            (value as BigNumber).times(new BigNumber('100')) :
                            value as BigNumber,
                  { precision, plus }
    );
  return (<span {...spanProps} >{v}</span>);
};

export const Money = (props: FormatAmountProps) => {
  const { className, style, ...otherProps } = props;
  return (<span className={className} style={style}>
    <FormatAmount data-test-id="amount" {...otherProps} />
    &nbsp;
    <Currency value={otherProps.token}/>
  </span>);
};

export const FormatQuoteToken = (props: { token: string }) => {
  const colors: { [key: string]: string } = {
    DAI: '#FFAC13',
    WETH: '#B15DFF',
  };
  return <span style={{ color: colors[props.token] }}>{props.token}</span>;
};
