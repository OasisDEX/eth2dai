const { join } = require("path");

const { superCI, report } = require("super-ci");
const { buildSize } = require("build-size-super-plugin");

module.exports.main = async function main() {
  await buildSize({
    path: "./build/static/js",
  });
}
