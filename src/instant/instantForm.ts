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
  switchMap, take,
} from 'rxjs/operators';

import { Allowances, Balances, DustLimits } from '../balances/balances';
import { Calls, calls$, Calls$, ReadCalls, ReadCalls$ } from '../blockchain/calls/calls';
import { eth2weth, weth2eth } from '../blockchain/calls/instant';
import { NetworkConfig, tokens } from '../blockchain/config';
import { EtherscanConfig } from '../blockchain/etherscan';
import { GasPrice$ } from '../blockchain/network';
import {
  isDone,
  isDoneButNotSuccessful,
  isSuccess,
  TxState,
  TxStatus
} from '../blockchain/transactions';
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
import { calculateTradePrice, getQuote } from '../utils/price';
import { getSlippageLimit } from '../utils/slippage';
import { switchSpread } from '../utils/switchSpread';
import { pluginDevModeHelpers } from './instantDevModeHelpers';
import {
  estimateTradePayWithERC20,
  estimateTradePayWithETH,
  estimateTradeReadonly,
  tradePayWithERC20,
  tradePayWithETH,
} from './instantTransactions';

export interface FormResetChange {
  kind: InstantFormChangeKind.formResetChange;
}

export enum MessageKind {
  noAllowance = 'noAllowance',
  insufficientAmount = 'insufficientAmount',
  incredibleAmount = 'incredibleAmount',
  dustAmount = 'dustAmount',
  orderbookTotalExceeded = 'orderbookTotalExceeded',
  notConnected = 'notConnected',
  txInProgress = 'txInProgress',
}

export interface TxInProgressMessage {
  kind: MessageKind.txInProgress;
  progress: Progress;
  field: string;
  etherscan?: EtherscanConfig;
}

export type Message = {
  kind: MessageKind.dustAmount
    | MessageKind.insufficientAmount
    | MessageKind.incredibleAmount;
  field: string;
  token: string;
  amount: BigNumber;
} | {
  kind: MessageKind.orderbookTotalExceeded
  field: string;
  side: OfferType
  amount: BigNumber,
  token: string;
  error: any
} | {
  kind: MessageKind.notConnected;
  field: string;
} | TxInProgressMessage;

export enum TradeEvaluationStatus {
  unset = 'unset',
  calculating = 'calculating',
  calculated = 'calculated',
  error = 'error',
}

