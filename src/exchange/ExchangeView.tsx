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

const Content = (props: any | { parentMatch: string }) => {
  const {
    match: { params },
    parentMatch,
  } = props;
  if (props.tp.base !== params.base || props.tp.quote !== params.quote) {
    props.setTradingPair(params);
  }

  return (
    <div>
      <FlexLayoutRow>
        <Panel className={styles.tradingPairPanel}>
          <theAppContext.Consumer>
            { ({ TradingPairsTxRx }) =>
              // @ts-ignore
              <TradingPairsTxRx parentMatch={parentMatch} />
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
};

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
          <Redirect push={false} from={'/trade'} to={`/trade/${tp.base}/${tp.quote}`} />
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
