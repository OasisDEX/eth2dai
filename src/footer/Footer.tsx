import { BigNumber } from 'bignumber.js';
import * as moment from 'moment';
import * as React from 'react';
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
          <div>
            Market closing time - <WithLoadingIndicatorInline loadable={expirationDate}>
            {(expDate) => <>{expDate.toLocaleDateString('en-US')}</>}
          </WithLoadingIndicatorInline>
            <span className={styles.textSeparator}>/</span>

            <a target="_blank" rel="noopener noreferrer" href={`${etherscan.url}/${address}`}>
              Market Contract
            </a><span className={styles.textSeparator}>/</span>

            <a target="_blank" rel="noopener noreferrer" href="/tos.pdf">
              Legal
            </a><span className={styles.textSeparator}>/</span>

            <a target="_blank" rel="noopener noreferrer" href="https://github.com/OasisDEX/eth2dai/issues">
              Report issue
            </a><span className={styles.textSeparator}>/</span>

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
          <br/>
          <br/>
          <div>
          <span>{process.env.__NAME__} - {process.env.__VERSION__} - <a
            href={`https://github.com/OasisDEX/eth2dai/tree/${process.env.__BRANCH__}`} target="_blank"
            rel="noopener noreferrer">
              {process.env.__HASH__}
            </a>
          </span>
          </div>
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
