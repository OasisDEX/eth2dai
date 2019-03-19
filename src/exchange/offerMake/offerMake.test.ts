import { BigNumber } from 'bignumber.js';
import { omit } from 'lodash';
import { of } from 'rxjs';
import { throwError } from 'rxjs/internal/observable/throwError';

import { setupFakeWeb3ForTesting } from '../../blockchain/web3';
setupFakeWeb3ForTesting();

import { Calls$ } from '../../blockchain/calls/calls';
import { TxState, TxStatus } from '../../blockchain/transactions';
import { FormChangeKind, GasEstimationStatus, OfferMatchType } from '../../utils/form';
import { unpack } from '../../utils/testHelpers';
import { createFakeOrderbook, emptyOrderBook } from '../depthChart/fakeOrderBook';
import { Offer, OfferType } from '../orderbook/orderbook';
import { createFormController$, FormStage, MessageKind, OfferMakeChangeKind } from './offerMake';

function snapshotify(object: any): any {
  return omit(object, 'change');
}

const tradingPair = { base: 'WETH', quote: 'DAI' };

const defaultCalls = {
  offerMakeEstimateGas: () => of(20),
  offerMakeDirectEstimateGas: () => of(30),
} as any;

const defaultUser = {
  account: '0x1234',
};

const defParams = {
  gasPrice$: of(new BigNumber(0.01)),
  etherPriceUsd$: of(new BigNumber(1)),
  allowance$: () => of(true),
  balances$: of({ DAI: new BigNumber(10), WETH: new BigNumber(10) }),
  dustLimits$: of({ DAI: new BigNumber(0.1), WETH: new BigNumber(0.1) }),
  orderbook$: of(emptyOrderBook),
  calls$: of(defaultCalls) as Calls$,
  user$: of(defaultUser),
};

const controllerWithFakeOrderBook = (buys: any = [], sells: any = []) => {
  const orderbook = createFakeOrderbook(buys, sells);
  orderbook.buy.forEach((v, i) => v.offerId = new BigNumber(i + 1));
  orderbook.sell.forEach((v, i) => v.offerId = new BigNumber(i + 1));
  return createFormController$(
    {
      ...defParams,
      orderbook$: of(orderbook),
    },
    tradingPair
  );
};

test('initial state', done => {
  const controller = createFormController$(defParams, tradingPair);
  controller.subscribe(state => {
    expect(snapshotify(state)).toMatchSnapshot();
    done();
  });
});

test('set price and amount', () => {
  const controller = createFormController$(defParams, tradingPair);
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
    tradingPair
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
    buyToken: tradingPair.base,
    sellAmount: new BigNumber(6),
    sellToken: tradingPair.quote,
    matchType: OfferMatchType.limitOrder,
    kind: OfferType.buy,
    gasPrice: new BigNumber(0.01),
    position: undefined,
  });

  // sell
  expect(estimateGasMock.mock.calls[1][0]).toEqual({
    buyAmount: new BigNumber(6),
    buyToken: tradingPair.quote,
    sellAmount: new BigNumber(3),
    sellToken: tradingPair.base,
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
  const  controller = controllerWithFakeOrderBook(buys);
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
  const controller = controllerWithFakeOrderBook();
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

  const controller = controllerWithFakeOrderBook([], sells);
  const { change } = unpack(controller);

  change({ kind: FormChangeKind.kindChange, newKind: OfferType.sell });
  expect(unpack(controller).kind).toEqual(OfferType.sell);
  expect(unpack(controller).position).toEqual(new BigNumber(2));

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
    tradingPair);

  const { change } = unpack(controller);

  change({ kind: FormChangeKind.priceFieldChange, value: new BigNumber(2) });
  change({ kind: FormChangeKind.amountFieldChange, value: new BigNumber(3) });
  unpack(controller).submit(unpack(controller));
  expect(unpack(controller).stage).toEqual(FormStage.waitingForApproval);

  expect(offerMakeMock.mock.calls.length).toBe(1);
  expect(offerMakeMock.mock.calls[0][0]).toEqual({
    buyAmount: new BigNumber(3),
    buyToken: tradingPair.base,
    sellAmount: new BigNumber(6),
    sellToken: tradingPair.quote,
    matchType: OfferMatchType.limitOrder,
    kind: OfferType.buy,
    gasPrice: new BigNumber(0.01),
    position: undefined,
    gasEstimation: 20,
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
    tradingPair);

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
    buyToken: tradingPair.quote,
    sellAmount: new BigNumber(3),
    sellToken: tradingPair.base,
    matchType: OfferMatchType.limitOrder,
    kind: OfferType.sell,
    gasPrice: new BigNumber(0.01),
    position: undefined,
    gasEstimation: 20,
  });

});

