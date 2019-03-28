import classnames from 'classnames';
import * as React from 'react';
import { CloseButton } from '../../utils/forms/Buttons';
import { TopRightCorner } from '../../utils/panel/TopRightCorner';
import { InstantFormChangeKind, InstantFormState, ViewKind } from '../instantForm';
import { InstantFormWrapper } from '../InstantFormWrapper';
import * as styles from './PriceImpactWarning.scss';
import { FormatPercent } from "../../utils/formatters/Formatters";

const PriceImpactGraph = () => (
  <div className={styles.graph}>
    <div>
      <div style={{ display: 'inline-block', width: '75%' }}>
        <div className={classnames(styles.bar, styles.bar1)}/>
        <div className={classnames(styles.bar, styles.bar2)}/>
        <div className={classnames(styles.bar, styles.bar3)}/>
      </div>
      <div className={styles.arrowPlaceholder}>
        <div className={styles.arrow}/>
      </div>
    </div>
    <div>
      <div className={classnames(styles.bar, styles.bar4, styles.danger)}/>
    </div>
  </div>
);

export class PriceImpactWarning extends React.Component<InstantFormState> {

  public render() {
    const { priceImpact } = this.props;
    return (
      <InstantFormWrapper heading="Order Warning!"
                          btnLabel="Proceed with order"
                          btnAction={this.onAcknowledge}
                          btnDataTestId="proceed-with-order">
        <TopRightCorner>
          <CloseButton onClick={this.onDismiss}/>
        </TopRightCorner>
        <div className={styles.container}>

          <PriceImpactGraph/>
          <p className={styles.impactText}>
            <span>Order has a significant </span>
            <span className="danger">
              price impact of <FormatPercent fallback={'N/A'} value={priceImpact} precision={2}/>
            </span>
          </p>
          <p className={styles.continueText}>
            Do you still want to proceed?
          </p>
        </div>
      </InstantFormWrapper>
    );
  }

  private onDismiss = () => {
    this.props.change({
      kind: InstantFormChangeKind.viewChange,
      view: ViewKind.new
    });
  }

  private onAcknowledge = () => {
    this.props.submit(this.props);
    this.props.change({
      kind: InstantFormChangeKind.viewChange,
      view: ViewKind.finalization
    });
  }
}
