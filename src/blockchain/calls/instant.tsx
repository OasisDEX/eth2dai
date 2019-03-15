import { BigNumber } from 'bignumber.js';
import * as React from 'react';
import { bindNodeCallback, Observable, of } from 'rxjs';
import { mergeMap } from 'rxjs/operators';
import { OfferType } from '../../exchange/orderbook/orderbook';

import { Money } from '../../utils/formatters/Formatters';
import { one } from '../../utils/zero';
import * as dsProxy from '../abi/ds-proxy.abi.json';
import * as proxyRegistry from '../abi/proxy-registry.abi.json';
import { NetworkConfig } from '../config';
import { amountFromWei, amountToWei } from '../utils';
import { web3 } from '../web3';
import { CallDef, TransactionDef } from './callsHelpers';
import { TxMetaKind } from './txMeta';

export interface InstantOrderData {
  proxyAddress?: string;
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

export const tradePayWithETHWithProxy: TransactionDef<InstantOrderData> = {
  call: ({ proxyAddress }: InstantOrderData) => {
    return web3.eth.contract(dsProxy as any).at(proxyAddress!).execute['address,bytes'];
  },
  prepareArgs: (
    {
      kind,
      buyToken, buyAmount,
      slippageLimit,
    }: InstantOrderData,
    context: NetworkConfig
  ) => {
    const fixedBuyAmount = kind === OfferType.sell ?
      buyAmount.times(one.minus(slippageLimit)) :
      buyAmount;

    const method = kind === OfferType.sell ?
      context.instantProxyCreationAndExecute.contract.sellAllAmountPayEth :
      context.instantProxyCreationAndExecute.contract.buyAllAmountPayEth;

    const params = kind === OfferType.sell ? [
      context.otc.address,
      context.tokens.WETH.address,
      context.tokens[buyToken].address,
      amountToWei(fixedBuyAmount, buyToken).toFixed(0)
    ] : [
      context.otc.address,
      context.tokens[buyToken].address,
      amountToWei(fixedBuyAmount, buyToken).toFixed(0),
      context.tokens.WETH.address,
    ];

    return [
      context.instantProxyCreationAndExecute.address,
      method.getData(...params)
    ];

  },
  options: ({
    kind,
    sellToken, sellAmount,
    slippageLimit,
    gasPrice,
    gasEstimation
  }: InstantOrderData) => ({
    gasPrice,
    gas: gasEstimation,
    value: amountToWei(
      kind === OfferType.sell ?
        sellAmount :
        sellAmount.times(one.plus(one.plus(slippageLimit))),
      sellToken).toFixed(0)
  }),
  kind: TxMetaKind.tradePayWithETHWithProxy,
  description: ({ kind, buyToken, buyAmount, sellToken, sellAmount }: InstantOrderData) =>
    kind === 'sell' ?
    <>
      Create Sell Order for: <Money value={sellAmount} token={sellToken}/>
    </> :
    <>
      Create Buy Order for: <Money value={buyAmount} token={buyToken}/>
    </>
};

export const tradePayWithETHNoProxy: TransactionDef<InstantOrderData> = {
  call: ({ kind }: InstantOrderData, context: NetworkConfig) => {
    return kind === OfferType.sell ?
      context.instantProxyCreationAndExecute.contract.createAndSellAllAmountPayEth :
      context.instantProxyCreationAndExecute.contract.createAndBuyAllAmountPayEth;
  },
  prepareArgs: (
    {
      kind,
      buyToken, buyAmount,
      slippageLimit,
    }: InstantOrderData,
    context: NetworkConfig
  ) => {
    return [
      context.instantProxyRegistry.address,
      context.otc.address,
      context.tokens[buyToken].address,
      amountToWei(
        kind === OfferType.sell ? fixBuyAmount(buyAmount, slippageLimit) : buyAmount,
        buyToken
      ).toFixed(0)
    ];
  },
  options: ({
    kind,
    sellToken, sellAmount,
    slippageLimit,
    gasPrice,
    gasEstimation
  }: InstantOrderData) => ({
    gasPrice,
    gas: gasEstimation,
    value: amountToWei(
      kind === OfferType.sell ? sellAmount : fixSellAmount(sellAmount, slippageLimit),
      sellToken).toFixed(0)
  }),
  kind: TxMetaKind.tradePayWithETHNoProxy,
  description: ({ kind, buyToken, buyAmount, sellToken, sellAmount }: InstantOrderData) =>
    kind === 'sell' ?
      <>
        Create Sell Order for: <Money value={sellAmount} token={sellToken}/>
      </> :
      <>
        Create Buy Order for: <Money value={buyAmount} token={buyToken}/>
      </>
};

function fixBuyAmount(buyAmount: BigNumber, slippageLimit: BigNumber) {
  return buyAmount.times(one.minus(slippageLimit));
}

function fixSellAmount(sellAmount: BigNumber, slippageLimit: BigNumber) {
  return sellAmount.times(one.plus(slippageLimit));
}

export const tradePayWithERC20: TransactionDef<InstantOrderData> = {
  call: ({ proxyAddress }: InstantOrderData) => {
    return web3.eth.contract(dsProxy as any).at(proxyAddress!).execute['address,bytes'];
  },
  prepareArgs: (
    {
      kind,
      buyToken, buyAmount,
      sellToken, sellAmount,
      slippageLimit,
    }: InstantOrderData,
    context: NetworkConfig
  ) => {
    if (sellToken === 'ETH') {
      throw new Error('Pay with ETH not handled here!');
    }

    const method = kind === OfferType.sell ?
      buyToken === 'ETH' ?
        context.instantProxyCreationAndExecute.contract.sellAllAmountBuyEth :
        context.instantProxyCreationAndExecute.contract.sellAllAmount
      :
      buyToken === 'ETH' ?
        context.instantProxyCreationAndExecute.contract.buyAllAmountBuyEth :
        context.instantProxyCreationAndExecute.contract.buyAllAmount;

    const params = kind === OfferType.sell ? [
      context.otc.address,
      context.tokens[sellToken].address,
      amountToWei(sellAmount, sellToken).toFixed(0),
      context.tokens[eth2weth(buyToken)].address,
      amountToWei(fixBuyAmount(buyAmount, slippageLimit), buyToken).toFixed(0),
    ] : [
      context.otc.address,
      context.tokens[eth2weth(buyToken)].address,
      amountToWei(buyAmount, buyToken).toFixed(0),
      context.tokens[sellToken].address,
      amountToWei(fixSellAmount(sellAmount, slippageLimit), sellToken).toFixed(0),
    ];

    return [
      context.instantProxyCreationAndExecute.address,
      method.getData(...params)
    ];

  },
  options: ({
    gasPrice,
    gasEstimation
  }: InstantOrderData) => ({
    gasPrice,
    gas: gasEstimation,
  }),
  kind: TxMetaKind.tradePayWithERC20,
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

export interface GetOffersAmountData {
  kind: OfferType;
  buyAmount: BigNumber;
  sellAmount: BigNumber;
  buyToken: string;
  sellToken: string;
}

export type GetOffersAmountResult = [BigNumber, boolean];

export const getOffersAmount: CallDef<GetOffersAmountData, GetOffersAmountResult> = {
  call: ({ kind }: GetOffersAmountData, context: NetworkConfig) => kind === OfferType.sell ?
    context.otcSupportMethods.contract.getOffersAmountToSellAll :
    context.otcSupportMethods.contract.getOffersAmountToBuyAll,
  prepareArgs: ({ kind, buyAmount, sellAmount, buyToken, sellToken }: GetOffersAmountData, context: NetworkConfig) => {
    const sellTokenAddress = context.tokens[eth2weth(sellToken)].address;
    const buyTokenAddress = context.tokens[eth2weth(buyToken)].address;
    return kind === OfferType.sell ?
      [context.otc.address, sellTokenAddress, amountToWei(sellAmount, sellToken).toFixed(0), buyTokenAddress] :
      [context.otc.address, buyTokenAddress, amountToWei(buyAmount, buyToken).toFixed(0), sellTokenAddress];
  },
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
  account: string,
  proxyRegistryAddress?: string
): Observable<string | undefined> {

  return bindNodeCallback(
    (
    proxyRegistryAddress
      ? web3.eth.contract(proxyRegistry as any).at(proxyRegistryAddress)
      : context.instantProxyRegistry.contract
    ).proxies
  )(account).pipe(
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

export interface SetupProxyData {
  gasPrice?: BigNumber;
  gasEstimation?: number;
}
export const setupProxy = {
  call: (_: any, context: NetworkConfig) => context.instantProxyRegistry.contract.build[''],
  prepareArgs: () => [],
  options: ({ gasPrice, gasEstimation }: SetupProxyData) => ({ ...gasPrice ? gasPrice : {}, ...gasEstimation ? { gas: gasEstimation } : {} }),
  kind: TxMetaKind.setupProxy,
  description: () => <React.Fragment>Setup proxy</React.Fragment>
};

export interface SetOwnerData {
  proxyAddress: string;
  ownerAddress: string;
}

export const setOwner = {
  call: ({ proxyAddress }: SetOwnerData) =>
    web3.eth.contract(dsProxy as any).at(proxyAddress).setOwner,
  prepareArgs: ({ ownerAddress }: SetOwnerData) => [ownerAddress],
  options: () => ({ gas: 1000000 }),
  kind: TxMetaKind.setupProxy,
  description: () => <React.Fragment>Calling SetOwner on proxy</React.Fragment>
};
