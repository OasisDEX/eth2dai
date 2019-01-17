import { BigNumber } from 'bignumber.js';
import * as moment from 'moment';
import * as React from 'react';
import { bindNodeCallback, Observable } from 'rxjs';
import { map, switchMap } from 'rxjs/operators';
import { NetworkConfig } from './blockchain/config';
import { Loadable, loadablifyLight } from './utils/loadable';
import { WithLoadingIndicatorInline } from './utils/loadingIndicator/LoadingIndicator';

interface FooterProps {
  address: string;
  expirationDate: Loadable<Date>;
}

export class TheFooter extends React.Component<FooterProps> {
  public render() {
    return (
            <div>
                <div>
                    <div style={{ textAlign: 'center' }}>
                        version: {process.env.__VERSION__},
                        branch: {process.env.__BRANCH__},
                        hash: {process.env.__HASH__},
                        commits: {process.env.__COMMITS__},
                        build date: { new Date(parseInt(process.env.__DATE__, 10)).toUTCString() }
                    </div>
                </div>
                <ul>
                    <li><a href="https://github.com/OasisDEX/eth2dai">Project</a></li>
                    <li><a href="/tos.pdf">Legal</a></li>
                    <li><a href="https://github.com/OasisDEX/eth2dai/issues">Report issues</a></li>
                    <li>otc: {this.props.address}</li>
                    <li>
                      expiration date:
                      <WithLoadingIndicatorInline loadable={this.props.expirationDate}>
                        {(expirationDate) => <>{expirationDate.toString()}</>}
                      </WithLoadingIndicatorInline>
                    </li>
                </ul>
            </div>
    );
  }
}

type CloseTimeType = (
  callback: (err: any, r: BigNumber) => any
) => any;

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
          address: context.otc.contract.address as string,
        }))
      )
    ),
  );
}
