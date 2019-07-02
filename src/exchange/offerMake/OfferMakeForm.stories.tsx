import { storiesOf } from '@storybook/react';
import { BigNumber } from 'bignumber.js';
import * as React from 'react';
import { BrowserRouter } from 'react-router-dom';

import { GasEstimationStatus, OfferMatchType } from '../../utils/form';
import { FlexLayoutRow } from '../../utils/layout/FlexLayoutRow';
import { Loadable, LoadableStatus } from '../../utils/loadable';
import { Panel, PanelHeader } from '../../utils/panel/Panel';
import { DepthChartView } from '../depthChart/DepthChartView';
import { fakeOrderBook } from '../depthChart/fakeOrderBook';
import { OfferType } from '../orderbook/orderbook';
import { OrderbookView } from '../orderbook/OrderbookView';
import { TradingPair } from '../tradingPair/tradingPair';
import { FormStage, Message, MessageKind, OfferFormState, } from './offerMake';
import { OfferMakePanel } from './OfferMakePanel';

const stories = storiesOf('Offer Make Form', module);

const normalPanelStyle = { width: '454px', height: '487px',
  display: 'inline-block', marginRight: '2em' };
const narrowPanelStyle = { width: '398px', height: '487px', display: 'inline-block' };

function offerMakeFormProps(overrides: object = {}): Loadable<OfferFormState> {
  return {
    status: 'loaded' as LoadableStatus,
    value: {
      baseToken: 'WETH',
      quoteToken: 'DAI',
      baseTokenDigits: 5,
      quoteTokenDigits: 2,
      kind: OfferType.buy,
      gasEstimationStatus: GasEstimationStatus.unset,
      stage: FormStage.editing,
      submit: () => null,
      change: () => null,
      matchType: OfferMatchType.limitOrder,
      slippageLimit: new BigNumber(5),
      priceImpact: new BigNumber(13),
      messages: [],
      pickerOpen: false,
      ...overrides,
    },
  };
}

stories.add('Default form', () => {
  return (
  <div style={{ width: '932px' }}>
    <FlexLayoutRow>
      <Panel style={normalPanelStyle}>
        <OfferMakePanel {...offerMakeFormProps()} />
      </Panel>
      <Panel style={narrowPanelStyle}>
        <OfferMakePanel {...offerMakeFormProps()} />
      </Panel>
    </FlexLayoutRow>
    <FlexLayoutRow>
      <Panel style={normalPanelStyle}>
        <OfferMakePanel {...offerMakeFormProps({
          kind: OfferType.sell,
        })} />
      </Panel>
      <Panel style={narrowPanelStyle}>
        <OfferMakePanel {...offerMakeFormProps({
          kind: OfferType.sell,
        })} />
      </Panel>
    </FlexLayoutRow>
  </div>
  );
});

stories.add('Buy with price and amount, ready to proceed', () => {
  return (
    <div>
    <Panel style={normalPanelStyle}>
      <OfferMakePanel {...offerMakeFormProps({
        amount: new BigNumber(2),
        price: new BigNumber(4),
        total: new BigNumber(8),
        stage: FormStage.readyToProceed,
      })} />
    </Panel>
    <Panel style={narrowPanelStyle}>
      <OfferMakePanel {...offerMakeFormProps({
        amount: new BigNumber(2),
        price: new BigNumber(4),
        total: new BigNumber(8),
        stage: FormStage.readyToProceed,
      })} />
    </Panel>
    </div>
  );
});

stories.add('Sell with price and amount, ready to proceed', () => {
  return (
    <div>
    <Panel style={normalPanelStyle}>
      <OfferMakePanel {...offerMakeFormProps({
        kind: OfferType.sell,
        amount: new BigNumber(2),
        price: new BigNumber(4),
        total: new BigNumber(8),
        stage: FormStage.readyToProceed,
      })} />
    </Panel>
    <Panel style={narrowPanelStyle}>
      <OfferMakePanel {...offerMakeFormProps({
        kind: OfferType.sell,
        amount: new BigNumber(2),
        price: new BigNumber(4),
        total: new BigNumber(8),
        stage: FormStage.readyToProceed,
      })} />
    </Panel>
    </div>
  );
});

