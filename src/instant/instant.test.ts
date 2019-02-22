import { setupFakeWeb3ForTesting } from '../blockchain/web3';

setupFakeWeb3ForTesting();

import { BigNumber } from 'bignumber.js';
import jestEach from 'jest-each';
import { omit } from 'lodash';
import { of } from 'rxjs';
import { first } from 'rxjs/operators';

import { Calls$ } from '../blockchain/calls/calls';
import { TxState, TxStatus } from '../blockchain/transactions';
import { createFakeOrderbook, emptyOrderBook } from '../exchange/depthChart/fakeOrderBook';
import { unpack } from '../utils/testHelpers';
import { createFormController$, FormChangeKind } from './instant';

function snapshotify(object: any): any {
  return omit(object, 'change', 'submit');
}

const tradingPair = { base: 'WETH', quote: 'DAI' };

const defaultCalls = {
  instantOrder: null as any,
  instantOrderEstimateGas: () => of(40),
  offerMake: null as any,
  offerMakeEstimateGas: () => of(20),
  offerMakeDirect: null as any,
  offerMakeDirectEstimateGas: () => of(30),
  cancelOffer: null as any,
  cancelOfferEstimateGas: null as any,
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
  balances$: of({ DAI: new BigNumber(1000), WETH: new BigNumber(10), ETH: new BigNumber(5) }),
  dustLimits$: of({ DAI: new BigNumber(0.1), WETH: new BigNumber(0.1) }),
  orderbook$: of(emptyOrderBook),
  calls$: of(defaultCalls) as Calls$,
};

const controllerWithFakeOrderBook = (buys: any = [], sells: any = [], overrides: {} = {}) => {
  const orderbook = createFakeOrderbook(buys, sells);
  orderbook.buy.forEach((v, i) => v.offerId = new BigNumber(i + 1));
  orderbook.sell.forEach((v, i) => v.offerId = new BigNumber(i + 1));
  orderbook.buy.forEach((v) => v.timestamp = new Date('2019-02-19'));
  orderbook.sell.forEach((v) => v.timestamp = new Date('2019-02-19'));
  return createFormController$(
    {
      ...defParams,
      ...overrides,
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

jestEach([
  ['sell', (change: any) => {
    change({ kind: FormChangeKind.sellAmountFieldChange, value: new BigNumber(1) });
  }],
  ['buy', (change: any) => {
    change({ kind: FormChangeKind.buyAmountFieldChange, value: new BigNumber(90) });
  }],
  ['pay eth', (change: any) => {
    change({ kind: FormChangeKind.pairChange, buyToken: 'DAI', sellToken: 'ETH' });
    change({ kind: FormChangeKind.buyAmountFieldChange, value: new BigNumber(90) });
  }],
  ['buy eth', (change: any) => {
    change({ kind: FormChangeKind.pairChange, buyToken: 'ETH', sellToken: 'DAI' });
    change({ kind: FormChangeKind.buyAmountFieldChange, value: new BigNumber(2) });
  }],
]).test('transaction - %s', (_test, perform, done) => {
  const instantOrderMock = jest.fn(
    () => of({
      status: TxStatus.WaitingForApproval
    } as TxState),
  ).mockName('instantOrder');

  const controller = controllerWithFakeOrderBook(fakeOrderBook[0], fakeOrderBook[1], {
    calls$: of({
      ...defaultCalls,
      instantOrder: instantOrderMock,
    })
  });

  perform(unpack(controller).change);

  controller.pipe(first()).subscribe(state => {
    expect(snapshotify(state)).toMatchSnapshot();
  });

  unpack(controller).submit(unpack(controller));
  expect(instantOrderMock.mock.calls).toMatchSnapshot();

  controller.subscribe(state => {
    expect(snapshotify(state)).toMatchSnapshot();
    done();
  });
});

test('complex scenario', done => {
  const controller = controllerWithFakeOrderBook(...fakeOrderBook);
  const { change } = unpack(controller);

  controller.pipe(first()).subscribe(state => {
    expect(snapshotify(state)).toMatchSnapshot();
    done();
  });

  change({ kind: FormChangeKind.sellAmountFieldChange, value: new BigNumber(2) });
  controller.pipe(first()).subscribe(state => {
    expect(snapshotify(state)).toMatchSnapshot();
  });

  change({ kind: FormChangeKind.buyAmountFieldChange, value: new BigNumber(90) });
  controller.pipe(first()).subscribe(state => {
    expect(snapshotify(state)).toMatchSnapshot();
  });

  change({ kind: FormChangeKind.pairChange, buyToken: 'WETH', sellToken: 'DAI' });
  controller.pipe(first()).subscribe(state => {
    expect(snapshotify(state)).toMatchSnapshot();
  });

  change({ kind: FormChangeKind.buyAmountFieldChange, value: new BigNumber(2) });
  controller.pipe(first()).subscribe(state => {
    expect(snapshotify(state)).toMatchSnapshot();
  });

  change({ kind: FormChangeKind.sellAmountFieldChange, value: new BigNumber(100) });
  controller.pipe(first()).subscribe(state => {
    expect(snapshotify(state)).toMatchSnapshot();
  });

  change({ kind: FormChangeKind.formResetChange });
  controller.pipe(first()).subscribe(state => {
    expect(snapshotify(state)).toMatchSnapshot();
  });
});

jestEach([
  ['insufficient balance', (change: any) => {
    change({ kind: FormChangeKind.pairChange, buyToken: 'WETH', sellToken: 'DAI' });
    change({ kind: FormChangeKind.sellAmountFieldChange, value: new BigNumber(1100) });
  }],
  ['dust limit', (change: any) => {
    change({ kind: FormChangeKind.sellAmountFieldChange, value: new BigNumber(0.001) });
  }],
  ['incredible amount base', (change: any) => {
    change({ kind: FormChangeKind.sellAmountFieldChange, value: new BigNumber(1000000000000001) });
  }],
  ['incredible amount quote', (change: any) => {
    change({ kind: FormChangeKind.pairChange, buyToken: 'WETH', sellToken: 'DAI' });
    change({ kind: FormChangeKind.sellAmountFieldChange, value: new BigNumber(1000000000000001) });
  }],
  ['orderbook exceeded quote', (change: any) => {
    change({ kind: FormChangeKind.buyAmountFieldChange, value: new BigNumber(2001) });
  }],
  ['orderbook exceeded base', (change: any) => {
    change({ kind: FormChangeKind.pairChange, buyToken: 'WETH', sellToken: 'DAI' });
    change({ kind: FormChangeKind.buyAmountFieldChange, value: new BigNumber(11) });
  }],
]).test('validation - %s', (_test, perform, done) => {
  const controller = controllerWithFakeOrderBook(...fakeOrderBook);
  perform(unpack(controller).change);
  controller.subscribe(state => {
    expect(snapshotify(state)).toMatchSnapshot();
    done();
  });
});
