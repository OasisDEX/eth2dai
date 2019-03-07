import * as React from 'react';

import { Currency } from '../../utils/text/Text';
import { NetworkConfig, tokens } from '../config';
import { TransactionDef } from './callsHelpers';
import { TxMetaKind } from './txMeta';

export interface ApproveWalletData {
  token: string;
}

export const approveWallet: TransactionDef<ApproveWalletData> = {
  descriptionIcon: ({ token }: ApproveWalletData) => tokens[token].iconCircle(),
  call: ({ token }: ApproveWalletData, context: NetworkConfig) =>
    context.tokens[token].contract.approve['address,uint256'],
  prepareArgs: (_: ApproveWalletData, context: NetworkConfig) => [context.otc.address, -1],
  options: () => ({ gas: 100000 }),
  kind: TxMetaKind.approveWallet,
  description: ({ token }: ApproveWalletData) => {
    return (
      <React.Fragment>
        Unlock <Currency value={token} /> for Trading
      </React.Fragment>
    );
  },
};

export const disapproveWallet: TransactionDef<ApproveWalletData> = {
  descriptionIcon: ({ token }: ApproveWalletData) => tokens[token].iconCircle(),
  call: ({ token }: ApproveWalletData, context: NetworkConfig) =>
    context.tokens[token].contract.approve['address,uint256'],
  prepareArgs: (_: ApproveWalletData, context: NetworkConfig) => [context.otc.address, 0],
  options: () => ({ gas: 100000 }),
  kind: TxMetaKind.disapproveWallet,
  description: ({ token }: ApproveWalletData) => {
    return (
      <React.Fragment>
        Lock <Currency value={token} /> for Trading
      </React.Fragment>
    );
  },
};
