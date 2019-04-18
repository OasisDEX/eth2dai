import * as React from 'react';
import { MdCheck, MdClear } from 'react-icons/md';

import { User, user$ } from '../blockchain/user';
import { connect } from '../utils/connect';
import { FlexLayoutRow } from '../utils/layout/FlexLayoutRow';
import { RegistrationFormPanel } from './RegistrationForm';

export class RegistrationView extends React.Component<{}> {
  public render() {
    return (
      <div>
        <div>
          <FlexLayoutRow>
            <AuthorizedTxRx />
          </FlexLayoutRow>
          <FlexLayoutRow>
            <RegistrationFormPanel />
          </FlexLayoutRow>
        </div>
      </div>
    );
  }
}

class Authorized extends React.Component<User> {
  public render() {
    const authorized = !!this.props.authorized;
    return (
      <div style={{ display: 'flex', margin: '2em' }}>
        {authorized ? <MdCheck size="30"/> : <MdClear size="30"/>}
        &nbsp;
        <span style={{ fontSize: '1.6em' }}>{authorized ? 'Able' : 'Not able'} to trade</span>
      </div>
    );
  }
}

const AuthorizedTxRx = connect(Authorized, user$);
