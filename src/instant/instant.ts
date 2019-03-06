import { BigNumber } from 'bignumber.js';

import { isEqual } from 'lodash';
import { curry } from 'ramda';
import { combineLatest, merge, Observable, of, Subject } from 'rxjs';
import {
  catchError,
  delay,
  distinctUntilChanged,
  first,
  flatMap,
  map,
  scan,
  shareReplay,
  startWith,
  switchMap,
  tap
} from 'rxjs/operators';
import { tokens } from 'src/blockchain/config';
import { Balances, DustLimits } from '../balances/balances';

import { Calls, Calls$ } from '../blockchain/calls/calls';
import { eth2weth, InstantOrderData } from '../blockchain/calls/instant';
import { isDone, txHash, TxState, TxStatus } from '../blockchain/transactions';
import { OfferType } from '../exchange/orderbook/orderbook';
import { combineAndMerge } from '../utils/combineAndMerge';
import {
  BalancesChange,
  doGasEstimation,
  EtherBalanceChange,
  EtherPriceUSDChange,
  FormChangeKind,
  GasEstimationStatus,
  GasPriceChange,
  HasGasEstimation,
  toBalancesChange,
  toEtherBalanceChange,
  toEtherPriceUSDChange,
  toGasPriceChange,
} from '../utils/form';

export interface FormResetChange {
  kind: InstantFormChangeKind.formResetChange;
}

export enum Position {
  TOP = 'top',
  BOTTOM = 'bottom'
}

export type Placement = Position.TOP | Position.BOTTOM;

export enum MessageKind {
  noAllowance = 'noAllowance',
  insufficientAmount = 'insufficientAmount',
  incredibleAmount = 'incredibleAmount',
  dustAmount = 'dustAmount',
  orderbookTotalExceeded = 'orderbookTotalExceeded',
  custom = 'custom'
}

export type Message = {
  kind: MessageKind.noAllowance;
  field: string;
  priority: number;
  token: string;
  placement: Placement;
} | {
  kind: MessageKind.dustAmount
    | MessageKind.noAllowance
    | MessageKind.insufficientAmount
    | MessageKind.incredibleAmount;
  field: string;
  priority: number;
  token: string;
  amount: BigNumber;
  placement: Placement;
} | {
  kind: MessageKind.orderbookTotalExceeded
  field: string;
  side: 'sell' | 'buy'
  amount: BigNumber,
  token: string;
  priority: number;
  placement: Placement;
  error: any
} | {
  kind: MessageKind.custom
  field: string;
  priority: number;
  placement: Placement;
  error: any
};

export enum TradeEvaluationStatus {
  unset = 'unset',
  calculating = 'calculating',
  calculated = 'calculated',
  error = 'error',
}

enum ProgressKind {
  proxyPayWithETH = 'proxyPayWithETH',
  noProxyPayWithETH = 'noProxyPayWithETH',
  noProxyNoAllowancePayWithERC20 = 'noProxyNoAllowancePayWithERC20',
  proxyNoAllowancePayWithERC20 = 'proxyNoAllowancePayWithERC20',
  proxyAllowancePayWithERC20 = 'proxyAllowancePayWithERC20',
}

type Progress = {
  done: boolean;
} & ({
  kind: ProgressKind.proxyPayWithETH | ProgressKind.noProxyPayWithETH
  tradeTxStatus: TxStatus;
  tradeTxHash?: string;
} | {
  kind: ProgressKind.noProxyNoAllowancePayWithERC20
  proxyTxStatus: TxStatus;
  proxyTxHash?: string
  allowanceTxStatus: TxStatus;
  allowanceTxHash?: string
  tradeTxStatus: TxStatus;
  tradeTxHash?: string
} | {
  kind: ProgressKind.proxyNoAllowancePayWithERC20;
  allowanceTxStatus: TxStatus;
  allowanceTxHash?: string
  tradeTxStatus: TxStatus;
  tradeTxHash?: string
} | {
  kind: ProgressKind.proxyAllowancePayWithERC20;
  tradeTxStatus: TxStatus;
  tradeTxHash?: string
});

