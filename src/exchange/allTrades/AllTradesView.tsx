import { equals } from 'ramda';
import * as React from 'react';
import { CSSTransition, TransitionGroup } from 'react-transition-group';
import { Subject } from 'rxjs';

import { etherscan } from '../../blockchain/etherscan';
import { formatDateTime } from '../../utils/formatters/format';
import { FormatAmount, FormatPriceOrder } from '../../utils/formatters/Formatters';
import { Button } from '../../utils/forms/Buttons';
import { LoadableStatus } from '../../utils/loadable';
import { WithLoadingIndicator } from '../../utils/loadingIndicator/LoadingIndicator';
import { ServerUnreachable } from '../../utils/loadingIndicator/ServerUnreachable';
import { PanelHeader } from '../../utils/panel/Panel';
import { Scrollbar } from '../../utils/Scrollbar/Scrollbar';
import { RowClickable, Table } from '../../utils/table/Table';
import * as tableStyles from '../../utils/table/Table.scss';
import { InfoLabel, Muted, SellBuySpan } from '../../utils/text/Text';
import { Trade } from '../trades';
import { TradingPair } from '../tradingPair/tradingPair';
import { AllTradesProps } from './allTrades';
import * as styles from './AllTradesView.scss';

export class AllTrades extends React.Component<AllTradesProps> {
  private lastTradingPair?: TradingPair;
  private lastLoadingStatus?: LoadableStatus;

  public shouldComponentUpdate(nextProps: AllTradesProps): boolean {
    return !equals(nextProps, this.props);
  }

  public render() {
    const showMore = (more$: Subject<any>) => () => {
      more$.next(true);
    };

    const skipTransition = !equals(this.props.tradingPair, this.lastTradingPair) ||
      (this.lastLoadingStatus === 'loading' && this.props.status === 'loaded');
    this.lastTradingPair = this.props.tradingPair;
    this.lastLoadingStatus = this.props.status;
    if (skipTransition) {
      setTimeout(() => {
        this.forceUpdate();
      });
    }

    return (
      <>
        <PanelHeader bordered={this.props.status === 'error'}>
          Trade history
        </PanelHeader>
        <Table align="right" className={styles.allTradesTable}>
          <thead>
          <tr>
            <th><InfoLabel>Price</InfoLabel> {this.props.tradingPair.quote}</th>
            <th><InfoLabel>Amount</InfoLabel> {this.props.tradingPair.base}</th>
            <th>Time</th>
          </tr>
          </thead>
        </Table>
        <WithLoadingIndicator
          loadable={skipTransition ? { status: 'loading' } : this.props}
          size="lg"
          error={<ServerUnreachable/>}
        >
          {({ trades, loading, more$ }) => {
            return <>
              <Scrollbar>
                <Table align="right" className={styles.allTradesTable}>
                  <TransitionGroup component="tbody">
                    {trades.map(trade => (
                      <CSSTransition
                        key={`${trade.tx}_${trade.idx}`}
                        classNames="trade"
                        timeout={1000}
                      >
                        <RowClickable clickable={!!trade.tx} onClick={this.tradeDetails(trade)}>
                          <td className={tableStyles.numerical}>
                            <SellBuySpan type={trade.act}>
                              <FormatPriceOrder value={trade.price}
                                                token={trade.quoteToken}
                                                kind={trade.kind}
                              />
                            </SellBuySpan>
                          </td>
                          <td className={tableStyles.numerical}>
                            <FormatAmount value={trade.baseAmount} token={trade.baseToken}/>
                          </td>
                          <td>
                            <Muted>{formatDateTime(trade.time)}</Muted>
                          </td>
                        </RowClickable>
                      </CSSTransition>
                    ))}

                    {/* don't remove me! */}
                    <CSSTransition key="0" classNames="trade" timeout={1000}>
                      <tr>
                        <td className={styles.loadMore} colSpan={3}>
                          <Button onClick={showMore(more$)}
                                  block={true}
                                  size="md"
                                  disabled={loading}
                          >
                            {loading ? <span className={styles.loader}/> : 'Load more'}
                          </Button>
                        </td>
                      </tr>
                    </CSSTransition>
                  </TransitionGroup>
                </Table>
              </Scrollbar>
            </>;
          }}
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
