import * as React from 'react';

import { Currency } from '../../utils/text/Text';
import { NetworkConfig } from '../config';
import { DEFAULT_GAS } from './callsHelpers';
import { TxMetaKind } from './txMeta';

export interface ApproveWalletData {
  token: string;
}

export const approveWallet = {
  call: ({ token }: ApproveWalletData, context: NetworkConfig) =>
    context.tokens[token].contract.approve['address,uint256'],
  prepareArgs: (_: ApproveWalletData, context: NetworkConfig) => [context.otc.address, -1],
  options: () => ({ gas: DEFAULT_GAS }),
  kind: TxMetaKind.approveWallet,
  description: ({ token }: ApproveWalletData) =>
    <React.Fragment>Approve to transfer <Currency value={token}/></React.Fragment>
};

export const disapproveWallet = {
  call: ({ token }: ApproveWalletData, context: NetworkConfig) =>
    context.tokens[token].contract.approve['address,uint256'],
  prepareArgs: (_: ApproveWalletData, context: NetworkConfig) => [context.otc.address, 0],
  options: () => ({ gas: DEFAULT_GAS }),
  kind: TxMetaKind.disapproveWallet,
  description: ({ token }: ApproveWalletData) =>
    <React.Fragment>Disapprove to transfer <Currency value={token}/></React.Fragment>
};
