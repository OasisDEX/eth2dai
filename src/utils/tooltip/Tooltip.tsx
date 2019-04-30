import classnames from 'classnames';
import * as React from 'react';
import * as ReactTooltip from 'react-tooltip';
import warningSvg from '../../icons/warning.svg';
import { SvgImage } from '../icons/utils';
import * as styles from './Tooltip.scss';

export interface Tooltip {
  id: string;
  text: string;
  iconColor?: 'white' | 'grey';
}

export const Tooltip = (props: Tooltip) => {
  const { id, text, iconColor } = props;
  return (
    <>
      <SvgImage data-tip={true} data-for={id} className={classnames(styles.warningIcon, {
        [styles.white]: iconColor === 'white',
        [styles.grey]: !iconColor || iconColor === 'grey'
      })} image={warningSvg}/>
      <ReactTooltip className="instantTooltip" effect="solid" id={id}>
        <p>
          {text}
        </p>
      </ReactTooltip>
    </>);
};
