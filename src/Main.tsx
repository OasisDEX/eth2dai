import createBrowserHistory from 'history/createBrowserHistory';
import * as React from 'react';
import { Redirect, Route, Router, Switch } from 'react-router';
import { RouteComponentProps, withRouter } from 'react-router-dom';

import { setupAppContext, theAppContext } from './AppContext';
import { BalancesView } from './balances/BalancesView';
import { ExchangeViewTxRx } from './exchange/ExchangeView';
import { HeaderTxRx } from './header/Header';
import * as styles from './index.scss';
import { InstantExchange } from './instant/InstantViewPanel';

const browserHistoryInstance = createBrowserHistory();

export class Main extends React.Component {
  public render() {
    return (
      <theAppContext.Provider value={setupAppContext()}>
        <Router history={browserHistoryInstance}>
          <MainContentWithRouter />
        </Router>
      </theAppContext.Provider>
    );
  }
}

interface RouterProps extends RouteComponentProps<any>{}

export class MainContent extends React.Component<RouterProps> {
  public render() {
    return (
      <routerContext.Provider value={{ rootUrl: this.props.match.url }}>
        <div className={styles.container}>
          <theAppContext.Consumer>
            { ({ TransactionNotifierTxRx }) =>
              <TransactionNotifierTxRx />
            }
          </theAppContext.Consumer>
          <HeaderTxRx />
          <Switch>
            <Route exact={false} path={'/exchange'} component={ExchangeViewTxRx}/>
            {process.env.REACT_APP_INSTANT_ENABLED === '1' &&
            <Route exact={false} path={'/instant'} component={InstantExchange}/>}
            <Route path={'/balances'} component={BalancesView} />
            <Redirect from={'/'} to={'/exchange'}/>
          </Switch>
          <theAppContext.Consumer>
            { ({ TheFooterTxRx }) =>
              <TheFooterTxRx/>
            }
          </theAppContext.Consumer>
        </div>
      </routerContext.Provider>
    );
  }
}

const MainContentWithRouter = withRouter(MainContent);

interface RouterContext {
  rootUrl: string;
}

export const routerContext = React.createContext<RouterContext>({ rootUrl: '/' });
