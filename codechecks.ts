import { codeChecks } from "codechecks";
import { buildSize } from "codecheck-build-size";
import { join } from "path";
import { lint } from "type-coverage";
// tslint:disable-next-line
const exec = require("await-exec") as (cmd: string, opt: any) => Promise<void>;

export async function main() {
  await buildSize({
    files: [
      { path: "./build/static/js/*.js", maxSize: 1024 },
      { path: "./build/static/css/*.css" },
    ],
  });

  await deploy(join(__dirname, "build"));

  await visReg();

  const res = await lint(join(__dirname, "tsconfig.prod.json"), true, false);
  console.log(JSON.stringify(res));
  await codeChecks.success({
    name: "Type Coverage",
    shortDescription: `Change: 0.01% Total: ${(res.correctCount / res.totalCount * 100).toFixed(2)}%`,
    longDescription: 
      `
New untyped symbols: 3
./index.ts:45:32
      `
  });
}

async function deploy(path: string) {
  if (codeChecks.isPr()) {
    await codeChecks.saveCollection("build", path);
    await codeChecks.success({
      name: "Commit deployment",
      shortDescription: "Deployment for commit ready.",
      detailsUrl: codeChecks.getArtifactLink("/build/index.html"),
    });
  }
}

async function visReg() {
  const execOptions = { timeout: 100000, cwd: process.cwd(), log: true };
  await exec("yarn storybook:screenshots", execOptions);
  await codeChecks.saveCollection("storybook-vis-reg", join(__dirname, "__screenshots__"));

  if (codeChecks.isPr()) {
    await codeChecks.getCollection("storybook-vis-reg", join(__dirname, ".reg/expected"));
    await exec("./node_modules/.bin/reg-suit compare", execOptions);

    await codeChecks.saveCollection("storybook-vis-reg-report", join(__dirname, ".reg"));

    const reportData = require("./.reg/out.json");
    await codeChecks.success({
      name: "Visual regression for Storybook",
      shortDescription: `Changed: ${reportData.failedItems.length}, New: ${
        reportData.newItems.length
      }, Deleted: ${reportData.deletedItems.length}`,
      detailsUrl: codeChecks.getArtifactLink("/storybook-vis-reg-report/index.html"),
    });
  }
}
