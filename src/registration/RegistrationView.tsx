import * as React from 'react';

import { User, user$ } from '../blockchain/user';
import { connect } from '../utils/connect';
import { FlexLayoutRow } from '../utils/layout/FlexLayoutRow';
import { RegistrationFormTxRx } from './RegistrationForm';

export class RegistrationView extends React.Component<{}> {
  public render() {
    return (
      <div>
        <div>
          <FlexLayoutRow>
            <AuthorizedTxRx />
            <RegistrationFormTxRx />
          </FlexLayoutRow>
        </div>
      </div>
    );
  }
}

class Authorized extends React.Component<User> {
  public render() {
    return <p>Authorized: {(!!this.props.authorized).toString()}</p>;
  }
}

const AuthorizedTxRx = connect(Authorized, user$);
