# Change Log

## Unreleased

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
  - Spec: [CSS Values and Units Module Level 3 - Attribute References: ‘attr()’](https://drafts.csswg.org/css-values/#attr-notation)
- Support `left`/`right`/`recto`/`verso` values for `(page-)break-before`/`(page-)break-after`
  - <https://github.com/vivliostyle/vivliostyle.js/issues/25>
  - Spec: [CSS Fragmentation - Page Break Values](http://dev.w3.org/csswg/css-break/#page-break-values)
- Support cross references by `target-counter()`/`target-counters()`
  - <https://github.com/vivliostyle/vivliostyle.js/pull/248>
  - Spec: [CSS Generated Content Module Level 3 - Cross references and the target-* functions](https://drafts.csswg.org/css-content/#cross-references)
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
