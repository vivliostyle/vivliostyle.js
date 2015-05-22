# Running CSSWG tests with wptrunner

This directory contains files necessary to run [CSSWG test suites (modified by Vivliostyle)](https://github.com/vivliostyle/csswg-test) using [wptrunner](https://github.com/vivliostyle/wptrunner).

metadata/ directory contains manifest files which wptrunner uses. `MANIFEST.json` contains lists of manual tests and reftests which pass when run on current Vivliostyle.js. `MANIFEST_failing.json` contains lists of failing tests.

You can automatically run CSSWG test suites on Vivliostyle.js as following:

```sh
# Make sure that your system has Python installed, and virtualenv package is installed. If you are using HomeBrew on Mac:
brew install python
pip install virtualenv

# Make working directory (outside Vivliostyle.js repository)
mkdir work
cd work

# Fetch necessary repositories
git clone --depth=1 --branch=vivliostyle-master --recursive https://github.com/vivliostyle/wptrunner.git
git clone --depth=1 --branch=vivliostyle-master --recursive https://github.com/vivliostyle/csswg-test.git
git clone --depth=1 --branch=vivliostyle-master --recursive https://github.com/vivliostyle/wpt-tools.git csswg-test/wpt_tools

# Copy Vivliostyle.js files
mkdir csswg-test/vivliostyle.js
cp -R (Vivliostyle.js repository)/{src,test} csswg-test/vivliostyle.js/
# Or, you can clone from GitHub directory
# git clone --depth=1 --branch=master https://github.com/vivliostyle/vivliostyle.js.git csswg-test/vivliostyle.js

# Setup environment
virtualenv .
source bin/activate
pip install -e wptrunner
# (If you use a browser other than Chrome, use the appropriate requirements file below)
pip install -r wptrunner/requirements_chrome.txt

# Run tests (Example for Chrome. Modify the Chrome binary path appropriately)
wptrunner --metadata=csswg-test/vivliostyle.js/test/wpt/metadata --tests=csswg-test \
  --ssl-type=none --run-vivliostyle --log-mach - \
  --product=chrome \
  --binary=~/Applications/Google\ Chrome.app/Contents/MacOS/Google\ Chrome \
  --webdriver-binary=bin/chromedriver
```
