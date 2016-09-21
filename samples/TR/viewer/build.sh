#!/bin/sh

cd vivliostyle.js
npm install
npm run build
cd ..

cd vivliostyle-ui
npm install --save ../vivliostyle.js
npm install
npm run build
cd ..

rm -rf css fonts js resources vivliostyle-viewer.html
mv vivliostyle-ui/build/* .
