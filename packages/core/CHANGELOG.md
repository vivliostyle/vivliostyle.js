# Change Log

All notable changes to this project will be documented in this file.
See [Conventional Commits](https://conventionalcommits.org) for commit guidelines.

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
