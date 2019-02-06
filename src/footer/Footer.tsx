import { BigNumber } from 'bignumber.js';
import * as moment from 'moment';
import * as React from 'react';
import { default as MediaQuery } from 'react-responsive';
import { bindNodeCallback, Observable } from 'rxjs';
import { map, switchMap } from 'rxjs/operators';
import { NetworkConfig } from '../blockchain/config';
import { Github, Reddit, RocketChat } from '../utils/icons/SocialIcons';
import { Loadable, loadablifyLight } from '../utils/loadable';
import { WithLoadingIndicatorInline } from '../utils/loadingIndicator/LoadingIndicator';
import * as styles from './Footer.scss';

interface FooterProps {
  etherscan: any;
  address: string;
  expirationDate: Loadable<Date>;
}

export class TheFooter extends React.Component<FooterProps> {
  public render() {
    const { etherscan, address, expirationDate } = this.props;
    return (
      <div>
        <hr className={styles.footerSeparator}/>
        <div className={styles.footer}>
          <MediaQuery minWidth={768}>
            <div className={styles.links}>
              <span>
              Market Closing Time - <WithLoadingIndicatorInline loadable={expirationDate}>
                {(expDate) => <span data-vis-reg-mask={true}>{moment(expDate).format('DD.MM.YYYY')}</span>}
              </WithLoadingIndicatorInline>
            </span>
              <a target="_blank" rel="noopener noreferrer"
                 href={`${etherscan.url}/address/${address}`}>
                Market Contract
              </a>
              <a target="_blank" rel="noopener noreferrer" href="/tos.pdf">
                Legal
              </a>
              <a target="_blank"
                 rel="noopener noreferrer"
                 href="https://github.com/OasisDEX/eth2dai/issues">
                Report Issues
              </a>
              <span>
              <a target="_blank" className={styles.iconLink}
                 rel="noopener noreferrer"
                 href="https://chat.makerdao.com/channel/eth2dai">
                <RocketChat/>
              </a>
              <a target="_blank" className={styles.iconLink}
                 rel="noopener noreferrer"
                 href="https://www.reddit.com/r/OasisDEX/">
                <Reddit/>
              </a>
              <a target="_blank" className={styles.iconLink}
                 rel="noopener noreferrer"
                 href="https://github.com/OasisDEX/eth2dai">
                <Github/>
              </a>
            </span>
            </div>
            <div data-vis-reg-mask={true}>
              <span>
            <a href={`https://github.com/OasisDEX/eth2dai/commit/${process.env.__HASH__}`}
               target="_blank"
               rel="noopener noreferrer">
              {process.env.__NAME__} Version {process.env.__VERSION__} ({process.env.__HASH__})
            </a> - Build Date {moment(process.env.__DATE__).format('DD.MM.YYYY HH:MM')}
          </span>
            </div>
          </MediaQuery>
          <MediaQuery maxWidth={768}>
            <div>
              Market Closing Time - <WithLoadingIndicatorInline loadable={expirationDate}>
                {(expDate) => <span data-vis-reg-mask={true}>{moment(expDate).format('DD.MM.YYYY')}</span>}
              </WithLoadingIndicatorInline>
            </div>
            <div className={styles.links}>
              <a target="_blank" rel="noopener noreferrer"
                 href={`${etherscan.url}/address/${address}`}>
                Market Contract
              </a>
              <a target="_blank" rel="noopener noreferrer" href="/tos.pdf">
                Legal
              </a>
              <a target="_blank"
                 rel="noopener noreferrer"
                 href="https://github.com/OasisDEX/eth2dai/issues">
                Report Issues
              </a>
            </div>
            <div>
              <a target="_blank" className={styles.iconLink}
                 rel="noopener noreferrer"
                 href="https://chat.makerdao.com/channel/eth2dai">
                <RocketChat/>
              </a>
              <a target="_blank" className={styles.iconLink}
                 rel="noopener noreferrer"
                 href="https://www.reddit.com/r/OasisDEX/">
                <Reddit/>
              </a>
              <a target="_blank" className={styles.iconLink}
                 rel="noopener noreferrer"
                 href="https://github.com/OasisDEX/eth2dai">
                <Github/>
              </a>
            </div>
            <div data-vis-reg-mask={true}>
              <a href={`https://github.com/OasisDEX/eth2dai/commit/${process.env.__HASH__}`}
                 target="_blank"
                 rel="noopener noreferrer">
                {process.env.__NAME__} Version {process.env.__VERSION__} ({process.env.__HASH__})
              </a>
            </div>
            <div data-vis-reg-mask={true}>
              Build Date {moment(process.env.__DATE__).format('DD.MM.YYYY HH:MM')}
            </div>
          </MediaQuery>
        </div>
      </div>
    );
  }
}

type CloseTimeType = (callback: (err: any, r: BigNumber) => any) => any;

export function createFooter$(context$: Observable<NetworkConfig>): Observable<FooterProps> {
  return context$.pipe(
    switchMap(context =>
      loadablifyLight(
        bindNodeCallback(context.otc.contract.close_time as CloseTimeType)().pipe(
          map(closeTime => moment.unix(closeTime.toNumber()).toDate())
        )
      ).pipe(
        map((expirationDate) => ({
          expirationDate,
          etherscan: context.etherscan,
          address: context.otc.contract.address as string,
        }))
      )
    ),
  );
}
