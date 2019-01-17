import { setupFakeWeb3ForTesting } from '../../blockchain/web3';

setupFakeWeb3ForTesting();

import { BigNumber } from 'bignumber.js';
import { OfferMatchType } from '../../utils/form';
import { OfferType } from '../orderbook/orderbook';
import * as dc from './depthchart';
import { createFakeOrderbook } from './fakeOrderBook';

const buy = [
  { price: 120, amount: 5 },
  { price: 110, amount: 9 },
  { price: 100, amount: 17 },
];

const sell = [
  { price: 140, amount: 7 },
  { price: 142, amount: 8 },
  { price: 150, amount: 11 },
  { price: 160, amount: 1 },
];

const sellsBefore = [
  { price: 140, volume: 7 },
  { price: 142, volume: 15 },
  { price: 150, volume: 26 },
  { price: 160, volume: 27 },
  { price: 166, volume: 27 } // extender and centralizer
];

const buysBefore = [
  { price: 120, volume: 5 },
  { price: 110, volume: 14 },
  { price: 100, volume: 31 },
  { price: 94, volume: 31 }, // extender and centralizer
];

export const fakeOrderbook = createFakeOrderbook(buy, sell);

test('0.1. Default - base data when no price nor amount given', () => {
  const dcd = dc.getDepthChartData(fakeOrderbook.buy,
                                   fakeOrderbook.sell, OfferType.sell,
                                   OfferMatchType.limitOrder);
  expect(dcd.buysAfter).toBeUndefined();
  expect(dcd.buysExtra).toBeUndefined();
  expect(dcd.sellsAfter).toBeUndefined();
  expect(dcd.sellsExtra).toBeUndefined();
  expect(dcd.summary).toBeUndefined();
  expect(dcd.buysBefore).toEqual(buysBefore);
  expect(dcd.sellsBefore).toEqual(sellsBefore);

  expect(dcd.minPrice).toEqual(94);
  expect(dcd.maxPrice).toEqual(166);
  expect(dcd.minVolume).toEqual(5);
  expect(dcd.maxVolume).toEqual(31);
});

test('0.2. Default - base data very asymmetric', () => {
  const lowBuy = [
    { price: 10, amount: 4 },
    { price: 5, amount: 9 },
    { price: 1, amount: 19 },
  ];
  const asymmetricOrderbook = createFakeOrderbook(lowBuy, sell);
  // mid value = 75 (65/65)
  // ext = 15.9
  // -14.9 do 175.9, do mid value mają 75+14.9=89.9 oraz 100.9
  // więc powinni mieć 100.9 więc rozszerzamy do 75-100.9 = -25.9
  const dcd = dc.getDepthChartData(asymmetricOrderbook.buy,
                                   asymmetricOrderbook.sell, OfferType.sell,
                                   OfferMatchType.limitOrder);
  expect(dcd.buysAfter).toBeUndefined();
  expect(dcd.buysExtra).toBeUndefined();
  expect(dcd.sellsAfter).toBeUndefined();
  expect(dcd.sellsExtra).toBeUndefined();
  expect(dcd.summary).toBeUndefined();
  expect(dcd.buysBefore).toEqual([
    { price: 10, volume: 4 },
    { price: 5, volume: 13 },
    { price: 1, volume: 32 },
    { price: 0, volume: 32 },
  ]);
  expect(dcd.sellsBefore).toEqual([
    { price: 140, volume: 7 },
    { price: 142, volume: 15 },
    { price: 150, volume: 26 },
    { price: 160, volume: 27 },
    { price: 175.9, volume: 27 }
  ]);

  expect(dcd.minPrice).toBeCloseTo(-25.9, 5);
  expect(dcd.maxPrice).toBeCloseTo(175.9, 5);
  expect(dcd.minVolume).toEqual(4);
  expect(dcd.maxVolume).toEqual(32);
});

test('0.3. Default - base data with empty buy', () => {
  const asymmetricOrderbook = createFakeOrderbook([], sell);
  const dcd = dc.getDepthChartData(asymmetricOrderbook.buy,
                                   asymmetricOrderbook.sell, OfferType.sell,
                                   OfferMatchType.limitOrder);
  expect(dcd.buysAfter).toBeUndefined();
  expect(dcd.buysExtra).toBeUndefined();
  expect(dcd.sellsAfter).toBeUndefined();
  expect(dcd.sellsExtra).toBeUndefined();
  expect(dcd.summary).toBeUndefined();
  expect(dcd.buysBefore).toEqual([]);
  expect(dcd.sellsBefore).toEqual([
    { price: 140, volume: 7 },
    { price: 142, volume: 15 },
    { price: 150, volume: 26 },
    { price: 160, volume: 27 },
    { price: 162, volume: 27 }
  ]);

  expect(dcd.minPrice).toBeCloseTo(138);
  expect(dcd.maxPrice).toBeCloseTo(162);
  expect(dcd.minVolume).toEqual(7);
  expect(dcd.maxVolume).toEqual(27);
});

