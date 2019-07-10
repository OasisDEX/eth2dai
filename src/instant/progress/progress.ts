import { BigNumber } from 'bignumber.js';
import { TxStatus } from '../../blockchain/transactions';

export enum ProgressKind {
  onlyProxy = 'onlyProxy',
  onlyAllowance = 'onlyAllowance',
  proxyPayWithETH = 'proxyPayWithETH',
  noProxyPayWithETH = 'noProxyPayWithETH',
  noProxyNoAllowancePayWithERC20 = 'noProxyNoAllowancePayWithERC20',
  proxyNoAllowancePayWithERC20 = 'proxyNoAllowancePayWithERC20',
  proxyAllowancePayWithERC20 = 'proxyAllowancePayWithERC20',
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

export type Progress = GenericProgress & (
  {
    kind: ProgressKind.proxyPayWithETH
      | ProgressKind.noProxyPayWithETH
      | ProgressKind.proxyAllowancePayWithERC20
    tradeTxStatus: TxStatus;
    tradeTxHash?: string;
  } |
  {
    kind: ProgressKind.noProxyNoAllowancePayWithERC20
    proxyTxStatus: TxStatus;
    proxyTxHash?: string
    allowanceTxStatus?: TxStatus;
    allowanceTxHash?: string
    tradeTxStatus?: TxStatus;
    tradeTxHash?: string
  } |
  {
    kind: ProgressKind.proxyNoAllowancePayWithERC20;
    allowanceTxStatus: TxStatus;
    allowanceTxHash?: string
    tradeTxStatus?: TxStatus;
    tradeTxHash?: string
  } |
  ManualProxyProgress |
  ManualAllowanceProgress
  );

export interface ManualAllowanceProgressState {
  toggleAllowance: (token: string) => void;
  manualAllowancesProgress?: { [token: string]: ManualAllowanceProgress };
}
