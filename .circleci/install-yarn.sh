#!/usr/bin/env bash
set -e
cd "$(dirname "$0")"

source ~/.bashrc

# setup node version
nvm install 8
nvm use 8
nvm alias default 8

curl -sS https://dl.yarnpkg.com/debian/pubkey.gpg | sudo apt-key add -
echo "deb https://dl.yarnpkg.com/debian/ stable main" | sudo tee /etc/apt/sources.list.d/yarn.list

 sudo apt-get update -o Dir::Etc::sourcelist="sources.list.d/yarn.list" \
        -o Dir::Etc::sourceparts="-" -o APT::Get::List-Cleanup="0"

sudo apt-get install -y yarn
sudo apt-get install -y chromium-browser
