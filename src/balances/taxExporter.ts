import { combineLatest, Observable, of } from 'rxjs';
import { flatMap, switchMap } from 'rxjs/operators';
import { NetworkConfig } from '../blockchain/config';
import { Placeholder, vulcan0x } from '../blockchain/vulcan0x';
import { web3 } from '../blockchain/web3';

function queryTrades(context: NetworkConfig, addresses: string[]) {
  return vulcan0x<any>(
    context.oasisDataService.url,
    'allTradesWithProxy',
    'allOasisTradesWithProxies',
    [
      'offerId',
      'act',
      'maker',
      'taker',
      'bidAmt',
      'bidTkn',
      'lotAmt',
      'lotTkn',
      'time',
      'tx',
      'proxyAddress',
      'proxyName',
      'tag'
    ],
    {
      filter: {
        or: [
          { maker: { in: new Placeholder('addresses', '[String!]', addresses) } },
          { taker: { in: new Placeholder('addresses', '[String!]', addresses) } },
          { cetFromAddress: { in: new Placeholder('addresses', '[String!]', addresses) } },
          { proxyFromAddress: { in: new Placeholder('addresses', '[String!]', addresses) } },
        ]
      }
    }
  );
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
          return queryTrades(context, [owner_address]);
        })
      );
    })
  );
}
