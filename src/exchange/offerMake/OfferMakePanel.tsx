import * as React from 'react';

import { Loadable } from '../../utils/loadable';
import { LoadingIndicator } from '../../utils/loadingIndicator/LoadingIndicator';
import { PanelHeader } from '../../utils/panel/Panel';
import { OfferFormState } from './offerMake';
import { OfferMakeForm } from './OfferMakeForm';

export class OfferMakePanel extends React.Component<Loadable<OfferFormState>> {

  public render() {
    if (this.props.status === 'loaded') {
      const formState = this.props.value as OfferFormState;
      return (<OfferMakeForm {...formState} />);
    }

    return (<div>
      <PanelHeader bordered={true}>Create order</PanelHeader>
      <LoadingIndicator />
    </div>);
  }
}
