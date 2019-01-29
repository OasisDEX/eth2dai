import { BigNumber } from 'bignumber.js';
import classnames from 'classnames';
import * as d3 from 'd3';
import { ScaleLinear, ScaleLogarithmic } from 'd3-scale';
import { BaseType, Selection } from 'd3-selection';
import * as React from 'react';
import { createElement } from 'react-faux-dom';
import { OfferMatchType } from '../../utils/form';
import { Button } from '../../utils/forms/Buttons';
import { PanelHeader } from '../../utils/panel/Panel';
import { Muted } from '../../utils/text/Text';
import { OfferType, Orderbook } from '../orderbook/orderbook';
import { OrderbookViewKind } from '../OrderbookPanel';
import { DepthChartData, getDepthChartData, Summary, ZoomChange } from './depthchart';
import * as styles from './DepthChartView.scss';

interface PriceVolume {
  price: number;
  volume: number;
}

interface DepthChartInternalProps {
  orderbook: Orderbook;
  kind: OfferType;
  matchType: OfferMatchType;
  amount?: BigNumber;
  price?: BigNumber;
  zoom?: BigNumber;
  base?: string;
  quote?: string;
  zoomChange: (change: ZoomChange) => void;
  kindChange: (kind: OrderbookViewKind) => void;
}

const totalWidth = 508;
const totalHeight = 396;

// margin used as place for axis labels and other text around strict chart
const margin = { top: 10, right: 50, bottom: 30, left: 50 };
const chartSize = {
  width: totalWidth - margin.left - margin.right, // chart's width
  height: totalHeight - margin.top - margin.bottom // chart's height
};
// chart's bounding box
const chartCoords = {
  left: margin.left,
  right: totalWidth - margin.right,
  top: margin.top,
  bottom: totalHeight - margin.bottom,
  verticalHalf: chartSize.height / 2 + margin.top,
};
const infoBox = {
  sellTop: margin.top + 10,
  sellLeft: 10,
  buyBottom: margin.bottom + 10,
  buyRight: 10,
};

