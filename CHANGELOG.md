# Change Log

## Unreleased

### Added
- [core] Cascade page size specified in @page rules to page masters defined by @-epubx-page-master rules
  - When @page rules and @-epubx-page-master rules are both specified, the page size specified by 'size' property in @page rules is applied to the selected page master. This behavior is not defined in the related specs. We added this behavior for a use case in which one wants to print content styled with Adaptive Layout on a paper sheet and wants to specify the sheet size by adding a (user) stylesheet containing @page rules with 'size' property.

### Fixed
- [core] Fixed incorrect page layout when non-zero padding is specified in page context.
- [core] 'page-width', 'page-height' variables (used in -epubx-expr) are now correctly reflect the page size specified by @page rules
- [viewer] Fixed incorrect page size calculation when content with 'auto' page size is viewed in the spread view mode.

## [0.1.0](https://github.com/vivliostyle/vivliostyle.js/releases/tag/0.1.0) - 2015-04-28
Initial alpha release. Following features are added while keeping the original Adaptive Layout features.

### Added
- [core] Support @page rule
  - Spec: [CSS Paged Media Module Level 3](http://dev.w3.org/csswg/css-page/)
  - Supported page selectors: [:left, :right](http://dev.w3.org/csswg/css-page/#spread-pseudos), [:first](http://dev.w3.org/csswg/css-page/#first-pseudo), [:recto, :verso](http://dev.w3.org/csswg/css-logical-props/#logical-page)
  - Supported properties within the page context: [size](http://dev.w3.org/csswg/css-page/#page-size-prop), width, height, margin, padding, border
- [viewer] Support spread view mode
  - The spread view can be enabled by adding '&spread=true' to the end of the viewer URL.
  - Note: Page size calculation is incorrect when content with 'auto' page size is viewed in the spread view mode. This problem will be fixed in the next release.
- [viewer] Added page navigation buttons
