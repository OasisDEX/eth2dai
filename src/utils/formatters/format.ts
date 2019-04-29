import { BigNumber } from 'bignumber.js';
import * as moment from 'moment';

import { tokens } from '../../blockchain/config';

BigNumber.config({
  FORMAT: {
    decimalSeparator: '.',
    groupSeparator: ',',
    groupSize: 3,
    secondaryGroupSize: 0,
    fractionGroupSeparator: ' ',
    fractionGroupSize: 0,
  },
});

export function formatAmount(amount: BigNumber, token: string): string {
  const digits = token === 'USD' ? 2 : tokens[token].digits;
  return amount.toFormat(digits, BigNumber.ROUND_DOWN);
}

export function formatPrice(amount: BigNumber, token: string): string {
  return amount.toFormat(tokens[token].digits, BigNumber.ROUND_HALF_UP);
}

export function formatPriceUp(amount: BigNumber, token: string): string {
  return amount.toFormat(tokens[token].digits, BigNumber.ROUND_UP);
}

export function formatPriceDown(amount: BigNumber, token: string): string {
  return amount.toFormat(tokens[token].digits, BigNumber.ROUND_DOWN);
}

export function formatPrecision(amount: BigNumber, precision: number): string {
  return amount.toFormat(precision, BigNumber.ROUND_DOWN);
}

export function formatPercent(number: BigNumber, { precision = 0, plus = false } = {}) {
  return (plus && number.isGreaterThan(0) ? '+' : '') + String(number.toFixed(precision)) + '%';
}

export function formatDateTime(time: Date, showMs?: boolean): string {
  return moment(time).format(showMs ? 'DD.MM HH:mm:ss' : 'DD.MM HH:mm');
}