function axes(svgContainer: any,
              x: ScaleLinear<number, number>,
              ySell: ScaleLogarithmic<number, number>,
              yBuy: ScaleLogarithmic<number, number>,
              yToken: string | undefined,
              ) {
  // small price axis
  const xAdditionalAxe = svgContainer
    .append('g')
    .classed('xAdditional', true)
    .attr('transform', `translate(0, ${ chartCoords.top })`)
    .call(d3.axisBottom(x)
      .ticks(30)
      .tickSize(chartSize.height));
  xAdditionalAxe.select('.domain').classed(styles.hidden, true);
  xAdditionalAxe.selectAll('.tick line').classed(styles.axisLineAdditional, true);
  xAdditionalAxe.selectAll('.tick text').classed(styles.hidden, true);

  // -----------
  // volume axis
  const yAxis = svgContainer
    .append('g')
    .classed('yAxis', true);
  const yTickAddon = 0;
  const yTokenMarginTop = 20;
  const yTokenMarginHorizontal = 8;

  const buyAxis = yAxis.append('g')
    .classed('buyAxis', true);
  buyAxis.attr('transform', `translate( ${ chartCoords.right }, 0)`);
  buyAxis.call(d3.axisLeft(yBuy)
    .ticks(15)
    .tickSize(chartSize.width + yTickAddon)
    .tickFormat(d => d.toString()));

  const yBuyTokenLabel = yAxis.append('g')
    .classed('yBuyTokenLabel', true)
    .attr('transform', `translate( ${chartCoords.left}, ${yTokenMarginTop})`);
  yBuyTokenLabel.call(d3.axisLeft(yBuy)
    .ticks(15)
    .tickSize(0)
    .tickPadding(yTokenMarginHorizontal)
    .tickFormat(_d => `${yToken}`));

  const sellAxis = yAxis.append('g')
    .classed('sellAxis', true);
  sellAxis.attr('transform', `translate( ${ chartCoords.left }, 0)`);
  sellAxis.call(d3.axisRight(ySell)
    .ticks(15)
    .tickSize(chartSize.width + yTickAddon)
    .tickFormat(d => d.toString()));

  const ySellTokenLabel = yAxis.append('g')
    .attr('transform', `translate( ${chartCoords.right}, ${yTokenMarginTop})`);
  ySellTokenLabel.call(d3.axisRight(ySell)
    .ticks(15)
    .tickSize(0)
    .tickPadding(yTokenMarginHorizontal)
    .tickFormat(_d => `${yToken}`));

  yAxis.selectAll('.tick line').classed(styles.axisLineMain, true);
  yAxis.selectAll('.tick text').classed(styles.axisMainLabel, true);
  yAxis.selectAll('.tick text').attr('y', -10);
  yAxis.selectAll('.domain').classed(styles.hidden, true);

  // fix y additional ticks, which should: not have labels, be narrow and not expand chart
  const yAdditional = yAxis.selectAll('.tick')
    .filter((d: number) => d.toString().match(/^0\.0*1$|^10*$/) === null);
  // hide labels for all volumes that's not 1e+x
  yAdditional
    .select('text')
    .classed(styles.hidden, true);
  // modify additional lines style and cut them from being outside the chart
  yAdditional
    .select('line')
    .classed(styles.axisYLineAdditional, true)
    .attr('x2', (_d: number, i: number, n: any) => {
      const currentdx: number = Number(d3.select(n[i]).attr('x2'));
      return currentdx < 0 ? currentdx + yTickAddon : currentdx - yTickAddon;
    })
  ;

  // volume axis: style token labels
  yBuyTokenLabel.selectAll('.tick text')
    .classed(styles.axisMainLabel, false)
    .classed(styles.axisYTokenLabel, true);
  ySellTokenLabel.selectAll('.tick text')
    .classed(styles.axisMainLabel, false)
    .classed(styles.axisYTokenLabel, true);

  // -----------
  // main price axis
  const xAxis = svgContainer
    .append('g')
    .classed('xAxis', true);

  xAxis
    .attr('transform', `translate(0, ${ chartCoords.top })`)
    .classed(styles.axisMainLabel, true)
    .classed('xAxis', true)
    .call(d3.axisBottom(x)
      .ticks(5)
      .tickSize(chartSize.height + 6));
  xAxis.select('.domain').classed(styles.axisLineMain, true);
  xAxis.selectAll('.tick line').classed(styles.axisLineMain, true);

  // remove prices smaller than 0
  xAxis.selectAll('.tick')
    .filter((d: any, _i: number) => d < 0)
    .classed(styles.hidden, true);

}

const btnStyles = {
  marginRight: '0.7em',
  padding: 0,
  width: '30px',
  height: '30px',
  fill: 'white'
};

export class DepthChartView extends React.Component<DepthChartInternalProps> {

