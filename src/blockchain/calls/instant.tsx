import { BigNumber } from 'bignumber.js';
import * as React from 'react';
import { bindNodeCallback, Observable, of } from 'rxjs';
import { mergeMap } from 'rxjs/operators';
import { OfferType } from '../../exchange/orderbook/orderbook';

import { Money } from '../../utils/formatters/Formatters';
import { one } from '../../utils/zero';
import * as dsProxy from '../abi/ds-proxy.abi.json';
import { NetworkConfig } from '../config';
import { amountFromWei, amountToWei } from '../utils';
import { web3 } from '../web3';
import { CallDef, TransactionDef } from './callsHelpers';
import { TxMetaKind } from './txMeta';

export interface InstantOrderData {
  proxyAddress: string | undefined;
  kind: OfferType;
  buyAmount: BigNumber;
  sellAmount: BigNumber;
  buyToken: string;
  sellToken: string;
  slippageLimit: BigNumber;
  gasPrice: BigNumber;
  gasEstimation: number;
}

export function eth2weth(token: string): string {
  return token.replace(/^ETH/, 'WETH');
}

export const tradePayWithETH: TransactionDef<InstantOrderData> = {
  call: ({ kind, proxyAddress }: InstantOrderData, context: NetworkConfig) => {
    return proxyAddress ?
      undefined : // not implemented yet!
      kind === OfferType.sell ?
        context.instantProxyCreationAndExecute.contract.createAndSellAllAmountPayEth :
        context.instantProxyCreationAndExecute.contract.createAndBuyAllAmountPayEth;
  },
  prepareArgs: (
    {
      proxyAddress,
      kind,
      buyToken, buyAmount,
      sellToken, sellAmount,
      slippageLimit,
      gasPrice
    }: InstantOrderData,
    context: NetworkConfig
  ) => {
    if (proxyAddress) {
      throw new Error('Not implemented yet!');
    }

    const method = kind === OfferType.sell ?
      'createAndSellAllAmountPayEth' :
      'createAndBuyAllAmountPayEth';

    return [
      context.instantProxyRegistry.address,
      context.otc.address,
      context.tokens[buyToken].address,
      amountToWei(
        kind === OfferType.sell ?
          buyAmount.times(one.minus(slippageLimit)) :
          buyAmount,
        buyToken).toFixed(0)
    ];
  },
  options: ({
    kind,
    buyToken, buyAmount,
    sellToken, sellAmount,
    slippageLimit,
    gasPrice, gasEstimation
  }: InstantOrderData) => ({
    gasPrice,
    gas: gasEstimation,
    value: amountToWei(
      kind === OfferType.sell ?
        sellAmount :
        sellAmount.times(one.plus(slippageLimit)),
      sellToken).toFixed(0)
  }),
  kind: TxMetaKind.instantOrder,
  description: ({ kind, buyToken, buyAmount, sellToken, sellAmount }: InstantOrderData) =>
    kind === 'sell' ?
    <>
      Create Sell Order for: <Money value={sellAmount} token={sellToken}/>
    </> :
    <>
      Create Buy Order for: <Money value={buyAmount} token={buyToken}/>
    </>
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
  prepareArgs: ({ sellToken, buyToken, amount }: GetBuyAmountData, context: NetworkConfig) => {
    sellToken = eth2weth(sellToken);
    buyToken = eth2weth(buyToken);
    return [
      context.tokens[eth2weth(buyToken)].address,
      context.tokens[eth2weth(sellToken)].address,
      amountToWei(amount, sellToken).toFixed(0)
    ];
  },
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
  prepareArgs: ({ sellToken, buyToken, amount }: GetPayAmountData, context: NetworkConfig) => {
    sellToken = eth2weth(sellToken);
    buyToken = eth2weth(buyToken);
    return [
      context.tokens[sellToken].address,
      context.tokens[buyToken].address,
      amountToWei(amount, sellToken).toFixed(0)
    ];
  },
  postprocess: (result: BigNumber, { buyToken }: GetPayAmountData) =>
    amountFromWei(result, eth2weth(buyToken)),
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
    context.tokens[eth2weth(sellToken)].address,
    context.tokens[eth2weth(buyToken)].address,
  ],
};

type OffersData = BigNumber;

export const offers: CallDef<OffersData, any> = {
  call: (_: OffersData, context: NetworkConfig) => {
    return context.otc.contract.offers;
  },
  prepareArgs: (offerId: OffersData) => [offerId],
};

const nullAddress = '0x0000000000000000000000000000000000000000';
export function proxyAddress$(
  context: NetworkConfig,
  account: string
): Observable<string | undefined> {
  return bindNodeCallback(context.instantProxyRegistry.contract.proxies)(account).pipe(
    mergeMap((proxyAddress: string) => {
      if (proxyAddress === nullAddress) {
        return of(undefined);
      }
      const proxy = web3.eth.contract(dsProxy as any).at(proxyAddress);
      return bindNodeCallback(proxy.owner)().pipe(
        mergeMap((ownerAddress: string) =>
                   ownerAddress === account ? of(proxyAddress) : of(undefined)
        )
      );
    })
  );
}
