import classnames from 'classnames';
import * as React from 'react';
import { getCurrentProviderName } from '../blockchain/web3';
import LogoSvg from '../header/Logo.svg';
import { Button } from '../utils/forms/Buttons';
import { Checkbox } from '../utils/forms/Checkbox';
import {  NetworkIcon } from '../utils/icons/Icons';
import { SvgImage } from '../utils/icons/utils';
import { Client } from './client/Client';
import * as styles from './LandingPage.scss';

class AcceptTos extends React.Component<any, any> {

  constructor(props: any) {
    super(props);

    this.state = {
      isChecked: false
    };
  }

  public toggle = () => {
    this.setState((state: any) => {
      const isChecked = !state.isChecked;
      return { isChecked };
    });
  }

  public render() {
    const { fullName, icon } = getCurrentProviderName();
    return (
      <section className={styles.section}>
        <SvgImage image={LogoSvg} className={styles.logo} />
        <div className={styles.container}>
          <div style={{ justifyContent: 'space-between' }} className={styles.containerTopHalf}>
            <div className={styles.placeholder}>
              {icon}
              <div className={styles.column}>
                <span className={classnames(styles.label, styles.status)}>Connected</span>
                {/*TODO: make a list of all wallets and dynamically display the name of the wallet*/}
                <span className={classnames(styles.label, styles.client)}>{fullName}</span>
              </div>
            </div>
            <Button color="greyWhite"
                    style={{
                      width:'108px',
                    }}
                    size="md"
                    disabled={!this.state.isChecked}
                    data-test-id="continue-with-app"
                    onClick={this.loadApp}
            >
              Continue
            </Button>
          </div>
          <div className={styles.containerBottomHalf}>
            <Checkbox name="tos"
                      data-test-id="accept-tos"
                      onChange={this.toggle}>
                         <span className={styles.label}>I accept the <a target="_blank" rel="noopener noreferrer"
                                                                        href="/tos.pdf">
                 Terms of Service</a>
               </span>
            </Checkbox>
          </div>
        </div>
      </section>
    );
  }

  private loadApp = () => {
    localStorage.setItem('tosAccepted', 'true');
  }
}

export class LoadingState {
  public static get INITIALIZATION() {
    return (
      <section className={styles.section}>
        <h4> Initializing </h4>
      </section>
    );
  }

  public static get WAITING_FOR_APPROVAL() {
    return (
      <section className={styles.section}>
        <h4> Initializing </h4>
      </section>
    );
  }

  public static get ACCESS_DENIED() {
    return (
      <section className={styles.section}>
        <h4> Access Denied </h4>
      </section>
    );
  }

  public static get MISSING_PROVIDER() {
    return (
      <section className={styles.section}>
        <SvgImage image={LogoSvg} className={styles.logo} />
        <div className={styles.container}>
          <div style={{ justifyContent: 'center' }} className={styles.containerTopHalf}>
            <h4>You have currently no Client in use</h4>
          </div>
          <div className={styles.containerBottomHalf}>
            <h4 style={{ color: '#8D8D96' }}>Available Desktop Client</h4>
          </div>
          <div className={styles.availableClients}>
            <Client client="metamask"/>
            <Client client="parity"/>
          </div>
        </div>
      </section>
    );
  }

  public static get UNSUPPORTED() {
    return (
      <section className={styles.section}>
        <div className={styles.container}>
          <div style={{ justifyContent: 'center' }} className={styles.containerTopHalf}>
            Something is not right
          </div>
          <div className={styles.containerBottomHalf}>
            <h4 style={{ color: '#8D8D96' }}>Please connect to the Ethereum Main Network</h4>
          </div>
          <div style={{ marginTop: '32px', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
            <NetworkIcon/>
          </div>
        </div>
      </section>
    );
  }

  public static get ACCEPT_TOS() {
    return <AcceptTos/>;
  }
}