  public render() {

    const chart = createElement('div');

    // console.log('zoom', this.props.zoom);

    const data = getDepthChartData(
      this.props.orderbook.buy,
      this.props.orderbook.sell,
      this.props.kind,
      this.props.matchType,
      this.props.amount,
      this.props.price,
      this.props.zoom
    );

    const svgContainer = d3.select(chart)
    .append('svg')
    .attr('width', totalWidth)
    .attr('height', totalHeight)
    .append('g')
    .classed('depthchart', true);

    const x = d3.scaleLinear()
    .domain([data.minPrice, data.maxPrice])
    .range([chartCoords.left, chartCoords.right]);

    const minYVolume = 1e-1;
    const minYVolumePlus = 1e-1 + 1e-2;

    const yBuy = d3.scaleLog()
    .nice()
    .domain([minYVolume, data.maxVolume])
    .range([chartCoords.verticalHalf, chartCoords.bottom]);

    const ySell = d3.scaleLog()
    .nice()
    .domain([data.maxVolume, minYVolume])
    .range([chartCoords.top, chartCoords.verticalHalf]);

    const buyArea = d3.area<PriceVolume>()
    .x(o => x(o.price))
    .y1(o => yBuy(o.volume < minYVolume ? minYVolumePlus : o.volume))
    .curve(d3.curveStepAfter)
    .y0(chartCoords.verticalHalf);

    const sellArea = d3.area<PriceVolume>()
    .x(o => x(o.price))
    .y1(o => ySell(o.volume < minYVolume ? minYVolumePlus : o.volume))
    .curve(d3.curveStepAfter)
    .y0(chartCoords.verticalHalf);

    axes(svgContainer, x, ySell, yBuy, this.props.base);

    const chartMode = (!this.props.price || !this.props.amount) ? 'none' : this.props.kind;

    ([[data.buysBefore, buyArea,
      chartMode === 'buy' ? styles.hidden : styles.buyChart],
      [data.buysAfter, buyArea,
        chartMode === 'sell' ? styles.buyChartDark : styles.buyChart],
      [data.buysExtra, buyArea, styles.buyChartDark],
      [data.sellsBefore, sellArea,
        chartMode === 'sell' ? styles.hidden : styles.sellChartDark],
      [data.sellsAfter, sellArea, styles.sellChart],
      [data.sellsExtra, sellArea, styles.sellChartDark]]
    .filter(([volumes]) => volumes !== undefined && volumes.length > 0) as any)
    .forEach(([volumes, area, style]: any) => {
      return svgContainer
      .append('g')
      .append('path')
      .attr('d', area(volumes))
      .classed(style, true);
    });

    drawDotsAndLine(svgContainer, chartMode, x, yBuy, ySell, data);

    const hasBuys = [data.buysBefore, data.buysAfter]
      .filter(vol => vol !== undefined && vol.length > 0).length > 0;

    const hasSells = [data.sellsBefore, data.sellsAfter]
      .filter(vol => vol !== undefined && vol.length > 0).length > 0;

    return (
      <>
        <PanelHeader bordered={true}>
            <span>Depth chart</span>
            <div style={{ marginLeft: 'auto', display: 'flex' }}>
                <Button
                  style={btnStyles}
                  onClick={this.zoomOut}
                  disabled={!data.zoomOutEnabled}
                >
                  <MinusBtn />
                </Button>
                <Button
                  style={btnStyles}
                  onClick={this.zoomIn}
                  disabled={!data.zoomInEnabled}
                >
                  <PlusBtn />
                </Button>
                <Button
                    style={{ ...btnStyles, marginRight:'0' }}
                    onClick={this.changeChartListView}
                    data-test-id="orderbook-type-depthChart"
                >
                    <ToListSwitchBtn/>
                </Button>
            </div>
        </PanelHeader>

        <div className={styles.depthChart}>
          {chart.toReact()}
          { hasSells && <SellersLegend /> }
          { hasBuys && <BuyersLegend /> }
          { data.summary && drawSummaryInfoBox(data.summary)
          && <Legend summary={data.summary}
                     fromCurrency={this.props.base || ''}
                     toCurrency={this.props.quote || ''} /> }
        </div>
      </>);
  }

  private zoomIn = () => {
    this.props.zoomChange('zoomIn');
  }

  private zoomOut = () => {
    this.props.zoomChange('zoomOut');
  }

  private changeChartListView = () => {
    this.props.kindChange(OrderbookViewKind.list);
  }

}

class MinusBtn extends React.PureComponent {
  public render() {
    return (
      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24">
        <path d="M19 13H5v-2h14v2z"/>
        <path d="M0 0h24v24H0z" fill="none"/>
      </svg>
    );
  }
}

class PlusBtn extends React.PureComponent {
  public render() {
    return (
      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24">
        <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/>
        <path d="M0 0h24v24H0z" fill="none"/>
      </svg>
    );
  }
}

class ToListSwitchBtn extends React.PureComponent {
  public render() {
    return (
      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24">
        <path d="M3 13h2v-2H3v2zm0 4h2v-2H3v2zm0-8h2V7H3v2zm4 4h14v-2H7v2zm0 4h14v-2H7v2zM7 7v2h14V7H7z"/>
        <path d="M0 0h24v24H0z" fill="none"/>
      </svg>
    );
  }
}

