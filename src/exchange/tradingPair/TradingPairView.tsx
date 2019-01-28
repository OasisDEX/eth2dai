import { BigNumber } from 'bignumber.js';
import classnames from 'classnames';
import * as React from 'react';
import { NavLink } from 'react-router-dom';

import { tokens, tradingPairs } from '../../blockchain/config';
import { FormatAmount, FormatPercent, FormatPrice } from '../../utils/formatters/Formatters';
import { WithLoadingIndicatorInline } from '../../utils/loadingIndicator/LoadingIndicator';
import {
  ServerUnreachableInline
} from '../../utils/loadingIndicator/ServerUnreachable';
import { BoundarySpan, InfoLabel } from '../../utils/text/Text';
import { TradingPair, TradingPairsProps } from './tradingPair';
import * as styles from './TradingPairView.scss';

interface PairInfoVP {
  value: any;
  label: string;
}

export class TradingPairView extends React.Component<TradingPairsProps, { showMenu: boolean }> {

  public static PairVP({ pair, parentMatch }: { pair: TradingPair; parentMatch?: string }) {

    const pathname = `${parentMatch}/${pair.base}/${pair.quote}`;

    return (
      <li data-test-id={`${pair.base}-${pair.quote}`} className={styles.dropdownItem}>
        <NavLink
          exact={true}
          to={{ pathname, state: { pair } }}
          activeClassName={styles.active}
          className={styles.dropdownItemLink}
        >
          <TradingPairView.PairView base={pair.base} quote={pair.quote} />
        </NavLink>
      </li>
    );
  }

  public static PairView({ base, quote }: any) {
    const Icon = tokens[base].iconInverse;
    return (
      <div className={styles.pairView}>
        <div className={styles.pairViewIcon}><Icon/></div>
        <div className={styles.pairViewCurrency}>{base}</div>
        <div className={styles.pairViewCurrency}>{quote}</div>
      </div>
    );
  }

  public static YesterdayPriceVP(
    { yesterdayPriceChange }: { yesterdayPriceChange: BigNumber | undefined }
  ) {
    return !yesterdayPriceChange ? null : (
      <BoundarySpan value={yesterdayPriceChange}>
        <FormatPercent value={yesterdayPriceChange} plus={true} fallback=""/>
      </BoundarySpan>
    );
  }

  public static PairInfoVP({ value, label }: PairInfoVP) {
    return (
      <div className={styles.pairInfo}>
        {value}
        <InfoLabel className={styles.pairInfoLabel}>{label}</InfoLabel>
      </div>
    );
  }

  public constructor(props: TradingPairsProps) {
    super(props);

    this.state = {
      showMenu: false,
    };

    this.showMenu = this.showMenu.bind(this);
    this.closeMenu = this.closeMenu.bind(this);
  }

  public render() {
    const {
      parentMatch = '/',
      base,
      currentPrice,
      quote,
      weeklyVolume,
      yesterdayPriceChange
    } = this.props;
    const dropdownDisabled = tradingPairs.length <= 1;
    return (
      <div className={styles.container}>
        <div className={styles.dropdown}>
          <div tabIndex={dropdownDisabled ? undefined : -1}
               data-test-id="select-pair"
               onClick={() => dropdownDisabled ? null : this.showMenu}
               className={classnames(styles.dropdownBtn, {
                 [styles.dropdownBtnDisabled]: dropdownDisabled,
                 [styles.dropdownBtnActive]: this.state.showMenu
               })}>
            <TradingPairView.PairView base={base} quote={quote} />
          </div>
          {
            this.state.showMenu
              ? (
                <ul className={styles.dropdownList}>
                  {tradingPairs.map((pair, i) => (
                    <TradingPairView.PairVP parentMatch={parentMatch} key={i} pair={pair} />
                  ))}
                </ul>
              )
              : (
                null
              )
          }
        </div>

        <TradingPairView.PairInfoVP label="Current price" value={
          <WithLoadingIndicatorInline
            error={<ServerUnreachableInline fallback="-"/>}
            loadable={currentPrice}
            className={styles.pairInfo}
          >
            {(currentPriceLoaded?: BigNumber) => (
              currentPriceLoaded ?
                <FormatPrice value={currentPriceLoaded} token={quote} /> :
                <span>?</span>
            )}
          </WithLoadingIndicatorInline>
        } />
        <TradingPairView.PairInfoVP label="24h price" value={
          <WithLoadingIndicatorInline
            error={<ServerUnreachableInline fallback="-"/>}
            loadable={yesterdayPriceChange}
            className={styles.pairInfo}
          >
            {(yesterdayPriceChangeLoaded?: BigNumber) => (
              yesterdayPriceChangeLoaded ?
                <TradingPairView.YesterdayPriceVP
                  yesterdayPriceChange={yesterdayPriceChangeLoaded}
                /> :
                <span>?</span>
            )}
          </WithLoadingIndicatorInline>
        } />
        <TradingPairView.PairInfoVP label="24h volume" value={
          <WithLoadingIndicatorInline
            loadable={weeklyVolume}
            className={styles.pairInfo}
            error={<ServerUnreachableInline fallback="-"/>}
          >
            {(weeklyVolumeLoaded: BigNumber) => (
              <FormatAmount value={weeklyVolumeLoaded} token={quote} />
            )}
          </WithLoadingIndicatorInline>
        } />
      </div>
    );
  }

  private showMenu(event: any) {
    event.preventDefault();

    this.setState({ showMenu: true }, () => {
      document.addEventListener('click', this.closeMenu);
    });
  }

  private closeMenu(_event: any) {

    // if (!this.dropdownMenu.contains(event.target)) {
    this.setState({ showMenu: false }, () => {
      document.removeEventListener('click', this.closeMenu);
    });

    // }
  }

}
