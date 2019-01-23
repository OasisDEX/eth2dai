import * as React from 'react';
import { BehaviorSubject, Observable } from 'rxjs';

import { map } from 'rxjs/operators';
import { Button } from '../utils/forms/Buttons';
import { PanelHeader } from '../utils/panel/Panel';
import { ZoomChange } from './depthChart/depthchart';

export enum OrderbookViewKind {
  depthChart = 'depthChart',
  list = 'list'
}

export interface OrderbookPanelProps {
  kind: OrderbookViewKind;
  kindChange: (kind: OrderbookViewKind) => void;
  zoomChange: (change: ZoomChange) => void;
}

export interface SubViewsProps {
  DepthChartWithLoadingTxRx : React.ComponentType;
  OrderbookViewTxRx: React.ComponentType;
}

const btnStyles = {
  marginRight: '0.7em',
  padding: 0,
  width: '30px',
  height: '30px',
  fill: 'white'
};

export class OrderbookPanel extends React.Component<OrderbookPanelProps & SubViewsProps> {
  public render() {
    return (
      <div style={{ width: this.props.kind === OrderbookViewKind.depthChart ? '508px' : '452px' }}>
        <PanelHeader bordered={this.props.kind === OrderbookViewKind.depthChart}>
          <span>
            {
              this.props.kind === OrderbookViewKind.depthChart ?
              'Depth chart' : 'Order book'
            }
          </span>
          <div style={{ marginLeft: 'auto', display: 'flex' }}>
            {this.props.kind === OrderbookViewKind.depthChart &&
              <div>
                <Button style={btnStyles} onClick={this.zoomOut}><MinusBtn /></Button>
                <Button style={btnStyles} onClick={this.zoomIn}><PlusBtn /></Button>
              </div>
            }
            <Button
              style={btnStyles}
              onClick={this.changeChartListView}
              data-test-id={`orderbook-type-${this.props.kind}`}
            >
              <ChartListSwitchBtn />
            </Button>
          </div>
        </PanelHeader>
          {
            this.props.kind === OrderbookViewKind.depthChart ?
              <this.props.DepthChartWithLoadingTxRx/> :
              <this.props.OrderbookViewTxRx/>
          }
      </div>
    );
  }

  private zoomIn = () => {
    this.props.zoomChange('zoomIn');
  }

  private zoomOut = () => {
    this.props.zoomChange('zoomOut');
  }

  private changeChartListView = () => {
    this.props.kindChange(this.props.kind === OrderbookViewKind.depthChart ?
      OrderbookViewKind.list : OrderbookViewKind.depthChart);
  }
}

export class MinusBtn extends React.PureComponent {
  public render() {
    return (
      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24">
        <path d="M19 13H5v-2h14v2z"/>
        <path d="M0 0h24v24H0z" fill="none"/>
      </svg>
    );
  }
}

export class PlusBtn extends React.PureComponent {
  public render() {
    return (
      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24">
        <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/>
        <path d="M0 0h24v24H0z" fill="none"/>
      </svg>
    );
  }
}

export class ChartListSwitchBtn extends React.PureComponent {
  public render() {
    return (
      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24">
        <path d="M3 13h2v-2H3v2zm0 4h2v-2H3v2zm0-8h2V7H3v2zm4 4h14v-2H7v2zm0 4h14v-2H7v2zM7 7v2h14V7H7z"/>
        <path d="M0 0h24v24H0z" fill="none"/>
      </svg>
    );
  }
}

export function createOrderbookPanel$(
  zoomChange: (change: ZoomChange) => void
): Observable<OrderbookPanelProps> {

  const kind$ = new BehaviorSubject(OrderbookViewKind.list);

  return kind$.pipe(
    map(kind => ({
      kind,
      zoomChange,
      kindChange: kind$.next.bind(kind$)
    }))
  );
}
