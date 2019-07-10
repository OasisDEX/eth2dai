import { BigNumber } from 'bignumber.js';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { Allowances, DustLimits } from '../balances/balances';
import { eth2weth, weth2eth } from '../blockchain/calls/instant';
import { NetworkConfig } from '../blockchain/config';
import {
  TxStatus
} from '../blockchain/transactions';
import { OfferType } from '../exchange/orderbook/orderbook';
import {
  BalancesChange, EtherBalanceChange,
  EtherPriceUSDChange,
  FormChangeKind,
  GasEstimationStatus,
  GasPriceChange, UserChange
} from '../utils/form';
import { getQuote } from '../utils/price';
import { getSlippageLimit } from '../utils/slippage';
import { TradeEvaluationStatus } from './evaluate';
import {
  FormResetChange,
  InstantFormState,
  ViewKind
} from './instantForm';
import { ManualAllowanceProgress, Progress } from './progress/progress';

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
  manualAllowanceChange = 'manualAllowanceChange',
}

export interface ProgressChange {
  kind: InstantFormChangeKind.progressChange;
  progress?: Progress;
}

interface ViewChange {
  kind: InstantFormChangeKind.viewChange;
  view: ViewKind;
  meta?: any;
}

interface BuyAmountChange {
  kind: InstantFormChangeKind.buyAmountFieldChange;
  value?: BigNumber;
}

interface SellAmountChange {
  kind: InstantFormChangeKind.sellAmountFieldChange;
  value?: BigNumber;
}

interface PairChange {
  kind: InstantFormChangeKind.pairChange;
  buyToken: string;
  sellToken: string;
}

interface TokenChange {
  kind: InstantFormChangeKind.tokenChange;
  token: string;
  side: OfferType;
}

interface DustLimitsChange {
  kind: InstantFormChangeKind.dustLimitsChange;
  dustLimits: DustLimits;
}

interface AllowancesChange {
  kind: InstantFormChangeKind.allowancesChange;
  allowances: Allowances;
}

interface ProxyChange {
  kind: InstantFormChangeKind.proxyChange;
  value?: string;
}

interface ContextChange {
  kind: InstantFormChangeKind.contextChange;
  context: NetworkConfig;
}

interface SlippageLimitChange {
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

export const toDustLimitsChange =
  (dustLimits$: Observable<DustLimits>): Observable<DustLimitsChange> => {
    return dustLimits$.pipe(
      map(dustLimits => ({
        dustLimits,
        kind: InstantFormChangeKind.dustLimitsChange,
      } as DustLimitsChange))
    );
  };

export const toAllowancesChange =
  (allowances$: Observable<Allowances>): Observable<AllowancesChange> => {
    return allowances$.pipe(
      map(allowances => ({
        allowances,
        kind: InstantFormChangeKind.allowancesChange,
      } as AllowancesChange))
    );
  };

export const toProxyChange =
  (proxyAddress$: Observable<string>): Observable<ProxyChange> => {
    return proxyAddress$.pipe(
      map(proxy => ({
        value: proxy,
        kind: InstantFormChangeKind.proxyChange,
      } as ProxyChange))
    );
  };

export const toContextChange =
  (context$: Observable<NetworkConfig>): Observable<ContextChange> => {
    return context$.pipe(
      map(context => ({
        context,
        kind: InstantFormChangeKind.contextChange,
      } as ContextChange))
    );
  };

export function applyChange(state: InstantFormState, change: InstantFormChange): InstantFormState {
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
