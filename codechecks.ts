import { codechecks } from '@codechecks/client';
import { join } from 'path';
// tslint:disable-next-line
const exec = require('await-exec') as (cmd: string, opt: any) => Promise<void>;

export async function main() {
  await visReg();
}

async function visReg() {
  const execOptions = { timeout: 300000, cwd: process.cwd(), log: true };
  await exec('yarn storybook:screenshots', execOptions);
  await codechecks.saveDirectory('storybook-vis-reg', join(__dirname, '__screenshots__'));

  if (codechecks.isPr()) {
    await codechecks.getDirectory('storybook-vis-reg', join(__dirname, '.reg/expected'));
    await exec('./node_modules/.bin/reg-suit compare', execOptions);

    await codechecks.saveDirectory('storybook-vis-reg-report', join(__dirname, '.reg'));

    const reportData = require('./.reg/out.json');
    await codechecks.success({
      name: 'Visual regression for Storybook',
      shortDescription: `Changed: ${reportData.failedItems.length}, New: ${reportData.newItems.length}, Deleted: ${reportData.deletedItems.length}`,
      detailsUrl: codechecks.getArtifactLink('/storybook-vis-reg-report/index.html'),
    });
  }
}
