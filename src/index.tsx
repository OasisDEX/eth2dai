import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { map } from 'rxjs/operators';

import { combineLatest, interval, Observable, of } from 'rxjs/index';
import { distinctUntilChanged, startWith, switchMap, tap } from 'rxjs/internal/operators';
import { networks } from './blockchain/config';
import { account$, networkId$ } from './blockchain/network';
import { Web3Status, web3Status$ } from './blockchain/web3';
import { LoadingState } from './entry/LoadingState';
import { Main } from './Main';
import { connect } from './utils/connect';
import { UnreachableCaseError } from './utils/UnreachableCaseError';

interface Props {
  status: Web3Status;
  network?: string;
  tosAccepted?: boolean;
}

class App extends React.Component<Props> {
  public render() {
    switch (this.props.status) {
      case 'initializing':
        return LoadingState.INITIALIZATION;
      case 'waiting':
        return LoadingState.WAITING_FOR_APPROVAL;
      case 'denied':
        return LoadingState.ACCESS_DENIED;
      case 'missing':
        return LoadingState.MISSING_PROVIDER;
      case 'ready':
        if (this.props.network !== undefined && !networks[this.props.network]) {
          return LoadingState.UNSUPPORTED;
        }

        if (this.props.tosAccepted) {
          return <Main/>;
        }

        return LoadingState.ACCEPT_TOS;
      default:
        throw new UnreachableCaseError(this.props.status);
    }
  }
}

const accepted$ = interval(500).pipe(
  startWith(0),
  map(() => localStorage.getItem('tosAccepted') === 'true')
);

const web3StatusResolve$: Observable<Props> = web3Status$.pipe(
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

const props$: Observable<Props> = combineLatest(accepted$, web3StatusResolve$).pipe(
  map(([tosResolution, web3Status]) => {
    return {
      tosAccepted: tosResolution,
      ...web3Status
    } as Props;
  }),
  distinctUntilChanged((a: Props, b: Props) => {
    return a.status === b.status && a.network === b.network && a.tosAccepted === b.tosAccepted;
  })

);

const AppTxRx = connect(App, props$);

const root: HTMLElement = document.getElementById('root')!;

ReactDOM.render(<AppTxRx/>, root);
