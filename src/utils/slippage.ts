import { BigNumber } from 'bignumber.js';
import { NetworkConfig } from '../blockchain/config';

export const getSlippageLimit = (context: NetworkConfig, quotation: string): BigNumber =>
  // @ts-ignore
  new BigNumber(context.thresholds[quotation
    .split('/')
    .join('').toLowerCase()] || 0.02);
