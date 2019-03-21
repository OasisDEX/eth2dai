import { BigNumber } from 'bignumber.js';

import { isEqual } from 'lodash';
import { curry } from 'ramda';
import { combineLatest, merge, Observable, of, Subject } from 'rxjs';
import {
  catchError,
  distinctUntilChanged,
  first,
  flatMap,
  map,
  scan,
  shareReplay,
  startWith,
  switchMap,
} from 'rxjs/operators';
import { Balances, DustLimits } from '../balances/balances';
import { Calls, calls$, Calls$ } from '../blockchain/calls/calls';
import { eth2weth } from '../blockchain/calls/instant';
import { tokens } from '../blockchain/config';
import { TxStatus } from '../blockchain/transactions';
import { User } from '../blockchain/user';
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
  toUserChange,
  UserChange,
} from '../utils/form';
import { calculateTradePrice } from '../utils/price';
import { pluginDevModeHelpers } from './instantDevModeHelpers';
import {
  estimateTradePayWithERC20,
  estimateTradePayWithETH,
  tradePayWithERC20,
  tradePayWithETH,
} from './instantTransactions';

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
  notConnected = 'notConnected',
  custom = 'custom'
}

export type Message = {
  kind: MessageKind.dustAmount
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
  side: OfferType
  amount: BigNumber,
  token: string;
  priority: number;
  placement: Placement;
  error: any
} | {
  kind: MessageKind.notConnected;
  field: string;
  priority: number;
  placement: Placement;
// } | {
//   kind: MessageKind.custom
//   field: string;
//   priority: number;
//   placement: Placement;
//   error: any
};

export enum TradeEvaluationStatus {
  unset = 'unset',
  calculating = 'calculating',
  calculated = 'calculated',
  error = 'error',
}

export enum ProgressKind {
  proxyPayWithETH = 'proxyPayWithETH',
  noProxyPayWithETH = 'noProxyPayWithETH',
  noProxyNoAllowancePayWithERC20 = 'noProxyNoAllowancePayWithERC20',
  proxyNoAllowancePayWithERC20 = 'proxyNoAllowancePayWithERC20',
  proxyAllowancePayWithERC20 = 'proxyAllowancePayWithERC20',
}