test('click buy button confirmed', () => {
  const offerMakeMock = jest.fn(() => of(
    { status: TxStatus.WaitingForApproval } as TxState,
    { status: TxStatus.WaitingForConfirmation } as TxState
  )).mockName('offerMake');

  const controller = createFormController$(
    {
      ...defParams,
      calls$: of({
        ...defaultCalls,
        offerMake: offerMakeMock,
      }),
    },
    tradingPair);

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
    buyToken: tradingPair.base,
    sellAmount: new BigNumber(6),
    sellToken: tradingPair.quote,
    matchType: OfferMatchType.limitOrder,
    kind: OfferType.buy,
    gasPrice: new BigNumber(0.01),
    position: undefined,
    gasEstimation: 20,
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
    tradingPair);

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
    tradingPair);

  const { change } = unpack(controller);

  expect(unpack(controller).messages).toEqual([]);
  change({ kind: FormChangeKind.priceFieldChange, value: new BigNumber(2) });
  expect(unpack(controller).messages).toEqual([]);
  change({ kind: FormChangeKind.amountFieldChange, value: new BigNumber(3) });
  expect(unpack(controller).messages).not.toEqual([]);

  expect(snapshotify(unpack(controller).messages)).toMatchSnapshot();
});

test('validation - not enough money', () => {
  const controller = createFormController$(defParams, tradingPair);

  const { change } = unpack(controller);

  expect(unpack(controller).messages).toEqual([]);
  change({ kind: FormChangeKind.priceFieldChange, value: new BigNumber(2) });
  expect(unpack(controller).messages).toEqual([]);
  change({ kind: FormChangeKind.amountFieldChange, value: new BigNumber(13) });
  expect(unpack(controller).messages).not.toEqual([]);

  expect(snapshotify(unpack(controller).messages)).toMatchSnapshot();
});

test('validation - too small amount', () => {
  const controller = createFormController$(defParams, tradingPair);

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
    tradingPair);

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
    tradingPair);

  const { change } = unpack(controller);

  expect(unpack(controller).messages).toEqual([]);
  change({ kind: FormChangeKind.priceFieldChange, value: new BigNumber(2) });
  expect(unpack(controller).messages).toEqual([]);
  change({
    kind: FormChangeKind.amountFieldChange,
    value: new BigNumber(10000000000000000)
  });
  expect(unpack(controller).messages).not.toEqual([]);

  expect(snapshotify(unpack(controller).messages)).toMatchSnapshot();
});

test('validation - amount exceeds orderbook', () => {
  const controller = createFormController$(defParams, tradingPair);
  const { change } = unpack(controller);
  expect(unpack(controller).messages).toEqual([]);
  change({
    kind: FormChangeKind.matchTypeChange,
    matchType: OfferMatchType.direct,
  });
  change({
    kind: FormChangeKind.amountFieldChange,
    value: new BigNumber(1)
  });
  expect(unpack(controller).messages).not.toEqual([]);
  expect(snapshotify(unpack(controller).messages)).toMatchSnapshot();
});

