import classnames from 'classnames';
import * as React from 'react';

import { BigNumber } from 'bignumber.js';
import { etherscan } from '../../blockchain/etherscan';
import { formatDateTime } from '../../utils/formatters/format';
import { FormatAmount, FormatPriceOrder } from '../../utils/formatters/Formatters';
import { Button, ButtonGroup, CloseButton } from '../../utils/forms/Buttons';
import { ProgressIcon } from '../../utils/icons/Icons';
import { Gate } from '../../utils/loadingIndicator/Gate';
import { WithLoadingIndicator } from '../../utils/loadingIndicator/LoadingIndicator';
import { LoggedOut } from '../../utils/loadingIndicator/LoggedOut';
import { ServerUnreachable } from '../../utils/loadingIndicator/ServerUnreachable';
import { PanelHeader } from '../../utils/panel/Panel';
import { Scrollbar } from '../../utils/Scrollbar/Scrollbar';
import { RowClickable, Table } from '../../utils/table/Table';
import { InfoLabel, Muted, SellBuySpan } from '../../utils/text/Text';
import { Trade, TradeAct } from '../trades';
import { MyTradesKind, MyTradesPropsLoadable } from './myTrades';
import * as styles from './MyTradesView.scss';
import { TradeWithStatus } from './openTrades';

export class MyTrades extends React.Component<MyTradesPropsLoadable> {
  public render() {
    return (
      <>
        <PanelHeader bordered={this.props.status === 'error'}>
          <span>My Orders</span>
          <ButtonGroup style={{ marginLeft: 'auto' }}>
            <Button
              size="sm"
              color={ this.props.kind === MyTradesKind.open ? 'whiteOutlined' : 'grey' }
              className={styles.orderTypeBtn}
              onClick={() => this.props.changeKind && this.props.changeKind(MyTradesKind.open)}
            >Open</Button>
            <Button
              size="sm"
              color={ this.props.kind === MyTradesKind.closed ? 'whiteOutlined' : 'grey' }
              className={styles.orderTypeBtn}
              onClick={() => this.props.changeKind && this.props.changeKind(MyTradesKind.closed)}
            >Close</Button>
          </ButtonGroup>
        </PanelHeader>
        <Gate
          isOpen={!!this.props.account}
          closed={<LoggedOut/>}
        >
          <WithLoadingIndicator
            loadable={this.props}
            error={this.props.kind === MyTradesKind.closed ? <ServerUnreachable/> : undefined }
          >
            { (trades: TradeWithStatus[]) => (
              <>
              <Table align="left"
                className={classnames(styles.myTradesTable, {
                  [styles.myOpenTradesTable]: this.props.kind === MyTradesKind.open,
                  [styles.myCloseTradesTable]: this.props.kind === MyTradesKind.closed,
                })}>
              <thead>
                <tr>
                  <th>Type</th>
                  <th className={styles.right}>
                    <InfoLabel>Price</InfoLabel> {this.props.tradingPair.quote}
                  </th>
                  <th className={styles.right}>
                    <InfoLabel>Amount</InfoLabel> {this.props.tradingPair.base}
                  </th>
                  <th className={styles.right}>
                    <InfoLabel>Total</InfoLabel> {this.props.tradingPair.quote}
                  </th>
                  <th className={classnames(this.props.kind === MyTradesKind.open ? 'hide-md' : '', styles.right)}>Time</th>
                  { this.props.kind === MyTradesKind.open &&
                    <th className={styles.right}>Status</th>
                  }
                </tr>
              </thead>
              </Table>
              <Scrollbar>
                <Table align="left" className={styles.myTradesTable}>
                  <tbody>
                  {trades
                    .map((trade: TradeWithStatus, i: number) => {
                      return (
                        <RowClickable
                          data-test-id="my-trades"
                          key={i}
                          clickable={this.props.kind === MyTradesKind.closed}
                          onClick={this.showInEtherscan(trade)}
                        >
                          <td data-test-id="type">
                            <SellBuySpan type={trade.act}>{trade.act}</SellBuySpan>
                          </td>
                          <td data-test-id="price" className={styles.right}>
                            <FormatPriceOrder value={trade.price} token={trade.quoteToken} kind={trade.kind} />
                          </td>
                          <td data-test-id="amount" className={styles.right}>
                            <FormatAmount value={trade.baseAmount} token={trade.baseToken} />
                          </td>
                          <td data-test-id="total" className={styles.right}>
                            <FormatAmount value={trade.quoteAmount} token={trade.quoteToken} />
                          </td>
                          <td className={classnames(this.props.kind === MyTradesKind.open ? 'hide-md' : '', styles.right)}>
                            <Muted data-vis-reg-mask={true}>{formatDateTime(trade.time)}</Muted>
                          </td>
                          { this.props.kind === MyTradesKind.open &&
                          trade.status === undefined &&
                          <td className={styles.right}>
                          <span className={classnames('hide-md', styles.statusText)}>
                            Open
                          </span>
                            <CloseButton data-test-id="cancel"
                                         onClick={this.cancelOffer(trade.offerId, trade.act, trade.baseAmount, trade.baseToken)}
                            />
                          </td>
                          }
                          { this.props.kind === MyTradesKind.open &&
                          trade.status !== undefined &&
                          <td className={classnames(styles.status, styles.right)}>
                            <span className={classnames('hide-md', styles.statusText)}>
                              pending
                            </span>
                            <ProgressIcon className={styles.statusProgress}/>
                          </td>
                          }
                        </RowClickable>
                      );
                    })}
                  </tbody>
                </Table>
              </Scrollbar>
              </>
          )}
          </WithLoadingIndicator>
        </Gate>
      </>
    );
  }

  public cancelOffer = (offerId:BigNumber, type: TradeAct, amount: BigNumber, token: string) => {
    return (): void => {
      this.props.cancelOffer({ offerId, type, amount, token });
    };
  }

  public showInEtherscan = (trade: Trade) => {
    return (): void => {
      etherscan(this.props.etherscan).transaction(trade.tx as string).open();
    };
  }
}
