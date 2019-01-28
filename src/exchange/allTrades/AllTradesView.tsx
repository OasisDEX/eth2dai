import * as React from 'react';
import { Subject } from 'rxjs';

import { etherscan } from '../../blockchain/etherscan';
import { formatDateTime } from '../../utils/formatters/format';
import { FormatAmount, FormatPrice } from '../../utils/formatters/Formatters';
import { Button } from '../../utils/forms/Buttons';
import { WithLoadingIndicator } from '../../utils/loadingIndicator/LoadingIndicator';
import { ServerUnreachable } from '../../utils/loadingIndicator/ServerUnreachable';
import { PanelHeader } from '../../utils/panel/Panel';
import { RowClickable, Table } from '../../utils/table/Table';
import { InfoLabel, Muted, SellBuySpan } from '../../utils/text/Text';
import { Trade } from '../trades';
import { AllTradesProps } from './allTrades';
import * as styles from './AllTradesView.scss';

export class AllTrades extends React.Component<AllTradesProps> {
  public render() {
    const showMore = (more$: Subject<any>) => () => {
      more$.next(true);
    };
    return (
      <>
        <PanelHeader
          bordered={this.props.status === 'error'}
        >Trade history</PanelHeader>
        <WithLoadingIndicator
          loadable={this.props}
          error={<ServerUnreachable/>}
        >
          { ({ trades, loading, more$ }) => (<Table align="right"
                                         scrollable={true}
                                         className={styles.allTradesTable}>
            <thead>
              <tr>
                <th><InfoLabel>Price</InfoLabel> {this.props.tradingPair.quote}</th>
                <th><InfoLabel>Amount</InfoLabel> {this.props.tradingPair.base}</th>
                <th>Time</th>
              </tr>
            </thead>
            <tbody>
              {trades.map((trade, i) => (
                  <RowClickable key={i} clickable={!!trade.tx} onClick={this.tradeDetails(trade)}>
                    <td>
                      <SellBuySpan type={trade.act}>
                        <FormatPrice value={trade.price} token={trade.quoteToken} />
                      </SellBuySpan>
                    </td>
                    <td>
                      <FormatAmount value={trade.baseAmount} token={trade.baseToken} />
                    </td>
                    <td>
                      <Muted>{formatDateTime(trade.time)}</Muted>
                    </td>
                  </RowClickable>
                )
              )}
              <tr>
                <td colSpan={3}>
                  <Button onClick={showMore(more$)}
                          block={true}
                          size="md"
                          disabled={loading}
                  >
                    { loading ? <span className={styles.loader} /> : 'Load more' }
                  </Button>
                </td>
              </tr>
            </tbody>
          </Table>) }
        </WithLoadingIndicator>
      </>
    );
  }

  public tradeDetails = (trade: Trade) => {
    return (): void => {
      etherscan(this.props.etherscan).transaction(trade.tx as string).open();
    };
  }
}
