import { BigNumber } from 'bignumber.js';
import { isEmpty } from 'lodash';
import { Observable, Subject } from 'rxjs';
import { first } from 'rxjs/internal/operators';
import {
  flatMap,
  scan,
  shareReplay,
  startWith,
  switchMap,
} from 'rxjs/operators';
import { Error } from 'tslint/lib/error';
import { OfferMatchType } from '../../utils/form';
import { Offer, OfferType, Orderbook } from '../orderbook/orderbook';
import { TradingPair } from '../tradingPair/tradingPair';

interface PriceVolume {
  price: number;
  volume: number;
}

interface DepthChartVolumes {
  sellsBefore?: PriceVolume[];
  sellsAfter?: PriceVolume[];
  buysBefore?: PriceVolume[];
  buysAfter?: PriceVolume[];
  buysExtra?: PriceVolume[];
  sellsExtra?: PriceVolume[];
}

export interface DepthChartData extends DepthChartVolumes {
  minPrice: number;
  maxPrice: number;
  minVolume: number;
  maxVolume: number;
  summary?: Summary;
}

export interface Summary {
  price: number;
  // for price, there is for buy amount for max total cost
  currentForSale: SummaryAmountAndTotal;
  // for price, there is for sell amount for min total revenue
  currentWanted: SummaryAmountAndTotal;
  // for price, after order, there'll be for buy amount for max total cost
  afterOrderForSale: SummaryAmountAndTotal;
  // for price, after order, there'll be for sell amount for min total revenue
  afterOrderWanted: SummaryAmountAndTotal;
}

export interface SummaryAmountAndTotal {
  amount: number;
  totalCost: number;
}

export type ZoomChange = 'zoomIn' | 'zoomOut';

const zoomMultiplier = new BigNumber(1.5);

export function createZoom$(
  tradingPair$: Observable<TradingPair>,
  orderBook$: Observable<Orderbook>
): [(change: ZoomChange) => void, Observable<BigNumber>] {

  const zoomChange$: Subject<ZoomChange> = new Subject<ZoomChange>();

  return [
    zoomChange$.next.bind(zoomChange$),
    tradingPair$.pipe(
      switchMap(() =>
        orderBook$.pipe(
          first(),
          flatMap(orderbook =>
            zoomChange$.pipe(
              startWith(findDefaultZoom(orderbook)),
              scan(
                (zoom: BigNumber, change: ZoomChange) => {
                  return change === 'zoomOut' ?
                    zoom.times(zoomMultiplier) :
                    zoom.dividedBy(zoomMultiplier);
                },
              ),
            )
          )
        )
      ),
      shareReplay(1),
    )
  ];
}

function accumulateOffer(a: PriceVolume[], o: Offer) {

  const prev: PriceVolume = a[a.length - 1];

  const currentPrice: number = o.price.toNumber();
  const currentAmount: number = o.baseAmount.toNumber();

  if (prev) {
    if (prev.price !== currentPrice) {
      a.push({
        price: currentPrice,
        volume: (prev.volume + currentAmount)
      });
    } else {
      a[a.length - 1].volume = (Number(a[a.length - 1].volume) + Number(currentAmount));
    }
  } else {
    a.push({
      price: currentPrice,
      volume: currentAmount
    });
  }

  return a;
}

function accumulate(offers: Offer[]) {
  return offers.reduce(accumulateOffer, []);
}

function minMax<T>(data: T[], select: (x: T) => number) {
  return data
  .map(select)
  .reduce(
    ([min, max], v) => [Math.min(v, min), Math.max(v, max)],
    [Number.MAX_VALUE, Number.MIN_VALUE]);
}

// adjust price range by extending a little bit on both sides
function adjustPriceRange(volumes: DepthChartVolumes,
                          minPrice: number,
                          maxPrice: number): [DepthChartVolumes, number, number] {
  const extender = (maxPrice - minPrice) * 0.1;

  let newMaxPrice = maxPrice + extender;
  let newMinPrice = minPrice - extender;

  if (volumes.sellsBefore !== undefined && volumes.sellsBefore.length > 0
      && volumes.buysBefore !== undefined && volumes.buysBefore.length > 0) {
    const midMarketPrice = (volumes.sellsBefore[0].price + volumes.buysBefore[0].price) / 2;
    const expectedDiff = Math.max(newMaxPrice - midMarketPrice, midMarketPrice - newMinPrice);
    newMinPrice = midMarketPrice - expectedDiff;
    newMaxPrice = midMarketPrice + expectedDiff;
  }

  [volumes.buysAfter, volumes.buysBefore, volumes.buysExtra]
    .forEach(v => {
      if (v === undefined || v.length === 0) {
        return;
      }
      const minVolumeElem = v[v.length - 1];
      v.push({ ...minVolumeElem, price: Math.max(newMinPrice, 0) });
    });
  [volumes.sellsAfter, volumes.sellsBefore, volumes.sellsExtra]
    .forEach(v => {
      if (v === undefined || v.length === 0) {
        return;
      }
      const maxVolumeElem = v[v.length - 1];
      v.push({ ...maxVolumeElem, price: newMaxPrice });
    });
  return [volumes, newMinPrice, newMaxPrice];
}