test('0.4. Default - base data with empty buy and sell', () => {
  const asymmetricOrderbook = createFakeOrderbook([], []);
  const dcd = dc.getDepthChartData(asymmetricOrderbook.buy,
                                   asymmetricOrderbook.sell, OfferType.sell,
                                   OfferMatchType.limitOrder);
  expect(dcd.buysAfter).toBeUndefined();
  expect(dcd.buysExtra).toBeUndefined();
  expect(dcd.sellsAfter).toBeUndefined();
  expect(dcd.sellsExtra).toBeUndefined();
  expect(dcd.summary).toBeUndefined();
  expect(dcd.buysBefore).toEqual([]);
  expect(dcd.sellsBefore).toEqual([]);

  expect(dcd.minPrice).toBeCloseTo(1);
  expect(dcd.maxPrice).toBeCloseTo(109);
  expect(dcd.minVolume).toEqual(0);
  expect(dcd.maxVolume).toEqual(100);
});

// Buy with a price lower than anyone, none order matches sell book
test('1.1. Buy with price lower than anyone. Max price 10, amount 99', () => {
  const dcd = dc.getDepthChartData(fakeOrderbook.buy,
                                   fakeOrderbook.sell, OfferType.buy,
                                   OfferMatchType.limitOrder,
                                   new BigNumber(99),
                                   new BigNumber(10));
  expect(dcd.buysBefore).toEqual([
    { price: 120, volume: 5 },
    { price: 110, volume: 14 },
    { price: 100, volume: 31 },
    { price: 0, volume: 31 }, // extender and centralizer
  ]);
  expect(dcd.buysAfter).toEqual([
    { price: 120, volume: 5 },
    { price: 110, volume: 14 },
    { price: 100, volume: 31 },
    { price: 10, volume: 31 + 99 },
    { price: 0, volume: 31 + 99 }, // extender and centralizer
  ]);
  expect(dcd.buysExtra).toEqual([
    { price: 10, volume: 99 },
    { price: 0, volume: 99 } // extender and centralizer
  ]);
  expect(dcd.sellsBefore).toEqual([
    { price: 140, volume: 7 },
    { price: 142, volume: 15 },
    { price: 150, volume: 26 },
    { price: 160, volume: 27 },
    { price: 265, volume: 27 } // extender and centralizer
  ]);
  expect(dcd.sellsAfter).toEqual([
    { price: 140, volume: 7 },
    { price: 142, volume: 15 },
    { price: 150, volume: 26 },
    { price: 160, volume: 27 },
    { price: 265, volume: 27 } // extender and centralizer
  ]);
  expect(dcd.sellsExtra).toBeUndefined();

  expect(dcd.minPrice).toEqual(-5);
  expect(dcd.maxPrice).toEqual(265);
  expect(dcd.minVolume).toEqual(5);
  expect(dcd.maxVolume).toEqual(31 + 99);

  expect(dcd.summary).toEqual({
    price: 10,
    currentForSale: { amount: 0, totalCost: 0 },
    currentWanted: { amount: 31, totalCost: 120 * 5 + 110 * 9 + 100 * 17 },
    afterOrderForSale: { amount: 0, totalCost: 0 },
    afterOrderWanted: { amount: 99 + 31, totalCost: 990 + 120 * 5 + 110 * 9 + 100 * 17 },
  });
});

