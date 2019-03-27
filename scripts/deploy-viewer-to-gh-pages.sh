#!/bin/bash
set -ev

# setup ssh key
echo -e "Host github.com\n\tStrictHostKeyChecking no\nIdentityFile ~/.ssh/deploy.key\n" >> ~/.ssh/config
echo -e "$GITHUB_DEPLOY_KEY" | base64 -d > ~/.ssh/deploy.key
chmod 600 ~/.ssh/deploy.key

cd ../

# fetch gh-pages branch
git clone --depth=1 --branch=gh-pages git@github.com:vivliostyle/vivliostyle.js.git gh-pages
cd gh-pages

# git configuration
git config user.email "murakami@vivliostyle.org"
git config user.name "MurakamiShinyu (Travis CI)"

# update gh-pages branch
cp -R ../vivliostyle-ui/dist/* .
cp -R ../vivliostyle-ui/node_modules/vivliostyle/samples/* samples/
cp ../vivliostyle-ui/node_modules/vivliostyle/doc/supported-features.{md,html} docs/en/
cp ../vivliostyle-ui/node_modules/vivliostyle/CHANGELOG.md .
cp -R ../vivliostyle-ui/build/* viewer/

zip="../vivliostyle-ui/vivliostyle-js-latest.zip"
if [ -e ${zip} ]; then
    mv ${zip} downloads/
fi

git add .
git status
git commit -m "Update vivliostyle-ui (original commit: $TRAVIS_COMMIT)"
git push origin gh-pages