function drawSummaryInfoBox(summary?: Summary) {
  if (!summary) {
    return false;
  }
  return summary.currentForSale.amount !== summary.afterOrderForSale.amount ||
    summary.currentWanted.amount !== summary.afterOrderWanted.amount;
}

function drawDotsAndLine(svgContainer: Selection<BaseType, any, null, undefined>,
                         chartMode: string,
                         xScale: ScaleLinear<number, number>,
                         yBuyScale: ScaleLogarithmic<number, number>,
                         ySellScale: ScaleLogarithmic<number, number>,
                         data: DepthChartData,
) {
  if (!data.summary || !drawSummaryInfoBox(data.summary)) {
    return;
  }
  const cx = xScale(data.summary.price);
  const svg = svgContainer.append('g').classed('dots', true);

  let extra: [number, string, ScaleLogarithmic<number, number>] = [0, '', yBuyScale];
  if (chartMode === 'buy' && data.buysExtra && data.buysExtra.length > 0) {
    extra = [data.buysExtra[0].volume, styles.dotBuy, yBuyScale];
  }
  if (chartMode === 'sell' && data.sellsExtra && data.sellsExtra.length > 0) {
    extra = [data.sellsExtra[0].volume, styles.dotSell, ySellScale];
  }

  const circleData: [[number, string, ScaleLogarithmic<number, number>]]
    = ([extra,
    [chartMode === 'sell' ? 0 : data.summary.currentForSale.amount,
      styles.dotSell, ySellScale],
    [chartMode === 'buy' ? 0 : data.summary.currentWanted.amount,
      styles.dotBuy, yBuyScale],
    [data.summary.afterOrderForSale.amount, styles.dotSell, ySellScale],
    [data.summary.afterOrderWanted.amount, styles.dotBuy, yBuyScale],
  ]
    .filter(([amount]) => amount > 0) as any);

  drawInfoBoxLine(svg, circleData, data.summary, cx);

  svg.selectAll('circle.glow')
    .data(circleData)
    .enter()
    .append('circle')
    .classed('glow', true)
    .attr('cx', _d => cx)
    .attr('cy', d => d[2](d[0]))
    .attr('r', 8)
    .classed(styles.dotGlow, true);
  svg.selectAll('circle.dot')
    .data(circleData)
    .enter()
    .append('circle')
    .classed('dot', true)
    .attr('cx', _d => cx)
    .attr('cy', d => d[2](d[0]))
    .attr('r', 5)
    .attr('class', d => d[1]);
}

function drawInfoBoxLine(svg: Selection<BaseType, any, null, undefined>,
                         circleData: any,
                         summary: Summary,
                         xPrice: number,
                         ) {

  const { showLegendOnBottom } = calculateLegendParams(summary);
  const x = xPrice;
  const yData: number[] = circleData
    .map((a: [number, string, ScaleLogarithmic<number, number>]) => a[2](a[0]));

  const top = infoBox.sellTop + 10;
  const left = infoBox.sellLeft + 10;
  const bottom = totalHeight - infoBox.buyBottom - 10;
  const right = totalWidth - infoBox.buyRight - 10;

  if (showLegendOnBottom) {
    const max = (d3.max(yData) || 0);
    const y = max < bottom ? Math.min(bottom, max + 15) : Math.max(bottom, max - 15);
    svg.append('line')
      .attr('x1', x)
      .attr('y1', y)
      .attr('x2', x)
      .attr('y2', bottom)
      .classed(styles.infoBoxGreen, true);
    svg.append('line')
      .attr('x1', x)
      .attr('y1', bottom)
      .attr('x2', right)
      .attr('y2', bottom)
      .classed(styles.infoBoxGreen, true);
  } else {
    const min = d3.min(yData) || 0;
    const y = min > top ? Math.max(min - 15, top) : Math.min(min + 15, top);
    svg.append('line')
      .attr('x1', left)
      .attr('y1', top)
      .attr('x2', x)
      .attr('y2', top)
      .classed(styles.infoBoxRed, true);
    svg.append('line')
      .attr('x1', x)
      .attr('y1', top)
      .attr('x2', x)
      .attr('y2', y)
      .classed(styles.infoBoxRed, true);
  }
}

