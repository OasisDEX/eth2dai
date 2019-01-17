// tslint:disable:max-line-length
import * as React from 'react';
import * as styles from './coinIcons.scss';

// coin icons
export class ETHcoin extends React.PureComponent {
  public render() {
    return (
      <svg xmlns="http://www.w3.org/2000/svg" height="26" viewBox="0 0 28 28" className={styles.white}>
        <path d="M13.9596542,0 C21.6693052,0 27.9193084,6.26813493 27.9193084,14 C27.9193084,21.7321121 21.6693052,28 13.9596542,28 C6.24987994,28 0,21.7321121 0,14 C0,6.26813493 6.24987994,0 13.9596542,0 Z M13.9584514,21.6363636 L18.4013623,15.2727273 L13.9584514,17.9395337 L9.51794603,15.2727273 L13.9584514,21.6363636 Z M13.9596542,16.5454545 L18.4013623,13.8713179 L13.9596542,6.36363636 L9.51794603,13.8713179 L13.9596542,16.5454545 Z"/>
      </svg>
    );
  }
}

export class DAIcoin extends React.PureComponent {
  public render() {
    return (
      <svg height="26" viewBox="0 0 22 22" xmlns="http://www.w3.org/2000/svg" className={styles.white}>
        <path d="M11,0 C4.92380952,0 0,4.92380952 0,11 C0,17.0761905 4.92380952,22 11,22 C17.0761905,22 22,17.0761905 22,11 C22,4.92380952 17.0761905,0 11,0 Z"
          id="Shape" fill="#F7A600"/>
        <g id="icon" transform="translate(5.000000, 5.000000)" fill="#FFFFFF" fillRule="nonzero">
          <path d="M5.96321084,0.0298930257 L11.9716628,6.03834499 L6.03034642,11.9796614 L0.021894453,5.97120941 L5.96321084,0.0298930257 Z M7.70388864,6.0143682 L10.2645533,6.02875439 L5.97280189,1.73700299 L1.72900447,5.98080041 L4.28966911,5.9951866 L5.98718808,4.29766764 L7.70388864,6.0143682 Z"/>
        </g>
      </svg>
    );
  }
}

// normal icons
export class ETHicon extends React.PureComponent {
  public render() {
    return (
      <svg xmlns="http://www.w3.org/2000/svg" height="26" viewBox="0 0 28 28" className={styles.white}>
        <path d="M13.9584514,21.6363636 L18.4013623,15.2727273 L13.9584514,17.9395337 L9.51794603,15.2727273 L13.9584514,21.6363636 Z M13.9596542,16.5454545 L18.4013623,13.8713179 L13.9596542,6.36363636 L9.51794603,13.8713179 L13.9596542,16.5454545 Z"/>
      </svg>
    );
  }
}

export class DAIicon extends React.PureComponent {
  public render() {
    return (
      <svg height="26" viewBox="0 0 22 22" xmlns="http://www.w3.org/2000/svg" className={styles.white}>
        <g id="icon" transform="translate(5.000000, 5.000000)">
          <path d="M5.96321084,0.0298930257 L11.9716628,6.03834499 L6.03034642,11.9796614 L0.021894453,5.97120941 L5.96321084,0.0298930257 Z M7.70388864,6.0143682 L10.2645533,6.02875439 L5.97280189,1.73700299 L1.72900447,5.98080041 L4.28966911,5.9951866 L5.98718808,4.29766764 L7.70388864,6.0143682 Z"/>
        </g>
      </svg>
    );
  }
}