export interface InstantFormState extends HasGasEstimation {
  readyToProceed?: boolean;
  progress?: Progress;
  buyToken: string;
  sellToken: string;
  buyAmount?: BigNumber;
  sellAmount?: BigNumber;
  kind?: OfferType;
  message?: Message;
  submit: (state: InstantFormState) => void;
  change: (change: ManualChange) => void;
  dustLimits?: DustLimits;
  balances?: Balances;
  etherBalance?: BigNumber;
  tradeEvaluationStatus: TradeEvaluationStatus;
  tradeEvaluationError?: any;
  price?: BigNumber;
  priceImpact?: BigNumber;
  bestPrice?: BigNumber;
  slippageLimit: BigNumber;
}

export enum InstantFormChangeKind {
  buyAmountFieldChange = 'buyAmountFieldChange',
  sellAmountFieldChange = 'sellAmountFieldChange',
  pairChange = 'pairChange',
  formResetChange = 'reset',
  progressChange = 'progressChange',
  proxyChange = 'proxyChange',
  dustLimitsChange = 'dustLimitsChange'
}

export interface ProgressChange {
  kind: InstantFormChangeKind.progressChange;
  progress?: Progress;
}

function progressChange(progress?: Progress): ProgressChange {
  return { progress, kind: InstantFormChangeKind.progressChange };
}

export interface BuyAmountChange {
  kind: InstantFormChangeKind.buyAmountFieldChange;
  value?: BigNumber;
}

export interface SellAmountChange {
  kind: InstantFormChangeKind.sellAmountFieldChange;
  value?: BigNumber;
}

export interface PairChange {
  kind: InstantFormChangeKind.pairChange;
  buyToken: string;
  sellToken: string;
}

export interface DustLimitsChange {
  kind: InstantFormChangeKind.dustLimitsChange;
  dustLimits: DustLimits;
}

export type ManualChange =
  BuyAmountChange |
  SellAmountChange |
  PairChange |
  FormResetChange;

export type EnvironmentChange =
  GasPriceChange |
  EtherPriceUSDChange |
  BalancesChange |
  DustLimitsChange |
  EtherBalanceChange;

export type InstantFormChange =
  ManualChange |
  EnvironmentChange |
  ProgressChange;

// function instantOrderData(state: InstantFormState): InstantOrderData {
//   return {
//     kind: state.kind as OfferType,
//     buyAmount: state.buyAmount as BigNumber,
//     buyToken: state.buyToken,
//     sellAmount: state.sellAmount as BigNumber,
//     sellToken: state.sellToken,
//     gasEstimation: state.gasEstimation as number,
//     gasPrice: state.gasPrice as BigNumber,
//   };
// }

function applyChange(state: InstantFormState, change: InstantFormChange): InstantFormState {
  switch (change.kind) {
    case InstantFormChangeKind.pairChange:
      return {
        ...state,
        buyToken: change.buyToken,
        sellToken: change.sellToken,
        kind: undefined,
        buyAmount: undefined,
        sellAmount: undefined,
        tradeEvaluationStatus: TradeEvaluationStatus.unset,
      };
    case InstantFormChangeKind.sellAmountFieldChange:
      return {
        ...state,
        kind: OfferType.sell,
        sellAmount: change.value,
      };
    case InstantFormChangeKind.buyAmountFieldChange:
      return {
        ...state,
        kind: OfferType.buy,
        buyAmount: change.value,
      };
    case FormChangeKind.gasPriceChange:
      return {
        ...state,
        gasPrice: change.value,
      };
    case FormChangeKind.etherPriceUSDChange:
      return {
        ...state,
        etherPriceUsd: change.value,
      };
    case FormChangeKind.balancesChange:
      return {
        ...state,
        balances: change.balances,
      };
    case InstantFormChangeKind.dustLimitsChange:
      return {
        ...state,
        dustLimits: change.dustLimits
      };
    case InstantFormChangeKind.progressChange:
      return {
        ...state,
        progress: change.progress
      };
    case InstantFormChangeKind.formResetChange:
      return {
        ...state,
        progress: undefined,
        buyAmount: undefined,
        sellAmount: undefined,
        gasEstimationStatus: GasEstimationStatus.unset
      };
    case FormChangeKind.etherBalanceChange:
      return {
        ...state,
        etherBalance: change.etherBalance
      };
  }

  return state;
}

