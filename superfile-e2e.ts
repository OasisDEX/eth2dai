import { buildSize }  from 'build-size-super-plugin';
import { join } from 'path';
import { report, superCI } from 'super-ci';
// tslint:disable-next-line
const exec = require('await-exec') as (cmd: string, opt: any) => Promise<void>;

export async function main() {
  await visReg();
}

async function visReg() {
  const execOptions = { timeout: 100000, cwd: process.cwd(), log: true };
  await superCI.saveCollection('e2e-vis-reg', join(__dirname, '__screenshots__'));

  if (superCI.isPr()) {
    await superCI.getCollection('e2e-vis-reg', join(__dirname, '.reg/expected'));
    await exec('./node_modules/.bin/reg-suit compare', execOptions);

    await superCI.saveCollection('e2e-vis-reg-report', join(__dirname, '.reg'));

    const reportData = require('./.reg/out.json');
    report({
      name: "Vis reg report — E2E",
      shortDescription: `Changed: ${reportData.failedItems.length}, New: ${reportData.newItems.length}, Deleted: ${reportData.deletedItems.length}`,
      detailsUrl: superCI.getArtifactLink('/e2e-vis-reg-report/index.html'),
    });
  }
}
