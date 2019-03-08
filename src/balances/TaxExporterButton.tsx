import * as React from 'react';
import {Observable} from 'rxjs';
import {map, tap} from 'rxjs/operators';
import {Button} from '../utils/forms/Buttons';

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
    console.log('exportTrades');
    this.props.export()
    .subscribe(trades => {
      const url = 'data:text/csv;charset=utf-8,' + encodeURIComponent(toCSV(trades));
      console.log(url);
      window.open('aaaaaa', '_blank');
    });
  }
}

function toCSVRow(trade: any): string {
  return `"${Object.keys(trade).map(key => trade[key]).join('";"')}"`
}

function toCSV(trades: any[]) {
  const currentDate = new Date();
  // const fileName = `trades-report-${currentDate.getFullYear()}-${ (currentDate.getMonth() + 1) <= 9 ? '0'+(currentDate.getMonth() + 1) : (currentDate.getMonth() + 1) }-${currentDate.getDate()}`;

  trades = [...trades].sort((a, b) => a.timestamp > b.timestamp ? 1 : -1);
  trades.map(trade => {
    trade.date = new Date(trade.timestamp * 1000).toLocaleString().replace(',', '');
    return trade;
  });

  const header = '"Type";"Side";"Buy";"Cur.";"Sell";"Cur.";"Exchange";"Tx";"Address";"TS";"Date"';
  return `${header}\r\n${trades.map(trade => `${toCSVRow(trade)}\r\n`).join('')}`;

}
