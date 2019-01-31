import classnames from 'classnames';
import * as React from 'react';
// @ts-ignore
// tslint:disable:import-name
import Jazzicon, { jsNumberForAddress } from 'react-jazzicon';
import { NavLink, RouteComponentProps, withRouter } from 'react-router-dom';

import { theAppContext } from 'src/AppContext';
import { account$ } from '../blockchain/network';
import { Logo } from '../logo/Logo';
import { connect } from '../utils/connect';
import { Loadable, loadablifyLight } from '../utils/loadable';
import { WithLoadingIndicator } from '../utils/loadingIndicator/LoadingIndicator';
import * as styles from './Header.scss';

interface HeaderProps extends RouteComponentProps<any>{}

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

class Header extends React.Component<HeaderProps, any> {
  public render() {
    const matchUrl = this.props.match.url;
    return (
      <header className={header}>
        <section className={section}>
          <a href="/" className={logo}>
            <Logo/>
          </a>
        </section>
        <section className={classnames(section, sectionNavigation)}>
          <nav className={nav}>
            <ul className={list}>
              <HeaderNavLink path={matchUrl.concat('exchange')} name="Exchange"/>
              <HeaderNavLink path={matchUrl.concat('balances')} name="Balances"/>
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
    );
  }
}

interface StatusProps extends Loadable<string> {
}

class Status extends React.Component<StatusProps> {
  public render() {
    return (
      <WithLoadingIndicator loadable={this.props} light={true} className={styles.account}>
      { (account: string) => {
        const label = account ? account.slice(0, 6) + '...' + account.slice(-4) : 'Logged out';
        return (
          <div title={account} className={classnames(navElement, styles.account)}>
            {account && <Jazzicon
              diameter={25}
              seed={jsNumberForAddress(account)} />}
            <span style={{ marginLeft: '1em' }}>{label}</span>
          </div>
        );
      } }
      </WithLoadingIndicator>
    );
  }
}

export const StatusTxRx = connect(Status, loadablifyLight(account$));

export const HeaderNavLink = ({ path, name }: {path: string, name: string}) => (
  <li className={item}>
    <NavLink
      data-test-id={name}
      to={path}
      className={navLink}
      activeClassName={activeNavLink}>
      {name}
    </NavLink>
  </li>
);

export const HeaderWithRouter = withRouter(Header);
