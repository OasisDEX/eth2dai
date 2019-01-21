import { storiesOf } from '@storybook/react';
import * as React from 'react';

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
import { TxState, TxStatus } from '../blockchain/transactions';
import { OfferType } from '../exchange/orderbook/orderbook';
import { OfferMatchType } from '../utils/form';
import { zero } from '../utils/zero';
import { Notification } from './TransactionNotifierView';

const tx: TxState = {
  account: '0xe6ac5629b9ade2132f42887fbbc3a3860afbd07b',
  meta: { ...approveWallet, args: { token: 'WETH' } },
  txNo: 2,
  start: new Date('2019-01-21T11:26:27.644Z'),
  lastChange: new Date('2019-01-21T11:26:30.834Z'),
  error: {},
  end: new Date('2019-01-21T11:26:30.834Z'),
  status: TxStatus.CancelledByTheUser,
};

const successfulTx: TxState = {
  account: '0xe6ac5629b9ade2132f42887fbbc3a3860afbd07b',
  meta: { ...approveWallet, args: { token: 'WETH' } },
  txNo: 2,
  start: new Date('2019-01-21T11:26:27.644Z'),
  lastChange: new Date('2019-01-21T11:26:30.834Z'),
  end: new Date('2019-01-21T11:26:30.834Z'),
  status: TxStatus.Success,
  txHash: 'txhash',
  blockNumber: 123,
  receipt: {},
  confirmations: 1,
  safeConfirmations: 1,
};

const stories = storiesOf('Notification', module);

stories.add('Approve transfer', () => <Notification {...tx} />);

stories.add('Disapprove transfer', () => (
  <Notification {...{ ...tx, meta: { ...disapproveWallet, args: { token: 'WETH' } } }} />
));

stories.add('Cancel offer', () => (
  <Notification {...{ ...tx, meta: { ...cancelOffer, args: { offerId: zero } as CancelData } }} />
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
  <Notification {...{ ...tx, meta: { ...offerMake, args: offerMakeData } }} />
));

stories.add('Offer make direct', () => (
  <Notification
    {...{
      ...tx,
      meta: { ...offerMakeDirect, args: offerMakeDirectData },
    }}
  />
));

stories.add('Wrap', () => (
  <Notification {...{ ...tx, meta: { ...wrap, args: { amount: zero } } }} />
));

stories.add('Wrap (success)', () => (
  <Notification
    {...{ ...successfulTx, meta: { ...wrap, args: { amount: zero } } }}
  />
));

stories.add('Unwrap', () => (
  <Notification {...{ ...tx, meta: { ...unwrap, args: { amount: zero } } }} />
));
