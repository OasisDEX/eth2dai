import { BigNumber } from 'bignumber.js';
import { combineLatest, Observable, of } from 'rxjs';
import { catchError, first, flatMap, map, startWith, switchMap } from 'rxjs/operators';
import { ReadCalls, ReadCalls$ } from '../blockchain/calls/calls';
import { OfferType } from '../exchange/orderbook/orderbook';
import { InstantFormState } from './instantForm';
import { MessageKind, Position } from './validate';

export interface TradeEvaluationState {
  buyAmount?: BigNumber;
  sellAmount?: BigNumber;
  tradeEvaluationStatus: TradeEvaluationStatus;
  tradeEvaluationError?: any;
  bestPrice?: BigNumber;
}

export enum TradeEvaluationStatus {
  unset = 'unset',
  calculating = 'calculating',
  calculated = 'calculated',
  error = 'error',
}

export function evaluateTrade(
  theCalls$: ReadCalls$, previousState: InstantFormState, state: InstantFormState
): Observable<TradeEvaluationState> | undefined {

  if (
    state.kind === OfferType.buy &&
    state.kind === previousState.kind &&
    state.buyAmount && previousState.buyAmount &&
    state.buyAmount.eq(previousState.buyAmount)
    ||
    state.kind === OfferType.sell &&
    state.kind === previousState.kind &&
    state.sellAmount && previousState.sellAmount &&
    state.sellAmount.eq(previousState.sellAmount)
  ) {
    return undefined;
  }

  if (
    !state.kind || state.kind === OfferType.buy && !state.buyAmount
    || state.buyAmount && state.buyAmount.eq(new BigNumber(0))
    || state.kind === OfferType.sell && !state.sellAmount
    || state.sellAmount && state.sellAmount.eq(new BigNumber(0))
  ) {
    return of({
      tradeEvaluationStatus: TradeEvaluationStatus.unset,
      ...state.kind === OfferType.buy ? { sellAmount: undefined } : { buyAmount: undefined }
    });
  }

  return theCalls$.pipe(
    first(),
    switchMap(calls =>
      combineLatest(
        state.kind === OfferType.buy ? evaluateBuy(calls, state) : evaluateSell(calls, state),
        // tslint:disable-next-line:max-line-length
        // This is some suspicious case. This way it works like we had on OD but needs in-depth investigation.
        getBestPrice(calls, state.buyToken, state.sellToken)
      )
    ),
    map(([evaluation, bestPrice]) => ({
      ...evaluation,
      bestPrice,
      tradeEvaluationStatus: TradeEvaluationStatus.calculated,
    })),
    startWith({ ...state, tradeEvaluationStatus: TradeEvaluationStatus.calculating }),
    catchError(err => {
      return of({
        ...(state.kind === OfferType.buy ? { sellAmount: undefined } : { buyAmount: undefined }),
        bestPrice: undefined,
        tradeEvaluationStatus: TradeEvaluationStatus.error,
        tradeEvaluationError: err,
      });
    }),
  );
}

function evaluateBuy(calls: ReadCalls, state: InstantFormState) {

  const { buyToken, sellToken, buyAmount } = state;

  if (!buyToken || !sellToken || !buyAmount) {
    return of(state);
  }

  const errorItem = (error?: Error) => ({
    sellAmount: undefined,
    message: {
      error,
      kind: MessageKind.orderbookTotalExceeded,
      amount: buyAmount,
      side: 'buy',
      token: buyToken,
      placement: Position.TOP,
      priority: 3
    }
  });

  return calls.otcGetPayAmount({
    sellToken,
    buyToken,
    amount: buyAmount,
  }).pipe(
    switchMap(sellAmount => of(sellAmount.isZero() ? errorItem() : { sellAmount })),
    catchError(error => of(errorItem(error))),
  );
}

function evaluateSell(calls: ReadCalls, state: InstantFormState) {

  const { buyToken, sellToken, sellAmount } = state;

  if (!buyToken || !sellToken || !sellAmount) {
    return of(state);
  }

  const errorItem = (error?: Error) => ({
    buyAmount: undefined,
    message: {
      error,
      kind: MessageKind.orderbookTotalExceeded,
      amount: sellAmount,
      side: 'sell',
      token: sellToken,
      placement: Position.TOP,
      priority: 3
    }
  });

  return calls.otcGetBuyAmount({
    sellToken,
    buyToken,
    amount: sellAmount,
  }).pipe(
    switchMap(buyAmount => of(buyAmount.isZero() ? errorItem() : { buyAmount })),
    catchError(error => of(errorItem(error))),
  );
}

function getBestPrice(
  calls: ReadCalls,
  sellToken: string,
  buyToken: string
): Observable<BigNumber> {
  return calls.otcGetBestOffer({ sellToken, buyToken }).pipe(
    flatMap(offerId =>
      calls.otcOffers(offerId).pipe(
        map(([a, _, b]: BigNumber[]) => {
          return (sellToken === 'DAI' || (sellToken === 'WETH' && buyToken !== 'DAI')) ?
            a.div(b) : b.div(a);
        })
      )
    )
  );
}
