import { BigNumber } from 'bignumber.js';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

import { NetworkConfig } from '../blockchain/config';
import { Placeholder, vulcan0x } from '../blockchain/vulcan0x';

export type TradeAct = 'buy' | 'sell';
export type TradeRole = 'taker' | 'maker';

export interface Trade {
  offerId: BigNumber;
  act: TradeAct; // Market action (buy|sell)
  kind: TradeAct; // Raw market action (buy|sell)
  role: TradeRole; // Role (taker|maker)
  // maker:    string     // Offer creator address
  // taker:    string     // Trade creator address (msg.sender)
  baseAmount: BigNumber;
  baseToken: string;
  quoteAmount: BigNumber;
  quoteToken: string;
  price: BigNumber; // Market price (quote)
  time: Date; // Block timestamp
  tx?: string; // Transaction hash
  idx?: number; // Transaction number within block
}

// TODO: move to all trades?
const parseTrade = (
  account: string | undefined,
  baseToken: string,
  quoteToken: string,
) => {
  return ({
    offerId,
    maker,
    baseAmt,
    quoteAmt,
    price,
    type,
    timestamp,
    tx,
    logIndex,
  }: any): Trade => {
    return {
      baseToken,
      quoteToken,
      tx,
      kind: type,
      act: account && maker === account ? (type === 'buy' ? 'sell' : 'buy') : type,
      price: new BigNumber(price),
      baseAmount: new BigNumber(baseAmt),
      quoteAmount: new BigNumber(quoteAmt),
      offerId: new BigNumber(offerId),
      idx: logIndex,
      time: new Date(timestamp),
      role: account && (maker === account ? 'maker' : 'taker'),
    } as Trade;
  };
};

export const getTrades = (
  context: NetworkConfig,
  baseToken: string,
  quoteToken: string,
  operation: string,
  filters: {account?: string, from?: Date, to?: Date, offset?: number, limit?: number},
): Observable<Trade[]> => {
  const owner = filters.account && filters.account.toLowerCase();

  const fields = ['offerId', 'maker', 'baseAmt', 'quoteAmt', 'price', 'type', 'timestamp',
    'tx', 'logIndex'];
  const order = `[TIMESTAMP_DESC, LOG_INDEX_DESC]`;
  const filter = {
    and: [
      { baseGem: { equalTo: new Placeholder('baseGem', 'String', baseToken) } },
      { quoteGem: { equalTo: new Placeholder('quoteGem', 'String', quoteToken) } },
    ],
    ...owner ? {
      or: [
        { maker: { equalTo: new Placeholder('owner', 'String', owner) } },
        { taker: { equalTo: new Placeholder('owner', 'String', owner) } },
      ]
    } : {},
    ...(filters.from || filters.to) ? {
      timestamp: {
        ...filters.from
          ? { greaterThan: new Placeholder(
            'timestampFrom',
            'Datetime',
            filters.from.toISOString())
          }
          : {},
        ...filters.to
          ? { lessThan: new Placeholder(
            'timestampTo',
            'Datetime',
            filters.to.toISOString())
          }
        : {},
      }
    } : {},
  };

  const { limit, offset } = filters;
  return vulcan0x(context.oasisDataService.url, operation, 'allOasisTradeGuis', fields, {
    filter,
    order,
    limit,
    offset,
  }).pipe(
    map(trades => trades.map(parseTrade(owner, baseToken, quoteToken)))
  );
};

export function compareTrades(
  { act: type1, price: price1, time: t1 }: Trade,
  { act: type2, price: price2, time: t2 }: Trade
) {
  /* Sorting the trades in the following order:
  * - Sell orders are before buy orders
  * - For each order type we sort by price (DESC)
  * - For each order with the same price we order by timestamp (DESC)
  * */
  if (type1 === type2) {
    if (price2.gt(price1)) return 1;
    if (price2.lt(price1)) return -1;
    if (price2.eq(price1)) {
      return t2.getTime() - t1.getTime();
    }
  }

  return type2 > type1 ? 1 : -1;
}

export function compareByTimestampOnly({ time: t1 }: Trade, { time: t2 }: Trade) {
  return t2.getTime() - t1.getTime();
}
