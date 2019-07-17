import { BigNumber } from 'bignumber.js';
import * as React from 'react';
import { NetworkConfig } from '../../blockchain/config';
import { amountFromWei } from '../../blockchain/utils';
import { OfferType } from '../../exchange/orderbook/orderbook';
import { calculateTradePrice } from '../../utils/price';
import { CurrentPrice } from '../CurrentPrice';
import { TradeSummary } from '../details/TradeSummary';
import {
  InstantFormChangeKind,
  ManualChange,
  Progress,
  ProgressKind,
  ViewKind
} from '../instantForm';
import { InstantFormWrapper } from '../InstantFormWrapper';

interface ViewProps {
  change: (change: ManualChange) => void;
  progress: Progress;
  price: BigNumber;
  gasPrice: BigNumber;
  etherPriceUsd: BigNumber;
  sellToken: string;
  buyToken: string;
  kind: OfferType;
  context: NetworkConfig;
}

export class TradeSummaryView extends React.Component<ViewProps> {
  public render() {
    const { progress, kind, sellToken, buyToken, context, gasPrice, etherPriceUsd } = this.props;
    const { sold, bought, gasUsed } = progress;
    let calcPrice = new BigNumber(0);
    let quotation = '';
    if (sold && bought) {
      const quote = calculateTradePrice(sellToken, sold, buyToken, bought);
      calcPrice = quote.price;
      quotation = quote.quotation;
    }

    return (
      <InstantFormWrapper heading="Finalize Trade"
                          btnAction={this.resetForm}
                          btnLabel="Trade Again"
                          btnDataTestId="new-trade"
      >
        <CurrentPrice price={calcPrice} quotation={quotation}/>
        {
          sold && bought && gasUsed &&
          <TradeSummary sold={sold}
                        price={calcPrice}
                        quotation={quotation}
                        bought={bought}
                        soldToken={sellToken}
                        boughtToken={buyToken}
                        type={kind || '' as OfferType}
                        hadCreatedProxy={
                          [
                            ProgressKind.noProxyPayWithETH,
                            ProgressKind.noProxyNoAllowancePayWithERC20
                          ].includes(progress.kind)
                        }
                        txHash={(progress as { tradeTxHash: string }).tradeTxHash}
                        etherscanURI={context.etherscan.url}
                        gasCost={
                          new BigNumber(gasUsed)
                            .times(amountFromWei(gasPrice, 'ETH'))
                            .times(etherPriceUsd)
                        }
          />
        }
      </InstantFormWrapper>
    );
  }

  private resetForm = () => {
    this.props.change({
      kind: InstantFormChangeKind.formResetChange
    });

    this.props.change({
      kind: InstantFormChangeKind.viewChange,
      view: ViewKind.new
    });
  }
}
