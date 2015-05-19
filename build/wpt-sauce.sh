#!/bin/bash
set -ev

WORKDIR=work

cd ../..

mkdir ${WORKDIR}
cd ${WORKDIR}

# fetch necessary repositories
git clone --depth=1 --branch=vivliostyle-master --recursive https://github.com/vivliostyle/wptrunner.git
git clone --depth=1 --branch=vivliostyle-master --recursive https://github.com/vivliostyle/csswg-test.git
git clone --depth=1 --branch=vivliostyle-master --recursive https://github.com/vivliostyle/wpt-tools.git csswg-test/wpt_tools

# copy Vivliostyle.js files
mkdir csswg-test/vivliostyle.js
cp -R ../vivliostyle/vivliostyle.js/{src,test} csswg-test/vivliostyle.js/

# setup Sauce Labs credentials
cat << EOS > csswg-test/vivliostyle.js/test/wpt/sauce-credentials.ini
[credentials]
username = ${SAUCE_USERNAME}
key = ${SAUCE_ACCESS_KEY}
EOS

# setup environment
virtualenv .
source bin/activate
pip install -e wptrunner
pip install -r wptrunner/requirements_sauce.txt

# run tests
wptrunner --metadata=csswg-test/metadata --tests=csswg-test --product=sauceconnect --ssl-type=none --run-vivliostyle --log-mach - --sauce-config=csswg-test/vivliostyle.js/test/wpt/sauce.ini --processes=3
