import * as d3 from 'd3';
import { ScaleLinear, ScaleTime } from 'd3-scale';
import { BaseType, Selection } from 'd3-selection';
import { isEmpty } from 'lodash';
import * as moment from 'moment';
import * as React from 'react';
import { createElement } from 'react-faux-dom';
import { Muted } from '../../utils/text/Text';
import { GroupMode, groupModeMapper, PriceChartDataPoint } from './pricechart';
import * as styles from './PriceChartView.scss';

const margin = { top: 5, right: 45, bottom: 40, left: 10 };
const width = 440;
const height = 270;
const bars = { width: 7, padding: 2, delta: -4 };
const maxDataLength = 38;

const bothChartSize = {
  width: width - margin.left - margin.right, // chart's width
  height: height - margin.top - margin.bottom, // chart's height
};

const candleChartSize = {
  width: bothChartSize.width, // candle chart's width
  height: bothChartSize.height * 4 / 5, // chart's height
};
const volumeChartSize = {
  width: bothChartSize.width, // chart's width
  height: bothChartSize.height / 5,
};

export interface PriceChartInternalProps {
  data: PriceChartDataPoint[];
  groupMode: GroupMode;
}

export class PriceChartView extends React.Component<PriceChartInternalProps, {
  hoverId: number,
  hoverData: any,
}> {

  public constructor(props: PriceChartInternalProps) {
    super(props);

    this.state = {
      hoverId: -1,
      hoverData: {}
    };
  }

  public render() {

    const data = this.props.data
      .slice(-maxDataLength);
    const groupModeMap = groupModeMapper[this.props.groupMode];
    const chart = createElement('div');

    const svgMainGraphic = d3.select(chart)
      .append('svg')
      .attr('width', width)
      .attr('height', height)
      .append('g')
      .attr('transform', `translate(${margin.left}, ${margin.top})`);

    const addUnit = groupModeMap.addUnit as moment.unitOfTime.DurationConstructor;
    const minimalDate = data.length === 0 ?
      moment().startOf(addUnit).subtract(4, addUnit).toDate() :
      moment(data[0].timestamp).subtract(1, addUnit).toDate();
    const maximalDate = data.length === 0 ?
      moment().startOf(addUnit).toDate() :
      moment(data[data.length - 1].timestamp).add(1, addUnit).toDate();
    const xScale = d3.scaleTime()
      .domain([minimalDate, maximalDate])
      // .nice(d3.timeDay)
      .range([0, bothChartSize.width]);

    let minimal: number  = d3.min(data, d => d.low) || 0;
    let maximal: number  = d3.max(data, d => d.high) || 100;
    const minMaxDiff = maximal - minimal;
    minimal = minimal - minMaxDiff * 0.1; // make bottom margin
    maximal = Math.max(maximal + minMaxDiff * 0.1, minimal); // make top margin
    // degenerated data -- expand domain a little
    if (minimal === maximal) {
      minimal *= 0.9;
      maximal *= 1.1;
    }
    const yCandleScale = d3.scaleLinear()
      .domain([minimal, maximal])
      .range([candleChartSize.height, 0])
      .nice();

    const volumeMaximal = Math.ceil((d3.max(data, d => d.turnover) || 10) * 1.1);
    const yVolumeScale = d3.scaleLinear()
      .domain([0, volumeMaximal * 1.4]) // multiply to add space at top of volume
                                                // in case the candle label is at the bottom
      .range([volumeChartSize.height, 0]);

    axes(data,
         svgMainGraphic,
         xScale,
         yCandleScale,
         yVolumeScale,
         volumeMaximal,
         groupModeMap.format
    );
    volumeChart(data, svgMainGraphic, xScale, yVolumeScale, this.state.hoverId);
    candleChart(data, svgMainGraphic, xScale, yCandleScale, this.state.hoverId);
    hoverBarChart(data, svgMainGraphic, xScale);

    svgMainGraphic.select('.hoverbar').selectAll('rect')
      .on('mouseover', (d, i) => {
        this.setState({ hoverId: i, hoverData: d });
      })
      .on('mouseout', () => {
        this.setState({ hoverId: -1 });
      });

    return (<div style={{
      position: 'relative',
      display: 'flex',
      justifyContent: 'center',
    }}>
        {chart.toReact()}
        <DataDetails data={this.state.hoverData}
                     timestampFormat={groupModeMap.format}
                     defaultData={data.length > 0 ?
                       data[data.length - 1] :
                       {} as PriceChartDataPoint}
        />
      </div>);
  }
}

