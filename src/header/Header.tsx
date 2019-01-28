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

class Header extends React.Component<HeaderProps, any> {
  public render() {
    const matchUrl = this.props.match.url;
    return (
      <header>
        <section>
          <a href="/" className={styles.logo}>
            <Logo />
          </a>
          <nav>
            <ul>
              <HeaderNavLink path={matchUrl.concat('exchange')} name="Exchange" />
              <HeaderNavLink path={matchUrl.concat('balances')} name="Balances" />
            </ul>
          </nav>
        </section>
        <section>
          <StatusTxRx />
          <theAppContext.Consumer>
            { ({ NetworkTxRx }) =>
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
          <div title={account} className={classnames(styles.navElement, styles.account)}>
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
  <li>
    <NavLink
      data-test-id={name}
      to={path}
      className={styles.navLink}
      activeClassName={styles.activeNavLink}>
      {name}
    </NavLink>
  </li>
);

export const HeaderWithRouter = withRouter(Header);
