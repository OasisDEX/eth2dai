import { storiesOf } from '@storybook/react';
import * as React from 'react';

import { ignoreDuringVisualRegression } from '../../storybookUtils';
import { Panel } from '../panel/Panel';
import { InfoLabel } from '../text/Text';
import {
  LoadingIndicator,
  WithLoadingIndicator,
  WithLoadingIndicatorInline
} from './LoadingIndicator';
import { ServerUnreachable, ServerUnreachableInline } from './ServerUnreachable';

const stories = storiesOf('Loading indicator', module);

stories.add('Loading indicator', () => (
  <div>
    <h1>Loading indicator default</h1>
    <Panel style={{ height: '150px', width: '300px', padding: '15px' }}>
      <span>it's loading</span>
      <LoadingIndicator />
    </Panel>

    <h1>Loading indicator inline</h1>
    <Panel style={{ height: '150px', width: '300px',  padding: '15px' }}>
      <span>it's loading</span>
      <LoadingIndicator inline={true}/>
    </Panel>

    <h1>Loading indicator with light background</h1>
    <Panel style={{ height: '150px', width: '300px',  padding: '15px' }}>
      <span>it's loading</span>
      <LoadingIndicator light={true}/>
    </Panel>

  </div>
));

const StoryWithLoading = ({ loadable }: {loadable: any}) => {
  return (
    <Panel style={{ height: '150px', width: '300px', padding: '15px' }}>
      <WithLoadingIndicator loadable={loadable}>
        {(data: any) => (
          <p>{data.text}</p>
        )}
      </WithLoadingIndicator>
    </Panel>
  );
};

ignoreDuringVisualRegression(() => {
  stories.add('WithLoadingIndicator component', () => {
    const value = { text: 'It loaded successfully!' };
    return (
      <div>
        <h1>Loading</h1>
        <StoryWithLoading loadable={{ value, status: 'loading' }}/>

        <h1>Loaded</h1>
        <StoryWithLoading loadable={{ value, status: 'loaded' }}/>

        <h1>Error</h1>
        <StoryWithLoading loadable={{ value, status: 'error' }}/>

      </div>
    );
  });

  stories.add('ServerUnreachable error', () => {
    const value = { text: 'It loaded successfully!' };
    return (
      <div>
        <h1>Error block</h1>

        <Panel style={{ height: '250px', width: '500px', padding: '15px' }}>
          <WithLoadingIndicator
            loadable={{ value, status: 'error' }}
            error={<ServerUnreachable/>}>
            {(data: any) => (
              <p>{data.text}</p>
            )}
          </WithLoadingIndicator>
        </Panel>

        <h1>Error inline</h1>

        <Panel style={{ width: '500px', padding: '15px' }}>
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <WithLoadingIndicatorInline
              loadable={{ value, status: 'error' }}
              error={<ServerUnreachableInline />}
            >
              {(data: any) => (
                <span>{data.text}</span>
              )}
            </WithLoadingIndicatorInline>
            <InfoLabel style={{ marginLeft: '7px' }}>24h Price</InfoLabel>
          </div>

        </Panel>
      </div>
    );
  });
});
