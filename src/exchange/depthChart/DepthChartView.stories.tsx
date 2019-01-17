import { storiesOf } from '@storybook/react';
import { BigNumber } from 'bignumber.js';
import * as React from 'react';
import { OfferMatchType } from '../../utils/form';
import { Panel } from '../../utils/panel/Panel';
import { OfferType } from '../orderbook/orderbook';
import { DepthChartView } from './DepthChartView';
import { createFakeOrderbook, fakeOrderBook, fakeOrderbookWithOutliers } from './fakeOrderBook';

const defaultStories = storiesOf('DepthChartView/Default - no price, no amount', module)
  .addDecorator(story => (
    <Panel style={{ width: '510px' }}>
      {story()}
    </Panel>
  ));

const limitOrderStories = storiesOf('DepthChartView/Limit Order', module)
  .addDecorator(story => (
    <Panel style={{ width: '510px' }}>
      {story()}
    </Panel>
  ));

const direct = storiesOf('DepthChartView/Direct', module)
  .addDecorator(story => (
    <Panel style={{ width: '510px' }}>
      {story()}
    </Panel>
  ));

const toBN = (s: string) => new BigNumber(s);

const defChartProps = {
  base: 'ETH',
  quote: 'DAI',
  matchType: OfferMatchType.limitOrder,
};

defaultStories.add('Sample order book', () => (
  <DepthChartView
    {...defChartProps }
    orderbook={fakeOrderBook}
    kind={OfferType.buy} />
));

defaultStories.add('Different zooms', () => {
  return (
    <div>
      <h4>Default (no zoom)</h4>
      <DepthChartView
        {...defChartProps }
        orderbook={fakeOrderBook}
        kind={OfferType.buy} />
      <h4>Zoom 5</h4>
      <DepthChartView
        {...defChartProps }
        zoom={new BigNumber(5)}
        orderbook={fakeOrderBook}
        kind={OfferType.buy} />
      <h4>Zoom 10</h4>
      <DepthChartView
        {...defChartProps }
        zoom={new BigNumber(10)}
        orderbook={fakeOrderBook}
        kind={OfferType.buy} />
      <h4>Zoom 50</h4>
      <DepthChartView
        {...defChartProps }
        zoom={new BigNumber(50)}
        orderbook={fakeOrderBook}
        kind={OfferType.buy} />
      <h4>Zoom 100</h4>
      <DepthChartView
        {...defChartProps }
        zoom={new BigNumber(100)}
        orderbook={fakeOrderBook}
        kind={OfferType.buy} />
      <h4>Zoom 500</h4>
      <DepthChartView
        {...defChartProps }
        zoom={new BigNumber(500)}
        orderbook={fakeOrderBook}
        kind={OfferType.buy} />
    </div>
  );
});

defaultStories.add('Very asymmetric order book', () => {
  const buys = [
    { price: 15, amount: 6 },
    { price: 10, amount: 4 },
    { price: 8.5, amount: 4 },
    { price: 3, amount: 5 },
    { price: 2, amount: 8.6 },
    { price: 1, amount: 12 }
  ];
  const sells = [
      { price: 158, amount: 17 },
      { price: 162, amount: 76 },
      { price: 178, amount: 45 },
      { price: 185, amount: 44 },
      { price: 235, amount: 14 },
      { price: 283, amount: 58 }
  ];
  return (
    <DepthChartView
      {...defChartProps }
      orderbook={createFakeOrderbook(buys, sells)}
      kind={OfferType.buy} />
  );
});

defaultStories.add('Empty buys', () => {
  const buys: any[] = [];
  const sells = [
      { price: 158, amount: 17 },
      { price: 162, amount: 76 },
      { price: 178, amount: 45 },
      { price: 185, amount: 44 },
      { price: 235, amount: 14 },
      { price: 283, amount: 58 }
  ];
  return (
    <DepthChartView
      {...defChartProps }
      orderbook={createFakeOrderbook(buys, sells)}
      kind={OfferType.buy} />
  );
});

defaultStories.add('Empty sells', () => {
  const buys = [
    { price: 15, amount: 6 },
    { price: 10, amount: 4 },
    { price: 8.5, amount: 4 },
    { price: 3, amount: 5 },
    { price: 2, amount: 8.6 },
    { price: 1, amount: 12 }
  ];
  const sells: any[] = [];
  return (
    <DepthChartView
      {...defChartProps }
      orderbook={createFakeOrderbook(buys, sells)}
      kind={OfferType.buy} />
  );
});

defaultStories.add('Empty order book - no sells nor buys', () => {
  const buys: any[] = [];
  const sells: any[] = [];
  return (
    <DepthChartView
      {...defChartProps }
      orderbook={createFakeOrderbook(buys, sells)}
      kind={OfferType.buy} />
  );
});

defaultStories.add('Orderbook with very low volume (< 0.1)', () => {
  const buys = [
    { price: 150, amount: 0.005 },
    { price: 149, amount: 0.05 },
    { price: 142, amount: 0.1 },
    { price: 105, amount: 4 },
    { price: 104.9, amount: 5 },
    { price: 103, amount: 8.6 },
    { price: 102, amount: 2 }
  ];
  const sells = [
    { price: 158, amount: 0.0051 },
    { price: 162, amount: 0.0002 },
    { price: 178, amount: 0.0005 },
    { price: 195, amount: 0.2 },
    { price: 235, amount: 1 },
    { price: 283, amount: 2.8 }
  ];
  return (
    <DepthChartView
      {...defChartProps }
      orderbook={createFakeOrderbook(buys, sells)}
      kind={OfferType.buy} />
  );
});

