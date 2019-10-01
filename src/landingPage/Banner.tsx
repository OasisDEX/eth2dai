import * as React from 'react';
// @ts-ignore
// @ts-ignore
// @ts-ignore
// tslint:disable:import-name

import warningSvg from '../icons/warning.svg';
import { Button } from '../utils/forms/Buttons';
import { SvgImage } from '../utils/icons/utils';
import * as styles from './Banner.scss';

interface BannerProps {
  buttonLabel: string | React.ReactNode;
  content: string | React.ReactNode;
  continue: () => any;
}

export class Banner extends React.Component<BannerProps> {
  public render() {

    const { content, continue: onContinue, buttonLabel } = this.props;

    return (
      <section className={styles.section}>
        <div className={styles.panel}>
          <div className={styles.contentPlaceholder}>
            <SvgImage image={warningSvg} className={styles.warningIcon}/>
            <div className={styles.content}>
              {content}
            </div>
          </div>
          <div className={styles.btnPlaceholder}>
            <Button data-test-id="continue-with-new-contract"
                    size="md"
                    className={styles.btn}
                    onClick={onContinue}>
              {buttonLabel}
            </Button>
          </div>
        </div>
      </section>
    );
  }
}
