# サポートする CSS 機能

Vivliostyle は現在、以下の各 CSS 機能（[値](#値)、[セレクタ](#セレクタ)、[アットルール](#アットルール)、[メディアクエリ](#メディアクエリ)、[プロパティ](#プロパティ)）をサポートしています。

このほかにも、ブラウザでサポートされる CSS プロパティと値は基本的にすべて利用可能です。Vivliostyle.js は独自の処理をしない CSS プロパティについてはブラウザに処理を任せるためです。

## 値

- [CSS 全体キーワード](https://www.w3.org/TR/css-values/#common-keywords): `initial`, `inherit`, `unset`, `revert`
- [長さの単位](https://www.w3.org/TR/css-values/#lengths): `em`, `ex`, `ch`, `rem`, `lh`, `rlh`, `vw`, `vh`, `vmin, vmax`, `vi`, `vb`, `cm`, `mm`, `q`, `in`, `pc`, `pt`, `px`.
- サイジングキーワード: [min-content](https://www.w3.org/TR/css-sizing-3/#valdef-width-min-content), [max-content](https://www.w3.org/TR/css-sizing-3/#valdef-width-max-content), [fit-content](https://www.w3.org/TR/css-sizing-4/#valdef-width-fit-content)
- カラー値
  - [色名](https://www.w3.org/TR/css-color/#named-colors)
  - [`transparent` カラーキーワード](https://www.w3.org/TR/css-color/#transparent-color)
  - [`currentColor` カラーキーワード](https://www.w3.org/TR/css-color/#currentcolor-color)
  - [RGB 関数: `rgb()`, `rgba()`](https://www.w3.org/TR/css-color/#rgb-functions)
  - [RGB 16進数表記: #RRGGBB, #RRGGBBAA](https://www.w3.org/TR/css-color/#hex-notation)
  - [HSL カラー: `hsl()`, `hsla()`](https://www.w3.org/TR/css-color/#the-hsl-notation)
  - [HWB カラー: `hwb()`](https://www.w3.org/TR/css-color/#the-hwb-notation)
  - [CMYK カラー: `device-cmyk()`](https://www.w3.org/TR/css-color-5/#the-device-cmyk-notation)
    - ブラウザレンダリング用に内部的に `color(srgb ...)` に変換されます。Vivliostyle CLI との後処理によるCMYK出力を可能にします。[PR #1627](https://github.com/vivliostyle/vivliostyle.js/pull/1627) を参照
- [属性参照: `attr()`](https://www.w3.org/TR/css-values/#attr-notation)
  - `content` プロパティの値としてのみサポートします。
  - 'string' 型と 'url' 型のみサポートします。
- [相互参照: `target-counter()`, `target-counters()` and `target-text()`](https://www.w3.org/TR/css-content-3/#cross-references)
  - `content` プロパティの値としてのみサポートします。
- [`string()` 関数（名前付き文字列）](https://www.w3.org/TR/css-content-3/#string-function)
- [`content()` 関数](https://www.w3.org/TR/css-content-3/#content-function)
- [`running()` 関数（ランニング要素）](https://www.w3.org/TR/css-gcpm-3/#running-syntax)
- [`element()` 関数（ランニング要素）](https://www.w3.org/TR/css-gcpm-3/#element-syntax)
- [`leader()` 関数](https://www.w3.org/TR/css-content-3/#leaders)
- [`calc()` 関数](https://www.w3.org/TR/css-values/#funcdef-calc)
- [`env()` 関数](https://drafts.csswg.org/css-env/)
  - css-env ドラフト仕様にはまだ定義されていませんが、ページヘッダー作成に便利な `env(pub-title)` と `env(doc-title)` のみ実装しています。
    - `env(pub-title)`: 出版物タイトル = EPUB、ウェブ出版物、またはプライマリエントリーページの HTML タイトル。
    - `env(doc-title)`: ドキュメントタイトル = HTML タイトル。複数の HTML ドキュメントで構成される出版物では、章や節のタイトルになることがあります。
- [`var()` 関数](https://www.w3.org/TR/css-variables/#using-variables)
  - [CSS Custom Properties for Cascading Variables](https://www.w3.org/TR/css-variables/) をサポートします。

## セレクタ

### [CSS 2](https://www.w3.org/TR/CSS2/)

- [ユニバーサルセレクタ `*`](https://www.w3.org/TR/CSS2/selector.html#universal-selector)
- [型セレクタ `E`](https://www.w3.org/TR/CSS2/selector.html#type-selectors)
- [子孫セレクタ `E F`](https://www.w3.org/TR/CSS2/selector.html#descendant-selectors)
- [子セレクタ `E > F`](https://www.w3.org/TR/CSS2/selector.html#child-selectors)
- [隣接兄弟セレクタ `E + F`](https://www.w3.org/TR/CSS2/selector.html#adjacent-selectors)
- [属性セレクタ `E[foo]`, `E[foo="bar"]`, `E[foo~="bar"]`, `E[foo|="bar"]`](https://www.w3.org/TR/CSS2/selector.html#attribute-selectors)
- [クラスセレクタ `E.foo`](https://www.w3.org/TR/CSS2/selector.html#class-html)
- [ID セレクタ `E#foo`](https://www.w3.org/TR/CSS2/selector.html#id-selectors)
- [`:first-child` 擬似クラス](https://www.w3.org/TR/CSS2/selector.html#first-child)
- [リンク擬似クラス `E:link`](https://www.w3.org/TR/CSS2/selector.html#link-pseudo-classes)
- [言語擬似クラス `E:lang(c)`](https://www.w3.org/TR/CSS2/selector.html#lang)
- [`:first-line` 擬似要素](https://www.w3.org/TR/CSS2/selector.html#first-line-pseudo)
- [`:first-letter` 擬似要素](https://www.w3.org/TR/CSS2/selector.html#first-letter)
- [`:before`・`:after` 擬似要素](https://www.w3.org/TR/CSS2/selector.html#before-and-after)

#### サポートされていないセレクタ

- [リンク擬似クラス `E:visited`](https://www.w3.org/TR/CSS2/selector.html#link-pseudo-classes)
- [動的擬似クラス `E:active`, `E:hover`, `E:focus`](https://www.w3.org/TR/CSS2/selector.html#dynamic-pseudo-classes)

### [Selectors 3](https://www.w3.org/TR/selectors-3/)

- [名前空間付き型セレクタ `ns|E`, `*|E`](https://www.w3.org/TR/selectors-3/#typenmsp)
- [名前空間付きユニバーサルセレクタ `ns|*`, `*|*`](https://www.w3.org/TR/selectors-3/#univnmsp)
- [部分一致属性セレクタ `[att^=val]`, `[att$=val]`, `[att*=val]`](https://www.w3.org/TR/selectors-3/#attribute-substrings)
- [名前空間付き属性セレクタ `[ns|att]`, `[|att]`, `[ns|att=val]`, `[|att=val]`, `[ns|att~=val]`, `[|att~=val]`, `[ns|att|=val]`, `[|att|=val]`, `[ns|att^=val]`, `[|att^=val]`, `[ns|att$=val]`, `[|att$=val]`, `[ns|att*=val]`, `[|att*=val]`](https://www.w3.org/TR/selectors-3/#attrnmsp)
- [UI 要素状態擬似クラス `:enabled`, `:disabled`, `:checked`, `:indeterminate`](https://www.w3.org/TR/selectors-3/#UIstates)
  - 注: 現在の実装では、これらの UI 要素の初期状態のみ使用できます。ユーザーの操作で実際の状態が切り替わっても、スタイルは変わりません。
- [`:root` 擬似クラス](https://www.w3.org/TR/selectors-3/#root-pseudo)
- [`:nth-child()` 擬似クラス](https://www.w3.org/TR/selectors-3/#nth-child-pseudo)
- [`:nth-last-child()` 擬似クラス](https://www.w3.org/TR/selectors-3/#nth-last-child-pseudo)
- [`:nth-of-type()` 擬似クラス](https://www.w3.org/TR/selectors-3/#nth-of-type-pseudo)
- [`:nth-last-of-type()` 擬似クラス](https://www.w3.org/TR/selectors-3/#nth-last-of-type-pseudo)
- [`:first-child` 擬似クラス](https://www.w3.org/TR/selectors-3/#first-child-pseudo)
- [`:last-child` 擬似クラス](https://www.w3.org/TR/selectors-3/#last-child-pseudo)
- [`:first-of-type` 擬似クラス](https://www.w3.org/TR/selectors-3/#first-of-type-pseudo)
- [`:last-of-type` 擬似クラス](https://www.w3.org/TR/selectors-3/#last-of-type-pseudo)
- [`:only-child` 擬似クラス](https://www.w3.org/TR/selectors-3/#only-child-pseudo)
- [`:only-of-type` 擬似クラス](https://www.w3.org/TR/selectors-3/#only-of-type-pseudo)
- [`:empty` 擬似クラス](https://www.w3.org/TR/selectors-3/#empty-pseudo)
- [`:not()` 擬似クラス](https://www.w3.org/TR/selectors-3/#negation)
- [`::first-line` 擬似要素](https://www.w3.org/TR/selectors-3/#first-line)
- [`::first-letter` 擬似要素](https://www.w3.org/TR/selectors-3/#first-letter)
- [`::before`・`::after` 擬似要素](https://www.w3.org/TR/selectors-3/#gen-content)
- [一般兄弟結合子 `E ~ F`](https://www.w3.org/TR/selectors-3/#general-sibling-combinators)

### [Selectors 4](https://www.w3.org/TR/selectors-4/)

- [`:is()` 擬似クラス](https://www.w3.org/TR/selectors-4/#matches)
- [`:not()` 擬似クラス](https://www.w3.org/TR/selectors-4/#negation)
- [`:where()` 擬似クラス](https://www.w3.org/TR/selectors-4/#zero-matches)
- [`:has()` 擬似クラス](https://www.w3.org/TR/selectors-4/#relational)
- [`:nth-child(An+B of S)` 擬似クラス](https://www.w3.org/TR/selectors-4/#nth-child-pseudo)
- [`:nth-last-child(An+B of S)` 擬似クラス](https://www.w3.org/TR/selectors-4/#nth-last-child-pseudo)

### [CSS Overflow 4](https://www.w3.org/TR/css-overflow-4/)

- [`:nth-fragment()` 擬似要素](https://www.w3.org/TR/css-overflow-4/#fragment-pseudo-element)

### [CSS Pseudo-Elements 4](https://www.w3.org/TR/css-pseudo-4/)

- [`::marker` 擬似要素](https://www.w3.org/TR/css-pseudo-4/#marker-pseudo)

### [CSS Generated Content for Paged Media (GCPM) 3](https://www.w3.org/TR/css-gcpm-3/)

- [`::footnote-call` 擬似要素](https://www.w3.org/TR/css-gcpm-3/#the-footnote-call)
- [`::footnote-marker` 擬似要素](https://www.w3.org/TR/css-gcpm-3/#the-footnote-marker)
  - [`list-style-position: outside`](https://www.w3.org/TR/css-gcpm-3/#footnote-marker-property) をサポートし、リストマーカーのようにマーカーを脚注本文の外側に配置できます。[PR #1706](https://github.com/vivliostyle/vivliostyle.js/pull/1706) を参照

#### サポートされていないセレクタ

- [名前空間なしの型セレクタ `|E`](https://www.w3.org/TR/selectors-3/#typenmsp)
- [名前空間なしのユニバーサルセレクタ `|*`](https://www.w3.org/TR/selectors-3/#univnmsp)
- [ユニバーサル名前空間付き属性セレクタ `[*|att]`, `[*|att=val]`, `[*|att~=val]`, `[*|att|=val]`](https://www.w3.org/TR/selectors-3/#attrnmsp)
- [ターゲット擬似クラス `:target`](https://www.w3.org/TR/selectors-3/#target-pseudo)

## アットルール

### [CSS 2](https://www.w3.org/TR/CSS2/)

- [@charset](https://www.w3.org/TR/CSS2/syndata.html#charset)
- [@import](https://www.w3.org/TR/CSS2/cascade.html#at-import)
  - [CSS Cascading and Inheritance 3 にも含まれます](https://www.w3.org/TR/css-cascade-3/#at-import)

### [CSS Namespaces 3](https://www.w3.org/TR/css3-namespace/)

- [@namespace](https://www.w3.org/TR/css3-namespace/#declaration)

### [CSS Conditional Rules 3](https://www.w3.org/TR/css-conditional-3/)

- [@media](https://www.w3.org/TR/css-conditional-3/#at-media)
- [@supports](https://www.w3.org/TR/css-conditional-3/#at-supports)

### [CSS Conditional Rules 4](https://www.w3.org/TR/css-conditional-4/)

- [@supports selector()](https://www.w3.org/TR/css-conditional-4/#at-supports-ext)

### [CSS Paged Media 3](https://www.w3.org/TR/css-page-3/)

- [@page](https://www.w3.org/TR/css-page-3/#at-page-rule)
- [ページマージンボックス (@top-left-corner, @top-left, @top-center, @top-right, @top-right-corner, @left-top, @left-middle, @left-bottom, @right-top, @right-middle, @right-bottom, @bottom-left-corner, @bottom-left, @bottom-center, @bottom-right, @bottom-right-corner)](https://www.w3.org/TR/css-page-3/#margin-at-rules)
- [ページセレクタ](https://www.w3.org/TR/css-page-3/#page-selectors)
  - [:left, :right](https://www.w3.org/TR/css-page-3/#spread-pseudos)
  - [:recto, :verso](https://www.w3.org/TR/css-logical-1/#page)
  - [:first](https://www.w3.org/TR/css-page-3/#first-pseudo)
    - 注: 複数ドキュメントの出版物では、`:first` は最初のドキュメントの最初のページにのみ一致し、`:nth(1)` は各ドキュメントの最初のページに一致します。[Issue #667](https://github.com/vivliostyle/vivliostyle.js/issues/667#issuecomment-738020563)
  - [:blank](https://www.w3.org/TR/css-page-3/#blank-pseudo)
- [名前付きページ（ページタイプセレクタ）](https://www.w3.org/TR/css-page-3/#page-type-selector)
- [ページベースカウンタ（page、pages）](https://www.w3.org/TR/css-page-3/#page-based-counters)

参照: [CSS Paged Media 3 のプロパティ](#css-paged-media-3-2)

### [CSS Generated Content for Paged Media (GCPM) 3](https://www.w3.org/TR/css-gcpm-3/)

- [`@footnote` ルール（脚注エリア）](https://www.w3.org/TR/css-gcpm-3/#footnotes)
  - `@page { @footnote { … } }` の形式で脚注エリアのスタイルを指定します
  - ページセレクタの組み合わせをサポート: 例 `@page :left { @footnote { … } }`
  - `@footnote ::before` で `content` プロパティなどによる脚注セパレータのスタイル指定をサポート
  - `@page @footnote` はトップレベルの `@footnote` より優先されます
  - [PR #1644](https://github.com/vivliostyle/vivliostyle.js/pull/1644) を参照
- [N番目ページセレクタ `:nth(An+B [of <custom-ident>])`](https://www.w3.org/TR/css-gcpm-3/#document-page-selectors)
  - `:nth(An+B of <page-type>)` はページグループを考慮したマッチングを行い、現在のページ上のすべてのアクティブなページグループに対して評価されます。[PR #1745](https://github.com/vivliostyle/vivliostyle.js/pull/1745) を参照
  - 注: 複数ドキュメントの出版物では、`:nth(1)` は各ドキュメントの最初のページに一致しますが、`:first` は最初のドキュメントの最初のページにのみ一致します。[Issue #667](https://github.com/vivliostyle/vivliostyle.js/issues/667#issuecomment-738020563)

参照:

- [CSS Generated Content for Paged Media (GCPM) 3 のプロパティ](#css-generated-content-for-paged-media-gcpm-3-2)
- [値 - 相互参照・content()・string() 関数](#値)

### [CSS Fonts 3](https://www.w3.org/TR/css-fonts-3/)

- [@font-face](https://www.w3.org/TR/css-fonts-3/#font-face-rule)
  - [font-style、font-weight、font-stretch ディスクリプタ](https://www.w3.org/TR/css-fonts-3/#font-prop-desc)
  - [unicode-range ディスクリプタ](https://www.w3.org/TR/css-fonts-3/#unicode-range-desc)

参照: [CSS Fonts 3 のプロパティ](#css-fonts-3-2)

### [CSS Counter Styles 3](https://www.w3.org/TR/css-counter-styles-3/)

- [@counter-style](https://www.w3.org/TR/css-counter-styles-3/#the-counter-style-rule)
- [`list-style-type`・`counter()`・`counters()` の拡張](https://www.w3.org/TR/css-counter-styles-3/#extending-css2)
- [定義済みカウンタスタイル](https://www.w3.org/TR/css-counter-styles-3/#predefined-counters)

## メディアクエリ

- Vivliostyle は [`print` メディア](https://www.w3.org/TR/CSS2/media.html#media-types)（および `all`）向けに指定されたスタイルを使用します。
  - `print` メディアに加えて、Vivliostyle 固有のメディアタイプ `vivliostyle` が有効化されます。
- サポートされるメディア機能
  - [`(min-|max-)width`](https://www.w3.org/TR/css3-mediaqueries/#width)
  - [`(min-|max-)height`](https://www.w3.org/TR/css3-mediaqueries/#height)
  - [`(min-|max-)device-width`](https://www.w3.org/TR/css3-mediaqueries/#device-width)
  - [`(min-|max-)device-height`](https://www.w3.org/TR/css3-mediaqueries/#device-height)
  - [`(min-|max-)color`](https://www.w3.org/TR/css3-mediaqueries/#color)

## プロパティ

### [CSS 2](https://www.w3.org/TR/CSS2/)

- [background](https://www.w3.org/TR/CSS2/colors.html#propdef-background)
  - [CSS Backgrounds 3 の構文](https://www.w3.org/TR/css3-background/#propdef-background)をサポートします
- [background-attachment](https://www.w3.org/TR/CSS2/colors.html#propdef-background-attachment)
  - [CSS Backgrounds 3 の構文](https://www.w3.org/TR/css3-background/#propdef-background-attachment)をサポートします
- [background-color](https://www.w3.org/TR/CSS2/colors.html#propdef-background-color)
  - [CSS Backgrounds 3 の構文](https://www.w3.org/TR/css3-background/#propdef-background-color)をサポートします
- [background-image](https://www.w3.org/TR/CSS2/colors.html#propdef-background-image)
  - [CSS Backgrounds 3 の構文](https://www.w3.org/TR/css3-background/#propdef-background-image)をサポートします
- [background-position](https://www.w3.org/TR/CSS2/colors.html#propdef-background-position)
  - [CSS Backgrounds 3 の構文](https://www.w3.org/TR/css3-background/#propdef-background-position)をサポートします
- [background-repeat](https://www.w3.org/TR/CSS2/colors.html#propdef-background-repeat)
  - [CSS Backgrounds 3 の構文](https://www.w3.org/TR/css3-background/#propdef-background-repeat)をサポートします
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
  - 参照: [CSS Page Floats](#css-page-floats)
- [clip](https://www.w3.org/TR/CSS2/visufx.html#propdef-clip)
- [color](https://www.w3.org/TR/CSS2/colors.html#propdef-color)
- [content](https://www.w3.org/TR/CSS2/generate.html#propdef-content)
- [counter-increment](https://www.w3.org/TR/CSS2/generate.html#propdef-counter-increment)
- [counter-reset](https://www.w3.org/TR/CSS2/generate.html#propdef-counter-reset)
- [counter-set](https://www.w3.org/TR/css-lists-3/#propdef-counter-set)
- [cursor](https://www.w3.org/TR/CSS2/ui.html#propdef-cursor)
- [direction](https://www.w3.org/TR/CSS2/visuren.html#propdef-direction)
- [display](https://www.w3.org/TR/CSS2/visuren.html#propdef-display)
  - [`flex`、`inline-flex`](https://www.w3.org/TR/css-flexbox-1/#flex-containers)、[`ruby`、`ruby-base`、`ruby-text`、`ruby-base-container`、`ruby-text-container`](https://www.w3.org/TR/css-ruby-1/#propdef-display) 値をサポートします。
- [empty-cells](https://www.w3.org/TR/CSS2/tables.html#propdef-empty-cells)
- [float](https://www.w3.org/TR/CSS2/visuren.html#propdef-float)
  - 参照: [CSS Page Floats](#css-page-floats)
- [font](https://www.w3.org/TR/CSS2/fonts.html#propdef-font)
- [font-family](https://www.w3.org/TR/CSS2/fonts.html#propdef-font-family)
- [font-size](https://www.w3.org/TR/CSS2/fonts.html#propdef-font-size)
- [font-style](https://www.w3.org/TR/CSS2/fonts.html#propdef-font-style)
- [font-variant](https://www.w3.org/TR/CSS2/fonts.html#propdef-font-variant)
  - [CSS Fonts 3 の font-variant](https://www.w3.org/TR/css-fonts-3/#propdef-font-variant) をサポートします
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
  - 注: `@page` ルール内ではサポートされません。[Issue #43](https://github.com/vivliostyle/vivliostyle.js/issues/43)
- [right](https://www.w3.org/TR/CSS2/visuren.html#propdef-right)
- [table-layout](https://www.w3.org/TR/CSS2/tables.html#propdef-table-layout)
- [text-align](https://www.w3.org/TR/CSS2/text.html#propdef-text-align)
- [text-decoration](https://www.w3.org/TR/CSS2/text.html#propdef-text-decoration)
- [text-indent](https://www.w3.org/TR/CSS2/text.html#propdef-text-indent)
- [text-transform](https://www.w3.org/TR/CSS2/text.html#propdef-text-transform)
- [top](https://www.w3.org/TR/CSS2/visuren.html#propdef-top)
- [unicode-bidi](https://www.w3.org/TR/CSS2/visuren.html#propdef-unicode-bidi)
  - [CSS Writing Modes 3 の新しい値（`isolate`、`isolate-override`、`plaintext`）](https://www.w3.org/TR/css-writing-modes-3/#propdef-unicode-bidi)をサポートします
- [vertical-align](https://www.w3.org/TR/CSS2/visudet.html#propdef-vertical-align)
- [visibility](https://www.w3.org/TR/CSS2/visufx.html#propdef-visibility)
- [white-space](https://www.w3.org/TR/CSS2/text.html#propdef-white-space)
- [widows](https://www.w3.org/TR/CSS2/page.html#propdef-widows)
- [width](https://www.w3.org/TR/CSS2/visudet.html#propdef-width)
- [word-spacing](https://www.w3.org/TR/CSS2/text.html#propdef-word-spacing)
- [z-index](https://www.w3.org/TR/CSS2/visuren.html#propdef-z-index)

### [CSS Paged Media 3](https://www.w3.org/TR/css-page-3/)

- [bleed](https://www.w3.org/TR/css-page-3/#bleed)
  - ページセレクタのない `@page` ルール内で指定した場合にのみ有効
- [marks](https://www.w3.org/TR/css-page-3/#marks)
  - ページセレクタのない `@page` ルール内で指定した場合にのみ有効
- [size](https://www.w3.org/TR/css-page-3/#page-size-prop)
  - 必須値すべてと、提案値 `A0`–`A10`、`B0`–`B10`、`C0`–`C10`、`JIS-B0`–`JIS-B10` をサポートします。[PR #713](https://github.com/vivliostyle/vivliostyle.js/pull/713) を参照
- crop-offset
  - トリムサイズの端から出力ページメディアサイズの端までの距離を指定します
  - このプロパティはまだ標準化されていません。[Issue #913](https://github.com/vivliostyle/vivliostyle.js/issues/913) を参照
- crop-marks-line-color
  - トンボマークの色を指定します
  - このプロパティはまだ標準化されていません。[PR #1505](https://github.com/vivliostyle/vivliostyle.js/pull/1505) を参照
- [page (名前付きページ)](https://www.w3.org/TR/css-page-3/#using-named-pages)

参照: [CSS Paged Media 3 のアットルール](#css-paged-media-3)

### [CSS Generated Content for Paged Media (GCPM) 3](https://www.w3.org/TR/css-gcpm-3/)

- [string-set（名前付き文字列）](https://www.w3.org/TR/css-gcpm-3/#setting-named-strings-the-string-set-pro)
- [position: running()（ランニング要素）](https://www.w3.org/TR/css-gcpm-3/#running-elements)
- [footnote-policy](https://www.w3.org/TR/css-gcpm-3/#propdef-footnote-policy)
  - [`auto`、`line`](https://www.w3.org/TR/css-gcpm-3/#propdef-footnote-policy) 値をサポートします。

参照:

- [CSS Generated Content for Paged Media (GCPM) 3 のアットルール](#css-generated-content-for-paged-media-gcpm-3)
- [値 - 相互参照・string()・content()・running()・element()・leader() 関数](#値)

### [CSS Fragmentation 3](https://www.w3.org/TR/css-break-3/)

- [break-after](https://www.w3.org/TR/css-break-3/#propdef-break-after)
- [break-before](https://www.w3.org/TR/css-break-3/#propdef-break-before)
- [break-inside](https://www.w3.org/TR/css-break-3/#propdef-break-inside)
  - 注: `avoid-page`、`avoid-column`、`avoid-region` 値はいずれも `avoid` として扱われます。[Issue #128](https://github.com/vivliostyle/vivliostyle.js/issues/128)
- [orphans](https://www.w3.org/TR/css-break-3/#propdef-orphans)
- [widows](https://www.w3.org/TR/css-break-3/#propdef-widows)
- [box-decoration-break](https://www.w3.org/TR/css-break-3/#propdef-box-decoration-break)
  - 注: インラインの始端/終端における背景、box-shadow、ボーダー画像は常に `box-decoration-break: clone` が指定されたかのようにレンダリングされます。

### [CSS Fragmentation 4](https://www.w3.org/TR/css-break-4/)

- [margin-break](https://www.w3.org/TR/css-break-4/#break-margins)

### [CSS Page Floats](https://drafts.csswg.org/css-page-floats/)

- [clear](https://drafts.csswg.org/css-page-floats/#propdef-clear)
  - [`none`、`inline-start`、`inline-end`、`block-start`、`block-end`、`left`、`right`、`top`、`bottom`、`both`、`all`、`same`](https://drafts.csswg.org/css-page-floats/#propdef-clear) 値をサポートします。
  - ブロックレベルボックス（ページフロート以外）に `all` を指定すると、ドキュメント順序でこのボックスより前にアンカーがある block-start / block-end ページフロートの後にボックスの block-start 辺が来るように下げられます。
  - ページフロートに `clear` 値を指定すると、先行のページフロートの後に配置されます。
  - `same` 値は、そのページフロートがフロートしている方向と同じ方向を意味します。
  - `float: snap-block` のページフロートが block-start 端に配置されるところが、`clear` 値によりその配置が禁止される場合、フロートは代わりに block-end 側に配置されます（`clear` 値がその配置も禁止しない場合）。
  - `page`、`column`、`region` 値は、先行のページフロートが `clear` プロパティを持つ要素（ページフロート、通常フロート、またはブロックレベルボックス）を含むページ/カラム/リージョンの前に配置されることを保証します。
- [float](https://drafts.csswg.org/css-page-floats/#propdef-float)
  - [`block-start`、`block-end`、`inline-start`、`inline-end`、`snap-block`、`left`、`right`、`top`、`bottom`、`none`](https://drafts.csswg.org/css-page-floats/#propdef-float) 値をサポートします。
  - 複数のキーワードを組み合わせた値をサポートします。例:
    - `float: top right;` → 右上隅にフロート
    - `float: bottom left;` → 左下隅にフロート
    - `float: top bottom;` → 上端または下端にフロート
    - `float: top bottom left;` → 左上隅または左下隅にフロート
    - `float: top bottom left right;` → 左上、右上、左下、または右下隅にフロート
    - `float: block-start inline-start;` → block-start かつ inline-start の隅にフロート
    - `float: block-start block-end;` → block-start または block-end 端にフロート（'snap-block' と同じ）
    - [PR #1444](https://github.com/vivliostyle/vivliostyle.js/pull/1444) を参照
- [float-reference](https://drafts.csswg.org/css-page-floats/#propdef-float-reference)
  - `float-reference: page`（または `column` / `region`）を指定してページ（またはカラム/リージョン）フロートを有効化します。
- float-min-wrap-block
  - ページフロートに対して適用されます
  - パーセンテージ値は、ページフロートのフロート参照のブロック寸法に対して解釈されます
  - 正の長さを指定すると、ページフロートの横の空間のブロック方向の長さが指定した長さ未満の場合、インフローコンテンツはその空間に流れ込めなくなり、その空間は空白のままになってコンテンツは次のカラムへ送られます
  - このプロパティはまだ標準化されていません。[PR #382](https://github.com/vivliostyle/vivliostyle.js/pull/382) を参照

### [CSS Color 3](https://www.w3.org/TR/css3-color/)

- [color](https://www.w3.org/TR/css-color-3/#foreground)
- [opacity](https://www.w3.org/TR/css-color-3/#transparency)

参照: [値 - サポートしているカラー値](#値)

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
  - `<resolution>` 値のみサポートします。
  - `img`、`input[type=image]`、`video`（ポスター画像に適用）要素と before/after 擬似要素のコンテンツのみサポートします。背景画像、リスト画像、ボーダー画像などはサポートしません。
  - ベクター画像（SVG など）にもラスター画像と同様に適用されます。この挙動は仕様記載と異なります。

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

参照: [CSS Fonts 3 のアットルール](#css-fonts-3)

### [CSS Text 3](https://www.w3.org/TR/css-text-3/)

- [hanging-punctuation](hanging-punctuation)
  - 必須値すべて「`none | [ first || [ force-end | allow-end ] || last ]`」をサポートします。[PR #814](https://github.com/vivliostyle/vivliostyle.js/pull/814) を参照
- [hyphens](https://www.w3.org/TR/css-text-3/#hyphenation)
- [letter-spacing](https://www.w3.org/TR/css-text-3/#letter-spacing-property)
- [line-break](https://www.w3.org/TR/css-text-3/#line-break-property)
- [overflow-wrap, word-wrap](https://www.w3.org/TR/css-text-3/#overflow-wrap-property)
- [tab-size](https://www.w3.org/TR/css-text-3/#tab-size-property)
- [text-align-last](https://www.w3.org/TR/css-text-3/#text-align-last-property)
  - 注: CSS Text 3 では `text-align` プロパティはショートハンドですが、Vivliostyle では引き続き CSS 2.1 で定義されたスタンドアロンのプロパティとして扱っています。
- [white-space](https://www.w3.org/TR/css-text-3/#white-space-property)
- [word-break](https://www.w3.org/TR/css-text-3/#word-break-property)

### [CSS Text 4](https://www.w3.org/TR/css-text-4/)

- [text-autospace](https://www.w3.org/TR/css-text-4/#text-autospace-property)
  - サポート値: `normal | no-autospace | [ ideograph-alpha || ideograph-numeric ] | auto`
- [text-spacing-trim](https://www.w3.org/TR/css-text-4/#text-spacing-trim-property)
  - 値: `space-all | normal | space-first | trim-start | trim-both | auto`
- [text-spacing](https://www.w3.org/TR/css-text-4/#text-spacing-property)
  - 値: `normal | none | auto | [<autospace> || <spacing-trim>]`
  - 注: `text-autospace` と `text-spacing-trim` プロパティをまとめて設定するショートハンドプロパティです。[PR #1142](https://github.com/vivliostyle/vivliostyle.js/pull/1142) を参照

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

Vivliostyle は CSS マルチカラムレイアウトをサポートしていますが、ルート・body 要素に指定された場合と、ルート・body 以外の要素に指定された場合とで扱いが異なり、それぞれに制限があります：

- **ルート段組**（ルート要素または body 要素に指定）:
  - ルート要素と body 要素の両方に段組が指定された場合は、ルート要素に指定された段組のみがルート段組として扱われます。
  - ページエリアがマルチカラムコンテナになります。
  - Vivliostyle が独自に実装しているため、ブラウザの段組実装に依存しません。
  - CSS Page Floats の `float-reference: column` はルート段組にのみ対応しています。
  - 制限: `column-span: all` はルート段組の場合にはページフロートに対してのみ対応しています。
- **非ルート段組**（ルート・body 要素以外に指定）:
  - 段組の処理はブラウザの段組実装に依存します。
  - 同一ページ内に段数の異なる複数の段組を混在させたり、段組の中に段組をネストしたり、`column-span: all` で段抜きのレイアウトもできます。
  - 注: この機能はブラウザの段組機能を利用しているため、Safari/WebKit で Vivliostyle.js を使用する場合には、WebKit の既知のバグによりネストした段組レイアウトが崩れることがある、または非ルート段組でのページ分割がうまくいかないことがあります。[Issue #1821](https://github.com/vivliostyle/vivliostyle.js/issues/1821) を参照

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
  - 注: ルート段組では、`column-span` はページフロートに指定した場合にのみ有効です。`auto` 値を指定すると、ページフロートの min-content インラインサイズに応じて 1 カラムまたは全カラムにスパンします。
  - 非ルート段組では、`column-span: all` を制限なく使えます。

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

### ページ方向 inside/outside プロパティと値

これらのプロパティと値では、`inside` および `outside` キーワードは、ページが左ページか右ページかに応じて `left` または `right` に解決されます。

注: これらの CSS プロパティと値はまだ標準化されていません。[PR #1519](https://github.com/vivliostyle/vivliostyle.js/pull/1519) を参照

追加された *-inside/outside プロパティ:

- margin-inside, margin-outside
- padding-inside, padding-outside
- border-inside, border-outside
- border-inside-color, border-outside-color
- border-inside-style, border-outside-style
- border-inside-width, border-outside-width
- inset-inside, inset-outside

`inside` および `outside` 値が拡張されたプロパティ:

- float, clear
- text-align, text-align-last

### [CSS Repeated Headers and Footers](https://specs.rivoal.net/css-repeat/)

注: この仕様提案はまだ CSS Working Group に提出されていません。

- [repeat-on-break](https://specs.rivoal.net/css-repeat/#propdef-repeat-on-break)

## セマンティック脚注（role 属性 / epub:type 属性）

Vivliostyle は、CSS GCPM の `float: footnote` プロパティによる脚注に加えて、HTML 要素のセマンティック属性を使った脚注をサポートしています。`role` 属性（[DPUB-ARIA](https://www.w3.org/TR/dpub-aria-1.1/)）または `epub:type` 属性（[EPUB 3 Structural Semantics Vocabulary](https://www.w3.org/TR/epub-ssv-11/)）によって、脚注参照と脚注本文を識別します。

- 脚注参照: `<a role="doc-noteref" href="#fn">1</a>` または `<a epub:type="noteref" href="#fn">1</a>`
- 脚注本文: `<aside role="doc-footnote" id="fn"><p>1. 脚注の本文</p></aside>` または `<aside epub:type="footnote" id="fn"><p>1. 脚注の本文</p></aside>`

[Issue #1700](https://github.com/vivliostyle/vivliostyle.js/issues/1700) を参照

## [EPUB Adaptive Layout](http://www.idpf.org/epub/pgt/)

注: この仕様は W3C 標準化トラックにはありません。将来の Vivliostyle バージョンではこの仕様のサポートを廃止する可能性があります。

### アットルール

- [@-epubx-define](http://www.idpf.org/epub/pgt/#rule-define)
- [@-epubx-flow](http://www.idpf.org/epub/pgt/#rule-flow)
- [@-epubx-page-master](http://www.idpf.org/epub/pgt/#rule-page-master)
- [@-epubx-page-template](http://www.idpf.org/epub/pgt/#rule-page-template)
- [@-epubx-partition](http://www.idpf.org/epub/pgt/#rule-partition)
- [@-epubx-partition-group](http://www.idpf.org/epub/pgt/#rule-partition-group)
- [@-epubx-region](http://www.idpf.org/epub/pgt/#rule-region)
- [@-epubx-viewport](http://www.idpf.org/epub/pgt/#rule-viewport)
- [@-epubx-when](http://www.idpf.org/epub/pgt/#rule-when)

### プロパティ

- [-epubx-conflicting-partitions](http://www.idpf.org/epub/pgt/#prop-conflicting-partitions)
- [-epubx-enabled](http://www.idpf.org/epub/pgt/#prop-enabled)
- [-epubx-flow-consume](http://www.idpf.org/epub/pgt/#prop-flow-consume)
- [-epubx-flow-from](http://www.idpf.org/epub/pgt/#prop-flow-from)
  - EPUB Adaptive Layout パーティションに指定した場合にのみ有効。
- [-epubx-flow-into](http://www.idpf.org/epub/pgt/#prop-flow-into)
- [-epubx-flow-linger](http://www.idpf.org/epub/pgt/#prop-flow-linger)
- [-epubx-flow-options](http://www.idpf.org/epub/pgt/#prop-flow-options)
- [-epubx-flow-priority](http://www.idpf.org/epub/pgt/#prop-flow-priority)
- [-epubx-min-page-height](http://www.idpf.org/epub/pgt/#prop-min-page-height)
- [-epubx-min-page-width](http://www.idpf.org/epub/pgt/#prop-min-page-width)
- [-epubx-required](http://www.idpf.org/epub/pgt/#prop-required)
- [-epubx-required-partitions](http://www.idpf.org/epub/pgt/#prop-required-partitions)
- [-epubx-shape-outside](http://www.idpf.org/epub/pgt/#prop-shape-outside)
  - EPUB Adaptive Layout パーティションに指定した場合にのみ有効。
  - 注: [2012年5月3日 Working Draft の古い構文](https://www.w3.org/TR/2012/WD-css3-exclusions-20120503/#supported-svg-shapes)のみサポートします。
 - [-epubx-shape-inside](http://www.idpf.org/epub/pgt/#prop-shape-inside)
  - EPUB Adaptive Layout パーティションに指定した場合にのみ有効。
  - 注: [2012年5月3日 Working Draft の古い構文](https://www.w3.org/TR/2012/WD-css3-exclusions-20120503/#supported-svg-shapes)のみサポートします。
- [-epubx-snap-height](http://www.idpf.org/epub/pgt/#prop-snap-height)
- [-epubx-snap-width](http://www.idpf.org/epub/pgt/#prop-snap-width)
- [-epubx-text-zoom](http://www.idpf.org/epub/pgt/#prop-text-zoom)
- [-epubx-utilization](http://www.idpf.org/epub/pgt/#prop-utilization)
- [-epubx-wrap-flow](http://www.idpf.org/epub/pgt/#prop-wrap-flow)
  - EPUB Adaptive Layout パーティションに指定した場合にのみ有効。
