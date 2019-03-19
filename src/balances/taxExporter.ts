import { curry } from 'lodash';
import { combineLatest, Observable } from 'rxjs';
import { flatMap, switchMap } from 'rxjs/operators';
import { proxyAddress$ } from '../blockchain/calls/instant';
import { NetworkConfig } from '../blockchain/config';
import { vulcan0x } from '../blockchain/vulcan0x';
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
      'proxyName'
    ],
    {
      filter: {
        or: [
          { maker: { in: addresses } },
          { taker: { in: addresses } },
          { cetFromAddress: { in: addresses } },
          { proxyFromAddress: { in: addresses } },
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
      return combineLatest(...context.taxProxyRegistries.map(curry(proxyAddress$)(context, address))).pipe(
        flatMap(proxyAddresses => {
          const addresses_all: string[] = [address, ...proxyAddresses].map((web3 as any).toChecksumAddress);
          return queryTrades(context, addresses_all);
        })
      );
    })
  );
}
