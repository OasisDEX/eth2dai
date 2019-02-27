import { buildSize }  from 'build-size-super-plugin';
import { join } from 'path';
import { report, superCI } from 'super-ci';
// tslint:disable-next-line
const exec = require('await-exec') as (cmd: string, opt: any) => Promise<void>;

export async function main() {
  await buildSize({
    path: './build/static/js',
  });

  await deploy(join(__dirname, 'build'));

  await visReg();
}

async function deploy(path: string) {
  if (superCI.isPr()) {
    await superCI.saveCollection('build', path);
    report({
      name: 'Commit deployment',
      shortDescription: 'Deployment for commit ready.',
      detailsUrl: superCI.getArtifactLink('/build/index.html'),
    } as any);
  }
}

async function visReg() {
  const execOptions = { timeout: 100000, cwd: process.cwd(), log: true };
  await exec('yarn storybook:screenshots', execOptions);
  await superCI.saveCollection('storybook-vis-reg', join(__dirname, '__screenshots__'));

  if (superCI.isPr()) {
    await superCI.getCollection('storybook-vis-reg', join(__dirname, '.reg/expected'));
    await exec('./node_modules/.bin/reg-suit compare', execOptions);

    await superCI.saveCollection('storybook-vis-reg-report', join(__dirname, '.reg'));

    const reportData = require('./.reg/out.json');
    report({
      name: 'Visual regression for Storybook',
      shortDescription: `Changed: ${reportData.failedItems.length}, New: ${reportData.newItems.length}, Deleted: ${reportData.deletedItems.length}`,
      detailsUrl: superCI.getArtifactLink('/storybook-vis-reg-report/index.html'),
    } as any);
  }
}
