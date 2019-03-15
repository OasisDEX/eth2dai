import { isEqual } from 'lodash';
import 'normalize.css';
import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { combineLatest, interval, Observable, of } from 'rxjs/index';
import { distinctUntilChanged, startWith, switchMap, tap } from 'rxjs/internal/operators';
import { map } from 'rxjs/operators';
import { networks } from './blockchain/config';
import { account$, networkId$ } from './blockchain/network';
import { Web3Status, web3Status$ } from './blockchain/web3';
import { LoadingState } from './landingPage/LandingPage';
import { Main } from './Main';
import { connect } from './utils/connect';
import { UnreachableCaseError } from './utils/UnreachableCaseError';

interface Props {
  status: Web3Status;
  network?: string;
  tosAccepted?: boolean;
  hasSeenAnnouncement?: boolean;
}

class App extends React.Component<Props> {

  public render() {
    switch (this.props.status) {
      case 'initializing':
        return LoadingState.INITIALIZATION;
      case 'missing':
        return LoadingState.MISSING_PROVIDER;
      case 'ready':
        if (this.props.network !== undefined && !networks[this.props.network]) {
          return LoadingState.UNSUPPORTED;
        }

        if (!this.props.tosAccepted) {
          return LoadingState.ACCEPT_TOS;
        }

        /*
        * The way to present announcement before loading the app is:
        * <Announcement
        *     id="<unique_id">  - shouldn't change with each component rendering
        *     visibility="always | once"
        *     headline="string" - heading of the announcement
        *     buttonLabel="string" - the label of the button that user clicks to continue to next view
        *     content={ string | React.ReactNode } - this is the announcement itself
        *     nextView={<Main/>}/>
        * */
        return <Main/>;
      default:
        throw new UnreachableCaseError(this.props.status);
    }
  }
}

const accepted$: Observable<boolean> = interval(500).pipe(
  startWith(false),
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
  map(([tosAccepted, web3Status]) => {
    return {
      tosAccepted,
      ...web3Status
    } as Props;
  }),
  distinctUntilChanged(isEqual)
);

const AppTxRx = connect(App, props$);

const root: HTMLElement = document.getElementById('root')!;

ReactDOM.render(<AppTxRx/>, root);
