import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { map } from 'rxjs/operators';

import { combineLatest, Observable, of } from 'rxjs/index';
import { startWith, switchMap, tap } from 'rxjs/internal/operators';
import { networks } from './blockchain/config';
import { account$, networkId$ } from './blockchain/network';
import { Web3Status, web3Status$ } from './blockchain/web3';
import * as styles from './index.scss';
import { Main } from './Main';
import { connect } from './utils/connect';
import { UnreachableCaseError } from './utils/UnreachableCaseError';

interface Props {
  status: Web3Status;
  network?: string;
}

class App extends React.Component<Props> {
  public render() {
    switch (this.props.status) {
      case 'initializing':
        return <span className={styles.loggedOut}>initializing</span>;
      case 'waiting':
        return <span className={styles.loggedOut}>waiting for approval...</span>;
      case 'denied':
        return <span className={styles.loggedOut}>access denied</span>;
      case 'missing':
        return <span className={styles.loggedOut}>please install a web3 provider</span>;
      case 'ready':
        if (this.props.network !== undefined && !networks[this.props.network]) {
          return <span className={styles.loggedOut}>network not supported</span>;
        }
        return <Main/>;
      default:
        throw new UnreachableCaseError(this.props.status);
    }
  }
}

const props$: Observable<Props> = web3Status$.pipe(
  switchMap(status =>
    status === 'ready' ?
      combineLatest(networkId$, account$).pipe(
        tap(([network, account]) =>
          console.log(`status: ${status}, network: ${network}, account: ${account}`)),
        map(([network, _account]) => ({ status, network })),

      ) : of({ status })
  ),
  startWith({ status: 'initializing' as Web3Status })
);

const AppTxRx = connect(App, props$);

const root: HTMLElement = document.getElementById('root')!;

ReactDOM.render(<AppTxRx />, root);
