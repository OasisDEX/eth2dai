import { BigNumber } from 'bignumber.js';
import * as React from 'react';
import { combineLatest, Observable } from 'rxjs';
import { filter } from 'rxjs/internal/operators';
import { map } from 'rxjs/operators';

import { OfferMatchType } from '../../utils/form';
import { LoadableWithTradingPair } from '../../utils/loadable';
import { WithLoadingIndicator } from '../../utils/loadingIndicator/LoadingIndicator';
import { PanelHeader } from '../../utils/panel/Panel';
import { OfferType, Orderbook } from '../orderbook/orderbook';
import { OrderbookViewKind } from '../OrderbookPanel';
import { TradingPair } from '../tradingPair/tradingPair';
import { createZoom$, ZoomChange } from './depthchart';
import { DepthChartView } from './DepthChartView';
import * as styles from './DepthChartView.scss';

type DepthChartProps = LoadableWithTradingPair<Orderbook> & {
  kind: OfferType;
  matchType: OfferMatchType;
  amount?: BigNumber;
  price?: BigNumber;
  zoom: BigNumber;
  base?: string;
  quote?: string;
  zoomChange: (change: ZoomChange) => void;
  kindChange: (kind: OrderbookViewKind) => void;
};

export class DepthChartWithLoading extends React.Component<DepthChartProps> {
  public render() {
    if (this.props.status === 'loaded') {
      const orderbook = this.props.value as Orderbook;
      return (
        <div className={styles.depthChartWithLoading}>
          <DepthChartView  orderbook={orderbook}
                           kind={this.props.kind}
                           amount={this.props.amount}
                           price={this.props.price}
                           zoom={this.props.zoom}
                           base={this.props.base}
                           quote={this.props.quote}
                           matchType={this.props.matchType}
                           zoomChange={this.props.zoomChange}
                           kindChange={this.props.kindChange}
          />
        </div>
      );
    }

    return (
      <div className={styles.depthChartWithLoading}>
        <PanelHeader bordered={true}>
          <span>Depth chart</span>
        </PanelHeader>
        <WithLoadingIndicator loadable={this.props}>
          { (_orderbook: Orderbook) => (<div />)}
      </WithLoadingIndicator>
      </div>
    );
  }

}

export interface FormState {
  kind: OfferType;
  matchType: OfferMatchType;
  amount?: BigNumber;
  price?: BigNumber;
  // change: ()
}

export function createDepthChartWithLoading$(
  currentOfferForm$: Observable<FormState>,
  orderbook$: Observable<LoadableWithTradingPair<Orderbook>>,
  tradingPair$: Observable<TradingPair>,
  kindChange: (kind: OrderbookViewKind) => void,
): Observable<DepthChartProps> {

  const [zoomChange, zoom$] = createZoom$(
    tradingPair$,
    orderbook$.pipe(
      filter(o => o.status === 'loaded'),
      map(o => o.value!)
    )
  );

  return combineLatest(
    currentOfferForm$,
    orderbook$,
    zoom$,
    tradingPair$,
  ).pipe(
    map(([
      { kind, matchType, amount, price },
      orderbook,
      zoom,
      { base, quote }]: any
    ) => {
      return {
        ...orderbook,
        zoom,
        zoomChange,
        base,
        quote,
        kind,
        matchType,
        amount,
        price,
        kindChange,
      };
    })
  );
}
