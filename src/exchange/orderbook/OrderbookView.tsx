// tslint:disable:no-console
import { equals } from 'ramda';
import * as React from 'react';
import { default as MediaQuery } from 'react-responsive';
import { CSSTransition, TransitionGroup } from 'react-transition-group';
import { combineLatest, Observable } from 'rxjs';
import { distinctUntilKeyChanged, map, startWith } from 'rxjs/operators';

import { FormChangeKind, PickOfferChange } from '../../utils/form';
import { FormatAmount, FormatPriceOrder } from '../../utils/formatters/Formatters';
import { Button } from '../../utils/forms/Buttons';
import { SvgImage } from '../../utils/icons/utils';
import { Loadable, LoadableStatus, loadablifyLight } from '../../utils/loadable';
import { WithLoadingIndicator } from '../../utils/loadingIndicator/LoadingIndicator';
import { PanelHeader } from '../../utils/panel/Panel';
import { Scrollbar } from '../../utils/Scrollbar/Scrollbar';
import { RowClickable, RowHighlighted, Table } from '../../utils/table/Table';
import * as tableStyles from '../../utils/table/Table.scss';
import { Currency, InfoLabel, Muted, SellBuySpan } from '../../utils/text/Text';
import { OfferFormState } from '../offerMake/offerMake';
import { OrderbookViewKind } from '../OrderbookPanel';
import { TradingPair, tradingPairResolver } from '../tradingPair/tradingPair';
import depthChartSvg from './depth-chart.svg';
import { Offer, Orderbook } from './orderbook';
import * as styles from './OrderbookView.scss';

export function createOrderbookForView(
  currentOrderBook$: Observable<Orderbook>,
  currentOfferForm$: Observable<OfferFormState>,
  kindChange: (kind: OrderbookViewKind) => void,
): Observable<Props> {
  return combineLatest(
    loadablifyLight(currentOrderBook$),
    currentOfferForm$.pipe(
      distinctUntilKeyChanged('change'),
      startWith({ change: () => null } as any),
    ),
  ).pipe(
    map(([currentOrderBook, { change }]) => ({
      tradingPair: (currentOrderBook.value && currentOrderBook.value.tradingPair) as TradingPair,
      ...currentOrderBook,
      change,
      kindChange,
    })),
  );
}

export interface Props extends Loadable<Orderbook> {
  change: (ch: PickOfferChange) => void;
  kindChange: (kind: OrderbookViewKind) => void;
  tradingPair: TradingPair;
}

export class OrderbookView extends React.Component<Props> {

  private lastTradingPair?: TradingPair;
  private lastStatus?: LoadableStatus;
  private centerRow?: HTMLElement;
  private scrollbar?: Scrollbar;
  private autoScroll: boolean = false;
  private centerRowOffset: number = 0;

  public center() {
    this.autoScroll = true;
    if (this.scrollbar && this.centerRow) {
      this.scrollbar.center(
        this.centerRow.offsetTop - this.centerRowOffset,
        this.centerRow.clientHeight
      );
    }
  }

  public componentDidMount() {
    this.center();
  }

  public enter = () => {
    this.center();
  }

  public exit = () => {
    setTimeout(() => {
      this.center();
    });
  }

  public scrolled = () => {
    if (!this.autoScroll && this.scrollbar && this.centerRow) {
      const { scrollTop, clientHeight } = this.scrollbar.scrollState();
      this.centerRowOffset =
        this.centerRow.offsetTop - scrollTop - (clientHeight - this.centerRow.clientHeight) / 2;
    }
    this.autoScroll = false;
  }

  public shouldComponentUpdate(nextProps: Props): boolean {
    return !equals(nextProps, this.props);
  }

