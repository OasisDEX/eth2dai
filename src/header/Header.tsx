import classnames from 'classnames';
import * as React from 'react';
// @ts-ignore
// tslint:disable:import-name
import Jazzicon, { jsNumberForAddress } from 'react-jazzicon';
import { NavLink } from 'react-router-dom';

import { theAppContext } from '../AppContext';
import { account$ } from '../blockchain/network';
import { routerContext } from '../Main';
import { connect } from '../utils/connect';
import { SvgImage } from '../utils/icons/utils';
import { Loadable, loadablifyLight } from '../utils/loadable';
import { WithLoadingIndicator } from '../utils/loadingIndicator/LoadingIndicator';
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

export class Header extends React.Component {
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
                <HeaderNavLink to={`${rootUrl}instant`} name="Instant"/>
                <HeaderNavLink to={`${rootUrl}exchange`} name="Exchange"/>
                <HeaderNavLink to={`${rootUrl}balances`} name="Balances"/>
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