test('init sell', () => {
  const controller = createFormController$(defParams, tradingPair);
  const { change } = unpack(controller);

  expect(unpack(controller).kind).toEqual(OfferType.buy);
  change({ kind: FormChangeKind.kindChange, newKind: OfferType.sell });
  expect(unpack(controller).kind).toEqual(OfferType.sell);
});

test('init buy after sell', () => {
  const controller = createFormController$(defParams, tradingPair);
  const { change } = unpack(controller);

  expect(unpack(controller).kind).toEqual(OfferType.buy);
  change({ kind: FormChangeKind.kindChange, newKind: OfferType.sell });
  expect(unpack(controller).kind).toEqual(OfferType.sell);
  change({ kind: FormChangeKind.kindChange, newKind: OfferType.buy });
  expect(unpack(controller).kind).toEqual(OfferType.buy);
});

test('set amount and price in sell', () => {
  const controller = createFormController$(defParams, tradingPair);
  const { change } = unpack(controller);

  expect(unpack(controller).kind).toEqual(OfferType.buy);
  change({ kind: FormChangeKind.kindChange, newKind: OfferType.sell });
  change({ kind: FormChangeKind.priceFieldChange, value: new BigNumber(2) });
  change({ kind: FormChangeKind.amountFieldChange, value: new BigNumber(3) });

  expect(snapshotify(unpack(controller))).toMatchSnapshot();
});

test('set amount and price in buy and change to sell', () => {
  const controller = createFormController$(defParams, tradingPair);
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
  const controller = createFormController$(defParams, tradingPair);
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
  const controller = createFormController$(defParams, tradingPair);
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
  const controller = createFormController$(defParams, tradingPair);
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
  const controller = createFormController$(defParams, tradingPair);
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
  const controller = createFormController$(defParams, tradingPair);
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
  const controller = createFormController$(defParams, tradingPair);
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
  const controller = createFormController$(defParams, tradingPair);
  const { change } = unpack(controller);
  const offer: Offer = {
    offerId: new BigNumber(1),
    baseAmount: new BigNumber(2),
    baseToken: tradingPair.base,
    quoteAmount: new BigNumber(6),
    quoteToken: tradingPair.quote,
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
  const controller = createFormController$(defParams, tradingPair);
  const { change } = unpack(controller);
  const offer: Offer = {
    offerId: new BigNumber(1),
    baseAmount: new BigNumber(2),
    baseToken: tradingPair.base,
    quoteAmount: new BigNumber(6),
    quoteToken: tradingPair.quote,
    price: new BigNumber(3),
    ownerId: '',
    timestamp: new Date(),
    type: OfferType.buy,
  };

  change({ offer, kind: FormChangeKind.pickOfferChange });

  expect(unpack(controller).price).toEqual(new BigNumber(3));
  expect(unpack(controller).amount).toEqual(new BigNumber(2));
  expect(unpack(controller).total).toEqual(new BigNumber(6));
  expect(unpack(controller).kind).toEqual(OfferType.buy);
  expect(unpack(controller).stage).toEqual(FormStage.readyToProceed);
});

test('change match type', () => {
  const controller = createFormController$(defParams, tradingPair);
  const { change } = unpack(controller);

  expect(unpack(controller).matchType).toEqual(OfferMatchType.limitOrder);

  change({
    kind: FormChangeKind.matchTypeChange,
    matchType: OfferMatchType.direct
  });
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
    tradingPair);
  const { change } = unpack(controller);

  expect(unpack(controller).gasEstimationStatus).toEqual(GasEstimationStatus.unset);

  change({ kind: FormChangeKind.priceFieldChange, value: new BigNumber(2) });
  change({ kind: FormChangeKind.amountFieldChange, value: new BigNumber(3) });
  expect(unpack(controller).total).toEqual(new BigNumber(6));
  expect(unpack(controller).gasEstimationStatus).toEqual(GasEstimationStatus.error);
});

