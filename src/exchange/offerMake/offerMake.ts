import { BigNumber } from 'bignumber.js';
import { curry } from 'ramda';
import { merge, Observable, of, Subject } from 'rxjs';
import { first, map, scan, shareReplay, startWith, switchMap } from 'rxjs/operators';

import { Balances, DustLimits } from '../../balances/balances';
import { Calls, Calls$ } from '../../blockchain/calls/calls';
import { OfferMakeData, OfferMakeDirectData } from '../../blockchain/calls/offerMake';
import { tokens } from '../../blockchain/config';
import { TxState, TxStatus } from '../../blockchain/transactions';
import { combineAndMerge } from '../../utils/combineAndMerge';
import {
  AllowanceChange,
  AmountFieldChange,
  BalancesChange,
  doGasEstimation,
  DustLimitChange,
  EtherPriceUSDChange,
  FormChangeKind,
  FormResetChange,
  GasEstimationStatus,
  GasPriceChange,
  HasGasEstimation,
  KindChange,
  MatchTypeChange,
  OfferMatchType,
  OrderbookChange,
  PickOfferChange,
  PriceFieldChange,
  SetMaxChange,
  toAllowanceChange$,
  toBalancesChange,
  toDustLimitChange$,
  toEtherPriceUSDChange,
  toGasPriceChange,
  toOrderbookChange$
} from '../../utils/form';
import { firstOfOrTrue } from '../../utils/operators';
import { zero } from '../../utils/zero';
import { Offer, OfferType, Orderbook } from '../orderbook/orderbook';
import { TradingPair } from '../tradingPair/tradingPair';

export enum FormStage {
  editing = 'editing',
  readyToProceed = 'readyToProceed',
  waitingForApproval = 'waitingForApproval'
}

interface FormStageChange {
  kind: FormChangeKind.formStageChange;
  stage: FormStage;
}

function formStageChange(stage: FormStage): FormStageChange {
  return { stage, kind: FormChangeKind.formStageChange };
}

export enum MessageKind {
  noAllowance = 'noAllowance',
  insufficientAmount = 'insufficientAmount',
  incredibleAmount = 'incredibleAmount',
  dustAmount = 'dustAmount',
  orderbookTotalExceeded = 'orderbookTotalExceeded',
  slippageLimitNotSet = 'slippageNotSet',
  slippageLimitToLow = 'slippageLimitToLow',
  slippageLimitToHigh = 'slippageLimitToHigh',
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
  kind: MessageKind.slippageLimitToHigh |
    MessageKind.slippageLimitToLow |
    MessageKind.slippageLimitNotSet | MessageKind.orderbookTotalExceeded
  field: string;
  priority: number;
};

// export enum FormStage {
//   editing = 'editing',
//   readyToProceed = 'readyToProceed',
//   waitingForApproval = 'waitingForApproval'
// }

export interface OfferFormState extends HasGasEstimation {
  baseToken: string;
  quoteToken: string;
  baseTokenDigits: number;
  quoteTokenDigits: number;
  kind: OfferType;
  matchType: OfferMatchType;
  price?: BigNumber;
  amount?: BigNumber;
  total?: BigNumber;
  priceImpact?: BigNumber;
  slippageLimit?: BigNumber;
  buyAllowance?: boolean;
  sellAllowance?: boolean;
  position?: BigNumber;
  messages: Message[];
  stage: FormStage;
  pickerOpen: boolean;
  submit: (state: OfferFormState) => void;
  change: (change: ManualChange) => void;
  orderbook?: Orderbook;
  dustLimitQuote?: BigNumber;
  dustLimitBase?: BigNumber;
  balances?: Balances;
}

export enum OfferMakeChangeKind {
  pickerOpenChange = 'pickerOpenChange',
  slippageLimitChange = 'slippageLimitChange'
}

export interface PickerOpenChange {
  kind: OfferMakeChangeKind.pickerOpenChange;
}

export interface SlippageLimitChange {
  kind: OfferMakeChangeKind.slippageLimitChange;
  value?: BigNumber;
}

export type ManualChange =
  PriceFieldChange |
  AmountFieldChange |
  PickOfferChange |
  PickerOpenChange |
  SlippageLimitChange |
  MatchTypeChange |
  SetMaxChange |
  KindChange;

export type EnvironmentChange =
  GasPriceChange |
  EtherPriceUSDChange |
  AllowanceChange |
  OrderbookChange |
  BalancesChange |
  DustLimitChange;

// export interface FormStageChange {
//   kind: FormChangeKind.formStageChange;
//   stage: FormStage;
// }

export type StageChange =
  FormResetChange |
  FormStageChange;

export type OfferFormChange = ManualChange | EnvironmentChange | StageChange;

