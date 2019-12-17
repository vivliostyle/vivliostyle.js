#!/bin/bash
set -e

# must be run on /vivliostyle root

archiveDir=${1:-vivliostyle-latest}
archiveName=${2:-vivliostyle.zip}
echo "Generating ${archiveName} from ${archiveDir}"

mkdir ${archiveDir}
cp    ./CHANGELOG.md ${archiveDir}/
cp -R ./docs/user-guide/* ${archiveDir}/

mkdir ${archiveDir}/viewer/
cp -R ./packages/viewer/lib/* ${archiveDir}/viewer/
cp    ./docs/supported-features.md ${archiveDir}/docs/en/
cp    ./scripts/package-artifacts/start-webserver* ${archiveDir}/

zip -qr ${archiveName} ${archiveDir}
rm -rf ${archiveDir}