function calculateSummaryForSell(price: BigNumber, volume?: PriceVolume[]): SummaryAmountAndTotal {
  let amount = 0;
  let totalCost = 0;
  if (price === undefined || volume === undefined || volume.length === 0) {
    return { amount, totalCost } as SummaryAmountAndTotal;
  }
  const adeqVolumes = volume.filter(vol => price.gte(new BigNumber(vol.price)));
  if (adeqVolumes.length > 0) {
    amount = adeqVolumes[adeqVolumes.length - 1].volume;
  }
  for (let i = 0; i < adeqVolumes.length; i = i + 1) {
    const v = (i === 0 ? adeqVolumes[i].volume : adeqVolumes[i].volume - adeqVolumes[i - 1].volume);
    totalCost += adeqVolumes[i].price * v;
  }
  return { amount, totalCost };
}

function calculateSummaryForBuys(price: BigNumber, volume?: PriceVolume[]): SummaryAmountAndTotal {
  let amount = 0;
  let totalCost = 0;
  if (price === undefined || volume === undefined || volume.length === 0) {
    return { amount, totalCost } as SummaryAmountAndTotal;
  }
  const adeqVolumes = volume.filter(vol => price.lte(new BigNumber(vol.price)));
  if (adeqVolumes.length > 0) {
    const thePriceVolume = adeqVolumes[adeqVolumes.length - 1];
    amount = thePriceVolume.volume;
  }
  for (let i = 0; i < adeqVolumes.length; i = i + 1) {
    const v = (i === 0 ? adeqVolumes[i].volume : adeqVolumes[i].volume - adeqVolumes[i - 1].volume);
    totalCost += adeqVolumes[i].price * v;
  }
  return { amount, totalCost };
}

function calculateSummary(volumes: DepthChartVolumes, price?: BigNumber): Summary | undefined {
  if (price === undefined) {
    return undefined;
  }
  const currentForSale = calculateSummaryForSell(price, volumes.sellsBefore);
  const currentWanted = calculateSummaryForBuys(price, volumes.buysBefore);
  const afterOrderForSale = calculateSummaryForSell(price, volumes.sellsAfter);
  const afterOrderWanted = calculateSummaryForBuys(price, volumes.buysAfter);
  return {
    currentForSale,
    currentWanted,
    afterOrderForSale,
    afterOrderWanted,
    price: price.toNumber()
  } as Summary;
}

function addMinMaxSummary(volumes: DepthChartVolumes, price?: BigNumber) {
  const summary = calculateSummary(volumes, price);

  const accumulated: PriceVolume[] = ([
    volumes.buysAfter, volumes.buysBefore, volumes.buysExtra,
    volumes.sellsAfter, volumes.sellsBefore, volumes.sellsExtra]
    .filter(v => v !== undefined) as PriceVolume[][])
    .reduce((a: PriceVolume[], v: PriceVolume[]) => a.concat(v), []);

  let [minPrice, maxPrice] = minMax(accumulated, o => o.price);
  let [minVolume, maxVolume] = minMax(accumulated, o => o.volume);

  if (minPrice > maxPrice) {
    // that means that min and max price are undefined
    minPrice = 10;
    maxPrice = 100;
  }
  if (minVolume > maxVolume) {
    // that means that min and max volume are undefined
    minVolume = 0;
    maxVolume = 100;
  }

  const [adjustedVolumes, adjustedMinPrice, adjustedMaxPrice]
    = adjustPriceRange(volumes, minPrice, maxPrice);

  return {
    ...adjustedVolumes,
    minVolume,
    maxVolume,
    summary,
    minPrice: adjustedMinPrice,
    maxPrice: adjustedMaxPrice
  };
}

// For offerType: buy
// Sell offers after transaction
function sellsAfterForBuyOffer(amount: BigNumber,
                               price: BigNumber,
                               sells: Offer[]): [Offer[], BigNumber] {
  let remaining = amount;
  const result: Offer[] = [];

  for (const o of sells) {
    if (!o.price.gt(price) && remaining.gt(0)) {
      const diff = BigNumber.min(remaining, o.baseAmount);
      const baseAmount = o.baseAmount.minus(diff);
      if (baseAmount.gt(0)) {
        result.push({ ...o, baseAmount });
      }
      remaining = remaining.minus(diff);
    } else {
      result.push(o);
    }
  }

  return [result, remaining];
}

