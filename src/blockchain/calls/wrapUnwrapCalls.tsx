import { BigNumber } from 'bignumber.js';
import * as React from 'react';
import { Money } from '../../utils/formatters/Formatters';
import { ETHicon } from '../coinIcons/coinIcons';
import { NetworkConfig } from '../config';
import { amountToWei } from '../utils';
import { TxMetaKind } from './txMeta';

export interface WrapUnwrapData {
  amount: BigNumber;
}

export const wrap = {
  call: (_: WrapUnwrapData, context: NetworkConfig) =>
    context.tokens.WETH.contract.deposit,
  options: ({ amount }: WrapUnwrapData) => ({
    value: amountToWei(amount, 'ETH').toFixed(0),
    gas: 100000,
  }),
  kind: TxMetaKind.wrap,
  prepareArgs: (_: WrapUnwrapData) => [],
  description: ({ amount }: WrapUnwrapData) =>
    <React.Fragment>
      Wrap <Money value={amount} token={'ETH'}/>
    </React.Fragment>,
  descriptionIcon: () => <ETHicon />
};

export const unwrap = {
  call: (_: WrapUnwrapData, context: NetworkConfig) =>
    context.tokens.WETH.contract.withdraw,
  options: () => ({ gas: 100000 }),
  kind: TxMetaKind.unwrap,
  prepareArgs: ({ amount }: WrapUnwrapData) =>
    [amountToWei(amount, 'ETH').toFixed(0)],
  description: ({ amount }: WrapUnwrapData) =>
    <React.Fragment>
      Unwrap <Money value={amount} token={'WETH'}/>
    </React.Fragment>,
  descriptionIcon: () => <ETHicon />
};
