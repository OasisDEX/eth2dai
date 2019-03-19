import * as React from 'react';
import { Observable } from 'rxjs';
import { Button } from '../utils/forms/Buttons';
import { Panel, PanelBody, PanelHeader } from '../utils/panel/Panel';
import { Muted } from '../utils/text/Text';
import * as styles from './TaxExporter.scss';

interface TaxExporterViewProps {
  export: () => Observable<any[]>;
}

export class TaxExporterView extends React.Component<TaxExporterViewProps> {
  public render(): React.ReactNode {
    return (
      <Panel footerBordered={true} style={{ width: '100%' }}>
        <PanelHeader>History export</PanelHeader>
        <PanelBody paddingVertical={true} className={styles.taxExporterPanelBody}>
        <Muted className={styles.taxExporterDescription}>
          <span>Export your trades from Oasis Contracts (2018-2019)</span>
          From eth2dai.com, oasis.direct, oasisdex.com and cdp.makerdao.com
        </Muted>
        <Button
          size="sm"
          onClick={this.exportTrades}
          className={styles.taxExporterButton}
        >
          Export
        </Button>
        </PanelBody>
      </Panel>);
  }

  private exportTrades = () => {
    this.props.export()
      .subscribe(trades => {
        const url = 'data:text/csv;charset=utf-8,' + encodeURIComponent(toCSV(trades));

        downloadCSV(url);
      });
  }
}

function toCSVRow(trade: any): string {
  return `"${Object.keys(trade).map(key => trade[key]).join('";"')}"`;
}

function toCSV(trades: any[]) {
  trades = [...trades].sort((a, b) => a.timestamp > b.timestamp ? 1 : -1);

  const rows = trades.map(trade => {
    const { time, tx, act, bidAmt, bidTkn, lotAmt, lotTkn } = trade;
    const buyAmount = act === 'buy' ? bidAmt : lotAmt;
    const sellAmount = act === 'buy' ? lotAmt : bidAmt;
    const buyToken = act === 'buy' ? lotTkn : bidTkn;
    const sellToken = act === 'buy' ? bidTkn : lotTkn;
    const date = new Date(time).toLocaleString().replace(',', '');

    return {
      sellAmount,
      buyToken,
      buyAmount,
      sellToken,
      date,
      tx
    };
  });

  const header = '"Buy amount";"Buy currency";"Sell amount";"Sell currency";"Date";"Tx"';
  return `${header}\r\n${rows.map(trade => `${toCSVRow(trade)}\r\n`).join('')}`;
}

function downloadCSV(url: string) {
  const currentDate = new Date();
  const fileName = `trades-report-${currentDate.getFullYear()}-${ (currentDate.getMonth() + 1) <= 9 ? `0 ${(currentDate.getMonth() + 1)}` : (currentDate.getMonth() + 1) }-${currentDate.getDate()}`;

  const link = document.createElement('a');
  link.href = url;

  link.download = fileName + '.csv';

  // this part will append the anchor tag and remove it after automatic click
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
