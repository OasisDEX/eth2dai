import * as React from 'react';
import Eth2DaiLogoSvg from '../header/Eth2DaiLogo.svg';
import OasisDexLogoSvg from '../header/OasisDexLogo.svg';
import networkSvg from '../icons/network.svg';
import { SvgImage } from '../utils/icons/utils';
import { Client } from './client/Client';
import * as styles from './LandingPage.scss';

export class LoadingState {
  public static get INITIALIZATION() {
    return (
      <section className={styles.section}>
        <h4> Initializing </h4>
      </section>
    );
  }

  public static get MISSING_PROVIDER() {
    return (
      <section className={styles.section}>
        {
          process.env.REACT_APP_OASIS_DEX_ENABLED === '1' ?
            <SvgImage image={OasisDexLogoSvg}/> :
            <SvgImage image={Eth2DaiLogoSvg}/>
        }
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
          <div className={styles.unsupported}>
            <SvgImage image={networkSvg} />
          </div>
        </div>
      </section>
    );
  }
}
