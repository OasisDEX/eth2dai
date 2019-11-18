import { isEqual } from 'lodash';
import 'normalize.css';
import * as React from 'react';
import * as ReactDOM from 'react-dom';
// tslint:disable:import-name
import MediaQuery from 'react-responsive';
import { combineLatest, Observable, of } from 'rxjs';
import { distinctUntilChanged, startWith, switchMap, tap } from 'rxjs/internal/operators';
import { map } from 'rxjs/operators';
import { account$, networkId$ } from './blockchain/network';
import { Web3Status, web3Status$ } from './blockchain/web3';
import * as styles from './index.scss';
import { Banner } from './landingPage/Banner';
import { connect } from './utils/connect';

interface Props {
  status: Web3Status;
  network?: string;
  tosAccepted?: boolean;
  hasSeenAnnouncement?: boolean;
}

class App extends React.Component<Props> {

  public render() {

    return (
      <div className={styles.containerCentered}>
      <Banner buttonLabel={
        <a href="https://oasis.app/trade"
           target="_blank"
           rel="noreferrer noopener">
          <MediaQuery maxWidth={824}>
            {
              (match: boolean) => match
                ? 'Trade'
                : 'Trade On Oasis'
            }
          </MediaQuery></a>}
              content={
                <span>
                    {/*tslint:disable*/}
                    Note: The Eth2Dai app has been shut down.
                    <br/>
                    <strong>Head to Oasis Trade where you now can trade multiple tokens.</strong>
                  {/*tslint:enable*/}
                  </span>
              }
              continue={
                () => false
              }/>
      </div>
    );

    // switch (this.props.status) {
    //   case 'initializing':
    //     return LoadingState.INITIALIZATION;
    //   case 'missing':
    //     return LoadingState.MISSING_PROVIDER;
    //   case 'ready':
    //   case 'readonly':
    //     if (this.props.network !== undefined && !networks[this.props.network]) {
    //       return LoadingState.UNSUPPORTED;
    //     }
    //
    //     /*
    //     * The way to present announcement before loading the app is:
    //     * <Announcement
    //     *     // shouldn't change with each component rendering
    //     *     id="<unique_id">
    //     *     // how many times it will be displayed
    //     *     visibility="always | once"
    //     *     //heading of the announcement
    //     *     headline="string"
    //     *     //the label of the button that user clicks to continue to next view
    //     *     buttonLabel="string"
    //     *     //this is the announcement itself
    //     *     content={ string | React.ReactNode }
    //     *     //what will be rendered after announcement being dismissed
    //     *     nextView={<Main/>}
    //     *     />
    //     * */
    //     return <Main/>;
    //   default:
    //     throw new UnreachableCaseError(this.props.status);
    // }
  }
}

const web3StatusResolve$: Observable<Props> = web3Status$.pipe(
  switchMap(status =>
    status === 'ready' || status === 'readonly' ?
      combineLatest(networkId$, account$).pipe(
        tap(([network, account]) =>
          console.log(`status: ${status}, network: ${network}, account: ${account}`)),
        map(([network, _account]) => ({ status, network })),
      ) : of({ status })
  ),
  startWith({ status: 'initializing' as Web3Status })
);

const props$: Observable<Props> = web3StatusResolve$.pipe(
  map((web3Status) => {
    return {
      ...web3Status
    } as Props;
  }),
  distinctUntilChanged(isEqual)
);

const AppTxRx = connect(App, props$);

const root: HTMLElement = document.getElementById('root')!;

ReactDOM.render(<AppTxRx/>, root);
