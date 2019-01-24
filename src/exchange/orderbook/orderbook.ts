import { BigNumber } from 'bignumber.js';
import { isEmpty, uniqBy, unzip } from 'lodash';
import { bindNodeCallback, combineLatest, Observable, of, zip } from 'rxjs';
import { expand, map, retryWhen, scan, shareReplay, switchMap } from 'rxjs/operators';

import { NetworkConfig } from '../../blockchain/config';
import { amountFromWei } from '../../blockchain/utils';
import { PickOfferChange } from '../../utils/form';
import { LoadableWithTradingPair } from '../../utils/loadable';
import { OfferFormState } from '../offerMake/offerMake';
import { TradingPair } from '../tradingPair/tradingPair';

export enum OfferType {
  buy = 'buy',
  sell = 'sell',
}

export interface Offer {
  offerId: BigNumber;
  baseAmount: BigNumber;
  baseToken: string;
  quoteAmount: BigNumber;
  quoteToken: string;
  price: BigNumber;
  ownerId: string;
  timestamp: Date;
  type: OfferType;
}

export interface Orderbook {
  blockNumber: number;
  sell: Offer[];
  spread?: BigNumber;
  buy: Offer[];
}

class InconsistentLoadingError extends Error {}

function parseOffers(sellToken: string, buyToken: string, type: OfferType, firstPage: boolean) {
  return (data: any[][]): { lastOfferId: BigNumber, offers: Offer[] } => {
    if (!firstPage && data[0][0].isZero()) {
      throw new InconsistentLoadingError('empty orderbook page loaded');
    }
    return {
      lastOfferId: data[0][data[0].length - 1] as BigNumber,
      offers: unzip(data)
        .filter(([id]) => !(id as BigNumber).eq(0))
        .map(([offerId, sellAmt, buyAmt, ownerId, timestamp]) => {
          const sellAmount = amountFromWei(sellAmt as BigNumber, sellToken);
          const buyAmount = amountFromWei(buyAmt as BigNumber, buyToken);
          return {...type === 'sell' ?
            {
              price: buyAmount.div(sellAmount),
              baseAmount: sellAmount,
              baseToken: sellToken,
              quoteAmount: buyAmount,
              quoteToken: buyToken,
            } :
            {
              price: sellAmount.div(buyAmount),
              baseAmount: buyAmount,
              baseToken: buyToken,
              quoteAmount: sellAmount,
              quoteToken: sellToken,
            }, ...{
              type,
              offerId: offerId as BigNumber,
              ownerId: ownerId as string,
              timestamp: new Date(1000 * (timestamp as BigNumber).toNumber())
            }} as Offer;
        })
    };
  };
}

type GetOffersFirst = (
  address: string, sellToken: string, buyToken: string,
  callback: (err: any, r: any) => any
) => any;

type GetOffersNext = (
  address: string, lastOfferId: string,
  callback: (err: any, r: any) => any
) => any;

function loadOffersAllAtOnce(
  context: NetworkConfig,
  sellToken: string,
  buyToken: string,
  type: OfferType
): Observable<Offer[]> {
  return bindNodeCallback(
    context.otcSupportMethods.contract.getOffers as GetOffersFirst
  )(
    context.otc.address,
    context.tokens[sellToken].address,
    context.tokens[buyToken].address
  ).pipe(
    map(parseOffers(sellToken, buyToken, type, true)),
    expand(({ lastOfferId }) => lastOfferId.isZero() ?
      of() :
      bindNodeCallback(
        context.otcSupportMethods.contract.getOffers['address,uint256'] as GetOffersNext
      )(
        context.otc.address,
        lastOfferId.toString(),
      ).pipe(
        map(parseOffers(sellToken, buyToken, type, false)),
      )
    ),
    retryWhen((errors) => errors.pipe(
      switchMap((e) => {
        if (e instanceof InconsistentLoadingError) {
          console.log(e.message);
          return errors;
        }
        throw e;
      }),
    )),
    scan<{ offers: Offer[] }, Offer[]>((result, { offers }) => result.concat(offers), []),
    map(offers => uniqBy(offers, ({ offerId }) => offerId.toString())),
  );
}

export function loadOrderbook$(
  context$:  Observable<NetworkConfig>,
  onEveryBlock$: Observable<number>,
  { base, quote }: TradingPair
): Observable<Orderbook> {
  return combineLatest(context$, onEveryBlock$).pipe(
    switchMap(([context, blockNumber]) =>
      zip(
        loadOffersAllAtOnce(context, quote, base, OfferType.buy),
        loadOffersAllAtOnce(context, base, quote, OfferType.sell)
      ).pipe(
        map(([buy, sell]) => {
          const spread =
            !isEmpty(sell) && !isEmpty(buy)
              ? sell[0].price.minus(buy[0].price)
              : undefined;

          return {
            blockNumber,
            buy,
            spread,
            sell
          };
        })
      )
    ),
    shareReplay(1),
  );
}

export function createPickableOrderBookFromOfferMake$(
  currentOrderBook$: Observable<LoadableWithTradingPair<Orderbook>>,
  account$: Observable<string | undefined>,
  currentOfferForm$: Observable<OfferFormState>,
) {
  return combineLatest(
    currentOrderBook$,
    account$,
    currentOfferForm$,
  ).pipe(
    map(([currentOrderBook, account, { change }]) => ({
      ...currentOrderBook,
      account,
      change: (ch: PickOfferChange) => change(ch),
    }))
  );
}
