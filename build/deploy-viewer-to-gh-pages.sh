#!/bin/bash
set -ev

# setup ssh key
echo -e "Host github.com\n\tStrictHostKeyChecking no\nIdentityFile ~/.ssh/deploy.key\n" >> ~/.ssh/config
echo -e "$GITHUB_DEPLOY_KEY" | base64 -d > ~/.ssh/deploy.key
chmod 600 ~/.ssh/deploy.key

cd ../

# fetch and build vivliostyle-ui
gem install compass
git clone --depth=1 --branch=master git@github.com:vivliostyle/vivliostyle-ui.git vivliostyle-ui
cd vivliostyle-ui
scripts/update-version.sh
npm install
npm install ../vivliostyle.js
npm run build
npm run test-sauce

# make distribution package
version=$(grep '^ *"version":' ../vivliostyle.js/package.json | sed -e 's/^.*"\([^"]*\)",$/\1/')
scripts/make-dist-package.sh ${version}

cd ../

# fetch gh-pages branch
git clone --depth=1 --branch=gh-pages git@github.com:vivliostyle/vivliostyle.js.git gh-pages
cd gh-pages

# git configuration
git config user.email "kwkbtr@vivliostyle.com"
git config user.name "kwkbtr (Travis CI)"

# update gh-pages branch
cp -R ../vivliostyle.js/samples/* samples/
cp ../vivliostyle.js/doc/supported-features.{md,html} docs/
cp -R ../vivliostyle-ui/build/* viewer/

zip="../vivliostyle-ui/vivliostyle-js-latest.zip"
if [ -e ${zip} ]; then
    mv ${zip} downloads/
fi

git add .
git status
git commit -m "Update vivliostyle.js (original commit: $TRAVIS_COMMIT)"
git push origin gh-pages