// bars created only to bind hover on them
// no styles, noe view, full-height
function hoverBarChart(data: PriceChartDataPoint[],
                       svgContainer: Selection<BaseType, any, null, undefined>,
                       xScale: ScaleTime<number, number>,
) {

  const mbar = svgContainer.selectAll('.hoverbar')
    .data([data])
    .enter().append('g')
    .classed('hoverbar', true);

  mbar.selectAll('rect')
    .data(d => d)
    .enter().append('rect')
    .style('fill', 'transparent')
    .attr('x', (d) => xScale(d.timestamp) + bars.delta)
    .attr('y', _d => 0)
    .attr('height', _d => bothChartSize.height)
    .attr('width', bars.width);
}

function volumeChart(data: PriceChartDataPoint[],
                     svgContainer: Selection<BaseType, any, null, undefined>,
                     xScale: ScaleTime<number, number>,
                     yVolumeScale: ScaleLinear<number, number>,
                     hoverId: number,
) {
  const svg = svgContainer
    .append('g')
    .attr('transform',
          `translate(0, ${candleChartSize.height - 0.3 })`)
    .classed('volume', true);

  const mbar = svg.selectAll('.bar')
    .data([data])
    .enter().append('g')
    .classed('bar', true);

  mbar.selectAll('rect')
    .data(d => d)
    .enter().append('rect')
    .attr('class', (_d, i) => hoverId === i ? styles.hoved : '')
    .classed(styles.volume, true)
    .attr('x', (d) => xScale(d.timestamp) + bars.delta)
    .attr('y', d => yVolumeScale(d.turnover))
    .attr('height', d => yVolumeScale(0) - yVolumeScale(d.turnover))
    .attr('width', bars.width);
}

function candleChart(data: PriceChartDataPoint[],
                     svgContainer: Selection<BaseType, any, null, undefined>,
                     xScale: ScaleTime<number, number>,
                     yScale: ScaleLinear<number, number>,
                     hoverId: number,
) {
  const svg = svgContainer
    .append('g')
    .classed('candleChart', true);
  const stick = svg.selectAll('.sticks')
    .data([data])
    .enter().append('g')
    .attr('class', 'sticks');

  stick.selectAll('rect')
    .data(d => d)
    .enter().append('rect')
    .attr('x', d =>  xScale(d.timestamp) - 1)
    .attr('y', d =>  yScale(d.high))
    .attr('height', d =>  yScale(d.low) - yScale(d.high))
    .attr('width', 1)
    .attr('class', (_d, i) => hoverId === i ? styles.hoved : '')
    .classed(styles.riseStick, d =>  (d.close > d.open))
    .classed(styles.fallStick, d =>  (d.open > d.close))
    .classed(styles.equal, d =>  (d.open === d.close));

  const candle = svg.selectAll('.candles')
    .data([data])
    .enter().append('g')
    .attr('class', 'candles');

  candle.selectAll('rect')
    .data(d =>  d)
    .enter().append('rect')
    .attr('x', d => xScale(d.timestamp) + bars.delta)
    .attr('y', d => yScale(Math.max(d.open, d.close)))
    .attr('height', d => {
      const h = yScale(Math.min(d.open, d.close)) - yScale(Math.max(d.open, d.close));
      return h < 1 ? 1 : h;
    })
    .attr('width', bars.width)
    .attr('class', (_d, i) => hoverId === i ? styles.hoved : '')
    .classed(styles.riseBar, d => (d.close > d.open))
    .classed(styles.fallBar, d => (d.open > d.close))
    .classed(styles.equal, d =>  (d.open === d.close));

}

