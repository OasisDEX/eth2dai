import { BigNumber } from 'bignumber.js';
import * as React from 'react';
import { Money } from '../../utils/formatters/Formatters';
import { ETHicon } from '../coinIcons/coinIcons';
import { NetworkConfig } from '../config';
import { amountToWei } from '../utils';
import { TransactionDef } from './callsHelpers';
import { TxMetaKind } from './txMeta';

export interface WrapUnwrapData {
  amount: BigNumber;
  gasPrice: BigNumber;
}

export const wrap: TransactionDef<WrapUnwrapData> = {
  call: (_: WrapUnwrapData, context: NetworkConfig) =>
    context.tokens.WETH.contract.deposit,
  options: ({ amount, gasPrice }: WrapUnwrapData) => ({
    gasPrice,
    value: amountToWei(amount, 'ETH').toFixed(0),
    gas: 100000,
  }),
  kind: TxMetaKind.wrap,
  prepareArgs: (_: WrapUnwrapData) => [],
  description: ({ amount }: WrapUnwrapData) =>
    <React.Fragment>
      Wrap <Money value={amount} token={'ETH'}/>
    </React.Fragment>,
  descriptionIcon: () => <ETHicon theme="circle"/>
};

export const unwrap: TransactionDef<WrapUnwrapData> = {
  call: (_: WrapUnwrapData, context: NetworkConfig) =>
    context.tokens.WETH.contract.withdraw,
  options: ({ gasPrice }) => ({ gasPrice, gas: 100000 }),
  kind: TxMetaKind.unwrap,
  prepareArgs: ({ amount }: WrapUnwrapData) =>
    [amountToWei(amount, 'ETH').toFixed(0)],
  description: ({ amount }: WrapUnwrapData) =>
    <React.Fragment>
      Unwrap <Money value={amount} token={'WETH'}/>
    </React.Fragment>,
  descriptionIcon: () => <ETHicon theme="circle"/>
};