// Buy with price a bit smaller than current best buy offers, price matches orderbook offer
test('1.2. Buy a bit, with price smaller than best. Max price 110, amount 7', () => {
  const dcd = dc.getDepthChartData(fakeOrderbook.buy,
                                   fakeOrderbook.sell, OfferType.buy,
                                   OfferMatchType.limitOrder,
                                   new BigNumber(7),
                                   new BigNumber(110));
  expect(dcd.buysBefore).toEqual(buysBefore);
  expect(dcd.buysAfter).toEqual([
    { price: 120, volume: 5 },
    { price: 110, volume: 14 + 7 },
    { price: 100, volume: 31 + 7 },
    { price: 94, volume: 31 + 7 }, // extender and centralizer
  ]);
  expect(dcd.buysExtra).toEqual([
    { price: 110, volume: 7 },
    { price: 100, volume: 7 },
    { price: 94, volume: 7 } // extender and centralizer
  ]);
  expect(dcd.sellsBefore).toEqual(sellsBefore);
  expect(dcd.sellsAfter).toEqual(sellsBefore);
  expect(dcd.sellsExtra).toBeUndefined();

  expect(dcd.minPrice).toEqual(94);
  expect(dcd.maxPrice).toEqual(166);
  expect(dcd.minVolume).toEqual(5);
  expect(dcd.maxVolume).toEqual(31 + 7);

  expect(dcd.summary).toEqual({
    price: 110,
    currentForSale: { amount: 0, totalCost: 0 },
    currentWanted: { amount: 9 + 5, totalCost: 9 * 110 + 5 * 120 },
    afterOrderForSale: { amount: 0, totalCost: 0 },
    afterOrderWanted: { amount: 9 + 5 + 7, totalCost: 16 * 110 + 5 * 120 },
  });
});

// Buy with price a bit smaller than current best buy offers, price not matches orderbook offer
test('1.3. Buy a bit, with price smaller than best. Max price 109, amount 7', () => {
  const dcd = dc.getDepthChartData(fakeOrderbook.buy,
                                   fakeOrderbook.sell, OfferType.buy,
                                   OfferMatchType.limitOrder,
                                   new BigNumber(7),
                                   new BigNumber(109));
  expect(dcd.buysBefore).toEqual(buysBefore);
  expect(dcd.buysAfter).toEqual([
    { price: 120, volume: 5 },
    { price: 110, volume: 14 },
    { price: 109, volume: 14 + 7 },
    { price: 100, volume: 31 + 7 },
    { price: 94, volume: 31 + 7 }, // extender and centralizer
  ]);
  expect(dcd.buysExtra).toEqual([
    { price: 109, volume: 7 },
    { price: 100, volume: 7 },
    { price: 94, volume: 7 } // extender and centralizer
  ]);
  expect(dcd.sellsBefore).toEqual(sellsBefore);
  expect(dcd.sellsAfter).toEqual(sellsBefore);
  expect(dcd.sellsExtra).toBeUndefined();

  expect(dcd.minPrice).toEqual(94);
  expect(dcd.maxPrice).toEqual(166);
  expect(dcd.minVolume).toEqual(5);
  expect(dcd.maxVolume).toEqual(31 + 7);

  expect(dcd.summary).toEqual({
    price: 109,
    currentForSale: { amount: 0, totalCost: 0 },
    currentWanted: { amount: 9 + 5, totalCost: 9 * 110 + 5 * 120 },
    afterOrderForSale: { amount: 0, totalCost: 0 },
    afterOrderWanted: { amount: 9 + 5 + 7, totalCost: 7 * 109 + 9 * 110 + 5 * 120 },
  });
});

// Buy with price a bit smaller than current best sell offers, but higher than best buy
// price not matches orderbook offer
test('1.4. Buy a bit, make new best buy offer. Max price 122, amount 3', () => {
  const dcd = dc.getDepthChartData(fakeOrderbook.buy,
                                   fakeOrderbook.sell, OfferType.buy,
                                   OfferMatchType.limitOrder,
                                   new BigNumber(3),
                                   new BigNumber(122));
  expect(dcd.buysBefore).toEqual(buysBefore);
  expect(dcd.buysAfter).toEqual([
    { price: 122, volume: 3 },
    { price: 120, volume: 5 + 3 },
    { price: 110, volume: 14 + 3 },
    { price: 100, volume: 31 + 3 },
    { price: 94, volume: 31 + 3 }, // extender and centralizer
  ]);
  expect(dcd.buysExtra).toEqual([
    { price: 122, volume: 3 },
    { price: 100, volume: 3 },
    { price: 94, volume: 3 } // extender and centralizer
  ]);
  expect(dcd.sellsBefore).toEqual(sellsBefore);
  expect(dcd.sellsAfter).toEqual(sellsBefore);
  expect(dcd.sellsExtra).toBeUndefined();

  expect(dcd.minPrice).toEqual(94);
  expect(dcd.maxPrice).toEqual(166);
  expect(dcd.minVolume).toEqual(3);
  expect(dcd.maxVolume).toEqual(31 + 3);

  expect(dcd.summary).toEqual({
    price: 122,
    currentForSale: { amount: 0, totalCost: 0 },
    currentWanted: { amount: 0, totalCost: 0 },
    afterOrderForSale: { amount: 0, totalCost: 0 },
    afterOrderWanted: { amount: 3, totalCost: 3 * 122 },
  });
});