function offerMakeData(state: OfferFormState): OfferMakeData {
  const { amount, total, baseToken, quoteToken, position, kind, matchType, gasPrice, gasEstimation } = state;
  const buySell = kind === OfferType.buy ? {
    buyAmount: amount as BigNumber, buyToken: baseToken,
    sellAmount: total as BigNumber, sellToken: quoteToken
  } : {
    buyAmount: total as BigNumber, buyToken: quoteToken,
    sellAmount: amount as BigNumber, sellToken: baseToken
  };
  return {
    ...buySell,
    matchType,
    position,
    kind,
    gasEstimation,
    gasPrice: gasPrice as BigNumber,
  };
}

function offerMakeDirectData(state: OfferFormState): OfferMakeDirectData {
  const {
    amount, total, baseToken, quoteToken, price,
    kind, slippageLimit, matchType, gasPrice, gasEstimation
  } = state;
  return {
    baseToken,
    quoteToken,
    matchType,
    kind,
    gasEstimation,
    baseAmount: amount as BigNumber,
    quoteAmount: (total as BigNumber)
      .times(new BigNumber(1)
        .plus((slippageLimit as BigNumber)
          .plus(0.001)
          .dividedBy(
            kind === 'buy' ? 100 : -100
          )
        )),
    price: price as BigNumber,
    gasPrice: gasPrice as BigNumber,
  };
}

function directMatchTotal(amount: BigNumber | undefined, orders: Offer[]): BigNumber | undefined {
  if (!amount) return undefined;
  let baseAmount = amount;
  let quoteAmount = new BigNumber(0);
  for (const offer of orders) {
    if (baseAmount.lte(new BigNumber(0))) {
      break;
    }
    if (baseAmount.gte(offer.baseAmount)) {
      quoteAmount = quoteAmount.plus(offer.quoteAmount);
      baseAmount = baseAmount.minus(offer.baseAmount);
    } else {
      quoteAmount = quoteAmount.plus(
        offer.quoteAmount.times(baseAmount).dividedBy(offer.baseAmount)
      );
      baseAmount = new BigNumber(0);
    }
  }
  return !baseAmount.isZero() ? undefined : quoteAmount;
}

function directMatchState(state: OfferFormState,
                          change: { amount: BigNumber } | { kind: OfferType } | {},
                          orderbook: Orderbook) {
  const amount = change.hasOwnProperty('amount') ? (change as any).amount : state.amount;
  const kind = change.hasOwnProperty('kind') ? (change as any).kind : state.kind;
  const orders = kind === 'buy' ? orderbook.sell : orderbook.buy;
  const total = directMatchTotal(amount, orders);
  const price = amount && total && (amount.isZero() ? undefined : total.dividedBy(amount));
  return {
    ...state,
    kind,
    amount,
    price,
    total,
    priceImpact: price && orders[0] &&
      (price.minus(orders[0].price).dividedBy(orders[0].price)).times(100).abs(),
    matchType: OfferMatchType.direct,
    gasEstimationStatus: GasEstimationStatus.unset
  };
}

// function assertUnreachable(x: never): never {
//   throw new Error('Didn\'t expect to get here');
// }