// For offerType: buy
// Buy offers after sell - when couldn't buy for given price everything you want at the moment
// so it adds to buy offers remaining of given offer
function buyAfterForBuyOffer(remaining: BigNumber, price: BigNumber, buys: Offer[]): Offer[] {
  if (remaining.isZero()) {
    return [...buys];
  }

  let remainingUnused = true;
  const buyResult = buys.reduce(
    (result: Offer[], offer: Offer) => {
      // console.log(offer.price);
      if (remainingUnused && offer.price.eq(price)) {
        const baseAmount = offer.baseAmount.plus(remaining);
        result.push({ ...offer, baseAmount });
        remainingUnused = false;
      } else {
        result.push(offer);
      }
      return result;
    },
    []);

  if (remainingUnused) {
    buyResult.push({ price, baseAmount: remaining } as Offer);
    buyResult.sort((o1: Offer, o2: Offer) => (o2.price.minus(o1.price).toNumber()));
  }
  return buyResult;
}

// For offerType: buy
// Offers that would be added by given trade to buy offers
function extraBuyOffers(remaining: BigNumber, price: BigNumber, buys: Offer[]): Offer[] {
  if (remaining.isZero()) {
    return [];
  }
  const minPrice: BigNumber = buys.length > 0 && buys[buys.length - 1].price.lte(price) ?
    buys[buys.length - 1].price : price;
  return [{ price, baseAmount: remaining } as Offer,
    { price: minPrice, baseAmount: new BigNumber(0) } as Offer];
}

// For offerType: sell
// Buy offers after transaction
function buyAfterForSellOffer(amount: BigNumber,
                              price: BigNumber,
                              buys: Offer[]): [Offer[], BigNumber] {
  let remaining = amount;
  const result: Offer[] = [];

  for (const o of buys) {
    if (!o.price.lt(price) && remaining.gt(0)) {
      const diff = BigNumber.min(remaining, o.baseAmount);
      const baseAmount = o.baseAmount.minus(diff);
      if (baseAmount.gt(0)) {
        result.push({ ...o, baseAmount });
      }
      remaining = remaining.minus(diff);
    } else {
      result.push(o);
    }
  }
  return [result, remaining];
}

// For offerType: sell
// Sell offers after transaction when couldn't buy for given price everything you want at the moment
// so it adds to sell offers remaining of given offer
function sellsAfterForSellOffer(remaining: BigNumber, price: BigNumber, sells: Offer[]): Offer[] {
  if (remaining.isZero()) {
    return [...sells];
  }

  let remainingUnused = true;
  const sellsResult = sells.reduce(
    (result: Offer[], offer: Offer) => {
      if (remainingUnused && price.eq(offer.price)) {
        const baseAmount = offer.baseAmount.plus(remaining);
        result.push({ ...offer, baseAmount });
        remainingUnused = false;
      } else {
        result.push(offer);
      }
      return result;
    },
    []);

  if (remainingUnused) {
    sellsResult.push({ price, baseAmount: remaining } as Offer);
    sellsResult.sort((o1: Offer, o2: Offer) => (o1.price.minus(o2.price).toNumber())); // sort asc
  }
  return sellsResult;
}

// For offerType: buy
// Offers that would be added by given trade to buy offers
function extraSellOffers(remaining: BigNumber, price: BigNumber, sells: Offer[]): Offer[] {
  if (remaining.isZero()) {
    return [];
  }
  const minPrice: BigNumber = sells.length > 0 && sells[sells.length - 1].price.gte(price) ?
    sells[sells.length - 1].price : price;
  return [{ price, baseAmount: remaining } as Offer,
    { price: minPrice, baseAmount: new BigNumber(0) } as Offer];
}

export function logOffers(msg: string, offers: Offer[]) {
  console.log(
    msg,
    offers.map(o => [o.price.toNumber(), o.baseAmount.toNumber()]));
}

export function getCenter(buys: Offer[], sells: Offer[]): BigNumber {
  if (isEmpty(buys)) {
    return sells[0].price;
  }

  if (isEmpty(sells)) {
    return buys[0].price;
  }

  return buys[0].price.plus(sells[0].price).dividedBy(2);
}

export function findDefaultZoom(orderbook: Orderbook | undefined): BigNumber | undefined {
  if (!orderbook || isEmpty(orderbook.sell) && isEmpty(orderbook.buy)) {
    return undefined;
  }

  const center = getCenter(orderbook.buy, orderbook.sell);

  let zoom = center.times(0.5);

  const notEmpty = (orderbook.buy.length + orderbook.sell.length) > 0;

  while (true) {
    const zoomLeft = center.minus(zoom);
    const zoomRight = center.plus(zoom);
    const ordersNo =
      orderbook.buy.filter(offer => offer.price.gt(zoomLeft)).length +
      orderbook.sell.filter(offer => offer.price.lt(zoomRight)).length;

    if (ordersNo === 0 && notEmpty) {
      zoom = zoom.times(2);
    } else {
      return zoom;
    }
  }
}

