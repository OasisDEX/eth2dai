import { BigNumber } from 'bignumber.js';
import { isEqual } from 'lodash';
import { curry } from 'ramda';
import { merge, Observable, Subject } from 'rxjs';
import {
  distinctUntilChanged,
  map,
  scan,
  shareReplay,
  switchMap,
} from 'rxjs/operators';

import { Allowances, Balances, DustLimits } from '../balances/balances';
import { Calls, calls$, Calls$, ReadCalls, ReadCalls$ } from '../blockchain/calls/calls';
import { NetworkConfig } from '../blockchain/config';
import { User } from '../blockchain/user';
import { OfferType } from '../exchange/orderbook/orderbook';
import { combineAndMerge } from '../utils/combineAndMerge';
import {
  doGasEstimation,
  GasEstimationStatus,
  HasGasEstimation,
  toBalancesChange,
  toEtherBalanceChange,
  toEtherPriceUSDChange,
  toGasPriceChange,
  toUserChange,
} from '../utils/form';
import { calculateTradePrice } from '../utils/price';
import { switchSpread } from '../utils/switchSpread';
import {
  applyChange, InstantFormChangeKind, manualAllowanceSetup,
  ManualChange, manualProxyCreation, prepareSubmit,
  toAllowancesChange,
  toContextChange,
  toDustLimitsChange,
  toProxyChange
} from './apply';
import {
  evaluateTrade,
  TradeEvaluationState,
  TradeEvaluationStatus
} from './evaluate';
import { pluginDevModeHelpers } from './instantDevModeHelpers';
import {
  estimateTradePayWithERC20,
  estimateTradePayWithETH,
  estimateTradeReadonly,
} from './instantTransactions';
import { ManualAllowanceProgressState, Progress } from './progress/progress';
import { Message, validate } from './validate';

export interface FormResetChange {
  kind: InstantFormChangeKind.formResetChange;
}

export enum ViewKind {
  new = 'new',
  allowances = 'allowances',
  settings = 'settings',
  buyAssetSelector = 'buyAssetSelector',
  sellAssetSelector = 'sellAssetSelector',
  account = 'account',
  finalization = 'finalization',
  priceImpactWarning = 'priceImpactWarning',
  summary = 'summary'
}

export interface InstantFormState extends HasGasEstimation,
  TradeEvaluationState,
  ManualAllowanceProgressState {
  view: ViewKind;
  readyToProceed?: boolean;
  progress?: Progress;
  buyToken: string;
  sellToken: string;
  kind?: OfferType;
  message?: Message;
  submit: (state: InstantFormState) => void;
  createProxy: () => void;
  change: (change: ManualChange) => void;
  dustLimits?: DustLimits;
  balances?: Balances;
  allowances?: Allowances;
  etherBalance?: BigNumber;
  price?: BigNumber;
  quotation?: string;
  priceImpact?: BigNumber;
  slippageLimit: BigNumber;
  proxyAddress?: string;
  user?: User;
  context?: NetworkConfig;
}

function estimateGas(calls$_: Calls$, readCalls$: ReadCalls$, state: InstantFormState) {
  return state.user && state.user.account ?
    doGasEstimation(calls$_, readCalls$, state, gasEstimation) :
    doGasEstimation(undefined, readCalls$, state, (_calls, readCalls, state_) =>
      state.tradeEvaluationStatus !== TradeEvaluationStatus.calculated
      || !state.buyAmount
      || !state.sellAmount
        ? undefined
        : estimateTradeReadonly(readCalls, state_)
    );
}

function gasEstimation(
  calls: Calls,
  readCalls: ReadCalls,
  state: InstantFormState
): Observable<number> | undefined {
  return state.tradeEvaluationStatus !== TradeEvaluationStatus.calculated
  || !state.buyAmount
  || !state.sellAmount
    ? undefined
    : calls.proxyAddress().pipe(
      switchMap(proxyAddress => {
        const sell = state.sellToken === 'ETH'
          ? estimateTradePayWithETH
          : estimateTradePayWithERC20;
        return sell(calls, readCalls, proxyAddress, state);
      })
    );
}

function mergeTradeEvaluation(
  state: InstantFormState, trade: TradeEvaluationState | undefined
): InstantFormState {
  if (!trade) {
    return state;
  }
  return {
    ...state,
    ...trade
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

function isReadyToProceed(state: InstantFormState): InstantFormState {
  return {
    ...state,
    readyToProceed: !state.message && state.gasEstimationStatus === GasEstimationStatus.calculated
  };
}

function freezeIfInProgress(previous: InstantFormState, state: InstantFormState): InstantFormState {
  if (state.view === ViewKind.finalization) {
    return {
      ...previous,
      progress: state.progress,
      view: state.view
    };
  }
  return state;
}

export function createFormController$(
  params: {
    gasPrice$: Observable<BigNumber>;
    allowances$: Observable<Allowances>;
    balances$: Observable<Balances>;
    etherBalance$: Observable<BigNumber>
    dustLimits$: Observable<DustLimits>;
    proxyAddress$: Observable<string>;
    calls$: Calls$;
    readCalls$: ReadCalls$;
    etherPriceUsd$: Observable<BigNumber>;
    user$: Observable<User>;
    context$: Observable<NetworkConfig>
  }
): Observable<InstantFormState> {

  pluginDevModeHelpers(calls$);

  const manualChange$ = new Subject<ManualChange>();

  const environmentChange$ = merge(
    combineAndMerge(
      toGasPriceChange(params.gasPrice$),
      toEtherPriceUSDChange(params.etherPriceUsd$),
      toDustLimitsChange(params.dustLimits$),
      toUserChange(params.user$),
      toContextChange(params.context$),
    ),
    toBalancesChange(params.balances$),
    toEtherBalanceChange(params.etherBalance$),
    toAllowancesChange(params.allowances$),
    toProxyChange(params.proxyAddress$),
  );

  const [submit, submitChange$] = prepareSubmit(params.calls$);

  const [createProxy, createProxyManuallyChange$] =
    manualProxyCreation(params.calls$, params.gasPrice$);

  const [toggleAllowance, setAllowanceManuallyChange$] =
    manualAllowanceSetup(
      params.calls$,
      params.gasPrice$,
      params.proxyAddress$,
      params.allowances$
    );

  const initialState: InstantFormState = {
    submit,
    createProxy,
    toggleAllowance,
    change: manualChange$.next.bind(manualChange$),
    buyToken: 'DAI',
    sellToken: 'ETH',
    gasEstimationStatus: GasEstimationStatus.unset,
    tradeEvaluationStatus: TradeEvaluationStatus.unset,
    slippageLimit: new BigNumber('0.05'),
    view: ViewKind.new,
  };

  function evaluateTradeWithCalls(readCalls$: ReadCalls$) {
    return (previousState: InstantFormState, state: InstantFormState) =>
      evaluateTrade(readCalls$, previousState, state);
  }

  return merge(
    manualChange$,
    submitChange$,
    createProxyManuallyChange$,
    setAllowanceManuallyChange$,
    environmentChange$,
  ).pipe(
    scan(applyChange, initialState),
    distinctUntilChanged(isEqual),
    switchSpread(
      evaluateTradeWithCalls(params.readCalls$),
      mergeTradeEvaluation
    ),
    map(validate),
    switchMap(curry(estimateGas)(params.calls$, params.readCalls$)),
    map(calculatePriceAndImpact),
    map(isReadyToProceed),
    scan(freezeIfInProgress),
    shareReplay(1),
  );
}
