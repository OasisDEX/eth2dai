import classnames from 'classnames';
import * as React from 'react';
import { FormatPercent } from '../../utils/formatters/Formatters';
import { CloseButton } from '../../utils/forms/Buttons';
import { TopRightCorner } from '../../utils/panel/TopRightCorner';
import * as instantStyles from '../Instant.scss';
import { InstantFormChangeKind, InstantFormState, ViewKind } from '../instantForm';
import { InstantFormWrapper } from '../InstantFormWrapper';
import * as styles from './PriceImpactWarningView.scss';

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

export class PriceImpactWarningView extends React.Component<InstantFormState> {

  public render() {
    const { priceImpact } = this.props;
    return (
      <InstantFormWrapper heading="Order Warning!"
                          btnLabel="Proceed with order"
                          btnAction={this.onAcknowledge}
                          btnDataTestId="proceed-with-order">
        <TopRightCorner>
          <CloseButton className={instantStyles.closeButton}
                       theme="danger" data-test-id="dismiss-warning"
                       onClick={this.onDismiss}/>
        </TopRightCorner>
        <div className={styles.container}>
          <PriceImpactGraph/>
          <p className={styles.impactText} data-test-id="price-impact-text">
            <span>Order has a significant </span>
            <span className={classnames('danger', 'semi-bold')}>
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
