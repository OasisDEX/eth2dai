import * as React from 'react';
import { BehaviorSubject, Observable } from 'rxjs';
import { map, switchMap } from 'rxjs/operators';

import classnames from 'classnames';
import { Button, ButtonGroup } from '../../utils/forms/Buttons';
import { LoadableWithTradingPair } from '../../utils/loadable';
import { WithLoadingIndicator } from '../../utils/loadingIndicator/LoadingIndicator';
import { PanelHeader } from '../../utils/panel/Panel';
import {
  GroupMode, PriceChartDataPoint,
} from './pricechart';
import { PriceChartView } from './PriceChartView';

import * as styles from './PriceChartWithLoading.scss';

interface PriceChartProps extends LoadableWithTradingPair<PriceChartDataPoint[]> {
  groupMode: GroupMode;
  groupMode$: BehaviorSubject<GroupMode>;
}

export class PriceChartWithLoading extends React.Component<PriceChartProps> {
  public handleKindChange = (groupMode: GroupMode) =>
    () => {
      this.props.groupMode$.next(groupMode);
    }

  public render() {
    return (
      <div>
        <PanelHeader bordered={true}>
          Price chart
          <ButtonGroup style={{ marginLeft: 'auto' }}>
            <Button
              className={classnames(styles.btn, {
                [styles.btnActive]: this.props.groupMode === 'byMonth'
              })}
              onClick={this.handleKindChange('byMonth')}
            >1M</Button>
            <Button
              className={classnames(styles.btn, {
                [styles.btnActive]: this.props.groupMode === 'byWeek'
              })}
              onClick={this.handleKindChange('byWeek')}
            >1W</Button>
            <Button
              className={classnames(styles.btn, {
                [styles.btnActive]: this.props.groupMode === 'byDay'
              })}
              onClick={this.handleKindChange('byDay')}
            >1D</Button>
            <Button
              className={classnames(styles.btn, {
                [styles.btnActive]: this.props.groupMode === 'byHour'
              })}
              style={{ marginLeft: '-1px' }}
              onClick={this.handleKindChange('byHour')}
            >1H</Button>
          </ButtonGroup>
        </PanelHeader>
        <WithLoadingIndicator loadable={this.props}>
          {(points: PriceChartDataPoint[]) => (
            <PriceChartView data={points} groupMode={this.props.groupMode} />
          )}
        </WithLoadingIndicator>
      </div>
    );
  }
}

export function createPriceChartLoadable$(
  groupMode$: Observable<GroupMode>,
  dataSources$: { [key in GroupMode]: Observable<LoadableWithTradingPair<PriceChartDataPoint[]>> }
): Observable<PriceChartProps> {
  return groupMode$.pipe(
    switchMap((groupMode: GroupMode) => dataSources$[groupMode].pipe(
      map(tradeHistory => ({
        ...tradeHistory,
        groupMode,
        groupMode$,
      } as PriceChartProps)),
    )),
  );
}
