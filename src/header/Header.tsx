import classnames from 'classnames';
import * as React from 'react';
// @ts-ignore
// tslint:disable:import-name
import Jazzicon, { jsNumberForAddress } from 'react-jazzicon';
import { combineLatest, Observable } from 'rxjs';
import { map } from 'rxjs/operators';

import { NavLink } from 'react-router-dom';
import { theAppContext } from '../AppContext';
import { account$ } from '../blockchain/network';
import { connectToWallet$, walletStatus$ } from '../blockchain/wallet';
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
              </ul>
            </nav>
          </section >
          <section className={classnames(section, sectionStatus)}>
            <StatusTxRx/>
            <theAppContext.Consumer>
              {({ NetworkTxRx }) =>
                // @ts-ignore
                <NetworkTxRx/>
              }
            </theAppContext.Consumer>
          </section>
        </header>
      }
      </routerContext.Consumer>
    );
  }
}

export const HeaderTxRx = connect(Header, account$.pipe(map(account => ({ account }))));

interface StatusProps extends Loadable<string> {
}

class Status extends React.Component<StatusProps> {
  public logIn = () => {
    connectToWallet$.next();
  }

  public render() {
    return (
      <span className={styles.accountLoader}>
      <WithLoadingIndicatorInline loadable={this.props} light={true} className={styles.account}>
      { (account: string | undefined) => {
        const label = account ? account.slice(0, 6) + '...' + account.slice(-4) : 'Logged out';
        return account ?
          <div title={account} className={classnames(navElement, styles.account)}>
            <Jazzicon diameter={25} seed={jsNumberForAddress(account)} />
            <span style={{ marginLeft: '1em' }}>{label}</span>
          </div> :
          <div title={account} className={classnames(navElement, styles.account)}>
            <Button color="greyWhite" size="sm" onClick={this.logIn} className={styles.login}>Log in</Button>
          </div>;
      } }
      </WithLoadingIndicatorInline>
      </span>
    );
  }
}

const loadableAccount$: Observable<Loadable<string|undefined>> = combineLatest(walletStatus$, account$).pipe(
  map(([walletStatus, account]) => {
    if (walletStatus === 'connecting') {
      return { status: 'loading' } as Loadable<string|undefined>;
    }
    return { status: 'loaded', value: account } as Loadable<string|undefined>;
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
