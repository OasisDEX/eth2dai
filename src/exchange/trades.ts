import { BigNumber } from 'bignumber.js';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

import { NetworkConfig } from '../blockchain/config';
import { vulcan0x } from '../blockchain/vulcan0x';
import { web3 } from '../blockchain/web3';

export type TradeAct = 'buy' | 'sell';
export type TradeRole = 'taker' | 'maker';

export interface Trade {
  offerId: BigNumber;
  act: TradeAct; // Market action (buy|sell)
  role: TradeRole; // Role (taker|maker)
  // maker:    string     // Offer creator address
  // taker:    string     // Trade creator address (msg.sender)
  baseAmount: BigNumber;
  baseToken: string;
  quoteAmount: BigNumber;
  quoteToken: string;
  price: BigNumber; // Market price (quote)
  block: number; // Block height
  time: Date; // Block timestamp
  tx?: string; // Transaction hash
  idx?: number; // Transaction number within block
}

// TODO: move to all trades?
const parseTrade = (
  account: string,
  buyToken: string,
  baseToken: string,
  quoteToken: string,
) => {
  return ({
    offerId,
    maker,
    lotAmt,
    bidAmt,
    bidTkn,
    block,
    time,
    tx,
    idx,
  }: any): Trade => {
    const sellAmount = new BigNumber(lotAmt);
    const buyAmount = new BigNumber(bidAmt);
    return {...buyToken === bidTkn ?
    {
      price: buyAmount.div(sellAmount),
      baseAmount: sellAmount,
      quoteAmount: buyAmount,
      act: account && maker === account ? 'sell' : 'buy',
    } : {
      price: sellAmount.div(buyAmount),
      baseAmount: buyAmount,
      quoteAmount: sellAmount,
      act: account && maker === account ? 'buy' : 'sell',
    }, ...{
      baseToken,
      quoteToken,
      block,
      tx,
      idx,
      offerId: new BigNumber(offerId),
      time: new Date(time),
      role: account && (maker === account ? 'maker' : 'taker'),
    }} as Trade;
  };
};

export const getTrades = (
  context: NetworkConfig,
  baseToken: string,
  quoteToken: string,
  filters: {account?: string, from?: Date, to?: Date, offset?: number, limit?: number},
): Observable<Trade[]> => {
  const accountVal = filters.account ? (web3 as any).toChecksumAddress(filters.account) : null;

  const fields = ['offerId', 'maker', 'bidAmt', 'bidTkn', 'lotAmt', 'block', 'time', 'tx', 'idx'];
  const order = `[TIME_DESC, IDX_DESC]`;
  const filter = {
    or: [
      {
        and: [
          { lotTkn: { equalTo: baseToken } },
          { bidTkn: { equalTo: quoteToken } },
        ],
      },
      {
        and: [
          { lotTkn: { equalTo: quoteToken } },
          { bidTkn: { equalTo: baseToken } },
        ],
      },
    ],
    ...accountVal ? {
      and: [{
        or: [
          { maker: { equalTo: accountVal } },
          { taker: { equalTo: accountVal } },
        ]
      }]
    } : {},
    ...(filters.from || filters.to) ? {
      time: {
        ...filters.from ? { greaterThan: filters.from.toISOString() } : {},
        ...filters.to ? { lessThan: filters.to.toISOString() } : {},
      }
    } : {},
  };

  return vulcan0x(
    context.oasisDataService.url,
    'allOasisTrades',
    {},
    filter,
    fields,
    order,
    filters.limit,
    filters.offset,
  ).pipe(
    map(trades => trades.map(parseTrade(accountVal, quoteToken, baseToken, quoteToken)))
  );
};

export function compareTrades({ act: type1, price: price1, time: t1 }: Trade, { act: type2, price: price2, time: t2 }: Trade) {
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
