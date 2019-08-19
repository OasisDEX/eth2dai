import { isEqual } from 'lodash';
import { curry } from 'ramda';
import * as React from 'react';
import { BehaviorSubject, combineLatest, interval, Observable } from 'rxjs';
import {
  distinctUntilChanged,
  filter,
  first,
  flatMap,
  map,
  shareReplay,
  switchMap
} from 'rxjs/operators';
import {
  AssetOverviewView,
  AssetsOverviewActionProps,
  AssetsOverviewExtraProps,
} from './balances/AssetOverviewView';
import {
  Balances,
  CombinedBalances,
  createBalances$,
  createCombinedBalances$,
  createDustLimits$, createProxyAllowances$,
  createWalletApprove,
  createWalletDisapprove,
  createWethBalances$,
} from './balances/balances';
import { createTaxExport$ } from './balances/taxExporter';
import { TaxExporterView } from './balances/TaxExporterView';
import { calls$, readCalls$ } from './blockchain/calls/calls';
import {
  account$,
  allowance$,
  context$,
  etherBalance$,
  etherPriceUsd$,
  gasPrice$,
  initializedAccount$,
  onEveryBlock$
} from './blockchain/network';
import { user$ } from './blockchain/user';
import { loadOrderbook$, Orderbook } from './exchange/orderbook/orderbook';
import {
  createTradingPair$,
  currentTradingPair$,
  loadablifyPlusTradingPair,
  memoizeTradingPair,
} from './exchange/tradingPair/tradingPair';

import { transactions$ } from './blockchain/transactions';
import {
  createAllTrades$,
  createTradesBrowser$,
  loadAllTrades,
  loadPriceDaysAgo,
  loadVolumeForThePastDay
} from './exchange/allTrades/allTrades';
import { AllTrades } from './exchange/allTrades/AllTradesView';
import {
  createDepthChartWithLoading$,
  DepthChartWithLoading,
} from './exchange/depthChart/DepthChartWithLoading';
import {
  createCurrentPrice$,
  createDailyVolume$,
  createMarketDetails$,
  createYesterdayPrice$,
  createYesterdayPriceChange$,
} from './exchange/exchange';
import { createMyClosedTrades$ } from './exchange/myTrades/closedTrades';
import {
  createMyCurrentTrades$,
  createMyTrades$,
  createMyTradesKind$,
} from './exchange/myTrades/myTrades';
import { MyTrades } from './exchange/myTrades/MyTradesView';
import { createMyOpenTrades$ } from './exchange/myTrades/openTrades';
import { createFormController$, OfferFormState } from './exchange/offerMake/offerMake';
import { OfferMakePanel } from './exchange/offerMake/OfferMakePanel';
import {
  createOrderbookForView,
  OrderbookView
} from './exchange/orderbook/OrderbookView';
import {
  createOrderbookPanel$,
  OrderbookPanel,
  OrderbookPanelProps,
  SubViewsProps
} from './exchange/OrderbookPanel';
import {
  GroupMode,
  loadAggregatedTrades,
  PriceChartDataPoint
} from './exchange/priceChart/pricechart';
import {
  createPriceChartLoadable$,
  PriceChartWithLoading
} from './exchange/priceChart/PriceChartWithLoading';
import { TradingPairView } from './exchange/tradingPair/TradingPairView';
import { createFooter$, TheFooter } from './footer/Footer';
import { Network } from './header/Network';
import { createFormController$ as createInstantFormController$ } from './instant/instantForm';
import { InstantViewPanel } from './instant/InstantViewPanel';
import { createTransactionNotifier$ } from './transactionNotifier/transactionNotifier';
import { TransactionNotifierView } from './transactionNotifier/TransactionNotifierView';
import { Authorizable, authorizablify } from './utils/authorizable';
import { connect } from './utils/connect';
import { inject } from './utils/inject';
import { Loadable, LoadableWithTradingPair, loadablifyLight, } from './utils/loadable';
import { withModal } from './utils/modal';
import { createWrapUnwrapForm$ } from './wrapUnwrap/wrapUnwrapForm';

