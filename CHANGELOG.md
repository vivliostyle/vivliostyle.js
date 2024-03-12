# Change Log

All notable changes to this project will be documented in this file.
See [Conventional Commits](https://conventionalcommits.org) for commit guidelines.

## [2.28.1](https://github.com/vivliostyle/vivliostyle.js/compare/v2.28.0...v2.28.1) (2024-03-12)

### Bug Fixes

- Footnote causes layout problem on page breaking ([aa22bbd](https://github.com/vivliostyle/vivliostyle.js/commit/aa22bbdc321b5b1903c0d4748de7df3ab00bd790)), closes [#1298](https://github.com/vivliostyle/vivliostyle.js/issues/1298)

# [2.28.0](https://github.com/vivliostyle/vivliostyle.js/compare/v2.27.0...v2.28.0) (2024-03-03)

### Bug Fixes

- adjust TOC box width to account for scrollbar width ([47e5d5b](https://github.com/vivliostyle/vivliostyle.js/commit/47e5d5b8832f1c2b8aea8f7ae60e69cef31a94d6))
- All `<nav epub:type="…">` elements in EPUB navigation doc should be shown in TOC box ([d31010f](https://github.com/vivliostyle/vivliostyle.js/commit/d31010f28f775bd5415b78300fb68f835c7c06f8)), closes [#1270](https://github.com/vivliostyle/vivliostyle.js/issues/1270)
- blank page selector misapplied when target-counter is used ([40a760b](https://github.com/vivliostyle/vivliostyle.js/commit/40a760bb1ce90a71afc7d47481ac8cc7c4f6ff43)), closes [#1131](https://github.com/vivliostyle/vivliostyle.js/issues/1131)
- break-before specified on floats may not work ([06890fe](https://github.com/vivliostyle/vivliostyle.js/commit/06890fef89aa00fd39333d7f4d26ee794dfbac75)), closes [#1288](https://github.com/vivliostyle/vivliostyle.js/issues/1288)
- Column floats disappear ([52ede7d](https://github.com/vivliostyle/vivliostyle.js/commit/52ede7d85e270e899e8aa137686a3c3a90ba57ea)), closes [#1273](https://github.com/vivliostyle/vivliostyle.js/issues/1273)
- Float box pushed out of the page area ([7e86951](https://github.com/vivliostyle/vivliostyle.js/commit/7e869519da420a44098bd7295708937ca6e6dbe7)), closes [#1295](https://github.com/vivliostyle/vivliostyle.js/issues/1295)
- float margins collapsed wrongly ([03121f2](https://github.com/vivliostyle/vivliostyle.js/commit/03121f2275f258336031dfb56b49127c2639fa4f)), closes [#1282](https://github.com/vivliostyle/vivliostyle.js/issues/1282)
- remove old EPUB NCX handling ([56ca0ed](https://github.com/vivliostyle/vivliostyle.js/commit/56ca0edc09cace813b40ce8bee3b968fb3907758))
- set overflow property of `@-epubx-partition` to hidden by default ([c196685](https://github.com/vivliostyle/vivliostyle.js/commit/c196685b04615bf4e92a8d924e388325457fa510)), closes [/idpf.org/epub/pgt/#s3](https://github.com//idpf.org/epub/pgt//issues/s3)
- target-counter leads to pagination to wrong named page ([980632d](https://github.com/vivliostyle/vivliostyle.js/commit/980632d0fedc89a2ffb1c265c371bb576a6435c0)), closes [#1272](https://github.com/vivliostyle/vivliostyle.js/issues/1272)
- Top margin at unforced page break not truncated correctly ([97779f3](https://github.com/vivliostyle/vivliostyle.js/commit/97779f3d43149a4b31c1b189da0c60a0aec19084)), closes [#1279](https://github.com/vivliostyle/vivliostyle.js/issues/1279)
- Top margin of floats at page start should be kept ([6c1fb7f](https://github.com/vivliostyle/vivliostyle.js/commit/6c1fb7f65320dfca76cf19d867e3b2083784ac9b)), closes [#1292](https://github.com/vivliostyle/vivliostyle.js/issues/1292)
- TypeError occurs on repeating_elements/nesting test ([819e1fd](https://github.com/vivliostyle/vivliostyle.js/commit/819e1fd84ad4d1c4fde151606e09db74027bdea0))

### Features

- Add errorCallback config option to VivliostylePrint/printHTML() ([9602d61](https://github.com/vivliostyle/vivliostyle.js/commit/9602d61240060c846cf45818c26dea748b2b654c))

# [2.27.0](https://github.com/vivliostyle/vivliostyle.js/compare/v2.26.0...v2.27.0) (2024-02-09)

### Bug Fixes

- HTML documents listed in "resources" in pub-manifest should not be rendered as if in "readingOrder" ([0bbbd48](https://github.com/vivliostyle/vivliostyle.js/commit/0bbbd48337afe8d415cd70e106577b5a005dc210)), closes [#1257](https://github.com/vivliostyle/vivliostyle.js/issues/1257)
- remove ruby font-size workaround no longer necessary ([3138fda](https://github.com/vivliostyle/vivliostyle.js/commit/3138fdaefc8407f30dce3ab260fad816509d39de))
- text-spacing not working properly with text-spacing natively enabled browser ([42e16f4](https://github.com/vivliostyle/vivliostyle.js/commit/42e16f4ce65a8a2d9f518dbcd65078fecc85ddd8)), closes [#1252](https://github.com/vivliostyle/vivliostyle.js/issues/1252)
- text-spacing-trim:space-first not working properly in some case ([398b53e](https://github.com/vivliostyle/vivliostyle.js/commit/398b53eed8b7bc1f59fc14c0dab14c67e82b7f4a)), closes [#1261](https://github.com/vivliostyle/vivliostyle.js/issues/1261)
- TOC box should contain only the TOC element content ([754a70c](https://github.com/vivliostyle/vivliostyle.js/commit/754a70cb9d5da9b746d69e6129a19dd0b4cc880f)), closes [#1258](https://github.com/vivliostyle/vivliostyle.js/issues/1258)
- Units vi and vb are mishandled when writing-mode is different from the root element ([286cc1e](https://github.com/vivliostyle/vivliostyle.js/commit/286cc1e8e654b3752979fba64976ab8634856577)), closes [#1265](https://github.com/vivliostyle/vivliostyle.js/issues/1265)
- vertical-in-horizontal block height and horizontal-in-vertical block width not computed properly ([0f7d45e](https://github.com/vivliostyle/vivliostyle.js/commit/0f7d45e1a62be4c144d7b5cff9878fe0d7316ec3)), closes [#1264](https://github.com/vivliostyle/vivliostyle.js/issues/1264)
- Viewer page navigation hangs with EPUB/webpub with undetermined page-progression-direction ([a7f5572](https://github.com/vivliostyle/vivliostyle.js/commit/a7f557239a871484cef29fe7dbf1355ee14d75eb)), closes [#1260](https://github.com/vivliostyle/vivliostyle.js/issues/1260)

### Features

- Update CSS user agent default style sheet ([b0993a0](https://github.com/vivliostyle/vivliostyle.js/commit/b0993a053aff91fc8220b3b8a4079ad9f8ee3383)), closes [#1128](https://github.com/vivliostyle/vivliostyle.js/issues/1128)

# [2.26.0](https://github.com/vivliostyle/vivliostyle.js/compare/v2.25.9...v2.26.0) (2024-01-20)

### Bug Fixes

- set hanging-punctuation:none for pre-formatted text default style ([52d50c9](https://github.com/vivliostyle/vivliostyle.js/commit/52d50c95c05611c296839a7939204034b4ef8d52))
- text-spacing-trim not working properly in some cases ([99b3af3](https://github.com/vivliostyle/vivliostyle.js/commit/99b3af3d78aba1491bc87d40ef6a8343aa901af9)), closes [#1251](https://github.com/vivliostyle/vivliostyle.js/issues/1251)

### Features

- Update CSS text-spacing-trim property to support the latest spec change ([114fd6d](https://github.com/vivliostyle/vivliostyle.js/commit/114fd6ded949e029ff3802ad758df88b29efd693)), closes [#1244](https://github.com/vivliostyle/vivliostyle.js/issues/1244)

## [2.25.9](https://github.com/vivliostyle/vivliostyle.js/compare/v2.25.8...v2.25.9) (2023-12-04)

### Bug Fixes

- page breaking inside table with table-header may cause unexpected page type reset ([7865dea](https://github.com/vivliostyle/vivliostyle.js/commit/7865deae5bcd751d9d2f65e8847ae8f0eef46fcb)), closes [#1233](https://github.com/vivliostyle/vivliostyle.js/issues/1233)
- page-area content may disappear on print ([2f2f85a](https://github.com/vivliostyle/vivliostyle.js/commit/2f2f85af8c9c983468a50a9ec67a39052bb23f6a)), closes [#1240](https://github.com/vivliostyle/vivliostyle.js/issues/1240)

## [2.25.8](https://github.com/vivliostyle/vivliostyle.js/compare/v2.25.7...v2.25.8) (2023-11-06)

### Bug Fixes

- page breaking inside table may cause unexpected page type reset ([59929ea](https://github.com/vivliostyle/vivliostyle.js/commit/59929eaab71c9c560696c41ed5f09dcdd4254893)), closes [#1233](https://github.com/vivliostyle/vivliostyle.js/issues/1233)

## [2.25.7](https://github.com/vivliostyle/vivliostyle.js/compare/v2.25.6...v2.25.7) (2023-10-24)

### Bug Fixes

- Pagination result depends on viewer window width ([7980721](https://github.com/vivliostyle/vivliostyle.js/commit/79807214799d2e08a20ac057b8d83a5886a535bf)), closes [#1228](https://github.com/vivliostyle/vivliostyle.js/issues/1228)

## [2.25.6](https://github.com/vivliostyle/vivliostyle.js/compare/v2.25.5...v2.25.6) (2023-10-03)

### Bug Fixes

- **viewer:** Current page should be kept after Find results in "Not Found" ([fb28b64](https://github.com/vivliostyle/vivliostyle.js/commit/fb28b647ecd881b06052895e49b1383d288012d8))
- **viewer:** Exclude generated page margin box content from text search ([ea8a447](https://github.com/vivliostyle/vivliostyle.js/commit/ea8a447f2ce6733c61fab3f072ab3f24179f371c))
- **viewer:** Navigation with page slider should not affect browser history stack ([7b3f117](https://github.com/vivliostyle/vivliostyle.js/commit/7b3f1178d7d241395b53ba5cb8730d66dcbebdce)), closes [#1219](https://github.com/vivliostyle/vivliostyle.js/issues/1219)
- **viewer:** selection highlighting problems on iOS ([abb3ee2](https://github.com/vivliostyle/vivliostyle.js/commit/abb3ee276652886847d9a8f657e7820c6c948de7))
- **viewer:** tweak viewer UI for mobile devices ([167adee](https://github.com/vivliostyle/vivliostyle.js/commit/167adee3b2afef41776c17bcc542f17498739bab))
- **viewer:** tweak viewer UI style for mobile devices ([f6ef23b](https://github.com/vivliostyle/vivliostyle.js/commit/f6ef23b31cd45ec911d3ff9d7f680e69090650eb))

## [2.25.5](https://github.com/vivliostyle/vivliostyle.js/compare/v2.25.4...v2.25.5) (2023-08-09)

### Bug Fixes

- negative page margin values not working as expected ([3f352d2](https://github.com/vivliostyle/vivliostyle.js/commit/3f352d2007fbb0dbbf19cea7735f92880098a506)), closes [#1217](https://github.com/vivliostyle/vivliostyle.js/issues/1217)
- TOC box disappeared when resizing window ([115205f](https://github.com/vivliostyle/vivliostyle.js/commit/115205f5b936d3ed045991802f1ac19f3c767e12))

## [2.25.4](https://github.com/vivliostyle/vivliostyle.js/compare/v2.25.3...v2.25.4) (2023-07-28)

### Bug Fixes

- **viewer:** Page navigation left/right buttons disappeared in v2.25.3 ([294e085](https://github.com/vivliostyle/vivliostyle.js/commit/294e08555dfbf67b5e37ab559595f534eb746e3e)), closes [#1214](https://github.com/vivliostyle/vivliostyle.js/issues/1214)

## [2.25.3](https://github.com/vivliostyle/vivliostyle.js/compare/v2.25.2...v2.25.3) (2023-07-24)

### Bug Fixes

- EPUB font deobfuscation not working ([2bbd58b](https://github.com/vivliostyle/vivliostyle.js/commit/2bbd58b84bbfca48dcb482aaa4174c0734ed8a48))
- Failed to load when publication manifest has stylesheet URL without extension ([5e092c4](https://github.com/vivliostyle/vivliostyle.js/commit/5e092c4a531730092bc36875b4553a1436601c28)), closes [#1207](https://github.com/vivliostyle/vivliostyle.js/issues/1207)
- Numbered list counts go wrong when footnote-related pseudo-elements exist ([871bef7](https://github.com/vivliostyle/vivliostyle.js/commit/871bef7724006236488bbf2af5edfd68bbdefcf5)), closes [#1200](https://github.com/vivliostyle/vivliostyle.js/issues/1200)
- **viewer:** Unexpected scrollbar appears when loading W3C documents ([e96f6f0](https://github.com/vivliostyle/vivliostyle.js/commit/e96f6f00e549471f89caf75d5cf4ff73068b3376))
- wrong URL resolution when baseURL has no file name extension ([776791f](https://github.com/vivliostyle/vivliostyle.js/commit/776791ff509cadcd76de491157e8bed59cda364e)), closes [#1211](https://github.com/vivliostyle/vivliostyle.js/issues/1211)

## [2.25.2](https://github.com/vivliostyle/vivliostyle.js/compare/v2.25.1...v2.25.2) (2023-06-22)

### Bug Fixes

- Variable fonts not working properly ([cf19623](https://github.com/vivliostyle/vivliostyle.js/commit/cf196235201f0369901a9963afa570d90bac58b4)), closes [#1198](https://github.com/vivliostyle/vivliostyle.js/issues/1198)

## [2.25.1](https://github.com/vivliostyle/vivliostyle.js/compare/v2.25.0...v2.25.1) (2023-05-31)

### Bug Fixes

- page counter in running element not incremented properly ([7bf1b6d](https://github.com/vivliostyle/vivliostyle.js/commit/7bf1b6dbcc6033f4d65655eb7aa76c26d86de9d4)), closes [#1194](https://github.com/vivliostyle/vivliostyle.js/issues/1194)
- **viewer:** marker edit menu closes unexpectedly when editing memo ([110b8e9](https://github.com/vivliostyle/vivliostyle.js/commit/110b8e98db7dc9e401359bf3171816dcd8100b8f))
- wrong running element output with position:running() on display:none element ([c944a09](https://github.com/vivliostyle/vivliostyle.js/commit/c944a090990a0d378b519c0c099b4f5504d1f10b)), closes [#1196](https://github.com/vivliostyle/vivliostyle.js/issues/1196)

# [2.25.0](https://github.com/vivliostyle/vivliostyle.js/compare/v2.24.3...v2.25.0) (2023-05-15)

### Bug Fixes

- content(first-letter) in string-set property should respect ::before/after pseudo-elements ([2a142e3](https://github.com/vivliostyle/vivliostyle.js/commit/2a142e388d67f6f08593005d2f8c16ca209ee881)), closes [#1174](https://github.com/vivliostyle/vivliostyle.js/issues/1174)
- image size in page margin boxes ([2f08632](https://github.com/vivliostyle/vivliostyle.js/commit/2f086327f8f42053fd056339f6bd2ea3de45a560)), closes [#1177](https://github.com/vivliostyle/vivliostyle.js/issues/1177)
- some list style types are unavailable in list-style shorthand property ([52c3afd](https://github.com/vivliostyle/vivliostyle.js/commit/52c3afd5f1c22420b64949ff3d14265f0134340b)), closes [#1184](https://github.com/vivliostyle/vivliostyle.js/issues/1184)
- text-spacing:none for pre/code/kbd/samp/tt elements should be default ([a69b921](https://github.com/vivliostyle/vivliostyle.js/commit/a69b921b21c3ed2207b2be63beaa5e4cb4b51f6e))
- unnecessary forced page breaks at the beginning of page after out-of-flow elements ([a867344](https://github.com/vivliostyle/vivliostyle.js/commit/a8673443a4c70a1c714c1edbe2bbc8504b45e41c)), closes [#1176](https://github.com/vivliostyle/vivliostyle.js/issues/1176)
- **viewer:** prevent wrong text selection touching page navigation buttons ([8ba017f](https://github.com/vivliostyle/vivliostyle.js/commit/8ba017fc0a8c4aa84dde6ee2e09e9eaa41b8096e))
- Vivliostyle crashes when using CSS namespaces ([2f54e24](https://github.com/vivliostyle/vivliostyle.js/commit/2f54e24f699b27b1b98a9a06840299c27236dd7d)), closes [#1172](https://github.com/vivliostyle/vivliostyle.js/issues/1172)
- Vivliostyle crashes with "Error: Function xxx is undefined" ([619803d](https://github.com/vivliostyle/vivliostyle.js/commit/619803d5616c4191796d4b9d4d41618957624449))
- Vivliostyle crashes with "Error: Internal error" ([26284e0](https://github.com/vivliostyle/vivliostyle.js/commit/26284e0893622757aca8c4820a25ca74e77705db)), closes [#1178](https://github.com/vivliostyle/vivliostyle.js/issues/1178)
- widows and orphans properties are ignored inside multi-column box ([f61931e](https://github.com/vivliostyle/vivliostyle.js/commit/f61931e53f64dae2107f0b036d46fbee219a0d05)), closes [#1182](https://github.com/vivliostyle/vivliostyle.js/issues/1182)
- wrong layout with ::first-letter and ::after pseudo-elements ([f59e6bd](https://github.com/vivliostyle/vivliostyle.js/commit/f59e6bd08a17dc131cf56ec8e4e6ec2c7991ab7e)), closes [#1175](https://github.com/vivliostyle/vivliostyle.js/issues/1175)

### Features

- Add support for CSS running elements ([68adafe](https://github.com/vivliostyle/vivliostyle.js/commit/68adafe9bb26c708b6585979cb65b7810836fdff)), closes [#424](https://github.com/vivliostyle/vivliostyle.js/issues/424)

## [2.24.3](https://github.com/vivliostyle/vivliostyle.js/compare/v2.24.2...v2.24.3) (2023-04-20)

### Bug Fixes

- **viewer:** marker text selection problem ([11a6584](https://github.com/vivliostyle/vivliostyle.js/commit/11a6584f668f07a0210f5e9551f76090243167a9))
- z-index on page context problem (Regression in v2.23.1) ([9dc8344](https://github.com/vivliostyle/vivliostyle.js/commit/9dc8344e1098f6f7863f83a8ac88100e4a9dbcd1)), closes [#1166](https://github.com/vivliostyle/vivliostyle.js/issues/1166)

## [2.24.2](https://github.com/vivliostyle/vivliostyle.js/compare/v2.24.1...v2.24.2) (2023-04-11)

### Bug Fixes

- prevent "TypeError: can't access property" ([3d9850d](https://github.com/vivliostyle/vivliostyle.js/commit/3d9850df9e6cc88de55dd290194ddc673f75b97e)), closes [#1160](https://github.com/vivliostyle/vivliostyle.js/issues/1160)
- unnecessary scrollbars when zoom is fit-to-screen ([bb504a6](https://github.com/vivliostyle/vivliostyle.js/commit/bb504a6babd1e7d1b57a83fca333ac1ee44a9e62)), closes [#1158](https://github.com/vivliostyle/vivliostyle.js/issues/1158)
- **viewer:** marker annotation user interface problem on touch devices ([17c770d](https://github.com/vivliostyle/vivliostyle.js/commit/17c770d9cd1c5fdb455a2525b850b5ba34bfb73b))
- **viewer:** viewport height problem on smartphones ([f3649c7](https://github.com/vivliostyle/vivliostyle.js/commit/f3649c7ac00ac005b82e8d96208090769fbf457d))
- wrong hyphen appears at page break with line-break:anywhere ([a5e1356](https://github.com/vivliostyle/vivliostyle.js/commit/a5e1356c6c8c84371b4d3cf6ae43262d5817fd09)), closes [#1162](https://github.com/vivliostyle/vivliostyle.js/issues/1162)

## [2.24.1](https://github.com/vivliostyle/vivliostyle.js/compare/v2.24.0...v2.24.1) (2023-04-01)

### Bug Fixes

- wrong message "[object Object]" instead of delete confirmation ([451f737](https://github.com/vivliostyle/vivliostyle.js/commit/451f737488d278c7b475311de8c5670022ec557c))

# [2.24.0](https://github.com/vivliostyle/vivliostyle.js/compare/v2.23.2...v2.24.0) (2023-04-01)

### Bug Fixes

- Browser "Back" button should work with internal link or TOC navigation ([5b6795c](https://github.com/vivliostyle/vivliostyle.js/commit/5b6795c4c1e9d1058ece10b774cbb919f9f22756))
- Rendering error with SVG images in EPUB (Regression in v2.23.0) ([bff1c63](https://github.com/vivliostyle/vivliostyle.js/commit/bff1c63d6d2623fd5a214742384bfeba1059fdeb)), closes [#1139](https://github.com/vivliostyle/vivliostyle.js/issues/1139) [#1135](https://github.com/vivliostyle/vivliostyle.js/issues/1135)

### Features

- **viewer:** Add Restore View setting ([550c019](https://github.com/vivliostyle/vivliostyle.js/commit/550c01979786f7f8f9306608cc2e333d72068242))
- **viewer:** Add UI Language in settings panel ([7e4ee0c](https://github.com/vivliostyle/vivliostyle.js/commit/7e4ee0caae4c8c9b4c3749c6d8252b063fe305df))
- **viewer:** Marker annotation ([7202a57](https://github.com/vivliostyle/vivliostyle.js/commit/7202a570cb766372dd21af8f5d9fccc9e1361db3))
- **viewer:** Multilingual user interface (en/ja) ([aa2f27b](https://github.com/vivliostyle/vivliostyle.js/commit/aa2f27bf561267e3eca47da3edb8df9f6139526e))

## [2.23.2](https://github.com/vivliostyle/vivliostyle.js/compare/v2.23.1...v2.23.2) (2023-03-25)

### Bug Fixes

- Page content is not painted in the bleed area (Regression in v2.23.1) ([05c4828](https://github.com/vivliostyle/vivliostyle.js/commit/05c4828c24f02d63bb27bf47c669e75a6d8e1739)), closes [#1145](https://github.com/vivliostyle/vivliostyle.js/issues/1145) [#644](https://github.com/vivliostyle/vivliostyle.js/issues/644)

## [2.23.1](https://github.com/vivliostyle/vivliostyle.js/compare/v2.23.0...v2.23.1) (2023-03-24)

### Bug Fixes

- Leader layout problem dependent on font and language ([bf351a9](https://github.com/vivliostyle/vivliostyle.js/commit/bf351a904465ba0bc54c6e56e402885a4261995a)), closes [#1117](https://github.com/vivliostyle/vivliostyle.js/issues/1117)
- Page background image is not painted in the bleed area ([fb14e6c](https://github.com/vivliostyle/vivliostyle.js/commit/fb14e6cd0273cf1db1dde4054273752b70421403)), closes [#644](https://github.com/vivliostyle/vivliostyle.js/issues/644)

# [2.23.0](https://github.com/vivliostyle/vivliostyle.js/compare/v2.22.4...v2.23.0) (2023-03-13)

### Bug Fixes

- CSS rem unit not evaluated correctly in min/max/clamp functions ([0694528](https://github.com/vivliostyle/vivliostyle.js/commit/0694528637f468e3291b3ee0130ec122790ec7f3)), closes [#1137](https://github.com/vivliostyle/vivliostyle.js/issues/1137)
- SVG rendering error with `<use xlink:href=… />` ([e36aba9](https://github.com/vivliostyle/vivliostyle.js/commit/e36aba9c695457636c8b2c1e21409807babcdd57)), closes [#1135](https://github.com/vivliostyle/vivliostyle.js/issues/1135)
- tweak TOC detection for VFM v2 change ([4304f27](https://github.com/vivliostyle/vivliostyle.js/commit/4304f27b112e2d392a522f82219224eb0b1b1c77))
- Using a CSS target-counter breaks named-pages styling ([f88013e](https://github.com/vivliostyle/vivliostyle.js/commit/f88013eb72b1357386002b905c2e617141342500)), closes [#1136](https://github.com/vivliostyle/vivliostyle.js/issues/1136)
- **viewer:** [Regression v2.22.4] Viewer TOC item indent too large ([8f8067e](https://github.com/vivliostyle/vivliostyle.js/commit/8f8067e514f8d98561f0126af2e68e98d1a329f2)), closes [#1133](https://github.com/vivliostyle/vivliostyle.js/issues/1133)

### Features

- Add support for new syntax of CSS text-spacing properties ([da819c5](https://github.com/vivliostyle/vivliostyle.js/commit/da819c5db1ea62fa845f2693578aad2629146245)), closes [#1118](https://github.com/vivliostyle/vivliostyle.js/issues/1118)

## [2.22.4](https://github.com/vivliostyle/vivliostyle.js/compare/v2.22.3...v2.22.4) (2023-02-22)

### Bug Fixes

- HTML `<link rel="stylesheet">` tag without `href` causes TypeError ([c8a18c0](https://github.com/vivliostyle/vivliostyle.js/commit/c8a18c0442bb561e15ec46fc527c2d6c7abca257)), closes [#1120](https://github.com/vivliostyle/vivliostyle.js/issues/1120)
- improve margin-break handling ([5327f69](https://github.com/vivliostyle/vivliostyle.js/commit/5327f6931beee85a1009ef526165f15788c80eb1)), closes [#611](https://github.com/vivliostyle/vivliostyle.js/issues/611) [#1124](https://github.com/vivliostyle/vivliostyle.js/issues/1124)
- margin-break:discard not working properly ([660eefd](https://github.com/vivliostyle/vivliostyle.js/commit/660eefd2cef5afd18edb03f1bf63bf4dcb044150)), closes [#1123](https://github.com/vivliostyle/vivliostyle.js/issues/1123)
- no break opportunity at empty block box ([a2b4537](https://github.com/vivliostyle/vivliostyle.js/commit/a2b4537f7fa03c8dab0e2870f0f65b79c9d231e6)), closes [#749](https://github.com/vivliostyle/vivliostyle.js/issues/749)
- no break opportunity between anonymous block box and block-level box ([73df5bc](https://github.com/vivliostyle/vivliostyle.js/commit/73df5bcbbc9e50e57e50c36efa624f83c99f5dd4)), closes [#611](https://github.com/vivliostyle/vivliostyle.js/issues/611)
- wrong cascading with CSS logical properties ([2f7fd7b](https://github.com/vivliostyle/vivliostyle.js/commit/2f7fd7b355138b7568a98d1a27a2a4b0da3b7682)), closes [#1126](https://github.com/vivliostyle/vivliostyle.js/issues/1126)
- wrong page break inside table in vertical writing mode ([2dae5fc](https://github.com/vivliostyle/vivliostyle.js/commit/2dae5fc3934f4638cc0e7b1fe4a6ebcf7cdaf062)), closes [#1129](https://github.com/vivliostyle/vivliostyle.js/issues/1129)

## [2.22.3](https://github.com/vivliostyle/vivliostyle.js/compare/v2.22.2...v2.22.3) (2023-01-29)

### Bug Fixes

- Inline margins on leader not working properly ([abb74e6](https://github.com/vivliostyle/vivliostyle.js/commit/abb74e6b398ec538ac70e1ec0a638d78ec2fd9c3)), closes [#1114](https://github.com/vivliostyle/vivliostyle.js/issues/1114)
- Leader layout problem on Safari ([afac702](https://github.com/vivliostyle/vivliostyle.js/commit/afac702f8e17fbc59d58a9dc38c34bdb1f23c0f1)), closes [#1112](https://github.com/vivliostyle/vivliostyle.js/issues/1112)
- PDF internal links not working properly ([50d4891](https://github.com/vivliostyle/vivliostyle.js/commit/50d489116661c7eef018b6f9bd74690377699bec)), closes [#1110](https://github.com/vivliostyle/vivliostyle.js/issues/1110)

## [2.22.2](https://github.com/vivliostyle/vivliostyle.js/compare/v2.22.1...v2.22.2) (2023-01-26)

### Bug Fixes

- Leader disappears in very large page ([a75a2e4](https://github.com/vivliostyle/vivliostyle.js/commit/a75a2e43e96d1192fac87e96dc341d24fa468f78)), closes [#1109](https://github.com/vivliostyle/vivliostyle.js/issues/1109)
- Leader layout problem with text-indent ([c9e6d07](https://github.com/vivliostyle/vivliostyle.js/commit/c9e6d0714005100b7074c34eeb129cc030253d9f)), closes [#1107](https://github.com/vivliostyle/vivliostyle.js/issues/1107)

## [2.22.1](https://github.com/vivliostyle/vivliostyle.js/compare/v2.22.0...v2.22.1) (2023-01-26)

### Bug Fixes

- Leader layout broken with text-spacing processing ([78a2e92](https://github.com/vivliostyle/vivliostyle.js/commit/78a2e92f28ae5b2043a95ffc36056756a1e50b86)), closes [#1105](https://github.com/vivliostyle/vivliostyle.js/issues/1105)
- **react:** default to BookMode=true and revert to before modification of json determination as it changes the behavior ([d4429d8](https://github.com/vivliostyle/vivliostyle.js/commit/d4429d8ab82ecfebd2c6d7b0a927e867c5f1307f))
- **react:** Enable EPUB and Web publishing only when bookMode=true ([3e17f7e](https://github.com/vivliostyle/vivliostyle.js/commit/3e17f7e4e223b44f80713c2b4d87c27a845941a9))
- **react:** Modify the conditional expression to determine if it is EPUB ([00ea102](https://github.com/vivliostyle/vivliostyle.js/commit/00ea1023dea651778f2aee4b65088ada6172c05a))

# [2.22.0](https://github.com/vivliostyle/vivliostyle.js/compare/v2.21.1...v2.22.0) (2023-01-25)

### Bug Fixes

- layout problem when devicePixelRatio is changed during rendering ([58c6202](https://github.com/vivliostyle/vivliostyle.js/commit/58c6202d9cdda4c4f50f5be9a45ef57247df85a2)), closes [#1079](https://github.com/vivliostyle/vivliostyle.js/issues/1079)
- **react:** Fix code that causes null error ([e05998f](https://github.com/vivliostyle/vivliostyle.js/commit/e05998f9d8c56ca3863994573ba328c301a10000))
- very thin border on printing with Microsoft Edge ([0137d0e](https://github.com/vivliostyle/vivliostyle.js/commit/0137d0e9edfeae08ec27ee47f7cc82612f7da6e5)), closes [#1079](https://github.com/vivliostyle/vivliostyle.js/issues/1079) [#1085](https://github.com/vivliostyle/vivliostyle.js/issues/1085)

### Features

- **react:** Modify type definition errors as a result of updating react ([9fb71ba](https://github.com/vivliostyle/vivliostyle.js/commit/9fb71ba449b77a9125651bd2cc6bda42fa2ba89b))
- Support CSS leader() function ([1fdbb15](https://github.com/vivliostyle/vivliostyle.js/commit/1fdbb15921e087947b6ee9eb80a75b14dd6b52b5)), closes [#1027](https://github.com/vivliostyle/vivliostyle.js/issues/1027)

## [2.21.1](https://github.com/vivliostyle/vivliostyle.js/compare/v2.21.0...v2.21.1) (2023-01-06)

### Bug Fixes

- pixel ratio emulation for thin border width not worked with HeadlessChrome ([530d31e](https://github.com/vivliostyle/vivliostyle.js/commit/530d31e034cfdbd162610a75645bb70e40fa05c5)), closes [#1085](https://github.com/vivliostyle/vivliostyle.js/issues/1085)

# [2.21.0](https://github.com/vivliostyle/vivliostyle.js/compare/v2.20.0...v2.21.0) (2023-01-06)

### Bug Fixes

- `float-min-wrap-block: 0` causes "TypeError: Cannot read properties of undefined" ([02c1bc8](https://github.com/vivliostyle/vivliostyle.js/commit/02c1bc85d9aafd3443ca7397093f4ecf4ca3e8d4)), closes [#1072](https://github.com/vivliostyle/vivliostyle.js/issues/1072)
- break-before:column on single column causes printed page content disappear ([4eb82ed](https://github.com/vivliostyle/vivliostyle.js/commit/4eb82edbd6be9f18aaee24ab95f270a35f7becd3)), closes [#1067](https://github.com/vivliostyle/vivliostyle.js/issues/1067)
- display and overflow property value definition ([bb34af2](https://github.com/vivliostyle/vivliostyle.js/commit/bb34af2fd302c917d92acc1e785c153bbd5fb08c))
- Page break position changes depending on display device pixel ratio ([23792ce](https://github.com/vivliostyle/vivliostyle.js/commit/23792cea4337510fe852852a3ade05a601d5f0bd)), closes [#1076](https://github.com/vivliostyle/vivliostyle.js/issues/1076)
- remove workaround for old Chrome printing problem ([fbad411](https://github.com/vivliostyle/vivliostyle.js/commit/fbad41154c70cd47a6d2d19275f9db005d8401f9)), closes [#600](https://github.com/vivliostyle/vivliostyle.js/issues/600)
- Top page float should not absorb margin/border/padding of the block below ([9999edd](https://github.com/vivliostyle/vivliostyle.js/commit/9999eddc96858995e11395a8b8446d9b438982b0)), closes [#1071](https://github.com/vivliostyle/vivliostyle.js/issues/1071)
- wrong white-space processing on non-ASCII spaces such as U+3000 IDEOGRAPHIC SPACE ([7fb7bc0](https://github.com/vivliostyle/vivliostyle.js/commit/7fb7bc0ae1c155f0a3537e0db51ee565b12ace0e)), closes [#1082](https://github.com/vivliostyle/vivliostyle.js/issues/1082)

### Features

- Enable very thin border width on PDF output ([0eadefe](https://github.com/vivliostyle/vivliostyle.js/commit/0eadefef1b9273248e8d162d2c51c875947cb00f)), closes [#419](https://github.com/vivliostyle/vivliostyle.js/issues/419) [#1076](https://github.com/vivliostyle/vivliostyle.js/issues/1076)
- Improve page auto spread view mode ([68119e3](https://github.com/vivliostyle/vivliostyle.js/commit/68119e33ed5fa67b22537934a27a155e4d4833cf))
- Update CSS text-spacing property spec to align to the latest draft ([395b923](https://github.com/vivliostyle/vivliostyle.js/commit/395b92311a9c3ae24c7dfc23ec6614b9eac2f460)), closes [#1080](https://github.com/vivliostyle/vivliostyle.js/issues/1080)

# [2.20.0](https://github.com/vivliostyle/vivliostyle.js/compare/v2.19.2...v2.20.0) (2022-12-16)

### Bug Fixes

- hanging-punctuation makes text selection difficult for paragraph-last punctuation ([00177d3](https://github.com/vivliostyle/vivliostyle.js/commit/00177d36163d2c5efeba75966684b9352213cbd3)), closes [#1062](https://github.com/vivliostyle/vivliostyle.js/issues/1062)
- Question: react renderer size ([9d1fe83](https://github.com/vivliostyle/vivliostyle.js/commit/9d1fe83ed4ad1b17834b17eeb11d070664e33723)), closes [#709](https://github.com/vivliostyle/vivliostyle.js/issues/709)
- Some text-\* properties are not applied to page margin box content ([c3082f6](https://github.com/vivliostyle/vivliostyle.js/commit/c3082f627e28d38fbd92a66978e6ee198103a62a)), closes [#1059](https://github.com/vivliostyle/vivliostyle.js/issues/1059)
- Text-decoration-line should not be skipped at ideograph-alpha/numeric text spacing ([e8382ed](https://github.com/vivliostyle/vivliostyle.js/commit/e8382ed81c8d0c5a98e630e0ec63d849180875e8)), closes [#1061](https://github.com/vivliostyle/vivliostyle.js/issues/1061)
- Wrong cascading with shorthand property text-decoration and its longhand ([7674360](https://github.com/vivliostyle/vivliostyle.js/commit/76743607dd8e737d7b629dd2794fb3d7486bc348)), closes [#1054](https://github.com/vivliostyle/vivliostyle.js/issues/1054)

### Features

- Add support for CSS lh and rlh units ([554d300](https://github.com/vivliostyle/vivliostyle.js/commit/554d300b34af107b68e465e0a14ad9947f06a35a)), closes [#1035](https://github.com/vivliostyle/vivliostyle.js/issues/1035)
- Add support for CSS margin-break property ([a3086dc](https://github.com/vivliostyle/vivliostyle.js/commit/a3086dce807f1eeff00341826a070b191fd7a980)), closes [#734](https://github.com/vivliostyle/vivliostyle.js/issues/734)
- Support (-webkit-)text-stroke properties ([73e0560](https://github.com/vivliostyle/vivliostyle.js/commit/73e0560868b34b3ff5cfffae562439c76cb54102)), closes [#1055](https://github.com/vivliostyle/vivliostyle.js/issues/1055)

## [2.19.2](https://github.com/vivliostyle/vivliostyle.js/compare/v2.19.1...v2.19.2) (2022-11-17)

### Bug Fixes

- `@supports selector(…)` did not work ([49c48a4](https://github.com/vivliostyle/vivliostyle.js/commit/49c48a4c64b4a29fa4c31ec23bd0180f73709b09))
- improve box edge treatment at page break and box-decoration-break support ([d5ea1a9](https://github.com/vivliostyle/vivliostyle.js/commit/d5ea1a994a6d3467a6dd384dcc9d755b16e5f804)), closes [#603](https://github.com/vivliostyle/vivliostyle.js/issues/603) [#1030](https://github.com/vivliostyle/vivliostyle.js/issues/1030) [#1038](https://github.com/vivliostyle/vivliostyle.js/issues/1038)
- wrong first line treatment on text-spacing:space-first and hanging-punctuation:first ([0ccdca2](https://github.com/vivliostyle/vivliostyle.js/commit/0ccdca250bcbaafb86b3e727de5fe7fb02b92205)), closes [#1041](https://github.com/vivliostyle/vivliostyle.js/issues/1041)
- wrong page break prohibition between text and block box ([68b3754](https://github.com/vivliostyle/vivliostyle.js/commit/68b3754b0718b2514bef53d20ffbdd42249e3d17)), closes [#1036](https://github.com/vivliostyle/vivliostyle.js/issues/1036)

## [2.19.1](https://github.com/vivliostyle/vivliostyle.js/compare/v2.19.0...v2.19.1) (2022-10-21)

### Bug Fixes

- Error with undefined CSS variables in calc expression in shorthand property ([db948cb](https://github.com/vivliostyle/vivliostyle.js/commit/db948cb49a8467b0bd66411b0704402261fa8520)), closes [#1028](https://github.com/vivliostyle/vivliostyle.js/issues/1028)

# [2.19.0](https://github.com/vivliostyle/vivliostyle.js/compare/v2.18.4...v2.19.0) (2022-10-18)

### Bug Fixes

- Selector `E ::pseudo` is misinterpreted as `E::pseudo` ([e79e5ce](https://github.com/vivliostyle/vivliostyle.js/commit/e79e5ce7292585251fef2043f8690c68d64b7bae)), closes [#1026](https://github.com/vivliostyle/vivliostyle.js/issues/1026)

### Features

- Add support for :has() pseudo-class in Selectors Level 4 ([8ed553f](https://github.com/vivliostyle/vivliostyle.js/commit/8ed553f51e410f7a13465dfdeeadf9d4a6e0239e)), closes [#828](https://github.com/vivliostyle/vivliostyle.js/issues/828)
- Add support for :is()/:not()/:where() pseudo-classes in Selectors Level 4 ([68baee0](https://github.com/vivliostyle/vivliostyle.js/commit/68baee017e73e54f0823c39095a0dfeeb3de9e7f)), closes [#957](https://github.com/vivliostyle/vivliostyle.js/issues/957)

## [2.18.4](https://github.com/vivliostyle/vivliostyle.js/compare/v2.18.3...v2.18.4) (2022-10-12)

### Bug Fixes

- CSS parser error with calc expression including parens and variables ([88c4ae0](https://github.com/vivliostyle/vivliostyle.js/commit/88c4ae00039dab743945c141fcb5c167580ddf2a)), closes [#1014](https://github.com/vivliostyle/vivliostyle.js/issues/1014)
- CSS parser error with property:calc(…) misinterpreted as selector with pseudo class ([71c39bf](https://github.com/vivliostyle/vivliostyle.js/commit/71c39bf665d6a2b668f175f8d3623184275ec23a)), closes [#1020](https://github.com/vivliostyle/vivliostyle.js/issues/1020)
- percentage units in color value changed, resulting in invalid colors ([a45e861](https://github.com/vivliostyle/vivliostyle.js/commit/a45e861903946e3f2499f23d6ef4fe852fae30d5)), closes [#1012](https://github.com/vivliostyle/vivliostyle.js/issues/1012)
- RTL direction not behaving in multi column ([d6280f1](https://github.com/vivliostyle/vivliostyle.js/commit/d6280f184e9217f05c98b937ae14b1efc2808192)), closes [#1016](https://github.com/vivliostyle/vivliostyle.js/issues/1016)
- TypeError occurs with ::nth-fragment() and ::after-if-continues() selectors ([7a7c1aa](https://github.com/vivliostyle/vivliostyle.js/commit/7a7c1aa983a5142c05080a080e5e1c08cbc6bb0b)), closes [#1023](https://github.com/vivliostyle/vivliostyle.js/issues/1023)
- wrong CSS variable scoping ([37e800a](https://github.com/vivliostyle/vivliostyle.js/commit/37e800a7074f3c907214b11630d9728fd652c4df)), closes [#1015](https://github.com/vivliostyle/vivliostyle.js/issues/1015)

## [2.18.3](https://github.com/vivliostyle/vivliostyle.js/compare/v2.18.2...v2.18.3) (2022-09-30)

### Bug Fixes

- [Regression] wrong text-spacing with fullwidth opening brackets near end of line ([667b219](https://github.com/vivliostyle/vivliostyle.js/commit/667b2199c59e97aa3962420d0bbab0638cc71695)), closes [#1010](https://github.com/vivliostyle/vivliostyle.js/issues/1010)

## [2.18.2](https://github.com/vivliostyle/vivliostyle.js/compare/v2.18.1...v2.18.2) (2022-09-30)

### Bug Fixes

- **viewer:** Apply and Cancel buttons in Settings menu should not be scrolled out ([2df1b74](https://github.com/vivliostyle/vivliostyle.js/commit/2df1b7449dd78ae30c0d3a45a1b90035dcda67c7))
- **viewer:** disable shortcut keys when an input box exists in document and that is activated ([0eedcc0](https://github.com/vivliostyle/vivliostyle.js/commit/0eedcc0510ca862753b0aa6f6474d06a5d4ce8e4))
- wrong text-spacing when non-fullwidth closing and fullwidth opening brackets are adjacent ([331322b](https://github.com/vivliostyle/vivliostyle.js/commit/331322b63b8105e3e73eb53f5d2028b1a2e3efbe)), closes [#1003](https://github.com/vivliostyle/vivliostyle.js/issues/1003)
- wrong text-spacing with fullwidth punctuations in some edge cases ([6a79482](https://github.com/vivliostyle/vivliostyle.js/commit/6a794827e3f84b16659bb209d9ada7fe195b4582)), closes [#1005](https://github.com/vivliostyle/vivliostyle.js/issues/1005) [#1006](https://github.com/vivliostyle/vivliostyle.js/issues/1006)
- wrong text-spacing:space-first and hanging-punctuation:first at page break inside paragraph ([ddd6d6c](https://github.com/vivliostyle/vivliostyle.js/commit/ddd6d6c93afca7662023110d92acbb716dfa94fd)), closes [#1008](https://github.com/vivliostyle/vivliostyle.js/issues/1008)

## [2.18.1](https://github.com/vivliostyle/vivliostyle.js/compare/v2.18.0...v2.18.1) (2022-09-18)

### Bug Fixes

- DOMException error caused by wrong `instanceof Element` usage ([d959b95](https://github.com/vivliostyle/vivliostyle.js/commit/d959b9558dae6b9759fd7d7e654b4f38b600f2d7)), closes [#1000](https://github.com/vivliostyle/vivliostyle.js/issues/1000)
- **viewer:** crop marks values (e.g., crop cross) should be able to be specified ([233ce43](https://github.com/vivliostyle/vivliostyle.js/commit/233ce430408faeb8a0152fac609fe64243c03433))

# [2.18.0](https://github.com/vivliostyle/vivliostyle.js/compare/v2.17.2...v2.18.0) (2022-09-17)

### Bug Fixes

- error with `<object>` tag ([9e9565f](https://github.com/vivliostyle/vivliostyle.js/commit/9e9565f49288e58adcede797029c87cbc0f1236f)), closes [#995](https://github.com/vivliostyle/vivliostyle.js/issues/995)
- errors on the Acid2 Browser Test ([849a604](https://github.com/vivliostyle/vivliostyle.js/commit/849a6048572f400deacfee09070247b3d8436eac))
- failed some of the css-variables tests ([5d0f324](https://github.com/vivliostyle/vivliostyle.js/commit/5d0f3246e1c9b91af6f67427a268409848e20ed9))
- incorrect column-rule positioning in vertical writing mode ([3cc0e01](https://github.com/vivliostyle/vivliostyle.js/commit/3cc0e010eb0c41f9ffb7f3c4d34d214b573d5860)), closes [#978](https://github.com/vivliostyle/vivliostyle.js/issues/978)
- unnecessary page break caused by ruby elements ([21eb17c](https://github.com/vivliostyle/vivliostyle.js/commit/21eb17c4b1ef5c72f6695c2166c70a76aeb60373)), closes [#987](https://github.com/vivliostyle/vivliostyle.js/issues/987)
- valid CSS rules ignored after parsing error with invalid or unsupported CSS rule ([5e76ed5](https://github.com/vivliostyle/vivliostyle.js/commit/5e76ed5d49c2f4b4c06c69619df27e83429c6a54)), closes [#597](https://github.com/vivliostyle/vivliostyle.js/issues/597) [#976](https://github.com/vivliostyle/vivliostyle.js/issues/976)
- **viewer:** problem on author/user stylesheet switch ("Set as user stylesheet" checkbox) ([2799a34](https://github.com/vivliostyle/vivliostyle.js/commit/2799a343a0363ac4a2b4a139738e86968c08f4b6))
- **viewer:** tweak Reset Custom Style checkbox behavior ([9c96ccb](https://github.com/vivliostyle/vivliostyle.js/commit/9c96ccb8031f79f1a87e8c639e6dc86212bcd394))
- **viewer:** unbound this error "Cannot set properties of undefined" ([2505458](https://github.com/vivliostyle/vivliostyle.js/commit/2505458462692905de63f9b23afda4eb54bfc9c6))
- wrong cascading on shorthand property with CSS variable ([2ee7927](https://github.com/vivliostyle/vivliostyle.js/commit/2ee792705c7598be7660ac590872329f2fcde17d)), closes [#979](https://github.com/vivliostyle/vivliostyle.js/issues/979)
- wrong cascading with CSS !important ([fb1dae2](https://github.com/vivliostyle/vivliostyle.js/commit/fb1dae26981827ae099e27967625c9d2abb59da3)), closes [#986](https://github.com/vivliostyle/vivliostyle.js/issues/986)
- wrong text justification at last line of page caused by consecutive ruby elements ([ad26952](https://github.com/vivliostyle/vivliostyle.js/commit/ad2695206e796617f2712e5bfe4b92057fbaae27)), closes [#985](https://github.com/vivliostyle/vivliostyle.js/issues/985)

### Features

- **viewer:** add crop marks setting ([1d0834b](https://github.com/vivliostyle/vivliostyle.js/commit/1d0834b778f41fcb65553d043d3de30a424a0aea)), closes [#993](https://github.com/vivliostyle/vivliostyle.js/issues/993)
- **viewer:** change "User Style" to "Custom Style" and treat it as an author stylesheet by default ([bdb26d4](https://github.com/vivliostyle/vivliostyle.js/commit/bdb26d474f803eb44c9f09e2489dcda668231396)), closes [#991](https://github.com/vivliostyle/vivliostyle.js/issues/991)
- **viewer:** set bookMode=true as default ([5411264](https://github.com/vivliostyle/vivliostyle.js/commit/5411264648341144997f1d60a44f218a13625b42)), closes [#992](https://github.com/vivliostyle/vivliostyle.js/issues/992)

## [2.17.2](https://github.com/vivliostyle/vivliostyle.js/compare/v2.17.1...v2.17.2) (2022-08-14)

### Bug Fixes

- Incorrect behavior of ::first-letter and ::first-line selectors ([adca8ef](https://github.com/vivliostyle/vivliostyle.js/commit/adca8efaecb2f05ba055054dfad107253678f256)), closes [#566](https://github.com/vivliostyle/vivliostyle.js/issues/566) [#586](https://github.com/vivliostyle/vivliostyle.js/issues/586)

## [2.17.1](https://github.com/vivliostyle/vivliostyle.js/compare/v2.17.0...v2.17.1) (2022-08-09)

### Bug Fixes

- float with clear not properly positioned ([54a00b8](https://github.com/vivliostyle/vivliostyle.js/commit/54a00b8be08106fc3d463be058eaaac6d58b810c)), closes [#969](https://github.com/vivliostyle/vivliostyle.js/issues/969)
- Relative length units such as em and vw used in CSS calc() not working correctly ([5bd7ce3](https://github.com/vivliostyle/vivliostyle.js/commit/5bd7ce3d02d5e9ef9e9a0601071ebeacc9da8b2b)), closes [#968](https://github.com/vivliostyle/vivliostyle.js/issues/968)
- unnecessary warning "Property not supported by the browser: ua-list-item-count" ([f9419a3](https://github.com/vivliostyle/vivliostyle.js/commit/f9419a3b2930a507bb9dc788cc3102e3fbb881c1))

# [2.17.0](https://github.com/vivliostyle/vivliostyle.js/compare/v2.16.0...v2.17.0) (2022-07-29)

### Features

- Support CSS custom properties (variables) ([cd07654](https://github.com/vivliostyle/vivliostyle.js/commit/cd076546beaf28f9547f777a109ca10074929c8a)), closes [#540](https://github.com/vivliostyle/vivliostyle.js/issues/540)

# [2.16.0](https://github.com/vivliostyle/vivliostyle.js/compare/v2.15.8...v2.16.0) (2022-07-19)

### Bug Fixes

- Content overflow caused by line breaks in table cells that are not present in preview and appear in print ([b1d7346](https://github.com/vivliostyle/vivliostyle.js/commit/b1d73461dceefd311c7050f375456a5b3db27c2e)), closes [#958](https://github.com/vivliostyle/vivliostyle.js/issues/958)
- CSS explicit defaulting (e.g. `all: unset`, `break-inside: inherit`) may not work as expected ([745cbc2](https://github.com/vivliostyle/vivliostyle.js/commit/745cbc2af052c8c323b0bf3d27a42a598d998d7f)), closes [#956](https://github.com/vivliostyle/vivliostyle.js/issues/956)
- font-size with rem on root element causes wrong 1em size ([3bcb351](https://github.com/vivliostyle/vivliostyle.js/commit/3bcb3518d5f2e11ba1d5a1b466c2fe2cfe1ebb7e)), closes [#608](https://github.com/vivliostyle/vivliostyle.js/issues/608)
- Footnote may disappear on Adaptive Layout ([ae45017](https://github.com/vivliostyle/vivliostyle.js/commit/ae4501796829891b665be7f8273e0a63e9d41d2a)), closes [#962](https://github.com/vivliostyle/vivliostyle.js/issues/962)

### Features

- Add support for CSS 'inset' shorthand property ([2d2b8de](https://github.com/vivliostyle/vivliostyle.js/commit/2d2b8dee7952b15e43bccbd6ba037b151ad405d4))
- Add support for CSS property value keywords 'initial', 'unset' and 'revert' ([9f33464](https://github.com/vivliostyle/vivliostyle.js/commit/9f33464ac425e58834dafe476b9f862f4a5dd027))
- Add support for CSS shorthand property 'all' ([1f809cd](https://github.com/vivliostyle/vivliostyle.js/commit/1f809cd441b162fee75d0ffb1e427cef1e062f57))
- Improve CSS validator to support new property values supported in browser ([1d5f493](https://github.com/vivliostyle/vivliostyle.js/commit/1d5f4936ac1195206c182b588c0d9e64d97819ca)), closes [#940](https://github.com/vivliostyle/vivliostyle.js/issues/940)

## [2.15.8](https://github.com/vivliostyle/vivliostyle.js/compare/v2.15.7...v2.15.8) (2022-07-08)

### Bug Fixes

- Bleed not working when bleed is specified but marks and crop-offset are unspecified ([7af167a](https://github.com/vivliostyle/vivliostyle.js/commit/7af167acb684f64323738767fc4340db9307e301)), closes [#948](https://github.com/vivliostyle/vivliostyle.js/issues/948)
- Bottom border at page bottom edge disappeared on printing via Vivliostyle CLI v5.2.3 ([e1b17ce](https://github.com/vivliostyle/vivliostyle.js/commit/e1b17ce5735da083cf9255f5d85d6768492d39a2)), closes [#947](https://github.com/vivliostyle/vivliostyle.js/issues/947)
- Error: Negative or zero page area size ([52292dd](https://github.com/vivliostyle/vivliostyle.js/commit/52292dd2cbf506cbca5c79d30b6da2904d87928c)), closes [#951](https://github.com/vivliostyle/vivliostyle.js/issues/951)

## [2.15.7](https://github.com/vivliostyle/vivliostyle.js/compare/v2.15.6...v2.15.7) (2022-07-04)

### Bug Fixes

- float:left/right positioning broken on printing via Vivliostyle CLI v5.2.1 ([b7cca0d](https://github.com/vivliostyle/vivliostyle.js/commit/b7cca0d65f8b9673de46723e30f0d79738bc7a3e)), closes [#945](https://github.com/vivliostyle/vivliostyle.js/issues/945)

## [2.15.6](https://github.com/vivliostyle/vivliostyle.js/compare/v2.15.5...v2.15.6) (2022-07-03)

### Bug Fixes

- Error handling of negative or zero page area size that causes endless page generation loop ([5532449](https://github.com/vivliostyle/vivliostyle.js/commit/55324495ba233aec3be289b88af31aa7cdd0a6b6)), closes [#941](https://github.com/vivliostyle/vivliostyle.js/issues/941)
- Remove workaround for Chromium legacy layout engine ([0dc02f6](https://github.com/vivliostyle/vivliostyle.js/commit/0dc02f633e42003b63c97e603f672d04ffa3e581)), closes [1121942#c79](https://github.com/1121942/issues/c79)

## [2.15.5](https://github.com/vivliostyle/vivliostyle.js/compare/v2.15.4...v2.15.5) (2022-06-12)

### Bug Fixes

- Layout problem with Chrome>=102 ([b9d3d1f](https://github.com/vivliostyle/vivliostyle.js/commit/b9d3d1f16f624581ab6f81c3d52fd0f2e8954851)), closes [#896](https://github.com/vivliostyle/vivliostyle.js/issues/896)

## [2.15.4](https://github.com/vivliostyle/vivliostyle.js/compare/v2.15.3...v2.15.4) (2022-06-01)

### Bug Fixes

- White line left on the page bottom in output PDF ([4ed4a47](https://github.com/vivliostyle/vivliostyle.js/commit/4ed4a4756658d9cf4cb796a158b591f314953c28)), closes [#936](https://github.com/vivliostyle/vivliostyle.js/issues/936) [#934](https://github.com/vivliostyle/vivliostyle.js/issues/934)

## [2.15.3](https://github.com/vivliostyle/vivliostyle.js/compare/v2.15.2...v2.15.3) (2022-05-29)

### Bug Fixes

- break-after:avoid on heading not honored when float exists after the heading ([d1ec6ce](https://github.com/vivliostyle/vivliostyle.js/commit/d1ec6cef82c1f3935216a31ec008e78d7fc8c9b3)), closes [#904](https://github.com/vivliostyle/vivliostyle.js/issues/904)
- Error F_TASK_NOT_TOP_FRAME occurs when resizing and reformatting pages ([01ea3d3](https://github.com/vivliostyle/vivliostyle.js/commit/01ea3d3ebf42f19ac8bf5ca4447297858eb06c6f)), closes [#742](https://github.com/vivliostyle/vivliostyle.js/issues/742)
- page content missing in PDF output when bleed is specified without marks ([6fcae7c](https://github.com/vivliostyle/vivliostyle.js/commit/6fcae7c048c54d6001b9bd9ce9089e2dcb80d987)), closes [#929](https://github.com/vivliostyle/vivliostyle.js/issues/929)

## [2.15.2](https://github.com/vivliostyle/vivliostyle.js/compare/v2.15.1...v2.15.2) (2022-05-22)

### Bug Fixes

- first-letter pseudo element with float disappears when page break occurs in the parent paragraph ([99e9001](https://github.com/vivliostyle/vivliostyle.js/commit/99e9001bf04006623c0a70b8cfed4864b3bd0daa)), closes [#923](https://github.com/vivliostyle/vivliostyle.js/issues/923)
- Flexbox layout broken due to text-spacing side-effect ([0c070ca](https://github.com/vivliostyle/vivliostyle.js/commit/0c070caa14c8db0e79cdf28fdc535ddb7e33864f)), closes [#926](https://github.com/vivliostyle/vivliostyle.js/issues/926)
- hanging-punctuation/text-spacing not working correctly when a ruby element is adjacent ([71a95f9](https://github.com/vivliostyle/vivliostyle.js/commit/71a95f9438f4a739564f950aaddaa2a83f536cf6))
- showTOC() takes a long time on large HTML document ([ad50fe9](https://github.com/vivliostyle/vivliostyle.js/commit/ad50fe9bcf95ae3fb3353083b8c807711f5fa95c)), closes [#924](https://github.com/vivliostyle/vivliostyle.js/issues/924)
- SyntaxError ':not(:not(script, link, style) ~ \*)' is not a valid selector in slightly older browsers ([3389ee4](https://github.com/vivliostyle/vivliostyle.js/commit/3389ee45a68847c3ab1da77ab9f27304c3933889)), closes [#919](https://github.com/vivliostyle/vivliostyle.js/issues/919)
- wrong hanging-punctuation on half-width ideographic comma/fullstop ([8bbe420](https://github.com/vivliostyle/vivliostyle.js/commit/8bbe42051078906ca611ee9f313643caab86f4f2)), closes [#909](https://github.com/vivliostyle/vivliostyle.js/issues/909)

## [2.15.1](https://github.com/vivliostyle/vivliostyle.js/compare/v2.15.0...v2.15.1) (2022-05-06)

### Bug Fixes

- output page size slightly bigger than the specified ([ed7059d](https://github.com/vivliostyle/vivliostyle.js/commit/ed7059d7df78524ed0cade98abc7f245160311bc))

# [2.15.0](https://github.com/vivliostyle/vivliostyle.js/compare/v2.14.6...v2.15.0) (2022-05-05)

### Bug Fixes

- crop marks color should not be C0 M0 Y0 K100 when converted to CMYK ([d9386da](https://github.com/vivliostyle/vivliostyle.js/commit/d9386da94a4a9968418b4b1f93ed81de69e9bece)), closes [#910](https://github.com/vivliostyle/vivliostyle.js/issues/910)
- text-spacing causes text accessibility problem in output PDF ([5eb4f70](https://github.com/vivliostyle/vivliostyle.js/commit/5eb4f70f0918638adcf76577bca6a1272063a05a)), closes [#908](https://github.com/vivliostyle/vivliostyle.js/issues/908)

### Features

- Add crop-offset property for at-page rule ([4b8e328](https://github.com/vivliostyle/vivliostyle.js/commit/4b8e3280f6d5435cbd5b8d7c19b9d98f28a81d92)), closes [#913](https://github.com/vivliostyle/vivliostyle.js/issues/913)
- Support printing mixed page sizes ([76d1ed2](https://github.com/vivliostyle/vivliostyle.js/commit/76d1ed2c6f6d34c321edcefb534a28fb0728555a)), closes [#751](https://github.com/vivliostyle/vivliostyle.js/issues/751)

## [2.14.6](https://github.com/vivliostyle/vivliostyle.js/compare/v2.14.5...v2.14.6) (2022-04-18)

### Bug Fixes

- Fallback page size not applied on HeadlessChrome on Linux or Windows ([c57c5d6](https://github.com/vivliostyle/vivliostyle.js/commit/c57c5d62feeab35fa2b6c1366e21872633fbfdfa)), closes [#905](https://github.com/vivliostyle/vivliostyle.js/issues/905)
- Page float displayed unexpectedly in earlier page when target-counter is used ([82fde78](https://github.com/vivliostyle/vivliostyle.js/commit/82fde782f8bf5b4d8213cd7d0db2ec509dc690dc)), closes [#681](https://github.com/vivliostyle/vivliostyle.js/issues/681)
- TypeError: Cannot read properties of null ([7db46f5](https://github.com/vivliostyle/vivliostyle.js/commit/7db46f5a5f0415c516d0586b38203688e99f0611))
- Web fonts (with JavaScript) not enabled when used in the middle of large HTML file ([3ba4160](https://github.com/vivliostyle/vivliostyle.js/commit/3ba416020bbf5a12cbd1d66472aae8c258d71d9c)), closes [#901](https://github.com/vivliostyle/vivliostyle.js/issues/901)

## [2.14.5](https://github.com/vivliostyle/vivliostyle.js/compare/v2.14.4...v2.14.5) (2022-04-11)

### Bug Fixes

- hanging-punctuation caused wrong text hanging on Safari/WebKit ([49e278b](https://github.com/vivliostyle/vivliostyle.js/commit/49e278b70dad7660ef60b5805d704f0225190fa1)), closes [#894](https://github.com/vivliostyle/vivliostyle.js/issues/894)
- text-spacing caused wrong page break ([a17e775](https://github.com/vivliostyle/vivliostyle.js/commit/a17e775f2cb52ca0a10e0ab7bbd2a0ff2cace9f8)), closes [#898](https://github.com/vivliostyle/vivliostyle.js/issues/898)

## [2.14.4](https://github.com/vivliostyle/vivliostyle.js/compare/v2.14.3...v2.14.4) (2022-02-21)

### Bug Fixes

- **viewer:** tweak mouse wheel/scroll handling to prevent unexpected page moves ([2ac72a0](https://github.com/vivliostyle/vivliostyle.js/commit/2ac72a09cd79388de54475f55c04854c4bad02d3))
- wrong page break with ruby at beginning of a paragraph ([a9c50a3](https://github.com/vivliostyle/vivliostyle.js/commit/a9c50a3a80ebb886d78b94592ffdae763c7fefd3)), closes [#885](https://github.com/vivliostyle/vivliostyle.js/issues/885)

## [2.14.3](https://github.com/vivliostyle/vivliostyle.js/compare/v2.14.2...v2.14.3) (2022-02-18)

### Bug Fixes

- hanging-punctuation not working properly with non-full-width punctuation ([a3a05d3](https://github.com/vivliostyle/vivliostyle.js/commit/a3a05d3af2958a9d47f6c3a6239da02c6236a2ad)), closes [#879](https://github.com/vivliostyle/vivliostyle.js/issues/879)
- internal links broken in output PDF ([e59109a](https://github.com/vivliostyle/vivliostyle.js/commit/e59109a4b5767c0a63d2907f02c1d9f4a8c616ae)), closes [#877](https://github.com/vivliostyle/vivliostyle.js/issues/877)
- should not link to blank page generated by a spread break ([e706947](https://github.com/vivliostyle/vivliostyle.js/commit/e7069478d4259dcee039602eb5a4adf54a4a4fc1)), closes [#881](https://github.com/vivliostyle/vivliostyle.js/issues/881)

## [2.14.2](https://github.com/vivliostyle/vivliostyle.js/compare/v2.14.1...v2.14.2) (2022-02-14)

### Bug Fixes

- footnotes not positioned correctly in vertical writing mode ([4a14156](https://github.com/vivliostyle/vivliostyle.js/commit/4a1415628ba4233b91cb3171aa5080c69114c8d6)), closes [#862](https://github.com/vivliostyle/vivliostyle.js/issues/862) [#392](https://github.com/vivliostyle/vivliostyle.js/issues/392)
- hang-up with footnote/pagefloat and ::after pseudo element ([4840e7d](https://github.com/vivliostyle/vivliostyle.js/commit/4840e7d3d7cab7172924d9f7377325d0d0835d82)), closes [#869](https://github.com/vivliostyle/vivliostyle.js/issues/869)
- margin-block-end on page floats ignored in vertical writing mode ([42ab1e1](https://github.com/vivliostyle/vivliostyle.js/commit/42ab1e105ea8fbdbe4d1455e39b3efd1c6e1669c)), closes [#866](https://github.com/vivliostyle/vivliostyle.js/issues/866)
- should generate single text node for pseudo elements if possible ([bed59df](https://github.com/vivliostyle/vivliostyle.js/commit/bed59df9c469b06f8aa017f41ae8bd79c4a07cb2)), closes [#863](https://github.com/vivliostyle/vivliostyle.js/issues/863)
- use appropriate fallback page size when window size is not available ([5a90204](https://github.com/vivliostyle/vivliostyle.js/commit/5a90204095cda4f4ea8682f3494a64cdca4654ec))
- wrong indent of fullwidth opening punctuation at first line in second page ([033d63b](https://github.com/vivliostyle/vivliostyle.js/commit/033d63bfb1ece834e775446ebda7d4c438b63e45)), closes [#861](https://github.com/vivliostyle/vivliostyle.js/issues/861)

## [2.14.1](https://github.com/vivliostyle/vivliostyle.js/compare/v2.14.0...v2.14.1) (2022-02-05)

### Bug Fixes

- text-spacing not working depending on fonts ([433821e](https://github.com/vivliostyle/vivliostyle.js/commit/433821efcf9eabb98f98bed18dbee32de0626476)), closes [#858](https://github.com/vivliostyle/vivliostyle.js/issues/858) [#855](https://github.com/vivliostyle/vivliostyle.js/issues/855)

# [2.14.0](https://github.com/vivliostyle/vivliostyle.js/compare/v2.13.0...v2.14.0) (2022-02-04)

### Bug Fixes

- CSS text-orientation property was ignored in page margin boxes ([ff2bb2e](https://github.com/vivliostyle/vivliostyle.js/commit/ff2bb2ec634b9dd071363fa68162498a4f86b51f))
- do not ignore metadata (language, author) in publication manifest ([e1ec75f](https://github.com/vivliostyle/vivliostyle.js/commit/e1ec75f5a5706cd34c432e1c685c7f4d78ae30e7)), closes [#849](https://github.com/vivliostyle/vivliostyle.js/issues/849)
- follow-up fix to text-spacing and hanging-punctuation support ([6c19d40](https://github.com/vivliostyle/vivliostyle.js/commit/6c19d40ab9ec0ab9cd97526d09b66740d1502022)), closes [#853](https://github.com/vivliostyle/vivliostyle.js/issues/853) [#820](https://github.com/vivliostyle/vivliostyle.js/issues/820) [#851](https://github.com/vivliostyle/vivliostyle.js/issues/851) [#818](https://github.com/vivliostyle/vivliostyle.js/issues/818) [#814](https://github.com/vivliostyle/vivliostyle.js/issues/814) [#595](https://github.com/vivliostyle/vivliostyle.js/issues/595)
- overflow:hidden should not be default in page margin boxes ([cf25ad5](https://github.com/vivliostyle/vivliostyle.js/commit/cf25ad5cf8842916d9e64092fcc4962c6eee148c))
- page margin boxes with vertical writing-mode not properly aligned ([1e0f4d0](https://github.com/vivliostyle/vivliostyle.js/commit/1e0f4d0e75c219beedf634b37e2a06077111219b))
- TypeError occurred with TOC button when the book url has fragment ([b3b6087](https://github.com/vivliostyle/vivliostyle.js/commit/b3b60875d5f568ea45c09d518451135b064878cb)), closes [#856](https://github.com/vivliostyle/vivliostyle.js/issues/856)
- Unnecessary aria-hidden attributes caused tagged PDF output broken ([772a821](https://github.com/vivliostyle/vivliostyle.js/commit/772a821acb10c1cecc3ec9054f4e5a9d6729adfe))

### Features

- support CSS text-spacing and hanging-punctuation in generated content ([d905017](https://github.com/vivliostyle/vivliostyle.js/commit/d905017faea30054853f913294a68c3fc5760823)), closes [#820](https://github.com/vivliostyle/vivliostyle.js/issues/820)
- support the allow-end value of text-spacing and hanging-punctuation ([102aec6](https://github.com/vivliostyle/vivliostyle.js/commit/102aec675cfd80c26d4fcf97cb10f06c191c265f)), closes [#818](https://github.com/vivliostyle/vivliostyle.js/issues/818)

# [2.13.0](https://github.com/vivliostyle/vivliostyle.js/compare/v2.12.1...v2.13.0) (2022-01-17)

### Bug Fixes

- "The target resource is invalid" error caused by TOC with non-HTML links ([d90e2aa](https://github.com/vivliostyle/vivliostyle.js/commit/d90e2aa2af33a3677005a1fa4e4b93f9ac2cfee3)), closes [#839](https://github.com/vivliostyle/vivliostyle.js/issues/839)
- CSS parser error, failed to parse stylesheet ([a5a48d2](https://github.com/vivliostyle/vivliostyle.js/commit/a5a48d28a0d6f2862d7e78edc775b6f4c5e20eb7)), closes [#827](https://github.com/vivliostyle/vivliostyle.js/issues/827)
- Layout problem with Web fonts ([79cf301](https://github.com/vivliostyle/vivliostyle.js/commit/79cf301ffb7803d941e5f2e3aa7616b692d991b7)), closes [#829](https://github.com/vivliostyle/vivliostyle.js/issues/829)
- Pseudo elements should not be generated when content is none ([342f5a0](https://github.com/vivliostyle/vivliostyle.js/commit/342f5a0356e07882c6e51729f4ec4b7e514f8d65)), closes [#832](https://github.com/vivliostyle/vivliostyle.js/issues/832)
- Viewer page position should be kept after the heading ID changed ([9c80245](https://github.com/vivliostyle/vivliostyle.js/commit/9c8024542049191173160dad2df0f1a5b39c64af)), closes [#826](https://github.com/vivliostyle/vivliostyle.js/issues/826)

### Features

- Allow JavaScript in HTML documents ([ccd31da](https://github.com/vivliostyle/vivliostyle.js/commit/ccd31da5ff3eba91432953580483548cecd84859)), closes [#733](https://github.com/vivliostyle/vivliostyle.js/issues/733) [#735](https://github.com/vivliostyle/vivliostyle.js/issues/735)
- **viewer:** Add zoom URL parameter to keep zoom value on reloading ([3bdab51](https://github.com/vivliostyle/vivliostyle.js/commit/3bdab51e557ccb358be3c2c69d36448ca08fd890)), closes [#825](https://github.com/vivliostyle/vivliostyle.js/issues/825)

## [2.12.1](https://github.com/vivliostyle/vivliostyle.js/compare/v2.12.0...v2.12.1) (2021-11-19)

### Bug Fixes

- MathJax not enabled with inline TeX notation ([e7da5a2](https://github.com/vivliostyle/vivliostyle.js/commit/e7da5a21ff7f9bbaca1cbaff0864b4e797ec3683)), closes [#815](https://github.com/vivliostyle/vivliostyle.js/issues/815)
- Ruby broken at column/page break ([5dfc049](https://github.com/vivliostyle/vivliostyle.js/commit/5dfc0490a2edde4054a8e2a6c4297af095be60c4)), closes [#821](https://github.com/vivliostyle/vivliostyle.js/issues/821)
- Text with ruby overflowed at column/page break ([f15534d](https://github.com/vivliostyle/vivliostyle.js/commit/f15534d71157d1245e81eea8247f0ce3f7f92cf7)), closes [#816](https://github.com/vivliostyle/vivliostyle.js/issues/816)

# [2.12.0](https://github.com/vivliostyle/vivliostyle.js/compare/v2.11.3...v2.12.0) (2021-11-13)

### Features

- Support CSS hanging-punctuation property ([f85b36e](https://github.com/vivliostyle/vivliostyle.js/commit/f85b36e6cbae67f3d137f856ef202fd53d640c4f))
- Support CSS text-spacing property ([dfebffb](https://github.com/vivliostyle/vivliostyle.js/commit/dfebffbac1bf1ea3872c7f02e47419c250a2af34)), closes [#595](https://github.com/vivliostyle/vivliostyle.js/issues/595)

## [2.11.3](https://github.com/vivliostyle/vivliostyle.js/compare/v2.11.2...v2.11.3) (2021-10-31)

### Bug Fixes

- Error: E_FONT_FAMILY_INCONSISTENT ([9d7be19](https://github.com/vivliostyle/vivliostyle.js/commit/9d7be19df541706519a5709499a6d34b9c018efc)), closes [#797](https://github.com/vivliostyle/vivliostyle.js/issues/797)
- Page/column last line not justified when justify is specified on root ([e2c9706](https://github.com/vivliostyle/vivliostyle.js/commit/e2c97064299c72b23950b244f3c2c38cba5d7aee)), closes [#803](https://github.com/vivliostyle/vivliostyle.js/issues/803)
- Root element styles not inherited to page context in multi-column layout ([83f8ee7](https://github.com/vivliostyle/vivliostyle.js/commit/83f8ee715f3a3d57e2f8ba257ee795fe8b746654)), closes [#800](https://github.com/vivliostyle/vivliostyle.js/issues/800)
- Ruby broken when page float exists ([376db9a](https://github.com/vivliostyle/vivliostyle.js/commit/376db9afcce7c8884ed3809717d5fb41ecc25f44)), closes [#804](https://github.com/vivliostyle/vivliostyle.js/issues/804)
- Ruby with rp elements broken at page break ([11ad5cf](https://github.com/vivliostyle/vivliostyle.js/commit/11ad5cf9e26b665e0e58ea171211ba47b7cae542)), closes [#808](https://github.com/vivliostyle/vivliostyle.js/issues/808)
- Text overflow at column/page break ([824d5b6](https://github.com/vivliostyle/vivliostyle.js/commit/824d5b642ce752f23ce0bd179f06a23374eace14)), closes [#811](https://github.com/vivliostyle/vivliostyle.js/issues/811)
- Text overflow at column/page break when wbr tag is used ([57e358a](https://github.com/vivliostyle/vivliostyle.js/commit/57e358ab01348ea9e7865bf0e0fe47bf2b513162)), closes [#802](https://github.com/vivliostyle/vivliostyle.js/issues/802)
- TypeError: Cannot read properties of null (reading 'readingProgression') ([b5d4acd](https://github.com/vivliostyle/vivliostyle.js/commit/b5d4acd7288fa0e44e61ac17ca26915b54201608)), closes [#796](https://github.com/vivliostyle/vivliostyle.js/issues/796)

## [2.11.2](https://github.com/vivliostyle/vivliostyle.js/compare/v2.11.1...v2.11.2) (2021-10-17)

### Bug Fixes

- Workaround for Chromium problem of inconsistent screen and print layout ([08f2337](https://github.com/vivliostyle/vivliostyle.js/commit/08f23370cc1aa82231a9705cbe597f4137955fc7)), closes [#758](https://github.com/vivliostyle/vivliostyle.js/issues/758) [#793](https://github.com/vivliostyle/vivliostyle.js/issues/793)
- Wrong hyphenation at bottom of page ([bcbc72c](https://github.com/vivliostyle/vivliostyle.js/commit/bcbc72c45f35879351e495b69ddb22d8b41852b0)), closes [#792](https://github.com/vivliostyle/vivliostyle.js/issues/792)

## [2.11.1](https://github.com/vivliostyle/vivliostyle.js/compare/v2.11.0...v2.11.1) (2021-10-08)

### Bug Fixes

- column-fill:balance on vertical writing mode causes columns left-aligned ([fe55f36](https://github.com/vivliostyle/vivliostyle.js/commit/fe55f36543879541b3028ee52bca94d805f21879)), closes [#544](https://github.com/vivliostyle/vivliostyle.js/issues/544)
- Consecutive ruby elements cause line overflow ([7c57ddb](https://github.com/vivliostyle/vivliostyle.js/commit/7c57ddbd7602c31da084b93024ad8d730fe3a0d2))
- float:inline-start and inline-end misinterpreted as float:right ([2e71481](https://github.com/vivliostyle/vivliostyle.js/commit/2e714815265dbcba2fd938e40f2d7c5452f23018)), closes [#789](https://github.com/vivliostyle/vivliostyle.js/issues/789)
- Inline-block or ruby at beginning of a block causes unexpected page/column break ([0631dfe](https://github.com/vivliostyle/vivliostyle.js/commit/0631dfe69cf4d10dd9529b79874163d4242e2c2c)), closes [#546](https://github.com/vivliostyle/vivliostyle.js/issues/546)
- No break opportunity between math or svg ([ea08a02](https://github.com/vivliostyle/vivliostyle.js/commit/ea08a020d3db9a8e35e7e8cf6cb82d6154c04023)), closes [#750](https://github.com/vivliostyle/vivliostyle.js/issues/750)

# [2.11.0](https://github.com/vivliostyle/vivliostyle.js/compare/v2.10.0...v2.11.0) (2021-09-29)

### Bug Fixes

- **viewer:** unwanted text deselection when mouse out of buttons ([63c5335](https://github.com/vivliostyle/vivliostyle.js/commit/63c533537518084822fec004d1f252adef8286e7))

### Features

- **viewer:** Add basic text find feature ([f85d731](https://github.com/vivliostyle/vivliostyle.js/commit/f85d7313eab142e7f0b4f4967230c5d8f02b63f8)), closes [#575](https://github.com/vivliostyle/vivliostyle.js/issues/575)
- **viewer:** Disable Find and Text Smaller/Larger buttons for fixed layout EPUBs ([fa0ae2e](https://github.com/vivliostyle/vivliostyle.js/commit/fa0ae2e3aad8a91eb3d7b6be76ad91bba0aedaff))

# [2.10.0](https://github.com/vivliostyle/vivliostyle.js/compare/v2.9.1...v2.10.0) (2021-09-17)

### Bug Fixes

- Default body margin should be 0 in paged media ([874a518](https://github.com/vivliostyle/vivliostyle.js/commit/874a51828e85034aed6533f0659860f1a39edca6)), closes [#776](https://github.com/vivliostyle/vivliostyle.js/issues/776)
- Footnote counter should be predefined and available by default ([16096b2](https://github.com/vivliostyle/vivliostyle.js/commit/16096b2dc619f6e0cf702084f0dc3a09edce21f3)), closes [#723](https://github.com/vivliostyle/vivliostyle.js/issues/723)
- Named page at the first page is not applied when HTML head part is big ([0f696dc](https://github.com/vivliostyle/vivliostyle.js/commit/0f696dce748c3a9680187da10115d8e13dc0606b)), closes [#770](https://github.com/vivliostyle/vivliostyle.js/issues/770)
- Named page not properly changed when target-counter refers the page ([c303c2b](https://github.com/vivliostyle/vivliostyle.js/commit/c303c2bf3c1234dc0a333931eadb224bde505a35)), closes [#771](https://github.com/vivliostyle/vivliostyle.js/issues/771)
- Percentage font-size on :root causes wrong font-size in table with page/column breaks ([6f0e6c3](https://github.com/vivliostyle/vivliostyle.js/commit/6f0e6c3e6b4d04971e4541f905d3b3f20118760a)), closes [#549](https://github.com/vivliostyle/vivliostyle.js/issues/549)
- prevent useless warning "Property not supported by the browser: behavior" ([1462a89](https://github.com/vivliostyle/vivliostyle.js/commit/1462a892f1e87018c45a96105939f26c087a00bf))
- Remove -ms- prefixed properties for no-longer supported browsers ([7e7bf1b](https://github.com/vivliostyle/vivliostyle.js/commit/7e7bf1b10e626257fae5653091c138b5a4b9bd26))
- Root element styles should be inherited to the page context ([1a41185](https://github.com/vivliostyle/vivliostyle.js/commit/1a4118538f6b7cfb80a9174fc1ee4300a9b69501)), closes [#568](https://github.com/vivliostyle/vivliostyle.js/issues/568)
- text-combine-upright with text-indent does not work properly ([1cabb91](https://github.com/vivliostyle/vivliostyle.js/commit/1cabb91fae7ff4abc0c56ff907173e6770ef578c))
- The :not() selector not working when the argument has ID selector ([60a127f](https://github.com/vivliostyle/vivliostyle.js/commit/60a127f11cfaa5071f58eb211b91431c3ab78eec)), closes [#769](https://github.com/vivliostyle/vivliostyle.js/issues/769)

### Features

- Add support for `line-break: anywhere` ([ba60007](https://github.com/vivliostyle/vivliostyle.js/commit/ba60007f189a401a5c5508c3ac0147799d075793))
- Add support for `overflow-wrap: anywhere` ([96564af](https://github.com/vivliostyle/vivliostyle.js/commit/96564af3739b25d37954c755e1eba625eaf34a1e))
- Add support for `white-space: break-spaces` ([f563b61](https://github.com/vivliostyle/vivliostyle.js/commit/f563b61f6fe70f2e0df75df59e1e46fe9ffa1484))
- Add support for the font-variant-\* properties ([504896b](https://github.com/vivliostyle/vivliostyle.js/commit/504896bc9a388c22a7f02ac4704778063472f741)), closes [#592](https://github.com/vivliostyle/vivliostyle.js/issues/592)
- Support the min-content, max-content, and fit-content values for width and height ([9ce72b0](https://github.com/vivliostyle/vivliostyle.js/commit/9ce72b0bd0b65380516bc1e40d25561c87f86e4d)), closes [#605](https://github.com/vivliostyle/vivliostyle.js/issues/605)
- Support unicode-range descriptor ([a3f488f](https://github.com/vivliostyle/vivliostyle.js/commit/a3f488f86fe264e3dd1a895de9f0495a2c489aa1)), closes [#598](https://github.com/vivliostyle/vivliostyle.js/issues/598)

## [2.9.1](https://github.com/vivliostyle/vivliostyle.js/compare/v2.9.0...v2.9.1) (2021-09-08)

### Bug Fixes

- Page at-rule in conditional rule is applied even if condition is false ([b114396](https://github.com/vivliostyle/vivliostyle.js/commit/b11439676d49eb075174b288f4c7a5838f21c7db))

# [2.9.0](https://github.com/vivliostyle/vivliostyle.js/compare/v2.8.1...v2.9.0) (2021-09-03)

### Bug Fixes

- "TypeError: Cannot read property '1' of null" occurred in getTOC() ([d4539f7](https://github.com/vivliostyle/vivliostyle.js/commit/d4539f7d934ac0a856a9fb45befd205632a29d96))
- Vivliostyle Viewer stops working when window resizing on renderAllPages=false mode ([5ae9298](https://github.com/vivliostyle/vivliostyle.js/commit/5ae92980051fa4d816b47ed0ba8e7227670ba5da)), closes [#752](https://github.com/vivliostyle/vivliostyle.js/issues/752)
- **viewer:** HTML markup errors in the Vivliostyle Viewer start page ([aed4ea9](https://github.com/vivliostyle/vivliostyle.js/commit/aed4ea917a1e040dbfa5fdff0662621bff9dc141)), closes [#755](https://github.com/vivliostyle/vivliostyle.js/issues/755)

### Features

- Support the `@supports` CSS at-rule ([08efaef](https://github.com/vivliostyle/vivliostyle.js/commit/08efaef17b7c430ef0e3e30029480d3bb0953655)), closes [#730](https://github.com/vivliostyle/vivliostyle.js/issues/730)
- **viewer:** Add Content MathML extension in mathjax-config ([e01ffa0](https://github.com/vivliostyle/vivliostyle.js/commit/e01ffa07198fc6b7512469903372ac199bbe7063))

## [2.8.1](https://github.com/vivliostyle/vivliostyle.js/compare/v2.8.0...v2.8.1) (2021-07-14)

### Bug Fixes

- inherited text-indent ignored after page/column break ([32aba92](https://github.com/vivliostyle/vivliostyle.js/commit/32aba928339134d26a43103a007e1c52e2dd3aac)), closes [#737](https://github.com/vivliostyle/vivliostyle.js/issues/737)
- Problem on navigation to document URL without fragment from TOC ([a948394](https://github.com/vivliostyle/vivliostyle.js/commit/a948394535ef2a43d92be26aa479910219a700f2)), closes [#736](https://github.com/vivliostyle/vivliostyle.js/issues/736)
- Text disappears at page break when footnote or page float is given on before pseudo element ([d78a168](https://github.com/vivliostyle/vivliostyle.js/commit/d78a168a0b46091c05a85f02db3d8248e76c2e9e)), closes [#740](https://github.com/vivliostyle/vivliostyle.js/issues/740)
- typescript error TS2612: Property 'xxx' will overwrite the base property ([e8c52ea](https://github.com/vivliostyle/vivliostyle.js/commit/e8c52eaefbeb56e6d7333bdb573376d580f272de))
- Unnecessary reformatting when resizing window ([51e2f99](https://github.com/vivliostyle/vivliostyle.js/commit/51e2f995336343993adbdeda27a42a827b687fa4)), closes [#743](https://github.com/vivliostyle/vivliostyle.js/issues/743)

# [2.8.0](https://github.com/vivliostyle/vivliostyle.js/compare/v2.7.0...v2.8.0) (2021-04-16)

### Bug Fixes

- Failed to fetch documents when pub-manifest file has no file name extension ([7fd2e15](https://github.com/vivliostyle/vivliostyle.js/commit/7fd2e157af034c50f120658c182510ca66374949))
- InvalidNodeTypeError: Failed to execute 'setStartBefore' on 'Range': the given Node has no parent ([836b64c](https://github.com/vivliostyle/vivliostyle.js/commit/836b64cd82e56dc391b3fa814ada256a2dadde2e)), closes [#715](https://github.com/vivliostyle/vivliostyle.js/issues/715)
- Stops with error when CSS property value calc() has invalid expression ([61001a2](https://github.com/vivliostyle/vivliostyle.js/commit/61001a24abd7e327c34d1c52a834edf09b65f015)), closes [#717](https://github.com/vivliostyle/vivliostyle.js/issues/717)
- Stops with InvalidCharacterError: Failed to execute 'setAttribute' on 'Element' ([f0253fa](https://github.com/vivliostyle/vivliostyle.js/commit/f0253fa8744af1111b84dc1766cf15e5db7c95af)), closes [#718](https://github.com/vivliostyle/vivliostyle.js/issues/718)
- target-counter and forced page break caused layout problems ([377eaf9](https://github.com/vivliostyle/vivliostyle.js/commit/377eaf9da2d55c85ceee0814d553c3b3ee3ed83f)), closes [#722](https://github.com/vivliostyle/vivliostyle.js/issues/722)
- The ::first-letter pseudo-element not applied when a newline is preceding the first letter ([546ed74](https://github.com/vivliostyle/vivliostyle.js/commit/546ed7449c4c5e3fd187b07de6efbab54f5123e9)), closes [#716](https://github.com/vivliostyle/vivliostyle.js/issues/716)
- TOC panel should not have a whole document in web publication ([d95043b](https://github.com/vivliostyle/vivliostyle.js/commit/d95043b23f3a349875c520b53e957e8730f781d3)), closes [#720](https://github.com/vivliostyle/vivliostyle.js/issues/720)

### Features

- support :blank page selector ([7145f76](https://github.com/vivliostyle/vivliostyle.js/commit/7145f7631b58f9677c016b36cd57c8d2a268a469)), closes [#428](https://github.com/vivliostyle/vivliostyle.js/issues/428)

# [2.7.0](https://github.com/vivliostyle/vivliostyle.js/compare/v2.6.2...v2.7.0) (2021-04-07)

### Features

- add paper sizes ([245e39a](https://github.com/vivliostyle/vivliostyle.js/commit/245e39a32c801701e1d30decb574407c99a8347c))
- support named pages ([9fba2eb](https://github.com/vivliostyle/vivliostyle.js/commit/9fba2ebb0c20fd926dc422165b139985621e4934)), closes [#425](https://github.com/vivliostyle/vivliostyle.js/issues/425)

## [2.6.2](https://github.com/vivliostyle/vivliostyle.js/compare/v2.6.1...v2.6.2) (2021-03-25)

### Bug Fixes

- Failed to load documents from URL that contains "%26" or "%3F" etc. ([c7da706](https://github.com/vivliostyle/vivliostyle.js/commit/c7da706c7bdaeaf9848472284ff9303defe9e1d8)), closes [#711](https://github.com/vivliostyle/vivliostyle.js/issues/711)
- TypeError: Cannot read property 'anchorSlot' of undefined ([1625c81](https://github.com/vivliostyle/vivliostyle.js/commit/1625c810625999bedc28f53514c1fa11d2b539d1)), closes [#712](https://github.com/vivliostyle/vivliostyle.js/issues/712)

## [2.6.1](https://github.com/vivliostyle/vivliostyle.js/compare/v2.6.0...v2.6.1) (2021-03-23)

### Bug Fixes

- Minimum font size setting in Chrome causes ruby font size problem ([5e52c6f](https://github.com/vivliostyle/vivliostyle.js/commit/5e52c6fb8a581405d96ba5ff1165e9e01823308b)), closes [#673](https://github.com/vivliostyle/vivliostyle.js/issues/673)

# [2.6.0](https://github.com/vivliostyle/vivliostyle.js/compare/v2.5.2...v2.6.0) (2021-03-14)

### Bug Fixes

- **core:** Footnotes may cause "TypeError: Cannot read property 'styler' of null" ([fbce3c7](https://github.com/vivliostyle/vivliostyle.js/commit/fbce3c709b9b76a1833af54a9dd68a620ae1b9f3)), closes [#707](https://github.com/vivliostyle/vivliostyle.js/issues/707)
- **core:** Stops with "TypeError: Cannot read property 'toLowerCase' of undefined" ([38548ab](https://github.com/vivliostyle/vivliostyle.js/commit/38548abd013914c1bdf78d5dbcccb68ed9c043ee)), closes [#706](https://github.com/vivliostyle/vivliostyle.js/issues/706)

### Features

- **viewer:** Add Print button and improve Settings menu ([7a98a6e](https://github.com/vivliostyle/vivliostyle.js/commit/7a98a6eed2b3a97c0f696bd44d05d4f27ce772a0))
- **viewer:** MathJax config update: use default scale and margin settings ([0bedbbe](https://github.com/vivliostyle/vivliostyle.js/commit/0bedbbe7d4dd9ef2a19b4ff31b83660d140e8fd1)), closes [#593](https://github.com/vivliostyle/vivliostyle.js/issues/593)
- **viewer:** Set coreViewer to the window object to allow other program to control the viewer ([db47cef](https://github.com/vivliostyle/vivliostyle.js/commit/db47cefab875d16d6a8d7d70a6acf2c300bf581d))

## [2.5.2](https://github.com/vivliostyle/vivliostyle.js/compare/v2.5.1...v2.5.2) (2021-03-05)

### Bug Fixes

- **core:** Hang-up with footnote or page float on pseudo elements ([cf324d4](https://github.com/vivliostyle/vivliostyle.js/commit/cf324d404922b01f19e5fd675874fb4aad7ef593)), closes [#703](https://github.com/vivliostyle/vivliostyle.js/issues/703)

## [2.5.1](https://github.com/vivliostyle/vivliostyle.js/compare/v2.5.0...v2.5.1) (2021-02-28)

### Bug Fixes

- **core:** Wrong page counter value when page counter is reset in the previous doc ([a4d9e18](https://github.com/vivliostyle/vivliostyle.js/commit/a4d9e185aae96407be217d3505706216582dd0d8)), closes [#701](https://github.com/vivliostyle/vivliostyle.js/issues/701)

# [2.5.0](https://github.com/vivliostyle/vivliostyle.js/compare/v2.5.0-pre.0...v2.5.0) (2021-02-26)

### Features

- **core:** Support the :nth() page selector ([ad6f3e9](https://github.com/vivliostyle/vivliostyle.js/commit/ad6f3e9c788425097c7be3443b2032733c32cdb4)), closes [#667](https://github.com/vivliostyle/vivliostyle.js/issues/667)

## [2.5.0-pre.0](https://github.com/vivliostyle/vivliostyle.js/compare/v2.4.2...v2.5.0-pre.0) (2021-02-23)

### Bug Fixes

- **core:** spread break at beginning of a document does not work properly ([f1208bf](https://github.com/vivliostyle/vivliostyle.js/commit/f1208bf8d4a542970fdca64a0ff99679064715a7)), closes [#666](https://github.com/vivliostyle/vivliostyle.js/issues/666)
- **core:** Missing source map ([f8add2b](https://github.com/vivliostyle/vivliostyle.js/commit/f8add2bc50b4a333c1d62806675adfa05eb3b61e)), closes [#695](https://github.com/vivliostyle/vivliostyle.js/issues/695)

### Features

- **viewer:** Configuration flags ([2073f28](https://github.com/vivliostyle/vivliostyle.js/commit/2073f28cad3a04b379bbe42555e3b0c3f90ecd49)), closes [#692](https://github.com/vivliostyle/vivliostyle.js/issues/692)

## [2.4.2](https://github.com/vivliostyle/vivliostyle.js/compare/v2.4.1...v2.4.2) (2021-01-25)

### Bug Fixes

- top margin at forced break was ignored when target-counter is used ([c8485ad](https://github.com/vivliostyle/vivliostyle.js/commit/c8485ad668fd462fca15c960660c154388214bc9)), closes [#690](https://github.com/vivliostyle/vivliostyle.js/issues/690)
- **react:** Add react-dom to peer deps ([3325031](https://github.com/vivliostyle/vivliostyle.js/commit/33250317db52c01c338796f1b5d72eb931a688c7))
- **react:** init core-viewer once even if source is updated ([56f3d1b](https://github.com/vivliostyle/vivliostyle.js/commit/56f3d1b30440e5a21f88e43ea07aafa6e3ba3ec2))
- **react:** remove incorrect startPage ([7f7951c](https://github.com/vivliostyle/vivliostyle.js/commit/7f7951c8e059af317254820a1529d4c2776130c9))

## [2.4.1](https://github.com/vivliostyle/vivliostyle.js/compare/v2.4.0...v2.4.1) (2021-01-12)

### Bug Fixes

- Page float displayed unexpectedly in earlier page when target-counter is used ([34952e9](https://github.com/vivliostyle/vivliostyle.js/commit/34952e97636236b71f520f9feccc747b65aca85c)), closes [#681](https://github.com/vivliostyle/vivliostyle.js/issues/681)

# [2.4.0](https://github.com/vivliostyle/vivliostyle.js/compare/v2.3.0...v2.4.0) (2020-12-28)

### Features

- Support named strings for running headers and footers ([e02a06c](https://github.com/vivliostyle/vivliostyle.js/commit/e02a06c2bb7400e61e5c956aef90b31004ad2685)), closes [#545](https://github.com/vivliostyle/vivliostyle.js/issues/545)

# [2.3.0](https://github.com/vivliostyle/vivliostyle.js/compare/v2.2.3...v2.3.0) (2020-12-07)

### Bug Fixes

- break-before:left/right is ignored when the previous block has break-after:page, etc. ([01092f1](https://github.com/vivliostyle/vivliostyle.js/commit/01092f1113b37a3bcdfc0c59f3e194dc46be5704)), closes [#676](https://github.com/vivliostyle/vivliostyle.js/issues/676)
- CSS 'hyphens' property specified on the root element is ignored ([dfb9f87](https://github.com/vivliostyle/vivliostyle.js/commit/dfb9f876cdbe86c81474d14e427fd384f8fbda9c)), closes [#674](https://github.com/vivliostyle/vivliostyle.js/issues/674)

### Features

- Support EPUB spine properties page-spread-left and -right ([38b0774](https://github.com/vivliostyle/vivliostyle.js/commit/38b0774e8e2159f17335d57b95c22bcfb29913f9)), closes [#671](https://github.com/vivliostyle/vivliostyle.js/issues/671)

## [2.2.3](https://github.com/vivliostyle/vivliostyle.js/compare/v2.2.2...v2.2.3) (2020-11-28)

**Note:** Version bump only for package vivliostyle

## [2.2.2](https://github.com/vivliostyle/vivliostyle.js/compare/v2.2.1...v2.2.2) (2020-11-28)

### Bug Fixes

- **viewer:** Fix UI stylesheet problem for print ([5244462](https://github.com/vivliostyle/vivliostyle.js/commit/5244462df2f1373c857835d678f1f8374aeda033))

## [2.2.1](https://github.com/vivliostyle/vivliostyle.js/compare/v2.2.0...v2.2.1) (2020-11-26)

### Bug Fixes

- **viewer:** bug in v2.2.0 "TypeError: Cannot read property 'toString' of null" ([08cf029](https://github.com/vivliostyle/vivliostyle.js/commit/08cf02981b4fa42f31065730bc24ffbab5414b25))
- **viewer:** Mouse wheel should be able to use to scroll TOC when TOC is active ([c6c5eb8](https://github.com/vivliostyle/vivliostyle.js/commit/c6c5eb8416ef6fcb174ec86ae53e59fd4e67c570))

# [2.2.0](https://github.com/vivliostyle/vivliostyle.js/compare/v2.1.4...v2.2.0) (2020-11-26)

### Features

- **viewer:** Add page slider in Vivliostyle Viewer UI ([3e80c67](https://github.com/vivliostyle/vivliostyle.js/commit/3e80c678b2c5374361ddf81fe16b14c057800146)), closes [#670](https://github.com/vivliostyle/vivliostyle.js/issues/670)
- **viewer:** Mouse wheel support for page navigation ([94113f6](https://github.com/vivliostyle/vivliostyle.js/commit/94113f6377dd9a503a4ae17437da50434590aa66))

## [2.1.4](https://github.com/vivliostyle/vivliostyle.js/compare/v2.1.3...v2.1.4) (2020-10-30)

### Bug Fixes

- negative z-index on `[@page](https://github.com/page) {...}` causes page (margin-box) content to disappear ([000eed6](https://github.com/vivliostyle/vivliostyle.js/commit/000eed65c2527216f0be85433e6ccbfa7f4a07a9)), closes [#665](https://github.com/vivliostyle/vivliostyle.js/issues/665)

## [2.1.3](https://github.com/vivliostyle/vivliostyle.js/compare/v2.1.2...v2.1.3) (2020-09-30)

### Bug Fixes

- Internal links and TOC links not working when the document URL has %-encoded characters ([bdabb71](https://github.com/vivliostyle/vivliostyle.js/commit/bdabb71a28ed2e5f65087142cbb220220fe56aee)), closes [#662](https://github.com/vivliostyle/vivliostyle.js/issues/662)
- page display shakes horizontally when all pages finish loading ([18ab3c9](https://github.com/vivliostyle/vivliostyle.js/commit/18ab3c9c03592f7339392460409a1994db42f2af)), closes [#663](https://github.com/vivliostyle/vivliostyle.js/issues/663)
- SyntaxError: Invalid regular expression: invalid group specifier name, on Safari ([3a70707](https://github.com/vivliostyle/vivliostyle.js/commit/3a70707899194a8b63a8461fa323d929120aabd5)), closes [#664](https://github.com/vivliostyle/vivliostyle.js/issues/664)

## [2.1.2](https://github.com/vivliostyle/vivliostyle.js/compare/v2.1.2-pre.5...v2.1.2) (2020-09-28)

**Note:** Version bump only for package vivliostyle

## [2.1.2-pre.5](https://github.com/vivliostyle/vivliostyle.js/compare/v2.1.2-pre.4...v2.1.2-pre.5) (2020-09-28)

### Bug Fixes

- Relative URLs in pub-manifest are not resolved properly when the pub-manifest is linked from HTML elsewhere ([b6fe7c1](https://github.com/vivliostyle/vivliostyle.js/commit/b6fe7c11e84094a2abc12db6950862e205760e6c)), closes [#661](https://github.com/vivliostyle/vivliostyle.js/issues/661)
- TOC is not enabled when TOC exists in HTML but is not specified in the manifest ([ea280a1](https://github.com/vivliostyle/vivliostyle.js/commit/ea280a1a4b0d8e2868b4eca260f45695f9302511)), closes [#659](https://github.com/vivliostyle/vivliostyle.js/issues/659)

## [2.1.2-pre.4](https://github.com/vivliostyle/vivliostyle.js/compare/v2.1.2-pre.3...v2.1.2-pre.4) (2020-09-27)

### Bug Fixes

- "404 Not Found" error message does not appear when bookMode=true ([43b137c](https://github.com/vivliostyle/vivliostyle.js/commit/43b137cc8d7a40f602ca74fef50fb5698f436bbd)), closes [#660](https://github.com/vivliostyle/vivliostyle.js/issues/660)

## [2.1.2-pre.3](https://github.com/vivliostyle/vivliostyle.js/compare/v2.1.2-pre.2...v2.1.2-pre.3) (2020-09-25)

**Note:** Version bump only for package vivliostyle

## [2.1.2-pre.2](https://github.com/vivliostyle/vivliostyle.js/compare/v2.1.2-pre.1...v2.1.2-pre.2) (2020-09-25)

### Bug Fixes

- improve error messages when failed to load, wrongly mentioning CORS problem ([55843cf](https://github.com/vivliostyle/vivliostyle.js/commit/55843cf0ee6dff9ccda79255ed402693354d06ca)), closes [#638](https://github.com/vivliostyle/vivliostyle.js/issues/638)

## [2.1.2-pre.1](https://github.com/vivliostyle/vivliostyle.js/compare/v2.1.2-pre.0...v2.1.2-pre.1) (2020-09-24)

### Bug Fixes

- 'start' and 'value' attributes on OL and LI elements are ignored ([0aea654](https://github.com/vivliostyle/vivliostyle.js/commit/0aea654032e532d0613da777731a1c0482f4387b)), closes [#654](https://github.com/vivliostyle/vivliostyle.js/issues/654)
- Error occurs by links to external site in TOC ([fd4af3e](https://github.com/vivliostyle/vivliostyle.js/commit/fd4af3e830b736d0387479d562e746c3e0603078)), closes [#657](https://github.com/vivliostyle/vivliostyle.js/issues/657)
- HTML 'hidden' attribute is ignored ([bf51734](https://github.com/vivliostyle/vivliostyle.js/commit/bf5173495959a8b34376566bfeaca8cd234ed35a)), closes [#653](https://github.com/vivliostyle/vivliostyle.js/issues/653)
- Style elements in the body element should not be ignored ([d8603c3](https://github.com/vivliostyle/vivliostyle.js/commit/d8603c319ab065786fd3afeb0c7da0f1beb4c5e9)), closes [#655](https://github.com/vivliostyle/vivliostyle.js/issues/655)
- TOC element with 'hidden' attribute should be hidden in the page but visible in TOC panel ([19d8f62](https://github.com/vivliostyle/vivliostyle.js/commit/19d8f62a4c689c955e374db39b76f2b956457431))

## [2.1.2-pre.0](https://github.com/vivliostyle/vivliostyle.js/compare/v2.1.1...v2.1.2-pre.0) (2020-09-18)

### Bug Fixes

- EPUBCFI with %-encoded characters not working ([309ab42](https://github.com/vivliostyle/vivliostyle.js/commit/309ab4282f163b3239c03aaf4013bf20b4684463)), closes [#650](https://github.com/vivliostyle/vivliostyle.js/issues/650)
- Internal links not working when the URL fragment has %-encoded characters ([f12e9c5](https://github.com/vivliostyle/vivliostyle.js/commit/f12e9c51a5f19356d24d258b7142cee497d61bb3)), closes [#649](https://github.com/vivliostyle/vivliostyle.js/issues/649)
- Reloading causes unexpected move to the previous page ([8f872e1](https://github.com/vivliostyle/vivliostyle.js/commit/8f872e1d0ae1dc7421a2d7a70d0dad96854b00d4)), closes [#651](https://github.com/vivliostyle/vivliostyle.js/issues/651)

## [2.1.1](https://github.com/vivliostyle/vivliostyle.js/compare/v2.1.0...v2.1.1) (2020-06-30)

### Bug Fixes

- only generate commonjs ([08f6410](https://github.com/vivliostyle/vivliostyle.js/commit/08f64109a9a7ef485b0b8d783f2c0f3f969a1151))

## [2.1.0](https://github.com/vivliostyle/vivliostyle.js/compare/v2.1.0-pre.3...v2.1.0) (2020-06-30)

**Note:** Version bump only for package vivliostyle

## [2.1.0-pre.3](https://github.com/vivliostyle/vivliostyle.js/compare/v2.1.0-pre.2...v2.1.0-pre.3) (2020-06-30)

### Bug Fixes

- change epage type to number ([a059d11](https://github.com/vivliostyle/vivliostyle.js/commit/a059d1156d2bd10fc3dbc902ee1c128620c46e2b))

## [2.1.0-pre.2](https://github.com/vivliostyle/vivliostyle.js/compare/v2.1.0-pre.1...v2.1.0-pre.2) (2020-06-30)

**Note:** Version bump only for package vivliostyle

## [2.1.0-pre.1](https://github.com/vivliostyle/vivliostyle.js/compare/v2.1.0-pre.0...v2.1.0-pre.1) (2020-06-30)

### Bug Fixes

- simplify build dep graph ([8b5467d](https://github.com/vivliostyle/vivliostyle.js/commit/8b5467df34c784b399f051e04f796917a13e91d7))
- **core:** main prop ([234879a](https://github.com/vivliostyle/vivliostyle.js/commit/234879aa2dab028db37af0b124d07170a8020d1d))
- **core:** move resources ([1ad7bef](https://github.com/vivliostyle/vivliostyle.js/commit/1ad7beff99bb339ff2635792c232f99a9117e723))
- **react:** properly handle epage ([65b2a2c](https://github.com/vivliostyle/vivliostyle.js/commit/65b2a2c439dbe7e0e7a65ed6decb9f351e67157b))

### Features

- **react:** support all documentOptions ([9408681](https://github.com/vivliostyle/vivliostyle.js/commit/940868170a2caa117104414ff772da0a52d29c2b))
- support userStyleSheet and authorStyleSheet ([b0a68ca](https://github.com/vivliostyle/vivliostyle.js/commit/b0a68ca4517c67ede042fbda3b953a9a73eb50c8))
- **react:** add renderer ([3eb027b](https://github.com/vivliostyle/vivliostyle.js/commit/3eb027b5e231386cd23430d192741a9eda330c2c))
- **react:** implement Renderer component ([49afd58](https://github.com/vivliostyle/vivliostyle.js/commit/49afd58e5a5a8434516502790fedfae6988c16b5))
- **react:** page navigation ([4b39a9b](https://github.com/vivliostyle/vivliostyle.js/commit/4b39a9b7854a1397da566229394d73c1d7033f06))
- **react:** VivliostyleViewer component ([b857860](https://github.com/vivliostyle/vivliostyle.js/commit/b85786010211f5f62c1159c4241bd82cc3f8644d))

## [2.1.0-pre.0](https://github.com/vivliostyle/vivliostyle.js/compare/v2.0.0...v2.1.0-pre.0) (2020-05-13)

### Bug Fixes

- epub metadata sorts and uses "scheme" correctly ([301e5b4](https://github.com/vivliostyle/vivliostyle.js/commit/301e5b43d4b3349975085d26e096df73d7cf5258))
- improve type safety of epub metadata parsing ([b4dc5e2](https://github.com/vivliostyle/vivliostyle.js/commit/b4dc5e2319834f67a600afe2cd2780c573e1303c))

### Features

- add core viewer method to export the toc ([f080aa5](https://github.com/vivliostyle/vivliostyle.js/commit/f080aa54b70b8cf06a52bdd98f4e7fa29414fe83))
- add core viewer methods to export metadata ([d4f700c](https://github.com/vivliostyle/vivliostyle.js/commit/d4f700c33e2421a8032f5454aab6adb252e29f34))
- support reading role properties from epub metadata ([955d01d](https://github.com/vivliostyle/vivliostyle.js/commit/955d01d99db974f44f9d8c00d6e1b5e55b9cc3f8))

## [2.0.0](https://github.com/vivliostyle/vivliostyle.js/compare/v2.0.0-pre.13...v2.0.0) (2020-04-03)

**Note:** Version bump only for package vivliostyle

## [2.0.0-pre.13](https://github.com/vivliostyle/vivliostyle.js/compare/v2.0.0-pre.12...v2.0.0-pre.13) (2020-04-02)

**Note:** Version bump only for package vivliostyle

## [2.0.0-pre.12](https://github.com/vivliostyle/vivliostyle.js/compare/v2.0.0-pre.11...v2.0.0-pre.12) (2020-04-02)

### Bug Fixes

- use generics for setTimeout ([9cedc74](https://github.com/vivliostyle/vivliostyle.js/commit/9cedc7486e6c3508f0f406be6bd025667d338c20))

## [2.0.0-pre.11](https://github.com/vivliostyle/vivliostyle.js/compare/v2.0.0-pre.10...v2.0.0-pre.11) (2020-04-01)

**Note:** Version bump only for package vivliostyle

## [2.0.0-pre.10](https://github.com/vivliostyle/vivliostyle.js/compare/v2.0.0-pre.9...v2.0.0-pre.10) (2020-03-26)

### Features

- update "start-webserver" and add "start-viewer" scripts/batch files ([b4ac9ea](https://github.com/vivliostyle/vivliostyle.js/commit/b4ac9eaffd4980cf69440327ccf25499b7420d96))

## [2.0.0-pre.9](https://github.com/vivliostyle/vivliostyle.js/compare/v2.0.0-pre.8...v2.0.0-pre.9) (2020-03-20)

**Note:** Version bump only for package vivliostyle

## [2.0.0-pre.8](https://github.com/vivliostyle/vivliostyle.js/compare/v2.0.0-pre.7...v2.0.0-pre.8) (2020-03-16)

### Features

- update Vivliostyle logo images ([cea5822](https://github.com/vivliostyle/vivliostyle.js/commit/cea58226c97e2cc4a84d6af57d566fbdf722579b))
- **viewer:** new URL parameters ([1fe081c](https://github.com/vivliostyle/vivliostyle.js/commit/1fe081cf6df45338f83725d6d9dc027fd5dc5343)), closes [#628](https://github.com/vivliostyle/vivliostyle.js/issues/628)

## [2.0.0-pre.7](https://github.com/vivliostyle/vivliostyle.js/compare/v2.0.0-pre.6...v2.0.0-pre.7) (2020-01-03)

### Bug Fixes

- "Received an empty response" error on web servers that don't know XHTML MIME type ([6e7c6ba](https://github.com/vivliostyle/vivliostyle.js/commit/6e7c6ba5cd871d98d0177bdcdf29b2fa14788315))
- **core:** TypeError: Cannot read property 'cell' of undefined ([0598e6c](https://github.com/vivliostyle/vivliostyle.js/commit/0598e6c2cc4ae11f8612346e95098bbe3f531d52)), closes [#623](https://github.com/vivliostyle/vivliostyle.js/issues/623)

## [2.0.0-pre.6](https://github.com/vivliostyle/vivliostyle.js/compare/v2.0.0-pre.5...v2.0.0-pre.6) (2019-12-23)

**Note:** Version bump only for package vivliostyle

## [2.0.0-pre.5](https://github.com/vivliostyle/vivliostyle.js/compare/v2.0.0-pre.4...v2.0.0-pre.5) (2019-12-23)

### Bug Fixes

- document links ([ce486d9](https://github.com/vivliostyle/vivliostyle.js/commit/ce486d94da6dd6816a169c3765c6b2ae7e4106b5))
- export PrintConfig ([f6d21b3](https://github.com/vivliostyle/vivliostyle.js/commit/f6d21b360fc9a1625f534a3a298fcdaf7d621b4b))
- version typo ([deb3c17](https://github.com/vivliostyle/vivliostyle.js/commit/deb3c178360eb8ab3acd5e0686ff005ac4e3630a))

## [2.0.0-pre.1](https://github.com/vivliostyle/vivliostyle.js/compare/v2.0.0-pre.0...v2.0.0-pre.1) (2019-12-15)

**Note:** Version bump only for package vivliostyle

## 2019.11.100-pre - 2019-11-26

### Fixed

- Fix error on logical border shorthand properties
  - <https://github.com/vivliostyle/vivliostyle.js/pull/561>
- Fix bug: Internal links don't work when publication URL has ".html"
  - <https://github.com/vivliostyle/vivliostyle.js/pull/558>
- Fix bug: Links to document with Vivliostyle Viewer with relative URL don't work
  - <https://github.com/vivliostyle/vivliostyle.js/pull/560>

### Changed

- Source code and build
  - Change directory structure <https://github.com/vivliostyle/vivliostyle.js/pull/552>
  - [Viewer UI]
    - Convert src/js to TypeScript <https://github.com/vivliostyle/vivliostyle-ui/pull/79>
    - Replace compass to Sass <https://github.com/vivliostyle/vivliostyle-ui/pull/76>
    - Introduce Stylelint https://github.com/vivliostyle/vivliostyle-ui/pull/77>
    - Introduce ESLint <https://github.com/vivliostyle/vivliostyle-ui/pull/75>
    - Introduce prettier <https://github.com/vivliostyle/vivliostyle-ui/pull/72> <https://github.com/vivliostyle/vivliostyle-ui/pull/73>, <https://github.com/vivliostyle/vivliostyle-ui/pull/80>

## [2019.8.101](https://github.com/vivliostyle/vivliostyle.js/releases/tag/2019.8.101) - 2019-08-20

### Fixed

- [Viewer UI] Fix error on keyboard navigation
  - <https://github.com/vivliostyle/vivliostyle-ui/commit/7a7db2c>
- Fix auto resize not working
  - <https://github.com/vivliostyle/vivliostyle.js/commit/2245bba4>, <https://github.com/vivliostyle/vivliostyle.js/commit/b833976e>

## [2019.8.100](https://github.com/vivliostyle/vivliostyle.js/releases/tag/2019.8.100) - 2019-08-16

### Changed

- Vivliostyle.js source code is now written in TypeScript
  - <https://github.com/vivliostyle/vivliostyle.js/pull/536>
  - See [Development](https://github.com/vivliostyle/vivliostyle.js/wiki/Development) and [Migration to TypeScript finished](https://github.com/vivliostyle/vivliostyle.js/tree/master/src/ts)
- Transpile to multiple targets, `lib/vivliostyle.min.js` for ES2018 and `lib/vivliostyle-es5.min.js` for ES5.
  - <https://github.com/vivliostyle/vivliostyle.js/pull/538>
- Resources such as UA stylesheets are no longer downloaded separately
  - <https://github.com/vivliostyle/vivliostyle.js/pull/537>
- Remove large sample files from the download package and the npm package
  - <https://github.com/vivliostyle/vivliostyle.js/commit/5c3becac>, <https://github.com/vivliostyle/vivliostyle.js/commit/245c9e7d>
  - The download package (vivliostyle-js-latest.zip) size was 6.8MB and now reduced to 1.4MB.
  - Vivliostyle sample files are moved from the vivliostyle.js repository to [vivliostyle_doc](https://github.com/vivliostyle/vivliostyle_doc) repository.

### Fixed

- Fix error "Failed to fetch a source document" with web publications on Microsoft Edge
  - <https://github.com/vivliostyle/vivliostyle.js/commit/1ed01afc>
- Fix error "empty response for EPUB OPF" on some web servers that don't know the MIME type for .opf
  - <https://github.com/vivliostyle/vivliostyle.js/commit/db8e9bcb>

## [2019.1.106](https://github.com/vivliostyle/vivliostyle.js/releases/tag/2019.1.106) - 2019-06-14

### Fixed

- Workaround for Firefox printing problem
  - <https://github.com/vivliostyle/vivliostyle.js/issues/525>
- Fix error occurring when `@page` size has vw/vh units
  - <https://github.com/vivliostyle/vivliostyle.js/commit/e1d7023c>

## [2019.1.105](https://github.com/vivliostyle/vivliostyle.js/releases/tag/2019.1.105) - 2019-04-23

### Fixed

- Fix again the bug that cannot load unzipped EPUB when directory listing is enabled on the server
  - <https://github.com/vivliostyle/vivliostyle.js/commit/5229e760>
- Fix bug that duplicate page margin box content appears at bottom of pages
  - <https://github.com/vivliostyle/vivliostyle.js/pull/515>
- Fix bug that the operator `!=` in `-epubx-expr()` causes CSS parser error and fails page generation
  - <https://github.com/vivliostyle/vivliostyle.js/commit/7ed551fa>
- Fix problem that some properties are ignored on page partition or margin box context
  - <https://github.com/vivliostyle/vivliostyle.js/commit/1b9d589c>
- Fix problem that `text-combine-upright: all` does not work on WebKit
  - <https://github.com/vivliostyle/vivliostyle.js/commit/e87924a2>

## [2019.1.103](https://github.com/vivliostyle/vivliostyle.js/releases/tag/2019.1.103) - 2019-04-05

### Fixed

- Fix problem that page background color is not painted in the bleed area
  - <https://github.com/vivliostyle/vivliostyle.js/commit/0fcba151>
- Fix problem that vw/vh units, calc(), -epubx-expr() are invalid on shorthand properties
  - <https://github.com/vivliostyle/vivliostyle.js/commit/779d0305>
- Fix problem that env(doc-title) etc. doesn't work when used as a part of the `content` property value list
  - <https://github.com/vivliostyle/vivliostyle.js/commit/b205b30d>
- Fix bug that TOC box is not properly generated when Adaptive Layout style sheet is used
  - <https://github.com/vivliostyle/vivliostyle.js/commit/62a96460>, <https://github.com/vivliostyle/vivliostyle.js/commit/fd1c3df9>, <https://github.com/vivliostyle/vivliostyle.js/commit/ec05c74b>
- Fix TOC box keyboard navigation: focus lost when closing a tree item without closing the sub tree items
  - <https://github.com/vivliostyle/vivliostyle.js/commit/71bec60d>
- Fix again the bug that cannot load unzipped EPUB when directory listing is enabled on the server
  - <https://github.com/vivliostyle/vivliostyle.js/commit/6cbe8244>
- Fix problem that resizing causes unexpected page move, first page to next.
  - <https://github.com/vivliostyle/vivliostyle.js/commit/34be45f9>
- Fix problem that page spread is not centered properly when left/right page widths differ
  - <https://github.com/vivliostyle/vivliostyle.js/commit/13829261>
- Fix problem that the specified viewport size (e.g. fixed EPUB's) causes wrong page resizing
  - <https://github.com/vivliostyle/vivliostyle.js/commit/e0e69664>, <https://github.com/vivliostyle/vivliostyle.js/commit/110203be>
- Fix problem that large images may disappear when printing with zero page margin
  - <https://github.com/vivliostyle/vivliostyle.js/pull/514>
- [Viewer UI] Fix problem that the default page size auto is not respected when print to PDF
  - <https://github.com/vivliostyle/vivliostyle-ui/commit/fff481c>
- [Viewer UI] Fix userStyle CSS parsing and encoding problems
  - <https://github.com/vivliostyle/vivliostyle-ui/commit/1c469a8>, <https://github.com/vivliostyle/vivliostyle-ui/commit/c98331e>, <https://github.com/vivliostyle/vivliostyle.js/commit/60fb2106>

### Changed

- Support color name 'rebeccapurple'
  - <https://github.com/vivliostyle/vivliostyle.js/commit/d329ff08>
- [Viewer UI] Change the order to hide the menu buttons on small screen
  - <https://github.com/vivliostyle/vivliostyle-ui/commit/d47fbf7>
- [Viewer UI] Adjust FontSize decrease/increase values effective on Text:Smaller/Larger buttons
  - <https://github.com/vivliostyle/vivliostyle-ui/commit/437e488>
- [Viewer UI] Improve "fontSize" URL parameter: accept percent and fraction
  - <https://github.com/vivliostyle/vivliostyle-ui/commit/015a193>

## [2019.1.102](https://github.com/vivliostyle/vivliostyle.js/releases/tag/2019.1.102) - 2019-03-04

### Fixed

- Fix bug that cannot load unzipped EPUB when directory listing is enabled on the server
  - <https://github.com/vivliostyle/vivliostyle.js/commit/6d741b35>

## [2019.1.101](https://github.com/vivliostyle/vivliostyle.js/releases/tag/2019.1.101) - 2019-02-27

### Added

- TOC (Table of Contents) navigation is now enabled
  - <https://github.com/vivliostyle/vivliostyle.js/pull/498>, <https://github.com/vivliostyle/vivliostyle.js/pull/511>
  - TOC box generation is enabled when `#b=` Viewer parameter (= Viewer.loadPublication() function) is used, and the publication has TOC data. In HTML documents, TOC is marked up with e.g. `<nav role="doc-toc">`. Vivliostyle recognizes element that is selected with CSS selector `[role=doc-toc], [role=directory], nav li, .toc, #toc` as a TOC element.
  - [Viewer UI] <https://github.com/vivliostyle/vivliostyle-ui/pull/62>
- Support Web Publications and similar multi-HTML documents
  - <https://github.com/vivliostyle/vivliostyle.js/pull/511>
  - Supported document types with `#b=` Viewer parameter (= Viewer.loadPublication() function):
    - Unzipped EPUB
      - URL of the OPF file can be specified as well as the top directory of the unzipped EPUB files.
    - Web publication (a collection of HTML documents with reading order)
      - URL of the primary entry page or manifest file can be specified.
      - For the format of Web publication manifest, W3C draft [Web Publications](https://w3c.github.io/wpub/) and [Readium Web Publication Manifest](https://github.com/readium/webpub-manifest/) are supported.
    - (X)HTML document
      - When (X)HTML document URL is specified, the URL is treated as primary entry page's, and a series of HTML files are automatically loaded.
        - When the web publication manifest is specified in the primary entry page (X)HTML document, the readingOrder in the manifest is used.
        - If manifest is not specified or "readingOrder" is not in the manifest, the (X)HTML documents linked from the TOC element that is selected with CSS selector `[role=doc-toc], [role=directory], nav li, .toc, #toc` are loaded.
- Support loading documents from GitHub and some specific URLs
  - <https://github.com/vivliostyle/vivliostyle.js/pull/499>, <https://github.com/vivliostyle/vivliostyle.js/pull/505>, <https://github.com/vivliostyle/vivliostyle.js/commit/3424d965>
  - GitHub and Gist URLs can be directly specified. Vivliostyle loads raw github/gist content when github/gist URL is specified.
  - Aozorabunko ([青空文庫](https://www.aozora.gr.jp/)) (X)HTML URL can be specified. Vivliostyle loads Aozorabunko's raw github content when Aozorabunko (X)HTML URL is specified.
  - JS Bin URL is converted to JS Bin output URL and can be loaded. This is useful for testing Vivliostyle output from small HTML + CSS code, as well as Gist.
- Publication title and individual HTML document title are now passed to viewer UI
  - https://github.com/vivliostyle/vivliostyle.js/pull/501
  - [Viewer UI] Reflects viewing document title to the web page title.
    - <https://github.com/vivliostyle/vivliostyle-ui/pull/61>
- `env(pub-title)` and `env(doc-title)` environment variables for page headers with publication/document titles
  - <https://github.com/vivliostyle/vivliostyle.js/pull/512>
  - Spec: [CSS Environment Variables Module Level 1](https://drafts.csswg.org/css-env/) defines `env()` function, but `env(pub-title)` and `env(doc-title)` are not yet defined so far.
  - `env(pub-title)`: publication title = EPUB, Web publication, or primary entry page HTML title. Enabled when `#b=` Viewer parameter (= Viewer.loadPublication() function) is used.
  - `env(doc-title)`: document title = HTML title, which may be chapter or section title in a publication composed of multiple HTML documents
  - When title data are not found, i.e. no `<title>` element in HTML, or env(pub-title) with `#x=` Viewer parameter (= Viewer.loadDocument() function), the empty string "" is returned.
- Viewport-percentage length units: vw, vh, vi, vb, vmin, vmax, and page-size-percentage units pvw, pvh, pvi, pvb, pvmin, pvmax
  - <https://github.com/vivliostyle/vivliostyle.js/pull/507>
  - Spec: [CSS Values and Units - Viewport-percentage lengths](https://drafts.csswg.org/css-values/#viewport-relative-lengths), but page-size-percentage units are not defined so far.
  - Note: On paged media context, the viewport-percentage units vw, vh, vi, vb, vmin, vmax are relative to the size of the page area, i.e., the content area of a page box and not including margin, border and padding specified on `@page` rule. This makes a lot of sense, but page size relative units may also be necessary. The pvw, pvh, pvi, pvb, pvmin, pvmax units are similar to the vw, vh, vi, vb, vmin, vmax but the reference size is the page size including page margins.
- Support CSS `calc()` function
  - <https://github.com/vivliostyle/vivliostyle.js/pull/507>
  - Spec: [CSS Values and Units - Mathematical Expressions](https://drafts.csswg.org/css-values/#calc-notation)
  - In addition to `calc()` function, `min()` and `max()` functions can be used inside `calc()` function.
  - Limitation: Percentage value in `calc()` is not calculated correctly
    - This `calc()` implementation is made simply reusing [Adaptive Layout `-epubx-expr()` function](http://www.idpf.org/epub/pgt/#s2.1), so there are some limitations for now.
- [Viewer UI] New "User Style Preferences" in the Settings panel
  - <https://github.com/vivliostyle/vivliostyle-ui/pull/64>
  - New settings: Page Margins, Page Breaks (widows/orphans), Images, Text (base font-size, line-height, font-family)
  - User style CSS code is shown and editable in "CSS Details" box
  - User style CSS is saved in the URL parameter `userStyle=data:,/*<viewer>*/`…`/*</viewer>*/` and not disappear when reloading, and can be bookmarked in browser.
  - "Font size (%)" reflects the ViewerOptions.fontSize that can be increase/decrease with "Text: larger/smaller" buttons, and this setting is saved in the new URL parameter `fontSize=`.
- [Viewer UI] Vivliostyle Viewer start page with document URL input and usage description
  - <https://github.com/vivliostyle/vivliostyle-ui/pull/65>
  - When document URL parameter (`#b=` or `#x=`) is not specified, the start page is now displayed.
  - Document URL entered by user is reflected in the URL parameter `#b=`, and 　 when the Enter key is pressed, the document is loaded.

### Changed

- Render All Pages (On/Off) setting
  - <https://github.com/vivliostyle/vivliostyle.js/pull/497>
  - On: for Print (all pages printable, page count works as expected)
  - Off: for Read (quick loading with rough page count) -- This mode is necessary for viewing large publication composed of a lot of HTML documents.
  - [Viewer UI] <https://github.com/vivliostyle/vivliostyle-ui/pull/60>, <https://github.com/vivliostyle/vivliostyle-ui/pull/61>
    - This setting can be specified in setting panel and URL parameter `renderAllPages=[true|false]`.
    - The default setting is `renderAllPages=false` for `#b=` (Book view) and `renderAllPages=true` for `#x=` (individual (X)HTML document).
- Enabled 'vivliostyle' media type by default
  - <https://github.com/vivliostyle/vivliostyle.js/pull/500>
  - This can be used like 'print' media type, and useful for distinguish Vivliostyle specific style sheets from general print style sheets.
- Added style rule `h1,h2,h3,h4,h5,h6 { break-after: avoid; }` to the default style sheet to avoid page/column breaks after headings by default.
  - <https://github.com/vivliostyle/vivliostyle.js/commit/39421943>
- Removed the workaround for Microsoft Edge's `text-justify: inter-ideograph` problem
  - <https://github.com/vivliostyle/vivliostyle.js/commit/457b5795>
- Improved error messages when document loading failed.
  - <https://github.com/vivliostyle/vivliostyle.js/pull/511>, <https://github.com/vivliostyle/vivliostyle.js/commit/c2df75fb>
- Renamed the function corresponding the `#b=` Viewer parameter, `loadEPUB()` to `loadPublication()`, that is now not only for EPUB.
  - <https://github.com/vivliostyle/vivliostyle.js/commit/7e909f99>

### Fixed

- Fix bug that media attribute is not honored on `<style>` element.
  - <https://github.com/vivliostyle/vivliostyle.js/commit/35bea5e4>

## [2018.12.103](https://github.com/vivliostyle/vivliostyle.js/releases/tag/2018.12.103) - 2019-01-03

### Fixed

- Fix bug that ruby causes incorrect pagination
  - <https://github.com/vivliostyle/vivliostyle.js/pull/495>
- Fix bug on epubcfi failing to navigate to beginning of a spine item
  - <https://github.com/vivliostyle/vivliostyle.js/pull/494>
- Fix error occurring when inline-table is nested in another table
  - <https://github.com/vivliostyle/vivliostyle.js/pull/493>

### Changed

- [Viewer UI] UI adjustment
  - Setting panel "Apply" button now closes the panel
  - Enable "Previous Page", "Next Page", and "Text: Default Size" buttons when window is wide enough

## [2018.10.100](https://github.com/vivliostyle/vivliostyle.js/releases/tag/2018.10.100) - 2018-10-31

### Added

- [Viewer UI] Add "Go to Page" (Page number / Total pages) menu item
  - <https://github.com/vivliostyle/vivliostyle-ui/pull/59>
- Add navigateToNthPage function
  - <https://github.com/vivliostyle/vivliostyle.js/pull/459>

### Changed

- [Viewer UI] Navigation UI adjustment
  - Removed "Move: Previous/Next" navigation buttons
  - Hide "Zoom: Actual Size/Fit to screen" buttons when screen is narrow
  - Page left/right navigation UI color
- [Viewer UI] Disable page swipe when pinch-zoomed or horizontal scrollable
  - <https://github.com/vivliostyle/vivliostyle-ui/commit/a61688b5>
- Prevent unexpected page resizing (viewport-height change due to soft keyboard etc.) on Android/iOS
  - <https://github.com/vivliostyle/vivliostyle.js/commit/00f2be4e>

### Fixed

- Fix bug that EPUB internal link does not work
  - <https://github.com/vivliostyle/vivliostyle.js/pull/458>

## [2018.8.100](https://github.com/vivliostyle/vivliostyle.js/releases/tag/2018.8.100) - 2018-09-10

### Added

- Support CSS Logical properties
  - <https://github.com/vivliostyle/vivliostyle.js/pull/443>
  - Spec: [CSS Logical Properties and Values Level 1](https://www.w3.org/TR/css-logical-1/)
  - [Flow-Relative Box Model Properties](https://www.w3.org/TR/css-logical-1/#box) are supported except the `inset` shorthand property

### Changed

- The author is changed from Vivliostyle Inc. (<http://vivliostyle.com>) to Vivliostyle Foundation (<https://vivliostyle.org>)
  - <https://github.com/vivliostyle/vivliostyle.js/pull/410>, <https://github.com/vivliostyle/vivliostyle.js/commit/a3d866d8>, <https://github.com/vivliostyle/vivliostyle.js/commit/bc48f59c>
  - Note: The former company name Vivliostyle Inc. was changed to [Trim-marks Inc.](https://trim-marks.com) and that company holds copyright of the source code developed under the name of Vivliostyle Inc. (~2018.2). This open source Vivliostyle was a subset of the company's proprietary commercial products, which are now named “VersaType”.
- [Viewer UI] Page navigation UI improvement
  - <https://github.com/vivliostyle/vivliostyle-ui/pull/55>, <https://github.com/vivliostyle/vivliostyle-ui/pull/56>
  - Swipe support on touch devices
  - Cmd+Up and Cmd+Down keys for First page and Last page, for Mac, same as Home/End keys on PC
  - Add buttons for move to first/last page
  - Hide the previous/next page arrow when there's no previous/next page.
- [Viewer UI] Omit `&f=epubcfi(/2!)` in URL at first page
  - <https://github.com/vivliostyle/vivliostyle-ui/pull/58>
- Set the viewer print margin default to 0
  - <https://github.com/vivliostyle/vivliostyle.js/pull/442>
- Test platform change: IE11 to Microsoft Edge
  - <https://github.com/vivliostyle/vivliostyle.js/commit/5c71209a>
  - IE11 is no longer supported
- Update MathJax to 2.7.5
  - <https://github.com/vivliostyle/vivliostyle-ui/commit/8bdc64bf>

### Fixed

- Fix a bug that page spread view becomes incorrect when content doc's writing mode does not match the page-progression-direction in OPF
  - <https://github.com/vivliostyle/vivliostyle.js/pull/453>
- Fix a bug that stylesheet link element is ignored when class attribute exists
  - <https://github.com/vivliostyle/vivliostyle.js/pull/452>
- Fix a bug that writing mode specified on body didn't determine the root writing mode
  - <https://github.com/vivliostyle/vivliostyle.js/pull/451>
- Fix a bug that page spread view is weird when viewport width/height is specified
  - <https://github.com/vivliostyle/vivliostyle.js/issues/447>
- Fix a bug that `clear: both` on page floats causes "Error: Unexpected side: both".
  - <https://github.com/vivliostyle/vivliostyle.js/pull/445>
- Workaround for Microsoft Edge's `text-justify: inter-ideograph` problem
  - <https://github.com/vivliostyle/vivliostyle.js/commit/b620148e>
- [Viewer UI] Fix sticky hover effect on touch devices
  - <https://github.com/vivliostyle/vivliostyle-ui/pull/54>

## [2018.2](https://github.com/vivliostyle/vivliostyle.js/releases/tag/2018.2) - 2018-02-02 (Unreleased)

### Added

- Implement `pages` counter
  - <https://github.com/vivliostyle/vivliostyle.js/pull/367>
  - Spec: [CSS Paged Media Module Level 3 - Page-based counters](https://drafts.csswg.org/css-page/#page-based-counters)
- Support `clear: left/right/top/bottom/same/all` on page floats
  - <https://github.com/vivliostyle/vivliostyle.js/pull/378>
  - When a `clear` value is specified on a page float, it is placed so that it comes after any of preceding page floats.
  - `same` value means the same direction as one which the page float is floated to.
  - If a page float with `float: snap-block` would be placed at the block-start end but a `clear` value on it forbidden such placement, the float is instead placed at the block-end side (unless the `clear` value also forbidden such placement).
- Support `column-fill` property
  - <https://github.com/vivliostyle/vivliostyle.js/pull/387>
  - Spec: [CSS Multi-column Layout Module Level 1 - column-fill](https://drafts.csswg.org/css-multicol/#cf)
- Add support for `break-word` value of `word-break` property
  - <https://github.com/vivliostyle/vivliostyle.js/pull/409>
  - Spec: [CSS Text Module Level 3 - Breaking Rules for Letters: the word-break property](https://www.w3.org/TR/css-text-3/#word-break-property)
- Add (non-standard) `float-min-wrap-block` property to control text wrapping around page floats
  - <https://github.com/vivliostyle/vivliostyle.js/pull/382>

### Changed

- Avoid text wrapping around fragmented page floats
  - <https://github.com/vivliostyle/vivliostyle.js/pull/379>

### Fixed

- Fix a bug that a bottom margin on a page float is not taken into account when the float has a bottom padding or border
  - <https://github.com/vivliostyle/vivliostyle.js/pull/376>
- Fix a bug that `box-decoration-break: clone` makes a block incorrectly overflow
  - <https://github.com/vivliostyle/vivliostyle.js/pull/377>
- Avoid invalid fragmentation occurring between an edge of a block container and its child
  - <https://github.com/vivliostyle/vivliostyle.js/pull/383>
- Fix a bug that a table is not fragmented correctly
  - <https://github.com/vivliostyle/vivliostyle.js/pull/386>
- Fix a bug that a float inside an element with position:relative is positioned incorrectly
  - <https://github.com/vivliostyle/vivliostyle.js/pull/388>
- Fix a bug that a table is occasionally fragmented immediately before the end of it
  - <https://github.com/vivliostyle/vivliostyle.js/pull/397>
- Avoid printing bug on Gecko
  - <https://github.com/vivliostyle/vivliostyle.js/pull/385>
- Avoid printing bug on Blink
  - <https://github.com/vivliostyle/vivliostyle.js/pull/394>
- Fix incorrect justification when a positive `text-indent` is specified
  - <https://github.com/vivliostyle/vivliostyle.js/pull/396>
- Fix display of `mglyph` element of MathML
  - <https://github.com/vivliostyle/vivliostyle.js/pull/407>
- Fix a bug that order of page floats is sometimes incorrect
  - <https://github.com/vivliostyle/vivliostyle.js/pull/408>

## [2017.6](https://github.com/vivliostyle/vivliostyle.js/releases/tag/2017.6) - 2017-06-22

### Added

- Implement `repeat-on-break` property
  - <https://github.com/vivliostyle/vivliostyle.js/pull/323>
  - Spec proposal: [CSS Repeated Headers and Footers](https://specs.rivoal.net/css-repeat/)
- Support `float: snap-block`
  - <https://github.com/vivliostyle/vivliostyle.js/pull/344>
  - Spec: [CSS Page Floats - The float property](https://drafts.csswg.org/css-page-floats/#valdef-float-snap-block)
  - Note that the function value `snap-block()` is not supported yet.
  - Also note that behavior of this value is different from that defined in the above spec: The element always turns into a page float regardless of its distance from edges of its float reference. It is snapped to the nearer edge of the float reference.
- Support `clear: all` for block-level boxes
  - <https://github.com/vivliostyle/vivliostyle.js/pull/345>
  - Note that `all` is only effective on block-level boxes (i.e. not page floats).
  - When `all` is specified, the block-start edge of the box gets pushed down so that the edge comes after any block-start/block-end page float of which anchors are before the box in the document order.
- Add support for `::nth-fragment()` pseudo-element selector
  - Spec: [CSS Overflow Module Level 4 - Fragmen styling](https://drafts.csswg.org/css-overflow-4/#fragment-styling)
- Add support for `::after-if-continues` pseudo-element
- Support `footnote-policy: line`
  - Spec: [CSS Generated Content for Paged Media Module Level 3 - Rendering footnotes and footnote policy](https://www.w3.org/TR/css-gcpm-3/#propdef-footnote-policy)

### Changed

- Place footnotes at the bottom of pages (or regions) rather than columns
  - <https://github.com/vivliostyle/vivliostyle.js/pull/343>
- Disable hyphenation by default
  - <https://github.com/vivliostyle/vivliostyle.js/pull/363>

### Fixed

- Fix footnote layout bugs
  - <https://github.com/vivliostyle/vivliostyle.js/pull/332>
- Fix justification bugs
  - <https://github.com/vivliostyle/vivliostyle.js/pull/356>
  - <https://github.com/vivliostyle/vivliostyle.js/pull/357>
  - <https://github.com/vivliostyle/vivliostyle.js/pull/358>
- Fix problem that content sometimes overflows a partition instead of being deferred to the next partition
  - <https://github.com/vivliostyle/vivliostyle.js/pull/361>
  - <https://github.com/vivliostyle/vivliostyle.js/pull/362>

## [2017.2](https://github.com/vivliostyle/vivliostyle.js/releases/tag/2017.2) - 2017-02-22

### Added

- Add support for Compositing and Blending Level 1
  - <https://github.com/vivliostyle/vivliostyle.js/issues/148>
  - Spec: [Compositing and Blending Level 1](https://drafts.fxtf.org/compositing-1/)
- pseudo element or page margin box with `content:url()` behave as a replaced element
  - Spec: [Inserting and replacing content with the content property](https://drafts.csswg.org/css-content/#content-property)
- Experimental support of CSS Page Floats and `column-span`
  - <https://github.com/vivliostyle/vivliostyle.js/pull/324>
  - Spec: [CSS Page Floats](https://drafts.csswg.org/css-page-floats/)
  - Spec: [CSS Multi-column Layout Module Level 2 - `column-span`](https://drafts.csswg.org/css-multicol-2/#column-span)

### Changed

- Change license to AGPL 3.0
  - <https://github.com/vivliostyle/vivliostyle.js/pull/329>

### Fixed

- Fix incorrect page breaking at boundaries of inline-block boxes
  - <https://github.com/vivliostyle/vivliostyle.js/pull/309>
- Improve page/column breaking inside tables
  - <https://github.com/vivliostyle/vivliostyle.js/pull/311>
  - Following issues are resolved:
    - Table cell with rowspan disappears after page break
      - https://github.com/vivliostyle/vivliostyle.js/issues/85
    - Table (column) width should not change over page breaks
      - https://github.com/vivliostyle/vivliostyle.js/issues/157
    - Table breaks occur between the colgroup and the first row
      - https://github.com/vivliostyle/vivliostyle.js/issues/279
- Fix incorrect treatment of percentage value for line-height property
  - <https://github.com/vivliostyle/vivliostyle.js/pull/312>
- Support repeating table header/footer across pages
  - <https://github.com/vivliostyle/vivliostyle.js/pull/319>
- Fix incorrect widows behavior with footnote call close to the end of the page
  - <https://github.com/vivliostyle/vivliostyle.js/pull/328>

## [2016.10](https://github.com/vivliostyle/vivliostyle.js/releases/tag/2016.10) - 2016-10-25

### Added

- Additional author style sheets can be injected with 'styleSheet' property of `vivliostyle.viewer.DocumentOptions`.
  - <https://github.com/vivliostyle/vivliostyle.js/pull/282>
- Support [Scalable Vector Graphics (SVG) 2](https://www.w3.org/TR/SVG2/) properties.
  - [color-interpolation](https://www.w3.org/TR/SVG2/painting.html#ColorInterpolationProperty)
  - [color-rendering](https://www.w3.org/TR/SVG2/painting.html#ColorRenderingProperty)
  - [fill](https://www.w3.org/TR/SVG2/painting.html#FillProperty)
  - [fill-opacity](https://www.w3.org/TR/SVG2/painting.html#FillOpacityProperty)
  - [fill-rule](https://www.w3.org/TR/SVG2/painting.html#FillRuleProperty)
  - [glyph-orientation-vertical](https://www.w3.org/TR/SVG2/text.html#GlyphOrientationVerticalProperty)
  - [image-rendering](https://www.w3.org/TR/SVG2/painting.html#ImageRenderingProperty)
  - [marker](https://www.w3.org/TR/SVG2/painting.html#MarkerProperty)
  - [marker-start](https://www.w3.org/TR/SVG2/painting.html#MarkerStartProperty)
  - [marker-mid](https://www.w3.org/TR/SVG2/painting.html#MarkerMidProperty)
  - [marker-end](https://www.w3.org/TR/SVG2/painting.html#MarkerEndProperty)
  - [pointer-events](https://www.w3.org/TR/SVG2/interact.html#PointerEventsProperty)
  - [paint-order](https://www.w3.org/TR/SVG2/painting.html#PaintOrderProperty)
  - [shape-rendering](https://www.w3.org/TR/SVG2/painting.html#ShapeRenderingProperty)
  - [stop-color](https://www.w3.org/TR/SVG2/pservers.html#StopColorProperty)
  - [stop-opacity](https://www.w3.org/TR/SVG2/pservers.html#StopOpacityProperty)
  - [stroke](https://www.w3.org/TR/SVG2/painting.html#StrokeProperty)
  - [stroke-dasharray](https://www.w3.org/TR/SVG2/painting.html#StrokeDasharrayProperty)
  - [stroke-dashoffset](https://www.w3.org/TR/SVG2/painting.html#StrokeDashoffsetProperty)
  - [stroke-linecap](https://www.w3.org/TR/SVG2/painting.html#StrokeLinecapProperty)
  - [stroke-linejoin](https://www.w3.org/TR/SVG2/painting.html#StrokeLinejoinProperty)
  - [stroke-miterlimit](https://www.w3.org/TR/SVG2/painting.html#StrokeMiterlimitProperty)
  - [stroke-opacity](https://www.w3.org/TR/SVG2/painting.html#StrokeOpacityProperty)
  - [stroke-width](https://www.w3.org/TR/SVG2/painting.html#StrokeWidthProperty)
  - [text-anchor](https://www.w3.org/TR/SVG2/text.html#TextAnchorProperty)
  - [text-rendering](https://www.w3.org/TR/SVG2/painting.html#TextRenderingProperty)
  - [vector-effect](https://www.w3.org/TR/SVG2/coords.html#VectorEffectProperty)
- Support [Scalable Vector Graphics (SVG) 1.1](https://www.w3.org/TR/SVG11/) properties.
  - [alignment-baseline](https://www.w3.org/TR/SVG11/text.html#AlignmentBaselineProperty)
  - [baseline-shift](https://www.w3.org/TR/SVG11/text.html#BaselineShiftProperty)
  - [dominant-baseline](https://www.w3.org/TR/SVG11/text.html#DominantBaselineProperty)
  - [mask](https://www.w3.org/TR/SVG11/masking.html#MaskProperty)
- Support [CSS Masking 1](https://drafts.fxtf.org/css-masking-1/) properties.
  - [clip-path](https://drafts.fxtf.org/css-masking-1/#the-clip-path)
  - [clip-rule](https://drafts.fxtf.org/css-masking-1/#the-clip-rule)
- Support [Filter Effects 1](https://www.w3.org/TR/filter-effects-1/) properties.
  - [flood-color](https://www.w3.org/TR/filter-effects-1/#propdef-flood-color)
  - [flood-opacity](https://www.w3.org/TR/filter-effects-1/#propdef-flood-opacity)
  - [lighting-color](https://www.w3.org/TR/filter-effects-1/#propdef-lighting-color)
- Support `font-stretch` property
  - Spec: [CSS Fonts Module Level 3 - font-stretch property](https://www.w3.org/TR/css-fonts-3/#propdef-font-stretch)

### Changed

- Introduce background layout and change event model
  - <https://github.com/vivliostyle/vivliostyle.js/pull/292>
- Improve zoom behavior
  - <https://github.com/vivliostyle/vivliostyle.js/pull/292>
- Add very simple 'auto spread' page view mode
  - <https://github.com/vivliostyle/vivliostyle.js/pull/300>

### Fixed

- Fix bug that pages occasionally disappear when resolving cross references
  - <https://github.com/vivliostyle/vivliostyle.js/pull/268>
- Respect `target="_blank"` on links to external URLs
  - <https://github.com/vivliostyle/vivliostyle.js/pull/269>
- Fix incorrect page breaks with cross references
  - <https://github.com/vivliostyle/vivliostyle.js/pull/271>
- Fix image-resolution behavior when max/min-width/height is specified in length (not percentage)
  - <https://github.com/vivliostyle/vivliostyle.js/pull/275>
- Fix image-resolution to take box-sizing into account
  - <https://github.com/vivliostyle/vivliostyle.js/issues/276>
- Fix cross reference bug with name attribute
  - <https://github.com/vivliostyle/vivliostyle.js/issues/278>
- Avoid error when `inherit` value is used
  - <https://github.com/vivliostyle/vivliostyle.js/pull/283>
- Avoid error when `rem` unit is used
  - <https://github.com/vivliostyle/vivliostyle.js/pull/283>
- Fix rem unit inside `position: relative` elements
  - <https://github.com/vivliostyle/vivliostyle.js/issues/242>
- Fix internally generated IDs on elements to conform to the XML specification
  - <https://github.com/vivliostyle/vivliostyle.js/pull/295>
  - Characters which can be used in an ID in an XML document is specified at <https://www.w3.org/TR/xml/#NT-NameStartChar>.

## [2016.7](https://github.com/vivliostyle/vivliostyle.js/releases/tag/2016.7) - 2016-07-04

### Added

- Support `filter` property
  - <https://github.com/vivliostyle/vivliostyle.js/issues/220>
  - Spec: [CSS Filter Effect Module Level 3 - filter property](https://www.w3.org/TR/filter-effects-1/#propdef-filter)
- Support string and URL values in `attr()` function
  - <https://github.com/vivliostyle/vivliostyle.js/pull/234>
  - Spec: [CSS Values and Units Module Level 3 - Attribute References: ???attr()???](https://drafts.csswg.org/css-values/#attr-notation)
- Support `left`/`right`/`recto`/`verso` values for `(page-)break-before`/`(page-)break-after`
  - <https://github.com/vivliostyle/vivliostyle.js/issues/25>
  - Spec: [CSS Fragmentation - Page Break Values](http://dev.w3.org/csswg/css-break/#page-break-values)
- Support cross references by `target-counter()`/`target-counters()`
  - <https://github.com/vivliostyle/vivliostyle.js/pull/248>
  - Spec: [CSS Generated Content Module Level 3 - Cross references and the target-\* functions](https://drafts.csswg.org/css-content/#cross-references)
- Support `box-decoration-break` property
  - <https://github.com/vivliostyle/vivliostyle.js/pull/250>
  - Spec: [CSS Fragmentation Module Level 3 - Fragmented Borders and Backgrounds: the box-decoration-break property](https://drafts.csswg.org/css-break/#break-decoration)
- Support `font-size-adjust` property
  - <https://github.com/vivliostyle/vivliostyle.js/pull/254>
  - Spec: [CSS Fonts Module Level 3 - Relative sizing: the font-size-adjust property](https://www.w3.org/TR/css-fonts-3/#font-size-adjust-prop)
- Support `counter-set` property
  - <https://github.com/vivliostyle/vivliostyle.js/pull/255>
  - Spec: [CSS Lists and Counters Module Level 3 - Automatic Numbering With Counters](https://drafts.csswg.org/css-lists-3/#propdef-counter-set)
- Support `image-resolution` property
  - <https://github.com/vivliostyle/vivliostyle.js/pull/260>
  - Spec: [CSS Image Values and Replaced Content Module Level 3 - Overriding Image Resolutions: the image-resolution property](https://drafts.csswg.org/css-images-3/#the-image-resolution)
  - Only `<resolution>` value is supported.
  - Only supported for content of `img`, `input[type=image]` and `video` (applied to poster images) elements and before/after pseudoelements. Other images such as background images, list images or border images are not supported.
  - The property is applied to vector images such as SVG, as well as raster images. This behavior is different from what the spec specifies.

### Changed

- `counter-reset` and `counter-increment` specified in a page master (`@-epubx-page-master`) are now effective to page-based counters
  - <https://github.com/vivliostyle/vivliostyle.js/pull/251>
  - Note that these values, if specified, always override values specified in page contexts.

### Fixed

- Fix a bug that `clear` is ignored when `white-space` property is used before the element
  - <https://github.com/vivliostyle/vivliostyle.js/pull/222>
- Fix incorrect float positioning
  - <https://github.com/vivliostyle/vivliostyle.js/issues/192>
- Fix incorrect float clearance
  - <https://github.com/vivliostyle/vivliostyle.js/issues/223>
- Fix incorrect text offset caused by float
  - <https://github.com/vivliostyle/vivliostyle.js/issues/226>
- Fix improper rendering of floats with relative width/height
  - <https://github.com/vivliostyle/vivliostyle.js/issues/37>
- Fix positioning when a float is specified `position: relative` or a float is inside an positioned element
  - <https://github.com/vivliostyle/vivliostyle.js/pull/240>
- Fix positioning when a float has a writing-mode value different from its container
  - <https://github.com/vivliostyle/vivliostyle.js/issues/192>
- Fix issue with floats inside an element with an `overflow` value other than `visible`
  - <https://github.com/vivliostyle/vivliostyle.js/issues/224>
- Fix issue that a `display` value was always set to `block` for a float, ignoring the original value
  - <https://github.com/vivliostyle/vivliostyle.js/issues/232>
- Fix layout when a float is wider than its containing block
  - <https://github.com/vivliostyle/vivliostyle.js/issues/233>
- Avoid error when an element with pseudoelements overflows its container
  - <https://github.com/vivliostyle/vivliostyle.js/pull/241>
- Fix handling of padding and border of a block fragmented by a page/column break
  - <https://github.com/vivliostyle/vivliostyle.js/pull/250>
- Fix layout of floats inside flex containers
  - <https://github.com/vivliostyle/vivliostyle.js/pull/253>
- Fix page break bug in vertical text on Firefox (partially)
  - <https://github.com/vivliostyle/vivliostyle.js/pull/263>

## [2016.4](https://github.com/vivliostyle/vivliostyle.js/releases/tag/2016.4) - 2016-04-08

### Added

- Support printer marks (`marks` property) and bleed area (`bleed` property)
  - <https://github.com/vivliostyle/vivliostyle.js/issues/98>
  - Spec: [CSS Paged Media Module Level 3 - Crop and Registration Marks: the 'marks' property](https://drafts.csswg.org/css-page/#marks), [Bleed Area: the 'bleed' property](https://drafts.csswg.org/css-page/#bleed)
  - Only effective when specified within an `@page` rule without page selectors.
- Support outline-offset
  - <https://github.com/vivliostyle/vivliostyle.js/issues/181>
  - Spec: [CSS Basic User Interface Module Level 3 (CSS3 UI) - outline-offset property](https://drafts.csswg.org/css-ui-3/#outline-offset)
- Support font-feature-settings
  - <https://github.com/vivliostyle/vivliostyle.js/issues/151>
  - Spec: [CSS Fonts Module Level 3 - font-feature-settings descriptors](https://drafts.csswg.org/css-fonts-3/#propdef-font-feature-settings)
- Support linear-gradient/radial-gradient
  - <https://github.com/vivliostyle/vivliostyle-formatter-issues/issues/35>
  - Spec: [CSS Image Values and Replaced Content Module - Gradients](https://drafts.csswg.org/css-images-3/#gradients)
- Support substring matching attribute selectors `^=`, `$=` and `*=`
  - <https://github.com/vivliostyle/vivliostyle.js/issues/196>
  - Spec: [Selectors Level 3 - Substring matching attribute selectors](https://www.w3.org/TR/css3-selectors/#attribute-substrings)
- Support `even`, `odd` and `an+b` arguments for `:nth-child()` pseudo-class selector
  - <https://github.com/vivliostyle/vivliostyle.js/issues/87>
  - <https://github.com/vivliostyle/vivliostyle.js/issues/163>
  - Spec: [Selectors Level 3 - :nth-child() pseudo-class](http://www.w3.org/TR/css3-selectors/#nth-child-pseudo)
- Support `:nth-last-child()`, `:nth-of-type()`, `:nth-last-of-type()`, `:last-child`, `:first-of-type`, `:last-of-type`, `:only-child` and `:only-of-type` pseudo-class selectors
  - <https://github.com/vivliostyle/vivliostyle.js/issues/86>
  - <https://github.com/vivliostyle/vivliostyle.js/issues/193>
  - <https://github.com/vivliostyle/vivliostyle.js/issues/194>
  - Spec: [Selectors Level 3 - Structural pseudo-classes](https://www.w3.org/TR/css3-selectors/#structural-pseudos)
- Support `:empty` pseudo-class selector
  - <https://github.com/vivliostyle/vivliostyle.js/pull/205>
  - Spec: [Selectors Level 3 - :empty pseudo-class](https://www.w3.org/TR/css3-selectors/#empty-pseudo)
- Support UI states selectors (`:checked`, `:enabled` and `:disabled`)
  - <https://github.com/vivliostyle/vivliostyle.js/pull/206>
  - <https://github.com/vivliostyle/vivliostyle.js/issues/197>
  - Spec: [Selectors Level 3 - The UI element states pseudo-classes](https://www.w3.org/TR/css3-selectors/#UIstates)
  - Note that the current implementation can use only initial states of those UI elements. Even if the actual state of the element is toggled by user interaction, the style does not change.
- Support `:not()` pseudo-class selector
  - <https://github.com/vivliostyle/vivliostyle.js/issues/195>
  - Spec: [Selectors Level 3 - The negation pseudo class](https://www.w3.org/TR/css3-selectors/#negation)
- Support TeX and AsciiMath mathematics
  - <https://github.com/vivliostyle/vivliostyle.js/issues/108>
  - In a element with `data-math-typeset="true"` attribute, you can use TeX or AsciiMath mathematics.
  - TeX mathematics are indicated by delimiters `\(...\)` or `$$...$$`.
  - AsciiMath mathematics are indicated by delimiters `` `...` ``.

### Fixed

- Lengths in 'rem' specified within page context are now interpreted correctly
  - <https://github.com/vivliostyle/vivliostyle.js/issues/109>
- Web fonts are now applied correctly even when specified within page context
  - <https://github.com/vivliostyle/vivliostyle.js/issues/58>
- Fix incorrect pagination caused by absolutely positioned element
  - <https://github.com/vivliostyle/vivliostyle.js/issues/158>
- Fix pagination problem with flex containers
  - <https://github.com/vivliostyle/vivliostyle.js/issues/174>
- Truncate margins at unforced page/column breaks
  - <https://github.com/vivliostyle/vivliostyle.js/issues/83>
  - Spec: [CSS Fragmentation Module Level 3 - Adjoining Margins at Breaks](https://drafts.csswg.org/css-break/#break-margins)
- box-shadow / text-shadow is now supported
  - <https://github.com/vivliostyle/vivliostyle.js/issues/156>
- Propagate and combine multiple break values at a single break point
  - <https://github.com/vivliostyle/vivliostyle.js/issues/129>
  - Spec: [CSS Fragmentation Module Level 3 - Forced Breaks](https://drafts.csswg.org/css-break/#forced-breaks)
- Fix problematic handling of prefixed properties
  - <https://github.com/vivliostyle/vivliostyle.js/issues/209>, <https://github.com/vivliostyle/vivliostyle.js/issues/210>
- Fix `rem` calculation when `font-size` is specified to the `body` element
  - <https://github.com/vivliostyle/vivliostyle.js/pull/217>

## [2016.1](https://github.com/vivliostyle/vivliostyle.js/releases/tag/2016.1) - 2016-01-20

### Added

- Support EPUB loading
  - <https://github.com/vivliostyle/vivliostyle.js/pull/60>
  - `loadEPUB` method of `Viewer` class loads an unzipped EPUB directory.
- Support some EPUB features
  - <https://github.com/vivliostyle/vivliostyle.js/pull/62>
  - Support `page-progression-direction` attribute of `spine` element in OPF
  - Accept `-epub-` prefixed `text-emphasis-*` properties
- Support `:nth-child()` pseudo-class selector (only an integer argument can be used)
  - <https://github.com/vivliostyle/vivliostyle.js/pull/69>
  - Spec: [Selectors Level 3 - :nth-child() pseudo-class](http://www.w3.org/TR/css3-selectors/#nth-child-pseudo)
- Basic CSS Page Floats support
  - <https://github.com/vivliostyle/vivliostyle.js/pull/72>
  - Spec: [CSS Page Floats](https://drafts.csswg.org/css-page-floats/)
  - Only basic float placement without stacking or collision avoidance is supported.
- Improve handling of @font-face rules
  - <https://github.com/vivliostyle/vivliostyle.js/pull/79>
  - Spec: [CSS Fonts Module Level 3 - The @font-face rule](http://www.w3.org/TR/css-fonts-3/#font-face-rule)
  - Add support for `local()` as well as `url()` to use local fonts.
- Support JIS-B5 and JIS-B4 page sizes
  - <https://github.com/vivliostyle/vivliostyle.js/issues/75>
- Accept flexbox properties
  - <https://github.com/vivliostyle/vivliostyle.js/issues/90>
- Support `srcset` attribute for `img` and `source` elements
  - <https://github.com/vivliostyle/vivliostyle.js/pull/117>

### Changed

- Add default page margin
  - <https://github.com/vivliostyle/vivliostyle.js/pull/81>

### Fixed

- Fix zoom problem when viewport is specified by the document
  - <https://github.com/vivliostyle/vivliostyle.js/pull/61>
- Fix incorrect layout of HTML which is well-formed as XML
  - https://github.com/vivliostyle/vivliostyle.js/issues/65
- Fix viewport blinking while loading
  - <https://github.com/vivliostyle/vivliostyle.js/pull/77>
- Fix media queries behavior
  - <https://github.com/vivliostyle/vivliostyle.js/pull/78>
  - <https://github.com/vivliostyle/vivliostyle.js/pull/80>
- Fix calculation of `rem` unit values
  - Spec: [CSS Values and Units Module Level 3 - rem unit](https://drafts.csswg.org/css-values/#rem)
  - <https://github.com/vivliostyle/vivliostyle.js/pull/82>
- Improve MathJax performance
  - <https://github.com/vivliostyle/vivliostyle.js/pull/116>
- Fix bug that rules above footnotes disappear
  - <https://github.com/vivliostyle/vivliostyle.js/pull/118>
- Allow an EPUB directory URL not followed by a slash
  - <https://github.com/vivliostyle/vivliostyle.js/pull/120>
- Change initial values of `orphans` and `widows` to 2
  - <https://github.com/vivliostyle/vivliostyle.js/issues/30>
- Allow page/column break inside tables
  - <https://github.com/vivliostyle/vivliostyle.js/issues/101>
- Fix internal hyperlinks to elements with 'name' attributes
  - <https://github.com/vivliostyle/vivliostyle.js/issues/94>
- Allow units spelled in upper case
  - <https://github.com/vivliostyle/vivliostyle.js/issues/36>
- Fix handling of forced and avoid break values; update acceptable values for `break-*` properties
  - Spec: [CSS Fragmentation Module Level 3](https://drafts.csswg.org/css-break/)
  - Note that the current implementation treats all values of `break-inside` other than `auto` as the same as `avoid`. The fine-grained control (distinguishing `avoid`, `avoid-page`, `avoid-column` and `avoid-region`) will be a future task and tracked with a separate issue.
  - Note that though the spec requires to honor multiple `break-before`/`break-after` values at a single break point, the current implementation choose one of them and discard the others. The fine-grained control of these break values will be a future task and tracked with a separate issue.
  - <https://github.com/vivliostyle/vivliostyle.js/issues/26>
  - <https://github.com/vivliostyle/vivliostyle.js/issues/103>
- Element names and attribute names in selectors are now treated in a case-insensitive manner
  - <https://github.com/vivliostyle/vivliostyle.js/issues/95>
  - Note that this behavior is incorrect for XML documents. This issue will be tracked at <https://github.com/vivliostyle/vivliostyle.js/issues/106>.
- Fix incorrect positioning of floats and clearance
  - <https://github.com/vivliostyle/vivliostyle.js/pull/135>
- Fix attribute selector `~=`
  - <https://github.com/vivliostyle/vivliostyle.js/pull/137>
- Fix initial value of `unicode-bidi`
  - <https://github.com/vivliostyle/vivliostyle.js/pull/137>
- Fix support for `q` unit
  - <https://github.com/vivliostyle/vivliostyle.js/pull/137>
- Avoid page break between ruby base and annotation
  - <https://github.com/vivliostyle/vivliostyle.js/pull/139>
- Do not block entire process when stylesheets cannot be fetched or parsed
  - <https://github.com/vivliostyle/vivliostyle.js/issues/141>
- Fix problem that pages with viewport specified have incorrect horizontal offset on screen
  - <https://github.com/vivliostyle/vivliostyle.js/pull/142>

## [0.2.0](https://github.com/vivliostyle/vivliostyle.js/releases/tag/0.2.0) - 2015-09-16

Beta release.

### Added

- [core] Support page background and document canvas background color
  - <https://github.com/vivliostyle/vivliostyle.js/pull/33>
  - Note: only simple background color is supported.
- [core, viewer] Layout is automatically updated when the window size is changed
  - <https://github.com/vivliostyle/vivliostyle.js/pull/37>
- [core] Support page-based counters
  - <https://github.com/vivliostyle/vivliostyle.js/pull/39>
  - Spec: [CSS Paged Media Module Level 3 - Page-based counters](http://dev.w3.org/csswg/css-page/#page-based-counters)
  - See [the above pull request](https://github.com/vivliostyle/vivliostyle.js/pull/39) for a detailed description of its behavior and limitation.
- [core] Support page-margin boxes
  - <https://github.com/vivliostyle/vivliostyle.js/pull/42>
  - Spec: [CSS Paged Media Module Level 3 - Page-Margin boxes](https://drafts.csswg.org/css-page/#margin-boxes)
  - Note: For now, 'quotes' property specified within the page/margin context is ignored. This issue will be tracked at <https://github.com/vivliostyle/vivliostyle.js/issues/43>.
- [core] Accept WOFF2 web fonts
  - <https://github.com/vivliostyle/vivliostyle.js/pull/51>

### Changed

- Viewer UI is separated to a new repository [vivliostyle-js-viewer](https://github.com/vivliostyle/vivliostyle-js-viewer).
  - <https://github.com/vivliostyle/vivliostyle.js/pull/53>

### Fixed

- [core] Avoid incorrect margin collapse of the page area
  - <https://github.com/vivliostyle/vivliostyle.js/pull/32>
- [core] Fix incorrect positioning of floats
  - <https://github.com/vivliostyle/vivliostyle.js/pull/35>
- [viewer] Make keyboard shortcuts work on various browsers
  - <https://github.com/vivliostyle/vivliostyle.js/pull/38>
- [core] Fix duplicating page when navigate to the last page of each spine
  - <https://github.com/vivliostyle/vivliostyle.js/pull/55>
- [core] Fix several problems on web font loading
  - <https://github.com/vivliostyle/vivliostyle.js/pull/52>
  - <https://github.com/vivliostyle/vivliostyle.js/pull/56>

## [0.1.1](https://github.com/vivliostyle/vivliostyle.js/releases/tag/0.1.1) - 2015-05-06

Minor update with several changes and bug fixes.

### Added

- [core] Support [:root](http://www.w3.org/TR/selectors/#root-pseudo) pseudo-class selector
  - <https://github.com/vivliostyle/vivliostyle.js/commit/3e9c21002400ac90b09f996ca35187dbf7a3eaca>
- [core] Support CSS properties currently implemented by browsers
  - See <https://github.com/vivliostyle/vivliostyle.js/pull/18> for details.

### Changed

- [core] Cascade page size specified in @page rules to page masters defined by @-epubx-page-master rules
  - <https://github.com/vivliostyle/vivliostyle.js/pull/17>
  - When @page rules and @-epubx-page-master rules are both specified, the page size specified by 'size' property in @page rules is applied to the selected page master. This behavior is not defined in the related specs. We added this behavior for a use case in which one wants to print content styled with Adaptive Layout on a paper sheet and wants to specify the sheet size by adding a (user) stylesheet containing @page rules with 'size' property.

### Fixed

- [core] Fixed incorrect page layout when non-zero padding is specified in page context.
  - <https://github.com/vivliostyle/vivliostyle.js/commit/899fab18dba4814dc4ce301a39a47a155ac36109>
- [core] 'page-width', 'page-height' variables (used in -epubx-expr) are now correctly reflect the page size specified by @page rules
  - <https://github.com/vivliostyle/vivliostyle.js/pull/17>
- [viewer] Fixed incorrect page size calculation when content with 'auto' page size is viewed in the spread view mode.
  - <https://github.com/vivliostyle/vivliostyle.js/pull/15>
  - <https://github.com/vivliostyle/vivliostyle.js/commit/67af6146e99feb84766a4357c88ae6b9f196617b>

## [0.1.0](https://github.com/vivliostyle/vivliostyle.js/releases/tag/0.1.0) - 2015-04-28

Initial alpha release. Following features are added while keeping the original Adaptive Layout features.

### Added

- [core] Support @page rule
  - <https://github.com/vivliostyle/vivliostyle.js/pull/2>
  - Spec: [CSS Paged Media Module Level 3](http://dev.w3.org/csswg/css-page/)
  - Supported page selectors: [:left, :right](http://dev.w3.org/csswg/css-page/#spread-pseudos), [:first](http://dev.w3.org/csswg/css-page/#first-pseudo), [:recto, :verso](http://dev.w3.org/csswg/css-logical-props/#logical-page)
  - Supported properties within the page context: [size](http://dev.w3.org/csswg/css-page/#page-size-prop), width, height, margin, padding, border
- [viewer] Support spread view mode
  - <https://github.com/vivliostyle/vivliostyle.js/pull/7>
  - The spread view can be enabled by adding '&spread=true' to the end of the viewer URL.
  - Note: Page size calculation is incorrect when content with 'auto' page size is viewed in the spread view mode. This problem will be fixed in the next release.
- [viewer] Added page navigation buttons
  - <https://github.com/vivliostyle/vivliostyle.js/pull/5>
