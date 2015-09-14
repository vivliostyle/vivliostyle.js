#!/bin/bash
set -ev

dist=vivliostyle-js-viewer-$1
mkdir ${dist}
cp -R build/* ${dist}/
cp scripts/start-webserver* ${dist}/
zip -r vivliostyle-js-viewer-latest.zip ${dist}
rm -rf ${dist}