// Buy a bit, part of order matches sell book, part rests in buys
// price not match orderbook offer
test('1.5. Buy a bit from sells, leave a bit in buys. Max price 141, amount 13', () => {
  const dcd = dc.getDepthChartData(fakeOrderbook.buy,
                                   fakeOrderbook.sell, OfferType.buy,
                                   OfferMatchType.limitOrder,
                                   new BigNumber(13),
                                   new BigNumber(141));
  expect(dcd.buysBefore).toEqual(buysBefore);
  expect(dcd.buysAfter).toEqual([ // left 13 - 7 = 6 volume
    { price: 141, volume: 6 },
    { price: 120, volume: 5 + 6 },
    { price: 110, volume: 14 + 6 },
    { price: 100, volume: 31 + 6 },
    { price: 94, volume: 31 + 6 }, // extender and centralizer
  ]);
  expect(dcd.buysExtra).toEqual([
    { price: 141, volume: 6 },
    { price: 100, volume: 6 },
    { price: 94, volume: 6 }, // extender and centralizer]);
  ]);
  expect(dcd.sellsBefore).toEqual(sellsBefore);
  expect(dcd.sellsAfter).toEqual([ // has eaten 7 volume
    { price: 142, volume: 15 - 7 },
    { price: 150, volume: 26 - 7 },
    { price: 160, volume: 27 - 7 },
    { price: 166, volume: 27 - 7 } // extender and centralizer
  ]);
  expect(dcd.sellsExtra).toBeUndefined();

  expect(dcd.minPrice).toEqual(94);
  expect(dcd.maxPrice).toEqual(166);
  expect(dcd.minVolume).toEqual(5);
  expect(dcd.maxVolume).toEqual(31 + 6);

  expect(dcd.summary).toEqual({
    price: 141,
    currentForSale: { amount: 7, totalCost: 7 * 140 },
    currentWanted: { amount: 0, totalCost: 0 },
    afterOrderForSale: { amount: 0, totalCost: 0 },
    afterOrderWanted: { amount: 6, totalCost: 6 * 141 },
  });
});

// Buy a bit, whole order matches sell book, price matches orderbook offer
test('1.6. Buy a bit. Max price 142, amount 13', () => {
  const dcd = dc.getDepthChartData(fakeOrderbook.buy,
                                   fakeOrderbook.sell, OfferType.buy,
                                   OfferMatchType.limitOrder,
                                   new BigNumber(13),
                                   new BigNumber(142));
  expect(dcd.buysBefore).toEqual(buysBefore);
  expect(dcd.buysAfter).toEqual(buysBefore);
  expect(dcd.buysExtra).toEqual([]);
  expect(dcd.sellsBefore).toEqual(sellsBefore);
  expect(dcd.sellsAfter).toEqual([
    { price: 142, volume: 2 },
    { price: 150, volume: 13 },
    { price: 160, volume: 14 },
    { price: 166, volume: 14 }
  ]);
  expect(dcd.sellsExtra).toBeUndefined();

  expect(dcd.minPrice).toEqual(94);
  expect(dcd.maxPrice).toEqual(166);
  expect(dcd.minVolume).toEqual(2);
  expect(dcd.maxVolume).toEqual(31);

  expect(dcd.summary).toEqual({
    price: 142,
    currentForSale: { amount: 15, totalCost: 7 * 140 + 8 * 142 },
    currentWanted: { amount: 0, totalCost: 0 },
    afterOrderForSale: { amount: 2, totalCost: 2 * 142 },
    afterOrderWanted: { amount: 0, totalCost: 0 },
  });
});

// Buy a bit, whole order matches sell book, price, price not match orderbook offer
test('1.7. Buy a bit. Max price 143, amount 13', () => {
  const dcd = dc.getDepthChartData(fakeOrderbook.buy,
                                   fakeOrderbook.sell, OfferType.buy,
                                   OfferMatchType.limitOrder,
                                   new BigNumber(13),
                                   new BigNumber(143));
  expect(dcd.buysBefore).toEqual(buysBefore);
  expect(dcd.buysAfter).toEqual(buysBefore);
  expect(dcd.buysExtra).toEqual([]);
  expect(dcd.sellsBefore).toEqual(sellsBefore);
  expect(dcd.sellsAfter).toEqual([
    { price: 142, volume: 2 },
    { price: 150, volume: 13 },
    { price: 160, volume: 14 },
    { price: 166, volume: 14 }
  ]);
  expect(dcd.sellsExtra).toBeUndefined();

  expect(dcd.minPrice).toEqual(94);
  expect(dcd.maxPrice).toEqual(166);
  expect(dcd.minVolume).toEqual(2);
  expect(dcd.maxVolume).toEqual(31);

  expect(dcd.summary).toEqual({
    price: 143,
    currentForSale: { amount: 15, totalCost: 7 * 140 + 8 * 142 },
    currentWanted: { amount: 0, totalCost: 0 },
    afterOrderForSale: { amount: 2, totalCost: 2 * 142 },
    afterOrderWanted: { amount: 0, totalCost: 0 },
  });
});

