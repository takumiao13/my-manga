ENV=$1

# node version
echo "node version is " && node -v

# npm version
echo "npm version is " && npm -v

# build app
cd app
git diff --name-only $GIT_PREVIOUS_COMMIT $GIT_COMMIT | grep package-lock.json && npm ci
npm run build:${ENV}

## tar
cd ..
source_file=/tmp/my-manga-${ENV}.tar.gz
tar -zcvf $source_file --exclude="*.tar.gz" --exclude="app" --exclude=".git" ./
mv $source_file $WORKSPACE