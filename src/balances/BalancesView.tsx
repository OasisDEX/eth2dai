import * as React from 'react';

import { theAppContext } from '../AppContext';
import { FlexLayoutRow } from '../utils/layout/FlexLayoutRow';

export class BalancesView extends React.Component<{}> {
  public render() {
    return (
      <div>
        <theAppContext.Consumer>
          { ({
               AssetOverviewViewRxTx,
          }) =>
            <div>
              <FlexLayoutRow>
                <AssetOverviewViewRxTx />
              </FlexLayoutRow>
            </div>
          }
        </theAppContext.Consumer>
      </div>
    );
  }
}
