import classnames from 'classnames';
import * as React from 'react';
import { Loadable } from '../utils/loadable';
import { LoadingIndicator } from '../utils/loadingIndicator/LoadingIndicator';
import * as panelStyling from '../utils/panel/Panel.scss';
import { InstantFormState } from './instant';
import * as styles from './Instant.scss';
import { InstantView } from './InstantView';

export class InstantViewPanel extends React.Component<Loadable<InstantFormState>> {

  public render() {
    const { status, value } = this.props;

    if (status === 'loaded') {
      const formState = value as InstantFormState;
      return (<InstantView {...formState} />);
    }

    return (
      <section className={classnames(styles.panel, panelStyling.panel)}>
        <LoadingIndicator/>
      </section>
    );
  }
}
