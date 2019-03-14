import * as React from 'react';
import { Observable } from 'rxjs';
import { Button } from '../utils/forms/Buttons';

interface TaxExporterButtonProps {
  export: () => Observable<any[]>;
}

export class TaxExporterButton extends React.Component<TaxExporterButtonProps> {
  public render(): React.ReactNode {
    return (
      <Button
        onClick={this.exportTrades}
      >
        Export trades
      </Button>);
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
