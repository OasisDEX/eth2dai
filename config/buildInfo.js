'use strict';


const webpack = require('webpack');
const pkg = require('../package.json');
const execa = require('execa');

const gitHash = execa.sync('git', ['rev-parse', '--short', 'HEAD']).stdout;
const gitNumCommits = Number(execa.sync('git', ['rev-list', 'HEAD', '--count']).stdout);
const gitDirty = execa.sync('git', ['status', '-s', '-uall']).stdout.length > 0;
const branch = execa.sync('git', ['rev-parse', '--abbrev-ref', 'HEAD']).stdout;

const buildInfo = new webpack.EnvironmentPlugin({
  __BRANCH__: branch,
  __DATE__: Date.now(),
  __DIRTY__: gitDirty,
  __HASH__: gitHash,
  __NAME__: pkg.name,
  __COMMITS__: gitNumCommits,
  __VERSION__: pkg.version,
});

module.exports = buildInfo;