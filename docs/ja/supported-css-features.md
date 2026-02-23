# サポートする CSS 機能

Vivliostyle は現在、以下の各 CSS 機能（[Values](#values)、[Selectors](#selectors)、[At-rules](#at-rules)、[Media queries](#media-queries)、[Properties](#properties)）をサポートしています。

このほかにも、ブラウザでサポートされる CSS プロパティと値は基本的にすべて利用可能です。Vivliostyle.js は独自の処理をしない CSS プロパティについてはブラウザに処理を任せるためです。

## Values

- [CSS-wide keywords](https://www.w3.org/TR/css-values/#common-keywords): `initial`, `inherit`, `unset`, `revert`
- [Length units](https://www.w3.org/TR/css-values/#lengths): `em`, `ex`, `ch`, `rem`, `lh`, `rlh`, `vw`, `vh`, `vmin, vmax`, `vi`, `vb`, `cm`, `mm`, `q`, `in`, `pc`, `pt`, `px`.
- Sizing keywords: [min-content](https://www.w3.org/TR/css-sizing-3/#valdef-width-min-content), [max-content](https://www.w3.org/TR/css-sizing-3/#valdef-width-max-content), [fit-content](https://www.w3.org/TR/css-sizing-4/#valdef-width-fit-content)
- Color values
  - [Named Colors](https://www.w3.org/TR/css-color/#named-colors)
  - [`transparent` color keyword](https://www.w3.org/TR/css-color/#transparent-color)
  - [`currentColor` color keyword](https://www.w3.org/TR/css-color/#currentcolor-color)
  - [RGB functions: `rgb()`, `rgba()`](https://www.w3.org/TR/css-color/#rgb-functions)
  - [RGB Hexadecimal Notations: #RRGGBB, #RRGGBBAA](https://www.w3.org/TR/css-color/#hex-notation)
  - [HSL Colors: `hsl()`, `hsla()`](https://www.w3.org/TR/css-color/#the-hsl-notation)
  - [HWB Colors: `hwb()`](https://www.w3.org/TR/css-color/#the-hwb-notation)
- [Attribute references: `attr()`](https://www.w3.org/TR/css-values/#attr-notation)
  - Only supported in values of `content` property.
  - Only 'string' and 'url' types are supported.
- [Cross references: `target-counter()`, `target-counters()` and `target-text()`](https://www.w3.org/TR/css-content-3/#cross-references)
  - Only supported in values of `content` property.
- [`string()` function (Named Strings)](https://www.w3.org/TR/css-content-3/#string-function)
- [`content()` function](https://www.w3.org/TR/css-content-3/#content-function)
- [`running()` function (Running Elements)](https://www.w3.org/TR/css-gcpm-3/#running-syntax)
- [`element()` function (Running Elements)](https://www.w3.org/TR/css-gcpm-3/#element-syntax)
- [`leader()` function](https://www.w3.org/TR/css-content-3/#leaders)
- [`calc()` function](https://www.w3.org/TR/css-values/#funcdef-calc)
- [`env()` function](https://drafts.csswg.org/css-env/)
  - Implemented only `env(pub-title)` and `env(doc-title)` that are not yet defined in the css-env draft spec but useful for making page header.
    - `env(pub-title)`: publication title = EPUB, Web publication, or primary entry page HTML title.
    - `env(doc-title)`: document title = HTML title, which may be chapter or section title in a publication composed of multiple HTML documents
- [`var()` function](https://www.w3.org/TR/css-variables/#using-variables)
  - Supports [CSS Custom Properties for Cascading Variables](https://www.w3.org/TR/css-variables/)

## Selectors

### [CSS 2](https://www.w3.org/TR/CSS2/)

- [Universal selector `*`](https://www.w3.org/TR/CSS2/selector.html#universal-selector)
- [Type selectors `E`](https://www.w3.org/TR/CSS2/selector.html#type-selectors)
- [Descendant selectors `E F`](https://www.w3.org/TR/CSS2/selector.html#descendant-selectors)
- [Child selectors `E > F`](https://www.w3.org/TR/CSS2/selector.html#child-selectors)
- [Adjacent sibling selectors `E + F`](https://www.w3.org/TR/CSS2/selector.html#adjacent-selectors)
- [Attribute selectors `E[foo]`, `E[foo="bar"]`, `E[foo~="bar"]`, `E[foo|="bar"]`](https://www.w3.org/TR/CSS2/selector.html#attribute-selectors)
- [Class selectors `E.foo`](https://www.w3.org/TR/CSS2/selector.html#class-html)
- [ID selectors `E#foo`](https://www.w3.org/TR/CSS2/selector.html#id-selectors)
- [`:first-child` pseudo-class](https://www.w3.org/TR/CSS2/selector.html#first-child)
- [Link pseudo-class `E:link`](https://www.w3.org/TR/CSS2/selector.html#link-pseudo-classes)
- [Language pseudo-class `E:lang(c)`](https://www.w3.org/TR/CSS2/selector.html#lang)
- [`:first-line` pseudo-element](https://www.w3.org/TR/CSS2/selector.html#first-line-pseudo)
  - Note: there is a bug when used alone or with the universal selector(`*`). [[Issue]](https://github.com/vivliostyle/vivliostyle.js/issues/133)
- [`:first-letter` pseudo-element](https://www.w3.org/TR/CSS2/selector.html#first-letter)
  - Note: there is a bug when used alone, with the universal selector(`*`), or with non-ascii characters. [[Issue]](https://github.com/vivliostyle/vivliostyle.js/issues/34)
- [`:before` and `:after` pseudo-elements](https://www.w3.org/TR/CSS2/selector.html#before-and-after)

#### Not supported selectors

- [Link pseudo-class `E:visited`](https://www.w3.org/TR/CSS2/selector.html#link-pseudo-classes)
- [Dynamic pseudo-classes `E:active`, `E:hover`, `E:focus`](https://www.w3.org/TR/CSS2/selector.html#dynamic-pseudo-classes)

### [Selectors 3](https://www.w3.org/TR/selectors-3/)

- [Type selectors with namespaces `ns|E`, `*|E`](https://www.w3.org/TR/selectors-3/#typenmsp)
- [Universal selector with namespaces `ns|*`, `*|*`](https://www.w3.org/TR/selectors-3/#univnmsp)
- [Substring matching attribute selectors `[att^=val]`, `[att$=val]`, `[att*=val]`](https://www.w3.org/TR/selectors-3/#attribute-substrings)
- [Attribute selectors with namespaces `[ns|att]`, `[|att]`, `[ns|att=val]`, `[|att=val]`, `[ns|att~=val]`, `[|att~=val]`, `[ns|att|=val]`, `[|att|=val]`, `[ns|att^=val]`, `[|att^=val]`, `[ns|att$=val]`, `[|att$=val]`, `[ns|att*=val]`, `[|att*=val]`](https://www.w3.org/TR/selectors-3/#attrnmsp)
- [The UI element states pseudo-classes `:enabled`, `:disabled`, `:checked`, `:indeterminate`](https://www.w3.org/TR/selectors-3/#UIstates)
  - Note that the current implementation can use only initial states of those UI elements. Even if the actual state of the element is toggled by user interaction, the style does not change.
- [`:root` pseudo-class](https://www.w3.org/TR/selectors-3/#root-pseudo)
- [`:nth-child()` pseudo-class](https://www.w3.org/TR/selectors-3/#nth-child-pseudo)
- [`:nth-last-child()` pseudo-class](https://www.w3.org/TR/selectors-3/#nth-last-child-pseudo)
- [`:nth-of-type()` pseudo-class](https://www.w3.org/TR/selectors-3/#nth-of-type-pseudo)
- [`:nth-last-of-type()` pseudo-class](https://www.w3.org/TR/selectors-3/#nth-last-of-type-pseudo)
- [`:first-child` pseudo-class](https://www.w3.org/TR/selectors-3/#first-child-pseudo)
- [`:last-child` pseudo-class](https://www.w3.org/TR/selectors-3/#last-child-pseudo)
- [`:first-of-type` pseudo-class](https://www.w3.org/TR/selectors-3/#first-of-type-pseudo)
- [`:last-of-type` pseudo-class](https://www.w3.org/TR/selectors-3/#last-of-type-pseudo)
- [`:only-child` pseudo-class](https://www.w3.org/TR/selectors-3/#only-child-pseudo)
- [`:only-of-type` pseudo-class](https://www.w3.org/TR/selectors-3/#only-of-type-pseudo)
- [`:empty` pseudo-class](https://www.w3.org/TR/selectors-3/#empty-pseudo)
- [`:not()` pseudo-class](https://www.w3.org/TR/selectors-3/#negation)
- [`::first-line` pseudo-element](https://www.w3.org/TR/selectors-3/#first-line)
  - Note: there is a bug when used alone or with the universal selector(`*`). [[Issue]](https://github.com/vivliostyle/vivliostyle.js/issues/133)
- [`::first-letter` pseudo-element](https://www.w3.org/TR/selectors-3/#first-letter)
  - Note: there is a bug when used alone, with the universal selector(`*`), or with non-ascii characters. [[Issue]](https://github.com/vivliostyle/vivliostyle.js/issues/34)
- [`::before` and `::after` pseudo-elements](https://www.w3.org/TR/selectors-3/#gen-content)
- [General sibling combinator `E ~ F`](https://www.w3.org/TR/selectors-3/#general-sibling-combinators)

### [Selectors 4](https://www.w3.org/TR/selectors-4/)

- [`:is()` pseudo-class](https://www.w3.org/TR/selectors-4/#matches)
- [`:not()` pseudo-class](https://www.w3.org/TR/selectors-4/#negation)
- [`:where()` pseudo-class](https://www.w3.org/TR/selectors-4/#zero-matches)
- [`:has()` pseudo-class](https://www.w3.org/TR/selectors-4/#relational)
- [`:nth-child(An+B of S)` pseudo-class](https://www.w3.org/TR/selectors-4/#nth-child-pseudo)
- [`:nth-last-child(An+B of S)` pseudo-class](https://www.w3.org/TR/selectors-4/#nth-last-child-pseudo)

### [CSS Overflow 4](https://www.w3.org/TR/css-overflow-4/)

- [`:nth-fragment()` pseudo-element](https://www.w3.org/TR/css-overflow-4/#fragment-pseudo-element)

### [CSS Pseudo-Elements 4](https://www.w3.org/TR/css-pseudo-4/)

- [`::marker` pseudo-element](https://www.w3.org/TR/css-pseudo-4/#marker-pseudo)

#### Not supported selectors

- [Type selectors without namespaces `|E`](https://www.w3.org/TR/selectors-3/#typenmsp)
- [Universal selector without namespaces `|*`](https://www.w3.org/TR/selectors-3/#univnmsp)
- [Attribute selectors with universal namespace `[*|att]`, `[*|att=val]`, `[*|att~=val]`, `[*|att|=val]`](https://www.w3.org/TR/selectors-3/#attrnmsp)
- [Target pseudo-class `:target`](https://www.w3.org/TR/selectors-3/#target-pseudo)

## At-rules

### [CSS 2](https://www.w3.org/TR/CSS2/)

- [@charset](https://www.w3.org/TR/CSS2/syndata.html#charset)
- [@import](https://www.w3.org/TR/CSS2/cascade.html#at-import)
  - [Also in CSS Cascading and Inheritance 3](https://www.w3.org/TR/css-cascade-3/#at-import)

### [CSS Namespaces 3](https://www.w3.org/TR/css3-namespace/)

- [@namespace](https://www.w3.org/TR/css3-namespace/#declaration)

### [CSS Conditional Rules 3](https://www.w3.org/TR/css-conditional-3/)

- [@media](https://www.w3.org/TR/css-conditional-3/#at-media)
- [@supports](https://www.w3.org/TR/css-conditional-3/#at-supports)

### [CSS Conditional Rules 4](https://www.w3.org/TR/css-conditional-4/)

- [@supports selector()](https://www.w3.org/TR/css-conditional-4/#at-supports-ext)

### [CSS Paged Media 3](https://www.w3.org/TR/css-page-3/)

- [@page](https://www.w3.org/TR/css-page-3/#at-page-rule)
- [Page-margin boxes (@top-left-corner, @top-left, @top-center, @top-right, @top-right-corner, @left-top, @left-middle, @left-bottom, @right-top, @right-middle, @right-bottom, @bottom-left-corner, @bottom-left, @bottom-center, @bottom-right, @bottom-right-coner)](https://www.w3.org/TR/css-page-3/#margin-at-rules)
- [Page selectors](https://www.w3.org/TR/css-page-3/#page-selectors)
  - [:left, :right](https://www.w3.org/TR/css-page-3/#spread-pseudos)
  - [:recto, :verso](https://www.w3.org/TR/css-logical-1/#page)
  - [:first](https://www.w3.org/TR/css-page-3/#first-pseudo)
    - Note: In multi-document publications, the `:first` matches only the first page of the first document, and the `:nth(1)` matches the first page of each document. [[Issue]](https://github.com/vivliostyle/vivliostyle.js/issues/667#issuecomment-738020563)
  - [:blank](https://www.w3.org/TR/css-page-3/#blank-pseudo)
- [Named pages (page type selector)](https://www.w3.org/TR/css-page-3/#page-type-selector)
- [Page-based counters (page, pages)](https://www.w3.org/TR/css-page-3/#page-based-counters)

See also: [Properties in CSS Paged Media 3](#css-paged-media-3-2)

### [CSS Generated Content for Paged Media (GCPM) 3](https://www.w3.org/TR/css-gcpm-3/)

- [Nth page selector `:nth(An+B [of <custom-ident>])`](https://www.w3.org/TR/css-gcpm-3/#document-page-selectors)
  - Note: In multi-document publications, the `:nth(1)` matches the first page of each document, but the `:first` matches only the first page of the first document. [[Issue]](https://github.com/vivliostyle/vivliostyle.js/issues/667#issuecomment-738020563)

See also:

- [Properties in CSS Generated Content for Paged Media (GCPM) 3](#css-generated-content-for-paged-media-gcpm-3-2)
- [Values - Cross references, content(), and string() functions](#values)

### [CSS Fonts 3](https://www.w3.org/TR/css-fonts-3/)

- [@font-face](https://www.w3.org/TR/css-fonts-3/#font-face-rule)
  - [font-style, font-weight, font-stretch descriptors](https://www.w3.org/TR/css-fonts-3/#font-prop-desc)
  - [unicode-range descriptor](https://www.w3.org/TR/css-fonts-3/#unicode-range-desc)

See also: [Properties in CSS Fonts 3](#css-fonts-3-2)

### [CSS Counter Styles 3](https://www.w3.org/TR/css-counter-styles-3/)

- [@counter-style](https://www.w3.org/TR/css-counter-styles-3/#the-counter-style-rule)
- [Extending `list-style-type`, `counter()`, and `counters()`](https://www.w3.org/TR/css-counter-styles-3/#extending-css2)
- [Predefined Counter Styles](https://www.w3.org/TR/css-counter-styles-3/#predefined-counters)

## Media queries

- Vivliostyle uses styles specified for [`print` media](https://www.w3.org/TR/CSS2/media.html#media-types) (as well as `all`).
  - Vivliostyle specific media type `vivliostyle` is enabled in addition to `print` media.
- Supported media features
  - [`(min-|max-)width`](https://www.w3.org/TR/css3-mediaqueries/#width)
  - [`(min-|max-)height`](https://www.w3.org/TR/css3-mediaqueries/#height)
  - [`(min-|max-)device-width`](https://www.w3.org/TR/css3-mediaqueries/#device-width)
  - [`(min-|max-)device-height`](https://www.w3.org/TR/css3-mediaqueries/#device-height)
  - [`(min-|max-)color`](https://www.w3.org/TR/css3-mediaqueries/#color)

## Properties

### [CSS 2](https://www.w3.org/TR/CSS2/)

- [background](https://www.w3.org/TR/CSS2/colors.html#propdef-background)
  - Supports [CSS Backgrounds 3 syntax](https://www.w3.org/TR/css3-background/#propdef-background)
- [background-attachment](https://www.w3.org/TR/CSS2/colors.html#propdef-background-attachment)
  - Supports [CSS Backgrounds 3 syntax](https://www.w3.org/TR/css3-background/#propdef-background-attachment)
- [background-color](https://www.w3.org/TR/CSS2/colors.html#propdef-background-color)
  - Supports [CSS Backgrounds 3 syntax](https://www.w3.org/TR/css3-background/#propdef-background-color)
- [background-image](https://www.w3.org/TR/CSS2/colors.html#propdef-background-image)
  - Supports [CSS Backgrounds 3 syntax](https://www.w3.org/TR/css3-background/#propdef-background-image)
- [background-position](https://www.w3.org/TR/CSS2/colors.html#propdef-background-position)
  - Supports [CSS Backgrounds 3 syntax](https://www.w3.org/TR/css3-background/#propdef-background-position)
- [background-repeat](https://www.w3.org/TR/CSS2/colors.html#propdef-background-repeat)
  - Supports [CSS Backgrounds 3 syntax](https://www.w3.org/TR/css3-background/#propdef-background-repeat)
- [border](https://www.w3.org/TR/CSS2/box.html#propdef-border)
- [border-bottom](https://www.w3.org/TR/CSS2/box.html#propdef-border-bottom)
- [border-bottom-color](https://www.w3.org/TR/CSS2/box.html#propdef-border-bottom-color)
- [border-bottom-style](https://www.w3.org/TR/CSS2/box.html#propdef-border-bottom-style)
- [border-bottom-width](https://www.w3.org/TR/CSS2/box.html#propdef-border-bottom-width)
- [border-collapse](https://www.w3.org/TR/CSS2/tables.html#propdef-border-collapse)
- [border-color](https://www.w3.org/TR/CSS2/box.html#propdef-border-color)
- [border-left](https://www.w3.org/TR/CSS2/box.html#propdef-border-left)
- [border-left-color](https://www.w3.org/TR/CSS2/box.html#propdef-border-left-color)
- [border-left-style](https://www.w3.org/TR/CSS2/box.html#propdef-border-left-style)
- [border-left-width](https://www.w3.org/TR/CSS2/box.html#propdef-border-left-width)
- [border-right](https://www.w3.org/TR/CSS2/box.html#propdef-border-right)
- [border-right-color](https://www.w3.org/TR/CSS2/box.html#propdef-border-right-color)
- [border-right-style](https://www.w3.org/TR/CSS2/box.html#propdef-border-right-style)
- [border-right-width](https://www.w3.org/TR/CSS2/box.html#propdef-border-right-width)
- [border-spacing](https://www.w3.org/TR/CSS2/tables.html#propdef-border-spacing)
- [border-style](https://www.w3.org/TR/CSS2/box.html#propdef-border-style)
- [border-top](https://www.w3.org/TR/CSS2/box.html#propdef-border-top)
- [border-top-color](https://www.w3.org/TR/CSS2/box.html#propdef-border-top-color)
- [border-top-style](https://www.w3.org/TR/CSS2/box.html#propdef-border-top-style)
- [border-top-width](https://www.w3.org/TR/CSS2/box.html#propdef-border-top-width)
- [border-width](https://www.w3.org/TR/CSS2/box.html#propdef-border-width)
- [bottom](https://www.w3.org/TR/CSS2/visuren.html#propdef-bottom)
- [caption-side](https://www.w3.org/TR/CSS2/tables.html#propdef-caption-side)
- [clear](https://www.w3.org/TR/CSS2/visuren.html#propdef-clear)
  - See also [CSS Page Floats](#css-page-floats)
- [clip](https://www.w3.org/TR/CSS2/visufx.html#propdef-clip)
- [color](https://www.w3.org/TR/CSS2/colors.html#propdef-color)
- [content](https://www.w3.org/TR/CSS2/generate.html#propdef-content)
- [counter-increment](https://www.w3.org/TR/CSS2/generate.html#propdef-counter-increment)
- [counter-reset](https://www.w3.org/TR/CSS2/generate.html#propdef-counter-reset)
- [counter-set](https://www.w3.org/TR/css-lists-3/#propdef-counter-set)
- [cursor](https://www.w3.org/TR/CSS2/ui.html#propdef-cursor)
- [direction](https://www.w3.org/TR/CSS2/visuren.html#propdef-direction)
- [display](https://www.w3.org/TR/CSS2/visuren.html#propdef-display)
  - Supports [`flex`, `inline-flex`](https://www.w3.org/TR/css-flexbox-1/#flex-containers), [`ruby`, `ruby-base`, `ruby-text`, `ruby-base-container` and `ruby-text-container`](https://www.w3.org/TR/css-ruby-1/#propdef-display) values.
- [empty-cells](https://www.w3.org/TR/CSS2/tables.html#propdef-empty-cells)
- [float](https://www.w3.org/TR/CSS2/visuren.html#propdef-float)
  - See also [CSS Page Floats](#css-page-floats)
- [font](https://www.w3.org/TR/CSS2/fonts.html#propdef-font)
- [font-family](https://www.w3.org/TR/CSS2/fonts.html#propdef-font-family)
- [font-size](https://www.w3.org/TR/CSS2/fonts.html#propdef-font-size)
- [font-style](https://www.w3.org/TR/CSS2/fonts.html#propdef-font-style)
- [font-variant](https://www.w3.org/TR/CSS2/fonts.html#propdef-font-variant)
  - Supports [CSS Fonts 3 font-variant](https://www.w3.org/TR/css-fonts-3/#propdef-font-variant)
- [font-weight](https://www.w3.org/TR/CSS2/fonts.html#propdef-font-weight)
- [height](https://www.w3.org/TR/CSS2/visudet.html#propdef-height)
- [left](https://www.w3.org/TR/CSS2/visuren.html#propdef-left)
- [letter-spacing](https://www.w3.org/TR/CSS2/text.html#propdef-letter-spacing)
- [line-height](https://www.w3.org/TR/CSS2/visudet.html#propdef-line-height)
- [list-style](https://www.w3.org/TR/CSS2/generate.html#propdef-list-style)
- [list-style-image](https://www.w3.org/TR/CSS2/generate.html#propdef-list-style-image)
- [list-style-position](https://www.w3.org/TR/CSS2/generate.html#propdef-list-style-position)
- [list-style-type](https://www.w3.org/TR/CSS2/generate.html#propdef-list-style-type)
- [margin](https://www.w3.org/TR/CSS2/box.html#propdef-margin)
- [margin-bottom](https://www.w3.org/TR/CSS2/box.html#propdef-margin-bottom)
- [margin-left](https://www.w3.org/TR/CSS2/box.html#propdef-margin-left)
- [margin-right](https://www.w3.org/TR/CSS2/box.html#propdef-margin-right)
- [margin-top](https://www.w3.org/TR/CSS2/box.html#propdef-margin-top)
- [max-height](https://www.w3.org/TR/CSS2/visudet.html#propdef-max-height)
- [max-width](https://www.w3.org/TR/CSS2/visudet.html#propdef-max-width)
- [min-height](https://www.w3.org/TR/CSS2/visudet.html#propdef-min-height)
- [min-width](https://www.w3.org/TR/CSS2/visudet.html#propdef-min-width)
- [orphans](https://www.w3.org/TR/CSS2/page.html#propdef-orphans)
- [outline](https://www.w3.org/TR/CSS2/ui.html#propdef-outline)
- [outline-color](https://www.w3.org/TR/CSS2/ui.html#propdef-outline-color)
- [outline-offset](https://www.w3.org/TR/css3-ui/#propdef-outline-offset)
- [outline-style](https://www.w3.org/TR/CSS2/ui.html#propdef-outline-style)
- [outline-width](https://www.w3.org/TR/CSS2/ui.html#propdef-outline-width)
- [overflow](https://www.w3.org/TR/CSS2/visufx.html#propdef-overflow)
- [padding](https://www.w3.org/TR/CSS2/box.html#propdef-padding)
- [padding-bottom](https://www.w3.org/TR/CSS2/box.html#propdef-padding-bottom)
- [padding-left](https://www.w3.org/TR/CSS2/box.html#propdef-padding-left)
- [padding-right](https://www.w3.org/TR/CSS2/box.html#propdef-padding-right)
- [padding-top](https://www.w3.org/TR/CSS2/box.html#propdef-padding-top)
- [page-break-after](https://www.w3.org/TR/CSS2/page.html#propdef-page-break-after)
- [page-break-before](https://www.w3.org/TR/CSS2/page.html#propdef-page-break-before)
- [page-break-inside](https://www.w3.org/TR/CSS2/page.html#propdef-page-break-inside)
- [position](https://www.w3.org/TR/CSS2/visuren.html#propdef-position)
- [quotes](https://www.w3.org/TR/CSS2/generate.html#propdef-quotes)
  - Note: not supported within `@page` rules. [[Issue]](https://github.com/vivliostyle/vivliostyle.js/issues/43)
- [right](https://www.w3.org/TR/CSS2/visuren.html#propdef-right)
- [table-layout](https://www.w3.org/TR/CSS2/tables.html#propdef-table-layout)
- [text-align](https://www.w3.org/TR/CSS2/text.html#propdef-text-align)
- [text-decoration](https://www.w3.org/TR/CSS2/text.html#propdef-text-decoration)
- [text-indent](https://www.w3.org/TR/CSS2/text.html#propdef-text-indent)
- [text-transform](https://www.w3.org/TR/CSS2/text.html#propdef-text-transform)
- [top](https://www.w3.org/TR/CSS2/visuren.html#propdef-top)
- [unicode-bidi](https://www.w3.org/TR/CSS2/visuren.html#propdef-unicode-bidi)
  - Supports [new values (`isolate`, `isolate-override`, `plaintext`) in CSS Writing Modes 3](https://www.w3.org/TR/css-writing-modes-3/#propdef-unicode-bidi)
- [vertical-align](https://www.w3.org/TR/CSS2/visudet.html#propdef-vertical-align)
- [visibility](https://www.w3.org/TR/CSS2/visufx.html#propdef-visibility)
- [white-space](https://www.w3.org/TR/CSS2/text.html#propdef-white-space)
- [widows](https://www.w3.org/TR/CSS2/page.html#propdef-widows)
- [width](https://www.w3.org/TR/CSS2/visudet.html#propdef-width)
- [word-spacing](https://www.w3.org/TR/CSS2/text.html#propdef-word-spacing)
- [z-index](https://www.w3.org/TR/CSS2/visuren.html#propdef-z-index)

### [CSS Paged Media 3](https://www.w3.org/TR/css-page-3/)

- [bleed](https://www.w3.org/TR/css-page-3/#bleed)
  - Only effective when specified within an `@page` rule without page selectors
- [marks](https://www.w3.org/TR/css-page-3/#marks)
  - Only effective when specified within an `@page` rule without page selectors
- [size](https://www.w3.org/TR/css-page-3/#page-size-prop)
  - Supports all required values and proposed values `A0`-`A10`, `B0`-`B10`, `C0`-`C10` and `JIS-B0`-`JIS-B10`. See [[Pull Request]](https://github.com/vivliostyle/vivliostyle.js/pull/713)
- crop-offset
  - Specifies distance between the edge of the trim size and the edge of the output page media size
  - This property is not standardized yet. See [[Issue]](https://github.com/vivliostyle/vivliostyle.js/issues/913)
- crop-marks-line-color
  - Specifies color of the crop marks
  - This property is not standardized yet. See [[Pull Request]](https://github.com/vivliostyle/vivliostyle.js/pull/1505)
- [page (Named Pages)](https://www.w3.org/TR/css-page-3/#using-named-pages)

See also: [At-rules in CSS Paged Media 3](#css-paged-media-3)

### [CSS Generated Content for Paged Media (GCPM) 3](https://www.w3.org/TR/css-gcpm-3/)

- [string-set (Named Strings)](https://www.w3.org/TR/css-gcpm-3/#setting-named-strings-the-string-set-pro)
- [position: running() (Running Elements)](https://www.w3.org/TR/css-gcpm-3/#running-elements)
- [footnote-policy](https://www.w3.org/TR/css-gcpm-3/#propdef-footnote-policy)
  - Supports [`auto`, `line`](https://www.w3.org/TR/css-gcpm-3/#propdef-footnote-policy) values.

See also:

- [At-rules in CSS Generated Content for Paged Media (GCPM) 3](#css-generated-content-for-paged-media-gcpm-3)
- [Values - Cross references, string(), content(), running(), element(), and leader() functions](#values)

### [CSS Fragmentation 3](https://www.w3.org/TR/css-break-3/)

- [break-after](https://www.w3.org/TR/css-break-3/#propdef-break-after)
- [break-before](https://www.w3.org/TR/css-break-3/#propdef-break-before)
- [break-inside](https://www.w3.org/TR/css-break-3/#propdef-break-inside)
  - Note: All of `avoid-page`, `avoid-column` and `avoid-region` values are treated as if they were `avoid`. [[Issue]](https://github.com/vivliostyle/vivliostyle.js/issues/128)
- [orphans](https://www.w3.org/TR/css-break-3/#propdef-orphans)
- [widows](https://www.w3.org/TR/css-break-3/#propdef-widows)
- [box-decoration-break](https://www.w3.org/TR/css-break-3/#propdef-box-decoration-break)
  - Note: Background, box-shadow and border images on inline-start/end borders are always rendered as if `box-decoration-break: clone` is specified.

### [CSS Fragmentation 4](https://www.w3.org/TR/css-break-4/)

- [margin-break](https://www.w3.org/TR/css-break-4/#break-margins)

### [CSS Page Floats](https://drafts.csswg.org/css-page-floats/)

- [clear](https://drafts.csswg.org/css-page-floats/#propdef-clear)
  - Supports [`none`, `inline-start`, `inline-end`, `block-start`, `block-end`, `left`, `right`, `top`, `bottom`, `both`, `all`, `same`](https://drafts.csswg.org/css-page-floats/#propdef-clear) values.
  - When `all` is specified on a block-level box (not a page float), the block-start edge of the box gets pushed down so that the edge comes after any block-start/block-end page float of which anchors are before the box in the document order.
  - When a `clear` value is specified on a page float, it is placed so that it comes after any of preceding page floats.
  - `same` value means the same direction as one which the page float is floated to.
  - If a page float with `float: snap-block` would be placed at the block-start end but a `clear` value on it forbidden such placement, the float is instead placed at the block-end side (unless the `clear` value also forbidden such placement).
  - The `page`, `column`, and `region` values ensure that preceding page floats are placed before the page/column/region containing the element that has the `clear` property, which can be a page float, a normal float, or a block-level box.
- [float](https://drafts.csswg.org/css-page-floats/#propdef-float)
  - Supports [`block-start`, `block-end`, `inline-start`, `inline-end`, `snap-block`, `left`, `right`, `top`, `bottom` and `none`](https://drafts.csswg.org/css-page-floats/#propdef-float) values.
  - Supports values combining keywords. For example,
    - `float: top right;` float to top right corner
    - `float: bottom left;` float to bottom left corner
    - `float: top bottom;` float to top or bottom edge
    - `float: top bottom left;` float to top left or bottom left corner
    - `float: top bottom left right;` float to top left, top right, bottom left, or bottom right corner
    - `float: block-start inline-start;` float to block-start and inline-start corner
    - `float: block-start block-end;` float to block-start or block-end edge (same as 'snap-block')
    - See [[Pull Request]](https://github.com/vivliostyle/vivliostyle.js/pull/1444)
- [float-reference](https://drafts.csswg.org/css-page-floats/#propdef-float-reference)
  - Specify `float-reference: page` (or `column`/`region`) to enable page (or column/region) float.
- float-min-wrap-block
  - Applies to a page float
  - A percentage value is respect to the block dimension of the float reference of the page float
  - When set to a positive length, in-flow contents are not allowed to be flown into a space next to the page float if the block extent of the space is less than the specified length. In that case, the space is kept empty and the in-flow contents are deferred to the next column.
  - This property is not standardized yet. See [[Pull Request]](https://github.com/vivliostyle/vivliostyle.js/pull/382)

### [CSS Color 3](https://www.w3.org/TR/css3-color/)

- [color](https://www.w3.org/TR/css-color-3/#foreground)
- [opacity](https://www.w3.org/TR/css-color-3/#transparency)

See also: [Values - Supported color values](#values)

### [CSS Backgrounds and Borders 3](https://www.w3.org/TR/css3-background/)

- [background](https://www.w3.org/TR/css3-background/#propdef-background)
- [background-attachment](https://www.w3.org/TR/css3-background/#propdef-background-attachment)
- [background-clip](https://www.w3.org/TR/css3-background/#propdef-background-clip)
- [background-color](https://www.w3.org/TR/css3-background/#propdef-background-color)
- [background-image](https://www.w3.org/TR/css3-background/#propdef-background-image)
- [background-origin](https://www.w3.org/TR/css3-background/#propdef-background-origin)
- [background-position](https://www.w3.org/TR/css3-background/#propdef-background-position)
- [background-repeat](https://www.w3.org/TR/css3-background/#propdef-background-repeat)
- [background-size](https://www.w3.org/TR/css3-background/#propdef-background-size)
- [border](https://www.w3.org/TR/css3-background/#propdef-border)
- [border-bottom](https://www.w3.org/TR/css3-background/#propdef-border-bottom)
- [border-bottom-color](https://www.w3.org/TR/css3-background/#propdef-border-bottom-color)
- [border-bottom-left-radius](https://www.w3.org/TR/css3-background/#propdef-border-bottom-left-radius)
- [border-bottom-right-radius](https://www.w3.org/TR/css3-background/#propdef-border-bottom-right-radius)
- [border-bottom-style](https://www.w3.org/TR/css3-background/#propdef-border-bottom-style)
- [border-bottom-width](https://www.w3.org/TR/css3-background/#propdef-border-bottom-width)
- [border-color](https://www.w3.org/TR/css3-background/#propdef-border-color)
- [border-image](https://www.w3.org/TR/css3-background/#propdef-border-image)
- [border-image-outset](https://www.w3.org/TR/css3-background/#propdef-border-image-outset)
- [border-image-repeat](https://www.w3.org/TR/css3-background/#propdef-border-image-repeat)
- [border-image-slice](https://www.w3.org/TR/css3-background/#propdef-border-image-slice)
- [border-image-source](https://www.w3.org/TR/css3-background/#propdef-border-image-source)
- [border-image-width](https://www.w3.org/TR/css3-background/#propdef-border-image-width)
- [border-left](https://www.w3.org/TR/css3-background/#propdef-border-left)
- [border-left-color](https://www.w3.org/TR/css3-background/#propdef-border-left-color)
- [border-left-style](https://www.w3.org/TR/css3-background/#propdef-border-left-style)
- [border-left-width](https://www.w3.org/TR/css3-background/#propdef-border-left-width)
- [border-radius](https://www.w3.org/TR/css3-background/#propdef-border-radius)
- [border-right](https://www.w3.org/TR/css3-background/#propdef-border-right)
- [border-right-color](https://www.w3.org/TR/css3-background/#propdef-border-right-color)
- [border-right-style](https://www.w3.org/TR/css3-background/#propdef-border-right-style)
- [border-right-width](https://www.w3.org/TR/css3-background/#propdef-border-right-width)
- [border-style](https://www.w3.org/TR/css3-background/#propdef-border-style)
- [border-top](https://www.w3.org/TR/css3-background/#propdef-border-top)
- [border-top-color](https://www.w3.org/TR/css3-background/#propdef-border-top-color)
- [border-top-left-radius](https://www.w3.org/TR/css3-background/#propdef-border-top-left-radius)
- [border-top-right-radius](https://www.w3.org/TR/css3-background/#propdef-border-top-right-radius)
- [border-top-style](https://www.w3.org/TR/css3-background/#propdef-border-top-style)
- [border-top-width](https://www.w3.org/TR/css3-background/#propdef-border-top-width)
- [border-width](https://www.w3.org/TR/css3-background/#propdef-border-width)
- [box-shadow](https://www.w3.org/TR/css3-background/#propdef-box-shadow)

### [CSS Images 3](https://www.w3.org/TR/css-images-3/)

- [object-fit](https://www.w3.org/TR/css-images-3/#the-object-fit)
- [object-position](https://www.w3.org/TR/css-images-3/#the-object-position)
- [image-resolution](https://www.w3.org/TR/css-images-4/#the-image-resolution)
  - Only `<resolution>` value is supported.
  - Only supported for content of `img`, `input[type=image]` and `video` (applied to poster images) elements and before/after pseudoelements. Other images such as background images, list images or border images are not supported.
  - The property is applied to vector images such as SVG, as well as raster images. This behavior is different from what the spec specifies.

### [CSS Fonts 3](https://www.w3.org/TR/css-fonts-3/)

- [font-family](https://www.w3.org/TR/css-fonts-3/#propdef-font-family)
- [font-feature-settings](https://www.w3.org/TR/css-fonts-3/#propdef-font-feature-settings)
- [font-kerning](https://www.w3.org/TR/css-fonts-3/#propdef-font-kerning)
- [font-size](https://www.w3.org/TR/css-fonts-3/#propdef-font-size)
- [font-style](https://www.w3.org/TR/css-fonts-3/#propdef-font-style)
- [font-variant](https://www.w3.org/TR/css-fonts-3/#propdef-font-variant)
- [font-variant-ligatures](https://www.w3.org/TR/css-fonts-3/#propdef-font-variant-ligatures)
- [font-variant-caps](https://www.w3.org/TR/css-fonts-3/#propdef-font-variant-caps)
- [font-variant-numeric](https://www.w3.org/TR/css-fonts-3/#propdef-font-variant-numeric)
- [font-variant-east-asian](https://www.w3.org/TR/css-fonts-3/#propdef-font-variant-east-asian)
- [font-weight](https://www.w3.org/TR/css-fonts-3/#propdef-font-weight)
- [font-stretch](https://www.w3.org/TR/css-fonts-4/#propdef-font-stretch)

See also: [At-rules in CSS Fonts 3](#css-fonts-3)

### [CSS Text 3](https://www.w3.org/TR/css-text-3/)

- [hanging-punctuation](hanging-punctuation)
  - Supports all required values, `none | [ first || [ force-end | allow-end ] || last ]`. See [[Pull Request]](https://github.com/vivliostyle/vivliostyle.js/pull/814)
- [hyphens](https://www.w3.org/TR/css-text-3/#hyphenation)
- [letter-spacing](https://www.w3.org/TR/css-text-3/#letter-spacing-property)
- [line-break](https://www.w3.org/TR/css-text-3/#line-break-property)
- [overflow-wrap, word-wrap](https://www.w3.org/TR/css-text-3/#overflow-wrap-property)
- [tab-size](https://www.w3.org/TR/css-text-3/#tab-size-property)
- [text-align-last](https://www.w3.org/TR/css-text-3/#text-align-last-property)
  - Note: While `text-align` property is a shorthand in CSS Text 3, Vivliostyle treats `text-align` for now as an independent property (defined in CSS 2.1) rather than a shorthand.
- [white-space](https://www.w3.org/TR/css-text-3/#white-space-property)
- [word-break](https://www.w3.org/TR/css-text-3/#word-break-property)

### [CSS Text 4](https://www.w3.org/TR/css-text-4/)

- [text-autospace](https://www.w3.org/TR/css-text-4/#text-autospace-property)
  - Supported values: `normal | no-autospace | [ ideograph-alpha || ideograph-numeric ] | auto`
- [text-spacing-trim](https://www.w3.org/TR/css-text-4/#text-spacing-trim-property)
  - Values: `space-all | normal | space-first | trim-start | trim-both | auto`
- [text-spacing](https://www.w3.org/TR/css-text-4/#text-spacing-property)
  - Values: `normal | none | auto | [<autospace> || <spacing-trim>]`
  - Note: This is a shorthand property that sets the `text-autospace` and `text-spacing-trim` properties. See [[Pull Request]](https://github.com/vivliostyle/vivliostyle.js/pull/1142)

### [CSS Text Decoration 3](https://www.w3.org/TR/css-text-decor-3/)

- [text-decoration-color](https://www.w3.org/TR/css-text-decor-3/#text-decoration-color-property)
- [text-decoration-line](https://www.w3.org/TR/css-text-decor-3/#text-decoration-line-property)
- [text-decoration-style](https://www.w3.org/TR/css-text-decor-3/#text-decoration-style-property)
- [text-emphasis](https://www.w3.org/TR/css-text-decor-3/#text-emphasis-property)
- [text-emphasis-color](https://www.w3.org/TR/css-text-decor-3/#text-emphasis-color-property)
- [text-emphasis-position](https://www.w3.org/TR/css-text-decor-3/#text-emphasis-position-property)
- [text-emphasis-style](https://www.w3.org/TR/css-text-decor-3/#text-emphasis-style-property)
- [text-shadow](https://www.w3.org/TR/css-text-decor-3/#text-shadow-property)
- [text-underline-position](https://www.w3.org/TR/css-text-decor-3/#text-underline-position-property)

### [CSS Inline Layout 3](https://www.w3.org/TR/css-inline-3/)

- [initial-letter](https://www.w3.org/TR/css-inline-3/#sizing-drop-initials)

### [CSS Multi-column 1](https://www.w3.org/TR/css3-multicol/)

**Note:** Currently the multi-column layout works well only when specified on the root or body element. [[Issue]](https://github.com/vivliostyle/vivliostyle.js/issues/579)

- [column-count](https://www.w3.org/TR/css3-multicol/#propdef-column-count)
- [column-gap](https://www.w3.org/TR/css-multicol-1/#cg)
- [column-rule](https://www.w3.org/TR/css3-multicol/#propdef-column-rule)
- [column-rule-color](https://www.w3.org/TR/css3-multicol/#propdef-column-rule-color)
- [column-rule-style](https://www.w3.org/TR/css3-multicol/#propdef-column-rule-style)
- [column-rule-width](https://www.w3.org/TR/css3-multicol/#propdef-column-rule-width)
- [column-width](https://www.w3.org/TR/css3-multicol/#propdef-column-width)
- [columns](https://www.w3.org/TR/css3-multicol/#propdef-columns)
- [column-fill](https://www.w3.org/TR/css3-multicol/#propdef-column-fill)
- [column-span](https://drafts.csswg.org/css-multicol-2/#propdef-column-span)
  - Note: Currently `column-span` is effective only when specified on a page float. When `auto` value is specified, either a single column or all columns are spanned depending on the min-content inline size of the page float.

### [CSS Basic User Interface 3](https://www.w3.org/TR/css3-ui/)

- [box-sizing](https://www.w3.org/TR/css3-ui/#propdef-box-sizing)
- [outline](https://www.w3.org/TR/css3-ui/#propdef-outline)
- [outline-color](https://www.w3.org/TR/css3-ui/#propdef-outline-color)
- [outline-style](https://www.w3.org/TR/css3-ui/#propdef-outline-style)
- [outline-width](https://www.w3.org/TR/css3-ui/#propdef-outline-width)
- [text-overflow](https://www.w3.org/TR/css3-ui/#propdef-text-overflow)

### [CSS Writing Modes 3](https://www.w3.org/TR/css-writing-modes-3/)

- [direction](https://www.w3.org/TR/css-writing-modes-3/#propdef-direction)
- [text-combine-upright](https://www.w3.org/TR/css-writing-modes-3/#propdef-text-combine-upright)
- [text-orientation](https://www.w3.org/TR/css-writing-modes-3/#propdef-text-orientation)
- [unicode-bidi](https://www.w3.org/TR/css-writing-modes-3/#propdef-unicode-bidi)
- [writing-mode](https://www.w3.org/TR/css-writing-modes-3/#propdef-writing-mode)

### [CSS Flexible Box 1](https://www.w3.org/TR/css-flexbox-1/)

- [align-content](https://www.w3.org/TR/css-flexbox-1/#propdef-align-content)
- [align-items](https://www.w3.org/TR/css-flexbox-1/#propdef-align-items)
- [align-self](https://www.w3.org/TR/css-flexbox-1/#propdef-align-self)
- [display](https://www.w3.org/TR/css-flexbox-1/#flex-containers)
- [flex](https://www.w3.org/TR/css-flexbox-1/#propdef-flex)
- [flex-basis](https://www.w3.org/TR/css-flexbox-1/#propdef-flex-basis)
- [flex-direction](https://www.w3.org/TR/css-flexbox-1/#propdef-flex-direction)
- [flex-flow](https://www.w3.org/TR/css-flexbox-1/#propdef-flex-flow)
- [flex-grow](https://www.w3.org/TR/css-flexbox-1/#propdef-flex-grow)
- [flex-shrink](https://www.w3.org/TR/css-flexbox-1/#propdef-flex-shrink)
- [flex-wrap](https://www.w3.org/TR/css-flexbox-1/#propdef-flex-wrap)
- [justify-content](https://www.w3.org/TR/css-flexbox-1/#propdef-justify-content)
- [order](https://www.w3.org/TR/css-flexbox-1/#propdef-order)

### [CSS Transforms 1](https://www.w3.org/TR/css-transforms-1/)

- [transform](https://www.w3.org/TR/css-transforms-1/#propdef-transform)
- [transform-origin](https://www.w3.org/TR/css-transforms-1/#propdef-transform-origin)
- [backface-visibility](https://www.w3.org/TR/css-transforms-2/#propdef-backface-visibility)

<!--
### [CSS Ruby Layout 1](https://www.w3.org/TR/css-ruby-1/)

- [display](https://www.w3.org/TR/css-ruby-1/#propdef-display)
  - Values: `ruby | ruby-base | ruby-text | ruby-base-container | ruby-text-container`
- [ruby-align](https://www.w3.org/TR/css-ruby-1/#propdef-ruby-align)
- [ruby-position](https://www.w3.org/TR/css-ruby-1/#propdef-ruby-position)
-->

<!--
### [CSS Mobile Text Size Adjustment 1](https://drafts.csswg.org/css-size-adjust-1/)

- [text-size-adjust](https://drafts.csswg.org/css-size-adjust-1/#text-size-adjust)
-->

### [Compositing and Blending 1](https://www.w3.org/TR/compositing-1/)

- [background-blend-mode](https://www.w3.org/TR/compositing-1/#propdef-background-blend-mode)
- [isolation](https://www.w3.org/TR/compositing-1/#propdef-isolation)
- [mix-blend-mode](https://www.w3.org/TR/compositing-1/#propdef-mix-blend-mode)

### [Scalable Vector Graphics (SVG) 2](https://www.w3.org/TR/SVG2/)

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

### [Scalable Vector Graphics (SVG) 1.1](https://www.w3.org/TR/SVG11/)

- [alignment-baseline](https://www.w3.org/TR/SVG11/text.html#AlignmentBaselineProperty)
- [baseline-shift](https://www.w3.org/TR/SVG11/text.html#BaselineShiftProperty)
- [dominant-baseline](https://www.w3.org/TR/SVG11/text.html#DominantBaselineProperty)
- [mask](https://www.w3.org/TR/SVG11/masking.html#MaskProperty)

### [CSS Masking 1](https://drafts.fxtf.org/css-masking-1/)

- [clip-path](https://drafts.fxtf.org/css-masking-1/#the-clip-path)
- [clip-rule](https://drafts.fxtf.org/css-masking-1/#the-clip-rule)

### [Filter Effects 1](https://www.w3.org/TR/filter-effects-1/)

- [filter](https://www.w3.org/TR/filter-effects-1/#propdef-filter)
- [flood-color](https://www.w3.org/TR/filter-effects-1/#FloodColorProperty)
- [flood-opacity](https://www.w3.org/TR/filter-effects-1/#propdef-flood-opacity)
- [lighting-color](https://www.w3.org/TR/filter-effects-1/#propdef-lighting-color)

### [Pointer Events](https://www.w3.org/TR/pointerevents/)

- [touch-action](https://www.w3.org/TR/pointerevents/#the-touch-action-css-property)

### [CSS Logical Properties and Values 1](https://www.w3.org/TR/css-logical-1/)

- [block-size, inline-size, min-block-size, min-inline-size, max-block-size, max-inline-size](https://www.w3.org/TR/css-logical-1/#dimension-properties)
- [margin-block-start, margin-block-end, margin-inline-start, margin-inline-end, margin-block, margin-inline](https://www.w3.org/TR/css-logical-1/#margin-properties)
- [inset-block-start, inset-block-end, inset-inline-start, inset-inline-end, inset-block, inset-inline](https://www.w3.org/TR/css-logical-1/#inset-properties)
- [padding-block-start, padding-block-end, padding-inline-start, padding-inline-end, padding-block, padding-inline](https://www.w3.org/TR/css-logical-1/#padding-properties)
- [border-block-start-width, border-block-end-width, border-inline-start-width, border-inline-end-width, border-block-width, border-inline-width, border-block-start-style, border-block-end-style, border-inline-start-style, border-inline-end-style, border-block-style, border-inline-style, border-block-start-color, border-block-end-color, border-inline-start-color, border-inline-end-color, border-block-color, border-inline-color, border-block-start, border-block-end, border-inline-start, border-inline-end, border-block, border-inline](https://www.w3.org/TR/css-logical-1/#border-properties)

### Page spread inside/outside properties and values

In these properties and values, the `inside` and `outside` keywords resolve to `left` and `right` depending on whether the page is left or right page.

Note: These CSS properties and values are not standardized yet. See [[Pull Request]](https://github.com/vivliostyle/vivliostyle.js/pull/1519)

Added \*-inside/outside properties:

- margin-inside, margin-outside
- padding-inside, padding-outside
- border-inside, border-outside
- border-inside-color, border-outside-color
- border-inside-style, border-outside-style
- border-inside-width, border-outside-width
- inset-inside, inset-outside

Extended properties with `inside` and `outside` values:

- float, clear
- text-align, text-align-last

### [CSS Repeated Headers and Footers](https://specs.rivoal.net/css-repeat/)

Note: This spec proposal is not submitted to CSS Working Group yet.

- [repeat-on-break](https://specs.rivoal.net/css-repeat/#propdef-repeat-on-break)

## [EPUB Adaptive Layout](http://www.idpf.org/epub/pgt/)

Note: This spec is not on a W3C standards track. Future version of Vivliostyle may drop support for this spec.

### At-rules

- [@-epubx-define](http://www.idpf.org/epub/pgt/#rule-define)
- [@-epubx-flow](http://www.idpf.org/epub/pgt/#rule-flow)
- [@-epubx-page-master](http://www.idpf.org/epub/pgt/#rule-page-master)
- [@-epubx-page-template](http://www.idpf.org/epub/pgt/#rule-page-template)
- [@-epubx-partition](http://www.idpf.org/epub/pgt/#rule-partition)
- [@-epubx-partition-group](http://www.idpf.org/epub/pgt/#rule-partition-group)
- [@-epubx-region](http://www.idpf.org/epub/pgt/#rule-region)
- [@-epubx-viewport](http://www.idpf.org/epub/pgt/#rule-viewport)
- [@-epubx-when](http://www.idpf.org/epub/pgt/#rule-when)

### Properties

- [-epubx-conflicting-partitions](http://www.idpf.org/epub/pgt/#prop-conflicting-partitions)
- [-epubx-enabled](http://www.idpf.org/epub/pgt/#prop-enabled)
- [-epubx-flow-consume](http://www.idpf.org/epub/pgt/#prop-flow-consume)
- [-epubx-flow-from](http://www.idpf.org/epub/pgt/#prop-flow-from)
  - Only effective when specified to EPUB Adaptive Layout partitions.
- [-epubx-flow-into](http://www.idpf.org/epub/pgt/#prop-flow-into)
- [-epubx-flow-linger](http://www.idpf.org/epub/pgt/#prop-flow-linger)
- [-epubx-flow-options](http://www.idpf.org/epub/pgt/#prop-flow-options)
- [-epubx-flow-priority](http://www.idpf.org/epub/pgt/#prop-flow-priority)
- [-epubx-min-page-height](http://www.idpf.org/epub/pgt/#prop-min-page-height)
- [-epubx-min-page-width](http://www.idpf.org/epub/pgt/#prop-min-page-width)
- [-epubx-required](http://www.idpf.org/epub/pgt/#prop-required)
- [-epubx-required-partitions](http://www.idpf.org/epub/pgt/#prop-required-partitions)
- [-epubx-shape-outside](http://www.idpf.org/epub/pgt/#prop-shape-outside)
  - Only effective when specified to EPUB Adaptive Layout partitions.
  - Note: only [old syntaxes from 3 May 2012 Working Draft](https://www.w3.org/TR/2012/WD-css3-exclusions-20120503/#supported-svg-shapes) are supported.
- [-epubx-shape-inside](http://www.idpf.org/epub/pgt/#prop-shape-inside)
  - Only effective when specified to EPUB Adaptive Layout partitions.
  - Note: only [old syntaxes from 3 May 2012 Working Draft](https://www.w3.org/TR/2012/WD-css3-exclusions-20120503/#supported-svg-shapes) are supported.
- [-epubx-snap-height](http://www.idpf.org/epub/pgt/#prop-snap-height)
- [-epubx-snap-width](http://www.idpf.org/epub/pgt/#prop-snap-width)
- [-epubx-text-zoom](http://www.idpf.org/epub/pgt/#prop-text-zoom)
- [-epubx-utilization](http://www.idpf.org/epub/pgt/#prop-utilization)
- [-epubx-wrap-flow](http://www.idpf.org/epub/pgt/#prop-wrap-flow)
  - Only effective when specified to EPUB Adaptive Layout partitions.
