import { storiesOf } from '@storybook/react';
import * as React from 'react';
import { ignoreDuringVisualRegression } from '../../storybookUtils';
import { Panel } from '../../utils/panel/Panel';
import { bigFakeDailyData, fakeDailyData, generate } from './fakePriceData';
import { GroupMode, PriceChartDataPoint } from './pricechart';
import { PriceChartView } from './PriceChartView';

const stories = storiesOf('PriceChartView', module);

const PriceChartWithPanel = ({ data, groupMode }: {
  data: PriceChartDataPoint[],
  groupMode?: GroupMode
}) => (
  <Panel style={{ width: '454px', height: '320px', paddingTop: '2em' }}>
    <PriceChartView data={data} groupMode={groupMode || 'byDay'}/>
  </Panel>
);

stories.add('Simple daily data', () => (
  <PriceChartWithPanel data={fakeDailyData} />
));

stories.add('Candle samples (daily data)', () => (
  <div>
    <h4>Types of candle</h4>
    <PriceChartWithPanel  data={[
      {
        timestamp: new Date('2018-09-19'),
        open: 25,
        high: 50,
        low: 20,
        close: 35,
        turnover: 1.0803500000000001,
      },
      {
        timestamp: new Date('2018-09-20'),
        open: 25,
        high: 50,
        low: 25,
        close: 35,
        turnover: 1,
      },
      {
        timestamp: new Date('2018-09-21'),
        open: 25,
        high: 35,
        low: 20,
        close: 35,
        turnover: 1.45,
      },
      {
        timestamp: new Date('2018-09-22'),
        open: 25,
        high: 35,
        low: 25,
        close: 35,
        turnover: 1.125,
      },
      { // equal
        timestamp: new Date('2018-09-23'),
        open: 30,
        high: 30,
        low: 30,
        close: 30,
        turnover: 2.01,
      },
      {
        timestamp: new Date('2018-09-24'),
        open: 35,
        high: 50,
        low: 20,
        close: 25,
        turnover: 1.98,
      },
      {
        timestamp: new Date('2018-09-25'),
        open: 35,
        high: 50,
        low: 25,
        close: 25,
        turnover: 0.64,
      },
      {
        timestamp: new Date('2018-09-26'),
        open: 35,
        high: 35,
        low: 20,
        close: 25,
        turnover: 1.5,
      },
      {
        timestamp: new Date('2018-09-27'),
        open: 35,
        high: 35,
        low: 25,
        close: 25,
        turnover: 1.23,
      },
      {
        timestamp: new Date('2018-09-28'),
        open: 35,
        high: 35,
        low: 34.9999999,
        close: 34.9999999,
        turnover: 2.23,
      },
    ]}/>

    <p>From left to right:</p>
      <ul>
        <li>Growth (green)
          <ul>
            <li>typical candle: low smaller than open, high greater than close</li>
            <li>low equals open</li>
            <li>high equals close</li>
            <li>low equals open & high equals close</li>
          </ul>
        </li>
        <li>Equals (grey)
          <ul>
            <li>low = open = close = high</li>
          </ul>
        </li>
        <li>Decrease (red)
          <ul>
            <li>typical candle: low smaller than close, high greater than open</li>
            <li>low equals close</li>
            <li>high equals open</li>
            <li>low equals close & high equals open</li>
            <li>low = open and very close to close = high</li>
          </ul>
        </li>
      </ul>
  </div>
));

ignoreDuringVisualRegression(() => {
  stories.add('Degenerate data', () => (
    <div>
      <h3>Empty data</h3>
      <small>Daily</small>
      <PriceChartWithPanel data={[]} />
      <small>Hourly</small>
      <PriceChartWithPanel data={[]} groupMode="byHour"/>
      <h3>One timestamp</h3>
      <PriceChartWithPanel data={[
        {
          timestamp: new Date('2016-01-01'),
          open: 1082.4,
          high: 1090.25,
          low: 1076.15,
          close: 1088.75,
          turnover: 86.78,
        },
      ]} />
      <h3>Two timestamps</h3>
      <PriceChartWithPanel data={[
        {
          timestamp: new Date('2016-01-01'),
          open: 1082.4,
          high: 1090.25,
          low: 1076.15,
          close: 1088.75,
          turnover: 86.78,
        },
        {
          timestamp: new Date('2016-01-02'),
          open: 1080.34,
          high: 1087.1,
          low: 1075.5,
          close: 1079.12,
          turnover: 121,
        },
      ]} />
      <h3>Three timestamps from four trades</h3>
      <PriceChartWithPanel data={[
        {
          timestamp: new Date('2018-09-20'),
          open: 1.6,
          high: 2,
          low: 1.6,
          close: 2,
          turnover: 1.0803500000000001,
        },
        {
          timestamp: new Date('2018-09-21'),
          open: 2,
          high: 2,
          low: 2,
          close: 2,
          turnover: 1,
        },
        {
          timestamp: new Date('2018-09-27'),
          open: 2,
          high: 2,
          low: 2,
          close: 2,
          turnover: 1.5,
        },
      ]} />
      <h3>One transaction in whole timespan</h3>
      <PriceChartWithPanel data={[
        {
          timestamp: new Date('2018-09-27'),
          open: 2,
          high: 2,
          low: 2,
          close: 2,
          turnover: 1.5,
        },
      ]} />
    </div>
  ));
});

