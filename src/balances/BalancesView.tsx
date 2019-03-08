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
               TaxExporterButtonTxRx
          }) =>
            <div>
              <FlexLayoutRow>
                <AssetOverviewViewRxTx />
              </FlexLayoutRow>
              <FlexLayoutRow>
                <TaxExporterButtonTxRx />
              </FlexLayoutRow>
            </div>
          }
        </theAppContext.Consumer>
      </div>
    );
  }
}
