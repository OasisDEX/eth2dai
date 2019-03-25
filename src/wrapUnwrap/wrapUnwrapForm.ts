import { BigNumber } from 'bignumber.js';
import { curry } from 'ramda';
import { merge, Observable, of, Subject } from 'rxjs/index';
import { first, map, scan, switchMap, takeUntil } from 'rxjs/operators';
import { Calls, Calls$ } from '../blockchain/calls/calls';
import { combineAndMerge } from '../utils/combineAndMerge';
import {
  AmountFieldChange, doGasEstimation,
  EtherPriceUSDChange, FormChangeKind,
  GasEstimationStatus, GasPriceChange,
  HasGasEstimation, progressChange, ProgressChange,
  ProgressStage, toEtherPriceUSDChange, toGasPriceChange, transactionToX,
} from '../utils/form';
import { firstOfOrTrue } from '../utils/operators';
import { zero } from '../utils/zero';

export enum MessageKind {
  insufficientAmount = 'insufficientAmount',
  dustAmount = 'dustAmount',
}

export type Message = {
  kind: MessageKind.insufficientAmount,
  token: string,
} | {
  kind: MessageKind.dustAmount,
};

export enum WrapUnwrapFormKind {
  wrap = 'wrap',
  unwrap = 'unwrap'
}

enum BalanceChangeKind {
  ethBalanceChange = 'ethBalanceChange',
  wethBalanceChange = 'wethBalanceChange',
}

export type ManualChange = AmountFieldChange;

type EnvironmentChange =
  GasPriceChange |
  EtherPriceUSDChange |
  { kind: BalanceChangeKind, balance: BigNumber };

type WrapUnwrapFormChange = ManualChange | EnvironmentChange | ProgressChange;

export interface WrapUnwrapFormState extends HasGasEstimation {
  readyToProceed?: boolean;
  kind: WrapUnwrapFormKind;
  ethBalance: BigNumber;
  wethBalance: BigNumber;
  messages: Message[];
  amount?: BigNumber;
  progress?: ProgressStage;
  change: (change: ManualChange) => void;
  proceed: (state: WrapUnwrapFormState) => void;
  cancel: () => void;
}

function applyChange(
  state: WrapUnwrapFormState,
  change: WrapUnwrapFormChange
): WrapUnwrapFormState {
  switch (change.kind) {
    case FormChangeKind.gasPriceChange:
      return { ...state,
        gasPrice: change.value,
        gasEstimationStatus: GasEstimationStatus.unset };
    case FormChangeKind.etherPriceUSDChange:
      return { ...state,
        etherPriceUsd: change.value,
        gasEstimationStatus: GasEstimationStatus.unset };
    case BalanceChangeKind.ethBalanceChange:
      return { ...state,
        ethBalance: change.balance,
        gasEstimationStatus: GasEstimationStatus.unset };
    case BalanceChangeKind.wethBalanceChange:
      return { ...state,
        wethBalance: change.balance,
        gasEstimationStatus: GasEstimationStatus.unset };
    case FormChangeKind.amountFieldChange:
      return { ...state,
        amount: change.value,
        gasEstimationStatus: GasEstimationStatus.unset };
    case FormChangeKind.progress:
      return { ...state, progress: change.progress };
    // default:
    //   const _exhaustiveCheck: never = change; // tslint:disable-line
  }
  return state;
}

function validate(state: WrapUnwrapFormState) {
  const messages: Message[] = [];
  const balance = state.kind === WrapUnwrapFormKind.wrap ? state.ethBalance : state.wethBalance;
  const insufficientTest = state.amount && (state.kind === WrapUnwrapFormKind.wrap ? state.amount.gte : state.amount.gt).bind(state.amount);

  if (state.amount && state.amount.lte(zero)) {
    messages.push({
      kind: MessageKind.dustAmount
    });
  }
  if (balance && insufficientTest && insufficientTest(balance)) {
    messages.push({
      kind: MessageKind.insufficientAmount,
      token: state.kind === WrapUnwrapFormKind.wrap ? 'ETH' : 'WETH'
    });
  }
  return {
    ...state,
    messages,
  };
}

