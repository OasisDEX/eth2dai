#!/usr/bin/env bash
set -e
cd "$(dirname "$0")"
cd ../

./node_modules/.bin/http-server -p 3000 ./build &
server_pid=$!

yarn cypress:run:ci

kill -9 $server_pid
