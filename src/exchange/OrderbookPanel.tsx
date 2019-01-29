import * as React from 'react';
import { Observable } from 'rxjs';

import { BehaviorSubject } from 'rxjs/internal/BehaviorSubject';
import { map } from 'rxjs/operators';

export enum OrderbookViewKind {
  depthChart = 'depthChart',
  list = 'list'
}

export interface OrderbookPanelProps {
  kind: OrderbookViewKind;
}

export interface SubViewsProps {
  DepthChartWithLoadingTxRx : React.ComponentType;
  OrderbookViewTxRx: React.ComponentType;
}

export class OrderbookPanel extends React.Component<OrderbookPanelProps & SubViewsProps> {
  public render() {
    if (this.props.kind === OrderbookViewKind.depthChart) {
      return (<this.props.DepthChartWithLoadingTxRx/>);
    }
    return (<this.props.OrderbookViewTxRx/>);
  }
}

export function createOrderbookPanel$(): [
  (kind: OrderbookViewKind) => void,
  Observable<OrderbookPanelProps>
] {
  const kind$ = new BehaviorSubject(OrderbookViewKind.list);
  return [
    kind$.next.bind(kind$),
    kind$.pipe(
      map(kind => ({
        kind,
      }))
    )
  ];
}