function evaluateBuy(calls: Calls, state: InstantFormState) {

  const { buyToken, sellToken, buyAmount } = state;

  if (!buyToken || !sellToken || !buyAmount) {
    return of(state);
  }

  // console.log('calling otcGetPayAmount', buyToken, sellToken, buyAmount.toString());

  return calls.otcGetPayAmount({
    sellToken,
    buyToken,
    amount: buyAmount,
  }).pipe(
    map(sellAmount => ({ sellAmount })),
    catchError(error => of({
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
    }))
  );
}

function evaluateSell(calls: Calls, state: InstantFormState) {

  const { buyToken, sellToken, sellAmount } = state;

  if (!buyToken || !sellToken || !sellAmount) {
    return of(state);
  }

  // console.log('calling otcGetBuyAmount', buyToken, sellToken, sellAmount.toString());
  return calls.otcGetBuyAmount({
    sellToken,
    buyToken,
    amount: sellAmount,
  }).pipe(
    map(buyAmount => ({ buyAmount })),
    catchError(error => of({
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
    }))
  );
}

function getBestPrice(calls: Calls, sellToken: string, buyToken: string): Observable<BigNumber> {
  return calls.otcGetBestOffer({ sellToken, buyToken }).pipe(
    flatMap(offerId =>
      calls.otcOffers(offerId).pipe(
        map(([a, _, b]: BigNumber[]) => {
          // console.log(sellToken, buyToken, a.toString(), b.toString());
          return (sellToken === 'DAI' || (sellToken === 'WETH' && buyToken !== 'DAI')) ?
            a.div(b) : b.div(a);
        })
      )
    )
  );
}

function gasEstimation(_calls: Calls, _state: InstantFormState): Observable<number> {
  return of(100000).pipe(
    delay(500)
  );
}

function evaluateTrade(
    theCalls$: Calls$, state: InstantFormState
): Observable<InstantFormState> {

  if (!state.buyAmount && !state.sellAmount) {
    return of(state);
  }

  return theCalls$.pipe(
      first(),
      flatMap(calls =>
        combineLatest(
          state.kind === OfferType.buy ? evaluateBuy(calls, state) : evaluateSell(calls, state),
          // This is some suspicious case. This way it works like we had on OD but needs in-depth investigation.
          getBestPrice(calls, state.buyToken, state.sellToken)
        ).pipe(
          map(([evaluation, bestPrice]) => ({
            ...state,
            ...evaluation,
            bestPrice,
          })),
          flatMap(stateWithoutGasEstimation =>
            stateWithoutGasEstimation.message ?
              of(stateWithoutGasEstimation) :
              doGasEstimation(theCalls$, stateWithoutGasEstimation, gasEstimation)
          ),
          map(stateWithGasEstimation => ({
            ...stateWithGasEstimation,
            tradeEvaluationStatus: TradeEvaluationStatus.calculated,
          }))
        )
      ),
      catchError(err => {
        return of({
          ...state,
          ...(state.kind === OfferType.buy ? { sellAmount: undefined } : { buyAmount: undefined }),
          bestPrice: undefined,
          tradeEvaluationStatus: TradeEvaluationStatus.error,
          tradeEvaluationError: err,
        });
      }),
      startWith({ ...state, tradeEvaluationStatus: TradeEvaluationStatus.calculating }),
  );
}

