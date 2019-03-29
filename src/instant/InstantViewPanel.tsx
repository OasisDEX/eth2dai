import classnames from 'classnames';
import * as React from 'react';
import { theAppContext } from '../AppContext';
import { Loadable } from '../utils/loadable';
import { LoadingIndicator } from '../utils/loadingIndicator/LoadingIndicator';
import * as panelStyling from '../utils/panel/Panel.scss';
import * as styles from './Instant.scss';
import { InstantFormState, ViewKind } from './instantForm';
import { AccountView } from './views/AccountView';
import { AllowancesView } from './views/AllowancesView';
import { AssetSelectorView } from './views/AssetSelectorView';
import { FinalizationView } from './views/FinalizationView';
import { NewTradeView } from './views/NewTradeView';
import { PriceImpactWarningView } from './views/PriceImpactWarningView';
import { TradeSummaryView } from './views/TradeSummaryView';

const views = new Map<ViewKind, any>([
  [ViewKind.assetSelector, AssetSelectorView],
  [ViewKind.priceImpactWarning, PriceImpactWarningView],
  [ViewKind.account, AccountView],
  [ViewKind.allowances, AllowancesView],
  [ViewKind.finalization, FinalizationView],
  [ViewKind.new, NewTradeView],
  [ViewKind.summary, TradeSummaryView],
]);

export class InstantViewPanel extends React.Component<Loadable<InstantFormState>> {

  public render() {
    const { status, value } = this.props;

    if (status === 'loaded') {
      const formState = value as InstantFormState;
      const View = views.get(formState.view.kind);
      return (<View {...formState} meta={formState.view.meta}/>);
    }

    return (
      <section className={classnames(styles.panel, panelStyling.panel)}>
        <LoadingIndicator/>
      </section>
    );
  }
}

export class InstantExchange extends React.Component<any> {
  public render() {
    return (
      <theAppContext.Consumer>
        {({ InstantTxRx }) =>
          <InstantTxRx/>
        }
      </theAppContext.Consumer>
    );
  }
}
