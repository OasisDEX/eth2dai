import { fromPairs } from 'ramda';
import * as React from 'react';
import { combineLatest } from 'rxjs';
import { ajax } from 'rxjs/ajax';
import { map } from 'rxjs/operators';

import { account$, context$ } from '../blockchain/network';
import { connect } from '../utils/connect';
import { Button } from '../utils/forms/Buttons';
import { InputGroup, InputGroupAddon } from '../utils/forms/InputGroup';
import { Panel, PanelHeader } from '../utils/panel/Panel';
import * as styles from './RegistrationForm.scss';

interface RegistrationFormProps {
  account: string | undefined;
  kycBackend: {
    url: string;
  };
}

class RegistrationForm extends React.Component<RegistrationFormProps> {
  public render() {
    return (
      <Panel footerBordered={true} style={{ width: '100%' }}>
        <PanelHeader>Register</PanelHeader>
        <form className={styles.form} onSubmit={this.handleSubmit}>
          <InputGroup>
            <InputGroupAddon className={styles.inputLabel}>Email</InputGroupAddon>
            <input type="email" name="email" />
          </InputGroup>
          <InputGroup>
            <InputGroupAddon className={styles.inputLabel}>First name</InputGroupAddon>
            <input type="text" name="firstName" />
          </InputGroup>
          <InputGroup>
            <InputGroupAddon className={styles.inputLabel}>Last name</InputGroupAddon>
            <input type="text" name="lastName" />
          </InputGroup>
          <Button type="submit">Submit</Button>
        </form>
      </Panel>
    );
  }

  private handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fields = ['email', 'firstName', 'lastName'];
    const values = fromPairs(fields.map(f => [f, (e.target as any)[f].value] as [string, string]));
    const data = { address: this.props.account, ...values };
    ajax({ url: this.props.kycBackend.url, body: data, method: 'POST', headers: { 'Content-Type': 'application/json' } }).subscribe(console.log);
  }
}

export const RegistrationFormTxRx = connect(RegistrationForm, combineLatest(context$, account$).pipe(
  map(([context, account]) => ({ account, kycBackend: context.kycBackend })),
));
