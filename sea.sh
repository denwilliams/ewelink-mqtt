#! /bin/bash
nodejs_version="${NODEJS_VERSION:-20.5.0}"
NODE_DIR=".sea/node"

mkdir -p "${NODE_DIR}"
npx esbuild main.js --bundle --platform=node --target=node20.5 --outfile=.sea/main.js
echo '{ "main": ".sea/main.js", "output": ".sea/prep.blob", "disableExperimentalSEAWarning": true }' > .sea/config.json
node --experimental-sea-config .sea/config.json

for os in linux-armv7l linux-arm64 # linux-x64 darwin-x64 darwin-arm64
do
    download_url="https://nodejs.org/dist/v${nodejs_version}/node-v${nodejs_version}-${os}.tar.xz"
    curl -s "${download_url}" | tar -xJ -C "${NODE_DIR}"
    cp "${NODE_DIR}/node-v${nodejs_version}-${os}/bin/node" ".sea/ewelink-mqtt-${os}"
    rm -rf "${NODE_DIR}/node-v${nodejs_version}-${os}"
    npx postject ".sea/ewelink-mqtt-${os}" NODE_SEA_BLOB .sea/prep.blob --sentinel-fuse NODE_SEA_FUSE_fce680ab2cc467b6e072b8b5df1996b2
done
