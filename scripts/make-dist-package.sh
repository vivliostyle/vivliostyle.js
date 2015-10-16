#!/bin/bash
set -ev

dist=vivliostyle-js-$1
mkdir ${dist}
cp -R dist/* ${dist}/
mkdir ${dist}/viewer/
cp -R build/* ${dist}/viewer/
cp scripts/start-webserver* ${dist}/
cp -R node_modules/vivliostyle/samples ${dist}/
zip -qr vivliostyle-js-latest.zip ${dist}
rm -rf ${dist}
