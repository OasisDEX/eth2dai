import { curry, fromPairs, isEqual, toPairs } from 'lodash';
import * as moment from 'moment';
import { BehaviorSubject, bindNodeCallback, combineLatest, Observable } from 'rxjs';
import { ajax } from 'rxjs/ajax';
import { takeWhile } from 'rxjs/internal/operators';
import {
  distinctUntilChanged,
  exhaustMap,
  filter,
  map,
  switchMap,
  take,
  tap
} from 'rxjs/operators';
import { Error } from 'tslint/lib/error';
import { NetworkConfig } from './config';
import { web3 } from './web3';

function filterize(f: any): string {
  switch (typeof(f)) {
    case 'number':
      return `${f}`;
    case 'string':
      return `"${f}"`;
    case 'object':
      return f.length === undefined ?
        '{' + toPairs(f).map(([k, v]) => `${k}: ${filterize(v)}`).join(', ') + '}' :
        '[' + (f as []).map((v: any) => filterize(v)).join(', ') + ']';
    default:
      throw new Error(`unknown filter type: ${typeof(f)}`);
  }
}

export function vulcan0x(
  url: string, resource: string, params: {[key: string]: any},
  theFilter: any, fields: string[], order: string|undefined
): Observable<any[]> {
  const options = toPairs({
    ...fromPairs(toPairs(params).map(([k, v]) => [k, filterize(v)]) as any),
    filter: filterize(theFilter),
    ...order ? { orderBy: order } : {} }
  ).map(([k, v]) => `${k}: ${v}`).join('\n');
  return ajax({
    url,
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: {
      query:
      '{\n' +
      `    ${resource}(\n${options}\n){\n` +
      `      nodes { ${fields.join(' ')} }\n` +
      '    }\n' +
      '}'
    }
  }).pipe(
    map(({ response }) => {
      if (response.errors && response.errors[0]) {
        console.log('vulcan0x error', response.errors[0]);
        throw new Error(response.errors[0].message);
      }
      return (Object.values(response.data)[0] as {nodes: any[]}).nodes;
    })
  );
}

const blockStep = 100;

function logTakes$(context: NetworkConfig, block: number) {
  const pair = web3.sha3(
    ['WETH', 'DAI'].map(token => context.tokens[token].address.replace(/^0x/, '')).join(''),
    { encoding: 'hex' }
  );
  const logTake = context.otc.contract.LogTake(
    { pair },
    {
      fromBlock: Math.max(0, block - blockStep + 1),
      toBlock: block
    }
  );

  return bindNodeCallback(logTake.get.bind(logTake))();
}

function createBlocks$(latestBlock: number, step: number): [Observable<number>, () => void] {
  const current = new BehaviorSubject(latestBlock);

  function nextBlock() {
    setTimeout(() => current.next(current.getValue() - step), 0);
  }

  return [
    current.pipe(
      takeWhile(block => block >= 0)
    ),
    nextBlock
  ];
}

export function createVulcan0xDelay$(
  context$: Observable<NetworkConfig>,
  onEveryBlock$: Observable<number>
) {
  const networkLastTradeBlock$ = combineLatest(context$, onEveryBlock$).pipe(
    exhaustMap(([context, latestBlock]) => {

      const [blocks$, nextBlock] = createBlocks$(latestBlock, blockStep);

      return blocks$.pipe(
        exhaustMap(curry(logTakes$)(context)),
        tap(events =>  events.length === 0 && nextBlock()),
        filter(events => events.length !== 0),
        take(1),
        map((events) => {
          const last = events[events.length - 1];
          return {
            block: last.blockNumber,
            time: moment.unix(last.args.timestamp.toNumber()).toDate(),
            tx: last.transactionHash,
            idx: last.logIndex
          };
        }),
      );
    }),
    distinctUntilChanged(isEqual)
  );
  const vulcanLastTradeBlock$ = combineLatest(context$, onEveryBlock$).pipe(
    switchMap(([context]) =>
      vulcan0x(
        context.oasisDataService.url,
        'allOasisTrades',
        { first: 1 },
        { market: { equalTo: 'WETHDAI' } },
        ['offerId', 'block', 'time', 'tx', 'idx'],
        `[BLOCK_DESC, IDX_DESC]`,
      ).pipe(
        map(([{ block, time, tx, idx }]) => ({ block, tx, idx, time: new Date(time) })),
      )
    ),
    distinctUntilChanged(isEqual)
  );

  return combineLatest(vulcanLastTradeBlock$, networkLastTradeBlock$).pipe(
    tap(([vulcan, network]) => {

      const diff = network.block - vulcan.block;

      if (diff > 0) {
        console.log('Vulcan is behind!');
        console.log('vulcan', vulcan);
        console.log('network', network);
      }

      if (diff < 0) {
        console.log('Network is behind! Very strange...');
        console.log('vulcan', vulcan);
        console.log('network', network);
      }
    })
  );
}
