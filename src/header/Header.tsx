import classnames from 'classnames';
import { isEqual } from 'lodash';
import * as React from 'react';
// @ts-ignore
// tslint:disable:import-name
import Jazzicon, { jsNumberForAddress } from 'react-jazzicon';
// @ts-ignore
import * as ReactPopover from 'react-popover';
import { combineLatest, Observable } from 'rxjs';
import { distinctUntilChanged, map } from 'rxjs/operators';

import { IoIosWifi } from 'react-icons/io';
import MediaQuery from 'react-responsive';
import { NavLink } from 'react-router-dom';
import { theAppContext } from '../AppContext';
import { account$ } from '../blockchain/network';
import { WalletStatus, walletStatus$ } from '../blockchain/wallet';
import { Web3Status, web3Status$ } from '../blockchain/web3';
import chevronDownSvg from '../icons/chevron-down.svg';
import { routerContext } from '../Main';
import { connect } from '../utils/connect';
import { Button } from '../utils/forms/Buttons';
import { SvgImage } from '../utils/icons/utils';
import { Loadable } from '../utils/loadable';
import { WithLoadingIndicatorInline } from '../utils/loadingIndicator/LoadingIndicator';
import * as styles from './Header.scss';
import Logo from './Logo.svg';
import { WalletConnectionViewKind, walletConnectionViewManual$, WalletConnectionViews } from './WalletConnectionView';

const {
  header,
  nav,
  list,
  item,
  section,
  sectionStatus,
  sectionNavigation,
  logo,
  navElement,
  navLink,
  activeNavLink,
  arrowDown,
  dark,
  light,
  walletConnection,
} = styles;

interface HeaderProps {
  account: string | undefined;
  walletStatus: WalletStatus;
  web3status: Web3Status;
  view: WalletConnectionViewKind;
}

const walletConnectionView$: Observable<WalletConnectionViewKind> =
  combineLatest(walletConnectionViewManual$, walletStatus$, web3Status$)
    .pipe(
      map(([manualViewChange, walletStatus, web3Status]) => {
        if (manualViewChange) {
          return manualViewChange;
        }

        if (web3Status === 'readonly') {
          return WalletConnectionViewKind.noClient;
        }

        if (walletStatus === 'connected') {
          return WalletConnectionViewKind.connected;
        }

        return WalletConnectionViewKind.notConnected;
      }),
      distinctUntilChanged(isEqual)
    );

walletConnectionView$.subscribe();

class Header extends React.Component<HeaderProps> {
  public render() {
    return (
      <routerContext.Consumer>
        {({ rootUrl }) =>
          <header className={header}>
            <section className={section}>
              <a href="/" className={logo}>
                <SvgImage image={Logo}/>
              </a>
            </section>
            <section className={classnames(section, sectionNavigation)}>
              <nav className={nav}>
                <div className={list}>
                  <HeaderNavLink to={`${rootUrl}exchange`} name="Exchange"/>
                  {process.env.REACT_APP_INSTANT_ENABLED === '1' &&
                  <HeaderNavLink to={`${rootUrl}instant`} name="Instant"/>}
                  {this.props.walletStatus === 'connected' &&
                  <HeaderNavLink to={`${rootUrl}account`} name="Account"/>}
                </div>
              </nav>
            </section>
            <section className={classnames(section, sectionStatus)}>
              <WalletConnectionStatus connected={this.props.walletStatus === 'connected'} {...this.props}/>
            </section>
          </header>
        }
      </routerContext.Consumer>
    );
  }
}

export const HeaderTxRx = connect(Header, combineLatest(account$, walletStatus$, web3Status$, walletConnectionView$).pipe(
  map(([account, walletStatus, web3status, view]) => ({ account, walletStatus, web3status, view })),
));

class WalletConnectionStatus extends React.Component<any, { isOpen: boolean }> {

  public constructor(props: any) {
    super(props);
    this.state = {
      isOpen: false,
    };
  }

  public render(): JSX.Element {
    const View = WalletConnectionViews.get(this.props.view);

    return (
      <ReactPopover isOpen={this.state.isOpen}
                    place="below"
                    crossAlign="center-end"
                    onOuterAction={this._close}
                    className="noWallet"
                    body={<View/>}
      >
        <div className={walletConnection}>
          <theAppContext.Consumer>
            {({ NetworkTxRx }) =>
              // @ts-ignore
              <NetworkTxRx/>
            }
          </theAppContext.Consumer>
          {
            this.props.connected
              ? (
                <div onClick={this._open}>
                  <StatusTxRx/>
                </div>
              )
              : (

                <Button color="white"
                        size="sm"
                        onClick={this._open}
                        data-test-id="new-connection"
                        className={classnames(styles.login, styles.connectWalletButton)}>
                  <MediaQuery minWidth={800}>
                    {(matches) => {
                      if (matches) {
                        return (
                          <>
                            Connect Wallet<SvgImage image={chevronDownSvg}
                                                    className={classnames(arrowDown, dark)}/>
                          </>
                        );
                      }
                      return <IoIosWifi/>;
                    }}
                  </MediaQuery>
                </Button>
              )
          }
        </div>
      </ReactPopover>
    );
  }

  private _open = () => {
    this.setState({ isOpen: true });
  }

  private _close = () => {
    this.setState({ isOpen: false });
    /* We need to update the view with a small delay.
    * The dropdown contains animation when showing/hiding.
    */
    setTimeout(
      () => walletConnectionViewManual$.next(''),
      500
    );
  }
}

interface StatusProps extends Loadable<Account> {
}

class Status extends React.Component<StatusProps> {

  public render() {
    return (
      <span className={styles.accountLoader}>
      <WithLoadingIndicatorInline loadable={this.props} className={styles.account}>
      {({ account }: Account) => {
        const label = account ? account.slice(0, 6) + '...' + account.slice(-4) : 'Logged out';

        return (
          <div title={account}
               data-test-id="status"
               className={classnames(navElement, styles.account)}
          >
            <Jazzicon diameter={20} seed={jsNumberForAddress(account)}/>
            <span data-test-id="account" style={{ marginLeft: '.625rem', letterSpacing: '.2px' }}>{label}</span>
            <SvgImage image={chevronDownSvg}
                      className={classnames(arrowDown, light)}/>
          </div>
        );
      }}
      </WithLoadingIndicatorInline>
      </span>
    );
  }
}

interface Account {
  account: string | undefined;
  available?: boolean;
}

const loadableAccount$: Observable<Loadable<Account>> = combineLatest(walletStatus$, account$).pipe(
  map(([walletStatus, account]) => {
    if (walletStatus === 'connecting') {
      return { status: 'loading' } as Loadable<Account>;
    }
    return { status: 'loaded', value: { account, available: walletStatus !== 'missing' } } as Loadable<Account>;
  }),
);

export const StatusTxRx = connect(Status, loadableAccount$);

export const HeaderNavLink = ({ to, name }: { to: string, name: string }) => (
  <NavLink
    data-test-id={name}
    to={to}
    className={classnames(item, navLink)}
    activeClassName={activeNavLink}>
    {name}
  </NavLink>
);
