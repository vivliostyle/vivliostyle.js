#!/bin/bash
set -ev

gem install kramdown -v 1.17.0
src="packages/core/doc/supported-features.md"
template="packages/core/doc/supported-features.erb"
version=$(grep '^ *"version":' package.json | sed -e 's/^.*"\([^"]*\)"[^"]*$/\1/' | sed -e 's/\.0$//')
if [ $(echo ${version} | grep -- '-pre') ]; then
    sed -i -e "s/<%= \$version %>//" ${src} ${template}
else
    sed -i -e "s/<%= \$version %>/ ${version}/" ${src} ${template}
fi
kramdown --no-auto-ids -i GFM --template ${template} ${src} > packages/core/doc/supported-features.html
