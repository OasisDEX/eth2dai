import { storiesOf } from '@storybook/react';
import * as React from 'react';

import { BigNumber } from 'bignumber.js';
import { approveWallet, disapproveWallet } from '../blockchain/calls/approveCalls';
import {
  CancelData,
  cancelOffer,
  offerMake,
  OfferMakeData,
  offerMakeDirect,
  OfferMakeDirectData,
} from '../blockchain/calls/offerMake';
import { unwrap, wrap } from '../blockchain/calls/wrapUnwrapCalls';
import { TxStatus } from '../blockchain/transactions';
import { OfferType } from '../exchange/orderbook/orderbook';
import { OfferMatchType } from '../utils/form';
import { zero } from '../utils/zero';
import { Notification, NotificationProps } from './TransactionNotifierView';

const startTime = new Date();
startTime.setSeconds(startTime.getSeconds() - 55);

const common = {
  account: '0xe6ac5629b9ade2132f42887fbbc3a3860afbd07b',
  networkId: '0',
  meta: { ...approveWallet, args: { token: 'WETH' } },
  txNo: 2,
  start: startTime,
  lastChange: new Date('2019-01-21T11:26:30.834Z'),
  end: new Date('2019-01-21T11:26:30.834Z'),
  dismissed: false,
  etherscan: { url: 'etherscan' },
  onDismiss: () => ({}),
};

const cancelledByTheUserTx: NotificationProps = {
  ...common,
  status: TxStatus.CancelledByTheUser,
  error: {},
};

const successfulTx: NotificationProps = {
  ...common,
  status: TxStatus.Success,
  txHash: 'txhash',
  blockNumber: 123,
  receipt: {},
  confirmations: 1,
  safeConfirmations: 1,
};

const waitingForApprovalTx: NotificationProps = {
  ...common,
  status: TxStatus.WaitingForApproval,
};

const stories = storiesOf('Notification', module);

stories.add('Approve transfer', () => <Notification {...cancelledByTheUserTx} />);

stories.add('Disapprove transfer', () => (
  <Notification
    {...{ ...cancelledByTheUserTx, meta: { ...disapproveWallet, args: { token: 'WETH' } } }}
  />
));

stories.add('Disapprove transfer (DAI)', () => (
  <Notification
    {...{ ...cancelledByTheUserTx, meta: { ...disapproveWallet, args: { token: 'DAI' } } }}
  />
));

stories.add('Cancel offer', () => (
  <Notification
    {...{
      ...cancelledByTheUserTx,
      meta: {
        ...cancelOffer,
        args: {
          offerId: zero,
          type: 'buy',
          amount: new BigNumber('1.2345'),
          token: 'WETH'
        } as CancelData
      },
    }}
  />
));

const offerMakeData: OfferMakeData = {
  buyAmount: zero,
  buyToken: 'WETH',
  sellAmount: zero,
  sellToken: 'WETH',
  matchType: OfferMatchType.limitOrder,
  position: zero,
  kind: OfferType.buy,
  gasPrice: zero,
};

const offerMakeDirectData: OfferMakeDirectData = {
  baseAmount: zero,
  baseToken: 'WETH',
  quoteAmount: zero,
  quoteToken: 'WETH',
  matchType: OfferMatchType.direct,
  price: zero,
  kind: OfferType.buy,
  gasPrice: zero,
};

stories.add('Offer make', () => (
  <Notification {...{ ...cancelledByTheUserTx, meta: { ...offerMake, args: offerMakeData } }} />
));

stories.add('Offer make direct', () => (
  <Notification
    {...{
      ...cancelledByTheUserTx,
      meta: { ...offerMakeDirect, args: offerMakeDirectData },
    }}
  />
));

stories.add('Unwrap', () => (
  <Notification {...{ ...cancelledByTheUserTx, meta: { ...unwrap, args: { amount: zero } } }} />
));

stories.add('Wrap (CancelledByTheUser)', () => (
  <Notification {...{ ...cancelledByTheUserTx, meta: { ...wrap, args: { amount: zero } } }} />
));

stories.add('Wrap (success)', () => (
  <Notification {...{ ...successfulTx, meta: { ...wrap, args: { amount: zero } } }} />
));

stories.add('Wrap (waitingForApproval)', () => (
  <Notification {...{ ...waitingForApprovalTx, meta: { ...wrap, args: { amount: zero } } }} />
));

const waitingForConfirmationTx: NotificationProps = {
  ...common,
  status: TxStatus.WaitingForConfirmation,
  txHash: 'abc',
  broadcastedAt: startTime,
};
stories.add('Wrap (WaitingForConfirmation)', () => (
  <Notification {...{ ...waitingForConfirmationTx, meta: { ...wrap, args: { amount: zero } } }} />
));

const failureTx: NotificationProps = {
  ...common,
  status: TxStatus.Failure,
  txHash: 'abc',
  blockNumber: 123,
  receipt: {},
};
stories.add('Wrap (Failure)', () => (
  <Notification {...{ ...failureTx, meta: { ...wrap, args: { amount: zero } } }} />
));
