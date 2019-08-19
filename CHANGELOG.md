# Change Log

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
  - Document URL entered by user is reflected in the URL parameter `#b=`, and　when the Enter key is pressed, the document is loaded.

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
