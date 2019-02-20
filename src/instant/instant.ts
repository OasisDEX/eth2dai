import { BigNumber } from 'bignumber.js';
import { merge, Observable, Subject } from 'rxjs';
import { scan, shareReplay, startWith } from 'rxjs/operators';

import { Balances, DustLimits } from '../balances/balances';
import { /*Calls, */Calls$ } from '../blockchain/calls/calls';
import { tokens } from '../blockchain/config';
// import { TxState, TxStatus } from '../blockchain/transactions';
import { /*Offer, */OfferType, Orderbook } from '../exchange/orderbook/orderbook';
import { TradingPair } from '../exchange/tradingPair/tradingPair';
import { combineAndMerge } from '../utils/combineAndMerge';
import {
  AllowanceChange,
  BalancesChange,
  calculateAmount,
  calculateTotal,
  DustLimitChange,
  FormResetChange,
  GasEstimationStatus,
  HasGasEstimation,
  toEtherPriceUSDChange,
  toGasPriceChange,
  toOrderbookChange$,
} from '../utils/form';
// import { firstOfOrTrue } from '../utils/operators';
// import { zero } from '../utils/zero';

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

function applyChange(state: InstantFormState, change: InstantFormChange): InstantFormState {
  switch (change.kind) {
    case FormChangeKind.pairChange:
      return { ...state, buyToken: change.buyToken, sellToken: change.sellToken };
    case FormChangeKind.sellAmountFieldChange:
      if (!state.orderbook) {
        return state;
      }
      return {
        ...state,
        sellAmount: change.value,
        buyAmount: calculateTotal(change.value, state.orderbook.buy),
      };
    case FormChangeKind.buyAmountFieldChange:
      if (!state.orderbook) {
        return state;
      }
      return {
        ...state,
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
  }
  return state;
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
    startWith(initialState),
    shareReplay(1),
  );
}
