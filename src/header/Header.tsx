import classnames from 'classnames';
import { isEqual } from 'lodash';
import * as React from 'react';
// @ts-ignore
// tslint:disable:import-name
import Jazzicon, { jsNumberForAddress } from 'react-jazzicon';
// @ts-ignore
import * as ReactPopover from 'react-popover';
import { BehaviorSubject, combineLatest, Observable } from 'rxjs';
import { distinctUntilChanged, map } from 'rxjs/operators';

import { IoIosWifi } from 'react-icons/io';
import MediaQuery from 'react-responsive';
import { NavLink } from 'react-router-dom';
import { theAppContext } from '../AppContext';
import { account$ } from '../blockchain/network';
import { WalletStatus, walletStatus$ } from '../blockchain/wallet';
import { web3Status$ } from '../blockchain/web3';
import chevronDownSvg from '../icons/chevron-down.svg';
import { routerContext } from '../Main';
import { connect } from '../utils/connect';
import { Button } from '../utils/forms/Buttons';
import { SvgImage } from '../utils/icons/utils';
import { Loadable } from '../utils/loadable';
import { WithLoadingIndicatorInline } from '../utils/loadingIndicator/LoadingIndicator';
import * as styles from './Header.scss';
import Logo from './Logo.svg';
import {
  WalletConnectionViewKind,
  walletConnectionViewManual$,
  WalletConnectionViews
} from './WalletConnectionView';

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
  walletStatus: WalletStatus;
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

const popup = new BehaviorSubject(false);

const popup$ = combineLatest(walletStatus$, popup, walletConnectionView$).pipe(
  map(([status, isOpen, view]) => ({
    view,
    isOpen,
    open: () => popup.next(true),
    close: () => {
      popup.next(false);
      setTimeout(() => {
        walletConnectionViewManual$.next('');
      },         500);
    },
    isConnected: status === 'connected',
    isConnecting: status === 'connecting',
  }))
);

walletStatus$.pipe().subscribe(
  status => {
    if (status === 'connected' || status === 'disconnected') {
      popup.next(false);
    }
  }
);

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
              <WalletConnectionStatusRx/>
            </section>
          </header>
        }
      </routerContext.Consumer>
    );
  }
}

export const HeaderTxRx = connect(Header, combineLatest(walletStatus$).pipe(
  map(([walletStatus]) => ({ walletStatus })),
));

interface WalletConnectionStatusProps {
  open: () => void;
  close: () => void;
  isOpen: boolean;
  isConnected: boolean;
  isConnecting: boolean;
  view: any;
}

class WalletConnectionStatus extends React.Component<WalletConnectionStatusProps> {

  public render(): JSX.Element {
    const { open, close, view, isConnected, isConnecting, isOpen } = this.props;
    const View = WalletConnectionViews.get(
      isConnecting
        ? WalletConnectionViewKind.connecting
        : view
    );

    return (
      <ReactPopover isOpen={isOpen}
                    place="below"
                    crossAlign="center-end"
                    onOuterAction={close}
                    className="noWallet"
                    enterExitTransitionDistancePx={-10}
                    body={<View close={close}/>}>
        <div className={walletConnection}>
          <theAppContext.Consumer>
            {({ NetworkTxRx }) =>
              // @ts-ignore
              <NetworkTxRx/>
            }
          </theAppContext.Consumer>
          {
            isConnected
              ? (
                <div onClick={open} data-test-id="wallet-status">
                  <StatusTxRx/>
                </div>
              )
              : (

                <Button color="white"
                        size="sm"
                        onClick={open}
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
}

const WalletConnectionStatusRx = connect(WalletConnectionStatus, popup$);

interface StatusProps extends Loadable
  <Account> {
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
            <span data-test-id="account"
                  style={{ marginLeft: '.625rem', letterSpacing: '.2px' }}
            >
              {label}
            </span>
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
    return {
      status: 'loaded',
      value: { account, available: walletStatus !== 'missing' }
    } as Loadable<Account>;
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
