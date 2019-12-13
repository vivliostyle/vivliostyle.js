#!/bin/bash
# scripts/make-viewer-zip.sh <version>
# must be run on /vivliostyle root

set -ev

dist=vivliostyle-js-$1

mkdir ${dist}
cp    ./CHANGELOG.md ${dist}/
cp -R ./packages/viewer/pages/* ${dist}/

mkdir ${dist}/viewer/
cp -R ./packages/viewer/lib/* ${dist}/viewer/
cp    ./packages/core/doc/supported-features.{md,html} ${dist}/docs/en/
cp    ./scripts/package-artifacts/start-webserver* ${dist}/

zip -qr vivliostyle-js-latest.zip ${dist}
rm -rf ${dist}
