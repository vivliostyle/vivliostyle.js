# Change Log

## Unreleased

### Added
- Support even/odd arguments for :nth-child selector
  - <https://github.com/vivliostyle/vivliostyle.js/issues/87>
  - Spec: [Selectors Level 3 - :nth-child() pseudo-class](http://www.w3.org/TR/css3-selectors/#nth-child-pseudo)
- Support printer marks (`marks` property) and bleed area (`bleed` property)
  - <https://github.com/vivliostyle/vivliostyle.js/issues/98>
  - Spec: [CSS Paged Media Module Level 3 - Crop and Registration Marks: the 'marks' property](https://drafts.csswg.org/css-page/#marks), [Bleed Area: the 'bleed' property](https://drafts.csswg.org/css-page/#bleed)
  - Only effective when specified within an `@page` rule without page selectors.
- Support outline-offset
  - <https://github.com/vivliostyle/vivliostyle.js/issues/181>
  - Spec: [CSS Basic User Interface Module Level 3 (CSS3 UI) - outline-offset property](https://drafts.csswg.org/css-ui-3/#outline-offset)
   

### Fixed
- Lengths in 'rem' specified within page context are now interpreted correctly.
  - <https://github.com/vivliostyle/vivliostyle.js/issues/109>
- Web fonts are now applied correctly even when specified within page context.
  - <https://github.com/vivliostyle/vivliostyle.js/issues/58>
- Fix incorrect pagination caused by absolutely positioned element.
  - <https://github.com/vivliostyle/vivliostyle.js/issues/158>
- Fix pagination problem with flex containers.
  - <https://github.com/vivliostyle/vivliostyle.js/issues/174>

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
