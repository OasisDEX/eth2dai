import { storiesOf } from '@storybook/react';
import * as React from 'react';
import { approveWallet } from '../blockchain/calls/approveCalls';
import { TxState, TxStatus } from '../blockchain/transactions';
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

const stories = storiesOf('TransactionNotifierView', module);

stories.add('Notification', () => <Notification {...tx} />);