// FOK order
test('switch from direct to limit order', () => {
  const controller = createFormController$(defParams, tradingPair);
  const { change } = unpack(controller);

  expect(unpack(controller).matchType).toEqual(OfferMatchType.limitOrder);

  change({ kind:  FormChangeKind.matchTypeChange, matchType: OfferMatchType.direct });
  expect(unpack(controller).matchType).toEqual(OfferMatchType.direct);

  change({ kind:  FormChangeKind.matchTypeChange, matchType: OfferMatchType.limitOrder });
  expect(unpack(controller).matchType).toEqual(OfferMatchType.limitOrder);
});

test('open offer type picker and close it', () => {
  const controller = createFormController$(defParams, tradingPair);
  const { change } = unpack(controller);

  expect(unpack(controller).pickerOpen).toBeFalsy();

  change({ kind:  OfferMakeChangeKind.pickerOpenChange });
  expect(unpack(controller).pickerOpen).toBeTruthy();

  change({ kind:  OfferMakeChangeKind.pickerOpenChange });
  expect(unpack(controller).pickerOpen).toBeFalsy();
});

test('place direct buy order', () => {
  const sells = [
    { price: 3, amount: 3 }, // 4
    { price: 4, amount: 4 }, // 5
  ];

  const controller = controllerWithFakeOrderBook([], sells);
  const { change } = unpack(controller);

  change({
    kind: FormChangeKind.matchTypeChange,
    matchType: OfferMatchType.direct,
  });

  expect(unpack(controller).amount).toEqual(undefined);
  expect(unpack(controller).price).toEqual(undefined);
  expect(unpack(controller).total).toEqual(undefined);
  expect(unpack(controller).slippageLimit).toEqual(new BigNumber(5));
  expect(unpack(controller).gasEstimationStatus).toEqual(GasEstimationStatus.unset);

  change({
    kind: FormChangeKind.amountFieldChange,
    value: new BigNumber(2),
  });

  expect(unpack(controller).amount).toEqual(new BigNumber(2));
  expect(unpack(controller).price).toEqual(new BigNumber(3));
  expect(unpack(controller).total).toEqual(new BigNumber(6));
  expect(unpack(controller).slippageLimit).toEqual(new BigNumber(5));
  expect(unpack(controller).gasEstimationStatus).toEqual(GasEstimationStatus.calculated);
});

test('place direct buy order that matches more than one order', () => {
  const sells = [
    { price: 3, amount: 1 }, // 4
    { price: 4, amount: 1 }, // 5
  ];

  const controller = controllerWithFakeOrderBook([], sells);
  const { change } = unpack(controller);

  change({
    kind: FormChangeKind.matchTypeChange,
    matchType: OfferMatchType.direct,
  });

  change({
    kind: FormChangeKind.amountFieldChange,
    value: new BigNumber(2),
  });

  expect(unpack(controller).amount).toEqual(new BigNumber(2));
  expect(unpack(controller).price).toEqual(new BigNumber(3.5));
  expect(unpack(controller).total).toEqual(new BigNumber(7));
  expect(unpack(controller).gasEstimationStatus).toEqual(GasEstimationStatus.calculated);
});

test('place direct buy order that exceeds the order book side', () => {
  const controller = createFormController$(defParams, tradingPair);
  const { change } = unpack(controller);

  change({
    kind: FormChangeKind.matchTypeChange,
    matchType: OfferMatchType.direct,
  });

  change({
    kind: FormChangeKind.amountFieldChange,
    value: new BigNumber(2),
  });

  expect(unpack(controller).amount).toEqual(new BigNumber(2));
  expect(unpack(controller).price).toEqual(undefined);
  expect(unpack(controller).total).toEqual(undefined);
  expect(unpack(controller).gasEstimationStatus).toEqual(GasEstimationStatus.unset);
});