// Buy everything from sells, whole order matches and leaves some part of order in buy
test('1.8. Buy everything. Max price 170, amount 40', () => {
  const dcd = dc.getDepthChartData(fakeOrderbook.buy,
                                   fakeOrderbook.sell, OfferType.buy,
                                   OfferMatchType.limitOrder,
                                   new BigNumber(40),
                                   new BigNumber(170));
  expect(dcd.buysBefore).toEqual([
    { price: 120, volume: 5 },
    { price: 110, volume: 14 },
    { price: 100, volume: 31 },
    { price: 83, volume: 31 }, // extender and centralizer);
  ]);
  expect(dcd.buysAfter).toEqual([ // left with 13 volume
    { price: 170, volume: 13 },
    { price: 120, volume: 5 + 13 },
    { price: 110, volume: 14 + 13 },
    { price: 100, volume: 31 + 13 },
    { price: 83, volume: 31 + 13 }, // extender and centralizer
  ]);
  expect(dcd.buysExtra).toEqual([
    { price: 170, volume: 13 },
    { price: 100, volume: 13 },
    { price: 83, volume: 13 }, // extender and centralizer]);
  ]);
  expect(dcd.sellsBefore).toEqual([ // eats everything = 27 vol.
    { price: 140, volume: 7 },
    { price: 142, volume: 15 },
    { price: 150, volume: 26 },
    { price: 160, volume: 27 },
    { price: 177, volume: 27 } // extender and centralizer
  ]);
  expect(dcd.sellsAfter).toEqual([]);
  expect(dcd.sellsExtra).toBeUndefined();

  expect(dcd.minPrice).toEqual(83);
  expect(dcd.maxPrice).toEqual(177);
  expect(dcd.minVolume).toEqual(5);
  expect(dcd.maxVolume).toEqual(31 + 13);

  expect(dcd.summary).toEqual({
    price: 170,
    currentForSale: { amount: 27, totalCost: 7 * 140 + 8 * 142 + 11 * 150 + 160 },
    currentWanted: { amount: 0, totalCost: 0 },
    afterOrderForSale: { amount: 0, totalCost: 0 },
    afterOrderWanted: { amount: 13, totalCost: 13 * 170 },
  });
});

// Sell a bit, whole order matches buy book, price between orderbooks offers
test('2.0. Sell so much to buy everything. Min price 90, amount 40', () => {
  const dcd = dc.getDepthChartData(fakeOrderbook.buy,
                                   fakeOrderbook.sell, OfferType.sell,
                                   OfferMatchType.limitOrder,
                                   new BigNumber(40),
                                   new BigNumber(90));
  expect(dcd.buysBefore).toEqual([
    { price: 120, volume: 5 },
    { price: 110, volume: 14 },
    { price: 100, volume: 31 },
    { price: 83, volume: 31 }, // extender and centralizer
  ]);
  // middle is 130, ext=160-90=70=>7 so 83 vs 167
  // means 130-83=17+30=47 167-130=37 so 47 so right to 177
  expect(dcd.buysAfter).toEqual([]);
  expect(dcd.buysExtra).toBeUndefined();
  expect(dcd.sellsBefore).toEqual([
    { price: 140, volume: 7 },
    { price: 142, volume: 15 },
    { price: 150, volume: 26 },
    { price: 160, volume: 27 },
    { price: 177, volume: 27 } // extender and centralizer
  ]);
  expect(dcd.sellsAfter).toEqual([
    { price: 90, volume: 9 },
    { price: 140, volume: 7 + 9 },
    { price: 142, volume: 15 + 9 },
    { price: 150, volume: 26 + 9 },
    { price: 160, volume: 27 + 9 },
    { price: 177, volume: 27 + 9 } // extender and centralizer
  ]);
  expect(dcd.sellsExtra).toEqual([
    { price: 90, volume: 9 },
    { price: 160, volume: 9 },
    { price: 177, volume: 9 },
  ]);

  expect(dcd.minPrice).toEqual(83);
  expect(dcd.maxPrice).toEqual(177);
  expect(dcd.minVolume).toEqual(5);
  expect(dcd.maxVolume).toEqual(27 + 9);

  expect(dcd.summary).toEqual({
    price: 90,
    currentForSale: { amount: 0, totalCost: 0 },
    currentWanted: { amount: 31, totalCost: 5 * 120 + 9 * 110 + 17 * 100 },
    afterOrderForSale: { amount: 9, totalCost: 9 * 90 },
    afterOrderWanted: { amount: 0, totalCost: 0 },
  });
});

