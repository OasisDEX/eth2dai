import { BigNumber } from 'bignumber.js';
import { of } from 'rxjs/index';
import { EnhancedOrderbook, Offer, OfferType, Orderbook } from '../orderbook/orderbook';
import { currentTradingPair$, loadablifyPlusTradingPair } from '../tradingPair/tradingPair';

const buy = [
  { price: 256.12524, amount: 123.45522838748731 },
  { price: 255, amount: 8.6 },
  { price: 254.66206, amount: 124.16454967811067 },
  { price: 253.356, amount: 124.80462274428078 },
  { price: 252.5, amount: 0.51 },
  { price: 252.04994, amount: 125.44470515143105 },
  { price: 252, amount: 5.619047619047619 },
  { price: 250.68758, amount: 126.13309362992774 },
  { price: 250, amount: 3.8769946798245867 },
  { price: 249.54022, amount: 80.14740068755249 },
  { price: 248.33068, amount: 127.3302195282516 },
  { price: 247.64592204, amount: 187.7680828214457 },
  { price: 246.63326, amount: 81.09206357650221 },
  { price: 246.29124, amount: 128.38459053598496 },
  { price: 245.00001, amount: 81.6326497292796 },
  { price: 245, amount: 14.571428571428571 },
  { price: 243.82703, amount: 41.01268017741921 },
  { price: 243.01082, amount: 130.11766307360307 },
  { price: 240.00001, amount: 83.33332986111125 },
  { price: 240, amount: 75 },
  { price: 235, amount: 0.8542192765957447 },
  { price: 230, amount: 67.4 },
  { price: 226, amount: 186 },
  { price: 225, amount: 15.866666666666667 },
  { price: 220, amount: 100 },
];

const sell = [
  { price: 263.005524, amount: 50 },
  { price: 263.986345, amount: 34 },
  { price: 265.69218, amount: 34 },
  { price: 265.91, amount: 30 },
  { price: 267.30049, amount: 34 },
  { price: 268.637655, amount: 34 },
  { price: 271.3971, amount: 34 },
  { price: 279.9, amount: 5 },
  { price: 280, amount: 62.2 },
  { price: 285, amount: 3 },
  { price: 286, amount: 2.7475524475524478 },
  { price: 290.9, amount: 1.1596653595529443 },
  { price: 294, amount: 0.003368945318695426 },
  { price: 295.6, amount: 0.5838288745044431 },
  { price: 299, amount: 0.1 },
  { price: 305, amount: 0.43446 },
  { price: 310, amount: 10 },
  { price: 313, amount: 2 },
  { price: 315, amount: 20 },
  { price: 320, amount: 20 }

  // { price: 255, amount: 2.65 },
  // { price: 5, amount: 11 },
  // { price: 1, amount: 28 },
  // { price: 0.1111111111111111, amount: 13.268 },
  // { price: 0.111, amount: 14.86109763945268 },
  // { price: 0.001, amount: 1.80740079125783 }
];

function priceAmountToOffer({ price, amount }: { price: number, amount: number }): Offer {
  return {
    offerId: new BigNumber(0),
    baseAmount: new BigNumber(amount),
    baseToken: '',
    quoteAmount: new BigNumber(amount * price),
    quoteToken: '',
    price: new BigNumber(price),
    ownerId: '',
    timestamp: new Date(),
    type: OfferType.buy
  };
}

export const createFakeOrderbook = (buys: any, sells: any): EnhancedOrderbook => {
  return {
    sell: sells.map(priceAmountToOffer),
    spread: buys.length > 0 && sells.length > 0 ?
      new BigNumber(sells[0].price - buys[buys.length - 1].price) : undefined,
    buy: buys.map(priceAmountToOffer),
    blockNumber: 1
  } as EnhancedOrderbook;
};

export const fakeOrderBook: EnhancedOrderbook = createFakeOrderbook(buy, sell);
export const emptyOrderBook: Orderbook = createFakeOrderbook([], []);

export const fakeOrderbookWithOutliers = createFakeOrderbook(
  buy.concat([{ price: 0.0001, amount: 5.80 }]),
  sell.concat([{ price: 9999, amount: 1.80 }])
);

export const fakeOrderBook$ = loadablifyPlusTradingPair(
  currentTradingPair$,
  () => of(fakeOrderBook)
);
