import { BigNumber } from 'bignumber.js';
import { curry } from 'lodash';
import { combineLatest, Observable } from 'rxjs';
import { flatMap, switchMap } from 'rxjs/operators';
import { proxyAddress$ } from '../blockchain/calls/instant';
import { NetworkConfig } from '../blockchain/config';
import { vulcan0x } from '../blockchain/vulcan0x';
import { web3 } from '../blockchain/web3';

export interface TaxExportItem {
  buyAmount: BigNumber;
  buyToken: string;
  sellAmount: BigNumber;
  sellToken: string;
  tx: string;
  source: string;
  timestamp: Date;
}

export type TaxExport = TaxExportItem[];

function queryTrades(context: NetworkConfig, addresses: string[]) {
  return vulcan0x<any>(
    context.oasisDataService.url,
    'taxExporter',
    'allOasisTrades',
    [
      'offerId',
      'act',
      'maker',
      'taker',
      'bidAmt',
      'bidTkn',
      'bidGem',
      'lotAmt',
      'lotTkn',
      'lotGem',
      'price',
      'time',
      'tx'
    ],
    {
      filter: {
        or: [
          { maker: { in: addresses } },
          { taker: { in: addresses } },
        ]
      }
    }
  );
}

export function createTaxExport$(
  context$: Observable<NetworkConfig>,
  address$: Observable<string>
) { // : Observable<TaxExport>
  return combineLatest(context$, address$).pipe(
    switchMap(([context, address]) => {
      console.log(context, address);
      return combineLatest(...context.taxProxyRegistries.map(curry(proxyAddress$)(context, address))).pipe(
        flatMap(proxyAddresses => {
          const addresses: string[] = [address, ...proxyAddresses].map((web3 as any).toChecksumAddress);
          return queryTrades(context, addresses);
        })
      );
    })
  );
}