// Sell a bit, whole order matches buy book, price between orderbooks offers
test('2.1. Sell a bit. Min price 103, amount 8', () => {
  const dcd = dc.getDepthChartData(fakeOrderbook.buy,
                                   fakeOrderbook.sell, OfferType.sell,
                                   OfferMatchType.limitOrder,
                                   new BigNumber(8),
                                   new BigNumber(103));
  expect(dcd.buysBefore).toEqual(buysBefore);
  expect(dcd.buysAfter).toEqual([
  { price: 110, volume: 6 },
  { price: 100, volume: 23 },
  { price: 94, volume: 23 },
  ]);
  expect(dcd.buysExtra).toBeUndefined();
  expect(dcd.sellsBefore).toEqual(sellsBefore);
  expect(dcd.sellsAfter).toEqual(sellsBefore);
  expect(dcd.sellsExtra).toEqual([]);

  expect(dcd.minPrice).toEqual(94);
  expect(dcd.maxPrice).toEqual(166);
  expect(dcd.minVolume).toEqual(5);
  expect(dcd.maxVolume).toEqual(31);

  expect(dcd.summary).toEqual({
    price: 103,
    currentForSale: { amount: 0, totalCost: 0 },
    currentWanted: { amount: 9 + 5, totalCost: 5 * 120 + 9 * 110 },
    afterOrderForSale: { amount: 0, totalCost: 0 },
    afterOrderWanted: { amount: 6, totalCost: 6 * 110 },
  });
});

// Sell with price a bit smaller than current best buy offers, price matches orderbook offer
// so buys from sell a bit
test('2.2. Sell a bit, with price matching order book. Min price 110, amount 7', () => {
  const dcd = dc.getDepthChartData(fakeOrderbook.buy,
                                   fakeOrderbook.sell, OfferType.sell,
                                   OfferMatchType.limitOrder,
                                   new BigNumber(7),
                                   new BigNumber(110));
  expect(dcd.buysBefore).toEqual(buysBefore);
  expect(dcd.buysAfter).toEqual([
    { price: 110, volume: 7 },
    { price: 100, volume: 31 - 7 },
    { price: 94, volume: 31 - 7 }, // extender and centralizer
  ]);
  expect(dcd.buysExtra).toBeUndefined();
  expect(dcd.sellsBefore).toEqual(sellsBefore);
  expect(dcd.sellsAfter).toEqual(sellsBefore);
  expect(dcd.sellsExtra).toEqual([]);

  expect(dcd.minPrice).toEqual(94);
  expect(dcd.maxPrice).toEqual(166);
  expect(dcd.minVolume).toEqual(5);
  expect(dcd.maxVolume).toEqual(31);

  expect(dcd.summary).toEqual({
    price: 110,
    currentForSale: { amount: 0, totalCost: 0 },
    currentWanted: { amount: 9 + 5, totalCost: 9 * 110 + 5 * 120 },
    afterOrderForSale: { amount: 0, totalCost: 0 },
    afterOrderWanted: { amount: 9 + 5 - 7, totalCost: 7 * 110 },
  });
});

// Sell a bit, whole order matches, price between offers price
test('2.3. Sell a bit. Min price 115, amount 3', () => {
  const dcd = dc.getDepthChartData(fakeOrderbook.buy,
                                   fakeOrderbook.sell, OfferType.sell,
                                   OfferMatchType.limitOrder,
                                   new BigNumber(3),
                                   new BigNumber(115));
  expect(dcd.buysBefore).toEqual(buysBefore);
  expect(dcd.buysAfter).toEqual([
    { price: 120, volume: 2 },
    { price: 110, volume: 11 },
    { price: 100, volume: 28 },
    { price: 94, volume: 28 },
  ]);
  expect(dcd.buysExtra).toBeUndefined();
  expect(dcd.sellsBefore).toEqual(sellsBefore);
  expect(dcd.sellsAfter).toEqual(sellsBefore);
  expect(dcd.sellsExtra).toEqual([]);

  expect(dcd.minPrice).toEqual(94);
  expect(dcd.maxPrice).toEqual(166);
  expect(dcd.minVolume).toEqual(2);
  expect(dcd.maxVolume).toEqual(31);

  expect(dcd.summary).toEqual({
    price: 115,
    currentForSale: { amount: 0, totalCost: 0 },
    currentWanted: { amount: 5, totalCost: 5 * 120 },
    afterOrderForSale: { amount: 0, totalCost: 0 },
    afterOrderWanted: { amount: 2, totalCost: 2 * 120 },
  });
});

