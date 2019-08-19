# Features supported by Vivliostyle 2019.8.101

The Vivliostyle uses a two-layer architecture, with some of its functionality implemented purely in javascript, and some being delegated all or in part to the browser engine on top of which Vivliostyle is running. In the following list <quote>Supported in all browsers</quote> indicates that features implemented in Javascript that will work regardless of the browser engine. Other features' availability and behavior do vary based on what is supported by the underlying browser engine.

Properties where <quote>Allowed prefixes</quote> is indicated may be used with any of the listed prefixes, or preferably without a prefix, regardless of the underlying browser engine. If Vivliostyle needs to invoke the browser engine, it will internally convert to the appropriate syntax.

## Values

- [Supported CSS-wide keywords](https://www.w3.org/TR/css-values/#common-keywords): `inherit`
  - Supported in all browsers
  - `initial` and `unset` are *not* supported.
- [Supported length units](https://www.w3.org/TR/css-values/#lengths): `em`, `ex`, `ch`, `rem`, `vw`, `vh`, `vmin, vmax`, `vi`, `vb`, `cm`, `mm`, `q`, `in`, `pc`, `pt`, `px`.
  - Supported in all browsers
- Supported color values
  - Support depends on browser capabilities
  - [Basic color keywords](https://www.w3.org/TR/css3-color/#html4)
  - [RGB color values](https://www.w3.org/TR/css3-color/#rgb-color), [RGBA color values](https://www.w3.org/TR/css3-color/#rgba-color)
  - [‘transparent’ color keyword](https://www.w3.org/TR/css3-color/#transparent)
  - [HSL color values](https://www.w3.org/TR/css3-color/#hsl-color), [HSLA color values](https://www.w3.org/TR/css3-color/#hsla-color)
  - [Extended color keywords](https://www.w3.org/TR/css3-color/#svg-color)
  - [‘currentColor’ color keyword](https://www.w3.org/TR/css3-color/#currentcolor)
- [Attribute references: `attr()`](https://www.w3.org/TR/css-values/#attr-notation)
  - Supported in all browsers
  - Only supported in values of `content` property.
  - Only 'string' and 'url' types are supported.
- [Cross references: `target-counter()` and `target-counters()`](https://drafts.csswg.org/css-content/#cross-references)
  - Supported in all browsers
  - Only supported in values of `content` property.
- [`calc()` function](https://www.w3.org/TR/css-values/#funcdef-calc)
  - Supported in all browsers
  - `min()` and `max()` functions can be used inside `calc()` function.
  - Limitation: Percentage value in `calc()` is not calculated correctly.
- [`env()` function](https://drafts.csswg.org/css-env/)
  - Supported in all browsers
  - Implemented only `env(pub-title)` and `env(doc-title)` that are not yet defined in the css-env draft spec but useful for making page header.
    - `env(pub-title)`: publication title = EPUB, Web publication, or primary entry page HTML title.
    - `env(doc-title)`: document title = HTML title, which may be chapter or section title in a publication composed of multiple HTML documents

## Selectors

### [CSS 2](https://www.w3.org/TR/CSS2/)

- [Universal selector `*`](https://www.w3.org/TR/CSS2/selector.html#universal-selector)
  - Supported in all browsers
- [Type selectors `E`](https://www.w3.org/TR/CSS2/selector.html#type-selectors)
  - Supported in all browsers
- [Descendant selectors `E F`](https://www.w3.org/TR/CSS2/selector.html#descendant-selectors)
  - Supported in all browsers
- [Child selectors `E > F`](https://www.w3.org/TR/CSS2/selector.html#child-selectors)
  - Supported in all browsers
- [Adjacent sibling selectors `E + F`](https://www.w3.org/TR/CSS2/selector.html#adjacent-selectors)
  - Supported in all browsers
- [Attribute selectors `E[foo]`, `E[foo="bar"]`, `E[foo~="bar"]`, `E[foo|="bar"]`](https://www.w3.org/TR/CSS2/selector.html#attribute-selectors)
  - Supported in all browsers
- [Class selectors `E.foo`](https://www.w3.org/TR/CSS2/selector.html#class-html)
  - Supported in all browsers
- [ID selectors `E#foo`](https://www.w3.org/TR/CSS2/selector.html#id-selectors)
  - Supported in all browsers
- [`:first-child` pseudo-class](https://www.w3.org/TR/CSS2/selector.html#first-child)
  - Supported in all browsers
- [Link pseudo-class `E:link`](https://www.w3.org/TR/CSS2/selector.html#link-pseudo-classes)
  - Supported in all browsers
- [Language pseudo-class `E:lang(c)`](https://www.w3.org/TR/CSS2/selector.html#lang)
  - Supported in all browsers
- [`:first-line` pseudo-element](https://www.w3.org/TR/CSS2/selector.html#first-line-pseudo)
  - Supported in all browsers
  - Note: there is a bug when used alone or with the universal selector(`*`). [[Issue]](https://github.com/vivliostyle/vivliostyle.js/issues/133)
- [`:first-letter` pseudo-element](https://www.w3.org/TR/CSS2/selector.html#first-letter)
  - Supported in all browsers
  - Note: there is a bug when used alone, with the universal selector(`*`), or with non-ascii characters. [[Issue]](https://github.com/vivliostyle/vivliostyle.js/issues/34)
- [`:before` and `:after` pseudo-elements](https://www.w3.org/TR/CSS2/selector.html#before-and-after)
  - Supported in all browsers

#### Not supported selectors

- [Link pseudo-class `E:visited`](https://www.w3.org/TR/CSS2/selector.html#link-pseudo-classes)
- [Dynamic pseudo-classes `E:active`, `E:hover`, `E:focus`](https://www.w3.org/TR/CSS2/selector.html#dynamic-pseudo-classes)

### [Selectors 3](https://www.w3.org/TR/css3-selectors/)

- [Type selectors with namespaces `ns|E`, `*|E`](https://www.w3.org/TR/css3-selectors/#typenmsp)
  - Supported in all browsers
- [Universal selector with namespaces `ns|*`, `*|*`](https://www.w3.org/TR/css3-selectors/#univnmsp)
  - Supported in all browsers
- [Substring matching attribute selectors `[att^=val]`, `[att$=val]`, `[att*=val]`](https://www.w3.org/TR/css3-selectors/#attribute-substrings)
  - Supported in all browsers
- [Attribute selectors with namespaces `[ns|att]`, `[|att]`, `[ns|att=val]`, `[|att=val]`, `[ns|att~=val]`, `[|att~=val]`, `[ns|att|=val]`, `[|att|=val]`, `[ns|att^=val]`, `[|att^=val]`, `[ns|att$=val]`, `[|att$=val]`, `[ns|att*=val]`, `[|att*=val]`](https://www.w3.org/TR/css3-selectors/#attrnmsp)
  - Supported in all browsers
- [The UI element states pseudo-classes `:enabled`, `:disabled`, `:checked`, `:indeterminate`](https://www.w3.org/TR/css3-selectors/#UIstates)
  - Supported in all browsers
  - Note that the current implementation can use only initial states of those UI elements. Even if the actual state of the element is toggled by user interaction, the style does not change.
- [`:root` pseudo-class](https://www.w3.org/TR/css3-selectors/#root-pseudo)
  - Supported in all browsers
- [`:nth-child()` pseudo-class](https://www.w3.org/TR/css3-selectors/#nth-child-pseudo)
  - Supported in all browsers
- [`:nth-last-child()` pseudo-class](https://www.w3.org/TR/css3-selectors/#nth-last-child-pseudo)
  - Supported in all browsers
- [`:nth-of-type()` pseudo-class](https://www.w3.org/TR/css3-selectors/#nth-of-type-pseudo)
  - Supported in all browsers
- [`:nth-last-of-type()` pseudo-class](https://www.w3.org/TR/css3-selectors/#nth-last-of-type-pseudo)
  - Supported in all browsers
- [`:first-child` pseudo-class](https://www.w3.org/TR/css3-selectors/#first-child-pseudo)
  - Supported in all browsers
- [`:last-child` pseudo-class](https://www.w3.org/TR/css3-selectors/#last-child-pseudo)
  - Supported in all browsers
- [`:first-of-type` pseudo-class](https://www.w3.org/TR/css3-selectors/#first-of-type-pseudo)
  - Supported in all browsers
- [`:last-of-type` pseudo-class](https://www.w3.org/TR/css3-selectors/#last-of-type-pseudo)
  - Supported in all browsers
- [`:only-child` pseudo-class](https://www.w3.org/TR/css3-selectors/#only-child-pseudo)
  - Supported in all browsers
- [`:only-of-type` pseudo-class](https://www.w3.org/TR/css3-selectors/#only-of-type-pseudo)
  - Supported in all browsers
- [`:empty` pseudo-class](https://www.w3.org/TR/css3-selectors/#empty-pseudo)
  - Supported in all browsers
- [`:not()` pseudo-class](https://www.w3.org/TR/css3-selectors/#negation)
  - Supported in all browsers
- [`::first-line` pseudo-element](https://www.w3.org/TR/css3-selectors/#first-line)
  - Supported in all browsers
  - Note: there is a bug when used alone or with the universal selector(`*`). [[Issue]](https://github.com/vivliostyle/vivliostyle.js/issues/133)
- [`::first-letter` pseudo-element](https://www.w3.org/TR/css3-selectors/#first-letter)
  - Supported in all browsers
  - Note: there is a bug when used alone, with the universal selector(`*`), or with non-ascii characters. [[Issue]](https://github.com/vivliostyle/vivliostyle.js/issues/34)
- [`::before` and `::after` pseudo-elements](https://www.w3.org/TR/css3-selectors/#gen-content)
  - Supported in all browsers
- [General sibling combinator `E ~ F`](https://www.w3.org/TR/css3-selectors/#general-sibling-combinators)
  - Supported in all browsers

### [CSS Overflow 4](https://drafts.csswg.org/css-overflow-4/)

- [`:nth-fragment()` pseudo-element](https://drafts.csswg.org/css-overflow-4/#fragment-pseudo-element)
  - Supported in all browsers

#### Not supported selectors

- [Type selectors without namespaces `|E`](https://www.w3.org/TR/css3-selectors/#typenmsp)
- [Universal selector without namespaces `|*`](https://www.w3.org/TR/css3-selectors/#univnmsp)
- [Attribute selectors with universal namespace `[*|att]`, `[*|att=val]`, `[*|att~=val]`, `[*|att|=val]`](https://www.w3.org/TR/css3-selectors/#attrnmsp)
- [Target pseudo-class `:target`](https://www.w3.org/TR/css3-selectors/#target-pseudo)

## At-rules

### [CSS 2](https://www.w3.org/TR/CSS2/)

- [@charset](https://www.w3.org/TR/CSS2/syndata.html#charset)
  - Supported in all browsers
- [@import](https://www.w3.org/TR/CSS2/cascade.html#at-import)
  - [Also in CSS Cascading and Inheritance 3](https://www.w3.org/TR/css-cascade-3/#at-import)
  - Supported in all browsers

### [CSS Namespaces 3](https://www.w3.org/TR/css3-namespace/)

- [@namespace](https://www.w3.org/TR/css3-namespace/#declaration)
  - Supported in all browsers

### [CSS Conditional Rules 3](https://www.w3.org/TR/css3-conditional/)

- [@media](https://www.w3.org/TR/css3-conditional/#atmedia-rule)
  - Supported in all browsers

### [CSS Paged Media 3](https://drafts.csswg.org/css-page-3/)

- [@page](https://drafts.csswg.org/css-page/#at-page-rule)
  - Supported in all browsers
- [Page-margin boxes (@top-left-corner, @top-left, @top-center, @top-right, @top-right-corner, @left-top, @left-middle, @left-bottom, @right-top, @right-middle, @right-bottom, @bottom-left-corner, @bottom-left, @bottom-center, @bottom-right, @bottom-right-coner)](https://drafts.csswg.org/css-page/#margin-at-rules)
  - Supported in all browsers
- Page selectors [:left, :right](http://dev.w3.org/csswg/css-page/#spread-pseudos), [:first](http://dev.w3.org/csswg/css-page/#first-pseudo), [:recto, :verso](http://dev.w3.org/csswg/css-logical-props/#logical-page)
  - Supported in all browsers
- [Page-based counters (page, pages)](https://drafts.csswg.org/css-page/#page-based-counters)
  - Supported in all browsers

### [CSS Fonts 3](https://www.w3.org/TR/css-fonts-3/)

- [@font-face](https://www.w3.org/TR/css-fonts-3/#font-face-rule)
  - Support depends on browser capabilities
  - Note: `font-stretch`, `unicode-range` and `font-feature-settings` descriptors are currently ignored.

## Media queries

- Vivliostyle uses styles specified for [`print` media](https://www.w3.org/TR/CSS2/media.html#media-types) (as well as `all`).
  - Supported in all browsers
  - Vivliostyle specific media type `vivliostyle` is enabled in addition to `print` media.
- Supported media features
  - [`(min-|max-)width`](https://www.w3.org/TR/css3-mediaqueries/#width)
      - Supported in all browsers
  - [`(min-|max-)height`](https://www.w3.org/TR/css3-mediaqueries/#height)
      - Supported in all browsers
  - [`(min-|max-)device-width`](https://www.w3.org/TR/css3-mediaqueries/#device-width)
      - Supported in all browsers
  - [`(min-|max-)device-height`](https://www.w3.org/TR/css3-mediaqueries/#device-height)
      - Supported in all browsers
  - [`(min-|max-)color`](https://www.w3.org/TR/css3-mediaqueries/#color)
      - Supported in all browsers

## Properties

### [CSS 2](https://www.w3.org/TR/CSS2/)

- [background](https://www.w3.org/TR/CSS2/colors.html#propdef-background)
  - Supports [CSS Backgrounds 3 syntax](https://www.w3.org/TR/css3-background/#background)
  - Support depends on browser capabilities
- [background-attachment](https://www.w3.org/TR/CSS2/colors.html#propdef-background-attachment)
  - Supports [CSS Backgrounds 3 syntax](https://www.w3.org/TR/css3-background/#background-attachment)
  - Support depends on browser capabilities
  - Note: behavior when used within `@page` rules is not compliant to the spec. [[Issue]](https://github.com/vivliostyle/vivliostyle.js/issues/22)
- [background-color](https://www.w3.org/TR/CSS2/colors.html#propdef-background-color)
  - Supports [CSS Backgrounds 3 syntax](https://www.w3.org/TR/css3-background/#background-color)
  - Support depends on browser capabilities
- [background-image](https://www.w3.org/TR/CSS2/colors.html#propdef-background-image)
  - Supports [CSS Backgrounds 3 syntax](https://www.w3.org/TR/css3-background/#background-image)
  - Support depends on browser capabilities
  - Note: behavior when used within `@page` rules is not compliant to the spec. [[Issue]](https://github.com/vivliostyle/vivliostyle.js/issues/22)
- [background-position](https://www.w3.org/TR/CSS2/colors.html#propdef-background-position)
  - Supports [CSS Backgrounds 3 syntax](https://www.w3.org/TR/css3-background/#background-position)
  - Support depends on browser capabilities
  - Note: behavior when used within `@page` rules is not compliant to the spec. [[Issue]](https://github.com/vivliostyle/vivliostyle.js/issues/22)
- [background-repeat](https://www.w3.org/TR/CSS2/colors.html#propdef-background-repeat)
  - Supports [CSS Backgrounds 3 syntax](https://www.w3.org/TR/css3-background/#background-repeat)
  - Support depends on browser capabilities
  - Note: behavior when used within `@page` rules is not compliant to the spec. [[Issue]](https://github.com/vivliostyle/vivliostyle.js/issues/22)
- [border](https://www.w3.org/TR/CSS2/box.html#propdef-border)
  - Support depends on browser capabilities
- [border-bottom](https://www.w3.org/TR/CSS2/box.html#propdef-border-bottom)
  - Support depends on browser capabilities
- [border-bottom-color](https://www.w3.org/TR/CSS2/box.html#propdef-border-bottom-color)
  - Support depends on browser capabilities
- [border-bottom-style](https://www.w3.org/TR/CSS2/box.html#propdef-border-bottom-style)
  - Support depends on browser capabilities
- [border-bottom-width](https://www.w3.org/TR/CSS2/box.html#propdef-border-bottom-width)
  - Support depends on browser capabilities
- [border-collapse](https://www.w3.org/TR/CSS2/tables.html#propdef-border-collapse)
  - Support depends on browser capabilities
- [border-color](https://www.w3.org/TR/CSS2/box.html#propdef-border-color)
  - Support depends on browser capabilities
- [border-left](https://www.w3.org/TR/CSS2/box.html#propdef-border-left)
  - Support depends on browser capabilities
- [border-left-color](https://www.w3.org/TR/CSS2/box.html#propdef-border-left-color)
  - Support depends on browser capabilities
- [border-left-style](https://www.w3.org/TR/CSS2/box.html#propdef-border-left-style)
  - Support depends on browser capabilities
- [border-left-width](https://www.w3.org/TR/CSS2/box.html#propdef-border-left-width)
  - Support depends on browser capabilities
- [border-right](https://www.w3.org/TR/CSS2/box.html#propdef-border-right)
  - Support depends on browser capabilities
- [border-right-color](https://www.w3.org/TR/CSS2/box.html#propdef-border-right-color)
  - Support depends on browser capabilities
- [border-right-style](https://www.w3.org/TR/CSS2/box.html#propdef-border-right-style)
  - Support depends on browser capabilities
- [border-right-width](https://www.w3.org/TR/CSS2/box.html#propdef-border-right-width)
  - Support depends on browser capabilities
- [border-spacing](https://www.w3.org/TR/CSS2/tables.html#propdef-border-spacing)
  - Support depends on browser capabilities
- [border-style](https://www.w3.org/TR/CSS2/box.html#propdef-border-style)
  - Support depends on browser capabilities
- [border-top](https://www.w3.org/TR/CSS2/box.html#propdef-border-top)
  - Support depends on browser capabilities
- [border-top-color](https://www.w3.org/TR/CSS2/box.html#propdef-border-top-color)
  - Support depends on browser capabilities
- [border-top-style](https://www.w3.org/TR/CSS2/box.html#propdef-border-top-style)
  - Support depends on browser capabilities
- [border-top-width](https://www.w3.org/TR/CSS2/box.html#propdef-border-top-width)
  - Support depends on browser capabilities
- [border-width](https://www.w3.org/TR/CSS2/box.html#propdef-border-width)
  - Support depends on browser capabilities
- [bottom](https://www.w3.org/TR/CSS2/visuren.html#propdef-bottom)
  - Support depends on browser capabilities
- [caption-side](https://www.w3.org/TR/CSS2/tables.html#propdef-caption-side)
  - Support depends on browser capabilities
- [clear](https://www.w3.org/TR/CSS2/visuren.html#propdef-clear)
  - Supported in all browsers
- [clip](https://www.w3.org/TR/CSS2/visufx.html#propdef-clip)
  - Support depends on browser capabilities
- [color](https://www.w3.org/TR/CSS2/colors.html#propdef-color)
  - Support depends on browser capabilities
- [content](https://www.w3.org/TR/CSS2/generate.html#propdef-content)
  - Supported in all browsers
- [counter-increment](https://www.w3.org/TR/CSS2/generate.html#propdef-counter-increment)
  - Supported in all browsers
- [counter-reset](https://www.w3.org/TR/CSS2/generate.html#propdef-counter-reset)
  - Supported in all browsers
- [counter-set](https://drafts.csswg.org/css-lists-3/#propdef-counter-set)
  - Supported in all browsers
- [cursor](https://www.w3.org/TR/CSS2/ui.html#propdef-cursor)
  - Support depends on browser capabilities
- [direction](https://www.w3.org/TR/CSS2/visuren.html#propdef-direction)
  - Support depends on browser capabilities
- [display](https://www.w3.org/TR/CSS2/visuren.html#propdef-display)
  - Support depends on browser capabilities
  - Supports [`flex`, `inline-flex`](https://www.w3.org/TR/css-flexbox-1/#flex-containers), [`ruby`, `ruby-base`, `ruby-text`, `ruby-base-container` and `ruby-text-container`](https://www.w3.org/TR/css-ruby-1/#propdef-display) values.
- [empty-cells](https://www.w3.org/TR/CSS2/tables.html#propdef-empty-cells)
  - Support depends on browser capabilities
- [float](https://www.w3.org/TR/CSS2/visuren.html#propdef-float)
  - Supported in all browsers
  - Supports [`block-start`, `block-end`, `inline-start`, `inline-end`, `left`, `right`, `top`, `bottom` and `none`](https://drafts.csswg.org/css-page-floats/#propdef-float) values.
- [font](https://www.w3.org/TR/CSS2/fonts.html#propdef-font)
  - Support depends on browser capabilities
- [font-family](https://www.w3.org/TR/CSS2/fonts.html#propdef-font-family)
  - Support depends on browser capabilities
- [font-size](https://www.w3.org/TR/CSS2/fonts.html#propdef-font-size)
  - Support depends on browser capabilities
- [font-style](https://www.w3.org/TR/CSS2/fonts.html#propdef-font-style)
  - Support depends on browser capabilities
- [font-variant](https://www.w3.org/TR/CSS2/fonts.html#propdef-font-variant)
  - Support depends on browser capabilities
- [font-weight](https://www.w3.org/TR/CSS2/fonts.html#propdef-font-weight)
  - Support depends on browser capabilities
- [height](https://www.w3.org/TR/CSS2/visudet.html#propdef-height)
  - Support depends on browser capabilities
- [left](https://www.w3.org/TR/CSS2/visuren.html#propdef-left)
  - Support depends on browser capabilities
- [letter-spacing](https://www.w3.org/TR/CSS2/text.html#propdef-letter-spacing)
  - Support depends on browser capabilities
- [line-height](https://www.w3.org/TR/CSS2/visudet.html#propdef-line-height)
  - Support depends on browser capabilities
- [list-style](https://www.w3.org/TR/CSS2/generate.html#propdef-list-style)
  - Support depends on browser capabilities
- [list-style-image](https://www.w3.org/TR/CSS2/generate.html#propdef-list-style-image)
  - Support depends on browser capabilities
- [list-style-position](https://www.w3.org/TR/CSS2/generate.html#propdef-list-style-position)
  - Support depends on browser capabilities
- [list-style-type](https://www.w3.org/TR/CSS2/generate.html#propdef-list-style-type)
  - Support depends on browser capabilities
- [margin](https://www.w3.org/TR/CSS2/box.html#propdef-margin)
  - Support depends on browser capabilities
- [margin-bottom](https://www.w3.org/TR/CSS2/box.html#propdef-margin-bottom)
  - Support depends on browser capabilities
- [margin-left](https://www.w3.org/TR/CSS2/box.html#propdef-margin-left)
  - Support depends on browser capabilities
- [margin-right](https://www.w3.org/TR/CSS2/box.html#propdef-margin-right)
  - Support depends on browser capabilities
- [margin-top](https://www.w3.org/TR/CSS2/box.html#propdef-margin-top)
  - Support depends on browser capabilities
- [max-height](https://www.w3.org/TR/CSS2/visudet.html#propdef-max-height)
  - Support depends on browser capabilities
- [max-width](https://www.w3.org/TR/CSS2/visudet.html#propdef-max-width)
  - Support depends on browser capabilities
- [min-height](https://www.w3.org/TR/CSS2/visudet.html#propdef-min-height)
  - Support depends on browser capabilities
- [min-width](https://www.w3.org/TR/CSS2/visudet.html#propdef-min-width)
  - Support depends on browser capabilities
- [orphans](https://www.w3.org/TR/CSS2/page.html#propdef-orphans)
  - Supported in all browsers
- [outline](https://www.w3.org/TR/CSS2/ui.html#propdef-outline)
  - Support depends on browser capabilities
- [outline-color](https://www.w3.org/TR/CSS2/ui.html#propdef-outline-color)
  - Support depends on browser capabilities
- [outline-offset](https://www.w3.org/TR/css3-ui/#propdef-outline-offset)
  - Support depends on browser capabilities
- [outline-style](https://www.w3.org/TR/CSS2/ui.html#propdef-outline-style)
  - Support depends on browser capabilities
- [outline-width](https://www.w3.org/TR/CSS2/ui.html#propdef-outline-width)
  - Support depends on browser capabilities
- [overflow](https://www.w3.org/TR/CSS2/visufx.html#propdef-overflow)
  - Support depends on browser capabilities
- [padding](https://www.w3.org/TR/CSS2/box.html#propdef-padding)
  - Support depends on browser capabilities
- [padding-bottom](https://www.w3.org/TR/CSS2/box.html#propdef-padding-bottom)
  - Support depends on browser capabilities
- [padding-left](https://www.w3.org/TR/CSS2/box.html#propdef-padding-left)
  - Support depends on browser capabilities
- [padding-right](https://www.w3.org/TR/CSS2/box.html#propdef-padding-right)
  - Support depends on browser capabilities
- [padding-top](https://www.w3.org/TR/CSS2/box.html#propdef-padding-top)
  - Support depends on browser capabilities
- [page-break-after](https://www.w3.org/TR/CSS2/page.html#propdef-page-break-after)
  - Supported in all browsers
- [page-break-before](https://www.w3.org/TR/CSS2/page.html#propdef-page-break-before)
  - Supported in all browsers
- [page-break-inside](https://www.w3.org/TR/CSS2/page.html#propdef-page-break-inside)
  - Supported in all browsers
- [position](https://www.w3.org/TR/CSS2/visuren.html#propdef-position)
  - Support depends on browser capabilities
- [quotes](https://www.w3.org/TR/CSS2/generate.html#propdef-quotes)
  - Supported in all browsers
  - Note: not supported within `@page` rules. [[Issue]](https://github.com/vivliostyle/vivliostyle.js/issues/43)
- [right](https://www.w3.org/TR/CSS2/visuren.html#propdef-right)
  - Support depends on browser capabilities
- [table-layout](https://www.w3.org/TR/CSS2/tables.html#propdef-table-layout)
  - Support depends on browser capabilities
- [text-align](https://www.w3.org/TR/CSS2/text.html#propdef-text-align)
  - Support depends on browser capabilities
- [text-decoration](https://www.w3.org/TR/CSS2/text.html#propdef-text-decoration)
  - Support depends on browser capabilities
- [text-indent](https://www.w3.org/TR/CSS2/text.html#propdef-text-indent)
  - Support depends on browser capabilities
- [text-transform](https://www.w3.org/TR/CSS2/text.html#propdef-text-transform)
  - Support depends on browser capabilities
- [top](https://www.w3.org/TR/CSS2/visuren.html#propdef-top)
  - Support depends on browser capabilities
- [unicode-bidi](https://www.w3.org/TR/CSS2/visuren.html#propdef-unicode-bidi)
  - Support depends on browser capabilities
  - Supports [new values (`isolate`, `isolate-override`, `plaintext`) in CSS Writing Modes 3](https://www.w3.org/TR/css-writing-modes-3/#propdef-unicode-bidi)
- [vertical-align](https://www.w3.org/TR/CSS2/visudet.html#propdef-vertical-align)
  - Support depends on browser capabilities
- [visibility](https://www.w3.org/TR/CSS2/visufx.html#propdef-visibility)
  - Support depends on browser capabilities
- [white-space](https://www.w3.org/TR/CSS2/text.html#propdef-white-space)
  - Support depends on browser capabilities
- [widows](https://www.w3.org/TR/CSS2/page.html#propdef-widows)
  - Supported in all browsers
- [width](https://www.w3.org/TR/CSS2/visudet.html#propdef-width)
  - Support depends on browser capabilities
- [word-spacing](https://www.w3.org/TR/CSS2/text.html#propdef-word-spacing)
  - Support depends on browser capabilities
- [z-index](https://www.w3.org/TR/CSS2/visuren.html#propdef-z-index)
  - Support depends on browser capabilities

### [CSS Paged Media 3](https://drafts.csswg.org/css-page-3/)

- [bleed](https://drafts.csswg.org/css-page/#bleed)
  - Supported in all browsers
  - Only effective when specified within an `@page` rule without page selectors
- [marks](https://drafts.csswg.org/css-page/#marks)
  - Supported in all browsers
  - Only effective when specified within an `@page` rule without page selectors
- [size](https://drafts.csswg.org/css-page-3/#descdef-page-size)
  - Supported in all browsers
  - Supports `JIS-B5` and `JIS-B4` values in the current editor's draft.

### [CSS Color 3](https://www.w3.org/TR/css3-color/)

- [color](https://www.w3.org/TR/css3-color/#color0)
  - Support depends on browser capabilities
- [opacity](https://www.w3.org/TR/css3-color/#opacity)
  - Support depends on browser capabilities

### [CSS Backgrounds and Borders 3](https://www.w3.org/TR/css3-background/)

- [background](https://www.w3.org/TR/css3-background/#background)
  - Support depends on browser capabilities
- [background-attachment](https://www.w3.org/TR/css3-background/#background-attachment)
  - Support depends on browser capabilities
  - Note: behavior when used within `@page` rules is not compliant to the spec. [[Issue]](https://github.com/vivliostyle/vivliostyle.js/issues/22)
- [background-clip](https://www.w3.org/TR/css3-background/#background-clip)
  - Allowed prefixes: webkit
  - Support depends on browser capabilities
  - Note: behavior when used within `@page` rules is not compliant to the spec. [[Issue]](https://github.com/vivliostyle/vivliostyle.js/issues/22)
- [background-color](https://www.w3.org/TR/css3-background/#background-color)
  - Support depends on browser capabilities
- [background-image](https://www.w3.org/TR/css3-background/#background-image)
  - Support depends on browser capabilities
  - Note: behavior when used within `@page` rules is not compliant to the spec. [[Issue]](https://github.com/vivliostyle/vivliostyle.js/issues/22)
- [background-origin](https://www.w3.org/TR/css3-background/#background-origin)
  - Allowed prefixes: webkit
  - Support depends on browser capabilities
  - Note: behavior when used within `@page` rules is not compliant to the spec. [[Issue]](https://github.com/vivliostyle/vivliostyle.js/issues/22)
- [background-position](https://www.w3.org/TR/css3-background/#background-position)
  - Support depends on browser capabilities
  - Note: behavior when used within `@page` rules is not compliant to the spec. [[Issue]](https://github.com/vivliostyle/vivliostyle.js/issues/22)
- [background-repeat](https://www.w3.org/TR/css3-background/#background-repeat)
  - Support depends on browser capabilities
  - Note: behavior when used within `@page` rules is not compliant to the spec. [[Issue]](https://github.com/vivliostyle/vivliostyle.js/issues/22)
- [background-size](https://www.w3.org/TR/css3-background/#background-size)
  - Allowed prefixes: webkit
  - Support depends on browser capabilities
  - Note: behavior when used within `@page` rules is not compliant to the spec. [[Issue]](https://github.com/vivliostyle/vivliostyle.js/issues/22)
- [border](https://www.w3.org/TR/css3-background/#border)
  - Support depends on browser capabilities
- [border-bottom](https://www.w3.org/TR/css3-background/#border-bottom)
  - Support depends on browser capabilities
- [border-bottom-color](https://www.w3.org/TR/css3-background/#border-bottom-color)
  - Support depends on browser capabilities
- [border-bottom-left-radius](https://www.w3.org/TR/css3-background/#border-bottom-left-radius)
  - Support depends on browser capabilities
- [border-bottom-right-radius](https://www.w3.org/TR/css3-background/#border-bottom-right-radius)
  - Support depends on browser capabilities
- [border-bottom-style](https://www.w3.org/TR/css3-background/#border-bottom-style)
  - Support depends on browser capabilities
- [border-bottom-width](https://www.w3.org/TR/css3-background/#border-bottom-width)
  - Support depends on browser capabilities
- [border-color](https://www.w3.org/TR/css3-background/#border-color)
  - Support depends on browser capabilities
- [border-image](https://www.w3.org/TR/css3-background/#border-image)
  - Support depends on browser capabilities
- [border-image-outset](https://www.w3.org/TR/css3-background/#border-image-outset)
  - Support depends on browser capabilities
- [border-image-repeat](https://www.w3.org/TR/css3-background/#border-image-repeat)
  - Support depends on browser capabilities
- [border-image-slice](https://www.w3.org/TR/css3-background/#border-image-slice)
  - Support depends on browser capabilities
- [border-image-source](https://www.w3.org/TR/css3-background/#border-image-source)
  - Support depends on browser capabilities
- [border-image-width](https://www.w3.org/TR/css3-background/#border-image-width)
  - Support depends on browser capabilities
- [border-left](https://www.w3.org/TR/css3-background/#border-left)
  - Support depends on browser capabilities
- [border-left-color](https://www.w3.org/TR/css3-background/#border-left-color)
  - Support depends on browser capabilities
- [border-left-style](https://www.w3.org/TR/css3-background/#border-left-style)
  - Support depends on browser capabilities
- [border-left-width](https://www.w3.org/TR/css3-background/#border-left-width)
  - Support depends on browser capabilities
- [border-radius](https://www.w3.org/TR/css3-background/#border-radius)
  - Support depends on browser capabilities
- [border-right](https://www.w3.org/TR/css3-background/#border-right)
  - Support depends on browser capabilities
- [border-right-color](https://www.w3.org/TR/css3-background/#border-right-color)
  - Support depends on browser capabilities
- [border-right-style](https://www.w3.org/TR/css3-background/#border-right-style)
  - Support depends on browser capabilities
- [border-right-width](https://www.w3.org/TR/css3-background/#border-right-width)
  - Support depends on browser capabilities
- [border-style](https://www.w3.org/TR/css3-background/#border-style)
  - Support depends on browser capabilities
- [border-top](https://www.w3.org/TR/css3-background/#border-top)
  - Support depends on browser capabilities
- [border-top-color](https://www.w3.org/TR/css3-background/#border-top-color)
  - Support depends on browser capabilities
- [border-top-left-radius](https://www.w3.org/TR/css3-background/#border-top-left-radius)
  - Support depends on browser capabilities
- [border-top-right-radius](https://www.w3.org/TR/css3-background/#border-top-right-radius)
  - Support depends on browser capabilities
- [border-top-style](https://www.w3.org/TR/css3-background/#border-top-style)
  - Support depends on browser capabilities
- [border-top-width](https://www.w3.org/TR/css3-background/#border-top-width)
  - Support depends on browser capabilities
- [border-width](https://www.w3.org/TR/css3-background/#border-width)
  - Support depends on browser capabilities
- [box-shadow](https://www.w3.org/TR/css3-background/#box-shadow)
  - Allowed prefixes: webkit
  - Support depends on browser capabilities

### [CSS Image Values and Replaced Content 3](https://www.w3.org/TR/css3-images/)

- [image-resolution](https://www.w3.org/TR/css3-images/#the-image-resolution)
  - Supported in all browsers
  - Only `<resolution>` value is supported.
  - Only supported for content of `img`, `input[type=image]` and `video` (applied to poster images) elements and before/after pseudoelements. Other images such as background images, list images or border images are not supported.
  - The property is applied to vector images such as SVG, as well as raster images. This behavior is different from what the spec specifies.
- [object-fit](https://www.w3.org/TR/css3-images/#object-fit)
  - Support depends on browser capabilities
- [object-position](https://www.w3.org/TR/css3-images/#object-position)
  - Support depends on browser capabilities

### [CSS Fonts 3](https://www.w3.org/TR/css-fonts-3/)

- [font-family](https://www.w3.org/TR/css-fonts-3/#propdef-font-family)
  - Support depends on browser capabilities
- [font-feature-settings](https://www.w3.org/TR/css-fonts-3/#propdef-font-feature-settings)
  - Support depends on browser capabilities
- [font-kerning](https://www.w3.org/TR/css-fonts-3/#propdef-font-kerning)
  - Allowed prefixes: webkit
  - Support depends on browser capabilities
- [font-size](https://www.w3.org/TR/css-fonts-3/#propdef-font-size)
  - Support depends on browser capabilities
- [font-size-adjust](https://www.w3.org/TR/css-fonts-3/#propdef-font-size-adjust)
  - Support depends on browser capabilities
- [font-style](https://www.w3.org/TR/css-fonts-3/#propdef-font-style)
  - Support depends on browser capabilities
- [font-variant-east-asian](https://www.w3.org/TR/css-fonts-3/#propdef-font-variant-east-asian)
  - Support depends on browser capabilities
- [font-weight](https://www.w3.org/TR/css-fonts-3/#propdef-font-weight)
  - Support depends on browser capabilities
- [font-stretch](https://www.w3.org/TR/css-fonts-3/#propdef-font-stretch)
  - Support depends on browser capabilities

### [CSS Text 3](https://www.w3.org/TR/css-text-3/)

- [hyphens](https://www.w3.org/TR/css-text-3/#hyphens)
  - Allowed prefixes: epub, moz, ms, webkit
  - Support depends on browser capabilities
- [letter-spacing](https://www.w3.org/TR/css-text-3/#letter-spacing)
  - Support depends on browser capabilities
- [line-break](https://www.w3.org/TR/css-text-3/#line-break0)
  - Support depends on browser capabilities
  - Allowed prefixes: ms, webkit
  - Values: `auto | loose | normal | strict;`
- [overflow-wrap](https://www.w3.org/TR/css-text-3/#overflow-wrap)
  - Support depends on browser capabilities
  - Note: While the spec states that `word-wrap` must be treated as if it were a shorthand of `overflow-wrap`, Vivliostyle treat them for now as different properties and might result in an incorrect cascading behavior when inconsistent values are specified for both of the properties.
- [tab-size](https://www.w3.org/TR/css-text-3/#tab-size)
  - Allowed prefixes: moz
  - Support depends on browser capabilities
- [text-align-last](https://www.w3.org/TR/css-text-3/#text-align-last)
  - Allowed prefixes: moz, ms
  - Support depends on browser capabilities
  - Note: While `text-align` property is a shorthand in CSS Text 3, Vivliostyle treats `text-align` for now as an independent property (defined in CSS 2.1) rather than a shorthand.
- [text-justify](https://drafts.csswg.org/css-text-3/#propdef-text-justify)
  - Allowed prefixes: ms
  - Support depends on browser capabilities
  - Note: `inter-ideograph` value as well as values defined in the current editor's draft is supported since we use it in UA stylesheet to emulate text-justify: auto behavior defined in the spec on IE.
- [white-space](https://www.w3.org/TR/css-text-3/#white-space)
  - Support depends on browser capabilities
- [word-break](https://www.w3.org/TR/css-text-3/#word-break)
  - Allowed prefixes: ms
  - Support depends on browser capabilities
- [word-wrap](https://www.w3.org/TR/css-text-3/#word-wrap)
  - Allowed prefixes: ms
  - Support depends on browser capabilities
  - Note: While the spec states that `word-wrap` must be treated as if it were a shorthand of `overflow-wrap`, Vivliostyle treat them for now as different properties and might result in an incorrect cascading behavior when inconsistent values are specified for both of the properties.

### [CSS Text 4](https://drafts.csswg.org/css-text-4/)

- [hyphenate-character](https://drafts.csswg.org/css-text-4/#propdef-hyphenate-character)
  - Allowed prefixes: webkit
  - Support depends on browser capabilities

### [CSS Text Decoration 3](https://www.w3.org/TR/css-text-decor-3/)

- Note: While `text-decoration` property is a shorthand in CSS Text Decoration 3, Vivliostyle treats `text-decoration` for now as an independent property defined in CSS Level 2.1.
- [text-decoration-color](https://www.w3.org/TR/css-text-decor-3/#text-decoration-color)
  - Allowed prefixes: webkit
  - Support depends on browser capabilities
- [text-decoration-line](https://www.w3.org/TR/css-text-decor-3/#text-decoration-line)
  - Allowed prefixes: webkit
  - Support depends on browser capabilities
- [text-decoration-skip](https://www.w3.org/TR/css-text-decor-3/#text-decoration-skip)
  - Allowed prefixes: webkit
  - Support depends on browser capabilities
- [text-decoration-style](https://www.w3.org/TR/css-text-decor-3/#text-decoration-style)
  - Allowed prefixes: webkit
  - Support depends on browser capabilities
- [text-emphasis](https://www.w3.org/TR/css-text-decor-3/#text-emphasis)
  - Allowed prefixes: epub, webkit
  - Support depends on browser capabilities
- [text-emphasis-color](https://www.w3.org/TR/css-text-decor-3/#text-emphasis-color)
  - Allowed prefixes: epub, webkit
  - Support depends on browser capabilities
- [text-emphasis-position](https://www.w3.org/TR/css-text-decor-3/#text-emphasis-position)
  - Allowed prefixes: webkit
  - Support depends on browser capabilities
- [text-emphasis-style](https://www.w3.org/TR/css-text-decor-3/#text-emphasis-style)
  - Allowed prefixes: epub, webkit
  - Support depends on browser capabilities
- [text-shadow](https://www.w3.org/TR/css-text-decor-3/#text-shadow)
  - Support depends on browser capabilities
- [text-underline-position](https://www.w3.org/TR/css-text-decor-3/#text-underline-position)
  - Support depends on browser capabilities
  - Allowed prefixes: ms, webkit

### [CSS Multi-column Layout 1](https://www.w3.org/TR/css3-multicol/)

- [break-after](https://www.w3.org/TR/css3-multicol/#break-after)
  - Supported in all browsers
  - Note: behavior when multiple forced break values coincide at a single break point is not compliant to the spec. [[Issue]](https://github.com/vivliostyle/vivliostyle.js/issues/129)
- [break-before](https://www.w3.org/TR/css3-multicol/#break-before)
  - Supported in all browsers
  - Note: behavior when multiple forced break values coincide at a single break point is not compliant to the spec. [[Issue]](https://github.com/vivliostyle/vivliostyle.js/issues/129)
- [break-inside](https://www.w3.org/TR/css3-multicol/#break-inside)
  - Supported in all browsers
  - Note: All of `avoid-page`, `avoid-column` and `avoid-region` values are treated as if they were `avoid`. [[Issue]](https://github.com/vivliostyle/vivliostyle.js/issues/128)
- [column-count](https://www.w3.org/TR/css3-multicol/#column-count)
  - Allowed prefixes: moz, webkit
  - Supported in all browsers
- [column-gap](https://www.w3.org/TR/css3-multicol/#column-gap0)
  - Allowed prefixes: moz, webkit
  - Supported in all browsers
- [column-rule](https://www.w3.org/TR/css3-multicol/#column-rule0)
  - Allowed prefixes: moz, webkit
  - Supported in all browsers
- [column-rule-color](https://www.w3.org/TR/css3-multicol/#column-rule-color)
  - Allowed prefixes: moz, webkit
  - Supported in all browsers
- [column-rule-style](https://www.w3.org/TR/css3-multicol/#column-rule-style)
  - Allowed prefixes: moz, webkit
  - Supported in all browsers
- [column-rule-width](https://www.w3.org/TR/css3-multicol/#column-rule-width)
  - Allowed prefixes: moz, webkit
  - Supported in all browsers
- [column-width](https://www.w3.org/TR/css3-multicol/#column-width)
  - Allowed prefixes: moz, webkit
  - Supported in all browsers
- [columns](https://www.w3.org/TR/css3-multicol/#columns0)
  - Allowed prefixes: moz, webkit
  - Supported in all browsers
- [column-span](https://www.w3.org/TR/css3-multicol/#column-span0)
  - Allowed prefixes: webkit
  - Supported in all browsers
  - Note: Currently `column-span` is effective only when specified on a page float.
- [column-fill](https://drafts.csswg.org/css-multicol-1/#propdef-column-fill)
  - Supported in all browsers

## [CSS Multi-column Layout 2](https://drafts.csswg.org/css-multicol-2/)

- [column-span](https://drafts.csswg.org/css-multicol-2/#propdef-column-span)
  - Allowed prefixes: webkit
  - Supported in all browsers
  - Note: Currently `column-span` is effective only when specified on a page float. When `auto` value is specified, either a single column or all columns are spanned depending on the min-content inline size of the page float.

### [CSS Basic User Interface 3](https://www.w3.org/TR/css3-ui/)

- [box-sizing](https://www.w3.org/TR/css3-ui/#propdef-box-sizing)
  - Support depends on browser capabilities
- [outline](https://www.w3.org/TR/css3-ui/#propdef-outline)
  - Support depends on browser capabilities
- [outline-color](https://www.w3.org/TR/css3-ui/#propdef-outline-color)
  - Support depends on browser capabilities
- [outline-style](https://www.w3.org/TR/css3-ui/#propdef-outline-style)
  - Support depends on browser capabilities
- [outline-width](https://www.w3.org/TR/css3-ui/#propdef-outline-width)
  - Support depends on browser capabilities
- [text-overflow](https://www.w3.org/TR/css3-ui/#propdef-text-overflow)
  - Allowed prefixes: ms
  - Support depends on browser capabilities

### [CSS Writing Modes 3](https://www.w3.org/TR/css-writing-modes-3/)

- [direction](https://www.w3.org/TR/css-writing-modes-3/#propdef-direction)
  - Support depends on browser capabilities
- [text-combine-upright](https://www.w3.org/TR/css-writing-modes-3/#propdef-text-combine-upright)
  - Support depends on browser capabilities
- [text-combine-horizontal](https://www.w3.org/TR/2012/WD-css3-writing-modes-20121115/#text-combine-horizontal0)
  - This deprecated property is kept for compatibility.
  - Allowed prefixes: epub, ms
  - Support depends on browser capabilities
- [text-combine](https://www.w3.org/TR/2011/WD-css3-writing-modes-20110531/#text-combine0)
  - This deprecated property is kept for compatibility.
  - Allowed prefixes: webkit
  - Support depends on browser capabilities
- [text-orientation](https://www.w3.org/TR/css-writing-modes-3/#propdef-text-orientation)
  - Allowed prefixes: epub, webkit
  - Support depends on browser capabilities
  - Note: supported values are [those defined in 20 March 2014 Candidate Recommendation](https://www.w3.org/TR/2014/CR-css-writing-modes-3-20140320/#propdef-text-orientation), not those in the latest spec.
- [unicode-bidi](https://www.w3.org/TR/css-writing-modes-3/#propdef-unicode-bidi)
  - Support depends on browser capabilities
  - Supports [new values (`isolate`, `isolate-override`, `plaintext`) in CSS Writing Modes 3](https://www.w3.org/TR/css-writing-modes-3/#propdef-unicode-bidi)
- [writing-mode](https://www.w3.org/TR/css-writing-modes-3/#propdef-writing-mode)
  - Allowed prefixes: epub, webkit
  - Support depends on browser capabilities
  - Note: supported values are [those defined in 20 March 2014 Candidate Recommendation](https://www.w3.org/TR/2014/CR-css-writing-modes-3-20140320/#propdef-writing-mode), not those in the latest spec.

### [CSS Flexible Box Layout 1](https://www.w3.org/TR/css-flexbox-1/)

- [align-content](https://www.w3.org/TR/css-flexbox-1/#propdef-align-content)
  - Support depends on browser capabilities
- [align-items](https://www.w3.org/TR/css-flexbox-1/#propdef-align-items)
  - Support depends on browser capabilities
- [align-self](https://www.w3.org/TR/css-flexbox-1/#propdef-align-self)
  - Support depends on browser capabilities
- [display](https://www.w3.org/TR/css-flexbox-1/#flex-containers)
  - Support depends on browser capabilities
  - Supports [`flex`, `inline-flex`](https://www.w3.org/TR/css-flexbox-1/#flex-containers), [`ruby`, `ruby-base`, `ruby-text`, `ruby-base-container` and `ruby-text-container`](https://www.w3.org/TR/css-ruby-1/#propdef-display) values.
- [flex](https://www.w3.org/TR/css-flexbox-1/#propdef-flex)
  - Support depends on browser capabilities
- [flex-basis](https://www.w3.org/TR/css-flexbox-1/#propdef-flex-basis)
  - Support depends on browser capabilities
- [flex-direction](https://www.w3.org/TR/css-flexbox-1/#propdef-flex-direction)
  - Support depends on browser capabilities
- [flex-flow](https://www.w3.org/TR/css-flexbox-1/#propdef-flex-flow)
  - Support depends on browser capabilities
- [flex-grow](https://www.w3.org/TR/css-flexbox-1/#propdef-flex-grow)
  - Support depends on browser capabilities
- [flex-shrink](https://www.w3.org/TR/css-flexbox-1/#propdef-flex-shrink)
  - Support depends on browser capabilities
- [flex-wrap](https://www.w3.org/TR/css-flexbox-1/#propdef-flex-wrap)
  - Support depends on browser capabilities
- [justify-content](https://www.w3.org/TR/css-flexbox-1/#propdef-justify-content)
  - Support depends on browser capabilities
- [order](https://www.w3.org/TR/css-flexbox-1/#propdef-order)
  - Support depends on browser capabilities

### [CSS Fragmentation 3](https://www.w3.org/TR/css3-break/)

- [break-after](https://www.w3.org/TR/css3-break/#propdef-break-after)
  - Supported in all browsers
- [break-before](https://www.w3.org/TR/css3-break/#propdef-break-before)
  - Supported in all browsers
- [break-inside](https://www.w3.org/TR/css3-multicol/#break-inside)
  - Supported in all browsers
  - Note: All of `avoid-page`, `avoid-column` and `avoid-region` values are treated as if they were `avoid`. [[Issue]](https://github.com/vivliostyle/vivliostyle.js/issues/128)
- [orphans](https://www.w3.org/TR/css3-break/#propdef-orphans)
  - Supported in all browsers
- [widows](https://www.w3.org/TR/css3-break/#propdef-widows)
  - Supported in all browsers
- [box-decoration-break](https://www.w3.org/TR/css3-break/#propdef-box-decoration-break)
  - Allowed prefixes: webkit
  - Supported in all browsers
  - Note: Background, box-shadow and border images on inline-start/end borders are always rendered as if `box-decoration-break: clone` is specified.

### [CSS Transforms 1](https://www.w3.org/TR/css-transforms-1/)

- [backface-visibility](https://www.w3.org/TR/css-transforms-1/#propdef-backface-visibility)
  - Allowed prefixes: ms, webkit
  - Support depends on browser capabilities
- [transform](https://www.w3.org/TR/css-transforms-1/#propdef-transform)
  - Allowed prefixes: epub, ms
  - Support depends on browser capabilities
- [transform-origin](https://www.w3.org/TR/css-transforms-1/#propdef-transform-origin)
  - Allowed prefixes: epub, ms
  - Support depends on browser capabilities

### [CSS Ruby Layout 1](https://www.w3.org/TR/css-ruby-1/)

- [display](https://www.w3.org/TR/css-ruby-1/#propdef-display)
  - Support depends on browser capabilities
  - Supports [`flex`, `inline-flex`](https://www.w3.org/TR/css-flexbox-1/#flex-containers), [`ruby`, `ruby-base`, `ruby-text`, `ruby-base-container` and `ruby-text-container`](https://www.w3.org/TR/css-ruby-1/#propdef-display) values.
- [ruby-align](https://www.w3.org/TR/css-ruby-1/#propdef-ruby-align)
  - Support depends on browser capabilities
- [ruby-position](https://drafts.csswg.org/css-ruby-1/#propdef-ruby-position)
  - Support depends on browser capabilities
  - Supports syntax defined in the current editor's draft.

### [CSS Mobile Text Size Adjustment 1](https://drafts.csswg.org/css-size-adjust-1/)

- [text-size-adjust](https://drafts.csswg.org/css-size-adjust-1/#text-size-adjust)
  - Allowed prefixes: moz, ms
  - Support depends on browser capabilities

## [Compositing and Blending 1](https://www.w3.org/TR/compositing-1/)

- [background-blend-mode](https://www.w3.org/TR/compositing-1/#propdef-background-blend-mode)
  - Support depends on browser capabilities
- [isolation](https://www.w3.org/TR/compositing-1/#propdef-isolation)
  - Support depends on browser capabilities
- [mix-blend-mode](https://www.w3.org/TR/compositing-1/#propdef-mix-blend-mode)
  - Support depends on browser capabilities

### [Scalable Vector Graphics (SVG) 2](https://www.w3.org/TR/SVG2/)

- [color-interpolation](https://www.w3.org/TR/SVG2/painting.html#ColorInterpolationProperty)
  - Support depends on browser capabilities
- [color-rendering](https://www.w3.org/TR/SVG2/painting.html#ColorRenderingProperty)
  - Support depends on browser capabilities
- [fill](https://www.w3.org/TR/SVG2/painting.html#FillProperty)
  - Support depends on browser capabilities
- [fill-opacity](https://www.w3.org/TR/SVG2/painting.html#FillOpacityProperty)
  - Support depends on browser capabilities
- [fill-rule](https://www.w3.org/TR/SVG2/painting.html#FillRuleProperty)
  - Support depends on browser capabilities
- [glyph-orientation-vertical](https://www.w3.org/TR/SVG2/text.html#GlyphOrientationVerticalProperty)
  - Support depends on browser capabilities
- [image-rendering](https://www.w3.org/TR/SVG2/painting.html#ImageRenderingProperty)
  - Support depends on browser capabilities
- [marker](https://www.w3.org/TR/SVG2/painting.html#MarkerProperty)
  - Support depends on browser capabilities
- [marker-start](https://www.w3.org/TR/SVG2/painting.html#MarkerStartProperty)
  - Support depends on browser capabilities
- [marker-mid](https://www.w3.org/TR/SVG2/painting.html#MarkerMidProperty)
  - Support depends on browser capabilities
- [marker-end](https://www.w3.org/TR/SVG2/painting.html#MarkerEndProperty)
  - Support depends on browser capabilities
- [pointer-events](https://www.w3.org/TR/SVG2/interact.html#PointerEventsProperty)
  - Support depends on browser capabilities
- [paint-order](https://www.w3.org/TR/SVG2/painting.html#PaintOrderProperty)
  - Support depends on browser capabilities
- [shape-rendering](https://www.w3.org/TR/SVG2/painting.html#ShapeRenderingProperty)
  - Support depends on browser capabilities
- [stop-color](https://www.w3.org/TR/SVG2/pservers.html#StopColorProperty)
  - Support depends on browser capabilities
- [stop-opacity](https://www.w3.org/TR/SVG2/pservers.html#StopOpacityProperty)
  - Support depends on browser capabilities
- [stroke](https://www.w3.org/TR/SVG2/painting.html#StrokeProperty)
  - Support depends on browser capabilities
- [stroke-dasharray](https://www.w3.org/TR/SVG2/painting.html#StrokeDasharrayProperty)
  - Support depends on browser capabilities
- [stroke-dashoffset](https://www.w3.org/TR/SVG2/painting.html#StrokeDashoffsetProperty)
  - Support depends on browser capabilities
- [stroke-linecap](https://www.w3.org/TR/SVG2/painting.html#StrokeLinecapProperty)
  - Support depends on browser capabilities
- [stroke-linejoin](https://www.w3.org/TR/SVG2/painting.html#StrokeLinejoinProperty)
  - Support depends on browser capabilities
- [stroke-miterlimit](https://www.w3.org/TR/SVG2/painting.html#StrokeMiterlimitProperty)
  - Support depends on browser capabilities
- [stroke-opacity](https://www.w3.org/TR/SVG2/painting.html#StrokeOpacityProperty)
  - Support depends on browser capabilities
- [stroke-width](https://www.w3.org/TR/SVG2/painting.html#StrokeWidthProperty)
  - Support depends on browser capabilities
- [text-anchor](https://www.w3.org/TR/SVG2/text.html#TextAnchorProperty)
  - Support depends on browser capabilities
- [text-rendering](https://www.w3.org/TR/SVG2/painting.html#TextRenderingProperty)
  - Support depends on browser capabilities
- [vector-effect](https://www.w3.org/TR/SVG2/coords.html#VectorEffectProperty)
  - Support depends on browser capabilities

### [Scalable Vector Graphics (SVG) 1.1](https://www.w3.org/TR/SVG11/)

  - [alignment-baseline](https://www.w3.org/TR/SVG11/text.html#AlignmentBaselineProperty)
    - Support depends on browser capabilities
  - [baseline-shift](https://www.w3.org/TR/SVG11/text.html#BaselineShiftProperty)
    - Support depends on browser capabilities
  - [dominant-baseline](https://www.w3.org/TR/SVG11/text.html#DominantBaselineProperty)
    - Support depends on browser capabilities
  - [mask](https://www.w3.org/TR/SVG11/masking.html#MaskProperty)
    - Support depends on browser capabilities

### [CSS Masking 1](https://drafts.fxtf.org/css-masking-1/)

- [clip-path](https://drafts.fxtf.org/css-masking-1/#the-clip-path)
  - Allowed prefixes: webkit
  - Support depends on browser capabilities
- [clip-rule](https://drafts.fxtf.org/css-masking-1/#the-clip-rule)
  - Support depends on browser capabilities

## [CSS Page Floats 3](https://drafts.csswg.org/css-page-floats-3/)
- [clear](https://drafts.csswg.org/css-page-floats-3/#propdef-clear)
  - Supports [`none`, `left`, `right`, `top`, `bottom`, `both`, `all`, `same`](https://drafts.csswg.org/css-page-floats-3/#propdef-clear) values.
  - When `all` is specified on a block-level box (not a page float), the block-start edge of the box gets pushed down so that the edge comes after any block-start/block-end page float of which anchors are before the box in the document order.
  - When a `clear` value is specified on a page float, it is placed so that it comes after any of preceding page floats.
  - `same` value means the same direction as one which the page float is floated to.
  - If a page float with `float: snap-block` would be placed at the block-start end but a `clear` value on it forbidden such placement, the float is instead placed at the block-end side (unless the `clear` value also forbidden such placement).
  - Supported in all browsers
- [float](https://drafts.csswg.org/css-page-floats-3/#propdef-float)
  - Supports [`block-start`, `block-end`, `inline-start`, `inline-end`, `snap-block`, `left`, `right`, `top`, `bottom` and `none`](https://drafts.csswg.org/css-page-floats/#propdef-float) values.
  - Supported in all browsers
- [float-reference](https://drafts.csswg.org/css-page-floats-3/#propdef-float-reference)
  - Supported in all browsers

## [CSS GCPM 3](https://www.w3.org/TR/css-gcpm-3/)
- [footnote-policy](https://www.w3.org/TR/css-gcpm-3/#propdef-footnote-policy)
  - Supports [`auto`, `line`](https://www.w3.org/TR/css-gcpm-3/#propdef-footnote-policy) values.
  - Supported in all browsers

## [Filter Effects 1](https://www.w3.org/TR/filter-effects-1/)
- [filter](https://www.w3.org/TR/filter-effects-1/#propdef-filter)
  - Allowed prefixes: webkit
  - Support depends on browser capabilities
- [flood-color](https://www.w3.org/TR/filter-effects-1/#FloodColorProperty)
  - Support depends on browser capabilities
- [flood-opacity](https://www.w3.org/TR/filter-effects-1/#propdef-flood-opacity)
  - Support depends on browser capabilities
- [lighting-color](https://www.w3.org/TR/filter-effects-1/#propdef-lighting-color)
  - Support depends on browser capabilities

### [Pointer Events](https://www.w3.org/TR/pointerevents/)

- [touch-action](https://www.w3.org/TR/pointerevents/#the-touch-action-css-property)
  - Allowed prefixes: ms
  - Support depends on browser capabilities

## [CSS Logical Properties and Values 1](https://www.w3.org/TR/css-logical-1/)
- [block-size, inline-size, min-block-size, min-inline-size, max-block-size, max-inline-size](https://www.w3.org/TR/css-logical-1/#dimension-properties)
  - Supported in all browsers
- [margin-block-start, margin-block-end, margin-inline-start, margin-inline-end, margin-block, margin-inline](https://www.w3.org/TR/css-logical-1/#margin-properties)
  - Supported in all browsers
- [inset-block-start, inset-block-end, inset-inline-start, inset-inline-end, inset-block, inset-inline](https://www.w3.org/TR/css-logical-1/#inset-properties)
  - Supported in all browsers
- [padding-block-start, padding-block-end, padding-inline-start, padding-inline-end, padding-block, padding-inline](https://www.w3.org/TR/css-logical-1/#padding-properties)
  - Supported in all browsers
- [border-block-start-width, border-block-end-width, border-inline-start-width, border-inline-end-width, border-block-width, border-inline-width, border-block-start-style, border-block-end-style, border-inline-start-style, border-inline-end-style, border-block-style, border-inline-style, border-block-start-color, border-block-end-color, border-inline-start-color, border-inline-end-color, border-block-color, border-inline-color, border-block-start, border-block-end, border-inline-start, border-inline-end, border-block, border-inline](https://www.w3.org/TR/css-logical-1/#border-properties)
  - Supported in all browsers

## [EPUB Adaptive Layout](http://www.idpf.org/epub/pgt/)

Note: This spec is not on a W3C standards track. Future version of Vivliostyle may drop support for this spec.

### At-rules

- [@-epubx-define](http://www.idpf.org/epub/pgt/#rule-define)
  - Supported in all browsers
- [@-epubx-flow](http://www.idpf.org/epub/pgt/#rule-flow)
  - Supported in all browsers
- [@-epubx-page-master](http://www.idpf.org/epub/pgt/#rule-page-master)
  - Supported in all browsers
- [@-epubx-page-template](http://www.idpf.org/epub/pgt/#rule-page-template)
  - Supported in all browsers
- [@-epubx-partition](http://www.idpf.org/epub/pgt/#rule-partition)
  - Supported in all browsers
- [@-epubx-partition-group](http://www.idpf.org/epub/pgt/#rule-partition-group)
  - Supported in all browsers
- [@-epubx-region](http://www.idpf.org/epub/pgt/#rule-region)
  - Supported in all browsers
- [@-epubx-viewport](http://www.idpf.org/epub/pgt/#rule-viewport)
  - Supported in all browsers
- [@-epubx-when](http://www.idpf.org/epub/pgt/#rule-when)
  - Supported in all browsers

### Properties

- [-epubx-conflicting-partitions](http://www.idpf.org/epub/pgt/#prop-conflicting-partitions)
  - Supported in all browsers
- [-epubx-enabled](http://www.idpf.org/epub/pgt/#prop-enabled)
  - Supported in all browsers
- [-epubx-flow-consume](http://www.idpf.org/epub/pgt/#prop-flow-consume)
  - Supported in all browsers
- [-epubx-flow-from](http://www.idpf.org/epub/pgt/#prop-flow-from)
  - Supported in all browsers
  - Only effective when specified to EPUB Adaptive Layout partitions.
- [-epubx-flow-into](http://www.idpf.org/epub/pgt/#prop-flow-into)
  - Supported in all browsers
- [-epubx-flow-linger](http://www.idpf.org/epub/pgt/#prop-flow-linger)
  - Supported in all browsers
- [-epubx-flow-options](http://www.idpf.org/epub/pgt/#prop-flow-options)
  - Supported in all browsers
- [-epubx-flow-priority](http://www.idpf.org/epub/pgt/#prop-flow-priority)
  - Supported in all browsers
- [-epubx-min-page-height](http://www.idpf.org/epub/pgt/#prop-min-page-height)
  - Supported in all browsers
- [-epubx-min-page-width](http://www.idpf.org/epub/pgt/#prop-min-page-width)
  - Supported in all browsers
- [-epubx-required](http://www.idpf.org/epub/pgt/#prop-required)
  - Supported in all browsers
- [-epubx-required-partitions](http://www.idpf.org/epub/pgt/#prop-required-partitions)
  - Supported in all browsers
- [-epubx-shape-outside](http://www.idpf.org/epub/pgt/#prop-shape-outside)
  - Supported in all browsers
  - Only effective when specified to EPUB Adaptive Layout partitions.
  - Note: only [old syntaxes from 3 May 2012 Working Draft](https://www.w3.org/TR/2012/WD-css3-exclusions-20120503/#supported-svg-shapes) are supported.
- [-epubx-shape-inside](http://www.idpf.org/epub/pgt/#prop-shape-inside)
  - Supported in all browsers
  - Only effective when specified to EPUB Adaptive Layout partitions.
  - Note: only [old syntaxes from 3 May 2012 Working Draft](https://www.w3.org/TR/2012/WD-css3-exclusions-20120503/#supported-svg-shapes) are supported.
- [-epubx-snap-height](http://www.idpf.org/epub/pgt/#prop-snap-height)
  - Supported in all browsers
- [-epubx-snap-width](http://www.idpf.org/epub/pgt/#prop-snap-width)
  - Supported in all browsers
- [-epubx-text-zoom](http://www.idpf.org/epub/pgt/#prop-text-zoom)
  - Supported in all browsers
- [-epubx-utilization](http://www.idpf.org/epub/pgt/#prop-utilization)
  - Supported in all browsers
- [-epubx-wrap-flow](http://www.idpf.org/epub/pgt/#prop-wrap-flow)
  - Supported in all browsers
  - Only effective when specified to EPUB Adaptive Layout partitions.

## [CSS Repeated Headers and Footers](https://specs.rivoal.net/css-repeat/)

Note: This spec proposal is not submitted to CSS Working Group yet.

- [repeat-on-break](https://specs.rivoal.net/css-repeat/#propdef-repeat-on-break)
  - Supported in all browsers
