import { BigNumber } from 'bignumber.js';
import { curry } from 'ramda';
import { merge, Observable, Subject } from 'rxjs';
import { map, scan, shareReplay, startWith, switchMap } from 'rxjs/operators';

import { Balances, DustLimits } from '../balances/balances';
import { Calls, Calls$ } from '../blockchain/calls/calls';
import { InstantOrderData } from '../blockchain/calls/instant';
import { tokens } from '../blockchain/config';
// import { TxState, TxStatus } from '../blockchain/transactions';
import { /*Offer, */OfferType, Orderbook } from '../exchange/orderbook/orderbook';
import { TradingPair } from '../exchange/tradingPair/tradingPair';
import { combineAndMerge } from '../utils/combineAndMerge';
import {
  calculateAmount,
  calculateTotal,
  doGasEstimation,
  FormResetChange,
  GasEstimationStatus,
  HasGasEstimation,
  toBalancesChange,
  toDustLimitChange$,
  toEtherPriceUSDChange,
  toGasPriceChange,
  toOrderbookChange$,
} from '../utils/form';

export enum FormStage {
  editing = 'editing',
  readyToProceed = 'readyToProceed',
  waitingForApproval = 'waitingForApproval'
}

interface FormStageChange {
  kind: FormChangeKind.formStageChange;
  stage: FormStage;
}

export enum MessageKind {
  noAllowance = 'noAllowance',
  insufficientAmount = 'insufficientAmount',
  incredibleAmount = 'incredibleAmount',
  dustAmount = 'dustAmount',
  orderbookTotalExceeded = 'orderbookTotalExceeded',
}

export type Message = {
  kind: MessageKind.noAllowance | MessageKind.insufficientAmount
    | MessageKind.incredibleAmount;
  field: string;
  priority: number;
  token: string;
} | {
  kind: MessageKind.dustAmount;
  field: string;
  priority: number;
  token: string;
  amount: BigNumber;
} | {
  kind: MessageKind.orderbookTotalExceeded
  field: string;
  priority: number;
};

export interface InstantFormState extends HasGasEstimation {
  buyToken: string;
  sellToken: string;
  buyTokenDigits: number;
  sellTokenDigits: number;
  buyAmount?: BigNumber;
  sellAmount?: BigNumber;
  kind?: OfferType;
  buyAllowance?: boolean;
  sellAllowance?: boolean;
  messages: Message[];
  stage: FormStage;
  submit: (state: InstantFormState) => void;
  change: (change: ManualChange) => void;
  orderbook?: Orderbook;
  dustLimitQuote?: BigNumber;
  dustLimitBase?: BigNumber;
  balances?: Balances;
}

export enum FormChangeKind {
  buyAmountFieldChange = 'buyAmountFieldChange',
  sellAmountFieldChange = 'sellAmountFieldChange',
  pairChange = 'pairChange',
  formStageChange = 'stage',
  gasPriceChange = 'gasPrice',
  etherPriceUSDChange = 'etherPriceUSDChange',
  orderbookChange = 'orderbook',
  sellAllowanceChange = 'sellAllowance',
  buyAllowanceChange = 'buyAllowance',
  balancesChange = 'balancesChange',
  dustLimitChange = 'dustLimitChange',
}
export interface BuyAmountChange {
  kind: FormChangeKind.buyAmountFieldChange;
  value?: BigNumber;
}
export interface SellAmountChange {
  kind: FormChangeKind.sellAmountFieldChange;
  value?: BigNumber;
}
export interface PairChange {
  kind: FormChangeKind.pairChange;
  buyToken: string;
  sellToken: string;
}
export interface GasPriceChange {
  kind: FormChangeKind.gasPriceChange;
  value: BigNumber;
}
export interface EtherPriceUSDChange {
  kind: FormChangeKind.etherPriceUSDChange;
  value: BigNumber;
}
export interface OrderbookChange {
  kind: FormChangeKind.orderbookChange;
  orderbook: Orderbook;
}
export interface AllowanceChange {
  kind: FormChangeKind.buyAllowanceChange | FormChangeKind.sellAllowanceChange;
  allowance: boolean;
}
export interface BalancesChange {
  kind: FormChangeKind.balancesChange;
  balances: Balances;
}
export interface DustLimitChange {
  kind: FormChangeKind.dustLimitChange;
  dustLimitBase: BigNumber;
  dustLimitQuote: BigNumber;
}
function toAllowanceChange$(
  kind: FormChangeKind.buyAllowanceChange | FormChangeKind.sellAllowanceChange,
  token: string,
  theAllowance$: (token: string) => Observable<boolean>): Observable<AllowanceChange> {
  return theAllowance$(token).pipe(
    map((allowance: boolean) => ({ kind, allowance } as AllowanceChange))
  );
}

export type ManualChange =
  BuyAmountChange |
  SellAmountChange |
  PairChange;

export type EnvironmentChange =
  GasPriceChange |
  EtherPriceUSDChange |
  AllowanceChange |
  OrderbookChange |
  BalancesChange |
  DustLimitChange;

export type StageChange =
  FormResetChange |
  FormStageChange;

export type InstantFormChange = ManualChange | EnvironmentChange | StageChange;