export enum ProgressKind {
  onlyProxy = 'onlyProxy',
  onlyAllowance = 'onlyAllowance',
  proxyPayWithETH = 'proxyPayWithETH',
  noProxyPayWithETH = 'noProxyPayWithETH',
  noProxyNoAllowancePayWithERC20 = 'noProxyNoAllowancePayWithERC20',
  proxyNoAllowancePayWithERC20 = 'proxyNoAllowancePayWithERC20',
  proxyAllowancePayWithERC20 = 'proxyAllowancePayWithERC20',
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

interface GenericProgress {
  gasUsed?: BigNumber;
  bought?: BigNumber;
  sold?: BigNumber;
  done: boolean;
}

interface ManualProxyProgress extends GenericProgress {
  kind: ProgressKind.onlyProxy;
  proxyTxStatus: TxStatus;
  txHash?: string;
  tradeTxStatus?: TxStatus;
}

export interface ManualAllowanceProgress extends GenericProgress {
  kind: ProgressKind.onlyAllowance;
  token: string;
  direction: 'locking' | 'unlocking';
  allowanceTxStatus: TxStatus;
  txHash?: string;
  tradeTxStatus?: TxStatus;
}

export type Progress = GenericProgress & ({
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
} | ManualProxyProgress
  | ManualAllowanceProgress
  );

interface TradeEvaluationState {
  buyAmount?: BigNumber;
  sellAmount?: BigNumber;
  tradeEvaluationStatus: TradeEvaluationStatus;
  tradeEvaluationError?: any;
  bestPrice?: BigNumber;
}

export interface ManualAllowanceProgressState {
  toggleAllowance: (token: string) => void;
  manualAllowancesProgress?: { [token: string]: ManualAllowanceProgress };
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
  message?: {
    top?: Message;
    bottom?: Message;
  };
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

export enum InstantFormChangeKind {
  viewChange = 'viewChange',
  tokenChange = 'tokenChange',
  buyAmountFieldChange = 'buyAmountFieldChange',
  sellAmountFieldChange = 'sellAmountFieldChange',
  pairChange = 'pairChange',
  formResetChange = 'reset',
  progressChange = 'progressChange',
  proxyChange = 'proxyChange',
  dustLimitsChange = 'dustLimitsChange',
  allowancesChange = 'allowancesChange',
  slippageLimitChange = 'slippageLimitChange',
  contextChange = 'contextChange',
  manualAllowanceChange = 'manualAllowanceChange'
}

export interface ProgressChange {
  kind: InstantFormChangeKind.progressChange;
  progress?: Progress;
}

export interface ViewChange {
  kind: InstantFormChangeKind.viewChange;
  view: ViewKind;
  meta?: any;
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

export interface TokenChange {
  kind: InstantFormChangeKind.tokenChange;
  token: string;
  side: OfferType;
}

export interface DustLimitsChange {
  kind: InstantFormChangeKind.dustLimitsChange;
  dustLimits: DustLimits;
}

export interface AllowancesChange {
  kind: InstantFormChangeKind.allowancesChange;
  allowances: Allowances;
}

export interface ProxyChange {
  kind: InstantFormChangeKind.proxyChange;
  value?: string;
}

export interface ContextChange {
  kind: InstantFormChangeKind.contextChange;
  context: NetworkConfig;
}

export interface SlippageLimitChange {
  kind: InstantFormChangeKind.slippageLimitChange;
  value: BigNumber;
}

export interface ManualAllowanceChange {
  kind: InstantFormChangeKind.manualAllowanceChange;
  token: string;
  progress: ManualAllowanceProgress;
}

export type ManualChange =
  BuyAmountChange |
  SellAmountChange |
  PairChange |
  TokenChange |
  FormResetChange |
  ViewChange |
  SlippageLimitChange |
  ManualAllowanceChange;

export type EnvironmentChange =
  GasPriceChange |
  EtherPriceUSDChange |
  BalancesChange |
  DustLimitsChange |
  AllowancesChange |
  ProxyChange |
  EtherBalanceChange |
  UserChange |
  ContextChange;

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
        slippageLimit: state.context
          ? getSlippageLimit(
            state.context,
            getQuote(weth2eth(state.sellToken), weth2eth(state.buyToken))
          )
          : state.slippageLimit,
        tradeEvaluationStatus: TradeEvaluationStatus.unset,
      };
    case InstantFormChangeKind.tokenChange:
      const { side, token } = change;
      const currentBuyToken = state.buyToken;
      const currentSellToken = state.sellToken;

      let buyToken = currentBuyToken;
      let sellToken = currentSellToken;
      let shouldClearInputs = false;
      if (side === OfferType.sell) {
        sellToken = token;
        shouldClearInputs = token !== currentSellToken;
      }

      if (side === OfferType.buy) {
        buyToken = token;
        shouldClearInputs = token !== currentBuyToken;
      }

      if (side === OfferType.buy && eth2weth(token) === eth2weth(currentSellToken)) {
        buyToken = token;
        sellToken = currentBuyToken;
        shouldClearInputs = true;
      }

      if (side === OfferType.sell && eth2weth(token) === eth2weth(currentBuyToken)) {
        buyToken = currentSellToken;
        sellToken = token;
        shouldClearInputs = true;
      }

