import { initScreenshot, withScreenshot } from 'storybook-chrome-screenshot';
import { configure, addDecorator } from '@storybook/react';

addDecorator(initScreenshot());
addDecorator(
  withScreenshot({
    delay: 1000,
    viewport: [
      {
        width: 1200,
        height: 800,
      },
    ],
  }),
);

// automatically import all files ending in *.stories.js
const req = require.context('../src', true, /.stories.tsx$/);
function loadStories() {
  req.keys().forEach(filename => req(filename));
}

configure(loadStories, module);
