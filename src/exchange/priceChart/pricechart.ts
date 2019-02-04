import * as moment from 'moment';
import { combineLatest, Observable } from 'rxjs';
import { map, switchMap } from 'rxjs/operators';

import { NetworkConfig } from '../../blockchain/config';
import { vulcan0x } from '../../blockchain/vulcan0x';
import { IntervalUnit } from '../allTrades/allTrades';
import { TradingPair } from '../tradingPair/tradingPair';

export interface PriceChartDataPoint {
  timestamp: Date;
  open: number;
  high: number;
  low: number;
  close: number;
  turnover: number;
}

export type GroupMode = 'byMonth' | 'byWeek' | 'byDay' | 'byHour';

export const groupModeMapper: { [key in GroupMode]: {addUnit: string, format: string} } = {
  byMonth: { addUnit: 'month', format: 'YYYY MMM' },
  byWeek: { addUnit: 'weeks', format: 'MMM DD' },
  byDay: { addUnit: 'days', format: 'MMM DD' },
  byHour: { addUnit: 'hours', format: 'HH:mm' },
};

export function loadAggregatedTrades(
  interval: number, unit: IntervalUnit,
  context$$: Observable<NetworkConfig>,
  onEveryBlock$$: Observable<number>,
  { base, quote }: TradingPair,
): Observable<PriceChartDataPoint[]> {
  const borderline = moment().subtract(interval, unit).startOf('day').toDate();
  const view = 'tradesAggregated';
  const options = {
    timeUnit: unit,
    tzOffset: { minutes: -new Date().getTimezoneOffset() },
    dateFrom: borderline.toISOString(),
  };
  const fields = ['date', 'open', 'close', 'min', 'max', 'volumeBase'];
  const filter = {
    market: { equalTo: `${base}${quote}` },
  };

  return combineLatest(context$$, onEveryBlock$$).pipe(
    switchMap(([context]) =>
      vulcan0x(context.oasisDataService.url, view, options, filter, fields, undefined, undefined, undefined)
    ),
    map(aggrs => aggrs.map(parseAggregatedData)),
  );
}

function parseAggregatedData(
  { date, open, close, min, max, volumeBase }: any
): PriceChartDataPoint {
  return {
    open: Number(open),
    close: Number(close),
    low: Number(min),
    high: Number(max),
    turnover: Number(volumeBase),
    timestamp: new Date(date),
  };
}
