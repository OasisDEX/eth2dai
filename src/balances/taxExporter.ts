import { BigNumber } from 'bignumber.js';
import { combineLatest, Observable, of } from 'rxjs';
import { bindNodeCallback } from 'rxjs/index';
import { combineAll, mergeMap } from 'rxjs/internal/operators';
import { flatMap, map, switchMap } from 'rxjs/operators';
import { NetworkConfig } from '../blockchain/config';
import { Placeholder, vulcan0x } from '../blockchain/vulcan0x';
import { web3 } from '../blockchain/web3';

const abiDecoder = require('abi-decoder');
const DSProxyAbi = require('../blockchain/abi/ds-proxy.abi.json');

export interface TradeExport {
  sellAmount: BigNumber;
  buyAmount: BigNumber;
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

const contracts: { [index: string]: string } = {
  '0x793ebbe21607e4f04788f89c7a9b97320773ec59': 'ProxyCreationAndExecute',
  '0xb0a00896f34655edff6c8d915fb342194c4a6d48': 'ProxyCreationAndExecute',
  '0xd64979357160e8146f6e1d805cf20437397bf1ba': 'SaiProxyCreateAndExecute',
  '0x526af336d614ade5cc252a407062b8861af998f5': 'SaiProxyCreateAndExecute',
  '0x279594b6843014376a422ebb26a6eab7a30e36f0': 'OasisDirectProxy',
};

function getExchangeNameByProxy(proxyName: string | null, tx: string): Observable<string> {
  if (proxyName === '' || proxyName === null) {
    return of('oasisdex.com');
  }
  if (proxyName === 'ProxyCreationAndExecute') {
    return of('oasis.direct');
  }
  if (proxyName === 'SaiProxyCreateAndExecute') {
    return of('cdp.makerdao.com');
  }
  if (proxyName === 'DSProxy') {
    return bindNodeCallback((web3 as any).eth.getTransaction)(tx).pipe(
      map((transaction: any) => {
        abiDecoder.addABI(DSProxyAbi);
        const transactionData = abiDecoder.decodeMethod(transaction.input);
        const contract_name = contracts[transactionData.params[0].value];

        if (contract_name && contract_name === 'OasisDirectProxy') return 'oasis.direct';
        if (contract_name && contract_name === 'SaiProxy') return 'cdp.makerdao.com';
        return transactionData.params[0].value;
      })
    );
  }
  return of('');
}

function getTradeInfoWithProxy({ time, maker, lotAmt, lotTkn, bidAmt, bidTkn, tx, tag }: any, address: string)
  :Observable<TradeExport> {

  const date: string = new Date(time).toLocaleString().replace(',', '');
  const buyAmount = address === maker ? lotAmt : bidAmt;
  const sellAmount = address === maker ? bidAmt : lotAmt;
  const buyToken = address === maker ? bidTkn : lotTkn;
  const sellToken = address === maker ? lotTkn : bidTkn;

  return getExchangeNameByProxy(tag, String(tx)).pipe(
    map((exchange: string) => {
      return {
        sellAmount,
        buyToken,
        buyAmount,
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
          address = (web3 as any).toChecksumAddress(address);
          return (queryTrades(context, [address]).pipe(
            mergeMap((trades): Array<Observable<any>> => {
              if (trades.length) {
                return (trades.map((trade:any) => getTradeInfoWithProxy(trade, address)));
              }
              return [of('')];
            }),
            combineAll()
          ));
        })
      );
    })
  );
}