// ------------------------------ limit -----------------------------------
limitOrderStories.add(
  `Buy a bit with price lower than anyone's - it changes buy, extends x axis on the left`
  + ' (p: 100, a: 100)',
  () => (
    <DepthChartView
      {...defChartProps }
      orderbook={fakeOrderBook}
      kind={OfferType.buy}
      amount={toBN('100')}
      price={toBN('100')}
    />
  ),
);

limitOrderStories.add('Test 2.7', () => {
  const buys = [
    { price: 120, amount: 5 },
    { price: 110, amount: 9 },
    { price: 100, amount: 17 },
  ];
  const sells = [
    { price: 140, amount: 7 },
    { price: 142, amount: 8 },
    { price: 150, amount: 11 },
    { price: 160, amount: 1 },
  ];
  return (
    <DepthChartView
      {...defChartProps }
      orderbook={createFakeOrderbook(buys, sells)}
      kind={OfferType.sell}
      amount={toBN('10')}
      price={toBN('210')}
    />
  );
});

limitOrderStories.add('Buy with price a bit smaller than current buy offers  (p: 254, a: 100)',
                      () => (
    <DepthChartView
      {...defChartProps }
      orderbook={fakeOrderBook}
      kind={OfferType.buy}
      amount={toBN('100')}
      price={toBN('254')}
    />
));
limitOrderStories.add('Buy with price a bit smaller than current sell offers (p: 260, a: 100)',
                      () => (
    <DepthChartView
      {...defChartProps }
      orderbook={fakeOrderBook}
      kind={OfferType.buy}
      amount={toBN('100')}
      price={toBN('260')}
    />
  ));

limitOrderStories.add('Buy a bit from sell and leaves a bit in buys (p: 265, a: 100)',
                      () => (
  <DepthChartView
    {...defChartProps }
    orderbook={fakeOrderBook}
    kind={OfferType.buy}
    amount={toBN('100')}
    price={toBN('265')}
  />
));
limitOrderStories.add(
  'Buy a bit with reasonable price - eating from sell, nothing lasts in buy '
  + '(p: 275, a: 200)',
  () => (
    <DepthChartView
      {...defChartProps }
      orderbook={fakeOrderBook}
      kind={OfferType.buy}
      amount={toBN('200')}
      price={toBN('275')}
    />
  ));
limitOrderStories.add(
  'Buy everything with given price - eating from sell, nothing lasts in buy '
  + '(p: 279.9, a: 255)',
  () => (
    <DepthChartView
      {...defChartProps }
      orderbook={fakeOrderBook}
      kind={OfferType.buy}
      amount={toBN('255')}
      price={toBN('279.9')}
    />
  ));
limitOrderStories.add(
  'Buy everything and a bit more with given price - eating from sell, and some lefts for buy '
  + '(p: 279.9, a: 270)',
  () => (
    <DepthChartView
      {...defChartProps }
      orderbook={fakeOrderBook}
      kind={OfferType.buy}
      amount={toBN('270')}
      price={toBN('279.9')}
    />
  ));
limitOrderStories.add('Buy everything from sells (p: 330, a: 1000)',
                      () => (
  <DepthChartView
    {...defChartProps }
    orderbook={fakeOrderBook}
    kind={OfferType.buy}
    amount={toBN('1000')}
    price={toBN('330')}
  />
));

// -------------- sells section
limitOrderStories.add('Sell everything from buys (p: 200, a: 2100)',
                      () => (
    <DepthChartView
      {...defChartProps }
      orderbook={fakeOrderBook}
      kind={OfferType.sell}
      amount={toBN('2100')}
      price={toBN('200')}/>
  ));

limitOrderStories.add('Sell a bit with reasonable price - eating from buy, nothing lasts in sell'
  + ' (p: 240, a: 350)',
                      () => (
  <DepthChartView
    {...defChartProps }
    orderbook={fakeOrderBook}
    kind={OfferType.sell}
    amount={toBN('350')}
    price={toBN('240')}/>
));

limitOrderStories.add('Sell a bit from buy and leaves a bit in sells (p: 250, a: 670)',
                      () => (
    <DepthChartView
      {...defChartProps }
      orderbook={fakeOrderBook}
      kind={OfferType.sell}
      amount={toBN('670')}
      price={toBN('250')}/>
  ));

limitOrderStories.add('Sell a bit with price higher than anyone\'s - '
    + ' it changes sell, extends x axis on the right (p: 500, a: 100)',
                      () => (
  <DepthChartView
    {...defChartProps }
    orderbook={fakeOrderBook}
    kind={OfferType.sell}
    amount={toBN('100')}
    price={toBN('500')}/>
));

limitOrderStories.add('Orderbook with strange orders', () => (
  <DepthChartView
    {...defChartProps }
    orderbook={fakeOrderbookWithOutliers}
    kind={OfferType.sell}
    amount={toBN('100')}
    price={toBN('500')}/>
));

// --------------------------------- direct --------------
direct.add(
  `Buy a bit`
  + ' (p: x, a: 100)',
  () => (
    <DepthChartView
      {...defChartProps }
      matchType={OfferMatchType.direct}
      orderbook={fakeOrderBook}
      kind={OfferType.buy}
      amount={toBN('100')}
      price={toBN('100')}
    />
  ),
);
direct.add(
  'Buy a bit '
  + '(p: x, a: 200)',
  () => (
    <DepthChartView
      {...defChartProps }
      matchType={OfferMatchType.direct}
      orderbook={fakeOrderBook}
      kind={OfferType.buy}
      amount={toBN('200')}
      price={toBN('275')}
    />
  ));

direct.add('Sell a bit '
  + ' (p: x, a: 350)',
           () => (
    <DepthChartView
      {...defChartProps }
      matchType={OfferMatchType.direct}
      orderbook={fakeOrderBook}
      kind={OfferType.sell}
      amount={toBN('350')}
      price={toBN('240')}/>
  ));