test('place direct buy order that exceeds the balance', () => {
  const sells = [
    { price: 3, amount: 3 }, // 4
    { price: 4, amount: 4 }, // 5
  ];

  const controller = controllerWithFakeOrderBook([], sells);
  const { change } = unpack(controller);

  change({
    kind: FormChangeKind.matchTypeChange,
    matchType: OfferMatchType.direct,
  });

  change({
    kind: FormChangeKind.amountFieldChange,
    value: new BigNumber(5),
  });

  expect(unpack(controller).amount).toEqual(new BigNumber(5));
  expect(unpack(controller).price).toEqual(new BigNumber(3.4));
  expect(unpack(controller).total).toEqual(new BigNumber(17));
  expect(unpack(controller).messages.length).toBe(1);
  expect(unpack(controller).messages[0].kind).toBe(MessageKind.insufficientAmount);
  expect(unpack(controller).gasEstimationStatus).toEqual(GasEstimationStatus.unset);
});

test('place direct buy order and calculate price impact', () => {
  const sells = [
    { price: 3, amount: 0.5 }, // 4
    { price: 4, amount: 0.5 }, // 5
  ];

  const controller = controllerWithFakeOrderBook([], sells);
  const { change } = unpack(controller);

  change({
    kind: FormChangeKind.matchTypeChange,
    matchType: OfferMatchType.direct,
  });

  change({
    kind: FormChangeKind.amountFieldChange,
    value: new BigNumber(1),
  });

  expect(unpack(controller).amount).toEqual(new BigNumber(1));
  expect(unpack(controller).price).toEqual(new BigNumber(3.5));
  expect(unpack(controller).total).toEqual(new BigNumber(3.5));
  expect(unpack(controller).priceImpact).toEqual(new BigNumber('16.666666666666666667'));
  expect(unpack(controller).gasEstimationStatus).toEqual(GasEstimationStatus.calculated);
});

test('place direct buy order below dust limit', () => {
  const sells = [
    { price: 3, amount: 0.5 }, // 4
    { price: 4, amount: 0.5 }, // 5
  ];
  const controller = controllerWithFakeOrderBook([], sells);
  const { change } = unpack(controller);

  change({
    kind: FormChangeKind.matchTypeChange,
    matchType: OfferMatchType.direct,
  });

  change({
    kind: FormChangeKind.amountFieldChange,
    value: new BigNumber(0.01),
  });

  expect(unpack(controller).amount).toEqual(new BigNumber(0.01));
  expect(unpack(controller).price).toEqual(new BigNumber(3));
  expect(unpack(controller).total).toEqual(new BigNumber(0.03));
  expect(unpack(controller).messages.length).toBe(1);
  expect(unpack(controller).messages[0].kind).toBe(MessageKind.dustAmount);
  expect(unpack(controller).gasEstimationStatus).toEqual(GasEstimationStatus.unset);
});

test('setting slippage limit', () => {
  const controller = createFormController$(defParams, tradingPair);
  const { change } = unpack(controller);

  expect(unpack(controller).slippageLimit).toEqual(new BigNumber(5));

  change({
    kind: OfferMakeChangeKind.slippageLimitChange,
    value: new BigNumber(10),
  });

  expect(unpack(controller).slippageLimit).toEqual(new BigNumber(10));
});

test('place direct buy order without slippage limit', () => {
  const sells = [
    { price: 3, amount: 0.5 }, // 4
    { price: 4, amount: 0.5 }, // 5
  ];

  const controller = controllerWithFakeOrderBook([], sells);
  const { change } = unpack(controller);

  change({
    kind: FormChangeKind.matchTypeChange,
    matchType: OfferMatchType.direct,
  });

  change({
    kind: FormChangeKind.amountFieldChange,
    value: new BigNumber(1),
  });
  change({
    kind: OfferMakeChangeKind.slippageLimitChange,
  });

  expect(unpack(controller).messages.length).toEqual(1);
  expect(unpack(controller).messages[0].kind).toEqual(MessageKind.slippageLimitNotSet);
  expect(unpack(controller).slippageLimit).toEqual(undefined);
  expect(unpack(controller).gasEstimationStatus).toEqual(GasEstimationStatus.unset);
});

