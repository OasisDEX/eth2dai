const { join } = require("path");

const { superCI, report } = require("super-ci");
const { buildSize } = require("build-size-super-plugin");
const exec = require("await-exec");

const artifactsPath =
  "https://s3-eu-west-1.amazonaws.com/superci-bucket/e9344e85-7b81-417e-9b65-4f31253a32d7/";

module.exports.main = async function main() {
  await buildSize({
    path: "./build/static/js",
  });

  await deploy(join(__dirname, "build"));

  await visReg();
};

async function deploy(path) {
  if (superCI.isPr()) {
    await superCI.saveCollection("build", path);
    report(`[Branch deployment](${artifactsPath}${superCI.context.currentSha}/build/index.html)`);
  }
}

async function visReg() {
  const execOptions = { timeout: 100000, cwd: process.cwd(), log: true };
  await exec("yarn storybook:screenshots", execOptions);
  await superCI.saveCollection("storybook-vis-reg", join(__dirname, "__screenshots__"));

  if (superCI.isPr()) {
    await superCI.getCollection("storybook-vis-reg", join(__dirname, ".reg/expected"));
    await exec("./node_modules/.bin/reg-suit compare", execOptions);

    await superCI.saveCollection("storybook-vis-reg-report", join(__dirname, ".reg"));

    const reportData = require("./.reg/out.json");
    report(
      `[Vis reg report](${artifactsPath}${
        superCI.context.currentSha
      }/storybook-vis-reg-report/index.html)
      Changed files: **${reportData.failedItems.length}**
      New files: **${reportData.newItems.length}**
      Deleted files: **${reportData.deletedItems.length}**
      `,
    );
  }
}
