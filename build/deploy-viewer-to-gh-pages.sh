#!/bin/bash
set -ev

# setup ssh key
echo -e "Host github.com\n\tStrictHostKeyChecking no\nIdentityFile ~/.ssh/deploy.key\n" >> ~/.ssh/config
echo -e "$GITHUB_DEPLOY_KEY" | base64 -d > ~/.ssh/deploy.key
chmod 600 ~/.ssh/deploy.key

# build documents
gem install kramdown
kramdown -i GFM --template doc/supported-features.erb doc/supported-features.md > doc/supported-features.html

cd ../

# fetch and build vivliostyle-ui
gem install compass
git clone --depth=1 --branch=master git@github.com:vivliostyle/vivliostyle-ui.git vivliostyle-ui
cd vivliostyle-ui
npm install ../vivliostyle.js
npm install
npm run build
npm run test-sauce

# make distribution package
cp ../vivliostyle.js/doc/supported-features.{md,html} dist/docs/en/
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
