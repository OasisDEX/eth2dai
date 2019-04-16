import classnames from 'classnames';
import * as React from 'react';
// @ts-ignore
// tslint:disable:import-name
import Jazzicon, { jsNumberForAddress } from 'react-jazzicon';
// @ts-ignore
import * as ReactPopover from 'react-popover';
import { combineLatest, Observable } from 'rxjs';
import { map } from 'rxjs/operators';

import { IoIosUnlock, IoIosWifi } from 'react-icons/io';
import MediaQuery from 'react-responsive';
import { NavLink } from 'react-router-dom';
import { theAppContext } from '../AppContext';
import { account$ } from '../blockchain/network';
import { connectToWallet$, walletStatus$ } from '../blockchain/wallet';
import { Web3Status, web3Status$ } from '../blockchain/web3';
import chevronDownSvg from '../icons/chevron-down.svg';
import { Client } from '../landingPage/client/Client';
import { routerContext } from '../Main';
import { connect } from '../utils/connect';
import { Button } from '../utils/forms/Buttons';
import { SvgImage } from '../utils/icons/utils';
import { Loadable } from '../utils/loadable';
import { WithLoadingIndicatorInline } from '../utils/loadingIndicator/LoadingIndicator';
import * as styles from './Header.scss';
import Logo from './Logo.svg';

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
} = styles;

interface HeaderProps {
  account: string | undefined;
  web3status: Web3Status;
}

class Header extends React.Component<HeaderProps> {
  public render() {
    return (
      <routerContext.Consumer>
      { ({ rootUrl }) =>
        <header className={header}>
          <section className={section}>
            <a href="/" className={logo}>
              <SvgImage image={Logo} />
            </a>
          </section>
          <section className={classnames(section, sectionNavigation)}>
            <nav className={nav}>
              <ul className={list}>
                <HeaderNavLink to={`${rootUrl}exchange`} name="Exchange"/>
                {process.env.REACT_APP_INSTANT_ENABLED === '1' &&
                <HeaderNavLink to={`${rootUrl}instant`} name="Instant"/>}
                {this.props.account &&
                <HeaderNavLink to={`${rootUrl}balances`} name="Balances"/>}
                <HeaderNavLink to={`${rootUrl}register`} name="Register"/>
              </ul>
            </nav>
          </section >
          <section className={classnames(section, sectionStatus)}>
            { this.props.web3status !== 'readonly' ? <>
            <StatusTxRx/>
            <theAppContext.Consumer>
              {({ NetworkTxRx }) =>
                // @ts-ignore
                <NetworkTxRx/>
              }
            </theAppContext.Consumer>
            </> : <>
              <NoClient />
              <theAppContext.Consumer>
                {({ NetworkTxRx }) =>
                  // @ts-ignore
                  <NetworkTxRx/>
                }
              </theAppContext.Consumer>
            </>
            }
          </section>
        </header>
      }
      </routerContext.Consumer>
    );
  }
}

export const HeaderTxRx = connect(Header, combineLatest(account$, web3Status$).pipe(
  map(([account, web3status]) => ({ account, web3status })))
);

class NoClient extends React.Component<{}, { open: boolean }> {
  public constructor(props: {}) {
    super(props);
    this.state = { open: false };
  }

  public render(): JSX.Element {
    return (
      <div className={classnames(navElement, styles.account)} style={{ marginRight: '12px' }}>
        <ReactPopover isOpen={this.state.open} place="below" onOuterAction={this.close} className="noWallet" body={
          <div>
            <p>You need Ethereum client installed.</p>
            <p>Available desktop clients:</p>
            <Client client="metamask"/>
            <Client client="parity"/>
          </div>
        }><Button color="white"
                  size="sm"
                  onClick={this.open}
                  className={classnames(styles.login, styles.connectButton)}>
          <MediaQuery minWidth={800}>
            {(matches) => {
              if (matches) {
                return (
                  <>
                    Connect <SvgImage image={chevronDownSvg}
                                      style={{ display: 'inherit' }}/>
                  </>
                );
              }
              return <IoIosWifi/>;
            }}
          </MediaQuery>
        </Button>
        </ReactPopover>
      </div>
    );
  }

  private open = () => {
    this.setState({ open: true });
  }

  private close = () => {
    this.setState({ open: false });
  }
}

interface StatusProps extends Loadable<Account> {
}

class Status extends React.Component<StatusProps> {
  public logIn = () => {
    connectToWallet$.next();
  }

  public render() {
    return (
      <span className={styles.accountLoader}>
      <WithLoadingIndicatorInline loadable={this.props} light={true} className={styles.account}>
      { ({ account, available }: Account) => {
        const label = account ? account.slice(0, 6) + '...' + account.slice(-4) : 'Logged out';
        return (
          <div title={account} className={classnames(navElement, styles.account)}>
            {account ? <>
              <Jazzicon diameter={25} seed={jsNumberForAddress(account)} />
              <span style={{ marginLeft: '1em' }}>{label}</span>
            </> : (<Button disabled={!available}
                           color="white"
                           size="sm"
                           onClick={this.logIn}
                           className={classnames(styles.login, styles.connectButton)}>
                <MediaQuery minWidth={800}>
                  {(matches) => {
                    if (matches) {
                      return (
                        <span>
                          Connect Wallet
                        </span>
                      );
                    }
                    return <IoIosUnlock/>;
                  }}
                </MediaQuery>
              </Button>
            )}
          </div>
        );
      } }
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

export const HeaderNavLink = ({ to, name }: {to: string, name: string}) => (
  <li className={item}>
    <NavLink
      data-test-id={name}
      to={to}
      className={navLink}
      activeClassName={activeNavLink}>
      {name}
    </NavLink>
  </li>
);
