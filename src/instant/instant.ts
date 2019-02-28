import { BigNumber } from 'bignumber.js';

import { isEqual } from 'lodash';
import { curry } from 'ramda';
import { combineLatest, merge, Observable, of, Subject } from 'rxjs';
import {
  catchError, delay,
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
import { Balances, DustLimits } from '../balances/balances';
import { Calls, Calls$ } from '../blockchain/calls/calls';
import { InstantOrderData } from '../blockchain/calls/instant';
import { TxState, TxStatus } from '../blockchain/transactions';
import { OfferType, Orderbook } from '../exchange/orderbook/orderbook';
import { TradingPair } from '../exchange/tradingPair/tradingPair';
import { combineAndMerge } from '../utils/combineAndMerge';
import {
  doGasEstimation,
  GasEstimationStatus,
  HasGasEstimation,
  toBalancesChange,
  toDustLimitChange$,
  toEtherPriceUSDChange,
  toGasPriceChange,
  toOrderbookChange$,
} from '../utils/form';
import { tokens } from 'src/blockchain/config';

export enum FormStage {
  editing = 'editing',
  readyToProceed = 'readyToProceed',
  waitingForApproval = 'waitingForApproval'
}

interface FormStageChange {
  kind: FormChangeKind.formStageChange;
  stage: FormStage;
}
export interface FormResetChange {
  kind: FormChangeKind.formResetChange;
}

function formStageChange(stage: FormStage): FormStageChange {
  return { stage, kind: FormChangeKind.formStageChange };
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
  kind: MessageKind.noAllowance | MessageKind.insufficientAmount
    | MessageKind.incredibleAmount;
  field: string;
  priority: number;
  token: string;
  placement: Placement;
} | {
  kind: MessageKind.dustAmount;
  field: string;
  priority: number;
  token: string;
  amount: BigNumber;
  placement: Placement;
} | {
  kind: MessageKind.orderbookTotalExceeded
  field: string;
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

export interface InstantFormState extends HasGasEstimation {
  baseToken: string;
  buyToken: string;
  sellToken: string;
  // buyTokenDigits: number;
  // sellTokenDigits: number;
  buyAmount?: BigNumber;
  sellAmount?: BigNumber;
  kind?: OfferType;
  buyAllowance?: boolean;
  sellAllowance?: boolean;
  message?: Message;
  stage: FormStage;
  submit: (state: InstantFormState) => void;
  change: (change: ManualChange) => void;
  dustLimitQuote?: BigNumber;
  dustLimitBase?: BigNumber;
  balances?: Balances;
  tradeEvaluationStatus: TradeEvaluationStatus;
  tradeEvaluationError?: any;
  bestPrice?: BigNumber;
}

export enum FormChangeKind {
  buyAmountFieldChange = 'buyAmountFieldChange',
  sellAmountFieldChange = 'sellAmountFieldChange',
  pairChange = 'pairChange',
  formStageChange = 'stage',
  formResetChange = 'reset',
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

function isBaseToken(token: string, base: string) {
  return base === token || base === 'WETH' && token === 'ETH';
}

function instantOrderData(state: InstantFormState): InstantOrderData {
  return {
    kind: state.kind as OfferType,
    buyAmount: state.buyAmount as BigNumber,
    buyToken: state.buyToken,
    sellAmount: state.sellAmount as BigNumber,
    sellToken: state.sellToken,
    gasEstimation: state.gasEstimation as number,
    gasPrice: state.gasPrice as BigNumber,
  };
}

function applyChange(state: InstantFormState, change: InstantFormChange): InstantFormState {
  switch (change.kind) {
    case FormChangeKind.pairChange:
      return {
        ...state,
        buyToken: change.buyToken,
        sellToken: change.sellToken,
        kind: undefined,
        buyAmount: undefined,
        sellAmount: undefined,
        tradeEvaluationStatus: TradeEvaluationStatus.unset,
      };
    case FormChangeKind.sellAmountFieldChange:
      return {
        ...state,
        kind: OfferType.sell,
        sellAmount: change.value,
      };
    case FormChangeKind.buyAmountFieldChange:
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
    case FormChangeKind.buyAllowanceChange:
      return {
        ...state,
        buyAllowance: change.allowance,
      };
    case FormChangeKind.sellAllowanceChange:
      return {
        ...state,
        sellAllowance: change.allowance,
      };
    case FormChangeKind.balancesChange:
      return {
        ...state,
        balances: change.balances,
      };
    case FormChangeKind.dustLimitChange:
      return {
        ...state,
        dustLimitBase: change.dustLimitBase,
        dustLimitQuote: change.dustLimitQuote
      };
    case FormChangeKind.formStageChange:
      return { ...state, stage: change.stage };
    case FormChangeKind.formResetChange:
      return {
        ...state,
        stage: FormStage.editing,
        buyAmount: undefined,
        sellAmount: undefined,
        gasEstimationStatus: GasEstimationStatus.unset
      };
  }
  return state;
}

// function addGasEstimation(theCalls$: Calls$,
//                           state: InstantFormState): Observable<InstantFormState> {
//   return doGasEstimation(theCalls$, state, (calls: Calls) => {
//
//     return (
//     state.messages.length !== 0 ||
//     !state.buyAmount ||
//     !state.sellAmount ?
//       undefined :
//       calls.instantOrderEstimateGas(instantOrderData(state))
//     );
//   });
// }

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
      tradeEvaluationStatus: TradeEvaluationStatus.error,
      tradeEvaluationError: {
        kind: MessageKind.orderbookTotalExceeded,
        field: "buyToken",
        priority: 3,
        placement: Position.TOP
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
      tradeEvaluationStatus: TradeEvaluationStatus.error,
      tradeEvaluationError: {
        kind: MessageKind.orderbookTotalExceeded,
        field: "sellToken",
        priority: 3,
        placement: Position.TOP
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
  return theCalls$.pipe(
      first(),
      flatMap(calls =>
        combineLatest(
          state.kind === OfferType.buy ? evaluateBuy(calls, state) : evaluateSell(calls, state),
          getBestPrice(calls, state.sellToken, state.buyToken)
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
        tradeEvaluationError: {
          kind: MessageKind.custom,
          error: err,
          field: state.kind === OfferType.buy ? "buyToken" : "sellToken",
          priority: 3,
          placement: Position.TOP
        },
      })}),
      startWith({ ...state, tradeEvaluationStatus: TradeEvaluationStatus.calculating }),
  );
}

function postValidate(state: InstantFormState): InstantFormState {  
  
  if (state.stage !== FormStage.editing) {
    return state;
  }

  let message: Message | undefined  = state.tradeEvaluationError;
  const [spendField, receiveField] = ['sellToken', 'buyToken'];
  const [spendToken, receiveToken] = [state.sellToken, state.buyToken];
  const [spendAmount, receiveAmount] = [state.sellAmount, state.buyAmount];
  const dustLimit = isBaseToken(state.buyToken, state.baseToken) ? state.dustLimitBase : state.dustLimitQuote;
  
  if (receiveAmount && spendAmount) {
    if (state.balances && state.balances[spendToken].lt(spendAmount)) {
      message = prioritize(message, {
        kind: MessageKind.insufficientAmount,
        field: spendField,
        priority: 1,
        token: spendToken,
        placement: Position.BOTTOM
      });
    }
    if ((dustLimit || new BigNumber(0)).gt(spendAmount)) {
      message = prioritize(message,{
        kind: MessageKind.dustAmount,
        field: spendField,
        priority: 2,
        token: spendToken,
        amount: dustLimit || new BigNumber(0),
        placement: Position.BOTTOM
      });
    }
  }
  if (spendAmount && new BigNumber(tokens[spendToken].maxSell).lt(spendAmount)) {
    message = prioritize(message,{
      kind: MessageKind.incredibleAmount,
      field: spendField,
      priority: 2,
      token: spendToken,
      placement: Position.BOTTOM
    });
  }
  if (receiveAmount && new BigNumber(tokens[receiveToken].maxSell).lt(receiveAmount)) {
    message = prioritize(message,{
      kind: MessageKind.incredibleAmount,
      field: receiveField,
      priority: 1,
      token: receiveToken,
      placement: Position.BOTTOM
    });
  }

  return {
    ...state,
    tradeEvaluationStatus : message ? TradeEvaluationStatus.error : state.tradeEvaluationStatus,
    tradeEvaluationError: message
  } as InstantFormState;
}

function prepareSubmit(calls$: Calls$):
  [(state: InstantFormState) => void, Observable<StageChange | FormResetChange>] {

  const stageChange$ = new Subject<StageChange>();

  function submit(state: InstantFormState) {

    calls$.pipe(
      first(),
      switchMap((calls: Calls) => {
        return calls.instantOrder(instantOrderData(state)).pipe(
          switchMap((transactionState: TxState) => {
            switch (transactionState.status) {
              case TxStatus.CancelledByTheUser:
                return of(formStageChange(FormStage.editing));
              case TxStatus.WaitingForConfirmation:
                return of({ kind: FormChangeKind.formResetChange });
              default:
                return of();
            }
          }),
          startWith(formStageChange(FormStage.waitingForApproval)),
        );
      })
    ).subscribe(change => stageChange$.next(change));
  }

  return [submit, stageChange$];
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

  const [submit, submitChange$] = prepareSubmit(params.calls$);

  const initialState: InstantFormState = {
    submit,
    change: manualChange$.next.bind(manualChange$),
    baseToken: tradingPair.base,
    buyToken: tradingPair.quote,
    sellToken: tradingPair.base,
    buyAmount: undefined,
    sellAmount: undefined,
    kind: undefined,
    buyAllowance: undefined,
    sellAllowance: undefined,
    stage: FormStage.editing,
    gasEstimationStatus: GasEstimationStatus.unset,
    tradeEvaluationStatus: TradeEvaluationStatus.unset,
  };

  return merge(
    manualChange$,
    submitChange$,
    environmentChange$,
  ).pipe(
    scan(applyChange, initialState),
    distinctUntilChanged(isEqual),
    switchMap(curry(evaluateTrade)(params.calls$)),
    // switchMap(curry(addGasEstimation)(params.calls$)),
    map(postValidate),
    shareReplay(1),
  );
}

const prioritize = (current: Message = { priority: 0 } as Message, candidate: Message) => {
  if(current.priority < candidate.priority) {
    return candidate;
  }

  return current;
}