function estimateGasPrice(
  calls$: Calls$, state: WrapUnwrapFormState
): Observable<WrapUnwrapFormState> {
  return doGasEstimation(calls$, undefined, state, (calls: Calls) => {
    if (!state.amount || !state.gasPrice) {
      return undefined;
    }
    const call = state.kind === WrapUnwrapFormKind.wrap ?
      calls.wrapEstimateGas :
      calls.unwrapEstimateGas;
    return call({ amount: state.amount, gasPrice: state.gasPrice });
  });
}

function checkIfIsReadyToProceed(state: WrapUnwrapFormState) {
  const readyToProceed = state.amount &&
    state.messages.length === 0 &&
    state.gasEstimationStatus === GasEstimationStatus.calculated;
  return {
    ...state,
    readyToProceed,
  };
}

function prepareProceed(calls$: Calls$): [
  (state: WrapUnwrapFormState) => void,
  () => void, Observable<ProgressChange>
  ] {

  const proceedChange$ = new Subject<ProgressChange>();

  const cancel$ = new Subject<void>();

  function proceed(state: WrapUnwrapFormState) {

    const kind = state.kind;
    const amount = state.amount;
    const gasPrice = state.gasPrice;
    const gas = state.gasEstimation;

    if (!amount || !gasPrice || !gas) {
      return;
    }

    const changes$: Observable<ProgressChange> = merge(
      cancel$.pipe(
        map(() => progressChange(ProgressStage.canceled))
      ),
      calls$.pipe(
        first(),
        switchMap((calls): Observable<ProgressChange> => {
          const call =
            kind === WrapUnwrapFormKind.wrap ?
              calls.wrap :
              calls.unwrap;
          return call({ amount, gasPrice, gas })
          .pipe(
            transactionToX(
              progressChange(ProgressStage.waitingForApproval),
              progressChange(ProgressStage.waitingForConfirmation),
              progressChange(ProgressStage.fiasco),
              () => of(progressChange(ProgressStage.done))
            ),
            takeUntil(cancel$)
          );
        }),
      ),
    );

    changes$.subscribe((change: ProgressChange) => proceedChange$.next(change));

    return changes$;
  }

  return [
    proceed,
    cancel$.next.bind(cancel$),
    proceedChange$,
  ];
}

export function createWrapUnwrapForm$(
  gasPrice$: Observable<BigNumber>,
  etherPriceUSD$: Observable<BigNumber>,
  ethBalance$: Observable<BigNumber>,
  wethBalance$: Observable<BigNumber>,
  calls$: Calls$,
  kind: WrapUnwrapFormKind,
): Observable<WrapUnwrapFormState> {

  const manualChange$ = new Subject<ManualChange>();
  const resetChange$ = new Subject<ProgressChange>();

  const ethBalanceChange$ = ethBalance$.pipe(
    map(balance => ({
      balance,
      kind: BalanceChangeKind.ethBalanceChange
    })
  ));

  const wethBalanceChange$ = wethBalance$.pipe(
    map(balance => ({
      balance,
      kind: BalanceChangeKind.wethBalanceChange
    })
  ));

  const environmentChange$ = combineAndMerge(
    toGasPriceChange(gasPrice$),
    toEtherPriceUSDChange(etherPriceUSD$),
    ethBalanceChange$,
    wethBalanceChange$,
  );

  const [proceed, cancel, proceedProgressChange$] = prepareProceed(calls$);

  const change = manualChange$.next.bind(manualChange$);

  const initialState = {
    kind,
    change,
    proceed,
    cancel,
    ethBalance: zero,
    wethBalance: zero,
    messages: [],
    gasEstimationStatus: GasEstimationStatus.unset,

  };

  return merge(
    manualChange$,
    environmentChange$,
    resetChange$,
    proceedProgressChange$
  ).pipe(
  scan(applyChange, initialState),
  map(validate),
  switchMap(curry(estimateGasPrice)(calls$)),
  map(checkIfIsReadyToProceed),
  firstOfOrTrue(s => s.gasEstimationStatus === GasEstimationStatus.calculating)
  );
}
