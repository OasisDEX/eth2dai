import createBrowserHistory from 'history/createBrowserHistory';
import * as React from 'react';
import { Redirect, Route, Router, Switch } from 'react-router';
import { setupAppContext, theAppContext } from './AppContext';
import { BalancesView } from './balances/BalancesView';
import { ExchangeViewTxRx } from './exchange/ExchangeView';
import { HeaderWithRouter } from './header/Header';
import * as styles from './index.scss';

const browserHistoryInstance = createBrowserHistory();

export class Main extends React.Component {
  public render() {
    return (<theAppContext.Provider value={setupAppContext()}>
      <Router history={browserHistoryInstance}>
        <div className={styles.container}>
          <theAppContext.Consumer>
            { ({ TransactionNotifierTxRx }) =>
              <TransactionNotifierTxRx />
            }
          </theAppContext.Consumer>
          <HeaderWithRouter/>
          <Switch>
            <Route exact={false} path={'/exchange'} component={ExchangeViewTxRx}/>
            <Route path={'/balances'} component={BalancesView} />
            <Redirect from={'/'} to={'/exchange'}/>
          </Switch>
        </div>
      </Router>
      <theAppContext.Consumer>
        { ({ TheFooterTxRx }) =>
          <TheFooterTxRx/>
        }
      </theAppContext.Consumer>

      </theAppContext.Provider>);
  }
}