function calculateLegendParams(summary: Summary): {showSales: boolean,
  showBuys: boolean, showLegendOnBottom: boolean} {
  const showSales = summary.currentForSale.totalCost !== 0
    || summary.afterOrderForSale.totalCost !== 0;
  const showBuys = summary.currentWanted.totalCost !== 0
    || summary.afterOrderWanted.totalCost !== 0;
  return {
    showSales,
    showBuys,
    showLegendOnBottom: showBuys && !showSales
  };
}

const Legend = ({ summary, fromCurrency, toCurrency } : {
  summary: Summary, fromCurrency: string, toCurrency: string }) => {
  const { showSales, showBuys, showLegendOnBottom } = calculateLegendParams(summary);
  const position = showLegendOnBottom ?
    { bottom: infoBox.buyBottom, right: infoBox.buyRight } :
    { top: infoBox.sellTop, left: infoBox.sellLeft };
  return (
  <div className={classnames(styles.infoBox, {
    [styles.infoBoxGreen]: showLegendOnBottom,
    [styles.infoBoxRed]: showSales
  })}
                  style={position}>
    <span>At {summary.price} {toCurrency} per {fromCurrency}...</span>

    <div className={ styles.infoSummary }>
      {showSales && <SummaryLine color="sellText"
                 amount={summary.currentForSale.amount}
                 fromCurrency={fromCurrency}
                 describer="for sale"
                 totalCost={summary.currentForSale.totalCost}
                 toCurrency={toCurrency} />}

      {showBuys && <SummaryLine color="buyText"
                 amount={summary.currentWanted.amount}
                 fromCurrency={fromCurrency}
                 describer="wanted"
                 totalCost={summary.currentWanted.totalCost}
                 toCurrency={toCurrency} />}
    </div>
    <span>After your order...</span>

    <div className={ styles.infoSummary }>
      {showSales && <SummaryLine color="sellText"
                 amount={summary.afterOrderForSale.amount}
                 fromCurrency={fromCurrency}
                 describer="for sale"
                 totalCost={summary.afterOrderForSale.totalCost}
                 toCurrency={toCurrency} />}

      {showBuys && <SummaryLine color="buyText"
                 amount={summary.afterOrderWanted.amount}
                 fromCurrency={fromCurrency}
                 describer="wanted"
                 totalCost={summary.afterOrderWanted.totalCost}
                 toCurrency={toCurrency} />}
    </div>
  </div>
  );
};

const SummaryLine = ({ amount, totalCost, fromCurrency, toCurrency, describer, color } : {
  amount: number,
  totalCost: number,
  fromCurrency: string,
  toCurrency: string,
  describer: string,
  color: 'sellText' | 'buyText' }) => (
    <div className={styles.infoSummaryLine}>
      <div>
        <span className={styles[color]}>{new BigNumber(amount).toFixed(2)} {fromCurrency}</span>
        <Muted> {describer}</Muted>
      </div>
      <div>
        <span className={styles[color]}>{new BigNumber(totalCost).toFixed(2)} {toCurrency}</span>
        <Muted> total</Muted>
      </div>
    </div>
);

const LegendImage = ({ color, className }:
                       { color: 'sellChart' | 'sellChartDark' | 'buyChart' | 'buyChartDark',
                         className?: any}) => (
  <div className={classnames(styles.legendImg, styles[color], className)}/>
);

const SellersLegend = () => (
  <div className={ styles.smallLegend } style={{
    right: margin.right + 10,
    top: chartCoords.verticalHalf + 10
  }}>
    <span style={{ marginRight: '1em' }}>Sellers</span>
    <LegendImage color="sellChartDark"/>
  </div>
);

const BuyersLegend = () => (
  <div className={ styles.smallLegend } style={{
    left: margin.left + 10,
    top: chartCoords.verticalHalf - 30
  }}>
    <LegendImage color="buyChart"/>
    <span style={{ marginLeft: '1em' }}>Buyers</span>
  </div>
);
