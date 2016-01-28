# Features supported by Vivliostyle

The Vivliostyle uses a two-layer architecture, with some of its functionality implemented purely in javascript, and some being delegated all or in part to the browser engine on top of which Vivliostyle is running. In the following list <quote>Supported in all browsers</quote> indicates that features implemented in Javascript that will work regardless of the browser engine. Other features' availability and behavior do vary based on what is supported by the underlying browser engine. Vivliostyle Formatter uses Chromium 47.0.2526.80's engine.

Properties where <quote>Allowed prefixes</quote> is indicated may be used with any of the listed prefixes, or preferably without a prefix, regardless of the underlying browser engine. If Vivliostyle needs to invoke the browser engine, it will internally convert to the appropriate syntax.

## Values

- [Supported CSS-wide keywords](http://www.w3.org/TR/css-values/#common-keywords): `inherit`
  - Supported in all browsers
  - `initial` and `unset` are *not* supported.
- [Supported length units](http://www.w3.org/TR/css-values/#lengths): `em`, `ex`, `ch`, `rem`, `cm`, `mm`, `q`, `in`, `pc`, `pt`, `px`.
  - Supported in all browsers
- Supported color values
  - Support depends on browser capabilities
  - [Basic color keywords](http://www.w3.org/TR/css3-color/#html4)
  - [RGB color values](http://www.w3.org/TR/css3-color/#rgb-color), [RGBA color values](http://www.w3.org/TR/css3-color/#rgba-color)
  - [‘transparent’ color keyword](http://www.w3.org/TR/css3-color/#transparent)
  - [HSL color values](http://www.w3.org/TR/css3-color/#hsl-color), [HSLA color values](http://www.w3.org/TR/css3-color/#hsla-color)
  - [Extended color keywords](http://www.w3.org/TR/css3-color/#svg-color)
  - [‘currentColor’ color keyword](http://www.w3.org/TR/css3-color/#currentcolor)

## Selectors

### [CSS 2](http://www.w3.org/TR/CSS2/)

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
- [Attribute selectors with namespaces `[ns|att]`, `[|att]`, `[ns|att=val]`, `[|att=val]`, `[ns|att~=val]`, `[|att~=val]`, `[ns|att|=val]`, `[|att|=val]`](https://www.w3.org/TR/css3-selectors/#attrnmsp)
  - Supported in all browsers
- [`:root` pseudo-class](https://www.w3.org/TR/css3-selectors/#root-pseudo)
  - Supported in all browsers
- [`:nth-child()` pseudo-class](https://www.w3.org/TR/css3-selectors/#nth-child-pseudo)
  - Supported in all browsers
  - Note: only a single integer or "even"/"odd" arguments are accepted for now. [[Issue]](https://github.com/vivliostyle/vivliostyle.js/issues/163)
- [`:first-child` pseudo-class](https://www.w3.org/TR/css3-selectors/#first-child-pseudo)
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
  - Supported in all browsers
- [@import](http://www.w3.org/TR/CSS2/cascade.html#at-import)
  - [Also in CSS Cascading and Inheritance 3](http://www.w3.org/TR/css-cascade-3/#at-import)
  - Supported in all browsers

### [CSS Namespaces 3](http://www.w3.org/TR/css3-namespace/)

- [@namespace](http://www.w3.org/TR/css3-namespace/#declaration)
  - Supported in all browsers

### [CSS Conditional Rules 3](http://www.w3.org/TR/css3-conditional/)

- [@media](http://www.w3.org/TR/css3-conditional/#atmedia-rule)
  - Supported in all browsers

### [CSS Paged Media 3](https://drafts.csswg.org/css-page-3/)

- [@page](https://drafts.csswg.org/css-page/#at-page-rule)
  - Supported in all browsers
- [Page-margin boxes (@top-left-corner, @top-left, @top-center, @top-right, @top-right-corner, @left-top, @left-middle, @left-bottom, @right-top, @right-middle, @right-bottom, @bottom-left-corner, @bottom-left, @bottom-center, @bottom-right, @bottom-right-coner)](https://drafts.csswg.org/css-page/#margin-at-rules)
  - Supported in all browsers

### [CSS Fonts 3](http://www.w3.org/TR/css-fonts-3/)

- [@font-face](http://www.w3.org/TR/css-fonts-3/#font-face-rule)
  - Support depends on browser capabilities
  - Note: `font-stretch`, `unicode-range` and `font-feature-settings` descriptors are currently ignored.

## Media queries

- Vivliostyle uses styles specified for [`print` media](http://www.w3.org/TR/CSS2/media.html#media-types) (as well as `all`).
  - Supported in all browsers
- Supported media features
  - [`(min-|max-)width`](http://www.w3.org/TR/css3-mediaqueries/#width)
      - Supported in all browsers
  - [`(min-|max-)height`](http://www.w3.org/TR/css3-mediaqueries/#height)
      - Supported in all browsers
  - [`(min-|max-)device-width`](http://www.w3.org/TR/css3-mediaqueries/#device-width)
      - Supported in all browsers
  - [`(min-|max-)device-height`](http://www.w3.org/TR/css3-mediaqueries/#device-height)
      - Supported in all browsers
  - [`(min-|max-)color`](http://www.w3.org/TR/css3-mediaqueries/#color)
      - Supported in all browsers

## Properties

### [CSS 2](http://www.w3.org/TR/CSS2/)

- [background](http://www.w3.org/TR/CSS2/colors.html#propdef-background)
  - Supports [CSS Backgrounds 3 syntax](http://www.w3.org/TR/css3-background/#background)
  - Support depends on browser capabilities
- [background-attachment](http://www.w3.org/TR/CSS2/colors.html#propdef-background-attachment)
  - Supports [CSS Backgrounds 3 syntax](http://www.w3.org/TR/css3-background/#background-attachment)
  - Support depends on browser capabilities
  - Note: behavior when used within `@page` rules is not compliant to the spec. [[Issue]](https://github.com/vivliostyle/vivliostyle.js/issues/22)
- [background-color](http://www.w3.org/TR/CSS2/colors.html#propdef-background-color)
  - Supports [CSS Backgrounds 3 syntax](http://www.w3.org/TR/css3-background/#background-color)
  - Support depends on browser capabilities
- [background-image](http://www.w3.org/TR/CSS2/colors.html#propdef-background-image)
  - Supports [CSS Backgrounds 3 syntax](http://www.w3.org/TR/css3-background/#background-image)
  - Support depends on browser capabilities
  - Note: behavior when used within `@page` rules is not compliant to the spec. [[Issue]](https://github.com/vivliostyle/vivliostyle.js/issues/22)
- [background-position](http://www.w3.org/TR/CSS2/colors.html#propdef-background-position)
  - Supports [CSS Backgrounds 3 syntax](http://www.w3.org/TR/css3-background/#background-position)
  - Support depends on browser capabilities
  - Note: behavior when used within `@page` rules is not compliant to the spec. [[Issue]](https://github.com/vivliostyle/vivliostyle.js/issues/22)
- [background-repeat](http://www.w3.org/TR/CSS2/colors.html#propdef-background-repeat)
  - Supports [CSS Backgrounds 3 syntax](http://www.w3.org/TR/css3-background/#background-repeat)
  - Support depends on browser capabilities
  - Note: behavior when used within `@page` rules is not compliant to the spec. [[Issue]](https://github.com/vivliostyle/vivliostyle.js/issues/22)
- [border](http://www.w3.org/TR/CSS2/box.html#propdef-border)
  - Support depends on browser capabilities
- [border-bottom](http://www.w3.org/TR/CSS2/box.html#propdef-border-bottom)
  - Support depends on browser capabilities
- [border-bottom-color](http://www.w3.org/TR/CSS2/box.html#propdef-border-bottom-color)
  - Support depends on browser capabilities
- [border-bottom-style](http://www.w3.org/TR/CSS2/box.html#propdef-border-bottom-style)
  - Support depends on browser capabilities
- [border-bottom-width](http://www.w3.org/TR/CSS2/box.html#propdef-border-bottom-width)
  - Support depends on browser capabilities
- [border-collapse](http://www.w3.org/TR/CSS2/tables.html#propdef-border-collapse)
  - Support depends on browser capabilities
- [border-color](http://www.w3.org/TR/CSS2/box.html#propdef-border-color)
  - Support depends on browser capabilities
- [border-left](http://www.w3.org/TR/CSS2/box.html#propdef-border-left)
  - Support depends on browser capabilities
- [border-left-color](http://www.w3.org/TR/CSS2/box.html#propdef-border-left-color)
  - Support depends on browser capabilities
- [border-left-style](http://www.w3.org/TR/CSS2/box.html#propdef-border-left-style)
  - Support depends on browser capabilities
- [border-left-width](http://www.w3.org/TR/CSS2/box.html#propdef-border-left-width)
  - Support depends on browser capabilities
- [border-right](http://www.w3.org/TR/CSS2/box.html#propdef-border-right)
  - Support depends on browser capabilities
- [border-right-color](http://www.w3.org/TR/CSS2/box.html#propdef-border-right-color)
  - Support depends on browser capabilities
- [border-right-style](http://www.w3.org/TR/CSS2/box.html#propdef-border-right-style)
  - Support depends on browser capabilities
- [border-right-width](http://www.w3.org/TR/CSS2/box.html#propdef-border-right-width)
  - Support depends on browser capabilities
- [border-spacing](http://www.w3.org/TR/CSS2/tables.html#propdef-border-spacing)
  - Support depends on browser capabilities
- [border-style](http://www.w3.org/TR/CSS2/box.html#propdef-border-style)
  - Support depends on browser capabilities
- [border-top](http://www.w3.org/TR/CSS2/box.html#propdef-border-top)
  - Support depends on browser capabilities
- [border-top-color](http://www.w3.org/TR/CSS2/box.html#propdef-border-top-color)
  - Support depends on browser capabilities
- [border-top-style](http://www.w3.org/TR/CSS2/box.html#propdef-border-top-style)
  - Support depends on browser capabilities
- [border-top-width](http://www.w3.org/TR/CSS2/box.html#propdef-border-top-width)
  - Support depends on browser capabilities
- [border-width](http://www.w3.org/TR/CSS2/box.html#propdef-border-width)
  - Support depends on browser capabilities
- [bottom](http://www.w3.org/TR/CSS2/visuren.html#propdef-bottom)
  - Support depends on browser capabilities
- [caption-side](http://www.w3.org/TR/CSS2/tables.html#propdef-caption-side)
  - Support depends on browser capabilities
- [clear](http://www.w3.org/TR/CSS2/visuren.html#propdef-clear)
  - Supported in all browsers
- [clip](http://www.w3.org/TR/CSS2/visufx.html#propdef-clip)
  - Support depends on browser capabilities
- [color](http://www.w3.org/TR/CSS2/colors.html#propdef-color)
  - Support depends on browser capabilities
- [content](http://www.w3.org/TR/CSS2/generate.html#propdef-content)
  - Supported in all browsers
- [counter-increment](http://www.w3.org/TR/CSS2/generate.html#propdef-counter-increment)
  - Supported in all browsers
- [counter-reset](http://www.w3.org/TR/CSS2/generate.html#propdef-counter-reset)
  - Supported in all browsers
- [cursor](http://www.w3.org/TR/CSS2/ui.html#propdef-cursor)
  - Support depends on browser capabilities
- [direction](http://www.w3.org/TR/CSS2/visuren.html#propdef-direction)
  - Support depends on browser capabilities
- [display](http://www.w3.org/TR/CSS2/visuren.html#propdef-display)
  - Support depends on browser capabilities
  - Supports [`flex`, `inline-flex`](https://www.w3.org/TR/css-flexbox-1/#flex-containers), [`ruby`, `ruby-base`, `ruby-text`, `ruby-base-container` and `ruby-text-container`](https://www.w3.org/TR/css-ruby-1/#propdef-display) values.
- [empty-cells](http://www.w3.org/TR/CSS2/tables.html#propdef-empty-cells)
  - Support depends on browser capabilities
- [float](http://www.w3.org/TR/CSS2/visuren.html#propdef-float)
  - Supported in all browsers
- [font](http://www.w3.org/TR/CSS2/fonts.html#propdef-font)
  - Support depends on browser capabilities
- [font-family](http://www.w3.org/TR/CSS2/fonts.html#propdef-font-family)
  - Support depends on browser capabilities
- [font-size](http://www.w3.org/TR/CSS2/fonts.html#propdef-font-size)
  - Support depends on browser capabilities
- [font-style](http://www.w3.org/TR/CSS2/fonts.html#propdef-font-style)
  - Support depends on browser capabilities
- [font-variant](http://www.w3.org/TR/CSS2/fonts.html#propdef-font-variant)
  - Support depends on browser capabilities
- [font-weight](http://www.w3.org/TR/CSS2/fonts.html#propdef-font-weight)
  - Support depends on browser capabilities
- [height](http://www.w3.org/TR/CSS2/visudet.html#propdef-height)
  - Support depends on browser capabilities
- [left](http://www.w3.org/TR/CSS2/visuren.html#propdef-left)
  - Support depends on browser capabilities
- [letter-spacing](http://www.w3.org/TR/CSS2/text.html#propdef-letter-spacing)
  - Support depends on browser capabilities
- [line-height](http://www.w3.org/TR/CSS2/visudet.html#propdef-line-height)
  - Support depends on browser capabilities
- [list-style](http://www.w3.org/TR/CSS2/generate.html#propdef-list-style)
  - Support depends on browser capabilities
- [list-style-image](http://www.w3.org/TR/CSS2/generate.html#propdef-list-style-image)
  - Support depends on browser capabilities
- [list-style-position](http://www.w3.org/TR/CSS2/generate.html#propdef-list-style-position)
  - Support depends on browser capabilities
- [list-style-type](http://www.w3.org/TR/CSS2/generate.html#propdef-list-style-type)
  - Support depends on browser capabilities
- [margin](http://www.w3.org/TR/CSS2/box.html#propdef-margin)
  - Support depends on browser capabilities
- [margin-bottom](http://www.w3.org/TR/CSS2/box.html#propdef-margin-bottom)
  - Support depends on browser capabilities
- [margin-left](http://www.w3.org/TR/CSS2/box.html#propdef-margin-left)
  - Support depends on browser capabilities
- [margin-right](http://www.w3.org/TR/CSS2/box.html#propdef-margin-right)
  - Support depends on browser capabilities
- [margin-top](http://www.w3.org/TR/CSS2/box.html#propdef-margin-top)
  - Support depends on browser capabilities
- [max-height](http://www.w3.org/TR/CSS2/visudet.html#propdef-max-height)
  - Support depends on browser capabilities
- [max-width](http://www.w3.org/TR/CSS2/visudet.html#propdef-max-width)
  - Support depends on browser capabilities
- [min-height](http://www.w3.org/TR/CSS2/visudet.html#propdef-min-height)
  - Support depends on browser capabilities
- [min-width](http://www.w3.org/TR/CSS2/visudet.html#propdef-min-width)
  - Support depends on browser capabilities
- [orphans](http://www.w3.org/TR/CSS2/page.html#propdef-orphans)
  - Supported in all browsers
- [outline](http://www.w3.org/TR/CSS2/ui.html#propdef-outline)
  - Support depends on browser capabilities
- [outline-color](http://www.w3.org/TR/CSS2/ui.html#propdef-outline-color)
  - Support depends on browser capabilities
- [outline-style](http://www.w3.org/TR/CSS2/ui.html#propdef-outline-style)
  - Support depends on browser capabilities
- [outline-width](http://www.w3.org/TR/CSS2/ui.html#propdef-outline-width)
  - Support depends on browser capabilities
- [overflow](http://www.w3.org/TR/CSS2/visufx.html#propdef-overflow)
  - Support depends on browser capabilities
- [padding](http://www.w3.org/TR/CSS2/box.html#propdef-padding)
  - Support depends on browser capabilities
- [padding-bottom](http://www.w3.org/TR/CSS2/box.html#propdef-padding-bottom)
  - Support depends on browser capabilities
- [padding-left](http://www.w3.org/TR/CSS2/box.html#propdef-padding-left)
  - Support depends on browser capabilities
- [padding-right](http://www.w3.org/TR/CSS2/box.html#propdef-padding-right)
  - Support depends on browser capabilities
- [padding-top](http://www.w3.org/TR/CSS2/box.html#propdef-padding-top)
  - Support depends on browser capabilities
- [page-break-after](http://www.w3.org/TR/CSS2/page.html#propdef-page-break-after)
  - Supported in all browsers
- [page-break-before](http://www.w3.org/TR/CSS2/page.html#propdef-page-break-before)
  - Supported in all browsers
- [page-break-inside](http://www.w3.org/TR/CSS2/page.html#propdef-page-break-inside)
  - Supported in all browsers
- [position](http://www.w3.org/TR/CSS2/visuren.html#propdef-position)
  - Support depends on browser capabilities
- [quotes](http://www.w3.org/TR/CSS2/generate.html#propdef-quotes)
  - Supported in all browsers
  - Note: not supported within `@page` rules. [[Issue]](https://github.com/vivliostyle/vivliostyle.js/issues/43)
- [right](http://www.w3.org/TR/CSS2/visuren.html#propdef-right)
  - Support depends on browser capabilities
- [table-layout](http://www.w3.org/TR/CSS2/tables.html#propdef-table-layout)
  - Support depends on browser capabilities
- [text-align](http://www.w3.org/TR/CSS2/text.html#propdef-text-align)
  - Support depends on browser capabilities
- [text-decoration](http://www.w3.org/TR/CSS2/text.html#propdef-text-decoration)
  - Support depends on browser capabilities
- [text-indent](http://www.w3.org/TR/CSS2/text.html#propdef-text-indent)
  - Support depends on browser capabilities
- [text-transform](http://www.w3.org/TR/CSS2/text.html#propdef-text-transform)
  - Support depends on browser capabilities
- [top](http://www.w3.org/TR/CSS2/visuren.html#propdef-top)
  - Support depends on browser capabilities
- [unicode-bidi](http://www.w3.org/TR/CSS2/visuren.html#propdef-unicode-bidi)
  - Support depends on browser capabilities
  - Supports [new values (`isolate`, `isolate-override`, `plaintext`) in CSS Writing Modes 3](https://www.w3.org/TR/css-writing-modes-3/#propdef-unicode-bidi)
- [vertical-align](http://www.w3.org/TR/CSS2/visudet.html#propdef-vertical-align)
  - Support depends on browser capabilities
- [visibility](http://www.w3.org/TR/CSS2/visufx.html#propdef-visibility)
  - Support depends on browser capabilities
- [white-space](http://www.w3.org/TR/CSS2/text.html#propdef-white-space)
  - Support depends on browser capabilities
- [widows](http://www.w3.org/TR/CSS2/page.html#propdef-widows)
  - Supported in all browsers
- [width](http://www.w3.org/TR/CSS2/visudet.html#propdef-width)
  - Support depends on browser capabilities
- [word-spacing](http://www.w3.org/TR/CSS2/text.html#propdef-word-spacing)
  - Support depends on browser capabilities
- [z-index](http://www.w3.org/TR/CSS2/visuren.html#propdef-z-index)
  - Support depends on browser capabilities

### [CSS Paged Media 3](https://drafts.csswg.org/css-page-3/)

- [size](https://drafts.csswg.org/css-page-3/#descdef-page-size)
  - Supported in all browsers
  - Supports `JIS-B5` and `JIS-B4` values in the current editor's draft.

### [CSS Color 3](http://www.w3.org/TR/css3-color/)

- [color](http://www.w3.org/TR/css3-color/#color0)
  - Support depends on browser capabilities
- [opacity](http://www.w3.org/TR/css3-color/#opacity)
  - Support depends on browser capabilities

### [CSS Backgrounds and Borders 3](http://www.w3.org/TR/css3-background/)

- [background](http://www.w3.org/TR/css3-background/#background)
  - Support depends on browser capabilities
- [background-attachment](http://www.w3.org/TR/css3-background/#background-attachment)
  - Support depends on browser capabilities
  - Note: behavior when used within `@page` rules is not compliant to the spec. [[Issue]](https://github.com/vivliostyle/vivliostyle.js/issues/22)
- [background-clip](http://www.w3.org/TR/css3-background/#background-clip)
  - Allowed prefixes: webkit
  - Support depends on browser capabilities
  - Note: behavior when used within `@page` rules is not compliant to the spec. [[Issue]](https://github.com/vivliostyle/vivliostyle.js/issues/22)
- [background-color](http://www.w3.org/TR/css3-background/#background-color)
  - Support depends on browser capabilities
- [background-image](http://www.w3.org/TR/css3-background/#background-image)
  - Support depends on browser capabilities
  - Note: behavior when used within `@page` rules is not compliant to the spec. [[Issue]](https://github.com/vivliostyle/vivliostyle.js/issues/22)
- [background-origin](http://www.w3.org/TR/css3-background/#background-origin)
  - Allowed prefixes: webkit
  - Support depends on browser capabilities
  - Note: behavior when used within `@page` rules is not compliant to the spec. [[Issue]](https://github.com/vivliostyle/vivliostyle.js/issues/22)
- [background-position](http://www.w3.org/TR/css3-background/#background-position)
  - Support depends on browser capabilities
  - Note: behavior when used within `@page` rules is not compliant to the spec. [[Issue]](https://github.com/vivliostyle/vivliostyle.js/issues/22)
- [background-repeat](http://www.w3.org/TR/css3-background/#background-repeat)
  - Support depends on browser capabilities
  - Note: behavior when used within `@page` rules is not compliant to the spec. [[Issue]](https://github.com/vivliostyle/vivliostyle.js/issues/22)
- [background-size](http://www.w3.org/TR/css3-background/#background-size)
  - Allowed prefixes: webkit
  - Support depends on browser capabilities
  - Note: behavior when used within `@page` rules is not compliant to the spec. [[Issue]](https://github.com/vivliostyle/vivliostyle.js/issues/22)
- [border](http://www.w3.org/TR/css3-background/#border)
  - Support depends on browser capabilities
- [border-bottom](http://www.w3.org/TR/css3-background/#border-bottom)
  - Support depends on browser capabilities
- [border-bottom-color](http://www.w3.org/TR/css3-background/#border-bottom-color)
  - Support depends on browser capabilities
- [border-bottom-left-radius](http://www.w3.org/TR/css3-background/#border-bottom-left-radius)
  - Support depends on browser capabilities
- [border-bottom-right-radius](http://www.w3.org/TR/css3-background/#border-bottom-right-radius)
  - Support depends on browser capabilities
- [border-bottom-style](http://www.w3.org/TR/css3-background/#border-bottom-style)
  - Support depends on browser capabilities
- [border-bottom-width](http://www.w3.org/TR/css3-background/#border-bottom-width)
  - Support depends on browser capabilities
- [border-color](http://www.w3.org/TR/css3-background/#border-color)
  - Support depends on browser capabilities
- [border-image](http://www.w3.org/TR/css3-background/#border-image)
  - Support depends on browser capabilities
- [border-image-outset](http://www.w3.org/TR/css3-background/#border-image-outset)
  - Support depends on browser capabilities
- [border-image-repeat](http://www.w3.org/TR/css3-background/#border-image-repeat)
  - Support depends on browser capabilities
- [border-image-slice](http://www.w3.org/TR/css3-background/#border-image-slice)
  - Support depends on browser capabilities
- [border-image-source](http://www.w3.org/TR/css3-background/#border-image-source)
  - Support depends on browser capabilities
- [border-image-width](http://www.w3.org/TR/css3-background/#border-image-width)
  - Support depends on browser capabilities
- [border-left](http://www.w3.org/TR/css3-background/#border-left)
  - Support depends on browser capabilities
- [border-left-color](http://www.w3.org/TR/css3-background/#border-left-color)
  - Support depends on browser capabilities
- [border-left-style](http://www.w3.org/TR/css3-background/#border-left-style)
  - Support depends on browser capabilities
- [border-left-width](http://www.w3.org/TR/css3-background/#border-left-width)
  - Support depends on browser capabilities
- [border-radius](http://www.w3.org/TR/css3-background/#border-radius)
  - Support depends on browser capabilities
- [border-right](http://www.w3.org/TR/css3-background/#border-right)
  - Support depends on browser capabilities
- [border-right-color](http://www.w3.org/TR/css3-background/#border-right-color)
  - Support depends on browser capabilities
- [border-right-style](http://www.w3.org/TR/css3-background/#border-right-style)
  - Support depends on browser capabilities
- [border-right-width](http://www.w3.org/TR/css3-background/#border-right-width)
  - Support depends on browser capabilities
- [border-style](http://www.w3.org/TR/css3-background/#border-style)
  - Support depends on browser capabilities
- [border-top](http://www.w3.org/TR/css3-background/#border-top)
  - Support depends on browser capabilities
- [border-top-color](http://www.w3.org/TR/css3-background/#border-top-color)
  - Support depends on browser capabilities
- [border-top-left-radius](http://www.w3.org/TR/css3-background/#border-top-left-radius)
  - Support depends on browser capabilities
- [border-top-right-radius](http://www.w3.org/TR/css3-background/#border-top-right-radius)
  - Support depends on browser capabilities
- [border-top-style](http://www.w3.org/TR/css3-background/#border-top-style)
  - Support depends on browser capabilities
- [border-top-width](http://www.w3.org/TR/css3-background/#border-top-width)
  - Support depends on browser capabilities
- [border-width](http://www.w3.org/TR/css3-background/#border-width)
  - Support depends on browser capabilities
- [box-shadow](http://www.w3.org/TR/css3-background/#box-shadow)
  - Allowed prefixes: webkit
  - Support depends on browser capabilities

### [CSS Image Values and Replaced Content 3](http://www.w3.org/TR/css3-images/)

- [object-fit](http://www.w3.org/TR/css3-images/#object-fit)
  - Support depends on browser capabilities
- [object-position](http://www.w3.org/TR/css3-images/#object-position)
  - Support depends on browser capabilities

### [CSS Fonts 3](http://www.w3.org/TR/css-fonts-3/)

- [font-family](http://www.w3.org/TR/css-fonts-3/#propdef-font-family)
  - Support depends on browser capabilities
- [font-kerning](http://www.w3.org/TR/css-fonts-3/#propdef-font-kerning)
  - Allowed prefixes: webkit
  - Support depends on browser capabilities
- [font-size](http://www.w3.org/TR/css-fonts-3/#propdef-font-size)
  - Support depends on browser capabilities
- [font-style](http://www.w3.org/TR/css-fonts-3/#propdef-font-style)
  - Support depends on browser capabilities
- [font-variant-east-asian](http://www.w3.org/TR/css-fonts-3/#propdef-font-variant-east-asian)
  - Support depends on browser capabilities
- [font-weight](http://www.w3.org/TR/css-fonts-3/#propdef-font-weight)
  - Support depends on browser capabilities

### [CSS Text 3](http://www.w3.org/TR/css-text-3/)

- [hyphens](http://www.w3.org/TR/css-text-3/#hyphens)
  - Allowed prefixes: epub, moz, ms, webkit
  - Support depends on browser capabilities
- [letter-spacing](http://www.w3.org/TR/css-text-3/#letter-spacing)
  - Support depends on browser capabilities
- [line-break](http://www.w3.org/TR/css-text-3/#line-break0)
  - Support depends on browser capabilities
  - Allowed prefixes: ms, webkit
  - Values: `auto | loose | normal | strict;`
- [overflow-wrap](http://www.w3.org/TR/css-text-3/#overflow-wrap)
  - Support depends on browser capabilities
  - Note: While the spec states that `word-wrap` must be treated as if it were a shorthand of `overflow-wrap`, Vivliostyle treat them for now as different properties and might result in an incorrect cascading behavior when inconsistent values are specified for both of the properties.
- [tab-size](http://www.w3.org/TR/css-text-3/#tab-size)
  - Allowed prefixes: moz
  - Support depends on browser capabilities
- [text-align-last](http://www.w3.org/TR/css-text-3/#text-align-last)
  - Allowed prefixes: moz, ms
  - Support depends on browser capabilities
  - Note: While `text-align` property is a shorthand in CSS Text 3, Vivliostyle treats `text-align` for now as an independent property (defined in CSS 2.1) rather than a shorthand.
- [text-justify](https://drafts.csswg.org/css-text-3/#propdef-text-justify)
  - Allowed prefixes: ms
  - Support depends on browser capabilities
  - Note: `inter-ideograph` value as well as values defined in the current editor's draft is supported since we use it in UA stylesheet to emulate text-justify: auto behavior defined in the spec on IE.
- [white-space](http://www.w3.org/TR/css-text-3/#white-space)
  - Support depends on browser capabilities
- [word-break](http://www.w3.org/TR/css-text-3/#word-break)
  - Allowed prefixes: ms
  - Support depends on browser capabilities
- [word-wrap](http://www.w3.org/TR/css-text-3/#word-wrap)
  - Allowed prefixes: ms
  - Support depends on browser capabilities
  - Note: While the spec states that `word-wrap` must be treated as if it were a shorthand of `overflow-wrap`, Vivliostyle treat them for now as different properties and might result in an incorrect cascading behavior when inconsistent values are specified for both of the properties.

### [CSS Text Decoration 3](http://www.w3.org/TR/css-text-decor-3/)

- Note: While `text-decoration` property is a shorthand in CSS Text Decoration 3, Vivliostyle treats `text-decoration` for now as an independent property defined in CSS Level 2.1.
- [text-decoration-color](http://www.w3.org/TR/css-text-decor-3/#text-decoration-color)
  - Allowed prefixes: webkit
  - Support depends on browser capabilities
- [text-decoration-line](http://www.w3.org/TR/css-text-decor-3/#text-decoration-line)
  - Allowed prefixes: webkit
  - Support depends on browser capabilities
- [text-decoration-skip](http://www.w3.org/TR/css-text-decor-3/#text-decoration-skip)
  - Allowed prefixes: webkit
  - Support depends on browser capabilities
- [text-decoration-style](http://www.w3.org/TR/css-text-decor-3/#text-decoration-style)
  - Allowed prefixes: webkit
  - Support depends on browser capabilities
- [text-emphasis](http://www.w3.org/TR/css-text-decor-3/#text-emphasis)
  - Allowed prefixes: epub, webkit
  - Support depends on browser capabilities
- [text-emphasis-color](http://www.w3.org/TR/css-text-decor-3/#text-emphasis-color)
  - Allowed prefixes: epub, webkit
  - Support depends on browser capabilities
- [text-emphasis-position](http://www.w3.org/TR/css-text-decor-3/#text-emphasis-position)
  - Allowed prefixes: webkit
  - Support depends on browser capabilities
- [text-emphasis-style](http://www.w3.org/TR/css-text-decor-3/#text-emphasis-style)
  - Allowed prefixes: epub, webkit
  - Support depends on browser capabilities
- [text-shadow](http://www.w3.org/TR/css-text-decor-3/#text-shadow)
  - Support depends on browser capabilities
- [text-underline-position](http://www.w3.org/TR/css-text-decor-3/#text-underline-position)
  - Support depends on browser capabilities
  - Allowed prefixes: ms, webkit

### [CSS Multi-column Layout 1](http://www.w3.org/TR/css3-multicol/)

- [break-after](http://www.w3.org/TR/css3-multicol/#break-after)
  - Supported in all browsers
  - Note: behavior when multiple forced break values coincide at a single break point is not compliant to the spec. [[Issue]](https://github.com/vivliostyle/vivliostyle.js/issues/129)
- [break-before](http://www.w3.org/TR/css3-multicol/#break-before)
  - Supported in all browsers
  - Note: behavior when multiple forced break values coincide at a single break point is not compliant to the spec. [[Issue]](https://github.com/vivliostyle/vivliostyle.js/issues/129)
- [break-inside](http://www.w3.org/TR/css3-multicol/#break-inside)
  - Supported in all browsers
  - Note: All of `avoid-page`, `avoid-column` and `avoid-region` values are treated as if they were `avoid`. [[Issue]](https://github.com/vivliostyle/vivliostyle.js/issues/128)
- [column-count](http://www.w3.org/TR/css3-multicol/#column-count)
  - Allowed prefixes: moz, webkit
  - Supported in all browsers
- [column-gap](http://www.w3.org/TR/css3-multicol/#column-gap0)
  - Allowed prefixes: moz, webkit
  - Supported in all browsers
- [column-rule](http://www.w3.org/TR/css3-multicol/#column-rule0)
  - Allowed prefixes: moz, webkit
  - Supported in all browsers
- [column-rule-color](http://www.w3.org/TR/css3-multicol/#column-rule-color)
  - Allowed prefixes: moz, webkit
  - Supported in all browsers
- [column-rule-style](http://www.w3.org/TR/css3-multicol/#column-rule-style)
  - Allowed prefixes: moz, webkit
  - Supported in all browsers
- [column-rule-width](http://www.w3.org/TR/css3-multicol/#column-rule-width)
  - Allowed prefixes: moz, webkit
  - Supported in all browsers
- [column-width](http://www.w3.org/TR/css3-multicol/#column-width)
  - Allowed prefixes: moz, webkit
  - Supported in all browsers
- [columns](http://www.w3.org/TR/css3-multicol/#columns0)
  - Allowed prefixes: moz, webkit
  - Supported in all browsers

### [CSS Basic User Interface 3](http://www.w3.org/TR/css3-ui/)

- [box-sizing](http://www.w3.org/TR/css3-ui/#propdef-box-sizing)
  - Support depends on browser capabilities
- [outline](http://www.w3.org/TR/css3-ui/#propdef-outline)
  - Support depends on browser capabilities
- [outline-color](http://www.w3.org/TR/css3-ui/#propdef-outline-color)
  - Support depends on browser capabilities
- [outline-style](http://www.w3.org/TR/css3-ui/#propdef-outline-style)
  - Support depends on browser capabilities
- [outline-width](http://www.w3.org/TR/css3-ui/#propdef-outline-width)
  - Support depends on browser capabilities
- [text-overflow](http://www.w3.org/TR/css3-ui/#propdef-text-overflow)
  - Allowed prefixes: ms
  - Support depends on browser capabilities

### [CSS Writing Modes 3](http://www.w3.org/TR/css-writing-modes-3/)

- [direction](http://www.w3.org/TR/css-writing-modes-3/#propdef-direction)
  - Support depends on browser capabilities
- [text-combine-upright](http://www.w3.org/TR/css-writing-modes-3/#propdef-text-combine-upright)
  - Support depends on browser capabilities
- [text-combine-horizontal](http://www.w3.org/TR/2012/WD-css3-writing-modes-20121115/#text-combine-horizontal0)
  - This deprecated property is kept for compatibility.
  - Allowed prefixes: epub, ms
  - Support depends on browser capabilities
- [text-combine](http://www.w3.org/TR/2011/WD-css3-writing-modes-20110531/#text-combine0)
  - This deprecated property is kept for compatibility.
  - Allowed prefixes: webkit
  - Support depends on browser capabilities
- [text-orientation](http://www.w3.org/TR/css-writing-modes-3/#propdef-text-orientation)
  - Allowed prefixes: epub, webkit
  - Support depends on browser capabilities
  - Note: supported values are [those defined in 20 March 2014 Candidate Recommendation](https://www.w3.org/TR/2014/CR-css-writing-modes-3-20140320/#propdef-text-orientation), not those in the latest spec.
- [unicode-bidi](https://www.w3.org/TR/css-writing-modes-3/#propdef-unicode-bidi)
  - Support depends on browser capabilities
  - Supports [new values (`isolate`, `isolate-override`, `plaintext`) in CSS Writing Modes 3](https://www.w3.org/TR/css-writing-modes-3/#propdef-unicode-bidi)
- [writing-mode](http://www.w3.org/TR/css-writing-modes-3/#propdef-writing-mode)
  - Allowed prefixes: epub, webkit
  - Support depends on browser capabilities
  - Note: supported values are [those defined in 20 March 2014 Candidate Recommendation](https://www.w3.org/TR/2014/CR-css-writing-modes-3-20140320/#propdef-writing-mode), not those in the latest spec.

### [CSS Flexible Box Layout 1](http://www.w3.org/TR/css-flexbox-1/)

- [align-content](http://www.w3.org/TR/css-flexbox-1/#propdef-align-content)
  - Support depends on browser capabilities
- [align-items](http://www.w3.org/TR/css-flexbox-1/#propdef-align-items)
  - Support depends on browser capabilities
- [align-self](http://www.w3.org/TR/css-flexbox-1/#propdef-align-self)
  - Support depends on browser capabilities
- [display](https://www.w3.org/TR/css-flexbox-1/#flex-containers)
  - Support depends on browser capabilities
  - Supports [`flex`, `inline-flex`](https://www.w3.org/TR/css-flexbox-1/#flex-containers), [`ruby`, `ruby-base`, `ruby-text`, `ruby-base-container` and `ruby-text-container`](https://www.w3.org/TR/css-ruby-1/#propdef-display) values.
- [flex](http://www.w3.org/TR/css-flexbox-1/#propdef-flex)
  - Support depends on browser capabilities
- [flex-basis](http://www.w3.org/TR/css-flexbox-1/#propdef-flex-basis)
  - Support depends on browser capabilities
- [flex-direction](http://www.w3.org/TR/css-flexbox-1/#propdef-flex-direction)
  - Support depends on browser capabilities
- [flex-flow](http://www.w3.org/TR/css-flexbox-1/#propdef-flex-flow)
  - Support depends on browser capabilities
- [flex-grow](http://www.w3.org/TR/css-flexbox-1/#propdef-flex-grow)
  - Support depends on browser capabilities
- [flex-shrink](http://www.w3.org/TR/css-flexbox-1/#propdef-flex-shrink)
  - Support depends on browser capabilities
- [flex-wrap](http://www.w3.org/TR/css-flexbox-1/#propdef-flex-wrap)
  - Support depends on browser capabilities
- [justify-content](http://www.w3.org/TR/css-flexbox-1/#propdef-justify-content)
  - Support depends on browser capabilities
- [order](http://www.w3.org/TR/css-flexbox-1/#propdef-order)
  - Support depends on browser capabilities

### [CSS Fragmentation 3](http://www.w3.org/TR/css3-break/)

- [break-after](http://www.w3.org/TR/css3-break/#break-after)
  - Supported in all browsers
  - Note: behavior when multiple forced break values coincide at a single break point is not compliant to the spec. [[Issue]](https://github.com/vivliostyle/vivliostyle.js/issues/129)
- [break-before](http://www.w3.org/TR/css3-break/#break-before)
  - Supported in all browsers
  - Note: behavior when multiple forced break values coincide at a single break point is not compliant to the spec. [[Issue]](https://github.com/vivliostyle/vivliostyle.js/issues/129)
- [break-inside](http://www.w3.org/TR/css3-break/#break-inside)
  - Supported in all browsers
  - Note: All of `avoid-page`, `avoid-column` and `avoid-region` values are treated as if they were `avoid`. [[Issue]](https://github.com/vivliostyle/vivliostyle.js/issues/128)
- [orphans](http://www.w3.org/TR/css3-break/#orphans)
  - Supported in all browsers
- [widows](http://www.w3.org/TR/css3-break/#widows)
  - Supported in all browsers

### [CSS Transforms 1](http://www.w3.org/TR/css-transforms-1/)

- [backface-visibility](http://www.w3.org/TR/css-transforms-1/#propdef-backface-visibility)
  - Allowed prefixes: ms, webkit
  - Support depends on browser capabilities
- [transform](http://www.w3.org/TR/css-transforms-1/#propdef-transform)
  - Allowed prefixes: epub, ms
  - Support depends on browser capabilities
- [transform-origin](http://www.w3.org/TR/css-transforms-1/#propdef-transform-origin)
  - Allowed prefixes: epub, ms
  - Support depends on browser capabilities

### [CSS Ruby Layout 1](http://www.w3.org/TR/css-ruby-1/)

- [display](https://www.w3.org/TR/css-ruby-1/#propdef-display)
  - Support depends on browser capabilities
  - Supports [`flex`, `inline-flex`](https://www.w3.org/TR/css-flexbox-1/#flex-containers), [`ruby`, `ruby-base`, `ruby-text`, `ruby-base-container` and `ruby-text-container`](https://www.w3.org/TR/css-ruby-1/#propdef-display) values.
- [ruby-align](http://www.w3.org/TR/css-ruby-1/#propdef-ruby-align)
  - Support depends on browser capabilities
- [ruby-position](https://drafts.csswg.org/css-ruby-1/#propdef-ruby-position)
  - Support depends on browser capabilities
  - Supports syntax defined in the current editor's draft.

### [CSS Mobile Text Size Adjustment 1](https://drafts.csswg.org/css-size-adjust-1/)

- [text-size-adjust](https://drafts.csswg.org/css-size-adjust-1/#text-size-adjust)
  - Allowed prefixes: moz, ms
  - Support depends on browser capabilities

### [Pointer Events](http://www.w3.org/TR/pointerevents/)

- [touch-action](http://www.w3.org/TR/pointerevents/#the-touch-action-css-property)
  - Allowed prefixes: ms
  - Support depends on browser capabilities

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
  - Note: only [old syntaxes from 3 May 2012 Working Draft](http://www.w3.org/TR/2012/WD-css3-exclusions-20120503/#supported-svg-shapes) are supported.
- [-epubx-shape-inside](http://www.idpf.org/epub/pgt/#prop-shape-inside)
  - Supported in all browsers
  - Only effective when specified to EPUB Adaptive Layout partitions.
  - Note: only [old syntaxes from 3 May 2012 Working Draft](http://www.w3.org/TR/2012/WD-css3-exclusions-20120503/#supported-svg-shapes) are supported.
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
