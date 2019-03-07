import classnames from 'classnames';
import * as React from 'react';

import * as styles from './Icons.scss';

export const InfoIcon = (props: React.HTMLAttributes<HTMLDivElement>) => {
  const { className, ...otherProps } = props;
  return (
    <div
      className={classnames(styles.infoIcon, className)}
      {...otherProps}
    >i</div>
  );
};

export type ProgressIconProps = React.HTMLAttributes<HTMLDivElement> & {
  light?: boolean,
  small?: boolean,
};

export const ProgressIcon = (props: ProgressIconProps) => {
  const { className, light, small, ...otherProps } = props;
  return (
    <div
      className={classnames(styles.progressIcon, className, {
        [styles.progressIconLight]: light,
        [styles.progressIconSm]: small,
      })}
      {...otherProps}
    />
  );
};

export const ErrorIcon = (props: React.HTMLAttributes<SVGGraphicsElement>) => {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" {...props}>
      <path fill="none" d="M0 0h24v24H0V0z"/>
      <path d="M11 15h2v2h-2zm0-8h2v6h-2zm.99-5C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zM12 20c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8z"/>
    </svg>
  );
};

export const NetworkIcon = () => {
  return <svg width="157" height="135" viewBox="0 0 157 135" xmlns="http://www.w3.org/2000/svg">
    <g id="Artboard" fill="none" fillRule="evenodd">
      <path
        d="M25,65 L37,65 L37,38 L11,38 L11,25.8471036 C4.76981987,24.8850933 0,19.4995722 0,13 C0,5.82029825 5.82029825,0 13,0 C20.1797017,0 26,5.82029825 26,13 C26,19.4995722 21.2301801,24.8850933 15,25.8471036 L15,34 L37,34 L37,24 L120,24 L120,34 L142,34 L142,25.8471036 C135.76982,24.8850933 131,19.4995722 131,13 C131,5.82029825 136.820298,0 144,0 C151.179702,0 157,5.82029825 157,13 C157,19.4995722 152.23018,24.8850933 146,25.8471036 L146,38 L120,38 L120,65 L132,65 L132,55 L156,55 L156,79 L132,79 L132,69 L120,69 L120,97 L146,97 L146,109.152896 C152.23018,110.114907 157,115.500428 157,122 C157,129.179702 151.179702,135 144,135 C136.820298,135 131,129.179702 131,122 C131,115.500428 135.76982,110.114907 142,109.152896 L142,101 L120,101 L120,111 L37,111 L37,101 L15,101 L15,109.152896 C21.2301801,110.114907 26,115.500428 26,122 C26,129.179702 20.1797017,135 13,135 C5.82029825,135 0,129.179702 0,122 C0,115.500428 4.76981987,110.114907 11,109.152896 L11,97 L37,97 L37,69 L25,69 L25,79 L1,79 L1,55 L25,55 L25,65 Z M41,41 L41,107 L116,107 L116,41 L41,41 Z M41,28 L41,37 L116,37 L116,28 L41,28 Z M106,30.5 L110,30.5 L110,34.5 L106,34.5 L106,30.5 Z M98,30.5 L102,30.5 L102,34.5 L98,34.5 L98,30.5 Z M90,30.5 L94,30.5 L94,34.5 L90,34.5 L90,30.5 Z M78.4967506,94.5 L66.5,77.4166667 L78.4967506,84.5757721 L90.5,77.4166667 L78.4967506,94.5 Z M78.5,80.8333333 L66.5,73.6545498 L78.5,53.5 L90.5,73.6545498 L78.5,80.8333333 Z M13,131 C17.9705627,131 22,126.970563 22,122 C22,117.029437 17.9705627,113 13,113 C8.02943725,113 4,117.029437 4,122 C4,126.970563 8.02943725,131 13,131 Z M13,4 C8.02943725,4 4,8.02943725 4,13 C4,17.9705627 8.02943725,22 13,22 C17.9705627,22 22,17.9705627 22,13 C22,8.02943725 17.9705627,4 13,4 Z M144,131 C148.970563,131 153,126.970563 153,122 C153,117.029437 148.970563,113 144,113 C139.029437,113 135,117.029437 135,122 C135,126.970563 139.029437,131 144,131 Z M144,4 C139.029437,4 135,8.02943725 135,13 C135,17.9705627 139.029437,22 144,22 C148.970563,22 153,17.9705627 153,13 C153,8.02943725 148.970563,4 144,4 Z M152,59 L136,59 L136,75 L152,75 L152,59 Z M5,59 L5,75 L21,75 L21,59 L5,59 Z"
        id="Combined-Shape" fill="#69F0AE"/>
    </g>
  </svg>;
};

export const Cross = () => {
  return (
    <svg width="100%" height="100%" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
      <g id="Page-1" fill="none" fillRule="evenodd">
        <g id="baseline-cancel-24px" transform="translate(-2 -2)">
          <polygon id="Path" points="0 0 24 0 24 24 0 24" />
          <path d="M12,2 C6.47,2 2,6.47 2,12 C2,17.53 6.47,22 12,22 C17.53,22 22,17.53 22,12 C22,6.47 17.53,2 12,2 Z"
                id="Path" fill="rgba(255,255,255, 0.05)" fillRule="nonzero" />
          <polygon id="Path" fill="#FFF" fillRule="nonzero" points="17 15.59 15.59 17 12 13.41 8.41 17 7 15.59 10.59 12 7 8.41 8.41 7 12 10.59 15.59 7 17 8.41 13.41 12"
          />
        </g>
      </g>
    </svg>
  );
};
