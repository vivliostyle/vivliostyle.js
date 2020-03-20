#!/usr/bin/env node

const fs = require("fs");
const path = require("path");
const shell = require("shelljs");
const archiver = require("archiver");

const argv = process.argv.slice(2);
const archiveDir = argv[0] || `vivliostyle-latest`;
const archiveName = argv[1] || `vivliostyle-viewer.zip`;
console.log(`Generating ${archiveName} from ${archiveDir}`);

shell.mkdir(archiveDir);
shell.cp("CHANGELOG.md", archiveDir);

shell.mkdir(path.join(archiveDir, "viewer"));
shell.cp("-R", "./packages/viewer/lib/*", path.join(archiveDir, "viewer"));
shell.cp("-R", "./scripts/package-artifacts/*", archiveDir);

const output = fs.createWriteStream(archiveName);
output.on("close", function() {
  console.log(archive.pointer() + " total bytes");
  shell.rm("-rf", archiveDir);
  shell.mv(archiveName, "packages/viewer/lib");
});

const archive = archiver("zip", {
  zlib: { level: 9 },
});
archive.pipe(output);
archive.directory(archiveDir, false);
archive.finalize();
