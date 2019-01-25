// tslint:disable:no-console
import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { CSSTransitionGroup } from 'react-transition-group';
import * as styles from './OrderbookView.scss';

import { FormChangeKind, PickOfferChange } from '../../utils/form';
import { FormatAmount, FormatPrice } from '../../utils/formatters/Formatters';
import { LoadableStatus, LoadableWithTradingPair } from '../../utils/loadable';
import { WithLoadingIndicator } from '../../utils/loadingIndicator/LoadingIndicator';
import { RowClickable, RowHighlighted, Table } from '../../utils/table/Table';
import { Currency, InfoLabel, Muted, SellBuySpan } from '../../utils/text/Text';
import { TradingPair, tradingPairResolver } from '../tradingPair/tradingPair';
import { Offer, Orderbook } from './orderbook';

export interface Props extends LoadableWithTradingPair<Orderbook> {
  account: string | undefined;
  change: (change: PickOfferChange) => void;
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
}
