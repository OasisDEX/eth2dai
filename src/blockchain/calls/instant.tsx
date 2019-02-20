import { BigNumber } from 'bignumber.js';
import * as React from 'react';

import { TransactionDef } from './callsHelpers';
import { TxMetaKind } from './txMeta';

export interface InstantOrderData {
  buyAmount: BigNumber;
  sellAmount: BigNumber;
  buyToken: string;
  sellToken: string;
  gasPrice?: BigNumber;
  gasEstimation?: number;
}

export const instantOrder: TransactionDef<InstantOrderData> = {
  call: () => null,
  prepareArgs: () => [],
  kind: TxMetaKind.instantOrder,
  description: () =>
    <React.Fragment>
      Create instant order
    </React.Fragment>,
};
