import { BigNumber } from 'bignumber.js';
import { bindNodeCallback, merge, Observable } from 'rxjs';
import { map, reduce, switchMap, take } from 'rxjs/operators';

import { NetworkConfig } from '../blockchain/config';
import { onEveryBlock$ } from '../blockchain/network';
import { amountFromWei } from '../blockchain/utils';
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
}

// TODO: move to all trades?
const parseTrade = (
  account: string,
  buyTokenGem: string,
  baseToken: string,
  quoteToken: string,
) => {
  return ({
    offerId,
    maker,
    lotAmt,
    bidAmt,
    bidGem,
    block,
    time,
    tx,
  }: any): Trade => {
    const sellAmount = new BigNumber(lotAmt);
    const buyAmount = new BigNumber(bidAmt);
    return {...buyTokenGem === bidGem ?
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
      offerId: new BigNumber(offerId),
      time: new Date(time),
      role: account && (maker === account ? 'maker' : 'taker'),
    }} as Trade;
  };
};

export const getTradesFallback = (
  context: NetworkConfig,
  baseToken: string,
  quoteToken: string,
  filters: {account?: string, from?: Date, to?: Date},
): Observable<Trade[]> => {
  return (filters.account ?
    merge(
      getTradesFromBlockchain(
        context, [baseToken, quoteToken], baseToken, quoteToken, filters.from, filters.to,
        { maker: filters.account }
      ),
      getTradesFromBlockchain(
        context, [quoteToken, baseToken], baseToken, quoteToken, filters.from, filters.to,
        { maker: filters.account }
      ),
      getTradesFromBlockchain(
        context, [baseToken, quoteToken], baseToken, quoteToken, filters.from, filters.to,
        { taker: filters.account }
      ),
      getTradesFromBlockchain(
        context, [quoteToken, baseToken], baseToken, quoteToken, filters.from, filters.to,
        { taker: filters.account }
      ),
    ) :
    merge(
      getTradesFromBlockchain(
        context, [baseToken, quoteToken], baseToken, quoteToken, filters.from, filters.to
      ),
      getTradesFromBlockchain(
        context, [quoteToken, baseToken], baseToken, quoteToken, filters.from, filters.to
      ),
    )
  ).pipe(
    reduce((a: Trade[], e: Trade[]) => a.concat(e), []),
    map(trades => trades.filter(t => t.baseAmount.gt(1e-9) && t.quoteAmount.gt(1e-9))),
    map(trades => trades.sort(compareTrades)),
  );
};

const getTradesFromBlockchain = (
  context: NetworkConfig,
  tokenPair: string[],
  baseToken: string,
  quoteToken: string,
  from: Date | undefined,
  to: Date | undefined,
  filters: { [key: string]: string } = {},
): Observable<Trade[]> => {
  const pair = web3.sha3(
    tokenPair.map(token => context.tokens[token].address.replace(/^0x/, '')).join(''),
    { encoding: 'hex' }
  );
  return onEveryBlock$.pipe(
    take(1),
    switchMap(block => {
      const fromBlock = Math.max(
        block - (
          from ?
          Math.floor(
            (new Date().getTime() - from.getTime()) / 1000 / 3600 / 24 * context.avgBlocksPerDay
          ) :
          30 * context.avgBlocksPerDay
        ),
        context.startingBlock,
      );
      const toBlock = to ? block - Math.floor(
        (new Date().getTime() - to.getTime()) / 1000 / 3600 / 24 * context.avgBlocksPerDay
      ) : 'latest';
      const filter = context.otc.contract.LogTake(
        {
          pair,
          ...filters,
        },
        {
          fromBlock,
          toBlock,
        },
      );
      return bindNodeCallback(filter.get.bind(filter))().pipe(
        map(events => events.map(
          ({
            args: { id, maker, give_amt, take_amt, pay_gem, timestamp },
            blockNumber, transactionHash,
          }) => {
            return parseTrade(
              filters.maker || filters.taker,
              context.tokens[baseToken].address, baseToken, quoteToken
            )({
              maker,
              offerId: id.toString(),
              bidAmt: amountFromWei(give_amt, tokenPair[1]).toString(),
              lotAmt: amountFromWei(take_amt, tokenPair[0]).toString(),
              bidGem: pay_gem,
              block: blockNumber, time: timestamp.toNumber() * 1000, tx: transactionHash,
            });
          }
        )),
      );
    }),
  );
};

export const getTrades = (
  context: NetworkConfig,
  baseToken: string,
  quoteToken: string,
  filters: {account?: string, from?: Date, to?: Date},
): Observable<Trade[]> => {
  const baseTokenAddress = context.tokens[baseToken].address;
  const quoteTokenAddress = context.tokens[quoteToken].address;
  const baseTokenGem = (web3 as any).toChecksumAddress(baseTokenAddress);
  const quoteTokenGem = (web3 as any).toChecksumAddress(quoteTokenAddress);
  const accountVal = filters.account ? (web3 as any).toChecksumAddress(filters.account) : null;

  const fields = ['offerId', 'maker', 'bidAmt', 'bidGem', 'lotAmt', 'block', 'time', 'tx'];
  const order = 'TIME_DESC';
  const filter = {
    or: [
      {
        and: [
          { lotGem: { equalTo: baseTokenGem } },
          { bidGem: { equalTo: quoteTokenGem } },
        ],
      },
      {
        and: [
          { lotGem: { equalTo: quoteTokenGem } },
          { bidGem: { equalTo: baseTokenGem } },
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

  return vulcan0x(context.oasisDataService.url, 'allOasisTrades', filter, fields, order).pipe(
    map(trades => trades.map(parseTrade(accountVal, quoteTokenGem, baseToken, quoteToken)))
  );
};

export function compareTrades({ time: t1 }: Trade, { time: t2 }: Trade) {
  return t2.getTime() - t1.getTime();
}
