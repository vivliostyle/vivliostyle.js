# Change Log

## Unreleased

### Fixed
- [viewer] Fixed incorrect page size calculation when content with 'auto' page size is viewed in the spread view mode.

## 0.1.0 - 2015-04-28
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
