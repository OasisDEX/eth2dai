import * as React from 'react';

import { User } from '../../blockchain/user';
import { Authorizable } from '../authorizable';
import { LoggedOut } from '../loadingIndicator/LoggedOut';
import { Gate } from './Gate';

interface AuthorizationProps<T> {
  authorizable: Authorizable<T>;
  children: (t: T, user: User) => React.ReactElement<any>;
  view: string;
}

export function Authorization<T>({ authorizable, children, view }: AuthorizationProps<T>) {
  return <Gate isOpen={authorizable.authorized} closed={<LoggedOut view={view}/>}>
    { children(authorizable.value as T, authorizable.user as User) }
    </Gate>;
}