stories.add('Gas estimation statuses', () => {
  return (
    <div>
      <h3>Gas estimation status = unset</h3>
      <Panel style={normalPanelStyle}>
        <OfferMakePanel {...offerMakeFormProps({
          gasEstimationStatus: GasEstimationStatus.unset,
        })} />
      </Panel>

      <h3>Gas estimation status = calculating</h3>
      <Panel style={normalPanelStyle}>
        <OfferMakePanel {...offerMakeFormProps({
          gasEstimationStatus: GasEstimationStatus.calculating,
          amount: new BigNumber(2),
          price: new BigNumber(4),
          total: new BigNumber(8),
        })} />
      </Panel>

      <h3>Gas estimation status = calculated</h3>
      <Panel style={normalPanelStyle}>
        <OfferMakePanel {...offerMakeFormProps({
          gasEstimationStatus: GasEstimationStatus.calculated,
          gasEstimationEth: new BigNumber(200),
          gasEstimationUsd: new BigNumber(0.2),
          amount: new BigNumber(2),
          price: new BigNumber(4),
          total: new BigNumber(8),
        })} />
      </Panel>

      <h3>Gas estimation status = error</h3>
      <Panel style={normalPanelStyle}>
        <OfferMakePanel {...offerMakeFormProps({
          gasEstimationStatus: GasEstimationStatus.error,
          amount: new BigNumber(2),
          price: new BigNumber(4),
          total: new BigNumber(8),
        })} />
      </Panel>

    </div>
  );
});

stories.add('Validations on form', () => {
  // const allPossibleFieldMessages: Message[] = [
  //   {
  //     kind: MessageKind.dustAmount,
  //     field: 'amount',
  //     priority: -1,
  //     token: 'WETH',
  //     amount: new BigNumber(5),
  //   },
  //   {
  //     kind: MessageKind.incredibleAmount,
  //     field: 'price',
  //     priority: -1,
  //     token: 'DAI'
  //   },
  //   {
  //     kind: MessageKind.insufficientAmount,
  //     field: 'total',
  //     priority: -1,
  //     token: 'DAI'
  //   },
  //   {
  //     kind: MessageKind.noAllowance,
  //     field: 'gas',
  //     priority: -1,
  //     token: 'DAI'
  //   },
  // ];
  return (
    <BrowserRouter>
    <div>
    <Panel style={{ ...normalPanelStyle, marginBottom: '2em' }}>
      <OfferMakePanel {...offerMakeFormProps({
        amount: new BigNumber(0.001),
        price: new BigNumber(1),
        total: new BigNumber(0.001),
        messages: [
          {
            kind: MessageKind.noAllowance,
            field: 'total',
            priority: -1,
            token: 'DAI',
          },
        ]
      })} />
    </Panel>

    <Panel style={narrowPanelStyle}>
      <OfferMakePanel {...offerMakeFormProps({
        kind: OfferType.sell,
        amount: new BigNumber(0.001),
        price: new BigNumber(1),
        total: new BigNumber(0.001),
        messages: [
          {
            kind: MessageKind.noAllowance,
            field: 'amount',
            priority: -1,
            token: 'WETH',
          },
        ]
      })} />
    </Panel>

    <Panel style={{ ...normalPanelStyle, marginBottom: '2em' }}>
      <OfferMakePanel {...offerMakeFormProps({
        amount: new BigNumber(2),
        price: new BigNumber(600),
        total: new BigNumber(1200),
        messages: [
          {
            kind: MessageKind.insufficientAmount,
            field: 'total',
            priority: -1,
            token: 'DAI'
          },
        ]
      })} />
    </Panel>

    <Panel style={narrowPanelStyle}>
      <OfferMakePanel {...offerMakeFormProps({
        amount: new BigNumber(0.001),
        price: new BigNumber(1),
        total: new BigNumber(0.001),
        messages: [
          {
            kind: MessageKind.dustAmount,
            field: 'total',
            priority: -1,
            token: 'DAI',
            amount: new BigNumber(0.01)
          },
        ]
      })} />
    </Panel>

    <Panel style={normalPanelStyle}>
      <OfferMakePanel {...offerMakeFormProps({
        amount: new BigNumber(9999999),
        price: new BigNumber(200000000),
        total: new BigNumber(1999999800000000),
        kind: OfferType.sell,
        messages: [
          {
            kind: MessageKind.insufficientAmount,
            field: 'amount',
            priority: -1,
            token: 'WETH'
          },
          {
            kind: MessageKind.incredibleAmount,
            field: 'total',
            priority: -1,
            token: 'DAI'
          },
        ]
      })} />
    </Panel>

    <Panel style={narrowPanelStyle}>
      <OfferMakePanel {...offerMakeFormProps({
        amount: new BigNumber(0.001),
        price: new BigNumber(1),
        total: new BigNumber(0.001),
        kind: OfferType.sell,
        messages: [
          {
            kind: MessageKind.dustAmount,
            field: 'amount',
            priority: -1,
            token: 'WETH',
            amount: new BigNumber(0.01)
          },
        ]
      })} />
    </Panel>

    </div>
    </BrowserRouter>
  );
});