ignoreDuringVisualRegression(() => {
  stories.add('Random daily and hourly data', () => {
    const dailyData = generate(
      'byDay',
      new Date('2018-01-05'),
      new Date('2018-03-10'),
      240, 350, 1, 200
    );
    const hourlyData = generate(
      'byHour',
      new Date('2018-01-05'),
      new Date('2018-03-10T14:00:00'),
      240, 350, 1, 200
    );
    return (
      <div>
        <h4>Daily</h4>
        <PriceChartWithPanel data={dailyData} />
        <h4>Hourly</h4>
        <PriceChartWithPanel data={hourlyData} groupMode="byHour" />
      </div>
    );
  });
});

stories.add('Big fake daily data (are cut)', () => {
  return (
  <PriceChartWithPanel data={bigFakeDailyData} />
  );
});

stories.add('High range with very close to 0 minimal price', () => {
  return (
      <div>
        <h4>Daily</h4>
        <PriceChartWithPanel data={[
          {
            timestamp: new Date('2018-01-06T00:00:00.000Z'),
            open: 333.37687112382446,
            high: 933.37687112382446,
            low: 314.1798860637972,
            close: 914.1798860637972,
            turnover: 11.066294066977633
          },
          {
            timestamp: new Date('2018-01-07T00:00:00.000Z'),
            open: 306.38102859719305,
            high: 342.3116448015784,
            low: 306.38102859719305,
            close: 324.81012058948187,
            turnover: 195.2536909025437
          },
          {
            timestamp: new Date('2018-01-08T00:00:00.000Z'),
            open: 1452.8701502697485,
            high: 1542.34665685029915,
            low: 726.0048461455915,
            close: 1329.7209989169264,
            turnover: 170.16115673608596
          },
          {
            timestamp: new Date('2018-01-09T00:00:00.000Z'),
            open: 337.8173090132458,
            high: 846.1738401734291,
            low: 320.37115759019997,
            close: 746.1738401734291,
            turnover: 86.50121854292108
          },
          {
            timestamp: new Date('2018-01-10T00:00:00.000Z'),
            open: 337.23899252132287,
            high: 337.23899252132287,
            low: 312.5302006531087,
            close: 320.352156665352,
            turnover: 127.6543306181675
          },
          {
            timestamp: new Date('2018-01-11T00:00:00.000Z'),
            open: 2313.7507974851636,
            high: 2317.4403517015113,
            low: 1294.19874715812136,
            close: 1317.4403517015113,
            turnover: 124.34906714176373
          },
          {
            timestamp: new Date('2018-01-12T00:00:00.000Z'),
            open: 313.0095334449359,
            high: 1336.00498662090666,
            low: 301.6250477028224,
            close: 1317.06481992877895,
            turnover: 27.60478183605306
          },
          {
            timestamp: new Date('2018-01-13T00:00:00.000Z'),
            open: 313.0095334449359,
            high: 336.00498662090666,
            low: 0,
            close: 317.06481992877895,
            turnover: 27.60478183605306
          }
        ]} />
      </div>
  );
});

stories.add('Small range very close to 0', () => {
  return (
      <div>
        <h4>Daily</h4>
        <PriceChartWithPanel data={[
          {
            timestamp: new Date('2018-01-06T00:00:00.000Z'),
            open: 0.037687112382446,
            high: 0.037687112382446,
            low: 0.01798860637972,
            close: 0.01798860637972,
            turnover: 11.066294066977633
          },
          {
            timestamp: new Date('2018-01-07T00:00:00.000Z'),
            open: 0.0122058948187,
            high: 0.03116448015784,
            low: 0.0102859719305,
            close: 0.028102859719305,
            turnover: 195.2536909025437
          },
          {
            timestamp: new Date('2018-01-08T00:00:00.000Z'),
            open: 0.08701502697485,
            high: 0.034665685029915,
            low: 0.00048461455915,
            close: 0.07209989169264,
            turnover: 170.16115673608596
          },
          {
            timestamp: new Date('2018-01-09T00:00:00.000Z'),
            open: 0.017390132458,
            high: 0.04738401734291,
            low: 0.007115759019997,
            close: 0.01738401734291,
            turnover: 86.50121854292108
          },
          {
            timestamp: new Date('2018-01-10T00:00:00.000Z'),
            open: 0.023899252132287,
            high: 0.023899252132287,
            low: 0.05302006531087,
            close: 0.0352156665352,
            turnover: 127.6543306181675
          },
          {
            timestamp: new Date('2018-01-11T00:00:00.000Z'),
            open: 0.007974851636,
            high: 0.04403517015113,
            low: 0.0019874715812136,
            close: 0.03403517015113,
            turnover: 124.34906714176373
          },
          {
            timestamp: new Date('2018-01-12T00:00:00.000Z'),
            open: 0.00095334449359,
            high: 0.013498662090666,
            low: 0.00250477028224,
            close: 0.006481992877895,
            turnover: 27.60478183605306
          },
          {
            timestamp: new Date('2018-01-13T00:00:00.000Z'),
            open: 0.00095334449359,
            high: 0.000498662090666,
            low: 0.000001,
            close: 0.006481992877895,
            turnover: 27.60478183605306
          }
        ]} />
      </div>
  );
});

// - all timespan has data
// - some timespan don't have data
// - equal open and close value
// - only one trade for timespan
// - no data at all
// - only one timespan with data