  public render() {
    const tradingPairChanged = this.lastTradingPair &&
      tradingPairResolver(this.lastTradingPair) !== tradingPairResolver(this.props.tradingPair);
    this.lastTradingPair = this.props.tradingPair;

    const justLoaded = (!this.lastStatus || this.lastStatus === 'loading') &&
      this.props.status === 'loaded';
    this.lastStatus = this.props.status;

    const skipTransition = justLoaded || tradingPairChanged;
    if (skipTransition) {
      setTimeout(() => {
        this.forceUpdate(() => {
          this.center();
        });
      });
    }

    return (
      <>
        <PanelHeader>
          <span>Order book</span>
          <div style={{ marginLeft: 'auto', display: 'flex' }}>
            <MediaQuery maxWidth={992}>
              {(matches) => {
                let isDisabled = false;

                if (matches) {
                  isDisabled = true;
                }

                return <Button
                  disabled={isDisabled}
                  className={styles.switchBtn}
                  onClick={this.changeChartListView}
                  data-test-id="orderbook-type-list"
                >
                  <SvgImage image={depthChartSvg}/>
                </Button>;
              }}
            </MediaQuery>
          </div>
        </PanelHeader>
        <Table align="right" className={styles.orderbookTable}>
          <thead>
          <tr>
            <th>
              <InfoLabel>Price </InfoLabel>
              <Currency theme="semi-bold"
                        value={this.props.tradingPair && this.props.tradingPair.quote}/>
            </th>
            <th>
              <InfoLabel>Amount </InfoLabel>
              <Currency theme="semi-bold"
                        value={this.props.tradingPair && this.props.tradingPair.base}/>
            </th>
            <th>
              <InfoLabel>Total </InfoLabel>
              <Currency theme="semi-bold"
                        value={this.props.tradingPair && this.props.tradingPair.quote}/>
            </th>
          </tr>
          </thead>
        </Table>
        <WithLoadingIndicator
          loadable={skipTransition ? { status: 'loading' } : this.props}
          size="lg"
        >
          {(orderbook: Orderbook) => {
            const takeOffer = (offer: Offer) => {
              return (): void => {
                this.props.change({
                  offer,
                  kind: FormChangeKind.pickOfferChange,
                });
              };
            };

            const { base, quote } = orderbook.tradingPair;
            return (
              <>
                {/*
                  This line exists only so that in e2e
                  we wait the order book for a given pair
                  to be loaded before we assert anything else.
                */}
                <span data-test-id={`${base}-${quote}-orderbook`}/>
                <Scrollbar ref={el => this.scrollbar = el || undefined} onScroll={this.scrolled}>
                  <Table align="right" className={styles.orderbookTable}>
                    <TransitionGroup
                      component="tbody"
                      exit={true}
                      enter={true}
                    >
                      {orderbook.sell.slice().reverse().map((offer: Offer) => (
                        <CSSTransition
                          key={offer.offerId.toString()}
                          classNames="order"
                          timeout={1000}
                          onEntering={this.enter}
                          onExited={this.exit}
                        >
                          <this.OfferRow offer={offer} kind="sell" onClick={takeOffer}/>
                        </CSSTransition>
                      ))
                      }

                      {/* better don't remove me! */}
                      <CSSTransition key="0" classNames="order" timeout={1000}>
                        <RowHighlighted>
                          <td ref={el => this.centerRow = el || undefined}>
                            {orderbook.spread
                              ? <FormatAmount value={orderbook.spread}
                                              token={this.props.tradingPair.quote}
                              />
                              : '-'}
                          </td>
                          <td/>
                          <td>
                            <Muted>{this.props.tradingPair.quote} Spread</Muted>
                          </td>
                        </RowHighlighted>
                      </CSSTransition>

                      {orderbook.buy.map((offer: Offer) => (
                        <CSSTransition
                          key={offer.offerId.toString()}
                          classNames="order"
                          timeout={1000}
                          onEntering={this.enter}
                          onExited={this.exit}
                        >
                          <this.OfferRow offer={offer} kind="buy" onClick={takeOffer}/>
                        </CSSTransition>
                      ))}
                    </TransitionGroup>
                  </Table>
                </Scrollbar>
              </>
            );
          }}
        </WithLoadingIndicator>
      </>
    );
  }

  public OfferRow({ offer, kind, onClick }: {
    offer: Offer,
    kind: string,
    onClick: (attr: any) => any
  }) {
    return (
      <RowClickable
        data-test-id={kind}
        clickable={true}
        onClick={onClick(offer)}>
        <td data-test-id="price">
          <SellBuySpan type={kind}>
            <FormatPriceOrder value={offer.price} token={offer.quoteToken} kind={kind}/>
          </SellBuySpan>
        </td>
        <td className={tableStyles.numerical} data-test-id="amount">
          <FormatAmount value={offer.baseAmount} token={offer.baseToken}/>
        </td>
        <td className={tableStyles.numerical} data-test-id="total">
          <FormatAmount value={offer.quoteAmount} token={offer.quoteToken}/>
        </td>
      </RowClickable>
    );
  }

  private changeChartListView = () => {
    if (this.props.kindChange) {
      this.props.kindChange(OrderbookViewKind.depthChart);
    }
  }

}
