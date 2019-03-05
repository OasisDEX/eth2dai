import * as React from 'react';
// @ts-ignore
// @ts-ignore
// @ts-ignore
// tslint:disable:import-name
import { jsNumberForAddress } from 'react-jazzicon';

import { Button } from '../utils/forms/Buttons';
import { Panel } from '../utils/panel/Panel';
import * as styles from './Announcement.scss';

interface AnnouncementViewProps {
  headline: string;
  buttonLabel: string;
  content: string | React.ReactNode;
}

interface AnnouncementProps extends AnnouncementViewProps {
  id: string;
  nextView: React.ReactNode;
  /* Visibility property defines when the announcement content will be visible
  *  - 'none' - It won't display any announcement and instead it will proceed with the next view
  *  - 'once' - The announcement is displayed once. Once the use clicks continue it will set a flag in localStorage that the
  *  announcement has been seen so it should be rendered anymore and instead to proceed with next view.
  *  - 'always' - it will display the announcement every time no matter if we have localStorage flag on.
  * */
  visibility: 'none' | 'once' | 'always';
}

class AnnouncementView extends React.Component<AnnouncementViewProps & {
  continue: () => void;
}> {
  public render() {

    const { headline, content, continue: onContinue, buttonLabel } = this.props;

    return (
      <section className={styles.section}>
        <Panel className={styles.panel}>

          <div className={styles.container}>
            <h4 className={styles.headline}>{headline}!</h4>
          </div>
          <div className={styles.container}>
            {content}
          </div>
          <div className={styles.container}>
            <Button data-test-id="continue-with-new-contract"
                    size="md" color="greyWhite" className={styles.btn}
                    onClick={onContinue}>
              {buttonLabel}
            </Button>
          </div>

        </Panel>
      </section>
    );
  }
}

export class Announcement extends React.Component<AnnouncementProps & AnnouncementViewProps, { shouldViewNext: boolean }> {

  constructor(props: AnnouncementProps & AnnouncementViewProps) {
    super(props);
    this.state = {
      shouldViewNext: false
    };
  }

  public render() {
    const { id, nextView, visibility } = this.props;

    switch (visibility) {
      case 'always':
        if (this.state.shouldViewNext) {
          return nextView;
        }

        return <AnnouncementView {...this.props} continue={this.proceed}/>;
      case 'once':
        if (this.hasSeenAnnouncementAlready(id)) {
          return nextView;
        }

        return <AnnouncementView {...this.props} continue={this.proceed}/>;
      default:
        return nextView;
    }

  }

  private hasSeenAnnouncementAlready(id: string) {
    return JSON.parse(localStorage.getItem(id) || 'false');
  }

  private proceed = () => {
    localStorage.setItem(this.props.id, 'true');
    this.setState({ shouldViewNext: true });
  }

}
