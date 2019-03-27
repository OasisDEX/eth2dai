import { BigNumber } from 'bignumber.js';
import { combineLatest, Observable, of } from 'rxjs';
import { flatMap, map, switchMap } from 'rxjs/operators';
import { NetworkConfig } from '../blockchain/config';
import { Placeholder, vulcan0x } from '../blockchain/vulcan0x';
import { web3 } from '../blockchain/web3';

interface TradeWithProxy {
  offerId: BigNumber;
  maker: string; // Offer creator address
  lotAmt: BigNumber; // Lot amount
  lotTkn: string; // Lot token
  bidAmt: BigNumber; // Bid amount
  bidTkn: string; // Bid token
  time: Date; // Block timestamp
  tx?: string; // Transaction hash
  tag: string; // Proxy tag
}

function queryTrades(context: NetworkConfig, addresses: string[]) {

  const filter = {
    or: [
          { maker: { in: new Placeholder('addresses', '[String!]', addresses) } },
          { taker: { in: new Placeholder('addresses', '[String!]', addresses) } },
          { cetFromAddress: { in: new Placeholder('addresses', '[String!]', addresses) } },
          { proxyFromAddress: { in: new Placeholder('addresses', '[String!]', addresses) } },
    ]
  };
  const order = '[TIME_DESC]';
  const fields = ['offerId', 'act', 'maker', 'taker', 'bidAmt', 'bidTkn', 'lotAmt', 'lotTkn', 'time', 'tx',
    'proxyAddress', 'proxyName', 'tag'];

  return vulcan0x<any>(
    context.oasisDataService.url,
    'allTradesWithProxy',
    'allOasisTradesWithProxies',
    fields,
    {
      filter,
      order
    }
  );
}

function parseTrade({ time, maker, lotAmt, lotTkn, bidAmt, bidTkn, tx }: TradeWithProxy, address: string) {
  const date: string = new Date(time).toLocaleString().replace(',', '');
  const buyAmount = address === maker ? lotAmt : bidAmt;
  const sellAmount = address === maker ? bidAmt : lotAmt;
  const buyToken = address === maker ? bidTkn : lotTkn;
  const sellToken = address === maker ? lotTkn : bidTkn;

  return {
    sellAmount,
    buyToken,
    buyAmount,
    sellToken,
    date,
    address,
    tx
  };
}

export function createTaxExport$(
  context$: Observable<NetworkConfig>,
  address$: Observable<string>
) {
  return combineLatest(context$, address$).pipe(
    switchMap(([context, address]) => {
      return of(address).pipe(
        flatMap(owner_address => {
          owner_address = (web3 as any).toChecksumAddress(owner_address);
          return queryTrades(context, [owner_address]).pipe(
            map(trades => trades.map((trade) => parseTrade(trade, owner_address)))
          );
        })
      );
    })
  );
}
