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
  gas?: number;
}

export const wrap: TransactionDef<WrapUnwrapData> = {
  call: (_: WrapUnwrapData, context: NetworkConfig) =>
    context.tokens.WETH.contract.deposit,
  options: ({ amount, gasPrice, gas }: WrapUnwrapData) => ({
    gas,
    gasPrice: gasPrice.toString(),
    value: amountToWei(amount, 'ETH').toFixed(0),
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
  options: ({ gasPrice, gas }) => ({ gas, gasPrice: gasPrice.toString() }),
  kind: TxMetaKind.unwrap,
  prepareArgs: ({ amount }: WrapUnwrapData) =>
    [amountToWei(amount, 'ETH').toFixed(0)],
  description: ({ amount }: WrapUnwrapData) =>
    <React.Fragment>
      Unwrap <Money value={amount} token={'WETH'}/>
    </React.Fragment>,
  descriptionIcon: () => <ETHicon theme="circle"/>
};
