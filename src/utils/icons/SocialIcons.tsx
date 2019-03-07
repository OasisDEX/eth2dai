import * as React from 'react';

import gitHubSvg from '../../icons/social/git-hub.svg';
import redditSvg from '../../icons/social/reddit.svg';
import rocketChatSvg from '../../icons/social/rocket-chat.svg';
import { socialIcon } from './Icons.scss';
import { SvgImage } from './utils';

export class RocketChat extends React.PureComponent {
  public render() {
    return <SvgImage image={rocketChatSvg} className={socialIcon} />;
  }
}

export class Github extends React.PureComponent {
  public render() {
    return <SvgImage image={gitHubSvg} className={socialIcon} />;
  }
}

export class Reddit extends React.PureComponent {
  public render() {
    return <SvgImage image={redditSvg} className={socialIcon} />;
  }
}
