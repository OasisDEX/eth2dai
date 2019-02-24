import { BigNumber } from 'bignumber.js';
import * as React from 'react';

import { Money } from '../../utils/formatters/Formatters';
import { NetworkConfig } from '../config';
import { TransactionDef } from './callsHelpers';
import { TxMetaKind } from './txMeta';

type InstantOrderKind = 'buy' | 'sell';

export interface InstantOrderData {
  kind: InstantOrderKind;
  buyAmount: BigNumber;
  sellAmount: BigNumber;
  buyToken: string;
  sellToken: string;
  gasPrice: BigNumber;
  gasEstimation: number;
}

export const instantOrder: TransactionDef<InstantOrderData> = {
  call: ({ kind, buyToken, sellToken }: InstantOrderData, context: NetworkConfig) => {
    const fn = `${kind === 'buy' ? 'buyAllAmount' : 'sellAllAmount'}${buyToken === 'ETH' ? 'BuyEth' : ''}${sellToken === 'ETH' ? 'PayEth' : ''}`;
    return context.directProxyCreationAndExecute.contract[fn];
  },
  prepareArgs: ({ kind, buyToken, buyAmount, sellToken, sellAmount }: InstantOrderData, context: NetworkConfig) => [
    context.otc.address,
    ...kind === 'buy' ?
      ([
        ...buyToken === 'ETH' ? [] : [buyToken], buyAmount,
        ...sellToken === 'ETH' ? [] : [sellToken], sellAmount,
      ]) :
      ([
        ...sellToken === 'ETH' ? [] : [sellToken], sellAmount,
        ...buyToken === 'ETH' ? [] : [buyToken], buyAmount,
      ]),
  ],
  options: ({ gasPrice, gasEstimation }: InstantOrderData) => ({
    gasPrice: gasPrice.toFixed(0),
    gas: gasEstimation,
  }),
  kind: TxMetaKind.instantOrder,
  description: ({ kind, buyToken, buyAmount, sellToken, sellAmount }: InstantOrderData) => kind === 'sell' ?
    <>
      Create Sell Order <Money value={sellAmount} token={sellToken}/>
    </> :
    <>
      Create Buy Order <Money value={buyAmount} token={buyToken}/>
    </>,
};