test('place direct buy order with slippage limit too low', () => {
  const sells = [
    { price: 3, amount: 0.5 }, // 4
    { price: 4, amount: 0.5 }, // 5
  ];

  const controller = controllerWithFakeOrderBook([], sells);
  const { change } = unpack(controller);

  change({
    kind: FormChangeKind.matchTypeChange,
    matchType: OfferMatchType.direct,
  });

  change({
    kind: FormChangeKind.amountFieldChange,
    value: new BigNumber(1),
  });
  change({
    kind: OfferMakeChangeKind.slippageLimitChange,
    value: new BigNumber(-1),
  });

  expect(unpack(controller).messages.length).toEqual(1);
  expect(unpack(controller).messages[0].kind).toEqual(MessageKind.slippageLimitToLow);
  expect(unpack(controller).slippageLimit).toEqual(new BigNumber(-1));
  expect(unpack(controller).gasEstimationStatus).toEqual(GasEstimationStatus.unset);
});

test('place direct buy order with slippage limit too high', () => {
  const sells = [
    { price: 3, amount: 0.5 }, // 4
    { price: 4, amount: 0.5 }, // 5
  ];

  const controller = controllerWithFakeOrderBook([], sells);
  const { change } = unpack(controller);

  change({
    kind: FormChangeKind.matchTypeChange,
    matchType: OfferMatchType.direct,
  });

  change({
    kind: FormChangeKind.amountFieldChange,
    value: new BigNumber(1),
  });
  change({
    kind: OfferMakeChangeKind.slippageLimitChange,
    value: new BigNumber(25),
  });

  expect(unpack(controller).messages.length).toEqual(1);
  expect(unpack(controller).messages[0].kind).toEqual(MessageKind.slippageLimitToHigh);
  expect(unpack(controller).slippageLimit).toEqual(new BigNumber(25));
  expect(unpack(controller).gasEstimationStatus).toEqual(GasEstimationStatus.unset);
});

test('place direct sell order', () => {
  const buys = [
    { price: 3, amount: 3 }, // 4
    { price: 4, amount: 4 }, // 5
  ];

  const controller = controllerWithFakeOrderBook(buys);
  const { change } = unpack(controller);

  change({
    kind: FormChangeKind.kindChange,
    newKind: OfferType.sell,
  });

  change({
    kind: FormChangeKind.matchTypeChange,
    matchType: OfferMatchType.direct,
  });

  expect(unpack(controller).amount).toEqual(undefined);
  expect(unpack(controller).price).toEqual(undefined);
  expect(unpack(controller).total).toEqual(undefined);
  expect(unpack(controller).slippageLimit).toEqual(new BigNumber(5));
  expect(unpack(controller).gasEstimationStatus).toEqual(GasEstimationStatus.unset);

  change({
    kind: FormChangeKind.amountFieldChange,
    value: new BigNumber(2),
  });

  expect(unpack(controller).amount).toEqual(new BigNumber(2));
  expect(unpack(controller).price).toEqual(new BigNumber(3));
  expect(unpack(controller).total).toEqual(new BigNumber(6));
  expect(unpack(controller).slippageLimit).toEqual(new BigNumber(5));
  expect(unpack(controller).gasEstimationStatus).toEqual(GasEstimationStatus.calculated);
});

