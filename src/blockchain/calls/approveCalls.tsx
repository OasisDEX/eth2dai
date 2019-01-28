import * as React from 'react';

import { Currency } from '../../utils/text/Text';
import { DAIicon, ETHicon } from '../coinIcons/coinIcons';
import { NetworkConfig } from '../config';
import { TransactionDef } from './callsHelpers';
import { TxMetaKind } from './txMeta';

export interface ApproveWalletData {
  token: string;
}

const descriptionIcon = ({ token }: ApproveWalletData) => {
  switch (token) {
    case 'WETH':
      return <ETHicon theme="circle"/>;
    case 'DAI':
      return <DAIicon theme="circle"/>;
    default:
      throw new Error(`unknown token ${token}`);
  }
};

export const approveWallet: TransactionDef<ApproveWalletData> = {
  descriptionIcon,
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
  descriptionIcon,
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
