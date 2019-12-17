#!/bin/bash
set -e

# must be run on /vivliostyle root

archiveDir=${1:-vivliostyle-latest}
archiveName=${2:-vivliostyle.zip}
echo "Generating ${archiveName} from ${archiveDir}"

mkdir ${archiveDir}
cp    ./CHANGELOG.md ${archiveDir}/

mkdir ${archiveDir}/viewer/
cp -R ./packages/viewer/lib/* ${archiveDir}/viewer/
cp -R ./scripts/package-artifacts/* ${archiveDir}/

zip -qr ${archiveName} ${archiveDir}
rm -rf ${archiveDir}
