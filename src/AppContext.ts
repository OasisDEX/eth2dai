import * as React from 'react';
import { BehaviorSubject, combineLatest, interval, Observable } from 'rxjs';
import { first, flatMap, map, shareReplay, switchMap } from 'rxjs/operators';

import { curry } from 'ramda';
import { AssetOverviewView, AssetsOverviewActionProps, AssetsOverviewExtraProps } from './balances/AssetOverviewView';
import {
  Balances,
  CombinedBalances,
  createBalances$,
  createCombinedBalances$,
  createDustLimits$,
  createWalletApprove,
  createWalletDisapprove,
  createWethBalances$,
} from './balances/balances';
import { createTaxExport$ } from './balances/taxExporter';
import { TaxExporterView } from './balances/TaxExporterView';
import { calls$ } from './blockchain/calls/calls';
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
import { createPickableOrderBookFromOfferMake$, loadOrderbook$, Orderbook } from './exchange/orderbook/orderbook';
import {
  createTradingPair$,
  currentTradingPair$,
  loadablifyPlusTradingPair,
  memoizeTradingPair,
} from './exchange/tradingPair/tradingPair';

import { transactions$ } from './blockchain/transactions';
import { createAllTrades$, createTradesBrowser$, loadAllTrades } from './exchange/allTrades/allTrades';
import { AllTrades } from './exchange/allTrades/AllTradesView';
import { createDepthChartWithLoading$, DepthChartWithLoading } from './exchange/depthChart/DepthChartWithLoading';
import {
  createCurrentPrice$,
  createDailyVolume$,
  createYesterdayPrice$,
  createYesterdayPriceChange$,
} from './exchange/exchange';
import { createMyClosedTrades$ } from './exchange/myTrades/closedTrades';
import { createMyCurrentTrades$, createMyTrades$, createMyTradesKind$ } from './exchange/myTrades/myTrades';
import { MyTrades } from './exchange/myTrades/MyTradesView';
import { createMyOpenTrades$ } from './exchange/myTrades/openTrades';
import { createFormController$, OfferFormState } from './exchange/offerMake/offerMake';
import { OfferMakePanel } from './exchange/offerMake/OfferMakePanel';
import { OrderbookView } from './exchange/orderbook/OrderbookView';
import { createOrderbookPanel$, OrderbookPanel, OrderbookPanelProps, SubViewsProps } from './exchange/OrderbookPanel';
import { GroupMode, loadAggregatedTrades, PriceChartDataPoint } from './exchange/priceChart/pricechart';
import { createPriceChartLoadable$, PriceChartWithLoading } from './exchange/priceChart/PriceChartWithLoading';
import { TradingPairView } from './exchange/tradingPair/TradingPairView';
import { createFooter$, TheFooter } from './footer/Footer';
import { Network } from './header/Network';
import { createFormController$ as createInstantFormController$ } from './instant/instantForm';
import { InstantViewPanel } from './instant/InstantViewPanel';
import { createTransactionNotifier$ } from './transactionNotifier/transactionNotifier';
import { TransactionNotifierView } from './transactionNotifier/TransactionNotifierView';
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
  balancesWithEth$.subscribe(console.log);

  const wethBalance$ = createWethBalances$(context$, initializedAccount$, onEveryBlock$);

  const wrapUnwrapForm$ =
    curry(createWrapUnwrapForm$)(gasPrice$, etherPriceUsd$, etherBalance$, wethBalance$, calls$);

  const approve = createWalletApprove(calls$, gasPrice$);
  const disapprove = createWalletDisapprove(calls$, gasPrice$);

  const AssetOverviewViewRxTx =
    inject(
      withModal<AssetsOverviewActionProps, AssetsOverviewExtraProps>(
        connect<Loadable<CombinedBalances>, AssetsOverviewExtraProps>(
          AssetOverviewView,
          loadablifyLight(combinedBalances$)
        )
      ),
      { approve, disapprove, wrapUnwrapForm$ }
    );

  const loadOrderbook = memoizeTradingPair(curry(loadOrderbook$)(context$, onEveryBlock$));
  const currentOrderBookWithTradingPair$ = loadablifyPlusTradingPair(
    currentTradingPair$,
    loadOrderbook
  );
  const currentOrderbook$ = currentTradingPair$.pipe(
    switchMap(pair => loadOrderbook(pair))
  );

  const tradeHistory = memoizeTradingPair(
    curry(loadAllTrades)(context$, onEveryBlock$)
  );
  const currentTradeHistory$ = currentTradingPair$.pipe(
    switchMap(tradeHistory),
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
    offerMake(currentOrderbook$, currentOrderBookWithTradingPair$, balances$);

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
  const myTrades$ = createMyTrades$(myTradesKind$, myCurrentTrades$, calls$, context$, gasPrice$);
  const MyTradesTxRx = connect(MyTrades, myTrades$);

  const currentPrice$ = createCurrentPrice$(currentTradeHistory$);
  const yesterdayPrice$ = createYesterdayPrice$(currentTradeHistory$);
  const yesterdayPriceChange$ = createYesterdayPriceChange$(currentPrice$, yesterdayPrice$);
  const weeklyVolume$ = createDailyVolume$(currentTradeHistory$);

  const tradingPairView$ = createTradingPair$(
    currentTradingPair$,
    currentPrice$,
    yesterdayPriceChange$,
    weeklyVolume$);
  const TradingPairsTxRx = connect(TradingPairView, tradingPairView$);

  const transactionNotifier$ =
    createTransactionNotifier$(transactions$, interval(5 * 1000));
  const TransactionNotifierTxRx = connect(TransactionNotifierView, transactionNotifier$);

  // const proxyAddress$ = createProxy$(context$, initializedAccount$, onEveryBlock$, calls$);

  const instant$ = createInstantFormController$(
    {
      gasPrice$,
      allowance$,
      calls$,
      etherPriceUsd$,
      balances$,
      etherBalance$,
      // proxyAddress$,
      dustLimits$: createDustLimits$(context$),
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
  orderbookWithTradingPair$: Observable<LoadableWithTradingPair<Orderbook>>,
  balances$: Observable<Balances>
) {
  const offerMake$: Observable<OfferFormState> = currentTradingPair$.pipe(
    flatMap(tp => createFormController$(
      {
        gasPrice$,
        allowance$,
        calls$,
        etherPriceUsd$,
        orderbook$,
        balances$,
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
    orderbookWithTradingPair$,
    currentTradingPair$,
    kindChange
  );
  const DepthChartWithLoadingTxRx = connect(DepthChartWithLoading, depthChartWithLoading$);

  const pickableOrderbook$ = createPickableOrderBookFromOfferMake$(
    orderbookWithTradingPair$,
    account$,
    offerMake$,
    kindChange
  );
  const OrderbookViewTxRx = connect(OrderbookView, pickableOrderbook$);

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
