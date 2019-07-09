import { BigNumber } from 'bignumber.js';
import { eth2weth } from '../blockchain/calls/instant';
import { tokens } from '../blockchain/config';
import { EtherscanConfig } from '../blockchain/etherscan';
import { OfferType } from '../exchange/orderbook/orderbook';
import { TradeEvaluationStatus } from './evaluate';
import { InstantFormState } from './instantForm';
import { Progress } from './progress/progress';

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

export enum Position {
  TOP = 'top',
  BOTTOM = 'bottom'
}

export type Placement = Position.TOP | Position.BOTTOM;

export enum MessageKind {
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
  priority: number;
  placement: Placement;
  etherscan?: EtherscanConfig;
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
} |
  {
    kind: MessageKind.orderbookTotalExceeded
    field: string;
    side: OfferType
    amount: BigNumber,
    token: string;
    priority: number;
    placement: Placement;
    error: any
  } |
  {
    kind: MessageKind.notConnected;
    field: string;
    priority: number;
    placement: Placement;
  } |
  TxInProgressMessage;

export function validate(state: InstantFormState): InstantFormState {
  if (state.tradeEvaluationStatus !== TradeEvaluationStatus.calculated) {
    return state;
  }

  let message: Message | undefined = state.message;

  const [spendField, receiveField] = ['sellToken', 'buyToken'];
  const [spendToken, receiveToken] = [state.sellToken, state.buyToken];
  const [spendAmount, receiveAmount] = [state.sellAmount, state.buyAmount];
  const dustLimits = state.dustLimits;
  const manualAllowancesProgress = state.manualAllowancesProgress;

  if (!state.user || !state.user.account) {
    message = prioritize(message, {
      kind: MessageKind.notConnected,
      field: spendField,
      priority: 1000,
      placement: Position.BOTTOM,
    });
  }

  if (state.progress && !state.progress.done) {
    message = prioritize(message, {
      kind: MessageKind.txInProgress,
      etherscan: state.context && state.context.etherscan,
      progress: state.progress,
      field: spendField,
      priority: 900,
      placement: Position.BOTTOM,
    });
  }

  if (manualAllowancesProgress) {
    const settingAllowanceInProgress = Object.keys(manualAllowancesProgress).find((token) =>
      manualAllowancesProgress[token] && !manualAllowancesProgress[token].done
    );

    if (settingAllowanceInProgress) {
      message = prioritize(message, {
        kind: MessageKind.txInProgress,
        etherscan: state.context && state.context.etherscan,
        progress: manualAllowancesProgress[settingAllowanceInProgress],
        field: spendField,
        priority: 900,
        placement: Position.BOTTOM,
      });
    }
  }

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

  if (
    spendAmount
    && dustLimits
    && dustLimits[eth2weth(spendToken)]
    && dustLimits[eth2weth(spendToken)].gt(spendAmount)
  ) {
    message = prioritize(message, {
      kind: MessageKind.dustAmount,
      amount: dustLimits[eth2weth(spendToken)],
      field: spendField,
      priority: 2,
      token: spendToken,
      placement: Position.BOTTOM
    });
  }

  if (
    receiveAmount
    && dustLimits
    && dustLimits[eth2weth(receiveToken)]
    && dustLimits[eth2weth(receiveToken)].gt(receiveAmount)
  ) {
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