export function setupAppContext() {

  const NetworkTxRx = connect(Network, context$);
  const TheFooterTxRx = connect(TheFooter, createFooter$(context$));

  const balances$ = createBalances$(context$, initializedAccount$, onEveryBlock$).pipe(
    shareReplay(1)
  );

  const combinedBalances$ = createCombinedBalances$(
    context$, initializedAccount$, etherBalance$,
    balances$, onEveryBlock$, etherPriceUsd$, transactions$
  ).pipe(
    shareReplay(1)
  );
  const balancesWithEth$ = combineLatest(balances$, etherBalance$).pipe(
    map(([balances, etherBalance]) => ({ ...balances, ETH: etherBalance })),
  );

  const wethBalance$ = createWethBalances$(context$, initializedAccount$, onEveryBlock$);

  const wrapUnwrapForm$ =
    curry(createWrapUnwrapForm$)(gasPrice$, etherPriceUsd$, etherBalance$, wethBalance$, calls$);

  const approve = createWalletApprove(calls$, gasPrice$);
  const disapprove = createWalletDisapprove(calls$, gasPrice$);

  const AssetOverviewViewRxTx =
    inject(
      withModal<AssetsOverviewActionProps, AssetsOverviewExtraProps>(
        connect<Authorizable<Loadable<CombinedBalances>>, AssetsOverviewExtraProps>(
          AssetOverviewView,
          authorizablify(() => loadablifyLight(combinedBalances$))
        )
      ),
      { approve, disapprove, wrapUnwrapForm$ }
    );

  const loadOrderbook = memoizeTradingPair(curry(loadOrderbook$)(context$, onEveryBlock$));
  const currentOrderbook$ = currentTradingPair$.pipe(
    switchMap(pair => loadOrderbook(pair))
  );

  const marketDetails$ = createMarketDetails$(
    memoizeTradingPair(curry(loadPriceDaysAgo)(0, context$, onEveryBlock$)),
    memoizeTradingPair(curry(loadPriceDaysAgo)(1, context$, onEveryBlock$)),
    onEveryBlock$,
  );

  const tradeHistory = memoizeTradingPair(
    curry(loadAllTrades)(context$, onEveryBlock$)
  );

  const currentTradeHistory$ = currentTradingPair$.pipe(
    switchMap(tradeHistory),
  );

  const lastDayVolume$ = currentTradingPair$.pipe(
    switchMap(memoizeTradingPair(
      curry(loadVolumeForThePastDay)(context$, onEveryBlock$)
    )),
  );

  const lastDayPriceHistory$ = currentTradingPair$.pipe(
    switchMap(memoizeTradingPair(
      curry(loadPriceDaysAgo)(1, context$, onEveryBlock$)
    )),
  );

  const currentTradesBrowser$ = loadablifyPlusTradingPair(
    currentTradingPair$,
    curry(createTradesBrowser$)(context$, tradeHistory),
  );

  const allTrades$ = createAllTrades$(currentTradesBrowser$, context$);
  const AllTradesTxRx = connect(AllTrades, allTrades$);

  const groupMode$: BehaviorSubject<GroupMode> = new BehaviorSubject<GroupMode>('byHour');

  const dataSources: {
    [key in GroupMode]: Observable<LoadableWithTradingPair<PriceChartDataPoint[]>>
  } = {
    byMonth: loadablifyPlusTradingPair(
      currentTradingPair$,
      memoizeTradingPair(
        curry(loadAggregatedTrades)(38, 'month', context$, onEveryBlock$.pipe(first()))
      )
    ),
    byWeek: loadablifyPlusTradingPair(
      currentTradingPair$,
      memoizeTradingPair(
        curry(loadAggregatedTrades)(38, 'week', context$, onEveryBlock$.pipe(first()))
      )
    ),
    byDay: loadablifyPlusTradingPair(
      currentTradingPair$,
      memoizeTradingPair(
        curry(loadAggregatedTrades)(38, 'day', context$, onEveryBlock$.pipe(first()))
      )
    ),
    byHour: loadablifyPlusTradingPair(
      currentTradingPair$,
      memoizeTradingPair(
        curry(loadAggregatedTrades)(38, 'hour', context$, onEveryBlock$)
      )
    ),
  };
  const priceChartLoadable = createPriceChartLoadable$(groupMode$, dataSources);
  const PriceChartWithLoadingTxRx = connect(PriceChartWithLoading, priceChartLoadable);

  const { OfferMakePanelTxRx, OrderbookPanelTxRx } =
    offerMake(currentOrderbook$, balances$);

  const myTradesKind$ = createMyTradesKind$();
  const myOpenTrades$ = loadablifyPlusTradingPair(
    currentTradingPair$,
    memoizeTradingPair(curry(createMyOpenTrades$)(loadOrderbook, account$, transactions$))
  );

  const myClosedTrades$ = loadablifyPlusTradingPair(
    currentTradingPair$,
    memoizeTradingPair(curry(createMyClosedTrades$)(account$, context$))
  );

  const myCurrentTrades$ = createMyCurrentTrades$(myTradesKind$, myOpenTrades$, myClosedTrades$);
  const myTrades$ = createMyTrades$(
    myTradesKind$,
    myCurrentTrades$,
    calls$, context$,
    gasPrice$,
    currentTradingPair$
  );
  const MyTradesTxRx = connect(MyTrades, myTrades$);

  const currentPrice$ = createCurrentPrice$(currentTradeHistory$);
  const yesterdayPrice$ = createYesterdayPrice$(lastDayPriceHistory$);
  const yesterdayPriceChange$ = createYesterdayPriceChange$(currentPrice$, yesterdayPrice$);
  const dailyVolume$ = createDailyVolume$(lastDayVolume$);

  const tradingPairView$ = createTradingPair$(
    currentTradingPair$,
    currentPrice$,
    yesterdayPriceChange$,
    dailyVolume$,
    marketDetails$,
  );
  const TradingPairsTxRx = connect(TradingPairView, tradingPairView$);

  const transactionNotifier$ =
    createTransactionNotifier$(transactions$, interval(5 * 1000), context$);
  const TransactionNotifierTxRx = connect(TransactionNotifierView, transactionNotifier$);

  const proxyAddress$ = onEveryBlock$.pipe(
    switchMap(() =>
      calls$.pipe(
        flatMap(calls => calls.proxyAddress())
      )),
    distinctUntilChanged(isEqual)
  );

  const instant$ = createInstantFormController$(
    {
      gasPrice$,
      calls$,
      readCalls$,
      etherPriceUsd$,
      etherBalance$,
      proxyAddress$,
      user$,
      context$,
      balances$: balancesWithEth$,
      dustLimits$: createDustLimits$(context$),
      allowances$: createProxyAllowances$(
        context$,
        initializedAccount$,
        proxyAddress$.pipe(
          filter(address => !!address)
        ),
        onEveryBlock$
      ),
    }
  );

  const InstantTxRx = connect(InstantViewPanel, loadablifyLight(instant$));

  const TaxExporterTxRx = inject(TaxExporterView, {
    export: () => createTaxExport$(context$, initializedAccount$)
  });

  return {
    AllTradesTxRx,
    AssetOverviewViewRxTx,
    MyTradesTxRx,
    OfferMakePanelTxRx,
    OrderbookPanelTxRx,
    InstantTxRx,
    PriceChartWithLoadingTxRx,
    TradingPairsTxRx,
    TransactionNotifierTxRx,
    NetworkTxRx,
    TheFooterTxRx,
    TaxExporterTxRx
  };
}