function postValidate(state: InstantFormState): InstantFormState {
  if (state.tradeEvaluationStatus === TradeEvaluationStatus.calculating) {
    return state;
  }

  let message: Message | undefined  = state.message;

  const [spendField, receiveField] = ['sellToken', 'buyToken'];
  const [spendToken, receiveToken] = [state.sellToken, state.buyToken];
  const [spendAmount, receiveAmount] = [state.sellAmount, state.buyAmount];
  const dustLimits = state.dustLimits;

  if (spendAmount && (
      spendToken === 'ETH' && state.etherBalance && state.etherBalance.lt(spendAmount) ||
      state.balances && state.balances[spendToken] && state.balances[spendToken].lt(spendAmount)
  )) {
    message = prioritize(message, {
      kind: MessageKind.insufficientAmount,
      field: spendField,
      amount: spendAmount,
      priority: 1,
      token: spendToken,
      placement: Position.BOTTOM
    });
  }

  if (spendAmount && dustLimits && dustLimits[eth2weth(spendToken)] && dustLimits[eth2weth(spendToken)].gt(spendAmount)) {
    message = prioritize(message, {
      kind: MessageKind.dustAmount,
      amount: dustLimits[eth2weth(spendToken)],
      field: spendField,
      priority: 2,
      token: spendToken,
      placement: Position.BOTTOM
    });
  }

  if (receiveAmount && dustLimits && dustLimits[eth2weth(receiveToken)] && dustLimits[eth2weth(receiveToken)].gt(receiveAmount)) {
    message = prioritize(message, {
      kind: MessageKind.dustAmount,
      amount: dustLimits[eth2weth(receiveToken)],
      field: receiveField,
      priority: 2,
      token: receiveToken,
      placement: Position.BOTTOM
    });
  }

  if (
    spendAmount && new BigNumber(tokens[eth2weth(spendToken)].maxSell).lt(spendAmount)
  ) {
    message = prioritize(message, {
      kind: MessageKind.incredibleAmount,
      field: spendField,
      priority: 2,
      token: spendToken,
      amount: new BigNumber(tokens[eth2weth(spendToken)].maxSell),
      placement: Position.BOTTOM
    });
  }

  if (receiveAmount && new BigNumber(tokens[eth2weth(receiveToken)].maxSell).lt(receiveAmount)) {
    message = prioritize(message, {
      kind: MessageKind.incredibleAmount,
      field: receiveField,
      priority: 2,
      token: receiveToken,
      amount: new BigNumber(tokens[eth2weth(receiveToken)].maxSell),
      placement: Position.BOTTOM
    });
  }

  return {
    ...state,
    message
  };
}

function tradePayWithETH(
  calls: Calls,
  proxyAddress: string | undefined,
  state: InstantFormState
): Observable<ProgressChange | FormResetChange> {

  if (!state.buyAmount || !state.sellAmount) {
    throw new Error('Empty buy of sell amount. Should not get here!');
  }

  const initialProgress: Progress = {
    kind: proxyAddress ? ProgressKind.proxyPayWithETH : ProgressKind.noProxyPayWithETH,
    tradeTxStatus: TxStatus.WaitingForApproval,
    done: false,
  };

  return calls.instantOrder({ ...state, proxyAddress } as InstantOrderData).pipe(
    switchMap((transactionState: TxState) =>
      of(progressChange({
        ...initialProgress,
        tradeTxStatus: transactionState.status,
        tradeTxHash: txHash(transactionState),
        done: isDone(transactionState.status)
      }))
    ),
    startWith(progressChange(initialProgress))
  );
}

function tradePayWithERC20(
  _calls: Calls,
  _proxyAddress: string | undefined,
  _state: InstantFormState
): Observable<ProgressChange | FormResetChange> {
  return of();
}

function calculatePrice(state: InstantFormState): InstantFormState {
  const { buyAmount, sellAmount } = state;

  if (buyAmount && sellAmount) {
    const price = buyAmount.div(sellAmount);

    return {
      ...state,
      price
    };
  }

  return state;
}