// Sell with price a bit larger than current best buy offers, price matches orderbook offer
test('2.4. Sell a bit, with price matching order book. Min price 142, amount 2', () => {
  const dcd = dc.getDepthChartData(fakeOrderbook.buy,
                                   fakeOrderbook.sell, OfferType.sell,
                                   OfferMatchType.limitOrder,
                                   new BigNumber(2),
                                   new BigNumber(142));
  expect(dcd.buysBefore).toEqual(buysBefore);
  expect(dcd.buysAfter).toEqual(buysBefore);
  expect(dcd.buysExtra).toBeUndefined();
  expect(dcd.sellsBefore).toEqual(sellsBefore);
  expect(dcd.sellsAfter).toEqual([
    { price: 140, volume: 7 },
    { price: 142, volume: 15 + 2 },
    { price: 150, volume: 26 + 2 },
    { price: 160, volume: 27 + 2 },
    { price: 166, volume: 27 + 2 } // extender and centralizer
  ]);
  expect(dcd.sellsExtra).toEqual([
    { price: 142, volume:  2 },
    { price: 160, volume:  2 },
    { price: 166, volume:  2 } // extender and centralizer
  ]);

  expect(dcd.minPrice).toEqual(94);
  expect(dcd.maxPrice).toEqual(166);
  expect(dcd.minVolume).toEqual(2);
  expect(dcd.maxVolume).toEqual(31);

  expect(dcd.summary).toEqual({
    price: 142,
    currentForSale: { amount: 7 + 8, totalCost: 7 * 140 + 8 * 142 },
    currentWanted: { amount: 0, totalCost: 0 },
    afterOrderForSale: { amount: 7 + 8 + 2, totalCost: 7 * 140 + 10 * 142 },
    afterOrderWanted: { amount: 0, totalCost: 0 },
  });
});

// Sell with price a bit smaller than current best buy offers, price not matches orderbook offer
// Sells a bit and some part lasts in sells
test('2.5. Sell a bit, part lasts in sells. Min price 112, amount 15', () => {
  const dcd = dc.getDepthChartData(fakeOrderbook.buy,
                                   fakeOrderbook.sell, OfferType.sell,
                                   OfferMatchType.limitOrder,
                                   new BigNumber(15),
                                   new BigNumber(112));
  expect(dcd.buysBefore).toEqual(buysBefore);
  expect(dcd.buysAfter).toEqual([
    { price: 110, volume: 14 - 5 },
    { price: 100, volume: 31 - 5 },
    { price: 94, volume: 31 - 5 }, // extender and centralizer);
  ]);
  expect(dcd.buysExtra).toBeUndefined();
  expect(dcd.sellsBefore).toEqual(sellsBefore);
  expect(dcd.sellsAfter).toEqual([
    { price: 112, volume: 10 },
    { price: 140, volume: 7 + 10 },
    { price: 142, volume: 15 + 10 },
    { price: 150, volume: 26 + 10 },
    { price: 160, volume: 27 + 10 },
    { price: 166, volume: 27 + 10 } // extender and centralizer
  ]);
  expect(dcd.sellsExtra).toEqual([
    { price: 112, volume:  10 },
    { price: 160, volume:  10 },
    { price: 166, volume:  10 } // extender and centralizer
  ]);

  expect(dcd.minPrice).toEqual(94);
  expect(dcd.maxPrice).toEqual(166);
  expect(dcd.minVolume).toEqual(5);
  expect(dcd.maxVolume).toEqual(27 + 10);

  expect(dcd.summary).toEqual({
    price: 112,
    currentForSale: { amount: 0, totalCost: 0 },
    currentWanted: { amount: 5, totalCost: 5 * 120 },
    afterOrderForSale: { amount: 10, totalCost: 10 * 112 },
    afterOrderWanted: { amount: 0, totalCost: 0 },
  });
});

