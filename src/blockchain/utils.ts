import { BigNumber } from 'bignumber.js';

import { tokens } from './config';

export function amountFromWei(amount: BigNumber, token: string): BigNumber {
  return amount.div(new BigNumber(10).pow(tokens[token].precision));
}

export function amountToWei(amount: BigNumber, token: string): BigNumber {
  return amount.times(new BigNumber(10).pow(tokens[token].precision));
}