test('place direct sell order using all of your balance', () => {
  const buys = [
    { price: 2, amount: 10 },
  ];

  const controller = controllerWithFakeOrderBook(buys);
  const { change } = unpack(controller);

  change({
    kind: FormChangeKind.kindChange,
    newKind: OfferType.sell,
  });

  change({
    kind: FormChangeKind.matchTypeChange,
    matchType: OfferMatchType.direct,
  });

  expect(unpack(controller).amount).toEqual(undefined);
  expect(unpack(controller).price).toEqual(undefined);
  expect(unpack(controller).total).toEqual(undefined);
  expect(unpack(controller).slippageLimit).toEqual(new BigNumber(5));
  expect(unpack(controller).gasEstimationStatus).toEqual(GasEstimationStatus.unset);

  change({ kind: FormChangeKind.setMaxChange });

  expect(unpack(controller).amount).toEqual(new BigNumber(10));
  expect(unpack(controller).price).toEqual(new BigNumber(2));
  expect(unpack(controller).total).toEqual(new BigNumber(20));
  expect(unpack(controller).gasEstimationStatus).toEqual(GasEstimationStatus.calculated);
});

test('place direct sell order using all of the balance which is zero', () => {
  const newDefParams = {
    ...defParams,
    balances$: of({ DAI: new BigNumber(10), WETH: new BigNumber(0) }),
  };

  const controller = createFormController$(newDefParams, tradingPair);
  const { change } = unpack(controller);

  change({
    kind: FormChangeKind.kindChange,
    newKind: OfferType.sell,
  });

  change({
    kind: FormChangeKind.matchTypeChange,
    matchType: OfferMatchType.direct,
  });

  expect(unpack(controller).amount).toEqual(undefined);
  expect(unpack(controller).price).toEqual(undefined);
  expect(unpack(controller).total).toEqual(undefined);
  expect(unpack(controller).slippageLimit).toEqual(new BigNumber(5));
  expect(unpack(controller).gasEstimationStatus).toEqual(GasEstimationStatus.unset);

  change({ kind: FormChangeKind.setMaxChange });

  expect(unpack(controller).amount).toEqual(new BigNumber(0));
  expect(unpack(controller).price).toEqual(undefined);
  expect(unpack(controller).total).toEqual(new BigNumber(0));
  expect(unpack(controller).gasEstimationStatus).toEqual(GasEstimationStatus.unset);
});

test('place direct sell order that matches more than one order', () => {
  const buys = [
    { price: 3, amount: 1 }, // 4
    { price: 4, amount: 1 }, // 5
  ];

  const controller = controllerWithFakeOrderBook(buys);
  const { change } = unpack(controller);

  change({
    kind: FormChangeKind.kindChange,
    newKind: OfferType.sell,
  });

  change({
    kind: FormChangeKind.matchTypeChange,
    matchType: OfferMatchType.direct,
  });

  change({
    kind: FormChangeKind.amountFieldChange,
    value: new BigNumber(2),
  });

  expect(unpack(controller).amount).toEqual(new BigNumber(2));
  expect(unpack(controller).price).toEqual(new BigNumber(3.5));
  expect(unpack(controller).total).toEqual(new BigNumber(7));
  expect(unpack(controller).gasEstimationStatus).toEqual(GasEstimationStatus.calculated);
});

test('place direct sell order that exceeds the order book side', () => {
  const controller = createFormController$(defParams, tradingPair);
  const { change } = unpack(controller);

  change({
    kind: FormChangeKind.kindChange,
    newKind: OfferType.sell,
  });

  change({
    kind: FormChangeKind.matchTypeChange,
    matchType: OfferMatchType.direct,
  });

  change({
    kind: FormChangeKind.amountFieldChange,
    value: new BigNumber(2),
  });

  expect(unpack(controller).amount).toEqual(new BigNumber(2));
  expect(unpack(controller).price).toEqual(undefined);
  expect(unpack(controller).total).toEqual(undefined);
  expect(unpack(controller).gasEstimationStatus).toEqual(GasEstimationStatus.unset);
});