function calculatePriceImpact(state: InstantFormState): InstantFormState {
  const { price, bestPrice } = state;

  if (price && bestPrice) {
    const priceImpact = bestPrice
      .minus(price)
      .abs()
      .div(bestPrice)
      .times(100);

    return {
      ...state,
      priceImpact
    };
  }

  return state;
}

function prepareSubmit(
  calls$: Calls$,
): [(state: InstantFormState) => void, Observable<ProgressChange | FormResetChange>] {

  const stageChange$ = new Subject<ProgressChange | FormResetChange>();

  function submit(state: InstantFormState) {
    calls$.pipe(
      first(),
      flatMap((calls) =>
        calls.proxyAddress().pipe(
          switchMap(proxyAddress => {
            const sell = state.sellToken === 'ETH' ? tradePayWithETH : tradePayWithERC20;
            return sell(calls, proxyAddress, state);
          })
      )
    )).subscribe(change => stageChange$.next(change));
  }

  return [submit, stageChange$];
}

function toDustLimitsChange(dustLimits$: Observable<DustLimits>): Observable<DustLimitsChange> {
  return dustLimits$.pipe(
    map(dustLimits => ({
      dustLimits,
      kind: InstantFormChangeKind.dustLimitsChange,
    } as DustLimitsChange))
  );
}

function isReadyToProceed(state: InstantFormState): InstantFormState {
  return {
    ...state,
    readyToProceed: !state.message && state.tradeEvaluationStatus === TradeEvaluationStatus.calculated };
}

export function createFormController$(
  params: {
    gasPrice$: Observable<BigNumber>;
    allowance$: (token: string) => Observable<boolean>;
    balances$: Observable<Balances>;
    etherBalance$: Observable<BigNumber>
    dustLimits$: Observable<DustLimits>;
    calls$: Calls$;
    etherPriceUsd$: Observable<BigNumber>;
  }
): Observable<InstantFormState> {
  const manualChange$ = new Subject<ManualChange>();

  const environmentChange$ = combineAndMerge(
    toGasPriceChange(params.gasPrice$),
    toEtherPriceUSDChange(params.etherPriceUsd$),
    toBalancesChange(params.balances$),
    toEtherBalanceChange(params.etherBalance$),
    toDustLimitsChange(params.dustLimits$),
  );

  const [submit, submitChange$] = prepareSubmit(params.calls$);

  const initialState: InstantFormState = {
    submit,
    change: manualChange$.next.bind(manualChange$),
    buyToken: 'DAI',
    sellToken: 'ETH',
    gasEstimationStatus: GasEstimationStatus.unset,
    tradeEvaluationStatus: TradeEvaluationStatus.unset,
    slippageLimit: new BigNumber('0.05')
  };

  return merge(
    manualChange$,
    submitChange$,
    environmentChange$,
  ).pipe(
    scan(applyChange, initialState),
    distinctUntilChanged(isEqual),
    switchMap(curry(evaluateTrade)(params.calls$)),
    map(calculatePrice),
    map(calculatePriceImpact),
    map(postValidate),
    tap(state => console.log(
      'state.message', state.message && state.message.kind,
      'state.gasEstimationStatus', state.gasEstimationStatus,
      'tradeEvaluationStatus:', state.tradeEvaluationStatus,
      'bestPrice:', state.bestPrice && state.bestPrice.toString()
    )),
    map(isReadyToProceed),
    shareReplay(1),
  );
}

const prioritize = (current: Message = { priority: 0 } as Message, candidate: Message) => {
  // Prioritize by priority first
  if (current.priority < candidate.priority) {
    return candidate;
  }

  // and if we have errors with same priority, the one for paying input is more important
  if (current.priority === candidate.priority) {
    return current.field === 'sellToken' ? current : candidate;
  }

  return current;
};
