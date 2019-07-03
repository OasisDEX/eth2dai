import classnames from 'classnames';
import * as React from 'react';
import * as ReactTooltip from 'react-tooltip';
import warningSvg from '../../icons/warning.svg';
import { SvgImage } from '../icons/utils';
import * as styles from './Tooltip.scss';

export interface TooltipType {
  id: string;
  text: string;
}

export interface WarningTooltipType extends TooltipType {
  iconColor?: 'white' | 'grey' | 'soft-cyan';
}

export class WarningTooltip extends React.Component<WarningTooltipType> {
  public render() {
    const { id, text, iconColor } = this.props;
    return (
      <Tooltip id={id} text={text}>
        <SvgImage data-tip={true} data-for={id} className={classnames(styles.warningIcon, {
          [styles.white]: iconColor === 'white',
          [styles.softCyan]: iconColor === 'soft-cyan',
          [styles.grey]: !iconColor || iconColor === 'grey'
        })} image={warningSvg}/>
      </Tooltip>
    );
  }
}

export class Tooltip extends React.Component<TooltipType> {
  public render() {
    const { id, text, children } = this.props;
    return (<>
        {children}
        <ReactTooltip className="instantTooltip" effect="solid" id={id}>
          <p>{text}</p>
        </ReactTooltip>
      </>
    );
  }
}
