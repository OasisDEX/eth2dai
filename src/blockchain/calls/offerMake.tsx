import { BigNumber } from 'bignumber.js';
import * as React from 'react';
import { Error } from 'tslint/lib/error';

import { OfferType } from '../../exchange/orderbook/orderbook';
import { OfferMatchType } from '../../utils/form';
import { Money } from '../../utils/formatters/Formatters';
import { NetworkConfig } from '../config';
import { amountToWei } from '../utils';
import { TxMetaKind } from './txMeta';
import { TransactionDef } from './callsHelpers';

export interface CancelData {
  offerId: BigNumber;
}

export const cancelOffer: TransactionDef<CancelData> = {
  call: (_data: CancelData, context: NetworkConfig) => context.otc.contract.cancel.uint256,
  prepareArgs: ({ offerId }: CancelData) => [
    offerId,
  ],
  options: () => ({ gas: 500000 }),
  kind: TxMetaKind.cancel,
  description: ({ offerId }: CancelData) =>
    <React.Fragment>Cancel offer {offerId.toString()}</React.Fragment>,
};

export interface OfferMakeData {
  buyAmount: BigNumber;
  buyToken: string;
  sellAmount: BigNumber;
  sellToken: string;
  matchType: OfferMatchType;
  position?: BigNumber;
  kind: OfferType;
  gasPrice: BigNumber;
}

export const offerMake: TransactionDef<OfferMakeData> = {
  call: (data: OfferMakeData, context: NetworkConfig) => ({
    [OfferMatchType.limitOrder]: context.otc.contract.offer
      ['uint256,address,uint256,address,uint256,bool'],
    [OfferMatchType.direct]: () => { throw new Error('should not be here'); },
  }[data.matchType]),
  prepareArgs: (
    { buyAmount, buyToken, sellAmount, sellToken, matchType, position }: OfferMakeData,
    context: NetworkConfig
  ) => [
    amountToWei(sellAmount, sellToken).toFixed(0), context.tokens[sellToken].address,
    amountToWei(buyAmount, buyToken).toFixed(0), context.tokens[buyToken].address,
    ...matchType === OfferMatchType.limitOrder ? [position || 0] : [],
    true,
  ],
  options: ({ gasPrice }: OfferMakeData) => ({ gasPrice: gasPrice.toFixed(0) }),
  kind: TxMetaKind.offerMake,
  description: ({ buyAmount, buyToken, sellAmount, sellToken, kind }: OfferMakeData) => (
    kind === OfferType.sell ?
    <>
      Create  Sell order <Money value={sellAmount} token={sellToken}/>
    </> :
    <>
      Create  Buy order <Money value={buyAmount} token={buyToken}/>
    </>
  )

};

export interface OfferMakeDirectData {
  baseAmount: BigNumber;
  baseToken: string;
  quoteAmount: BigNumber;
  quoteToken: string;
  matchType: OfferMatchType;
  price: BigNumber;
  kind: OfferType;
  gasPrice: BigNumber;
}

export const offerMakeDirect: TransactionDef<OfferMakeDirectData> = {
  call: ({ kind }: OfferMakeDirectData, context: NetworkConfig) => kind === OfferType.buy ?
    context.otc.contract.buyAllAmount['address,uint256,address,uint256'] :
    context.otc.contract.sellAllAmount['address,uint256,address,uint256'],
  prepareArgs: (
    { baseAmount, baseToken, quoteAmount, quoteToken }: OfferMakeDirectData,
    context: NetworkConfig
  ) => [
    context.tokens[baseToken].address,
    amountToWei(baseAmount, baseToken).toFixed(0),
    context.tokens[quoteToken].address,
    amountToWei(quoteAmount, quoteToken).toFixed(0),
  ],
  options: ({ gasPrice }: OfferMakeDirectData) => ({ gasPrice: gasPrice.toFixed(0) }),
  kind: TxMetaKind.offerMake,
  description: ({ baseAmount, baseToken, quoteAmount, quoteToken, kind }: OfferMakeDirectData) =>
  kind === OfferType.sell ?
  <>
    Create  Sell order <Money value={baseAmount} token={baseToken}/>
  </> :
  <>
    Create  Buy order <Money value={quoteAmount} token={quoteToken}/>
  </>,
};