function instantOrderData(state: InstantFormState): InstantOrderData {
  return {
    buyAmount: state.buyAmount as BigNumber,
    buyToken: state.buyToken,
    sellAmount: state.sellAmount as BigNumber,
    sellToken: state.sellToken,
  };
}

function applyChange(state: InstantFormState, change: InstantFormChange): InstantFormState {
  switch (change.kind) {
    case FormChangeKind.pairChange:
      return {
        ...state,
        buyToken: change.buyToken,
        sellToken: change.sellToken,
        buyAmount: undefined,
        sellAmount: undefined,
      };
    case FormChangeKind.sellAmountFieldChange:
      if (!state.orderbook) {
        return state;
      }
      return {
        ...state,
        kind: OfferType.sell,
        sellAmount: change.value,
        buyAmount: calculateTotal(change.value, state.orderbook.buy),
      };
    case FormChangeKind.buyAmountFieldChange:
      if (!state.orderbook) {
        return state;
      }
      return {
        ...state,
        kind: OfferType.buy,
        buyAmount: change.value,
        sellAmount: calculateAmount(change.value, state.orderbook.buy),
      };
    case FormChangeKind.gasPriceChange:
      return {
        ...state,
        gasPrice: change.value,
        gasEstimationStatus: GasEstimationStatus.unset
      };
    case FormChangeKind.etherPriceUSDChange:
      return {
        ...state,
        etherPriceUsd: change.value,
        gasEstimationStatus: GasEstimationStatus.unset
      };
    case FormChangeKind.orderbookChange:
      return {
        ...state,
        orderbook: change.orderbook
      };
    case FormChangeKind.buyAllowanceChange:
      return { ...state, buyAllowance: change.allowance };
    case FormChangeKind.sellAllowanceChange:
      return { ...state, sellAllowance: change.allowance };
    case FormChangeKind.balancesChange:
      return {
        ...state,
        balances: change.balances,
        gasEstimationStatus: GasEstimationStatus.unset
      };
    case FormChangeKind.dustLimitChange:
      return {
        ...state,
        dustLimitBase: change.dustLimitBase,
        dustLimitQuote: change.dustLimitQuote
      };
  }
  return state;
}

function addGasEstimation(theCalls$: Calls$,
                          state: InstantFormState): Observable<InstantFormState> {
  return doGasEstimation(theCalls$, state, (calls: Calls) =>
    state.messages.length !== 0 ||
    !state.buyAmount ||
    !state.sellAmount ?
      undefined :
      calls.instantOrderEstimateGas(instantOrderData(state))
  );
}

function preValidate(state: InstantFormState): InstantFormState {
  if (state.stage !== FormStage.editing) {
    return state;
  }

  const messages: Message[] = [];

  return {
    ...state,
    messages,
    gasEstimationStatus: GasEstimationStatus.unset,
  } as InstantFormState;
}

function postValidate(state: InstantFormState): InstantFormState {
  if (state.stage !== FormStage.editing) {
    return state;
  }
  if (state.gasEstimationStatus === GasEstimationStatus.calculated &&
    state.buyAmount && state.sellAmount &&
    state.messages.length === 0) {
    return { ...state, stage: FormStage.readyToProceed };
  }
  return { ...state, stage: FormStage.editing };
}

export function createFormController$(
  params: {
    gasPrice$: Observable<BigNumber>;
    allowance$: (token: string) => Observable<boolean>;
    balances$: Observable<Balances>;
    dustLimits$: Observable<DustLimits>;
    orderbook$: Observable<Orderbook>,
    calls$: Calls$;
    etherPriceUsd$: Observable<BigNumber>
  },
  tradingPair: TradingPair
): Observable<InstantFormState> {

  const manualChange$ = new Subject<ManualChange>();

  const environmentChange$ = combineAndMerge(
    toGasPriceChange(params.gasPrice$),
    toEtherPriceUSDChange(params.etherPriceUsd$),
    toOrderbookChange$(params.orderbook$),
    toDustLimitChange$(params.dustLimits$, tradingPair.base, tradingPair.quote),
    toAllowanceChange$(FormChangeKind.buyAllowanceChange, tradingPair.base, params.allowance$),
    toAllowanceChange$(FormChangeKind.sellAllowanceChange, tradingPair.quote, params.allowance$),
    toBalancesChange(params.balances$),
  );

  const initialState: InstantFormState = {
    submit: null as any,
    change: manualChange$.next.bind(manualChange$),
    buyToken: tradingPair.quote,
    sellToken: tradingPair.base,
    buyTokenDigits: tokens[tradingPair.quote].digits,
    sellTokenDigits: tokens[tradingPair.base].digits,
    buyAmount: undefined,
    sellAmount: undefined,
    kind: undefined,
    buyAllowance: undefined,
    sellAllowance: undefined,
    stage: FormStage.editing,
    messages: [],
    gasEstimationStatus: GasEstimationStatus.unset,
  };

  return merge(
    manualChange$,
    environmentChange$,
  ).pipe(
    scan(applyChange, initialState),
    map(preValidate),
    switchMap(curry(addGasEstimation)(params.calls$)),
    map(postValidate),
    startWith(initialState),
    shareReplay(1),
  );
}
