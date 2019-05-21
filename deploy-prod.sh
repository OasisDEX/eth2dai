rm -rf ./build

yarn build

echo "eth2dai.com" > ./build/CNAME

cp ./build/200.html ./build/404.html

gh-pages -d ./build