      return {
        ...state,
        buyToken,
        sellToken,
        buyAmount: shouldClearInputs ? undefined : state.buyAmount,
        sellAmount: shouldClearInputs ? undefined : state.sellAmount,
        slippageLimit: state.context
          ? getSlippageLimit(
            state.context,
            getQuote(weth2eth(state.sellToken), weth2eth(state.buyToken))
          )
          : state.slippageLimit,
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
    case InstantFormChangeKind.allowancesChange:
      return {
        ...state,
        allowances: change.allowances
      };
    case InstantFormChangeKind.progressChange:

      if (change.progress) {
        return {
          ...state,
          progress: change.progress,
          view: change.progress.tradeTxStatus === TxStatus.Success
            ? ViewKind.summary
            : state.view
        };
      }

      return state;

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
    case InstantFormChangeKind.viewChange:
      return {
        ...state,
        view: change.view
      };
    case InstantFormChangeKind.proxyChange:
      return {
        ...state,
        view: state.view === ViewKind.allowances && !change.value
          ? ViewKind.account
          : state.view,
        proxyAddress: change.value
      };
    case InstantFormChangeKind.contextChange:
      return {
        ...state,
        context: change.context,
        slippageLimit: getSlippageLimit(
          change.context,
          getQuote(weth2eth(state.sellToken), weth2eth(state.buyToken))
        )
      };
    case FormChangeKind.userChange:
      return {
        ...state,
        view: !change.user.account && [
          ViewKind.priceImpactWarning,
          ViewKind.allowances,
          ViewKind.account
        ].includes(state.view) ? ViewKind.new : state.view,
        user: change.user
      };
    case InstantFormChangeKind.slippageLimitChange:
      return {
        ...state,
        slippageLimit: change.value
      };
    case InstantFormChangeKind.manualAllowanceChange:
      const manualAllowancesProgress = ({ ...state.manualAllowancesProgress } || {}) as any;
      manualAllowancesProgress[change.token] = change.progress;
      return {
        ...state,
        manualAllowancesProgress
      };
  }

