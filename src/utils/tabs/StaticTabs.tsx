// tslint:disable:no-console

import classnames from 'classnames';
import * as React from 'react';

import * as styles from './Tabs.scss';

export class StaticTabs extends React.Component<any, object> {
  constructor(props: any) {
    super(props);
    this.state = { activeTab: props.default };
  }

  public switchTab = (tab: string) => {
    return (event: React.MouseEvent<HTMLElement>): void => {
      event.stopPropagation();
      this.setState({ activeTab: tab });
    };
  }

  public render() {
    const { tabs } = this.props;
    const { activeTab } = this.state as any;
    return (
      <div>
        <ul className={styles.Tabs}>
          {Object.keys(tabs).map(tab => (
            <li key={tab}>
              <a
                onClick={this.switchTab(tab)}
                className={classnames({ [styles.button]: true, active: tab === activeTab })}
              >
                {tab}
              </a>
            </li>
          ))}
        </ul>
        {tabs[activeTab]}
      </div>
    );
  }
}
