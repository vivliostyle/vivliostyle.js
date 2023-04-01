# Change Log

All notable changes to this project will be documented in this file.
See [Conventional Commits](https://conventionalcommits.org) for commit guidelines.

# [2.24.0](https://github.com/vivliostyle/vivliostyle.js/compare/v2.23.2...v2.24.0) (2023-04-01)

### Bug Fixes

- Browser "Back" button should work with internal link or TOC navigation ([5b6795c](https://github.com/vivliostyle/vivliostyle.js/commit/5b6795c4c1e9d1058ece10b774cbb919f9f22756))
- Rendering error with SVG images in EPUB (Regression in v2.23.0) ([bff1c63](https://github.com/vivliostyle/vivliostyle.js/commit/bff1c63d6d2623fd5a214742384bfeba1059fdeb)), closes [#1139](https://github.com/vivliostyle/vivliostyle.js/issues/1139) [#1135](https://github.com/vivliostyle/vivliostyle.js/issues/1135)

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

# [2.22.0](https://github.com/vivliostyle/vivliostyle.js/compare/v2.21.1...v2.22.0) (2023-01-25)

### Bug Fixes

- layout problem when devicePixelRatio is changed during rendering ([58c6202](https://github.com/vivliostyle/vivliostyle.js/commit/58c6202d9cdda4c4f50f5be9a45ef57247df85a2)), closes [#1079](https://github.com/vivliostyle/vivliostyle.js/issues/1079)
- very thin border on printing with Microsoft Edge ([0137d0e](https://github.com/vivliostyle/vivliostyle.js/commit/0137d0e9edfeae08ec27ee47f7cc82612f7da6e5)), closes [#1079](https://github.com/vivliostyle/vivliostyle.js/issues/1079) [#1085](https://github.com/vivliostyle/vivliostyle.js/issues/1085)

### Features

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
- Some text-\* properties are not applied to page margin box content ([c3082f6](https://github.com/vivliostyle/vivliostyle.js/commit/c3082f627e28d38fbd92a66978e6ee198103a62a)), closes [#1059](https://github.com/vivliostyle/vivliostyle.js/issues/1059)
- Text-decoration-line should not be skipped at ideograph-alpha/numeric text spacing ([e8382ed](https://github.com/vivliostyle/vivliostyle.js/commit/e8382ed81c8d0c5a98e630e0ec63d849180875e8)), closes [#1061](https://github.com/vivliostyle/vivliostyle.js/issues/1061)
- Wrong cascading with shorthand property text-decoration and its longhand ([7674360](https://github.com/vivliostyle/vivliostyle.js/commit/76743607dd8e737d7b629dd2794fb3d7486bc348)), closes [#1054](https://github.com/vivliostyle/vivliostyle.js/issues/1054)

### Features

- Add support for CSS lh and rlh units ([554d300](https://github.com/vivliostyle/vivliostyle.js/commit/554d300b34af107b68e465e0a14ad9947f06a35a)), closes [#1035](https://github.com/vivliostyle/vivliostyle.js/issues/1035)
- Add support for CSS margin-break property ([a3086dc](https://github.com/vivliostyle/vivliostyle.js/commit/a3086dce807f1eeff00341826a070b191fd7a980)), closes [#734](https://github.com/vivliostyle/vivliostyle.js/issues/734)
- Support (-webkit-)text-stroke properties ([73e0560](https://github.com/vivliostyle/vivliostyle.js/commit/73e0560868b34b3ff5cfffae562439c76cb54102)), closes [#1055](https://github.com/vivliostyle/vivliostyle.js/issues/1055)

## [2.19.2](https://github.com/vivliostyle/vivliostyle.js/compare/v2.19.1...v2.19.2) (2022-11-17)

### Bug Fixes

- `[@supports](https://github.com/supports) selector(…)` did not work ([49c48a4](https://github.com/vivliostyle/vivliostyle.js/commit/49c48a4c64b4a29fa4c31ec23bd0180f73709b09))
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

- wrong text-spacing when non-fullwidth closing and fullwidth opening brackets are adjacent ([331322b](https://github.com/vivliostyle/vivliostyle.js/commit/331322b63b8105e3e73eb53f5d2028b1a2e3efbe)), closes [#1003](https://github.com/vivliostyle/vivliostyle.js/issues/1003)
- wrong text-spacing with fullwidth punctuations in some edge cases ([6a79482](https://github.com/vivliostyle/vivliostyle.js/commit/6a794827e3f84b16659bb209d9ada7fe195b4582)), closes [#1005](https://github.com/vivliostyle/vivliostyle.js/issues/1005) [#1006](https://github.com/vivliostyle/vivliostyle.js/issues/1006)
- wrong text-spacing:space-first and hanging-punctuation:first at page break inside paragraph ([ddd6d6c](https://github.com/vivliostyle/vivliostyle.js/commit/ddd6d6c93afca7662023110d92acbb716dfa94fd)), closes [#1008](https://github.com/vivliostyle/vivliostyle.js/issues/1008)

## [2.18.1](https://github.com/vivliostyle/vivliostyle.js/compare/v2.18.0...v2.18.1) (2022-09-18)

### Bug Fixes

- DOMException error caused by wrong `instanceof Element` usage ([d959b95](https://github.com/vivliostyle/vivliostyle.js/commit/d959b9558dae6b9759fd7d7e654b4f38b600f2d7)), closes [#1000](https://github.com/vivliostyle/vivliostyle.js/issues/1000)

# [2.18.0](https://github.com/vivliostyle/vivliostyle.js/compare/v2.17.2...v2.18.0) (2022-09-17)

### Bug Fixes

- error with `<object>` tag ([9e9565f](https://github.com/vivliostyle/vivliostyle.js/commit/9e9565f49288e58adcede797029c87cbc0f1236f)), closes [#995](https://github.com/vivliostyle/vivliostyle.js/issues/995)
- errors on the Acid2 Browser Test ([849a604](https://github.com/vivliostyle/vivliostyle.js/commit/849a6048572f400deacfee09070247b3d8436eac))
- failed some of the css-variables tests ([5d0f324](https://github.com/vivliostyle/vivliostyle.js/commit/5d0f3246e1c9b91af6f67427a268409848e20ed9))
- incorrect column-rule positioning in vertical writing mode ([3cc0e01](https://github.com/vivliostyle/vivliostyle.js/commit/3cc0e010eb0c41f9ffb7f3c4d34d214b573d5860)), closes [#978](https://github.com/vivliostyle/vivliostyle.js/issues/978)
- unnecessary page break caused by ruby elements ([21eb17c](https://github.com/vivliostyle/vivliostyle.js/commit/21eb17c4b1ef5c72f6695c2166c70a76aeb60373)), closes [#987](https://github.com/vivliostyle/vivliostyle.js/issues/987)
- valid CSS rules ignored after parsing error with invalid or unsupported CSS rule ([5e76ed5](https://github.com/vivliostyle/vivliostyle.js/commit/5e76ed5d49c2f4b4c06c69619df27e83429c6a54)), closes [#597](https://github.com/vivliostyle/vivliostyle.js/issues/597) [#976](https://github.com/vivliostyle/vivliostyle.js/issues/976)
- wrong cascading on shorthand property with CSS variable ([2ee7927](https://github.com/vivliostyle/vivliostyle.js/commit/2ee792705c7598be7660ac590872329f2fcde17d)), closes [#979](https://github.com/vivliostyle/vivliostyle.js/issues/979)
- wrong cascading with CSS !important ([fb1dae2](https://github.com/vivliostyle/vivliostyle.js/commit/fb1dae26981827ae099e27967625c9d2abb59da3)), closes [#986](https://github.com/vivliostyle/vivliostyle.js/issues/986)
- wrong text justification at last line of page caused by consecutive ruby elements ([ad26952](https://github.com/vivliostyle/vivliostyle.js/commit/ad2695206e796617f2712e5bfe4b92057fbaae27)), closes [#985](https://github.com/vivliostyle/vivliostyle.js/issues/985)

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

- Allow JavaScript in HTML documents ([ccd31da](https://github.com/vivliostyle/vivliostyle.js/commit/ccd31da5ff3eba91432953580483548cecd84859)), closes [#733](https://github.com/vivliostyle/vivliostyle.js/issues/733) [#735](https://github.com/vivliostyle/vivliostyle.js/issues/735) [/github.com/vivliostyle/vivliostyle.js/blob/master/packages/core/src/vivliostyle/core-viewer.ts#L73](https://github.com//github.com/vivliostyle/vivliostyle.js/blob/master/packages/core/src/vivliostyle/core-viewer.ts/issues/L73)

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

### Features

- Support the `@supports` CSS at-rule ([08efaef](https://github.com/vivliostyle/vivliostyle.js/commit/08efaef17b7c430ef0e3e30029480d3bb0953655)), closes [#730](https://github.com/vivliostyle/vivliostyle.js/issues/730)

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

- **core:** Missing source map ([f8add2b](https://github.com/vivliostyle/vivliostyle.js/commit/f8add2bc50b4a333c1d62806675adfa05eb3b61e)), closes [#695](https://github.com/vivliostyle/vivliostyle.js/issues/695)
- **core:** spread break at beginning of a document does not work properly ([f1208bf](https://github.com/vivliostyle/vivliostyle.js/commit/f1208bf8d4a542970fdca64a0ff99679064715a7)), closes [#666](https://github.com/vivliostyle/vivliostyle.js/issues/666)

## [2.4.2](https://github.com/vivliostyle/vivliostyle.js/compare/v2.4.1...v2.4.2) (2021-01-25)

### Bug Fixes

- top margin at forced break was ignored when target-counter is used ([c8485ad](https://github.com/vivliostyle/vivliostyle.js/commit/c8485ad668fd462fca15c960660c154388214bc9)), closes [#690](https://github.com/vivliostyle/vivliostyle.js/issues/690)

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

**Note:** Version bump only for package @vivliostyle/core

## [2.1.4](https://github.com/vivliostyle/vivliostyle.js/compare/v2.1.3...v2.1.4) (2020-10-30)

### Bug Fixes

- negative z-index on `[@page](https://github.com/page) {...}` causes page (margin-box) content to disappear ([000eed6](https://github.com/vivliostyle/vivliostyle.js/commit/000eed65c2527216f0be85433e6ccbfa7f4a07a9)), closes [#665](https://github.com/vivliostyle/vivliostyle.js/issues/665)

## [2.1.3](https://github.com/vivliostyle/vivliostyle.js/compare/v2.1.2...v2.1.3) (2020-09-30)

### Bug Fixes

- Internal links and TOC links not working when the document URL has %-encoded characters ([bdabb71](https://github.com/vivliostyle/vivliostyle.js/commit/bdabb71a28ed2e5f65087142cbb220220fe56aee)), closes [#662](https://github.com/vivliostyle/vivliostyle.js/issues/662)
- page display shakes horizontally when all pages finish loading ([18ab3c9](https://github.com/vivliostyle/vivliostyle.js/commit/18ab3c9c03592f7339392460409a1994db42f2af)), closes [#663](https://github.com/vivliostyle/vivliostyle.js/issues/663)
- SyntaxError: Invalid regular expression: invalid group specifier name, on Safari ([3a70707](https://github.com/vivliostyle/vivliostyle.js/commit/3a70707899194a8b63a8461fa323d929120aabd5)), closes [#664](https://github.com/vivliostyle/vivliostyle.js/issues/664)

## [2.1.2](https://github.com/vivliostyle/vivliostyle.js/compare/v2.1.2-pre.5...v2.1.2) (2020-09-28)

**Note:** Version bump only for package @vivliostyle/core

## [2.1.2-pre.5](https://github.com/vivliostyle/vivliostyle.js/compare/v2.1.2-pre.4...v2.1.2-pre.5) (2020-09-28)

### Bug Fixes

- Relative URLs in pub-manifest are not resolved properly when the pub-manifest is linked from HTML elsewhere ([b6fe7c1](https://github.com/vivliostyle/vivliostyle.js/commit/b6fe7c11e84094a2abc12db6950862e205760e6c)), closes [#661](https://github.com/vivliostyle/vivliostyle.js/issues/661)
- TOC is not enabled when TOC exists in HTML but is not specified in the manifest ([ea280a1](https://github.com/vivliostyle/vivliostyle.js/commit/ea280a1a4b0d8e2868b4eca260f45695f9302511)), closes [#659](https://github.com/vivliostyle/vivliostyle.js/issues/659)

## [2.1.2-pre.4](https://github.com/vivliostyle/vivliostyle.js/compare/v2.1.2-pre.3...v2.1.2-pre.4) (2020-09-27)

### Bug Fixes

- "404 Not Found" error message does not appear when bookMode=true ([43b137c](https://github.com/vivliostyle/vivliostyle.js/commit/43b137cc8d7a40f602ca74fef50fb5698f436bbd)), closes [#660](https://github.com/vivliostyle/vivliostyle.js/issues/660)

## [2.1.2-pre.3](https://github.com/vivliostyle/vivliostyle.js/compare/v2.1.2-pre.2...v2.1.2-pre.3) (2020-09-25)

**Note:** Version bump only for package @vivliostyle/core

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

**Note:** Version bump only for package @vivliostyle/core

## [2.1.0-pre.3](https://github.com/vivliostyle/vivliostyle.js/compare/v2.1.0-pre.2...v2.1.0-pre.3) (2020-06-30)

### Bug Fixes

- change epage type to number ([a059d11](https://github.com/vivliostyle/vivliostyle.js/commit/a059d1156d2bd10fc3dbc902ee1c128620c46e2b))

## [2.1.0-pre.2](https://github.com/vivliostyle/vivliostyle.js/compare/v2.1.0-pre.1...v2.1.0-pre.2) (2020-06-30)

**Note:** Version bump only for package @vivliostyle/core

## [2.1.0-pre.1](https://github.com/vivliostyle/vivliostyle.js/compare/v2.1.0-pre.0...v2.1.0-pre.1) (2020-06-30)

### Bug Fixes

- simplify build dep graph ([8b5467d](https://github.com/vivliostyle/vivliostyle.js/commit/8b5467df34c784b399f051e04f796917a13e91d7))
- **core:** main prop ([234879a](https://github.com/vivliostyle/vivliostyle.js/commit/234879aa2dab028db37af0b124d07170a8020d1d))
- **core:** move resources ([1ad7bef](https://github.com/vivliostyle/vivliostyle.js/commit/1ad7beff99bb339ff2635792c232f99a9117e723))

## [2.1.0-pre.0](https://github.com/vivliostyle/vivliostyle.js/compare/v2.0.0...v2.1.0-pre.0) (2020-05-13)

### Bug Fixes

- epub metadata sorts and uses "scheme" correctly ([301e5b4](https://github.com/vivliostyle/vivliostyle.js/commit/301e5b43d4b3349975085d26e096df73d7cf5258))
- improve type safety of epub metadata parsing ([b4dc5e2](https://github.com/vivliostyle/vivliostyle.js/commit/b4dc5e2319834f67a600afe2cd2780c573e1303c))

### Features

- add core viewer method to export the toc ([f080aa5](https://github.com/vivliostyle/vivliostyle.js/commit/f080aa54b70b8cf06a52bdd98f4e7fa29414fe83))
- add core viewer methods to export metadata ([d4f700c](https://github.com/vivliostyle/vivliostyle.js/commit/d4f700c33e2421a8032f5454aab6adb252e29f34))
- support reading role properties from epub metadata ([955d01d](https://github.com/vivliostyle/vivliostyle.js/commit/955d01d99db974f44f9d8c00d6e1b5e55b9cc3f8))

## [2.0.0](https://github.com/vivliostyle/vivliostyle.js/compare/v2.0.0-pre.13...v2.0.0) (2020-04-03)

**Note:** Version bump only for package @vivliostyle/core

## [2.0.0-pre.13](https://github.com/vivliostyle/vivliostyle.js/compare/v2.0.0-pre.12...v2.0.0-pre.13) (2020-04-02)

**Note:** Version bump only for package @vivliostyle/core

## [2.0.0-pre.12](https://github.com/vivliostyle/vivliostyle.js/compare/v2.0.0-pre.11...v2.0.0-pre.12) (2020-04-02)

**Note:** Version bump only for package @vivliostyle/core

## [2.0.0-pre.11](https://github.com/vivliostyle/vivliostyle.js/compare/v2.0.0-pre.10...v2.0.0-pre.11) (2020-04-01)

**Note:** Version bump only for package @vivliostyle/core

## [2.0.0-pre.10](https://github.com/vivliostyle/vivliostyle.js/compare/v2.0.0-pre.9...v2.0.0-pre.10) (2020-03-26)

**Note:** Version bump only for package @vivliostyle/core

## [2.0.0-pre.9](https://github.com/vivliostyle/vivliostyle.js/compare/v2.0.0-pre.8...v2.0.0-pre.9) (2020-03-20)

**Note:** Version bump only for package @vivliostyle/core

## [2.0.0-pre.8](https://github.com/vivliostyle/vivliostyle.js/compare/v2.0.0-pre.7...v2.0.0-pre.8) (2020-03-16)

### Features

- update Vivliostyle logo images ([cea5822](https://github.com/vivliostyle/vivliostyle.js/commit/cea58226c97e2cc4a84d6af57d566fbdf722579b))

## [2.0.0-pre.7](https://github.com/vivliostyle/vivliostyle.js/compare/v2.0.0-pre.6...v2.0.0-pre.7) (2020-01-03)

### Bug Fixes

- "Received an empty response" error on web servers that don't know XHTML MIME type ([6e7c6ba](https://github.com/vivliostyle/vivliostyle.js/commit/6e7c6ba5cd871d98d0177bdcdf29b2fa14788315))
- **core:** TypeError: Cannot read property 'cell' of undefined ([0598e6c](https://github.com/vivliostyle/vivliostyle.js/commit/0598e6c2cc4ae11f8612346e95098bbe3f531d52)), closes [#623](https://github.com/vivliostyle/vivliostyle.js/issues/623)

## [2.0.0-pre.6](https://github.com/vivliostyle/vivliostyle.js/compare/v2.0.0-pre.5...v2.0.0-pre.6) (2019-12-23)

**Note:** Version bump only for package @vivliostyle/core

## [2.0.0-pre.5](https://github.com/vivliostyle/vivliostyle.js/compare/v2.0.0-pre.4...v2.0.0-pre.5) (2019-12-23)

### Bug Fixes

- document links ([ce486d9](https://github.com/vivliostyle/vivliostyle.js/commit/ce486d94da6dd6816a169c3765c6b2ae7e4106b5))
- export PrintConfig ([f6d21b3](https://github.com/vivliostyle/vivliostyle.js/commit/f6d21b360fc9a1625f534a3a298fcdaf7d621b4b))

## [2.0.0-pre.1](https://github.com/vivliostyle/vivliostyle.js/compare/v2.0.0-pre.0...v2.0.0-pre.1) (2019-12-15)

**Note:** Version bump only for package @vivliostyle/core
