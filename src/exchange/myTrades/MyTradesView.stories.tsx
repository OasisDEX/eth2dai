import { storiesOf } from '@storybook/react';
import { BigNumber } from 'bignumber.js';
import * as React from 'react';

import { EtherscanConfig } from '../../blockchain/etherscan';
import { LoadableStatus } from '../../utils/loadable';
import { Panel } from '../../utils/panel/Panel';
import { zero } from '../../utils/zero';
import { TradeAct } from '../trades';
import { MyTradesKind } from './myTrades';
import { MyTrades } from './MyTradesView';
import { TradeStatus, TradeWithStatus } from './openTrades';

const stories = storiesOf('MyTrades', module);

const defaultProps = {
  kind: MyTradesKind.open,
  changeKind: () => null,
  cancelOffer: () => null,
  etherscan: {} as EtherscanConfig,
  authorized: true,
  value: {
    status: 'loaded' as LoadableStatus,
    tradingPair: {
      base: 'ETH',
      quote: 'DAI',
    },
  },
  user: {
    account: '0x1234',
  }
};

const sampleTrades = [
  {
    offerId: zero,
    time: new Date(2018, 12, 25, 15, 30, 12),
    act: 'buy' as TradeAct,
    price: new BigNumber(152),
    baseAmount: new BigNumber(10),
    quoteAmount: new BigNumber(15200),
    baseToken: 'ETH',
    quoteToken: 'DAI',
    // status:
  } as TradeWithStatus,
  {
    offerId: zero,
    time: new Date(2018, 12, 28, 11, 12, 3),
    act: 'buy' as TradeAct,
    price: new BigNumber(10),
    baseAmount: new BigNumber(12),
    quoteAmount: new BigNumber(120),
    status: TradeStatus.beingCancelled,
    baseToken: 'ETH',
    quoteToken: 'DAI',
  } as TradeWithStatus,
  {
    offerId: zero,
    time: new Date(2019, 1, 2, 9, 56, 47),
    act: 'sell' as TradeAct,
    price: new BigNumber(15),
    baseAmount: new BigNumber(100),
    quoteAmount: new BigNumber(1500),
    status: TradeStatus.beingCreated,
    baseToken: 'ETH',
    quoteToken: 'DAI',
  } as TradeWithStatus,
];

stories.add('Not logged in', () => (
  <Panel>
    <MyTrades
      {...defaultProps}
      authorized={false}
    />
  </Panel>
));

stories.add('Empty open', () => (
  <Panel>
    <MyTrades
      {...defaultProps}
      value={{ ...defaultProps.value, value: [] }}
    />
  </Panel>
));

stories.add('Open with sample trades', () => (
  <Panel style={{ width: '936px' }}>
    <MyTrades
      {...defaultProps}
      value={{ ...defaultProps.value, value: sampleTrades }}
    />
  </Panel>
));

stories.add('Close with sample trades', () => (
  <Panel style={{ width: '936px' }}>
    <MyTrades
      {...defaultProps}
      kind={MyTradesKind.closed}
      value={{ ...defaultProps.value, value: sampleTrades }}
    />
  </Panel>
));
