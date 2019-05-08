import classnames from 'classnames';
import * as React from 'react';

import { BigNumber } from 'bignumber.js';
import { etherscan } from '../../blockchain/etherscan';
import { formatDateTime } from '../../utils/formatters/format';
import { FormatAmount, FormatPriceOrder } from '../../utils/formatters/Formatters';
import { Button, ButtonGroup, CloseButton } from '../../utils/forms/Buttons';
import { ProgressIcon } from '../../utils/icons/Icons';
import { Authorization } from '../../utils/loadingIndicator/Authorization';
import { WithLoadingIndicator } from '../../utils/loadingIndicator/LoadingIndicator';
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
    const { value, kind, changeKind, tradingPair } = this.props;
    return (
      <>
        <PanelHeader bordered={value && value.status === 'error'}>
          <span>My Orders</span>
          <ButtonGroup style={{ marginLeft: 'auto' }}>
            <Button
              size="sm"
              color={kind === MyTradesKind.open ? 'whiteOutlined' : 'grey'}
              className={styles.orderTypeBtn}
              onClick={() => changeKind && changeKind(MyTradesKind.open)}
            >Open</Button>
            <Button
              size="sm"
              color={kind === MyTradesKind.closed ? 'whiteOutlined' : 'grey'}
              className={styles.orderTypeBtn}
              onClick={() => changeKind && changeKind(MyTradesKind.closed)}
            >Close</Button>
          </ButtonGroup>
        </PanelHeader>

        <Table align="left"
               className={classnames(styles.myTradesTable, {
                 [styles.myOpenTradesTable]: kind === MyTradesKind.open,
                 [styles.myCloseTradesTable]: kind === MyTradesKind.closed,
               })}>
          <thead>
          <tr>
            <th>Type</th>
            <th className={styles.right}>
              <InfoLabel>Price</InfoLabel> {tradingPair.quote}
            </th>
            <th className={styles.right}>
              <InfoLabel>Amount</InfoLabel> {tradingPair.base}
            </th>
            <th className={styles.right}>
              <InfoLabel>Total</InfoLabel> {tradingPair.quote}
            </th>
            <th className={classnames(this.props.kind === MyTradesKind.open ? 'hide-md' : '', styles.right)}>Time</th>
            {this.props.kind === MyTradesKind.open &&
            <th className={styles.right}>Status</th>
            }
          </tr>
          </thead>
        </Table>
        <Authorization authorizable={this.props} view={`${kind} orders`}>
          {loadable => <WithLoadingIndicator
            loadable={loadable}
            error={kind === MyTradesKind.closed ? <ServerUnreachable/> : undefined}
          >
            {(trades: TradeWithStatus[]) => (
              <>
                <Scrollbar>
                  <Table align="left" className={styles.myTradesTable}>
                    <tbody>
                    {trades
                      .map((trade: TradeWithStatus, i: number) => {
                        return (
                          <RowClickable
                            data-test-id="my-trades"
                            key={i}
                            clickable={kind === MyTradesKind.closed}
                            onClick={this.showInEtherscan(trade)}
                          >
                            <td data-test-id="type">
                              <SellBuySpan type={trade.act}>{trade.act}</SellBuySpan>
                            </td>
                            <td data-test-id="price" className={styles.right}>
                              <FormatPriceOrder value={trade.price} token={trade.quoteToken} kind={trade.kind}/>
                            </td>
                            <td data-test-id="amount" className={styles.right}>
                              <FormatAmount value={trade.baseAmount} token={trade.baseToken}/>
                            </td>
                            <td data-test-id="total" className={styles.right}>
                              <FormatAmount value={trade.quoteAmount} token={trade.quoteToken}/>
                            </td>
                            <td
                              className={classnames(kind === MyTradesKind.open ? 'hide-md' : '', styles.right)}>
                              <Muted data-vis-reg-mask={true}>{formatDateTime(trade.time)}</Muted>
                            </td>
                            {kind === MyTradesKind.open &&
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
                            {kind === MyTradesKind.open &&
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
          </WithLoadingIndicator>}
        </Authorization>
      </>
    );
  }

  public cancelOffer = (offerId: BigNumber, type: TradeAct, amount: BigNumber, token: string) => {
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
