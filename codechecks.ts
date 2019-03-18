import { codeChecks } from 'codechecks';
import { buildSize }  from 'codecheck-build-size';
import { join } from 'path';
// tslint:disable-next-line
const exec = require('await-exec') as (cmd: string, opt: any) => Promise<void>;

export async function main() {
  await buildSize({
    files: [
      { path: './build/static/js/*.js' },
      { path: './build/static/css/*.css' },
    ]
  });

  await deploy(join(__dirname, 'build'));

  await visReg();
}

async function deploy(path: string) {
  if (codeChecks.isPr()) {
    await codeChecks.saveCollection('build', path);
    await codeChecks.success({
      name: 'Commit deployment',
      shortDescription: 'Deployment for commit ready.',
      detailsUrl: codeChecks.getArtifactLink('/build/index.html'),
    });
  }
}

async function visReg() {
  const execOptions = { timeout: 300000, cwd: process.cwd(), log: true };
  await exec('yarn storybook:screenshots', execOptions);
  await codeChecks.saveCollection('storybook-vis-reg', join(__dirname, '__screenshots__'));

  if (codeChecks.isPr()) {
    await codeChecks.getCollection('storybook-vis-reg', join(__dirname, '.reg/expected'));
    await exec('./node_modules/.bin/reg-suit compare', execOptions);

    await codeChecks.saveCollection('storybook-vis-reg-report', join(__dirname, '.reg'));

    const reportData = require('./.reg/out.json');
    await codeChecks.success({
      name: 'Visual regression for Storybook',
      shortDescription: `Changed: ${reportData.failedItems.length}, New: ${reportData.newItems.length}, Deleted: ${reportData.deletedItems.length}`,
      detailsUrl: codeChecks.getArtifactLink('/storybook-vis-reg-report/index.html'),
    });
  }
}
