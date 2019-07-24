import { BigNumber } from 'bignumber.js';
import { combineLatest, Observable, of } from 'rxjs';
import { combineAll, mergeMap } from 'rxjs/internal/operators';
import { flatMap, map, switchMap } from 'rxjs/operators';
import { NetworkConfig } from '../blockchain/config';
import { Placeholder, vulcan0x } from '../blockchain/vulcan0x';

export interface TradeExport {
  sellAmount: string;
  buyAmount: string;
  buyToken: string;
  sellToken: string;
  date: string;
  address: string;
  tx: string;
  exchange: string;
}

function queryTrades(context: NetworkConfig, addresses: string[]) {
  const filter = {
    or: [
      { maker: { in: new Placeholder('addresses', '[String!]', addresses) } },
      { taker: { in: new Placeholder('addresses', '[String!]', addresses) } },
      { fromAddress: { in: new Placeholder('addresses', '[String!]', addresses) } },
    ]
  };
  const order = '[TIME_DESC]';
  const fields = ['offerId', 'maker', 'taker', 'quoteTkn', 'baseTkn', 'quoteAmt', 'baseAmt',
    'proxyName', 'proxyExecName', 'tx', 'time', 'type'];

  return vulcan0x<any>(
    context.oasisDataService.url,
    'allOasisTradeProxies',
    'allOasisTradeProxies',
    fields,
    {
      filter,
      order,
    }
  );
}

function getExchangeNameByProxy(proxyName: string, proxyExecName: string): Observable<string> {
  if (proxyName === '') return of('oasisdex.com');
  if (proxyName === 'ProxyCreationAndExecute') return of('oasis.direct');
  if (proxyName === 'SaiProxyCreateAndExecute') return of('cdp.makerdao.com');
  if (proxyName === 'DSProxy') {
    if (proxyExecName === 'OasisDirectProxy') return of('oasis.direct');
    if (proxyExecName === 'SaiProxyCreateAndExecute') return of('cdp.makerdao.com');
    if (proxyExecName === 'ProxyCreationAndExecute') return of('oasis.direct');
    return of('');
  }
  return of('');
}

function getTradeInfoWithProxy(
  { time, maker, quoteTkn, quoteAmt, baseTkn, baseAmt, tx, type, proxyName, proxyExecName }: any,
  address: string
): Observable<TradeExport> {
  const date: string = new Date(time).toLocaleString();
  const isMaker = address === maker;
  const buyAmount = (isMaker && type === 'buy') || (!isMaker && type === 'buy')
    ? new BigNumber(quoteAmt).toFormat(18)
    : new BigNumber(baseAmt).toFormat(18);
  const sellAmount = (isMaker && type === 'sell') || (!isMaker && type === 'sell')
    ? new BigNumber(quoteAmt).toFormat(18)
    : new BigNumber(baseAmt).toFormat(18);
  const buyToken = (isMaker && type === 'buy') || (!isMaker && type === 'buy')
    ? quoteTkn
    : baseTkn;
  const sellToken = (isMaker && type === 'sell') || (!isMaker && type === 'sell')
    ? quoteTkn
    : baseTkn;

  proxyName = proxyName === null ? '' : proxyName;
  proxyExecName = proxyExecName === null ? '' : proxyExecName;
  return getExchangeNameByProxy(proxyName, proxyExecName).pipe(
    map((exchange: string) => {
      return {
        buyAmount,
        buyToken,
        sellAmount,
        sellToken,
        date,
        address,
        tx,
        exchange
      } as TradeExport;
    })
  );
}

export function createTaxExport$(
  context$: Observable<NetworkConfig>,
  address$: Observable<string>
): Observable<TradeExport[]> {
  return combineLatest(context$, address$).pipe(
    switchMap(([context, address]) => {
      return of(address).pipe(
        flatMap(() => {
          return queryTrades(context, [address])
            .pipe(
            mergeMap((trades): Array<Observable<any>> => {
              if (trades.length) {
                return (trades.map((trade:any) => getTradeInfoWithProxy(trade, address)));
              }
              return [of('')];
            }),
            combineAll());
        })
      );
    })
  );
}