export type Progress = {
  gasUsed?: BigNumber,
  bought?: BigNumber,
  sold?: BigNumber
  done: boolean;
} & ({
  kind: ProgressKind.proxyPayWithETH
    | ProgressKind.noProxyPayWithETH
    | ProgressKind.proxyAllowancePayWithERC20
  tradeTxStatus: TxStatus;
  tradeTxHash?: string;
} | {
  kind: ProgressKind.noProxyNoAllowancePayWithERC20
  proxyTxStatus: TxStatus;
  proxyTxHash?: string
  allowanceTxStatus?: TxStatus;
  allowanceTxHash?: string
  tradeTxStatus?: TxStatus;
  tradeTxHash?: string
} | {
  kind: ProgressKind.proxyNoAllowancePayWithERC20;
  allowanceTxStatus: TxStatus;
  allowanceTxHash?: string
  tradeTxStatus?: TxStatus;
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
  quotation?: string;
  priceImpact?: BigNumber;
  bestPrice?: BigNumber;
  slippageLimit: BigNumber;
  user?: User;
}

export enum InstantFormChangeKind {
  tokenChange = 'tokenChange',
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

export interface TokenChange {
  kind: InstantFormChangeKind.tokenChange;
  side: OfferType;
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
  TokenChange |
  BuyAmountChange |
  SellAmountChange |
  PairChange |
  FormResetChange;

export type EnvironmentChange =
  GasPriceChange |
  EtherPriceUSDChange |
  BalancesChange |
  DustLimitsChange |
  EtherBalanceChange |
  UserChange;

export type InstantFormChange =
  ManualChange |
  EnvironmentChange |
  ProgressChange;

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
    case InstantFormChangeKind.tokenChange:
      return {
        ...state,
        kind: change.side
      };
    case FormChangeKind.userChange:
      return {
        ...state,
        user: change.user
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

function gasEstimation(calls: Calls, state: InstantFormState): Observable<number> | undefined {
  return state.tradeEvaluationStatus !== TradeEvaluationStatus.calculated ?
    undefined :
    calls.proxyAddress().pipe(
      switchMap(proxyAddress => {
        const sell = state.sellToken === 'ETH' ? estimateTradePayWithETH : estimateTradePayWithERC20;
        return sell(calls, proxyAddress, state);
      })
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
    switchMap(calls =>
      combineLatest(
        state.kind === OfferType.buy ? evaluateBuy(calls, state) : evaluateSell(calls, state),
        // This is some suspicious case. This way it works like we had on OD but needs in-depth investigation.
        getBestPrice(calls, state.buyToken, state.sellToken)
      )
    ),
    map(([evaluation, bestPrice]) => ({
      ...state,
      ...evaluation,
      bestPrice,
      tradeEvaluationStatus: TradeEvaluationStatus.calculated,
    })),
    startWith({ ...state, tradeEvaluationStatus: TradeEvaluationStatus.calculating }),
    catchError(err => {
      return of({
        ...state,
        ...(state.kind === OfferType.buy ? { sellAmount: undefined } : { buyAmount: undefined }),
        bestPrice: undefined,
        tradeEvaluationStatus: TradeEvaluationStatus.error,
        tradeEvaluationError: err,
      });
    }),
  );
}

function validate(state: InstantFormState): InstantFormState {
  if (!state.user || !state.user.account) {
    return {
      ...state,
      message: {
        kind: MessageKind.notConnected,
        field: 'none',
        priority: 1000,
        placement: Position.BOTTOM,
      },
    };
  }

  if (state.tradeEvaluationStatus !== TradeEvaluationStatus.calculated) {
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

function calculatePriceAndImpact(state: InstantFormState): InstantFormState {
  const { buyAmount, buyToken, sellAmount, sellToken, bestPrice } = state;
  const calculated = buyAmount && sellAmount
    ? calculateTradePrice(sellToken, sellAmount, buyToken, buyAmount)
    : null;
  const price = calculated ? calculated.price : undefined;
  const quotation = calculated ? calculated.quotation : undefined;
  const priceImpact = price && bestPrice ?
    bestPrice
      .minus(price)
      .abs()
      .div(bestPrice)
      .times(100) :
    undefined;
  return {
    ...state,
    price,
    quotation,
    priceImpact,
  };
}

function prepareSubmit(
  theCalls$: Calls$,
): [(state: InstantFormState) => void, Observable<ProgressChange | FormResetChange>] {

  const stageChange$ = new Subject<ProgressChange | FormResetChange>();

  function submit(state: InstantFormState) {
    theCalls$.pipe(
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
    readyToProceed: !state.message && state.gasEstimationStatus === GasEstimationStatus.calculated };
}

function freezeIfInProgress(previous: InstantFormState, state: InstantFormState): InstantFormState {
  if (state.progress) {
    return {
      ...previous,
      progress: state.progress
    };
  }
  return state;
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
    user$: Observable<User>;
  }
): Observable<InstantFormState> {

  pluginDevModeHelpers(calls$);

  const manualChange$ = new Subject<ManualChange>();

  const environmentChange$ = combineAndMerge(
    toGasPriceChange(params.gasPrice$),
    toEtherPriceUSDChange(params.etherPriceUsd$),
    toBalancesChange(params.balances$),
    toEtherBalanceChange(params.etherBalance$),
    toDustLimitsChange(params.dustLimits$),
    toUserChange(params.user$),
  );

  const [submit, submitChange$] = prepareSubmit(params.calls$);

  const initialState: InstantFormState = {
    submit,
    change: manualChange$.next.bind(manualChange$),
    buyToken: 'DAI',
    sellToken: 'ETH',
    gasEstimationStatus: GasEstimationStatus.unset,
    tradeEvaluationStatus: TradeEvaluationStatus.unset,
    slippageLimit: new BigNumber('0.05'),
  };

  return merge(
    manualChange$,
    submitChange$,
    environmentChange$,
  ).pipe(
    scan(applyChange, initialState),
    startWith(initialState),
    distinctUntilChanged(isEqual),
    switchMap(curry(evaluateTrade)(params.calls$)),
    map(validate),
    switchMap(state => doGasEstimation(params.calls$, state, gasEstimation)),
    map(calculatePriceAndImpact),
    map(isReadyToProceed),
    scan(freezeIfInProgress),
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
