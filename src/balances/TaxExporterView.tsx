import * as React from 'react';
import { Observable } from 'rxjs';
import { take } from 'rxjs/internal/operators';
import { Button } from '../utils/forms/Buttons';
import { ProgressIcon } from '../utils/icons/Icons';
import { Panel, PanelBody, PanelHeader } from '../utils/panel/Panel';
import { Muted } from '../utils/text/Text';
import { TradeExport } from './taxExporter';
import * as styles from './TaxExporter.scss';

interface TaxExporterViewProps {
  export: () => Observable<any[]>;
}

interface TaxExporterState {
  inProgress: boolean;
}

export class TaxExporterView extends React.Component<TaxExporterViewProps, TaxExporterState> {
  public state = {
    inProgress: false
  };

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
          {this.state.inProgress ? <ProgressIcon className={styles.progressIcon}/> : 'Export'}
        </Button>
        </PanelBody>
      </Panel>);
  }

  private exportTrades = () => {
    if (!this.state.inProgress) {
      this.setState({ ...this.state, inProgress: true });
      this.props.export().pipe(take(1))
        .subscribe({
          next: (trades: TradeExport[]) => {
            trades = trades.filter(trade => trade.exchange !== '');
            const url = 'data:text/csv;charset=utf-8,' + encodeURIComponent(toCSV(trades));
            downloadCSV(url);
          },
          complete: () => this.setState({ ...this.state, inProgress: false })
        });
    }
  }
}

function toCSVRow(trade: any): string {
  return `"${Object.keys(trade).map(key => trade[key]).join('";"')}"`;
}

function toCSV(trades: any[]) {
  const header =
    '"Buy amount";"Buy currency";"Sell amount";"Sell currency";"Date";"Address";"Tx";"Exchange"';
  return `${header}\r\n${trades.map(trade => `${toCSVRow(trade)}\r\n`).join('')}`;
}

function downloadCSV(url: string) {
  const currentDate = new Date();
  const fileName = `trades-report-${currentDate.getFullYear()}-${(currentDate.getMonth() + 1) <= 9
    ? `0 ${(currentDate.getMonth() + 1)}`
    : (currentDate.getMonth() + 1)}-${currentDate.getDate()}`;

  const link = document.createElement('a');
  link.href = url;

  link.download = fileName + '.csv';

  // this part will append the anchor tag and remove it after automatic click
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
