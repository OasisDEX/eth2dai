import { find } from 'lodash';
import { combineLatest, Observable } from 'rxjs';
import { map, shareReplay } from 'rxjs/operators';

import { BigNumber } from 'bignumber.js';
import { Error } from 'tslint/lib/error';
import { TxMetaKind } from '../../blockchain/calls/txMeta';
import {
  TxState,
  TxStatus } from '../../blockchain/transactions';
import { Offer, OfferType, Orderbook } from '../orderbook/orderbook';
import { compareTrades, Trade, TradeRole } from '../trades';
import { TradingPair } from '../tradingPair/tradingPair';

export enum TradeStatus {
  beingCancelled = 'beingCancelled',
  beingCreated = 'beingCreated'
}

export type TradeWithStatus = Trade & {
  status?: TradeStatus
};

function txnInProgress(txn: TxState): boolean {
  return ![TxStatus.CancelledByTheUser, TxStatus.Error, TxStatus.Failure].includes(txn.status);
}

function txnMetaOfKind(metaKind: TxMetaKind): (txn: TxState) => boolean {
  return (txn: TxState) => txn.meta.kind === metaKind;
}

function txnEarlierThan(txn: TxState, blockNumber: number) {
  if (txn.status === TxStatus.Success || txn.status === TxStatus.Failure) {
    return txn.blockNumber > blockNumber;
  }

  return true;
}

function isBeingCancelled(offer: Offer, transactions: TxState[]): boolean {
  return !!find(transactions, (t: TxState) =>
    t.meta.kind === TxMetaKind.cancel &&
      t.meta.args.offerId.eq(offer.offerId) &&
      txnInProgress(t)
  );
}

function txnToTrade(txn: TxState): TradeWithStatus  {

  if (txn.meta.kind !== TxMetaKind.offerMake) {
    throw new Error('Should not get here!');
  }

  const baseAmount = txn.meta.args.baseAmount ||
    (txn.meta.args.kind === OfferType.buy ? txn.meta.args.buyAmount : txn.meta.args.sellAmount);
  const baseToken = txn.meta.args.baseToken ||
    (txn.meta.args.kind === OfferType.buy ? txn.meta.args.buyToken : txn.meta.args.sellToken);
  const quoteAmount = txn.meta.args.quoteAmount ||
    (txn.meta.args.kind === OfferType.sell ? txn.meta.args.buyAmount : txn.meta.args.sellAmount);
  const quoteToken = txn.meta.args.quoteToken ||
    (txn.meta.args.kind === OfferType.sell ? txn.meta.args.buyToken : txn.meta.args.sellToken);

  return {
    baseAmount,
    baseToken,
    quoteAmount,
    quoteToken,
    status: TradeStatus.beingCreated,
    offerId: new BigNumber(-1),
    act: txn.meta.args.kind,
    kind: txn.meta.args.kind,
    role: 'maker' as TradeRole,
    price: quoteAmount.div(baseAmount),
    block: -1,
    time: new Date(),
    ownerId: 1
  } as TradeWithStatus;
}

function offerToTrade(tnxs: TxState[]): (offer: Offer) => TradeWithStatus {
  return offer => ({
    status: isBeingCancelled(offer, tnxs) ? TradeStatus.beingCancelled : undefined,
    offerId: offer.offerId,
    act: offer.type,
    kind: offer.type,
    role: 'maker' as TradeRole,
    baseAmount: offer.baseAmount,
    baseToken: offer.baseToken,
    quoteAmount: offer.quoteAmount,
    quoteToken: offer.quoteToken,
    price: offer.price,
    block: -1,
    time: offer.timestamp
  });
}

export function createMyOpenTrades$(
  loadOrderbookTP: (tp: TradingPair) => Observable<Orderbook>,
  account$: Observable<string | undefined>,
  transactions$: Observable<TxState[]>,
  tradingPair: TradingPair,
): Observable<TradeWithStatus[]> {
  return combineLatest(loadOrderbookTP(tradingPair), account$, transactions$).pipe(
    map(([orderbook, account, txns]) => {

      const myOffer = (o: Offer) => o.ownerId === account;

      return txns
        .filter(txn =>
          txnMetaOfKind(TxMetaKind.offerMake)(txn) &&
          txnInProgress(txn) &&
          txnEarlierThan(txn, orderbook.blockNumber))
        .map(txnToTrade)
        .concat(
          orderbook.buy.filter(myOffer)
            .concat(orderbook.sell.filter(myOffer))
            .map(offerToTrade(txns))
        )
        .sort(compareTrades);
    }),
    shareReplay(1),
  );
}
