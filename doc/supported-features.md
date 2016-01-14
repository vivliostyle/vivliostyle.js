# Features supported by Vivliostyle

The Vivliostyle uses a two-layer architecture, with some of its functionality implemented purely in javascript, and some being delegated all or in part to the browser engine on top of which Vivliostyle is running. In the following list <quote>Depends on browser's capability: No</quote> indicates that features implemented in Javascript that will work regardless of the browser engine. Other features' availability and behavior do vary based on what is supported by the underlying browser engine. Vivliostyle Formatter uses Chromium 47.0.2526.80's engine.

Properties where <quote>Allowed prefixes</quote> is indicated may be used with any of the listed prefixes, or preferably without a prefix, regardless of the underlying browser engine. If Vivliostyle needs to invoke the browser engine, it will internally convert to the appropriate syntax.

## Values

- [Supported CSS-wide keywords](http://www.w3.org/TR/css-values/#common-keywords): `inherit`
  - Depends on browser's capability: No
  - `initial` and `unset` are *not* supported.
- [Supported length units](http://www.w3.org/TR/css-values/#lengths): `em`, `ex`, `ch`, `rem`, `cm`, `mm`, `q`, `in`, `pc`, `pt`, `px`.
  - Depends on browser's capability: No
  - Note: `rem` is not correctly interpreted when used within @page rules. [[Issue]](https://github.com/vivliostyle/vivliostyle.js/issues/109)
- [Supported color values]
  - Depends on browser's capability: Yes
  - [Basic color keywords](http://www.w3.org/TR/css3-color/#html4)
  - [RGB color values](http://www.w3.org/TR/css3-color/#rgb-color), [RGBA color values](http://www.w3.org/TR/css3-color/#rgba-color)
  - [‘transparent’ color keyword](http://www.w3.org/TR/css3-color/#transparent)
  - [HSL color values](http://www.w3.org/TR/css3-color/#hsl-color), [HSLA color values](http://www.w3.org/TR/css3-color/#hsla-color)
  - [Extended color keywords](http://www.w3.org/TR/css3-color/#svg-color)
  - [‘currentColor’ color keyword](http://www.w3.org/TR/css3-color/#currentcolor)

## Selectors

### [CSS 2](http://www.w3.org/TR/CSS2/)

- [Universal selector `*`](https://www.w3.org/TR/CSS2/selector.html#universal-selector)
  - Depends on browser's capability: No
- [Type selectors `E`](https://www.w3.org/TR/CSS2/selector.html#type-selectors)
  - Depends on browser's capability: No
- [Descendant selectors `E F`](https://www.w3.org/TR/CSS2/selector.html#descendant-selectors)
  - Depends on browser's capability: No
- [Child selectors `E > F`](https://www.w3.org/TR/CSS2/selector.html#child-selectors)
  - Depends on browser's capability: No
- [Adjacent sibling selectors `E + F`](https://www.w3.org/TR/CSS2/selector.html#adjacent-selectors)
  - Depends on browser's capability: No
- [Attribute selectors `E[foo]`, `E[foo="bar"]`, `E[foo~="bar"]`, `E[foo|="bar"]`](https://www.w3.org/TR/CSS2/selector.html#attribute-selectors)
  - Depends on browser's capability: No
- [Class selectors `E.foo`](https://www.w3.org/TR/CSS2/selector.html#class-html)
  - Depends on browser's capability: No
- [ID selectors `E#foo`](https://www.w3.org/TR/CSS2/selector.html#id-selectors)
  - Depends on browser's capability: No
- [`:first-child` pseudo-class](https://www.w3.org/TR/CSS2/selector.html#first-child)
  - Depends on browser's capability: No
- [Link pseudo-class `E:link`](https://www.w3.org/TR/CSS2/selector.html#link-pseudo-classes)
  - Depends on browser's capability: No
- [Language pseudo-class `E:lang(c)`](https://www.w3.org/TR/CSS2/selector.html#lang)
  - Depends on browser's capability: No
- [`:first-line` pseudo-element](https://www.w3.org/TR/CSS2/selector.html#first-line-pseudo)
  - Depends on browser's capability: No
  - Note: there is a bug when used alone or with the universal selector(`*`). [[Issue]](https://github.com/vivliostyle/vivliostyle.js/issues/133)
- [`:first-letter` pseudo-element](https://www.w3.org/TR/CSS2/selector.html#first-letter)
  - Depends on browser's capability: No
  - Note: there is a bug when used alone, with the universal selector(`*`), or with non-ascii characters. [[Issue]](https://github.com/vivliostyle/vivliostyle.js/issues/34)
- [`:before` and `:after` pseudo-elements](https://www.w3.org/TR/CSS2/selector.html#before-and-after)
  - Depends on browser's capability: No

#### Not supported selectors

- [Link pseudo-class `E:visited`](https://www.w3.org/TR/CSS2/selector.html#link-pseudo-classes)
- [Dynamic pseudo-classes `E:active`, `E:hover`, `E:focus`](https://www.w3.org/TR/CSS2/selector.html#dynamic-pseudo-classes)

### [Selectors 3](https://www.w3.org/TR/css3-selectors/)

- [Type selectors with namespaces `ns|E`, `*|E`](https://www.w3.org/TR/css3-selectors/#typenmsp)
  - Depends on browser's capability: No
- [Universal selector with namespaces `ns|*`, `*|*`](https://www.w3.org/TR/css3-selectors/#univnmsp)
  - Depends on browser's capability: No
- [Attribute selectors with namespaces `[ns|att]`, `[|att]`, `[ns|att=val]`, `[|att=val]`, `[ns|att~=val]`, `[|att~=val]`, `[ns|att|=val]`, `[|att|=val]`](https://www.w3.org/TR/css3-selectors/#attrnmsp)
  - Depends on browser's capability: No
- [`:root` pseudo-class](https://www.w3.org/TR/css3-selectors/#root-pseudo)
  - Depends on browser's capability: No
- [`:nth-child()` pseudo-class](https://www.w3.org/TR/css3-selectors/#nth-child-pseudo)
  - Depends on browser's capability: No
  - Note: only a single integer argument is accepted for now. [[Issue]](https://github.com/vivliostyle/vivliostyle.js/issues/87)
- [`:first-child` pseudo-class](https://www.w3.org/TR/css3-selectors/#first-child-pseudo)
- [`::first-line` pseudo-element](https://www.w3.org/TR/css3-selectors/#first-line)
  - Depends on browser's capability: No
  - Note: there is a bug when used alone or with the universal selector(`*`). [[Issue]](https://github.com/vivliostyle/vivliostyle.js/issues/133)
- [`::first-letter` pseudo-element](https://www.w3.org/TR/css3-selectors/#first-letter)
  - Depends on browser's capability: No
  - Note: there is a bug when used alone, with the universal selector(`*`), or with non-ascii characters. [[Issue]](https://github.com/vivliostyle/vivliostyle.js/issues/34)
- [`::before` and `::after` pseudo-elements](https://www.w3.org/TR/css3-selectors/#gen-content)
  - Depends on browser's capability: No
- [General sibling combinator `E ~ F`](https://www.w3.org/TR/css3-selectors/#general-sibling-combinators)
  - Depends on browser's capability: No

#### Not supported selectors

- [Type selectors without namespaces `|E`](https://www.w3.org/TR/css3-selectors/#typenmsp)
- [Universal selector without namespaces `|*`](https://www.w3.org/TR/css3-selectors/#univnmsp)
- [Substring matching attribute selectors `[att^=val]`, `[att$=val]`, `[att*=val]`](https://www.w3.org/TR/css3-selectors/#attribute-substrings)
- [Attribute selectors with universal namespace `[*|att]`, `[*|att=val]`, `[*|att~=val]`, `[*|att|=val]`](https://www.w3.org/TR/css3-selectors/#attrnmsp)
- [Target pseudo-class `:target`](https://www.w3.org/TR/css3-selectors/#target-pseudo)
- [The UI element states pseudo-classes `:enabled`, `:disabled`, `:checked`, `:indeterminate`](https://www.w3.org/TR/css3-selectors/#UIstates)
- [`:nth-last-child()` pseudo-class](https://www.w3.org/TR/css3-selectors/#nth-last-child-pseudo)
- [`:nth-of-type()` pseudo-class](https://www.w3.org/TR/css3-selectors/#nth-of-type-pseudo)
- [`:nth-last-of-type()` pseudo-class](https://www.w3.org/TR/css3-selectors/#nth-last-of-type-pseudo)
- [`:last-child` pseudo-class](https://www.w3.org/TR/css3-selectors/#last-child-pseudo)
- [`:first-of-type` pseudo-class](https://www.w3.org/TR/css3-selectors/#first-of-type-pseudo)
- [`:last-of-type` pseudo-class](https://www.w3.org/TR/css3-selectors/#last-of-type-pseudo)
- [`:only-child` pseudo-class](https://www.w3.org/TR/css3-selectors/#only-child-pseudo)
- [`:only-of-type` pseudo-class](https://www.w3.org/TR/css3-selectors/#only-of-type-pseudo)
- [`:empty` pseudo-class](https://www.w3.org/TR/css3-selectors/#empty-pseudo)
- [The negation pseudo-class `:not()`](https://www.w3.org/TR/css3-selectors/#negation)

## At-rules

### [CSS 2](http://www.w3.org/TR/CSS2/)

- [@charset](http://www.w3.org/TR/CSS2/syndata.html#charset)
  - Depends on browser's capability: No
- [@import](http://www.w3.org/TR/CSS2/cascade.html#at-import)
  - [Also in CSS Cascading and Inheritance 3](http://www.w3.org/TR/css-cascade-3/#at-import)
  - Depends on browser's capability: No

### [CSS Namespaces 3](http://www.w3.org/TR/css3-namespace/)

- [@namespace](http://www.w3.org/TR/css3-namespace/#declaration)
  - Depends on browser's capability: No

### [CSS Conditional Rules 3](http://www.w3.org/TR/css3-conditional/)

- [@media](http://www.w3.org/TR/css3-conditional/#atmedia-rule)
  - Depends on browser's capability: No

### [CSS Paged Media 3](https://drafts.csswg.org/css-page-3/)

- [@page](https://drafts.csswg.org/css-page/#at-page-rule)
  - Depends on browser's capability: No
- [Page-margin boxes (@top-left-corner, @top-left, @top-center, @top-right, @top-right-corner, @left-top, @left-middle, @left-bottom, @right-top, @right-middle, @right-bottom, @bottom-left-corner, @bottom-left, @bottom-center, @bottom-right, @bottom-right-coner)](https://drafts.csswg.org/css-page/#margin-at-rules)
  - Depends on browser's capability: No

### [CSS Fonts 3](http://www.w3.org/TR/css-fonts-3/)

- [@font-face](http://www.w3.org/TR/css-fonts-3/#font-face-rule)
  - Depends on browser's capability: Yes
  - Note: `font-stretch`, `unicode-range` and `font-feature-settings` descriptors are currently ignored.

## Media queries

- Vivliostyle uses styles specified for [`print` media](http://www.w3.org/TR/CSS2/media.html#media-types) (as well as `all`).
  - Depends on browser's capability: No
- Supported media features
  - [`(min-|max-)width`](http://www.w3.org/TR/css3-mediaqueries/#width)
      - Depends on browser's capability: No
  - [`(min-|max-)height`](http://www.w3.org/TR/css3-mediaqueries/#height)
      - Depends on browser's capability: No
  - [`(min-|max-)device-width`](http://www.w3.org/TR/css3-mediaqueries/#device-width)
      - Depends on browser's capability: No
  - [`(min-|max-)device-height`](http://www.w3.org/TR/css3-mediaqueries/#device-height)
      - Depends on browser's capability: No
  - [`(min-|max-)color`](http://www.w3.org/TR/css3-mediaqueries/#color)
      - Depends on browser's capability: No

## Properties

### [CSS 2](http://www.w3.org/TR/CSS2/)

- [background](http://www.w3.org/TR/CSS2/colors.html#propdef-background)
  - Supports [CSS Backgrounds 3 syntax](http://www.w3.org/TR/css3-background/#background)
  - Depends on browser's capability: Yes
- [background-attachment](http://www.w3.org/TR/CSS2/colors.html#propdef-background-attachment)
  - Supports [CSS Backgrounds 3 syntax](http://www.w3.org/TR/css3-background/#background-attachment)
  - Depends on browser's capability: Yes
  - Note: behavior when used within `@page` rules is not compliant to the spec. [[Issue]](https://github.com/vivliostyle/vivliostyle.js/issues/22)
- [background-color](http://www.w3.org/TR/CSS2/colors.html#propdef-background-color)
  - Supports [CSS Backgrounds 3 syntax](http://www.w3.org/TR/css3-background/#background-color)
  - Depends on browser's capability: Yes
- [background-image](http://www.w3.org/TR/CSS2/colors.html#propdef-background-image)
  - Supports [CSS Backgrounds 3 syntax](http://www.w3.org/TR/css3-background/#background-image)
  - Depends on browser's capability: Yes
  - Note: behavior when used within `@page` rules is not compliant to the spec. [[Issue]](https://github.com/vivliostyle/vivliostyle.js/issues/22)
- [background-position](http://www.w3.org/TR/CSS2/colors.html#propdef-background-position)
  - Supports [CSS Backgrounds 3 syntax](http://www.w3.org/TR/css3-background/#background-position)
  - Depends on browser's capability: Yes
  - Note: behavior when used within `@page` rules is not compliant to the spec. [[Issue]](https://github.com/vivliostyle/vivliostyle.js/issues/22)
- [background-repeat](http://www.w3.org/TR/CSS2/colors.html#propdef-background-repeat)
  - Supports [CSS Backgrounds 3 syntax](http://www.w3.org/TR/css3-background/#background-repeat)
  - Depends on browser's capability: Yes
  - Note: behavior when used within `@page` rules is not compliant to the spec. [[Issue]](https://github.com/vivliostyle/vivliostyle.js/issues/22)
- [border](http://www.w3.org/TR/CSS2/box.html#propdef-border)
  - Depends on browser's capability: Yes
- [border-bottom](http://www.w3.org/TR/CSS2/box.html#propdef-border-bottom)
  - Depends on browser's capability: Yes
- [border-bottom-color](http://www.w3.org/TR/CSS2/box.html#propdef-border-bottom-color)
  - Depends on browser's capability: Yes
- [border-bottom-style](http://www.w3.org/TR/CSS2/box.html#propdef-border-bottom-style)
  - Depends on browser's capability: Yes
- [border-bottom-width](http://www.w3.org/TR/CSS2/box.html#propdef-border-bottom-width)
  - Depends on browser's capability: Yes
- [border-collapse](http://www.w3.org/TR/CSS2/tables.html#propdef-border-collapse)
  - Depends on browser's capability: Yes
- [border-color](http://www.w3.org/TR/CSS2/box.html#propdef-border-color)
  - Depends on browser's capability: Yes
- [border-left](http://www.w3.org/TR/CSS2/box.html#propdef-border-left)
  - Depends on browser's capability: Yes
- [border-left-color](http://www.w3.org/TR/CSS2/box.html#propdef-border-left-color)
  - Depends on browser's capability: Yes
- [border-left-style](http://www.w3.org/TR/CSS2/box.html#propdef-border-left-style)
  - Depends on browser's capability: Yes
- [border-left-width](http://www.w3.org/TR/CSS2/box.html#propdef-border-left-width)
  - Depends on browser's capability: Yes
- [border-right](http://www.w3.org/TR/CSS2/box.html#propdef-border-right)
  - Depends on browser's capability: Yes
- [border-right-color](http://www.w3.org/TR/CSS2/box.html#propdef-border-right-color)
  - Depends on browser's capability: Yes
- [border-right-style](http://www.w3.org/TR/CSS2/box.html#propdef-border-right-style)
  - Depends on browser's capability: Yes
- [border-right-width](http://www.w3.org/TR/CSS2/box.html#propdef-border-right-width)
  - Depends on browser's capability: Yes
- [border-spacing](http://www.w3.org/TR/CSS2/tables.html#propdef-border-spacing)
  - Depends on browser's capability: Yes
- [border-style](http://www.w3.org/TR/CSS2/box.html#propdef-border-style)
  - Depends on browser's capability: Yes
- [border-top](http://www.w3.org/TR/CSS2/box.html#propdef-border-top)
  - Depends on browser's capability: Yes
- [border-top-color](http://www.w3.org/TR/CSS2/box.html#propdef-border-top-color)
  - Depends on browser's capability: Yes
- [border-top-style](http://www.w3.org/TR/CSS2/box.html#propdef-border-top-style)
  - Depends on browser's capability: Yes
- [border-top-width](http://www.w3.org/TR/CSS2/box.html#propdef-border-top-width)
  - Depends on browser's capability: Yes
- [border-width](http://www.w3.org/TR/CSS2/box.html#propdef-border-width)
  - Depends on browser's capability: Yes
- [bottom](http://www.w3.org/TR/CSS2/visuren.html#propdef-bottom)
  - Depends on browser's capability: Yes
- [caption-side](http://www.w3.org/TR/CSS2/tables.html#propdef-caption-side)
  - Depends on browser's capability: Yes
- [clear](http://www.w3.org/TR/CSS2/visuren.html#propdef-clear)
  - Depends on browser's capability: No
- [clip](http://www.w3.org/TR/CSS2/visufx.html#propdef-clip)
  - Depends on browser's capability: Yes
- [color](http://www.w3.org/TR/CSS2/colors.html#propdef-color)
  - Depends on browser's capability: Yes
- [content](http://www.w3.org/TR/CSS2/generate.html#propdef-content)
  - Depends on browser's capability: No
- [counter-increment](http://www.w3.org/TR/CSS2/generate.html#propdef-counter-increment)
  - Depends on browser's capability: No
- [counter-reset](http://www.w3.org/TR/CSS2/generate.html#propdef-counter-reset)
  - Depends on browser's capability: No
- [cursor](http://www.w3.org/TR/CSS2/ui.html#propdef-cursor)
  - Depends on browser's capability: Yes
- [direction](http://www.w3.org/TR/CSS2/visuren.html#propdef-direction)
  - Depends on browser's capability: Yes
- [display](http://www.w3.org/TR/CSS2/visuren.html#propdef-display)
  - Depends on browser's capability: Yes
  - Supports [`flex` and `inline-flex` values](https://www.w3.org/TR/css-flexbox-1/#flex-containers)
- [empty-cells](http://www.w3.org/TR/CSS2/tables.html#propdef-empty-cells)
  - Depends on browser's capability: Yes
- [float](http://www.w3.org/TR/CSS2/visuren.html#propdef-float)
  - Depends on browser's capability: No
- [font](http://www.w3.org/TR/CSS2/fonts.html#propdef-font)
  - Depends on browser's capability: Yes
- [font-family](http://www.w3.org/TR/CSS2/fonts.html#propdef-font-family)
  - Depends on browser's capability: Yes
- [font-size](http://www.w3.org/TR/CSS2/fonts.html#propdef-font-size)
  - Depends on browser's capability: Yes
- [font-style](http://www.w3.org/TR/CSS2/fonts.html#propdef-font-style)
  - Depends on browser's capability: Yes
- [font-variant](http://www.w3.org/TR/CSS2/fonts.html#propdef-font-variant)
  - Depends on browser's capability: Yes
- [font-weight](http://www.w3.org/TR/CSS2/fonts.html#propdef-font-weight)
  - Depends on browser's capability: Yes
- [height](http://www.w3.org/TR/CSS2/visudet.html#propdef-height)
  - Depends on browser's capability: Yes
- [left](http://www.w3.org/TR/CSS2/visuren.html#propdef-left)
  - Depends on browser's capability: Yes
- [letter-spacing](http://www.w3.org/TR/CSS2/text.html#propdef-letter-spacing)
  - Depends on browser's capability: Yes
- [line-height](http://www.w3.org/TR/CSS2/visudet.html#propdef-line-height)
  - Depends on browser's capability: Yes
- [list-style](http://www.w3.org/TR/CSS2/generate.html#propdef-list-style)
  - Depends on browser's capability: Yes
- [list-style-image](http://www.w3.org/TR/CSS2/generate.html#propdef-list-style-image)
  - Depends on browser's capability: Yes
- [list-style-position](http://www.w3.org/TR/CSS2/generate.html#propdef-list-style-position)
  - Depends on browser's capability: Yes
- [list-style-type](http://www.w3.org/TR/CSS2/generate.html#propdef-list-style-type)
  - Depends on browser's capability: Yes
- [margin](http://www.w3.org/TR/CSS2/box.html#propdef-margin)
  - Depends on browser's capability: Yes
- [margin-bottom](http://www.w3.org/TR/CSS2/box.html#propdef-margin-bottom)
  - Depends on browser's capability: Yes
- [margin-left](http://www.w3.org/TR/CSS2/box.html#propdef-margin-left)
  - Depends on browser's capability: Yes
- [margin-right](http://www.w3.org/TR/CSS2/box.html#propdef-margin-right)
  - Depends on browser's capability: Yes
- [margin-top](http://www.w3.org/TR/CSS2/box.html#propdef-margin-top)
  - Depends on browser's capability: Yes
- [max-height](http://www.w3.org/TR/CSS2/visudet.html#propdef-max-height)
  - Depends on browser's capability: Yes
- [max-width](http://www.w3.org/TR/CSS2/visudet.html#propdef-max-width)
  - Depends on browser's capability: Yes
- [min-height](http://www.w3.org/TR/CSS2/visudet.html#propdef-min-height)
  - Depends on browser's capability: Yes
- [min-width](http://www.w3.org/TR/CSS2/visudet.html#propdef-min-width)
  - Depends on browser's capability: Yes
- [orphans](http://www.w3.org/TR/CSS2/page.html#propdef-orphans)
  - Depends on browser's capability: No
- [outline](http://www.w3.org/TR/CSS2/ui.html#propdef-outline)
  - Depends on browser's capability: Yes
- [outline-color](http://www.w3.org/TR/CSS2/ui.html#propdef-outline-color)
  - Depends on browser's capability: Yes
- [outline-style](http://www.w3.org/TR/CSS2/ui.html#propdef-outline-style)
  - Depends on browser's capability: Yes
- [outline-width](http://www.w3.org/TR/CSS2/ui.html#propdef-outline-width)
  - Depends on browser's capability: Yes
- [overflow](http://www.w3.org/TR/CSS2/visufx.html#propdef-overflow)
  - Depends on browser's capability: Yes
- [padding](http://www.w3.org/TR/CSS2/box.html#propdef-padding)
  - Depends on browser's capability: Yes
- [padding-bottom](http://www.w3.org/TR/CSS2/box.html#propdef-padding-bottom)
  - Depends on browser's capability: Yes
- [padding-left](http://www.w3.org/TR/CSS2/box.html#propdef-padding-left)
  - Depends on browser's capability: Yes
- [padding-right](http://www.w3.org/TR/CSS2/box.html#propdef-padding-right)
  - Depends on browser's capability: Yes
- [padding-top](http://www.w3.org/TR/CSS2/box.html#propdef-padding-top)
  - Depends on browser's capability: Yes
- [page-break-after](http://www.w3.org/TR/CSS2/page.html#propdef-page-break-after)
  - Depends on browser's capability: No
- [page-break-before](http://www.w3.org/TR/CSS2/page.html#propdef-page-break-before)
  - Depends on browser's capability: No
- [page-break-inside](http://www.w3.org/TR/CSS2/page.html#propdef-page-break-inside)
  - Depends on browser's capability: No
- [position](http://www.w3.org/TR/CSS2/visuren.html#propdef-position)
  - Depends on browser's capability: Yes
- [quotes](http://www.w3.org/TR/CSS2/generate.html#propdef-quotes)
  - Depends on browser's capability: No
  - Note: not supported within `@page` rules. [[Issue]](https://github.com/vivliostyle/vivliostyle.js/issues/43)
- [right](http://www.w3.org/TR/CSS2/visuren.html#propdef-right)
  - Depends on browser's capability: Yes
- [table-layout](http://www.w3.org/TR/CSS2/tables.html#propdef-table-layout)
  - Depends on browser's capability: Yes
- [text-align](http://www.w3.org/TR/CSS2/text.html#propdef-text-align)
  - Depends on browser's capability: Yes
- [text-decoration](http://www.w3.org/TR/CSS2/text.html#propdef-text-decoration)
  - Depends on browser's capability: Yes
- [text-indent](http://www.w3.org/TR/CSS2/text.html#propdef-text-indent)
  - Depends on browser's capability: Yes
- [text-transform](http://www.w3.org/TR/CSS2/text.html#propdef-text-transform)
  - Depends on browser's capability: Yes
- [top](http://www.w3.org/TR/CSS2/visuren.html#propdef-top)
  - Depends on browser's capability: Yes
- [unicode-bidi](http://www.w3.org/TR/CSS2/visuren.html#propdef-unicode-bidi)
  - Depends on browser's capability: Yes
- [vertical-align](http://www.w3.org/TR/CSS2/visudet.html#propdef-vertical-align)
  - Depends on browser's capability: Yes
- [visibility](http://www.w3.org/TR/CSS2/visufx.html#propdef-visibility)
  - Depends on browser's capability: Yes
- [white-space](http://www.w3.org/TR/CSS2/text.html#propdef-white-space)
  - Depends on browser's capability: Yes
- [widows](http://www.w3.org/TR/CSS2/page.html#propdef-widows)
  - Depends on browser's capability: No
- [width](http://www.w3.org/TR/CSS2/visudet.html#propdef-width)
  - Depends on browser's capability: Yes
- [word-spacing](http://www.w3.org/TR/CSS2/text.html#propdef-word-spacing)
  - Depends on browser's capability: Yes
- [z-index](http://www.w3.org/TR/CSS2/visuren.html#propdef-z-index)
  - Depends on browser's capability: Yes

### [CSS Paged Media 3](https://drafts.csswg.org/css-page-3/)

- [size](https://drafts.csswg.org/css-page-3/#descdef-page-size)
  - Depends on browser's capability: No
  - Supports `JIS-B5` and `JIS-B4` values in the current editor's draft.

### [CSS Color 3](http://www.w3.org/TR/css3-color/)

- [color](http://www.w3.org/TR/css3-color/#color0)
  - Depends on browser's capability: Yes
- [opacity](http://www.w3.org/TR/css3-color/#opacity)
  - Depends on browser's capability: Yes

### [CSS Backgrounds and Borders 3](http://www.w3.org/TR/css3-background/)

- [background](http://www.w3.org/TR/css3-background/#background)
  - Depends on browser's capability: Yes
- [background-attachment](http://www.w3.org/TR/css3-background/#background-attachment)
  - Depends on browser's capability: Yes
  - Note: behavior when used within `@page` rules is not compliant to the spec. [[Issue]](https://github.com/vivliostyle/vivliostyle.js/issues/22)
- [background-clip](http://www.w3.org/TR/css3-background/#background-clip)
  - Allowed prefixes: webkit
  - Depends on browser's capability: Yes
  - Note: behavior when used within `@page` rules is not compliant to the spec. [[Issue]](https://github.com/vivliostyle/vivliostyle.js/issues/22)
- [background-color](http://www.w3.org/TR/css3-background/#background-color)
  - Depends on browser's capability: Yes
- [background-image](http://www.w3.org/TR/css3-background/#background-image)
  - Depends on browser's capability: Yes
  - Note: behavior when used within `@page` rules is not compliant to the spec. [[Issue]](https://github.com/vivliostyle/vivliostyle.js/issues/22)
- [background-origin](http://www.w3.org/TR/css3-background/#background-origin)
  - Allowed prefixes: webkit
  - Depends on browser's capability: Yes
  - Note: behavior when used within `@page` rules is not compliant to the spec. [[Issue]](https://github.com/vivliostyle/vivliostyle.js/issues/22)
- [background-position](http://www.w3.org/TR/css3-background/#background-position)
  - Depends on browser's capability: Yes
  - Note: behavior when used within `@page` rules is not compliant to the spec. [[Issue]](https://github.com/vivliostyle/vivliostyle.js/issues/22)
- [background-repeat](http://www.w3.org/TR/css3-background/#background-repeat)
  - Depends on browser's capability: Yes
  - Note: behavior when used within `@page` rules is not compliant to the spec. [[Issue]](https://github.com/vivliostyle/vivliostyle.js/issues/22)
- [background-size](http://www.w3.org/TR/css3-background/#background-size)
  - Allowed prefixes: webkit
  - Depends on browser's capability: Yes
  - Note: behavior when used within `@page` rules is not compliant to the spec. [[Issue]](https://github.com/vivliostyle/vivliostyle.js/issues/22)
- [border](http://www.w3.org/TR/css3-background/#border)
  - Depends on browser's capability: Yes
- [border-bottom](http://www.w3.org/TR/css3-background/#border-bottom)
  - Depends on browser's capability: Yes
- [border-bottom-color](http://www.w3.org/TR/css3-background/#border-bottom-color)
  - Depends on browser's capability: Yes
- [border-bottom-left-radius](http://www.w3.org/TR/css3-background/#border-bottom-left-radius)
  - Depends on browser's capability: Yes
- [border-bottom-right-radius](http://www.w3.org/TR/css3-background/#border-bottom-right-radius)
  - Depends on browser's capability: Yes
- [border-bottom-style](http://www.w3.org/TR/css3-background/#border-bottom-style)
  - Depends on browser's capability: Yes
- [border-bottom-width](http://www.w3.org/TR/css3-background/#border-bottom-width)
  - Depends on browser's capability: Yes
- [border-color](http://www.w3.org/TR/css3-background/#border-color)
  - Depends on browser's capability: Yes
- [border-image](http://www.w3.org/TR/css3-background/#border-image)
  - Depends on browser's capability: Yes
- [border-image-outset](http://www.w3.org/TR/css3-background/#border-image-outset)
  - Depends on browser's capability: Yes
- [border-image-repeat](http://www.w3.org/TR/css3-background/#border-image-repeat)
  - Depends on browser's capability: Yes
- [border-image-slice](http://www.w3.org/TR/css3-background/#border-image-slice)
  - Depends on browser's capability: Yes
- [border-image-source](http://www.w3.org/TR/css3-background/#border-image-source)
  - Depends on browser's capability: Yes
- [border-image-width](http://www.w3.org/TR/css3-background/#border-image-width)
  - Depends on browser's capability: Yes
- [border-left](http://www.w3.org/TR/css3-background/#border-left)
  - Depends on browser's capability: Yes
- [border-left-color](http://www.w3.org/TR/css3-background/#border-left-color)
  - Depends on browser's capability: Yes
- [border-left-style](http://www.w3.org/TR/css3-background/#border-left-style)
  - Depends on browser's capability: Yes
- [border-left-width](http://www.w3.org/TR/css3-background/#border-left-width)
  - Depends on browser's capability: Yes
- [border-radius](http://www.w3.org/TR/css3-background/#border-radius)
  - Depends on browser's capability: Yes
- [border-right](http://www.w3.org/TR/css3-background/#border-right)
  - Depends on browser's capability: Yes
- [border-right-color](http://www.w3.org/TR/css3-background/#border-right-color)
  - Depends on browser's capability: Yes
- [border-right-style](http://www.w3.org/TR/css3-background/#border-right-style)
  - Depends on browser's capability: Yes
- [border-right-width](http://www.w3.org/TR/css3-background/#border-right-width)
  - Depends on browser's capability: Yes
- [border-style](http://www.w3.org/TR/css3-background/#border-style)
  - Depends on browser's capability: Yes
- [border-top](http://www.w3.org/TR/css3-background/#border-top)
  - Depends on browser's capability: Yes
- [border-top-color](http://www.w3.org/TR/css3-background/#border-top-color)
  - Depends on browser's capability: Yes
- [border-top-left-radius](http://www.w3.org/TR/css3-background/#border-top-left-radius)
  - Depends on browser's capability: Yes
- [border-top-right-radius](http://www.w3.org/TR/css3-background/#border-top-right-radius)
  - Depends on browser's capability: Yes
- [border-top-style](http://www.w3.org/TR/css3-background/#border-top-style)
  - Depends on browser's capability: Yes
- [border-top-width](http://www.w3.org/TR/css3-background/#border-top-width)
  - Depends on browser's capability: Yes
- [border-width](http://www.w3.org/TR/css3-background/#border-width)
  - Depends on browser's capability: Yes
- [box-shadow](http://www.w3.org/TR/css3-background/#box-shadow)
  - Allowed prefixes: webkit
  - Depends on browser's capability: Yes

### [CSS Image Values and Replaced Content 3](http://www.w3.org/TR/css3-images/)

- [object-fit](http://www.w3.org/TR/css3-images/#object-fit)
  - Depends on browser's capability: Yes
- [object-position](http://www.w3.org/TR/css3-images/#object-position)
  - Depends on browser's capability: Yes

### [CSS Fonts 3](http://www.w3.org/TR/css-fonts-3/)

- [font-family](http://www.w3.org/TR/css-fonts-3/#propdef-font-family)
  - Depends on browser's capability: Yes
- [font-kerning](http://www.w3.org/TR/css-fonts-3/#propdef-font-kerning)
  - Allowed prefixes: webkit
  - Depends on browser's capability: Yes
- [font-size](http://www.w3.org/TR/css-fonts-3/#propdef-font-size)
  - Depends on browser's capability: Yes
- [font-style](http://www.w3.org/TR/css-fonts-3/#propdef-font-style)
  - Depends on browser's capability: Yes
- [font-weight](http://www.w3.org/TR/css-fonts-3/#propdef-font-weight)
  - Depends on browser's capability: Yes

### [CSS Text 3](http://www.w3.org/TR/css-text-3/)

- [hyphens](http://www.w3.org/TR/css-text-3/#hyphens)
  - Allowed prefixes: epub, moz, ms, webkit
  - Depends on browser's capability: Yes
- [letter-spacing](http://www.w3.org/TR/css-text-3/#letter-spacing)
  - Depends on browser's capability: Yes
- [line-break](http://www.w3.org/TR/css-text-3/#line-break0)
  - Depends on browser's capability: Yes
  - Allowed prefixes: ms, webkit
  - Values: `auto | loose | normal | strict;`
- [overflow-wrap](http://www.w3.org/TR/css-text-3/#overflow-wrap)
  - Depends on browser's capability: Yes
  - Note: While the spec states that `word-wrap` must be treated as if it were a shorthand of `overflow-wrap`, Vivliostyle treat them for now as different properties and might result in an incorrect cascading behavior when inconsistent values are specified for both of the properties.
- [tab-size](http://www.w3.org/TR/css-text-3/#tab-size)
  - Allowed prefixes: moz
  - Depends on browser's capability: Yes
- [text-align-last](http://www.w3.org/TR/css-text-3/#text-align-last)
  - Allowed prefixes: moz, ms
  - Depends on browser's capability: Yes
  - Note: While `text-align` property is a shorthand in CSS Text 3, Vivliostyle treats `text-align` for now as an independent property (defined in CSS 2.1) rather than a shorthand.
- [text-justify](https://drafts.csswg.org/css-text-3/#propdef-text-justify)
  - Allowed prefixes: ms
  - Depends on browser's capability: Yes
  - Note: `inter-ideograph` value as well as values defined in the current editor's draft is supported since we use it in UA stylesheet to emulate text-justify: auto behavior defined in the spec on IE.
- [white-space](http://www.w3.org/TR/css-text-3/#white-space)
  - Depends on browser's capability: Yes
- [word-break](http://www.w3.org/TR/css-text-3/#word-break)
  - Allowed prefixes: ms
  - Depends on browser's capability: Yes
- [word-wrap](http://www.w3.org/TR/css-text-3/#word-wrap)
  - Allowed prefixes: ms
  - Depends on browser's capability: Yes
  - Note: While the spec states that `word-wrap` must be treated as if it were a shorthand of `overflow-wrap`, Vivliostyle treat them for now as different properties and might result in an incorrect cascading behavior when inconsistent values are specified for both of the properties.

### [CSS Text Decoration 3](http://www.w3.org/TR/css-text-decor-3/)

- Note: While `text-decoration` property is a shorthand in CSS Text Decoration 3, Vivliostyle treats `text-decoration` for now as an independent property defined in CSS Level 2.1.
- [text-decoration-color](http://www.w3.org/TR/css-text-decor-3/#text-decoration-color)
  - Allowed prefixes: webkit
  - Depends on browser's capability: Yes
- [text-decoration-line](http://www.w3.org/TR/css-text-decor-3/#text-decoration-line)
  - Allowed prefixes: webkit
  - Depends on browser's capability: Yes
- [text-decoration-skip](http://www.w3.org/TR/css-text-decor-3/#text-decoration-skip)
  - Allowed prefixes: webkit
  - Depends on browser's capability: Yes
- [text-decoration-style](http://www.w3.org/TR/css-text-decor-3/#text-decoration-style)
  - Allowed prefixes: webkit
  - Depends on browser's capability: Yes
- [text-emphasis](http://www.w3.org/TR/css-text-decor-3/#text-emphasis)
  - Allowed prefixes: epub, webkit
  - Depends on browser's capability: Yes
- [text-emphasis-color](http://www.w3.org/TR/css-text-decor-3/#text-emphasis-color)
  - Allowed prefixes: epub, webkit
  - Depends on browser's capability: Yes
- [text-emphasis-position](http://www.w3.org/TR/css-text-decor-3/#text-emphasis-position)
  - Allowed prefixes: webkit
  - Depends on browser's capability: Yes
- [text-emphasis-style](http://www.w3.org/TR/css-text-decor-3/#text-emphasis-style)
  - Allowed prefixes: epub, webkit
  - Depends on browser's capability: Yes
- [text-shadow](http://www.w3.org/TR/css-text-decor-3/#text-shadow)
  - Depends on browser's capability: Yes
- [text-underline-position](http://www.w3.org/TR/css-text-decor-3/#text-underline-position)
  - Depends on browser's capability: Yes
  - Allowed prefixes: ms, webkit

### [CSS Multi-column Layout 1](http://www.w3.org/TR/css3-multicol/)

- [break-after](http://www.w3.org/TR/css3-multicol/#break-after)
  - Depends on browser's capability: No
  - Note: behavior when multiple forced break values coincide at a single break point is not compliant to the spec. [[Issue]](https://github.com/vivliostyle/vivliostyle.js/issues/129)
- [break-before](http://www.w3.org/TR/css3-multicol/#break-before)
  - Depends on browser's capability: No
  - Note: behavior when multiple forced break values coincide at a single break point is not compliant to the spec. [[Issue]](https://github.com/vivliostyle/vivliostyle.js/issues/129)
- [break-inside](http://www.w3.org/TR/css3-multicol/#break-inside)
  - Depends on browser's capability: No
  - Note: All of `avoid-page`, `avoid-column` and `avoid-region` values are treated as if they were `avoid`. [[Issue]](https://github.com/vivliostyle/vivliostyle.js/issues/128)
- [column-count](http://www.w3.org/TR/css3-multicol/#column-count)
  - Allowed prefixes: moz, webkit
  - Depends on browser's capability: No
- [column-gap](http://www.w3.org/TR/css3-multicol/#column-gap0)
  - Allowed prefixes: moz, webkit
  - Depends on browser's capability: No
- [column-rule](http://www.w3.org/TR/css3-multicol/#column-rule0)
  - Allowed prefixes: moz, webkit
  - Depends on browser's capability: No
- [column-rule-color](http://www.w3.org/TR/css3-multicol/#column-rule-color)
  - Allowed prefixes: moz, webkit
  - Depends on browser's capability: No
- [column-rule-style](http://www.w3.org/TR/css3-multicol/#column-rule-style)
  - Allowed prefixes: moz, webkit
  - Depends on browser's capability: No
- [column-rule-width](http://www.w3.org/TR/css3-multicol/#column-rule-width)
  - Allowed prefixes: moz, webkit
  - Depends on browser's capability: No
- [column-width](http://www.w3.org/TR/css3-multicol/#column-width)
  - Allowed prefixes: moz, webkit
  - Depends on browser's capability: No
- [columns](http://www.w3.org/TR/css3-multicol/#columns0)
  - Allowed prefixes: moz, webkit
  - Depends on browser's capability: No

### [CSS Basic User Interface 3](http://www.w3.org/TR/css3-ui/)

- [box-sizing](http://www.w3.org/TR/css3-ui/#propdef-box-sizing)
  - Depends on browser's capability: Yes
- [outline](http://www.w3.org/TR/css3-ui/#propdef-outline)
  - Depends on browser's capability: Yes
- [outline-color](http://www.w3.org/TR/css3-ui/#propdef-outline-color)
  - Depends on browser's capability: Yes
- [outline-style](http://www.w3.org/TR/css3-ui/#propdef-outline-style)
  - Depends on browser's capability: Yes
- [outline-width](http://www.w3.org/TR/css3-ui/#propdef-outline-width)
  - Depends on browser's capability: Yes
- [text-overflow](http://www.w3.org/TR/css3-ui/#propdef-text-overflow)
  - Allowed prefixes: ms
  - Depends on browser's capability: Yes

### [CSS Writing Modes 3](http://www.w3.org/TR/css-writing-modes-3/)

- [direction](http://www.w3.org/TR/css-writing-modes-3/#propdef-direction)
  - Depends on browser's capability: Yes
- [text-combine-upright](http://www.w3.org/TR/css-writing-modes-3/#propdef-text-combine-upright)
  - Depends on browser's capability: Yes
- [text-combine-horizontal](http://www.w3.org/TR/2012/WD-css3-writing-modes-20121115/#text-combine-horizontal0)
  - This deprecated property is kept for compatibility.
  - Allowed prefixes: epub, ms
  - Depends on browser's capability: Yes
- [text-combine](http://www.w3.org/TR/2011/WD-css3-writing-modes-20110531/#text-combine0)
  - This deprecated property is kept for compatibility.
  - Allowed prefixes: webkit
  - Depends on browser's capability: Yes
- [text-orientation](http://www.w3.org/TR/css-writing-modes-3/#propdef-text-orientation)
  - Allowed prefixes: epub, webkit
  - Depends on browser's capability: Yes
  - Note: supported values are [those defined in 20 March 2014 Candidate Recommendation](https://www.w3.org/TR/2014/CR-css-writing-modes-3-20140320/#propdef-text-orientation), not those in the latest spec.
- [writing-mode](http://www.w3.org/TR/css-writing-modes-3/#propdef-writing-mode)
  - Allowed prefixes: epub, webkit
  - Depends on browser's capability: Yes
  - Note: supported values are [those defined in 20 March 2014 Candidate Recommendation](https://www.w3.org/TR/2014/CR-css-writing-modes-3-20140320/#propdef-writing-mode), not those in the latest spec.

### [CSS Flexible Box Layout 1](http://www.w3.org/TR/css-flexbox-1/)

- [align-content](http://www.w3.org/TR/css-flexbox-1/#propdef-align-content)
  - Depends on browser's capability: Yes
- [align-items](http://www.w3.org/TR/css-flexbox-1/#propdef-align-items)
  - Depends on browser's capability: Yes
- [align-self](http://www.w3.org/TR/css-flexbox-1/#propdef-align-self)
  - Depends on browser's capability: Yes
- [display](https://www.w3.org/TR/css-flexbox-1/#flex-containers)
  - Depends on browser's capability: Yes
  - Supports [`flex` and `inline-flex` values](https://www.w3.org/TR/css-flexbox-1/#flex-containers)
- [flex](http://www.w3.org/TR/css-flexbox-1/#propdef-flex)
  - Depends on browser's capability: Yes
- [flex-basis](http://www.w3.org/TR/css-flexbox-1/#propdef-flex-basis)
  - Depends on browser's capability: Yes
- [flex-direction](http://www.w3.org/TR/css-flexbox-1/#propdef-flex-direction)
  - Depends on browser's capability: Yes
- [flex-flow](http://www.w3.org/TR/css-flexbox-1/#propdef-flex-flow)
  - Depends on browser's capability: Yes
- [flex-grow](http://www.w3.org/TR/css-flexbox-1/#propdef-flex-grow)
  - Depends on browser's capability: Yes
- [flex-shrink](http://www.w3.org/TR/css-flexbox-1/#propdef-flex-shrink)
  - Depends on browser's capability: Yes
- [flex-wrap](http://www.w3.org/TR/css-flexbox-1/#propdef-flex-wrap)
  - Depends on browser's capability: Yes
- [justify-content](http://www.w3.org/TR/css-flexbox-1/#propdef-justify-content)
  - Depends on browser's capability: Yes
- [order](http://www.w3.org/TR/css-flexbox-1/#propdef-order)
  - Depends on browser's capability: Yes

### [CSS Fragmentation 3](http://www.w3.org/TR/css3-break/)

- [break-after](http://www.w3.org/TR/css3-break/#break-after)
  - Depends on browser's capability: No
  - Note: behavior when multiple forced break values coincide at a single break point is not compliant to the spec. [[Issue]](https://github.com/vivliostyle/vivliostyle.js/issues/129)
- [break-before](http://www.w3.org/TR/css3-break/#break-before)
  - Depends on browser's capability: No
  - Note: behavior when multiple forced break values coincide at a single break point is not compliant to the spec. [[Issue]](https://github.com/vivliostyle/vivliostyle.js/issues/129)
- [break-inside](http://www.w3.org/TR/css3-break/#break-inside)
  - Depends on browser's capability: No
  - Note: All of `avoid-page`, `avoid-column` and `avoid-region` values are treated as if they were `avoid`. [[Issue]](https://github.com/vivliostyle/vivliostyle.js/issues/128)
- [orphans](http://www.w3.org/TR/css3-break/#orphans)
  - Depends on browser's capability: No
- [widows](http://www.w3.org/TR/css3-break/#widows)
  - Depends on browser's capability: No

### [CSS Transforms 1](http://www.w3.org/TR/css-transforms-1/)

- [backface-visibility](http://www.w3.org/TR/css-transforms-1/#propdef-backface-visibility)
  - Allowed prefixes: ms, webkit
  - Depends on browser's capability: Yes
- [transform](http://www.w3.org/TR/css-transforms-1/#propdef-transform)
  - Allowed prefixes: epub, ms
  - Depends on browser's capability: Yes
- [transform-origin](http://www.w3.org/TR/css-transforms-1/#propdef-transform-origin)
  - Allowed prefixes: epub, ms
  - Depends on browser's capability: Yes

### [CSS Ruby Layout 1](http://www.w3.org/TR/css-ruby-1/)

- [ruby-align](http://www.w3.org/TR/css-ruby-1/#propdef-ruby-align)
  - Depends on browser's capability: Yes
- [ruby-position](https://drafts.csswg.org/css-ruby-1/#propdef-ruby-position)
  - Depends on browser's capability: Yes
  - Supports syntax defined in the current editor's draft.

### [CSS Mobile Text Size Adjustment 1](https://drafts.csswg.org/css-size-adjust-1/)

- [text-size-adjust](https://drafts.csswg.org/css-size-adjust-1/#text-size-adjust)
  - Allowed prefixes: moz, ms
  - Depends on browser's capability: Yes

### [Pointer Events](http://www.w3.org/TR/pointerevents/)

- [touch-action](http://www.w3.org/TR/pointerevents/#the-touch-action-css-property)
  - Allowed prefixes: ms
  - Depends on browser's capability: Yes

## [EPUB Adaptive Layout](http://www.idpf.org/epub/pgt/)

Note: This spec is not on a W3C standards track. Future version of Vivliostyle may drop support for this spec.

### At-rules

- [@-epubx-define](http://www.idpf.org/epub/pgt/#rule-define)
  - Depends on browser's capability: No
- [@-epubx-flow](http://www.idpf.org/epub/pgt/#rule-flow)
  - Depends on browser's capability: No
- [@-epubx-page-master](http://www.idpf.org/epub/pgt/#rule-page-master)
  - Depends on browser's capability: No
- [@-epubx-page-template](http://www.idpf.org/epub/pgt/#rule-page-template)
  - Depends on browser's capability: No
- [@-epubx-partition](http://www.idpf.org/epub/pgt/#rule-partition)
  - Depends on browser's capability: No
- [@-epubx-partition-group](http://www.idpf.org/epub/pgt/#rule-partition-group)
  - Depends on browser's capability: No
- [@-epubx-region](http://www.idpf.org/epub/pgt/#rule-region)
  - Depends on browser's capability: No
- [@-epubx-viewport](http://www.idpf.org/epub/pgt/#rule-viewport)
  - Depends on browser's capability: No
- [@-epubx-when](http://www.idpf.org/epub/pgt/#rule-when)
  - Depends on browser's capability: No

### Properties

- [-epubx-conflicting-partitions](http://www.idpf.org/epub/pgt/#prop-conflicting-partitions)
  - Depends on browser's capability: No
- [-epubx-enabled](http://www.idpf.org/epub/pgt/#prop-enabled)
  - Depends on browser's capability: No
- [-epubx-flow-consume](http://www.idpf.org/epub/pgt/#prop-flow-consume)
  - Depends on browser's capability: No
- [-epubx-flow-from](http://www.idpf.org/epub/pgt/#prop-flow-from)
  - Depends on browser's capability: No
  - Only effective when specified to EPUB Adaptive Layout partitions.
- [-epubx-flow-into](http://www.idpf.org/epub/pgt/#prop-flow-into)
  - Depends on browser's capability: No
- [-epubx-flow-linger](http://www.idpf.org/epub/pgt/#prop-flow-linger)
  - Depends on browser's capability: No
- [-epubx-flow-options](http://www.idpf.org/epub/pgt/#prop-flow-options)
  - Depends on browser's capability: No
- [-epubx-flow-priority](http://www.idpf.org/epub/pgt/#prop-flow-priority)
  - Depends on browser's capability: No
- [-epubx-min-page-height](http://www.idpf.org/epub/pgt/#prop-min-page-height)
  - Depends on browser's capability: No
- [-epubx-min-page-width](http://www.idpf.org/epub/pgt/#prop-min-page-width)
  - Depends on browser's capability: No
- [-epubx-required](http://www.idpf.org/epub/pgt/#prop-required)
  - Depends on browser's capability: No
- [-epubx-required-partitions](http://www.idpf.org/epub/pgt/#prop-required-partitions)
  - Depends on browser's capability: No
- [-epubx-shape-outside](http://www.idpf.org/epub/pgt/#prop-shape-outside)
  - Depends on browser's capability: No
  - Only effective when specified to EPUB Adaptive Layout partitions.
  - Note: only [old syntaxes from 3 May 2012 Working Draft](http://www.w3.org/TR/2012/WD-css3-exclusions-20120503/#supported-svg-shapes) are supported.
- [-epubx-shape-inside](http://www.idpf.org/epub/pgt/#prop-shape-inside)
  - Depends on browser's capability: No
  - Only effective when specified to EPUB Adaptive Layout partitions.
  - Note: only [old syntaxes from 3 May 2012 Working Draft](http://www.w3.org/TR/2012/WD-css3-exclusions-20120503/#supported-svg-shapes) are supported.
- [-epubx-snap-height](http://www.idpf.org/epub/pgt/#prop-snap-height)
  - Depends on browser's capability: No
- [-epubx-snap-width](http://www.idpf.org/epub/pgt/#prop-snap-width)
  - Depends on browser's capability: No
- [-epubx-text-zoom](http://www.idpf.org/epub/pgt/#prop-text-zoom)
  - Depends on browser's capability: No
- [-epubx-utilization](http://www.idpf.org/epub/pgt/#prop-utilization)
  - Depends on browser's capability: No
- [-epubx-wrap-flow](http://www.idpf.org/epub/pgt/#prop-wrap-flow)
  - Depends on browser's capability: No
  - Only effective when specified to EPUB Adaptive Layout partitions.