stories.add('Three validations error on one element', () => {
  const messages: Message[] = [
    {
      kind: MessageKind.insufficientAmount,
      field: 'amount',
      priority: 1,
      token: '1st error, priority 1',
    },
    {
      kind: MessageKind.insufficientAmount,
      field: 'amount',
      priority: 2,
      token: '2nd error, priority 2',
    },
    {
      kind: MessageKind.insufficientAmount,
      field: 'amount',
      priority: -1,
      token: '3th error, priority -1',
    },
  ];

  return (
    <div>
    <Panel style={normalPanelStyle}>
      <OfferMakePanel {...offerMakeFormProps({
        messages,
        amount: new BigNumber(2),
        price: new BigNumber(4),
        total: new BigNumber(8),
      })} />
    </Panel>
    <Panel style={narrowPanelStyle}>
      <OfferMakePanel {...offerMakeFormProps({
        messages,
        amount: new BigNumber(2),
        price: new BigNumber(4),
        total: new BigNumber(8),
      })} />
    </Panel>
    </div>
  );
});

stories.add('Width of Create order and Order book panels', () => {
  const orderbook = fakeOrderBook;
  // console.warn(fakeOrderBook);
  orderbook.sell.forEach(s => {
    s.baseToken = 'WETH';
    s.quoteToken = 'DAI';
    // console.warn('tutaj sumato ', s.quoteAmount);
    return;
  });
  orderbook.buy.forEach(s => {
    s.baseToken = 'WETH';
    s.quoteToken = 'DAI';
    return;
  });
  return (
  <div style={{ width: '932px' }}>
    <FlexLayoutRow>
      <Panel style={{ ...normalPanelStyle, marginRight: 0 }}>
        <OfferMakePanel {...offerMakeFormProps()} />
      </Panel>
      <Panel style={{ width: '454px' }}>
        <PanelHeader>
          <span>Order book - list</span>
        </PanelHeader>
        <OrderbookView
          kindChange={() => null}
          status="loaded"
          tradingPair={{ quote: 'DAI', base: 'WETH' } as TradingPair }
          change={() => null}
          value={orderbook}
        />
      </Panel>
    </FlexLayoutRow>
    <FlexLayoutRow>
      <Panel style={narrowPanelStyle}>
        <OfferMakePanel {...offerMakeFormProps()} />
      </Panel>
      <Panel style={{ width: '510px' }}>
        <PanelHeader>
          <span>Order book - depth chart</span>
        </PanelHeader>
        <DepthChartView
          base="WETH"
          quote="DAI"
          matchType={OfferMatchType.limitOrder}
          orderbook={fakeOrderBook}
          kind={OfferType.buy}
          kindChange={() => null}
          zoomChange={() => null} />

      </Panel>
    </FlexLayoutRow>
  </div>
  );
});

stories.add('Direct', () => {
  return (
    <div>
      <h3>Buy</h3>
      <Panel style={normalPanelStyle}>
        <OfferMakePanel {...offerMakeFormProps({
          matchType: OfferMatchType.direct,
          amount: new BigNumber(2),
          price: new BigNumber(4),
          total: new BigNumber(8),
        })} />
      </Panel>
      <Panel style={narrowPanelStyle}>
        <OfferMakePanel {...offerMakeFormProps({
          matchType: OfferMatchType.direct,
          amount: new BigNumber(2),
          price: new BigNumber(4),
          total: new BigNumber(8),
        })} />
      </Panel>
      <h3>Sell</h3>
      <Panel style={normalPanelStyle}>
        <OfferMakePanel {...offerMakeFormProps({
          kind: OfferType.sell,
          matchType: OfferMatchType.direct,
          amount: new BigNumber(2),
          price: new BigNumber(4),
          total: new BigNumber(8),
        })} />
      </Panel>
      <Panel style={narrowPanelStyle}>
        <OfferMakePanel {...offerMakeFormProps({
          kind: OfferType.sell,
          matchType: OfferMatchType.direct,
          amount: new BigNumber(2),
          price: new BigNumber(4),
          total: new BigNumber(8),
        })} />
      </Panel>
    </div>
  );
});

stories.add('Order type picker', () => {
  return (
    <div>
      <Panel style={normalPanelStyle}>
        <OfferMakePanel {...offerMakeFormProps({
          matchType: OfferMatchType.limitOrder,
          amount: new BigNumber(2),
          price: new BigNumber(4),
          total: new BigNumber(8),
          pickerOpen: true,
        })} />
      </Panel>
      <Panel style={narrowPanelStyle}>
        <OfferMakePanel {...offerMakeFormProps({
          matchType: OfferMatchType.direct,
          amount: new BigNumber(2),
          price: new BigNumber(4),
          total: new BigNumber(8),
          pickerOpen: true,
        })} />
      </Panel>
    </div>
  );
});