function offerMake(
  orderbook$: Observable<Orderbook>,
  balances$: Observable<Balances>
) {
  const offerMake$: Observable<OfferFormState> = currentTradingPair$.pipe(
    switchMap(tp => createFormController$(
      {
        gasPrice$,
        allowance$,
        calls$,
        etherPriceUsd$,
        orderbook$,
        balances$,
        user$,
        dustLimits$: createDustLimits$(context$),
      },
      tp)
    ),
    shareReplay(1)
  );

  const offerMakeLoadable$ = loadablifyLight(offerMake$);
  const OfferMakePanelTxRx = connect(OfferMakePanel, offerMakeLoadable$);

  const [kindChange, orderbookPanel$] = createOrderbookPanel$();

  const depthChartWithLoading$ = createDepthChartWithLoading$(
    offerMake$,
    orderbook$,
    kindChange
  );
  const DepthChartWithLoadingTxRx = connect(DepthChartWithLoading, depthChartWithLoading$);

  const orderbookForView$ = createOrderbookForView(
    orderbook$,
    offerMake$,
    kindChange,
  );
  const OrderbookViewTxRx = connect(OrderbookView, orderbookForView$);

  const OrderbookPanelTxRx = connect(
    inject<OrderbookPanelProps, SubViewsProps>(
      OrderbookPanel,
      { DepthChartWithLoadingTxRx, OrderbookViewTxRx }),
    orderbookPanel$);

  return {
    OfferMakePanelTxRx,
    OrderbookPanelTxRx
  };
}

export type AppContext = ReturnType<typeof setupAppContext>;

export const theAppContext = React.createContext<AppContext>(undefined as any as AppContext);