function applyChange(state: OfferFormState,
                     change: OfferFormChange): OfferFormState {
  switch (change.kind) {
    case FormChangeKind.kindChange:
      if (state.matchType === OfferMatchType.direct && state.orderbook) {
        return directMatchState(state, { kind: change.newKind }, state.orderbook);
      }
      return {
        ...state,
        kind: change.newKind,
        gasEstimationStatus: GasEstimationStatus.unset
      };
    case FormChangeKind.matchTypeChange:
      if (change.matchType === OfferMatchType.direct && state.orderbook) {
        return directMatchState(state, {}, state.orderbook);
      }
      return {
        ...state,
        matchType: change.matchType,
      };
    case FormChangeKind.pickOfferChange:
      if (state.matchType === OfferMatchType.direct && state.orderbook) {
        return directMatchState(
          state, {
            kind: change.offer.type === OfferType.buy ? OfferType.sell : OfferType.buy,
            amount: change.offer.baseAmount
          },
          state.orderbook
        );
      }

      let newState = applyChange(
        state,
        {
          kind: FormChangeKind.kindChange,
          newKind: change.offer.type === OfferType.buy ? OfferType.sell : OfferType.buy
        }
      );
      newState = applyChange(
        newState,
        {
          kind: FormChangeKind.amountFieldChange,
          value: new BigNumber(change.offer.baseAmount.toFixed(tokens[state.baseToken].digits))
        }
      );
      return applyChange(
        newState,
        {
          kind: FormChangeKind.priceFieldChange,
          value: new BigNumber(change.offer.price.toFixed(
            tokens[state.quoteToken].digits,
            change.offer.type === OfferType.buy ? BigNumber.ROUND_DOWN : BigNumber.ROUND_UP,
          ))
        }
      );
    case OfferMakeChangeKind.pickerOpenChange:
      return {
        ...state,
        pickerOpen: !state.pickerOpen,
      };
    case FormChangeKind.amountFieldChange:
      if (state.matchType === OfferMatchType.direct && state.orderbook) {
        return directMatchState(state, { amount: change.value }, state.orderbook);
      }
      return {
        ...state,
        amount: change.value,
        ...change.value && state.price
          ? { total: change.value.multipliedBy(state.price) }
          : {},
        gasEstimationStatus: GasEstimationStatus.unset
      };
    case FormChangeKind.priceFieldChange:
      return {
        ...state,
        price: change.value,
        ...change.value && state.amount
          ? { total: change.value.multipliedBy(state.amount) }
          : {},
        gasEstimationStatus: GasEstimationStatus.unset
      };
    case FormChangeKind.setMaxChange:
      if (state.balances === undefined) {
        return state;
      }
      if (state.matchType === OfferMatchType.direct && state.orderbook) {
        switch (state.kind) {
          case OfferType.sell:
            return directMatchState(state, { amount: state.balances[state.baseToken] }, state.orderbook);
          case OfferType.buy:
            return state;
        }
      }
      switch (state.kind) {
        case OfferType.sell:
          if (state.price) {
            return {
              ...state,
              amount: state.balances[state.baseToken],
              total: state.balances[state.baseToken].times(state.price),
              gasEstimationStatus: GasEstimationStatus.unset
            };
          }

          return applyChange(
            state,
            { kind: FormChangeKind.amountFieldChange, value:state.balances[state.baseToken]
            }
          );
        case OfferType.buy:
          if (state.price) {
            return {
              ...state,
              amount: state.balances[state.quoteToken].dividedBy(state.price),
              total: state.balances[state.quoteToken],
              gasEstimationStatus: GasEstimationStatus.unset
            };
          }
          return {
            ...state,
          };
      }
      return {
        ...state,
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
    case FormChangeKind.buyAllowanceChange:
      return { ...state, buyAllowance: change.allowance };
    case FormChangeKind.sellAllowanceChange:
      return { ...state, sellAllowance: change.allowance };
    case FormChangeKind.formStageChange:
      return { ...state, stage: change.stage };
    case FormChangeKind.formResetChange:
      return {
        ...state,
        stage: FormStage.editing,
        price: undefined,
        amount: undefined,
        total: undefined,
        gasEstimationStatus: GasEstimationStatus.unset
      };
    case FormChangeKind.dustLimitChange:
      return {
        ...state,
        dustLimitBase: change.dustLimitBase,
        dustLimitQuote: change.dustLimitQuote
      };
    case FormChangeKind.orderbookChange:
      return {
        ...state,
        orderbook: change.orderbook
      };
    case FormChangeKind.balancesChange:
      return {
        ...state,
        balances: change.balances,
        gasEstimationStatus: GasEstimationStatus.unset
      };
    case OfferMakeChangeKind.slippageLimitChange:
      return {
        ...state,
        slippageLimit: change.value
      };
  }
  // return assertUnreachable(change.kind);
  // return state;
}

function addGasEstimation(theCalls$: Calls$,
                          state: OfferFormState): Observable<OfferFormState> {
  return doGasEstimation(theCalls$, state, (calls: Calls) =>
    state.messages.length !== 0 ||
    !state.amount ||
    !state.slippageLimit ||
    !state.price ?
      undefined :
      state.matchType === OfferMatchType.direct ?
        calls.offerMakeDirectEstimateGas(offerMakeDirectData(state)) :
        calls.offerMakeEstimateGas(offerMakeData(state)));
}

function preValidate(state: OfferFormState): OfferFormState {

  if (state.stage !== FormStage.editing) {
    return state;
  }

  const messages: Message[] = [];
  const allowance = state.kind === 'sell' ? state.buyAllowance : state.sellAllowance;
  if (state.price && state.amount && state.total) {
    const [spendAmount, spendToken, spendField, dustLimit,
      receiveAmount, receiveToken, receiveField] =
      state.kind === OfferType.sell ?
      [state.amount, state.baseToken, 'amount', state.dustLimitBase,
        state.total, state.quoteToken, 'total'] :
      [state.total, state.quoteToken, 'total', state.dustLimitQuote,
        state.amount, state.baseToken, 'amount'];
    if (allowance === false) {
      messages.push({
        kind: MessageKind.noAllowance,
        field: spendField,
        priority: 100,
        token: spendToken,
      });
    }
    if (state.balances && state.balances[spendToken].lt(spendAmount)) {
      messages.push({
        kind: MessageKind.insufficientAmount,
        field: spendField,
        priority: 1,
        token: spendToken,
      });
    }
    if ((dustLimit || new BigNumber(0)).gt(spendAmount)) {
      messages.push({
        kind: MessageKind.dustAmount,
        field: spendField,
        priority: 2,
        token: spendToken,
        amount: dustLimit || new BigNumber(0),
      });
    }
    if (new BigNumber(tokens[spendToken].maxSell).lt(spendAmount)) {
      messages.push({
        kind: MessageKind.incredibleAmount,
        field: spendField,
        priority: 2,
        token: spendToken,
      });
    }
    if (new BigNumber(tokens[receiveToken].maxSell).lt(receiveAmount)) {
      messages.push({
        kind: MessageKind.incredibleAmount,
        field: receiveField,
        priority: 1,
        token: receiveToken,
      });
    }
  }

  if (state.matchType === OfferMatchType.direct && !state.price && state.amount && !state.amount.eq(0)) {
    messages.push({
      kind: MessageKind.orderbookTotalExceeded,
      field: 'amount',
      priority: 3,
    });
  }

  if (!state.slippageLimit) {
    messages.push({
      kind: MessageKind.slippageLimitNotSet,
      field: 'slippageLimit',
      priority: 1,
    });
  }

  if (state.slippageLimit && state.slippageLimit.gt(new BigNumber('15'))) {
    messages.push({
      kind: MessageKind.slippageLimitToHigh,
      field: 'slippageLimit',
      priority: 1,
    });
  }

  if (state.slippageLimit && state.slippageLimit.lt(zero)) {
    messages.push({
      kind: MessageKind.slippageLimitToLow,
      field: 'slippageLimit',
      priority: 1,
    });
  }

  return {
    ...state,
    messages,
    gasEstimationStatus: GasEstimationStatus.unset,
  } as OfferFormState;
}

function addPositionGuess({ position, ...state }: OfferFormState): OfferFormState {
  if (!state.price || !state.orderbook) {
    return state;
  }

  const orderBook = state.orderbook;

  const offer: Offer | undefined = state.kind === 'sell' ? (
    orderBook.sell.length === 0 ? undefined :
      (orderBook.sell.find(order => order.price.gt(state.price as BigNumber)) ||
        orderBook.sell[orderBook.sell.length - 1])
  ) : (
    orderBook.buy.length === 0 ? undefined :
      (orderBook.buy.find(order => order.price.lt(state.price as BigNumber)) ||
        orderBook.buy[orderBook.buy.length - 1])
  );

  return offer ?
    { ...state, position: offer.offerId } :
    state;
}

function postValidate(state: OfferFormState): OfferFormState {
  if (state.stage !== FormStage.editing) {
    return state;
  }
  if (state.gasEstimationStatus === GasEstimationStatus.calculated &&
    state.total && state.amount && state.price &&
    state.messages.length === 0) {
    return { ...state, stage: FormStage.readyToProceed };
  }
  return { ...state, stage: FormStage.editing };
}

function prepareSubmit(calls$: Calls$): [
  (state: OfferFormState) => void, Observable<StageChange | FormResetChange>] {

  const stageChange$ = new Subject<StageChange>();

  function submit(state: OfferFormState) {

    calls$.pipe(
      first(),
      switchMap((calls: Calls) => {
        return (
          state.matchType === OfferMatchType.direct ?
            calls.offerMakeDirect(offerMakeDirectData(state)) :
            calls.offerMake(offerMakeData(state)
            ))
          .pipe(
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
): Observable<OfferFormState> {

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

  const initialState: OfferFormState = {
    submit,
    change: manualChange$.next.bind(manualChange$),
    kind: OfferType.buy,
    baseToken: tradingPair.base,
    quoteToken: tradingPair.quote,
    baseTokenDigits: tokens[tradingPair.base].digits,
    quoteTokenDigits: tokens[tradingPair.quote].digits,
    gasEstimationStatus: GasEstimationStatus.unset,
    stage: FormStage.editing,
    price: undefined,
    amount: undefined,
    total: undefined,
    slippageLimit: new BigNumber(5),
    buyAllowance: undefined,
    sellAllowance: undefined,
    matchType: OfferMatchType.limitOrder,
    messages: [],
    pickerOpen: false
  };

  return merge(
    manualChange$,
    submitChange$,
    environmentChange$
  ).pipe(
    scan(applyChange, initialState),
    map(preValidate),
    map(addPositionGuess),
    switchMap(curry(addGasEstimation)(params.calls$)),
    map(postValidate),
    firstOfOrTrue(s => s.gasEstimationStatus === GasEstimationStatus.calculating),
    shareReplay(1),
  );
}