test('place direct sell order that exceeds the balance', () => {
  const buys = [
    { price: 0.2, amount: 10 }, // 4
    { price: 0.1, amount: 10 }, // 5
  ];

  const controller = controllerWithFakeOrderBook(buys);
  const { change } = unpack(controller);

  change({
    kind: FormChangeKind.kindChange,
    newKind: OfferType.sell,
  });

  change({
    kind: FormChangeKind.matchTypeChange,
    matchType: OfferMatchType.direct,
  });

  change({
    kind: FormChangeKind.amountFieldChange,
    value: new BigNumber(12),
  });

  expect(unpack(controller).amount).toEqual(new BigNumber(12));
  expect(unpack(controller).price).toEqual(new BigNumber('0.18333333333333333333'));
  expect(unpack(controller).total).toEqual(new BigNumber('2.2'));
  expect(unpack(controller).messages.length).toBe(1);
  expect(unpack(controller).messages[0].kind).toBe(MessageKind.insufficientAmount);
  expect(unpack(controller).gasEstimationStatus).toEqual(GasEstimationStatus.unset);
});

test('place direct sell order and calculate price impact', () => {
  const buys = [
    { price: 3, amount: 0.5 }, // 4
    { price: 4, amount: 0.5 }, // 5
  ];

  const controller = controllerWithFakeOrderBook(buys);
  const { change } = unpack(controller);

  change({
    kind: FormChangeKind.kindChange,
    newKind: OfferType.sell,
  });

  change({
    kind: FormChangeKind.matchTypeChange,
    matchType: OfferMatchType.direct,
  });

  change({
    kind: FormChangeKind.amountFieldChange,
    value: new BigNumber(1),
  });

  expect(unpack(controller).amount).toEqual(new BigNumber(1));
  expect(unpack(controller).price).toEqual(new BigNumber(3.5));
  expect(unpack(controller).total).toEqual(new BigNumber(3.5));
  expect(unpack(controller).priceImpact).toEqual(new BigNumber('16.666666666666666667'));
  expect(unpack(controller).gasEstimationStatus).toEqual(GasEstimationStatus.calculated);
});

test('place direct sell order below dust limit', () => {
  const buys = [
    { price: 3, amount: 0.5 }, // 4
    { price: 4, amount: 0.5 }, // 5
  ];

  const controller = controllerWithFakeOrderBook(buys);
  const { change } = unpack(controller);

  change({
    kind: FormChangeKind.kindChange,
    newKind: OfferType.sell,
  });

  change({
    kind: FormChangeKind.matchTypeChange,
    matchType: OfferMatchType.direct,
  });

  change({
    kind: FormChangeKind.amountFieldChange,
    value: new BigNumber(0.01),
  });

  expect(unpack(controller).amount).toEqual(new BigNumber(0.01));
  expect(unpack(controller).price).toEqual(new BigNumber(3));
  expect(unpack(controller).total).toEqual(new BigNumber(0.03));
  expect(unpack(controller).messages.length).toBe(1);
  expect(unpack(controller).messages[0].kind).toBe(MessageKind.dustAmount);
  expect(unpack(controller).gasEstimationStatus).toEqual(GasEstimationStatus.unset);
});

test('place direct sell order with slippage limit too high', () => {
  const buys = [
    { price: 3, amount: 0.5 }, // 4
    { price: 4, amount: 0.5 }, // 5
  ];

  const controller = controllerWithFakeOrderBook(buys);
  const { change } = unpack(controller);

  change({
    kind: FormChangeKind.matchTypeChange,
    matchType: OfferMatchType.direct,
  });

  change({
    kind: FormChangeKind.kindChange,
    newKind: OfferType.sell,
  });

  change({
    kind: FormChangeKind.amountFieldChange,
    value: new BigNumber(1),
  });
  change({
    kind: OfferMakeChangeKind.slippageLimitChange,
    value: new BigNumber(25),
  });

  expect(unpack(controller).messages.length).toEqual(1);
  expect(unpack(controller).messages[0].kind).toEqual(MessageKind.slippageLimitToHigh);
  expect(unpack(controller).slippageLimit).toEqual(new BigNumber(25));
  expect(unpack(controller).gasEstimationStatus).toEqual(GasEstimationStatus.unset);
});