function axes(_data: PriceChartDataPoint[],
              svgContainer: Selection<BaseType, any, null, undefined>,
              xScale: ScaleTime<number, number>,
              yCandleScale: ScaleLinear<number, number>,
              yVolumeScale: ScaleLinear<number, number>,
              volumeMaximal: number,
              xTimestampFormat: string,
) {
  const svg = svgContainer
    .append('g')
    .classed('axes', true);

  const xGridAxis = d3.axisBottom(xScale)
  // .ticks(d3.timeDay.every(1))
    .tickPadding(10)
    .ticks(5)
    .tickSize(bothChartSize.height)
    .tickFormat((d: any) => moment(d).format(xTimestampFormat));

  const yCandleGridAxis = d3.axisRight(yCandleScale)
    .scale(yCandleScale)
    .tickSize(candleChartSize.width)
    .ticks(Math.floor(candleChartSize.height / 50));

  const yVolumeGridAxis = d3.axisRight(yVolumeScale)
    .scale(yVolumeScale)
    .tickSize(volumeChartSize.width)
    .tickValues([volumeMaximal]);

  const xAxisGroup = svg.append<SVGGraphicsElement>('g')
    .attr('class', 'axis xaxis')
    .call(xGridAxis);

  const yCandleAxisGroup = svg.append<SVGGraphicsElement>('g')
    .attr('class', 'axis yaxisCandle')
    .call(yCandleGridAxis);

  const yVolumeAxisGroup = svg.append<SVGGraphicsElement>('g')
    .attr('class', 'axis yaxisVolume')
    .attr('transform', `translate(0, ${bothChartSize.height - volumeChartSize.height})`)
    .call(yVolumeGridAxis);

  const xDomainAxisGroup = svg.append<SVGGraphicsElement>('g')
    .attr('class', 'axis xaxisdomain')
    .attr('transform', `translate(0, ${bothChartSize.height})`)
    .call(xGridAxis
      .tickFormat(_d => '')
      .tickSizeOuter(0)
      .tickSizeInner(5));

  const yCandleDomainAxisGroup = svg.append<SVGGraphicsElement>('g')
    .attr('class', 'axis yaxisdomainCandle')
    .attr('transform', `translate(${candleChartSize.width}, 0)`)
    .call(yCandleGridAxis
      .tickFormat(_d => '')
      .tickSizeOuter(0)
      .tickSizeInner(0));

  const yVolumeDomainAxisGroup = svg.append<SVGGraphicsElement>('g')
    .attr('class', 'axis yaxisdomainVolume')
    .attr('transform',
          `translate(${bothChartSize.width}, ${bothChartSize.height - volumeChartSize.height})`)
    .call(yVolumeGridAxis
      .tickFormat(_d => '')
      .tickSizeOuter(0)
      .tickSizeInner(0));

  // ----- style lines ------

  // style grid lines
  svg.selectAll('.tick line')
    .classed(styles.axisLineGrid, true);

  // hide grid domain
  xAxisGroup.selectAll('.domain')
    .attr('visibility', 'hidden');
  yCandleAxisGroup.selectAll('.domain')
    .attr('visibility', 'hidden');
  yVolumeAxisGroup.selectAll('.domain')
    .attr('visibility', 'hidden');
  // hide volume ticks
  yVolumeAxisGroup.selectAll('.tick')
    .attr('visibility', 'hidden');

  // style x domain
  xDomainAxisGroup.selectAll('.tick line')
    .classed(styles.axisLineGrid, false)
    .classed(styles.axisLineMain, true);
  xDomainAxisGroup.selectAll('.domain')
    .classed(styles.axisLineMain, true);

  // style y domain
  yCandleDomainAxisGroup.selectAll('.domain')
    .classed(styles.axisLineMain, true);
  yVolumeDomainAxisGroup.selectAll('.domain')
    .classed(styles.axisLineMain, true)
    .classed(styles.axisYVolumeLineMain, true);

  // ----- style text -------
  // style x labels
  xAxisGroup.selectAll('.tick text')
    .classed(styles.axisXMainLabel, true);

  // style y labels
  yCandleAxisGroup.selectAll('.tick text')
    .classed(styles.axisYMainLabel, true);
  // style volume labels
  // yVolumeAxisGroup.selectAll('.tick text')
  //   .classed(styles.axisYVolumeLabel, true);
}

const DataDetails = ({ data, timestampFormat, defaultData }: {
  data: PriceChartDataPoint,
  timestampFormat: string,
  defaultData: PriceChartDataPoint,
}) => {
  const curr = isEmpty(data) ? defaultData : data;
  return (
    <div className={styles.infoBox}>
      <div className={styles.infoBoxItem}><Muted>O</Muted> {curr.open && curr.open.toFixed(2)}</div>
      <div className={styles.infoBoxItem}><Muted>H</Muted> {curr.high && curr.high.toFixed(2)}</div>
      <div className={styles.infoBoxItem}><Muted>L</Muted> {curr.low && curr.low.toFixed(2)}</div>
      <div className={styles.infoBoxItem}>
        <Muted>C</Muted> {curr.close && curr.close.toFixed(2)}
      </div>
      <div className={styles.infoBoxItem}>
        <Muted>V</Muted> {curr.turnover && curr.turnover.toFixed(2)}
      </div>
      <div className={styles.infoBoxItem}>{curr.timestamp
                       && moment(curr.timestamp).format(timestampFormat)}</div>
    </div>
  );
};
