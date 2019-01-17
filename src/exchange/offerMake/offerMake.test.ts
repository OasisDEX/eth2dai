import { setupFakeWeb3ForTesting } from '../../blockchain/web3';

setupFakeWeb3ForTesting();

import { BigNumber } from 'bignumber.js';
import { omit } from 'lodash';
import { of } from 'rxjs';
import { throwError } from 'rxjs/internal/observable/throwError';

import { Calls$ } from '../../blockchain/calls/calls';
import { TxState, TxStatus } from '../../blockchain/transactions';
import { FormChangeKind, GasEstimationStatus, OfferMatchType } from '../../utils/form';
import { unpack } from '../../utils/testHelpers';
import { createFakeOrderbook, emptyOrderBook } from '../depthChart/fakeOrderBook';
import { Offer, OfferType } from '../orderbook/orderbook';
import { createFormController$, FormStage } from './offerMake';

function snapshotify(object: any): any {
  return omit(object, 'change');
}

const defaultCalls = {
  offerMakeEstimateGas: () => of(20),
  offerMake: null as any,
  cancelOffer: null as any,
  offerMakeDirect: null as any,
  offerMakeDirectEstimateGas: null as any,
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

test('initial state', done => {
  const controller = createFormController$(defParams, { base: 'WETH', quote: 'DAI' });
  controller.subscribe(state => {
    expect(snapshotify(state)).toMatchSnapshot();
    done();
  });
});

test('set price and amount', () => {
  const controller = createFormController$(defParams, { base: 'WETH', quote: 'DAI' });
  const { change } = unpack(controller);

  change({ kind: FormChangeKind.priceFieldChange, value: new BigNumber(2) });

  expect(unpack(controller).price).toEqual(new BigNumber(2));
  expect(unpack(controller).total).toBeUndefined();
  expect(unpack(controller).gasEstimationStatus).toEqual(GasEstimationStatus.unset);

  change({ kind: FormChangeKind.amountFieldChange, value: new BigNumber(3) });
  expect(unpack(controller).amount).toEqual(new BigNumber(3));
  expect(unpack(controller).total).toEqual(new BigNumber(6));
  expect(unpack(controller).gasEstimationStatus).toEqual(GasEstimationStatus.calculated);

  expect(snapshotify(unpack(controller))).toMatchSnapshot();
});

test('estimate gas calculation', () => {

  const estimateGasMock = jest.fn(() => of(new BigNumber(20)))
    .mockName('offerMakeEstimateGas');

  const controller = createFormController$(
    {
      ...defParams,
      calls$: of({
        ...defaultCalls,
        offerMakeEstimateGas: estimateGasMock,
      })
    },
    { base: 'WETH', quote: 'DAI' }
  );

  const { change } = unpack(controller);

  change({ kind: FormChangeKind.priceFieldChange, value: new BigNumber(2) });
  change({ kind: FormChangeKind.amountFieldChange, value: new BigNumber(3) });
  expect(unpack(controller).total).toEqual(new BigNumber(6));
  expect(unpack(controller).kind).toEqual(OfferType.buy);

  change({ kind: FormChangeKind.kindChange, newKind: OfferType.sell });
  expect(unpack(controller).kind).toEqual(OfferType.sell);

  expect(estimateGasMock.mock.calls.length).toBe(2);

  // buy
  expect(estimateGasMock.mock.calls[0][0]).toEqual({
    buyAmount: new BigNumber(3),
    buyToken: 'WETH',
    sellAmount: new BigNumber(6),
    sellToken: 'DAI',
    matchType: OfferMatchType.limitOrder,
    kind: OfferType.buy,
    gasPrice: new BigNumber(0.01),
    position: undefined,
  });

  // sell
  expect(estimateGasMock.mock.calls[1][0]).toEqual({
    buyAmount: new BigNumber(6),
    buyToken: 'DAI',
    sellAmount: new BigNumber(3),
    sellToken: 'WETH',
    matchType: OfferMatchType.limitOrder,
    kind: OfferType.sell,
    gasPrice: new BigNumber(0.01),
    position: undefined,
  });

});

test('calculate position in order book for buy', () => {
  const buys = [
    { price: 5, amount: 3 }, // 1
    { price: 4, amount: 3 }, // 2
    { price: 2.5, amount: 3 }, // 3
    { price: 2, amount: 4 }, // 4
    { price: 1, amount: 4 }, // 5
  ];
  const orderbook = createFakeOrderbook(buys, []);
  orderbook.buy.forEach((v, i) => v.offerId = new BigNumber(i + 1));

  const controller = createFormController$(
    {
      ...defParams,
      orderbook$: of(orderbook),
    },
    { base: 'WETH', quote: 'DAI' });

  const { change } = unpack(controller);
  expect(unpack(controller).position).toBeUndefined();

  change({ kind: FormChangeKind.amountFieldChange, value: new BigNumber(2) });
  expect(unpack(controller).position).toBeUndefined();

  change({ kind: FormChangeKind.priceFieldChange, value: new BigNumber(3) });
  expect(unpack(controller).position).toEqual(new BigNumber(3));

  change({ kind: FormChangeKind.priceFieldChange, value: new BigNumber(0.9) });
  expect(unpack(controller).position).toEqual(new BigNumber(5));

  change({ kind: FormChangeKind.priceFieldChange, value: new BigNumber(2.5) });
  expect(unpack(controller).position).toEqual(new BigNumber(4));

  change({ kind: FormChangeKind.priceFieldChange, value: new BigNumber(6) });
  expect(unpack(controller).position).toEqual(new BigNumber(1));
});

test('calculate undefined position in empty order book for buy', () => {
  const orderbook = createFakeOrderbook([], []);

  const controller = createFormController$(
    { ...defParams,
      orderbook$: of(orderbook),
    },
    { base: 'WETH', quote: 'DAI' });

  const { change } = unpack(controller);

  change({ kind: FormChangeKind.priceFieldChange, value: new BigNumber(3) });
  expect(unpack(controller).position).toBeUndefined();

  change({ kind: FormChangeKind.kindChange, newKind: OfferType.sell });
  expect(unpack(controller).position).toBeUndefined();
});

test('calculate position in orderbook for sell', () => {
  const sells = [
    { price: 1.3, amount: 3 }, // 1
    { price: 2, amount: 3 }, // 2
    { price: 4, amount: 3 }, // 3
    { price: 5, amount: 4 }, // 4
  ];
  const orderbook = createFakeOrderbook([], sells);
  orderbook.sell.forEach((v, i) => v.offerId = new BigNumber(i + 1));

  const controller = createFormController$(
    { ...defParams,
      orderbook$: of(orderbook),
    },
    { base: 'WETH', quote: 'DAI' });

  const { change } = unpack(controller);

  change({ kind: FormChangeKind.kindChange, newKind: OfferType.sell });
  expect(unpack(controller).kind).toEqual(OfferType.sell);
  expect(unpack(controller).position).toBeUndefined();

  change({ kind: FormChangeKind.priceFieldChange, value: new BigNumber(3.5) });
  expect(unpack(controller).price).toEqual(new BigNumber(3.5));
  expect(unpack(controller).position).toEqual(new BigNumber(3));

  change({ kind: FormChangeKind.priceFieldChange, value: new BigNumber(1) });
  expect(unpack(controller).position).toEqual(new BigNumber(1));

  change({ kind: FormChangeKind.priceFieldChange, value: new BigNumber(6) });
  expect(unpack(controller).position).toEqual(new BigNumber(4));

  change({ kind: FormChangeKind.priceFieldChange, value: new BigNumber(1.3) });
  expect(unpack(controller).position).toEqual(new BigNumber(2));

});

test('click buy button', () => {
  const offerMakeMock = jest.fn(
    () => of({
      status: TxStatus.WaitingForApproval
    } as TxState),
  ).mockName('offerMake');

  const controller = createFormController$(
    {
      ...defParams,
      calls$: of({
        ...defaultCalls,
        offerMake: offerMakeMock
      }),
    },
    { base: 'WETH', quote: 'DAI' });

  const { change } = unpack(controller);

  change({ kind: FormChangeKind.priceFieldChange, value: new BigNumber(2) });
  change({ kind: FormChangeKind.amountFieldChange, value: new BigNumber(3) });
  unpack(controller).submit(unpack(controller));
  expect(unpack(controller).stage).toEqual(FormStage.waitingForApproval);

  expect(offerMakeMock.mock.calls.length).toBe(1);
  expect(offerMakeMock.mock.calls[0][0]).toEqual({
    buyAmount: new BigNumber(3),
    buyToken: 'WETH',
    sellAmount: new BigNumber(6),
    sellToken: 'DAI',
    matchType: OfferMatchType.limitOrder,
    kind: OfferType.buy,
    gasPrice: new BigNumber(0.01),
    position: undefined,
  });

  expect(snapshotify(unpack(controller))).toMatchSnapshot();
});

test('click sell button...', () => {
  const offerMakeMock = jest.fn(() => of({
    status: TxStatus.WaitingForApproval
  } as TxState),
  ).mockName('offerMake');
  const controller = createFormController$(
    {
      ...defParams,
      calls$: of({
        ...defaultCalls,
        offerMake: offerMakeMock,
      }),
    },
    { base: 'WETH', quote: 'DAI' });

  const { change } = unpack(controller);

  change({ kind: FormChangeKind.kindChange, newKind: OfferType.sell });
  expect(unpack(controller).kind).toEqual(OfferType.sell);

  change({ kind: FormChangeKind.priceFieldChange, value: new BigNumber(2) });
  expect(unpack(controller).price).toEqual(new BigNumber(2));

  change({ kind: FormChangeKind.amountFieldChange, value: new BigNumber(3) });
  expect(unpack(controller).amount).toEqual(new BigNumber(3));

  unpack(controller).submit(unpack(controller));
  expect(unpack(controller).stage).toEqual(FormStage.waitingForApproval);
  expect(unpack(controller).kind).toEqual(OfferType.sell);

  expect(offerMakeMock.mock.calls.length).toBe(1);
  expect(offerMakeMock.mock.calls[0][0]).toEqual({
    buyAmount: new BigNumber(6),
    buyToken: 'DAI',
    sellAmount: new BigNumber(3),
    sellToken: 'WETH',
    matchType: OfferMatchType.limitOrder,
    kind: OfferType.sell,
    gasPrice: new BigNumber(0.01),
    position: undefined,
  });

});

test('click buy button confirmed', () => {
  const offerMakeMock = jest.fn(() => of(
    { status: TxStatus.WaitingForApproval } as TxState,
    { status: TxStatus.WaitingForConfirmation } as TxState
  )).mockName('offerMake');

  const controller = createFormController$(
    { ...defParams,
      calls$: of({
        ...defaultCalls,
        offerMake: offerMakeMock,
      }),
    },
    { base: 'WETH', quote: 'DAI' });

  const { change } = unpack(controller);

  change({ kind: FormChangeKind.priceFieldChange, value: new BigNumber(2) });
  change({ kind: FormChangeKind.amountFieldChange, value: new BigNumber(3) });
  unpack(controller).submit(unpack(controller));

  expect(unpack(controller).stage).toEqual(FormStage.editing);
  expect(unpack(controller).price).toBeUndefined();
  expect(unpack(controller).amount).toBeUndefined();
  expect(unpack(controller).total).toBeUndefined();
  expect(snapshotify(unpack(controller))).toMatchSnapshot();

  expect(offerMakeMock.mock.calls.length).toBe(1);
  expect(offerMakeMock.mock.calls[0][0]).toEqual({
    buyAmount: new BigNumber(3),
    buyToken: 'WETH',
    sellAmount: new BigNumber(6),
    sellToken: 'DAI',
    matchType: OfferMatchType.limitOrder,
    kind: OfferType.buy,
    gasPrice: new BigNumber(0.01),
    position: undefined,
  });

});

test('click buy button canceled', () => {
  const controller = createFormController$(
    {
      ...defParams,
      calls$: of({
        ...defaultCalls,
        offerMake: () => of({
          status: TxStatus.CancelledByTheUser
        } as TxState),
      }),
    },
    { base: 'WETH', quote: 'DAI' });

  const { change } = unpack(controller);

  change({ kind: FormChangeKind.priceFieldChange, value: new BigNumber(2) });
  change({ kind: FormChangeKind.amountFieldChange, value: new BigNumber(3) });
  unpack(controller).submit(unpack(controller));

  expect(unpack(controller).stage).toEqual(FormStage.readyToProceed);
  expect(unpack(controller).price).toEqual(new BigNumber(2));
  expect(unpack(controller).amount).toEqual(new BigNumber(3));
  expect(unpack(controller).total).toEqual(new BigNumber(6));

  expect(snapshotify(unpack(controller))).toMatchSnapshot();
});

test('validation - allowance not given', () => {
  const controller = createFormController$(
    {
      ...defParams,
      allowance$: () => of(false),
    },
    { base: 'WETH', quote: 'DAI' });

  const { change } = unpack(controller);

  expect(unpack(controller).messages).toEqual([]);
  change({ kind: FormChangeKind.priceFieldChange, value: new BigNumber(2) });
  expect(unpack(controller).messages).toEqual([]);
  change({ kind: FormChangeKind.amountFieldChange, value: new BigNumber(3) });
  expect(unpack(controller).messages).not.toEqual([]);

  expect(snapshotify(unpack(controller).messages)).toMatchSnapshot();
});

test('validation - not enough money', () => {
  const controller = createFormController$(defParams, { base: 'WETH', quote: 'DAI' });

  const { change } = unpack(controller);

  expect(unpack(controller).messages).toEqual([]);
  change({ kind: FormChangeKind.priceFieldChange, value: new BigNumber(2) });
  expect(unpack(controller).messages).toEqual([]);
  change({ kind: FormChangeKind.amountFieldChange, value: new BigNumber(13) });
  expect(unpack(controller).messages).not.toEqual([]);

  expect(snapshotify(unpack(controller).messages)).toMatchSnapshot();
});

test('validation - too small amount', () => {
  const controller = createFormController$(defParams, { base: 'WETH', quote: 'DAI' });

  const { change } = unpack(controller);

  expect(unpack(controller).messages).toEqual([]);
  change({ kind: FormChangeKind.priceFieldChange, value: new BigNumber(2) });
  expect(unpack(controller).messages).toEqual([]);
  change({ kind: FormChangeKind.amountFieldChange, value: new BigNumber(0.01) });
  expect(unpack(controller).messages).not.toEqual([]);

  expect(snapshotify(unpack(controller).messages)).toMatchSnapshot();
});

test('validation - too small amount with unknown token dustLimits', () => {
  const controller = createFormController$(
    {
      ...defParams,
      dustLimits$: of({ WETH: new BigNumber(0.1) }),
    },
    { base: 'WETH', quote: 'DAI' });

  const { change } = unpack(controller);

  expect(unpack(controller).messages).toEqual([]);
  change({ kind: FormChangeKind.priceFieldChange, value: new BigNumber(2) });
  expect(unpack(controller).amount).toBeUndefined();
  expect(unpack(controller).price).toEqual(new BigNumber(2));
  expect(unpack(controller).messages).toEqual([]);

  change({ kind: FormChangeKind.amountFieldChange, value: new BigNumber(-0.01) });
  expect(unpack(controller).price).toEqual(new BigNumber(2));
  expect(unpack(controller).amount).toEqual(new BigNumber(-0.01));
  expect(unpack(controller).messages).not.toEqual([]);

  expect(snapshotify(unpack(controller).messages)).toMatchSnapshot();
});

test('validation - too big amount', () => {
  const controller = createFormController$(
    {
      ...defParams,
      balances$: of({ DAI: new BigNumber(20000000000000000) }),
    },
    { base: 'WETH', quote: 'DAI' });

  const { change } = unpack(controller);

  expect(unpack(controller).messages).toEqual([]);
  change({ kind: FormChangeKind.priceFieldChange, value: new BigNumber(2) });
  expect(unpack(controller).messages).toEqual([]);
  change({ kind: FormChangeKind.amountFieldChange,
    value: new BigNumber(10000000000000000) });
  expect(unpack(controller).messages).not.toEqual([]);

  expect(snapshotify(unpack(controller).messages)).toMatchSnapshot();
});

test('init sell', () => {
  const controller = createFormController$(defParams, { base: 'WETH', quote: 'DAI' });
  const { change } = unpack(controller);

  expect(unpack(controller).kind).toEqual(OfferType.buy);
  change({ kind: FormChangeKind.kindChange, newKind: OfferType.sell });
  expect(unpack(controller).kind).toEqual(OfferType.sell);
});

test('init buy after sell', () => {
  const controller = createFormController$(defParams, { base: 'WETH', quote: 'DAI' });
  const { change } = unpack(controller);

  expect(unpack(controller).kind).toEqual(OfferType.buy);
  change({ kind: FormChangeKind.kindChange, newKind: OfferType.sell });
  expect(unpack(controller).kind).toEqual(OfferType.sell);
  change({ kind: FormChangeKind.kindChange, newKind: OfferType.buy });
  expect(unpack(controller).kind).toEqual(OfferType.buy);
});

test('set amount and price in sell', () => {
  const controller = createFormController$(defParams, { base: 'WETH', quote: 'DAI' });
  const { change } = unpack(controller);

  expect(unpack(controller).kind).toEqual(OfferType.buy);
  change({ kind: FormChangeKind.kindChange, newKind: OfferType.sell });
  change({ kind: FormChangeKind.priceFieldChange, value: new BigNumber(2) });
  change({ kind: FormChangeKind.amountFieldChange, value: new BigNumber(3) });

  expect(snapshotify(unpack(controller))).toMatchSnapshot();
});

test('set amount and price in buy and change to sell', () => {
  const controller = createFormController$(defParams, { base: 'WETH', quote: 'DAI' });
  const { change } = unpack(controller);

  change({ kind: FormChangeKind.priceFieldChange, value: new BigNumber(2) });
  change({ kind: FormChangeKind.amountFieldChange, value: new BigNumber(3) });
  expect(unpack(controller).kind).toEqual(OfferType.buy);
  expect(unpack(controller).price).toEqual(new BigNumber(2));
  expect(unpack(controller).amount).toEqual(new BigNumber(3));
  expect(unpack(controller).total).toEqual(new BigNumber(6));

  change({ kind: FormChangeKind.kindChange, newKind: OfferType.sell });

  expect(unpack(controller).kind).toEqual(OfferType.sell);
  expect(unpack(controller).price).toEqual(new BigNumber(2));
  expect(unpack(controller).amount).toEqual(new BigNumber(3));
  expect(unpack(controller).total).toEqual(new BigNumber(6));

  expect(snapshotify(unpack(controller))).toMatchSnapshot();
});

test('set max when buy and nothing is filled', () => {
  const controller = createFormController$(defParams, { base: 'WETH', quote: 'DAI' });
  const { change } = unpack(controller);
  expect(unpack(controller).price).toBeUndefined();
  expect(unpack(controller).amount).toBeUndefined();
  expect(unpack(controller).total).toBeUndefined();

  change({ kind: FormChangeKind.setMaxChange });

  expect(unpack(controller).price).toBeUndefined();
  expect(unpack(controller).amount).toBeUndefined();
  expect(unpack(controller).total).toBeUndefined();
});

test('set max when buy and amount is filled', () => {
  const controller = createFormController$(defParams, { base: 'WETH', quote: 'DAI' });
  const { change } = unpack(controller);

  change({ kind: FormChangeKind.amountFieldChange, value: new BigNumber(2) });
  expect(unpack(controller).price).toBeUndefined();
  expect(unpack(controller).amount).toEqual(new BigNumber(2));
  expect(unpack(controller).total).toBeUndefined();

  change({ kind: FormChangeKind.setMaxChange });
  expect(unpack(controller).price).toBeUndefined();
  expect(unpack(controller).amount).toEqual(new BigNumber(2));
  expect(unpack(controller).total).toBeUndefined();
});

test('set max when buy and price is filled', () => {
  const controller = createFormController$(defParams, { base: 'WETH', quote: 'DAI' });
  const { change } = unpack(controller);

  change({ kind: FormChangeKind.priceFieldChange, value: new BigNumber(2) });
  expect(unpack(controller).price).toEqual(new BigNumber(2));
  expect(unpack(controller).amount).toBeUndefined();
  expect(unpack(controller).total).toBeUndefined();

  change({ kind: FormChangeKind.setMaxChange });
  expect(unpack(controller).price).toEqual(new BigNumber(2));
  expect(unpack(controller).amount).toEqual(new BigNumber(5));
  expect(unpack(controller).total).toEqual(new BigNumber(10));
});

test('set max when buy and amount and price is filled', () => {
  const controller = createFormController$(defParams, { base: 'WETH', quote: 'DAI' });
  const { change } = unpack(controller);

  change({ kind: FormChangeKind.priceFieldChange, value: new BigNumber(2) });
  change({ kind: FormChangeKind.amountFieldChange, value: new BigNumber(3) });
  expect(unpack(controller).price).toEqual(new BigNumber(2));
  expect(unpack(controller).amount).toEqual(new BigNumber(3));
  expect(unpack(controller).total).toEqual(new BigNumber(6));

  change({ kind: FormChangeKind.setMaxChange });
  expect(unpack(controller).price).toEqual(new BigNumber(2));
  expect(unpack(controller).amount).toEqual(new BigNumber(5));
  expect(unpack(controller).total).toEqual(new BigNumber(10));
});

test('set max when sell and nothing is filled', () => {
  const controller = createFormController$(defParams, { base: 'WETH', quote: 'DAI' });
  const { change } = unpack(controller);

  change({ kind: FormChangeKind.kindChange, newKind: OfferType.sell });
  expect(unpack(controller).price).toBeUndefined();
  expect(unpack(controller).amount).toBeUndefined();
  expect(unpack(controller).total).toBeUndefined();

  change({ kind: FormChangeKind.setMaxChange });
  expect(unpack(controller).price).toBeUndefined();
  expect(unpack(controller).amount).toEqual(new BigNumber(10));
  expect(unpack(controller).total).toBeUndefined();
});

test('set max when sell and amount and price is filled', () => {
  const controller = createFormController$(defParams, { base: 'WETH', quote: 'DAI' });
  const { change } = unpack(controller);

  change({ kind: FormChangeKind.kindChange, newKind: OfferType.sell });
  change({ kind: FormChangeKind.priceFieldChange, value: new BigNumber(2) });
  change({ kind: FormChangeKind.amountFieldChange, value: new BigNumber(3) });
  expect(unpack(controller).price).toEqual(new BigNumber(2));
  expect(unpack(controller).amount).toEqual(new BigNumber(3));
  expect(unpack(controller).total).toEqual(new BigNumber(6));

  change({ kind: FormChangeKind.setMaxChange });
  expect(unpack(controller).price).toEqual(new BigNumber(2));
  expect(unpack(controller).amount).toEqual(new BigNumber(10));
  expect(unpack(controller).total).toEqual(new BigNumber(20));
});

test('pick sell offer', () => {
  const controller = createFormController$(defParams, { base: 'WETH', quote: 'DAI' });
  const { change } = unpack(controller);
  const offer: Offer = {
    offerId: new BigNumber(1),
    baseAmount: new BigNumber(2),
    baseToken: 'WETH',
    quoteAmount: new BigNumber(6),
    quoteToken: 'DAI',
    price: new BigNumber(3),
    ownerId: '',
    timestamp: new Date(),
    type: OfferType.sell,
  };

  change({ offer, kind: FormChangeKind.pickOfferChange });

  expect(unpack(controller).price).toEqual(new BigNumber(3));
  expect(unpack(controller).amount).toEqual(new BigNumber(2));
  expect(unpack(controller).total).toEqual(new BigNumber(6));
  expect(unpack(controller).kind).toEqual(OfferType.buy);
  expect(unpack(controller).stage).toEqual(FormStage.readyToProceed);
});

test('pick buy offer', () => {
  const controller = createFormController$(defParams, { base: 'WETH', quote: 'DAI' });
  const { change } = unpack(controller);
  const offer: Offer = {
    offerId: new BigNumber(1),
    baseAmount: new BigNumber(2),
    baseToken: 'WETH',
    quoteAmount: new BigNumber(6),
    quoteToken: 'DAI',
    price: new BigNumber(3),
    ownerId: '',
    timestamp: new Date(),
    type: OfferType.buy,
  };

  change({ offer, kind: FormChangeKind.pickOfferChange });

  expect(unpack(controller).price).toEqual(new BigNumber(3));
  expect(unpack(controller).amount).toEqual(new BigNumber(2));
  expect(unpack(controller).total).toEqual(new BigNumber(6));
  expect(unpack(controller).kind).toEqual(OfferType.sell);
  expect(unpack(controller).stage).toEqual(FormStage.readyToProceed);
});

test('change match type', () => {
  const controller = createFormController$(defParams, { base: 'WETH', quote: 'DAI' });
  const { change } = unpack(controller);

  expect(unpack(controller).matchType).toEqual(OfferMatchType.limitOrder);

  change({ kind: FormChangeKind.matchTypeChange,
    matchType: OfferMatchType.direct });
  expect(unpack(controller).matchType).toEqual(OfferMatchType.direct);
});

test('estimation gas error', () => {
  const controller = createFormController$(
    {
      ...defParams,
      calls$: of({
        ...defaultCalls,
        offerMakeEstimateGas: () => throwError('test estimation gas error'),
      })
    },
    { base: 'WETH', quote: 'DAI' });
  const { change } = unpack(controller);

  expect(unpack(controller).gasEstimationStatus).toEqual(GasEstimationStatus.unset);

  change({ kind: FormChangeKind.priceFieldChange, value: new BigNumber(2) });
  change({ kind: FormChangeKind.amountFieldChange, value: new BigNumber(3) });
  expect(unpack(controller).total).toEqual(new BigNumber(6));
  expect(unpack(controller).gasEstimationStatus).toEqual(GasEstimationStatus.error);
});
//
// test('gas price error', () => {
//   const controller = createFormController$(
//     {
//       ...defParams,
//       gasPrice$: throwError('test gas price error')
//     },
//     { base: 'WETH', quote: 'DAI' });
//
//   console.warn(unpack(controller));
//
//   const { change } = unpack(controller);
//   expect(unpack(controller).gasPrice).toBeUndefined();
//
//   change({ kind: FormChangeKind.priceFieldChange, value: new BigNumber(2) });
//   change({ kind: FormChangeKind.amountFieldChange, value: new BigNumber(3) });
//   expect(unpack(controller).total).toEqual(new BigNumber(6));
//
//   expect(unpack(controller).gasEstimationEth).toBeUndefined();
//   // expect((unpack(controller).gasEstimationEth as BigNumber).toNumber()).toBeNaN();
// });
//
// test('allowance error', () => {
//   const controller = createFormController$(
//     {
//       ...defParams,
//       allowance$: () => throwError('test allowance error')
//     },
//     { base: 'WETH', quote: 'DAI' });
//
//   const { change } = unpack(controller);
//
//   expect(unpack(controller).messages).toEqual([]);
//   change({ kind: FormChangeKind.priceFieldChange, value: new BigNumber(2) });
//   expect(unpack(controller).messages).toEqual([]);
//   change({ kind: FormChangeKind.amountFieldChange, value: new BigNumber(3) });
//   expect(unpack(controller).messages).not.toEqual([]);
//
//   expect(unpack(controller).buyAllowance).toBeUndefined();
//   expect(unpack(controller).sellAllowance).toBeUndefined();
//   expect(unpack(controller).gasEstimationStatus).toEqual(GasEstimationStatus.unset);
//
//   expect(snapshotify(unpack(controller).messages)).toMatchSnapshot();
// });
//
// test('base allowance error', () => {
//   const controller = createFormController$(
//     {
//       ...defParams,
//       allowance$: (token) =>
//         token === 'DAI' ? of(true) : throwError('test base allowance error')
//     },
//     { base: 'WETH', quote: 'DAI' });
//
//   const { change } = unpack(controller);
//
//   expect(unpack(controller).messages).toEqual([]);
//   change({ kind: FormChangeKind.priceFieldChange, value: new BigNumber(2) });
//   expect(unpack(controller).messages).toEqual([]);
//   change({ kind: FormChangeKind.amountFieldChange, value: new BigNumber(3) });
//
//   expect(unpack(controller).buyAllowance).toBeUndefined();
//   expect(unpack(controller).sellAllowance).toBeTruthy();
//   expect(unpack(controller).gasEstimationStatus).toEqual(GasEstimationStatus.calculated);
//   expect(unpack(controller).messages).toEqual([]);
//
//   change({ kind: FormChangeKind.kindChange, newKind: OfferType.sell });
//
//   expect(unpack(controller).buyAllowance).toBeUndefined();
//   expect(unpack(controller).sellAllowance).toBeTruthy();
//   expect(unpack(controller).gasEstimationStatus).toEqual(GasEstimationStatus.unset);
//
//   expect(unpack(controller).messages).not.toEqual([]);
//   expect(snapshotify(unpack(controller).messages)).toMatchSnapshot();
//
// });
//
// test('min sell error', () => {
//   const controller = createFormController$(
//     {
//       ...defParams,
//       dustLimits$: throwError('test min sell error')
//     },
//     { base: 'WETH', quote: 'DAI' });
//
//   const { change } = unpack(controller);
//
//   change({ kind: FormChangeKind.priceFieldChange, value: new BigNumber(2) });
//   change({ kind: FormChangeKind.amountFieldChange, value: new BigNumber(0.00) });
//   expect(unpack(controller).total).toEqual(new BigNumber(0.00));
//
//   expect(unpack(controller).messages).toEqual([]);
// });
//
// test('current orderbook error', () => {
//   const controller = createFormController$(
//     {
//       ...defParams,
//       loadOrderbook: (_tp: TradingPair) => throwError('current orderbook')
//     },
//     { base: 'WETH', quote: 'DAI' });
//
//   const { change } = unpack(controller);
//
//   change({ kind: FormChangeKind.priceFieldChange, value: new BigNumber(2) });
//   change({ kind: FormChangeKind.amountFieldChange, value: new BigNumber(3) });
//   expect(unpack(controller).total).toEqual(new BigNumber(6));
//
//   expect(unpack(controller).position).toBeUndefined();
// });
