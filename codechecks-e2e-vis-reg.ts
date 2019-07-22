import { join } from "path";
import { codechecks } from "@codechecks/client";
// tslint:disable-next-line
const exec = require("await-exec") as (cmd: string, opt: any) => Promise<void>;

export async function main() {
  await visReg();
}

async function visReg() {
  const execOptions = { timeout: 100000, cwd: process.cwd(), log: true };
  await codechecks.saveDirectory("e2e-vis-reg", join(__dirname, "__screenshots__"));

  if (codechecks.isPr()) {
    await codechecks.getDirectory("e2e-vis-reg", join(__dirname, ".reg/expected"));
    await exec("./node_modules/.bin/reg-suit compare", execOptions);

    await codechecks.saveDirectory("e2e-vis-reg-report", join(__dirname, ".reg"));

    const reportData = require("./.reg/out.json");
    await codechecks.success({
      name: "Visual regression for E2E",
      shortDescription: `Changed: ${reportData.failedItems.length}, New: ${
        reportData.newItems.length
      }, Deleted: ${reportData.deletedItems.length}`,
      detailsUrl: codechecks.getArtifactLink("/e2e-vis-reg-report/index.html"),
    });
  }
}
