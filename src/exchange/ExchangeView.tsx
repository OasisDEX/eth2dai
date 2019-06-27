import classnames from 'classnames';
import * as React from 'react';
import { Redirect, Route, RouteComponentProps, Switch } from 'react-router';
import { map } from 'rxjs/operators';

import { theAppContext } from '../AppContext';
import { connect } from '../utils/connect';
import { FlexLayoutRow } from '../utils/layout/FlexLayoutRow';
import { Panel } from '../utils/panel/Panel';
import * as styles from './ExchangeView.scss';
import { currentTradingPair$, TradingPair } from './tradingPair/tradingPair';

export interface ExchangeViewOwnProps {
  setTradingPair: (tp: TradingPair) => void;
  tp: TradingPair;
}

type ExchangeViewProps = RouteComponentProps<any> & ExchangeViewOwnProps;

interface ContentProps extends RouteComponentProps<any> {
  tp: TradingPair;
  parentMatch: string;
  setTradingPair: (tp: TradingPair) => void;
}

class Content extends React.Component<ContentProps, { pairPickerOpen: boolean }> {
  constructor(props: ContentProps) {
    super(props);
    this.state = { pairPickerOpen: false };
  }

  public render() {
    const {
      match: { params },
      parentMatch,
      tp,
      setTradingPair,
    } = this.props;

    if (tp.base !== params.base || tp.quote !== params.quote) {
      setTradingPair(params);
    }

    return (
      <div>
        <FlexLayoutRow>
          <Panel className={classnames(
            styles.tradingPairPanel,
            this.state.pairPickerOpen && styles.pairPickerOpen,
          )}>
            <theAppContext.Consumer>
              { ({ TradingPairsTxRx }) =>
                // @ts-ignore
                <TradingPairsTxRx
                  parentMatch={parentMatch}
                  setPairPickerOpen={(pairPickerOpen: boolean) => this.setState({ pairPickerOpen })}
                />
              }
            </theAppContext.Consumer>
          </Panel>
        </FlexLayoutRow>
        <FlexLayoutRow>
          <Panel className={styles.priceChartPanel} footerBordered={true}>
            <theAppContext.Consumer>
              { ({ PriceChartWithLoadingTxRx }) =>
                <PriceChartWithLoadingTxRx />
              }
            </theAppContext.Consumer>
          </Panel>
          <Panel className={styles.allTradesPanel} footerBordered={true}>
            <theAppContext.Consumer>
              { ({ AllTradesTxRx }) =>
                <AllTradesTxRx />
              }
            </theAppContext.Consumer>
          </Panel>
        </FlexLayoutRow>
        <FlexLayoutRow>
          <Panel className={styles.offerMakePanel}>

            <theAppContext.Consumer>
              { ({ OfferMakePanelTxRx }) =>
                <OfferMakePanelTxRx />
              }
            </theAppContext.Consumer>
          </Panel>
          <Panel footerBordered={true} className={styles.orderbookPanel}>
            <theAppContext.Consumer>
              { ({ OrderbookPanelTxRx }) =>
                <OrderbookPanelTxRx />
              }
            </theAppContext.Consumer>
          </Panel>
        </FlexLayoutRow>
        <FlexLayoutRow>
          <Panel className={styles.myOrdersPanel} footerBordered={true}>
            <theAppContext.Consumer>
              { ({ MyTradesTxRx }) =>
                <MyTradesTxRx />
              }
            </theAppContext.Consumer>
          </Panel>
        </FlexLayoutRow>
      </div>
    );
  }
}

export class ExchangeView extends React.Component<ExchangeViewProps> {
  public render() {
    const {
      match: { url: matchUrl },
      tp,
    } = this.props;

    return (
      <div>
        <Switch>
          <Route
            path={`${matchUrl}/:base/:quote`}
            render={props => (
              <Content
                {...props}
                tp={tp}
                parentMatch={matchUrl}
                setTradingPair={this.props.setTradingPair}
                 />
            )}
          />
          <Redirect push={false} from={'/market'} to={`/market/${tp.base}/${tp.quote}`} />
        </Switch>
      </div>
    );
  }
}

export const ExchangeViewTxRx = connect<ExchangeViewOwnProps, RouteComponentProps<any>>(
  ExchangeView,
  currentTradingPair$.pipe(map((tp: TradingPair) => ({
    tp,
    setTradingPair: currentTradingPair$.next.bind(currentTradingPair$),
  })))
);