// Sell with price a really smaller than current best buy offers, price not matches orderbook offer
// Sells a bit and some part lasts in sell
test('2.6. Sell a bit, part lasts in sells. Min price 108, amount 15', () => {
  const dcd = dc.getDepthChartData(fakeOrderbook.buy,
                                   fakeOrderbook.sell, OfferType.sell,
                                   OfferMatchType.limitOrder,
                                   new BigNumber(15),
                                   new BigNumber(108));
  expect(dcd.buysBefore).toEqual(buysBefore);
  expect(dcd.buysAfter).toEqual([
    { price: 100, volume: 31 - 14 },
    { price: 94, volume: 31 - 14 }, // extender and centralizer);
  ]);
  expect(dcd.buysExtra).toBeUndefined();
  expect(dcd.sellsBefore).toEqual(sellsBefore);
  expect(dcd.sellsAfter).toEqual([
    { price: 108, volume: 1 },
    { price: 140, volume: 7 + 1 },
    { price: 142, volume: 15 + 1 },
    { price: 150, volume: 26 + 1 },
    { price: 160, volume: 27 + 1 },
    { price: 166, volume: 27 + 1 } // extender and centralizer
  ]);
  expect(dcd.sellsExtra).toEqual([
    { price: 108, volume:  1 },
    { price: 160, volume:  1 },
    { price: 166, volume:  1 } // extender and centralizer
  ]);

  expect(dcd.minPrice).toEqual(94);
  expect(dcd.maxPrice).toEqual(166);
  expect(dcd.minVolume).toEqual(1);
  expect(dcd.maxVolume).toEqual(31);

  expect(dcd.summary).toEqual({
    price: 108,
    currentForSale: { amount: 0, totalCost: 0 },
    currentWanted: { amount: 14, totalCost: 5 * 120 + 9 * 110 },
    afterOrderForSale: { amount: 1, totalCost: 108 },
    afterOrderWanted: { amount: 0, totalCost: 0 },
  });
});

// Sell with price a larger than current largest sell offers; extends range on the right
test('2.7. Sell a bit, part lasts in sells. Min price 210, amount 10', () => {
  const dcd = dc.getDepthChartData(fakeOrderbook.buy,
                                   fakeOrderbook.sell, OfferType.sell,
                                   OfferMatchType.limitOrder,
                                   new BigNumber(10),
                                   new BigNumber(210));
  // middle is 130,
  // ext = 210 - 100 = 110 => 11
  // 100-11 = 89 vs 210+11=221 to middle 130-89=41 221-130=91 so extension 91
  // 130-91 = 39
  expect(dcd.buysBefore).toEqual([
    { price: 120, volume: 5 },
    { price: 110, volume: 14 },
    { price: 100, volume: 31 },
    { price: 39, volume: 31 }, // extender and centralizer
  ]);
  expect(dcd.buysAfter).toEqual([
    { price: 120, volume: 5 },
    { price: 110, volume: 14 },
    { price: 100, volume: 31 },
    { price: 39, volume: 31 }, // extender and centralizer
  ]);
  expect(dcd.buysExtra).toBeUndefined();
  expect(dcd.sellsBefore).toEqual([
    { price: 140, volume: 7 },
    { price: 142, volume: 15 },
    { price: 150, volume: 26 },
    { price: 160, volume: 27 },
    { price: 221, volume: 27 } // extender and centralizer
  ]);
  expect(dcd.sellsAfter).toEqual([
    { price: 140, volume: 7 },
    { price: 142, volume: 15 },
    { price: 150, volume: 26 },
    { price: 160, volume: 27 },
    { price: 210, volume: 27 + 10 },
    { price: 221, volume: 27 + 10 } // extender and centralizer
  ]);
  expect(dcd.sellsExtra).toEqual([
    { price: 210, volume: 10 },
    { price: 221, volume: 10 } // extender and centralizer
  ]);

  expect(dcd.minPrice).toEqual(39);
  expect(dcd.maxPrice).toEqual(221);
  expect(dcd.minVolume).toEqual(5);
  expect(dcd.maxVolume).toEqual(27 + 10);

  expect(dcd.summary).toEqual({
    price: 210,
    currentForSale: { amount: 27, totalCost: 7 * 140 + 8 * 142 + 11 * 150 + 160 },
    currentWanted: { amount: 0, totalCost: 0 },
    afterOrderForSale: { amount: 37, totalCost: 7 * 140 + 8 * 142 + 11 * 150 + 160 + 10 * 210 },
    afterOrderWanted: { amount: 0, totalCost: 0 },
  });
});
