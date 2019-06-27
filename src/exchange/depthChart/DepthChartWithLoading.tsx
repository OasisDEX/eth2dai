import { BigNumber } from 'bignumber.js';
import * as React from 'react';
import { combineLatest, Observable } from 'rxjs';
import { distinctUntilChanged, map } from 'rxjs/operators';

import { OfferMatchType } from '../../utils/form';
import { Loadable, loadablifyLight } from '../../utils/loadable';
import { WithLoadingIndicator } from '../../utils/loadingIndicator/LoadingIndicator';
import { PanelHeader } from '../../utils/panel/Panel';
import { OfferType, Orderbook } from '../orderbook/orderbook';
import { OrderbookViewKind } from '../OrderbookPanel';
import { createZoom$, ZoomChange } from './depthchart';
import { DepthChartView } from './DepthChartView';
import * as styles from './DepthChartView.scss';

type DepthChartProps = Loadable<Orderbook> & {
  kind: OfferType;
  matchType: OfferMatchType;
  amount?: BigNumber;
  price?: BigNumber;
  zoom: BigNumber;
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
                           base={orderbook.tradingPair.base}
                           quote={orderbook.tradingPair.quote}
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
  orderbook$: Observable<Orderbook>,
  kindChange: (kind: OrderbookViewKind) => void,
): Observable<DepthChartProps> {

  const [zoomChange, zoom$] = createZoom$(
    orderbook$.pipe(
      map(orderbook => orderbook.tradingPair),
      distinctUntilChanged(),
    ),
    orderbook$
  );

  return combineLatest(
    currentOfferForm$,
    loadablifyLight(orderbook$),
    zoom$,
  ).pipe(
    map(([
      { kind, matchType, amount, price },
      orderbook,
      zoom,
    ]) => {
      return {
        ...orderbook,
        zoom,
        zoomChange,
        kind,
        matchType,
        amount,
        price,
        kindChange,
      };
    })
  );
}
