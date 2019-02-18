import classnames from 'classnames';
import * as React from 'react';
// @ts-ignore
// tslint:disable:import-name
import Jazzicon, { jsNumberForAddress } from 'react-jazzicon';
import { Link, NavLink } from 'react-router-dom';

import { theAppContext } from 'src/AppContext';
import { account$ } from '../blockchain/network';
import { Logo } from '../logo/Logo';
import { routerContext } from '../Main';
import { connect } from '../utils/connect';
import { Loadable, loadablifyLight } from '../utils/loadable';
import { WithLoadingIndicator } from '../utils/loadingIndicator/LoadingIndicator';
import * as styles from './Header.scss';

export class Header extends React.Component {
  public render() {
    return (
      <routerContext.Consumer>
      { ({ rootUrl }) =>
        <header>
          <section>
            <Link to={rootUrl} className={styles.logo}>
              <Logo />
            </Link>
            <nav>
              <ul>
                <HeaderNavLink to={rootUrl.concat('exchange')} name="Exchange" />
                <HeaderNavLink to={rootUrl.concat('balances')} name="Balances" />
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

export const HeaderNavLink = ({ to, name }: {to: string, name: string}) => (
  <li>
    <NavLink
      data-test-id={name}
      to={to}
      className={styles.navLink}
      activeClassName={styles.activeNavLink}>
      {name}
    </NavLink>
  </li>
);
