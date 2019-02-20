import { setupFakeWeb3ForTesting } from '../blockchain/web3';

setupFakeWeb3ForTesting();

import { BigNumber } from 'bignumber.js';
import { omit } from 'lodash';
import { of } from 'rxjs';

import { Calls$ } from '../blockchain/calls/calls';
import { createFakeOrderbook, emptyOrderBook } from '../exchange/depthChart/fakeOrderBook';
import { unpack } from '../utils/testHelpers';
import { createFormController$, FormChangeKind } from './instant';

function snapshotify(object: any): any {
  return omit(object, 'change');
}

const tradingPair = { base: 'WETH', quote: 'DAI' };

const defaultCalls = {
  offerMakeEstimateGas: () => of(20),
  offerMake: null as any,
  cancelOffer: null as any,
  cancelOfferEstimateGas: null as any,
  offerMakeDirect: null as any,
  offerMakeDirectEstimateGas: () => of(30),
  setupMTProxy: null as any,
  setupMTProxyEstimateGas: null as any,
  approve: null as any,
  disapprove: null as any,
  approveWallet: null as any,
  disapproveWallet: null as any,
  wrap: null as any,
  wrapEstimateGas: null as any,
  unwrap: null as any,
  unwrapEstimateGas: null as any,
};

const defParams = {
  gasPrice$: of(new BigNumber(0.01)),
  etherPriceUsd$: of(new BigNumber(1)),
  allowance$: () => of(true),
  balances$: of({ DAI: new BigNumber(10), WETH: new BigNumber(10) }),
  dustLimits$: of({ DAI: new BigNumber(0.1), WETH: new BigNumber(0.1) }),
  orderbook$: of(emptyOrderBook),
  calls$: of(defaultCalls) as Calls$,
};

const controllerWithFakeOrderBook = (buys: any = [], sells: any = []) => {
  const orderbook = createFakeOrderbook(buys, sells);
  orderbook.buy.forEach((v, i) => v.offerId = new BigNumber(i + 1));
  orderbook.sell.forEach((v, i) => v.offerId = new BigNumber(i + 1));
  orderbook.buy.forEach((v) => v.timestamp = new Date('2019-02-19'));
  orderbook.sell.forEach((v) => v.timestamp = new Date('2019-02-19'));
  return createFormController$(
    {
      ...defParams,
      orderbook$: of(orderbook),
    },
    tradingPair
  );
};

const fakeOrderBook = [
  [
    { price: 180, amount: 10 },
  ],
  [
    { price: 200, amount: 10 },
  ]
];

test('initial state', done => {
  const controller = createFormController$(defParams, tradingPair);
  controller.subscribe(state => {
    expect(snapshotify(state)).toMatchSnapshot();
    done();
  });
});

test('change pair', done => {
  const controller = createFormController$(defParams, tradingPair);
  const { change } = unpack(controller);

  change({ kind: FormChangeKind.pairChange, buyToken: 'WETH', sellToken: 'DAI' });

  controller.subscribe(state => {
    expect(snapshotify(state)).toMatchSnapshot();
    done();
  });
});

test('sell a bit', done => {
  const controller = controllerWithFakeOrderBook(...fakeOrderBook);
  const { change } = unpack(controller);

  change({ kind: FormChangeKind.sellAmountFieldChange, value: new BigNumber(1) });

  controller.subscribe(state => {
    expect(snapshotify(state)).toMatchSnapshot();
    done();
  });
});

test('buy a bit', done => {
  const controller = controllerWithFakeOrderBook(...fakeOrderBook);
  const { change } = unpack(controller);

  change({ kind: FormChangeKind.buyAmountFieldChange, value: new BigNumber(300) });

  controller.subscribe(state => {
    expect(snapshotify(state)).toMatchSnapshot();
    done();
  });
});
