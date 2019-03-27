import { join } from 'path';
import { codeChecks } from 'codechecks';
// tslint:disable-next-line
const exec = require('await-exec') as (cmd: string, opt: any) => Promise<void>;

export async function main() {
  await visReg();
}

async function visReg() {
  const execOptions = { timeout: 100000, cwd: process.cwd(), log: true };
  await codeChecks.saveCollection('e2e-vis-reg', join(__dirname, '__screenshots__'));

  if (codeChecks.isPr()) {
    await codeChecks.getCollection('e2e-vis-reg', join(__dirname, '.reg/expected'));
    await exec('./node_modules/.bin/reg-suit compare', execOptions);

    await codeChecks.saveCollection('e2e-vis-reg-report', join(__dirname, '.reg'));

    const reportData = require('./.reg/out.json');
    await codeChecks.success({
      name: 'Visual regression for E2E',
      shortDescription: `Changed: ${reportData.failedItems.length}, New: ${reportData.newItems.length}, Deleted: ${reportData.deletedItems.length}`,
      detailsUrl: codeChecks.getArtifactLink('/e2e-vis-reg-report/index.html'),
    });
  }
}
