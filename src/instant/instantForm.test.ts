import { BigNumber } from 'bignumber.js';
import jestEach from 'jest-each';
import { omit } from 'lodash';
import { of } from 'rxjs';
import { first } from 'rxjs/operators';

import { Calls$, ReadCalls$ } from '../blockchain/calls/calls';
import { NetworkConfig } from '../blockchain/config';
import { TxState, TxStatus } from '../blockchain/transactions';
import { setupFakeWeb3ForTesting } from '../blockchain/web3';
import { createFakeOrderbook } from '../exchange/depthChart/fakeOrderBook';
import { unpack } from '../utils/testHelpers';
import { zero } from '../utils/zero';
import { createFormController$, InstantFormChangeKind } from './instantForm';

setupFakeWeb3ForTesting();

function snapshotify(object: any): any {
  return omit(object, 'change', 'submit');
}

const defaultCalls = {} as any;

const defaultReadCalls = {
} as any;

const defaultUser = {
  account: '0x1234',
};

const defParams = {
  gasPrice$: of(new BigNumber(0.01)),
  etherPriceUsd$: of(new BigNumber(1)),
  balances$: of({ DAI: new BigNumber(1000), WETH: new BigNumber(10), ETH: new BigNumber(5) }),
  etherBalance$: of(zero),
  proxyAddress$: of('0x0'),
  dustLimits$: of({ DAI: new BigNumber(0.1), WETH: new BigNumber(0.1) }),
  allowances$: of({ DAI: true, WETH: false }),
  calls$: of(defaultCalls) as Calls$,
  readCalls$: of(defaultReadCalls) as ReadCalls$,
  user$: of(defaultUser),
  context$: of({} as NetworkConfig)
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
    }
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

test.skip('initial state', done => {
  const controller = createFormController$(defParams);
  controller.subscribe(state => {
    expect(snapshotify(state)).toMatchSnapshot();
    done();
  });
});

test.skip('change pair', done => {
  const controller = createFormController$(defParams);
  const { change } = unpack(controller);

  change({ kind: InstantFormChangeKind.pairChange, buyToken: 'WETH', sellToken: 'DAI' });

  controller.subscribe(state => {
    expect(snapshotify(state)).toMatchSnapshot();
    done();
  });
});

jestEach([
  ['sell', (change: any) => {
    change({ kind: InstantFormChangeKind.sellAmountFieldChange, value: new BigNumber(1) });
  }],
  ['buy', (change: any) => {
    change({ kind: InstantFormChangeKind.buyAmountFieldChange, value: new BigNumber(90) });
  }],
  ['pay eth', (change: any) => {
    change({ kind: InstantFormChangeKind.pairChange, buyToken: 'DAI', sellToken: 'ETH' });
    change({ kind: InstantFormChangeKind.buyAmountFieldChange, value: new BigNumber(90) });
  }],
  ['buy eth', (change: any) => {
    change({ kind: InstantFormChangeKind.pairChange, buyToken: 'ETH', sellToken: 'DAI' });
    change({ kind: InstantFormChangeKind.buyAmountFieldChange, value: new BigNumber(2) });
  }],
]).test.skip('transaction - %s', (_test, perform, done) => {
  const instantOrderMock = jest.fn(
    () => of({
      status: TxStatus.WaitingForApproval
    } as TxState),
  ).mockName('tradePayWithETH');

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

test.skip('complex scenario', done => {
  const controller = controllerWithFakeOrderBook(...fakeOrderBook);
  const { change } = unpack(controller);

  controller.pipe(first()).subscribe(state => {
    expect(snapshotify(state)).toMatchSnapshot();
    done();
  });

  change({ kind: InstantFormChangeKind.sellAmountFieldChange, value: new BigNumber(2) });
  controller.pipe(first()).subscribe(state => {
    expect(snapshotify(state)).toMatchSnapshot();
  });

  change({ kind: InstantFormChangeKind.buyAmountFieldChange, value: new BigNumber(90) });
  controller.pipe(first()).subscribe(state => {
    expect(snapshotify(state)).toMatchSnapshot();
  });

  change({ kind: InstantFormChangeKind.pairChange, buyToken: 'WETH', sellToken: 'DAI' });
  controller.pipe(first()).subscribe(state => {
    expect(snapshotify(state)).toMatchSnapshot();
  });

  change({ kind: InstantFormChangeKind.buyAmountFieldChange, value: new BigNumber(2) });
  controller.pipe(first()).subscribe(state => {
    expect(snapshotify(state)).toMatchSnapshot();
  });

  change({ kind: InstantFormChangeKind.sellAmountFieldChange, value: new BigNumber(100) });
  controller.pipe(first()).subscribe(state => {
    expect(snapshotify(state)).toMatchSnapshot();
  });

  change({ kind: InstantFormChangeKind.formResetChange });
  controller.pipe(first()).subscribe(state => {
    expect(snapshotify(state)).toMatchSnapshot();
  });
});

jestEach([
  ['insufficient balance', (change: any) => {
    change({ kind: InstantFormChangeKind.pairChange, buyToken: 'WETH', sellToken: 'DAI' });
    change({ kind: InstantFormChangeKind.sellAmountFieldChange, value: new BigNumber(1100) });
  }],
  ['dust limit', (change: any) => {
    change({ kind: InstantFormChangeKind.sellAmountFieldChange, value: new BigNumber(0.001) });
  }],
  ['incredible amount base', (change: any) => {
    change({
      kind: InstantFormChangeKind.sellAmountFieldChange,
      value: new BigNumber(1000000000000001)
    });
  }],
  ['incredible amount quote', (change: any) => {
    change({
      kind: InstantFormChangeKind.pairChange,
      buyToken: 'WETH',
      sellToken: 'DAI'
    });
    change({
      kind: InstantFormChangeKind.sellAmountFieldChange,
      value: new BigNumber(1000000000000001)
    });
  }],
  ['orderbook exceeded quote', (change: any) => {
    change({ kind: InstantFormChangeKind.buyAmountFieldChange, value: new BigNumber(2001) });
  }],
  ['orderbook exceeded base', (change: any) => {
    change({ kind: InstantFormChangeKind.pairChange, buyToken: 'WETH', sellToken: 'DAI' });
    change({ kind: InstantFormChangeKind.buyAmountFieldChange, value: new BigNumber(11) });
  }],
]).test.skip('validation - %s', (_test, perform, done) => {
  const controller = controllerWithFakeOrderBook(...fakeOrderBook);
  perform(unpack(controller).change);
  controller.subscribe(state => {
    expect(snapshotify(state)).toMatchSnapshot();
    done();
  });
});
