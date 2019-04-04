import { BigNumber } from 'bignumber.js';
import * as React from 'react';
import { OfferType } from '../../exchange/orderbook/orderbook';
import { calculateTradePrice } from '../../utils/price';
import { CurrentPrice } from '../CurrentPrice';
import { TradeSummary } from '../details/TradeSummary';
import { InstantFormChangeKind, ManualChange, Progress, ProgressKind, ViewKind } from '../instantForm';
import { InstantFormWrapper } from '../InstantFormWrapper';

interface ViewProps {
  change: (change: ManualChange) => void;
  progress: Progress;
  price: BigNumber;
  sellToken: string;
  buyToken: string;
  kind: OfferType;
}

export class TradeSummaryView extends React.Component<ViewProps> {
  public render() {
    const { progress, kind, sellToken, buyToken } = this.props;
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
                        gasUsed={gasUsed}
                        soldToken={sellToken}
                        boughtToken={buyToken}
                        type={kind || '' as OfferType}
                        hadCreatedProxy={
                          [
                            ProgressKind.noProxyPayWithETH,
                            ProgressKind.noProxyNoAllowancePayWithERC20
                          ].includes(progress.kind)
                        }/>
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
