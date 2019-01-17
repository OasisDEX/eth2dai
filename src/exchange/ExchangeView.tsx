import * as React from 'react';
import { Redirect, Route, RouteComponentProps, Switch } from 'react-router';
import { map } from 'rxjs/operators';

import { theAppContext } from '../AppContext';
import { connect } from '../utils/connect';
import { FlexLayoutRow } from '../utils/layout/FlexLayoutRow';
import { Panel } from '../utils/panel/Panel';
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
        <Panel style={{ flexGrow: 1 }}>
          <theAppContext.Consumer>
            { ({ TradingPairsTxRx }) =>
              // @ts-ignore
              <TradingPairsTxRx parentMatch={parentMatch} />
            }
          </theAppContext.Consumer>
        </Panel>
      </FlexLayoutRow>
      <FlexLayoutRow>
        <Panel style={{ width: '454px', height: '341px' }} footerBordered={true}>
          <theAppContext.Consumer>
            { ({ PriceChartWithLoadingTxRx }) =>
              <PriceChartWithLoadingTxRx />
            }
          </theAppContext.Consumer>
        </Panel>
        <Panel style={{ width: '454px' }} footerBordered={true}>
          <theAppContext.Consumer>
            { ({ AllTradesTxRx }) =>
              <AllTradesTxRx />
            }
          </theAppContext.Consumer>
        </Panel>
      </FlexLayoutRow>
      <FlexLayoutRow>
        <Panel style={{ height: '474px', marginRight: '24px', flexGrow: 1 }}>

          <theAppContext.Consumer>
            { ({ OfferMakePanelTxRx }) =>
              <OfferMakePanelTxRx />
            }
          </theAppContext.Consumer>
        </Panel>
        <Panel footerBordered={true} style={{ height: '474px' }}>
          <theAppContext.Consumer>
            { ({ OrderbookPanelTxRx }) =>
              <OrderbookPanelTxRx />
            }
          </theAppContext.Consumer>
        </Panel>
      </FlexLayoutRow>
      <FlexLayoutRow>
        <Panel style={{ flexGrow: 1 }} footerBordered={true}>
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
          <Redirect push={true} from={'/exchange'} to={`/exchange/${tp.base}/${tp.quote}`} />
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
