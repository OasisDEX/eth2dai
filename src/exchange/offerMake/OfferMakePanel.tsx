import * as React from 'react';

import { Loadable } from '../../utils/loadable';
import { LoadingIndicator } from '../../utils/loadingIndicator/LoadingIndicator';
import { PanelHeader } from '../../utils/panel/Panel';
import { OfferFormState } from './offerMake';
import { OfferMakeForm } from './OfferMakeForm';
import * as styles from './OfferMakePanel.scss';

export class OfferMakePanel extends React.Component<Loadable<OfferFormState>> {

  public render() {
    if (this.props.status === 'loaded') {
      const formState = this.props.value as OfferFormState;
      return (<OfferMakeForm {...formState} />);
    }

    return (<>
      <PanelHeader bordered={true}>Create order</PanelHeader>
      <div className={styles.loaderWithFooterBordered}>
        <LoadingIndicator size="lg"/>
      </div>
    </>);
  }
}
