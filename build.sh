MODE=$1

# node version
echo "node version is " && node -v

# npm version
echo "npm version is " && npm -v

# install server
echo "===> install deps"
npm install

# build app
echo "===> build app"
cd app
git diff --name-only $GIT_PREVIOUS_COMMIT $GIT_COMMIT | grep package-lock.json && npm ci
npm run build:${MODE}

## tar
echo "===> bundle it"
cd ..
source_file=/tmp/my-manga-${MODE}.tar.gz
tar -zcvf $source_file --exclude="*.tar.gz" --exclude="app" --exclude=".git" ./
mv $source_file $WORKSPACE