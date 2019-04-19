import classnames from 'classnames';
import * as React from 'react';
import { Button } from '../utils/forms/Buttons';
import * as panelStyling from '../utils/panel/Panel.scss';
import * as styles from './Instant.scss';

interface InstantFormProps {
  heading: string | React.ReactNode;
  btnLabel?: string;
  btnAction?: () => void;
  btnDisabled?: boolean;
  btnDataTestId?: string;
}

export class InstantFormWrapper extends React.Component<InstantFormProps> {
  public render() {
    const { heading, btnLabel, btnAction, btnDisabled, btnDataTestId, children } = this.props;

    return (
      <section className={classnames(styles.panel, panelStyling.panel)}>
        <header className={styles.header}>
          <h1>{heading}</h1>
        </header>
        {
          children
        }
        {
          btnLabel && (
            <footer className={styles.footer}>
              <Button
                data-test-id={btnDataTestId}
                size="lg"
                color="white"
                onClick={btnAction}
                className={styles.button}
                disabled={btnDisabled}
              >
                {btnLabel}
              </Button>
            </footer>
          )
        }
      </section>
    );
  }
}
