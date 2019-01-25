const { join } = require("path");

const { superCI, report } = require("super-ci");
const { buildSize } = require("build-size-super-plugin");

module.exports.main = async function main() {
  await buildSize({
    path: "./build/static/js",
  });

  await deploy(join(__dirname, "build"));
}

async function deploy(path) {
  if (superCI.isPr()) {
    await superCI.saveCollection("build", path);
    report(
      `Branch deployment: https://s3-eu-west-1.amazonaws.com/superci-bucket/e9344e85-7b81-417e-9b65-4f31253a32d7/${
        superCI.context.currentSha
      }/build/index.html`,
    );
  }
}