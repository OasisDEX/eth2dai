import { BigNumber } from 'bignumber.js';
import * as React from 'react';

import { Money } from '../../utils/formatters/Formatters';
import { NetworkConfig } from '../config';
import { amountFromWei, amountToWei } from '../utils';
import { CallDef, TransactionDef } from './callsHelpers';
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

export interface GetBuyAmountData {
  sellToken: string;
  buyToken: string;
  amount: BigNumber;
}

export const getBuyAmount: CallDef<GetBuyAmountData, BigNumber> = {
  call: (_: GetBuyAmountData, context: NetworkConfig) => {
    return context.otc.contract.getBuyAmount;
  },
  prepareArgs: ({ sellToken, buyToken, amount }: GetBuyAmountData, context: NetworkConfig) => [
    context.tokens[buyToken].address,
    context.tokens[sellToken].address,
    amountToWei(amount, sellToken).toFixed(0)
  ],
  postprocess: (result, { sellToken }) => amountFromWei(result, sellToken),
};

export interface GetPayAmountData {
  sellToken: string;
  buyToken: string;
  amount: BigNumber;
}

export const getPayAmount: CallDef<GetPayAmountData, BigNumber> = {
  call: (_: GetPayAmountData, context: NetworkConfig) => {
    return context.otc.contract.getPayAmount;
  },
  prepareArgs: ({ sellToken, buyToken, amount }: GetPayAmountData, context: NetworkConfig) => [
    context.tokens[sellToken].address,
    context.tokens[buyToken].address,
    amountToWei(amount, sellToken).toFixed(0)
  ],
  postprocess: (result: BigNumber, { buyToken }: GetPayAmountData) => amountFromWei(result, buyToken),
};

export interface GetBestOfferData {
  sellToken: string;
  buyToken: string;
}

export const getBestOffer: CallDef<GetBestOfferData, BigNumber> = {
  call: (_: GetBestOfferData, context: NetworkConfig) => {
    return context.otc.contract.getBestOffer;
  },
  prepareArgs: ({ sellToken, buyToken }: GetBestOfferData, context: NetworkConfig) => [
    context.tokens[sellToken].address,
    context.tokens[buyToken].address,
  ],
};

type OffersData = BigNumber;

export const offers: CallDef<OffersData, any> = {
  call: (_: OffersData, context: NetworkConfig) => {
    return context.otc.contract.offers;
  },
  prepareArgs: (offerId: OffersData) => [offerId],
};