/**
 * Calculate data to draw depth chart based on offer make (or create position) form
 * @param {Offer[]} buys -- buys from orderbook
 * @param {Offer[]} sells -- sells from orderbook
 * @param {OfferType} offerType -- buy or sell
 * @param {OfferMatchType} matchType
 * @param {BigNumber} amount -- amount of token to buy/sell
 * @param {BigNumber} price -- means max price (when buy) or min price (when sell)
 * when offer type is: "limit...", "fill or kill" or "immediate or cancel";
 * means average price when "direct" offer type
 * @param {BigNumber} zoom
 * @returns {DepthChartData}
 */
export function getDepthChartData(
  buys: Offer[],
  sells: Offer[],
  offerType: OfferType,
  matchType: OfferMatchType,
  amount?: BigNumber,
  price?: BigNumber,
  zoom?: BigNumber,
  ): DepthChartData {

  if (zoom && (!isEmpty(buys) || !isEmpty(sells))) {
    const mid = getCenter(buys, sells);

    const zoomLeft = mid.minus(zoom);
    const zoomRight = mid.plus(zoom);

    sells = sells.filter(offer => offer.price.lt(zoomRight));
    buys = buys.filter(offer => offer.price.gt(zoomLeft));

    // console.log(zoom.toNumber());
    // console.log(mid.toNumber());
    // console.log(zoomLeft.toNumber());
    // console.log(zoomRight.toNumber());

    // logOffers('buys', buys);
    // logOffers('sells', sells);
  }

  const sellsBefore = accumulate(sells);
  const buysBefore = accumulate(buys);

  if (!price || !amount) {
    return addMinMaxSummary({ sellsBefore, buysBefore });
  }

  // const priceExtreme = matchType === OfferMatchType.direct ?
  //   (offerType === OfferType.buy ? sells[sells.length - 1].price : buys[buys.length - 1].price) :
  //   price;

  if (offerType === 'buy') {
    // logOffers('sells before ', sells);
    // logOffers('buys before ', buys);
    // console.log('sellsBefore (accumulated)', sellsBefore);

    // In functions below price means maxPrice, so for "direct" as maxPrice we use
    // the greatest price from orderbook
    const maxPrice = matchType === OfferMatchType.direct ?
      sells[sells.length - 1].price :
      price;

    const [sellsAfterOffers, remainingAfterSell] = sellsAfterForBuyOffer(amount, maxPrice, sells);
    const sellsAfter = accumulate(sellsAfterOffers);

    const buysAfterSell = buyAfterForBuyOffer(remainingAfterSell, maxPrice, buys);
    let buysAfter = accumulate(buysAfterSell);

    const buysExtraOffers = extraBuyOffers(remainingAfterSell, maxPrice, buys);
    let buysExtra = accumulate(buysExtraOffers);

    switch (matchType) {
      case OfferMatchType.limitOrder:
        break;
      case OfferMatchType.direct:
        buysAfter = buysBefore.slice();
        buysExtra = accumulate([]);
        break;
    }

    return addMinMaxSummary({ sellsBefore, sellsAfter, buysBefore, buysAfter, buysExtra },
                            maxPrice);
  }

  if (offerType === 'sell') {

    // In functions below price means minPrice, so for "direct" as minPrice we use
    // the lowest price from buys orderbook
    const minPrice = matchType === OfferMatchType.direct ?
      buys[buys.length - 1].price :
      price;

    const [buysAfterOffers, remainingAfterBuy] = buyAfterForSellOffer(amount, minPrice, buys);
    const buysAfter = accumulate(buysAfterOffers);

    const sellsAfterOffers = sellsAfterForSellOffer(remainingAfterBuy, minPrice, sells);
    let sellsAfter = accumulate(sellsAfterOffers);

    const sellsExtraOffers = extraSellOffers(remainingAfterBuy, minPrice, sells);
    let sellsExtra = accumulate(sellsExtraOffers);

    switch (matchType) {
      case OfferMatchType.limitOrder:
        break;
      case OfferMatchType.direct:
        sellsAfter = sellsBefore.slice();
        sellsExtra = accumulate([]);
        break;
    }

    return addMinMaxSummary({ sellsBefore, sellsAfter, sellsExtra, buysBefore, buysAfter },
                            minPrice);
  }

  throw new Error('Should never get here -- offerType must be sell or buy');
}
