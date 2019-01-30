// tslint:disable:no-console
import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { CSSTransitionGroup } from 'react-transition-group';
import * as styles from './OrderbookView.scss';

import { FormChangeKind, PickOfferChange } from '../../utils/form';
import { FormatAmount, FormatPrice } from '../../utils/formatters/Formatters';
import { Button } from '../../utils/forms/Buttons';
import { LoadableStatus, LoadableWithTradingPair } from '../../utils/loadable';
import { WithLoadingIndicator } from '../../utils/loadingIndicator/LoadingIndicator';
import { PanelHeader } from '../../utils/panel/Panel';
import { RowClickable, RowHighlighted, Table } from '../../utils/table/Table';
import { Currency, InfoLabel, Muted, SellBuySpan } from '../../utils/text/Text';
import { OrderbookViewKind } from '../OrderbookPanel';
import { TradingPair, tradingPairResolver } from '../tradingPair/tradingPair';
import { Offer, Orderbook } from './orderbook';

export interface Props extends LoadableWithTradingPair<Orderbook> {
  account: string | undefined;
  change: (change: PickOfferChange) => void;
  kindChange: (kind: OrderbookViewKind) => void;
}

export class OrderbookView extends React.Component<Props> {

  private lastTradingPair?: TradingPair;
  private lastStatus?: LoadableStatus;
  private tbody?: HTMLElement;
  private spreadRow?: HTMLElement;

  public center() {
    if (this.tbody && this.spreadRow && typeof(this.tbody.scrollTo) === 'function') {
      const firstRow: HTMLElement = this.tbody.children[0] as HTMLElement;
      this.tbody.scrollTo(0, this.spreadRow.offsetTop - firstRow.offsetTop -
        (this.tbody.clientHeight - firstRow.clientHeight) / 2);
    }
  }

  public componentDidMount() {
    this.center();
  }

  public render() {

    const tradingPairChanged = this.lastTradingPair &&
      tradingPairResolver(this.lastTradingPair) !== tradingPairResolver(this.props.tradingPair);
    this.lastTradingPair = this.props.tradingPair;

    const justLoaded = (!this.lastStatus || this.lastStatus === 'loading') &&
      this.props.status === 'loaded';
    this.lastStatus = this.props.status;

    if (justLoaded || tradingPairChanged) {
      setTimeout(() => {
        this.center();
      });
    }

    const skipTransition = tradingPairChanged;

    return (
      <div className={styles.orderbook} >
        <PanelHeader>
          <span>Order book</span>
          <div style={{ marginLeft: 'auto', display: 'flex' }}>
            <Button
              className={styles.switchBtn}
              onClick={this.changeChartListView}
              data-test-id={`orderbook-type-list`}
            >
              <ToChartSwitchBtn/>
            </Button>
          </div>
        </PanelHeader>
        <WithLoadingIndicator loadable={this.props}>
          { (orderbook: Orderbook) => (<Table align="right" scrollable={true}
                                              className={styles.orderbookTable}>
              <thead>
              <tr>
                <th>
                  <InfoLabel>Price</InfoLabel> <Currency value={this.props.tradingPair.quote}/>
                </th>
                <th>
                  <InfoLabel>Amount</InfoLabel> <Currency value={this.props.tradingPair.base}/>
                </th>
                <th>
                  <InfoLabel>Total</InfoLabel> <Currency value={this.props.tradingPair.quote}/>
                </th>
              </tr>
              </thead>
              {!skipTransition && <CSSTransitionGroup
                component="tbody"
                transitionName="order"
                transitionEnterTimeout={1000}
                transitionLeaveTimeout={600}
                ref={el =>
                  this.tbody = (el && ReactDOM.findDOMNode(el) as HTMLElement) || undefined
                }
              >
                { orderbook.sell.slice().reverse().map((offer: Offer) => (
                  <this.OfferRow offer={offer}
                                 kind="sell"
                                 parent={this}
                                 key={offer.offerId.toString()} />
                ))
                }
                <RowHighlighted>
                  <td ref={el => this.spreadRow = el || undefined}>
                    {orderbook.spread
                      ? <FormatAmount value={orderbook.spread} token={this.props.tradingPair.quote} />
                      : '-'}
                  </td>
                  <td/>
                  <td>
                    <Muted>{this.props.tradingPair.quote} Spread</Muted>
                  </td>
                </RowHighlighted>

                { orderbook.buy.map((offer: Offer) => {
                  return (
                    <this.OfferRow
                      offer={offer}
                      kind="buy"
                      parent={this}
                      key={offer.offerId.toString()} />
                  );
                })}
              </CSSTransitionGroup> }
            </Table>
          )}
        </WithLoadingIndicator>
      </div>
    );
  }

  public OfferRow(
    { offer, kind, parent, key } :
    { offer: Offer, kind: string, parent: any, key: string }
  ) {
    return (
      <RowClickable
        data-test-id={kind}
        key={key}
        clickable={parent.canTakeOffer(offer)}
        onClick={ parent.takeOffer(offer)}>
        <td data-test-id="price">
          <SellBuySpan type={kind}>
            <FormatPrice value={offer.price} token={offer.quoteToken} />
          </SellBuySpan>
        </td>
        <td data-test-id="amount">
          <FormatAmount value={offer.baseAmount} token={offer.baseToken} />
        </td>
        <td data-test-id="total">
          <FormatAmount value={offer.quoteAmount} token={offer.quoteToken} />
        </td>
      </RowClickable>
    );
  }

  public canTakeOffer(offer: Offer): boolean {
    return offer.ownerId !== this.props.account;
  }

  public takeOffer = (offer: Offer) => {
    return (): void => {
      this.props.change({
        offer,
        kind: FormChangeKind.pickOfferChange,
      });
    };
  }

  private changeChartListView = () => {
    this.props.kindChange(OrderbookViewKind.depthChart);
  }

}

class ToChartSwitchBtn extends React.PureComponent {
  public render() {
    return (
      <svg width="18px" height="18px" viewBox="0 0 18 18" version="1.1">
        <g transform="translate(-6.000000, -6.000000)" fill="white" fillRule="nonzero">
          <g transform="translate(3.000000, 3.000000)">
            <path d="M19,3 L5,3 C3.9,3 3,3.9 3,5 L3,19 C3,20.1 3.9,21 5,21 L19,21 C20.1,21 21,20.1 21,19 L21,5 C21,3.9 20.1,3 19,3 Z M10,19 L5,19 L5,12 L12,12 L12,17 C12,18.1045695 11.1045695,19 10,19 Z M19,12 L12,12 L12,7 C12,5.8954305 12.8954305,5 14,5 L19,5 L19,12 Z"/>
          </g>
        </g>
      </svg>
    );
  }
}