  return state;
}

function evaluateBuy(calls: ReadCalls, state: InstantFormState) {

  const { buyToken, sellToken, buyAmount } = state;

  if (!buyToken || !sellToken || !buyAmount) {
    return of(state);
  }

  const errorItem = (error?: Error) => ({
    sellAmount: undefined,
    message: {
      top: {
        error,
        kind: MessageKind.orderbookTotalExceeded,
        amount: buyAmount,
        side: 'buy',
        token: buyToken,
      }
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
      top: {
        error,
        kind: MessageKind.orderbookTotalExceeded,
        amount: sellAmount,
        side: 'sell',
        token: sellToken,
      }
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

function evaluateTrade(
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

function validate(state: InstantFormState): InstantFormState {
  if (state.tradeEvaluationStatus !== TradeEvaluationStatus.calculated) {
    return state;
  }

  let message: {
    top?: Message,
    bottom?: Message
  } | undefined = state.message;

  const [spendField, receiveField] = ['sellToken', 'buyToken'];
  const [spendToken, receiveToken] = [state.sellToken, state.buyToken];
  const [spendAmount, receiveAmount] = [state.sellAmount, state.buyAmount];
  const dustLimits = state.dustLimits;
  const manualAllowancesProgress = state.manualAllowancesProgress;

  // In case when the orderbook is not big enough to fill an order
  // and the user hasn't connected his wallet, we have to display both errors
  if (!state.user || !state.user.account) {
    message = {
      ...message,
      bottom: {
        kind: MessageKind.notConnected,
        field: spendField,
      }
    };

    return {
      ...state,
      message,
    };
  }

  // In case there is an error displayed at the top
  // and the user has his wallet connected
  // we don't care about potential errors displayed at the bottom
  if (message && message.top) {
    return state;
  }

  if (state.progress && !state.progress.done) {
    message = {
      ...message,
      bottom: {
        kind: MessageKind.txInProgress,
        etherscan: state.context && state.context.etherscan,
        progress: state.progress,
        field: spendField,
      }
    };

    return {
      ...state,
      message
    };
  }

  if (manualAllowancesProgress) {
    const settingAllowanceInProgress = Object.keys(manualAllowancesProgress).find((token) =>
      manualAllowancesProgress[token] && !manualAllowancesProgress[token].done
    );

    if (settingAllowanceInProgress) {
      message = {
        ...message,
        bottom: {
          kind: MessageKind.txInProgress,
          etherscan: state.context && state.context.etherscan,
          progress: manualAllowancesProgress[settingAllowanceInProgress],
          field: spendField,
        }
      };
    }

    return {
      ...state,
      message
    };
  }

  // The rest of the errors are in order of importance.
  // Only bottom error is set since if we got here
  // that means we don't have any errors for the top

  if (
    spendAmount
    && dustLimits
    && dustLimits[eth2weth(spendToken)]
    && dustLimits[eth2weth(spendToken)].gt(spendAmount)
  ) {
    message = {
      bottom: {
        kind: MessageKind.dustAmount,
        amount: dustLimits[eth2weth(spendToken)],
        field: spendField,
        token: spendToken,
      }
    };
    return {
      ...state,
      message
    };
  }

  if (
    spendAmount
    && new BigNumber(tokens[eth2weth(spendToken)].maxSell).lt(spendAmount)
  ) {
    message = {
      bottom: {
        kind: MessageKind.incredibleAmount,
        field: spendField,
        token: spendToken,
        amount: new BigNumber(tokens[eth2weth(spendToken)].maxSell),
      }
    };
    return {
      ...state,
      message
    };
  }

  if (
    receiveAmount
    && dustLimits
    && dustLimits[eth2weth(receiveToken)]
    && dustLimits[eth2weth(receiveToken)].gt(receiveAmount)
  ) {
    message = {
      bottom: {
        kind: MessageKind.dustAmount,
        amount: dustLimits[eth2weth(receiveToken)],
        field: receiveField,
        token: receiveToken,
      }
    };
    return {
      ...state,
      message
    };
  }

  if (
    receiveAmount
    && new BigNumber(tokens[eth2weth(receiveToken)].maxSell).lt(receiveAmount)
  ) {
    message = {
      bottom: {
        kind: MessageKind.incredibleAmount,
        field: receiveField,
        token: receiveToken,
        amount: new BigNumber(tokens[eth2weth(receiveToken)].maxSell),
      }
    };
    return {
      ...state,
      message
    };
  }

  if (spendAmount && (
    spendToken === 'ETH'
    && state.etherBalance
    && state.etherBalance.lt(spendAmount)
    ||
    state.balances
    && state.balances[spendToken]
    && state.balances[spendToken].lt(spendAmount)
  )) {
    message = {
      bottom: {
        kind: MessageKind.insufficientAmount,
        field: spendField,
        amount: spendAmount,
        token: spendToken,
      }
    };
    return {
      ...state,
      message
    };
  }

  return state;
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

enum AllowanceDirection {
  locking = 'locking',
  unlocking = 'unlocking',
}

interface UnidirectionalManualAllowanceStatus {
  token: string;
  direction: AllowanceDirection;
  progress: TxState;
}

export function manualAllowanceSetup(
  theCalls$: Calls$,
  gasPrice$: GasPrice$,
  proxyAddress$: Observable<string>,
  allowances$: Observable<Allowances>
): [(token: string) => void, Observable<ManualAllowanceChange>] {
  const manualAllowanceProgressChanges$ = new Subject<ManualAllowanceChange>();
  const transactionStatus$ = new Subject<UnidirectionalManualAllowanceStatus>();

  function toggleAllowance(token: string) {
    theCalls$.pipe(
      first(),
      flatMap((calls) =>
        combineLatest(proxyAddress$, allowances$).pipe(
          take(1),
          flatMap(([proxyAddress, allowances]) =>
            combineLatest(calls.approveProxyEstimateGas({ token, proxyAddress }), gasPrice$).pipe(
              take(1),
              flatMap(([estimation, gasPrice]) => {
                const gasCost = {
                  gasPrice,
                  gasEstimation: estimation,
                };

                return allowances[token]
                  ? calls.disapproveProxy({ proxyAddress, token, ...gasCost }).pipe(
                    flatMap(progress => of({
                      token,
                      progress,
                      direction: AllowanceDirection.locking,
                    }))
                  )
                  : calls.approveProxy({ proxyAddress, token, ...gasCost }).pipe(
                    flatMap(progress => of({
                      token,
                      progress,
                      direction: AllowanceDirection.unlocking
                    }))
                  );
              })
            )
          )
        )
      ),
    ).subscribe((txStatus) => {
      transactionStatus$.next(txStatus);
    });
  }

  transactionStatus$.pipe(
    distinctUntilChanged(isEqual),
    flatMap((txStatus) => allowances$
      .pipe(
        flatMap(allowances => of([txStatus, allowances]))
      )),
    map(([status, allowances]) => {
      const { token, direction, progress } = status;

      manualAllowanceProgressChanges$.next({
        token,
        kind: InstantFormChangeKind.manualAllowanceChange,
        progress: {
          token,
          direction,
          kind: ProgressKind.onlyAllowance,
          allowanceTxStatus: progress.status,
          txHash: (progress as { txHash: string; }).txHash,
          done: isSuccess(progress) && (
            // If we are unlocking the given token, we wait until it's
            // allowed which will be visible on the next block check.
            (direction === 'unlocking' && allowances[token])
            // If we are locking the given token, we wait until it's
            // not allowed which will be visible on the next block check.
            || (direction === 'locking' && !allowances[token])
          ) || isDoneButNotSuccessful(progress)
        } as ManualAllowanceProgress
      });
    }),
    catchError(err => {
      console.log('Error caught:', err);
      return of(undefined);
    })
  ).subscribe();

  return [toggleAllowance, manualAllowanceProgressChanges$];
}

export function manualProxyCreation(
  theCalls$: Calls$,
  gasPrice$: GasPrice$,
): [() => void, Observable<ProgressChange>] {

  const proxyCreationChange$ = new Subject<ProgressChange>();

  function createProxy() {
    theCalls$.pipe(
      first(),
      switchMap(calls =>
        combineLatest(calls.setupProxyEstimateGas({}), gasPrice$)
          .pipe(
            switchMap(([estimatedGas, gasPrice]) =>
              calls.setupProxy({
                gasPrice,
                gasEstimation: estimatedGas
              })
            )
          )
      ),
    ).subscribe(progress => {
      proxyCreationChange$.next({
        kind: InstantFormChangeKind.progressChange,
        progress: {
          kind: ProgressKind.onlyProxy,
          proxyTxStatus: progress.status,
          txHash: (progress as { txHash: string; }).txHash,
          done: isDone(progress)
        }
      });
    });
  }

  return [createProxy, proxyCreationChange$];
}

function toDustLimitsChange(dustLimits$: Observable<DustLimits>): Observable<DustLimitsChange> {
  return dustLimits$.pipe(
    map(dustLimits => ({
      dustLimits,
      kind: InstantFormChangeKind.dustLimitsChange,
    } as DustLimitsChange))
  );
}

function toAllowancesChange(allowances$: Observable<Allowances>): Observable<AllowancesChange> {
  return allowances$.pipe(
    map(allowances => ({
      allowances,
      kind: InstantFormChangeKind.allowancesChange,
    } as AllowancesChange))
  );
}

function toProxyChange(proxyAddress$: Observable<string>): Observable<ProxyChange> {
  return proxyAddress$.pipe(
    map(proxy => ({
      value: proxy,
      kind: InstantFormChangeKind.proxyChange,
    } as ProxyChange))
  );
}

function toContextChange(context$: Observable<NetworkConfig>): Observable<ContextChange> {
  return context$.pipe(
    map(context => ({
      context,
      kind: InstantFormChangeKind.contextChange,
    } as ContextChange))
  );
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
