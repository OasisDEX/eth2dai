#!/usr/bin/env bash
set -e
cd "$(dirname "$0")"

source ~/.bashrc

# setup node version
nvm install 8
nvm use 8
nvm alias default 8

npm install --global yarn

