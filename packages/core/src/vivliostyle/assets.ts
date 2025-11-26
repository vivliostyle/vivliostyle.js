/**
 * Copyright 2015 Daishinsha Inc.
 * Copyright 2019 Vivliostyle Foundation
 *
 * Vivliostyle.js is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * Vivliostyle.js is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with Vivliostyle.js.  If not, see <http://www.gnu.org/licenses/>.
 *
 * @fileoverview Assets - Bundle resources
 */

/** vivliostyle-viewport-screen.css */
export const VivliostyleViewportScreenCss = `
@media screen {
  [data-vivliostyle-viewer-viewport] {
    background: #aaaaaa;
  }

  [data-vivliostyle-page-container] {
    background: white;
    z-index: 0;
  }

  [data-vivliostyle-viewer-viewport] {
    box-sizing: border-box;
    display: flex;
    overflow: auto;
    position: relative;
  }

  [data-vivliostyle-outer-zoom-box] {
    margin: auto;
    overflow: hidden;
    flex: none;
  }

  [data-vivliostyle-viewer-viewport] [data-vivliostyle-spread-container] {
    display: flex;
    flex: none;
    justify-content: center;
    transform-origin: left top;
  }

  [data-vivliostyle-viewer-viewport][data-vivliostyle-page-progression="ltr"]
    [data-vivliostyle-spread-container] {
    flex-direction: row;
  }

  [data-vivliostyle-viewer-viewport][data-vivliostyle-page-progression="rtl"]
    [data-vivliostyle-spread-container] {
    flex-direction: row-reverse;
  }

  [data-vivliostyle-viewer-viewport] [data-vivliostyle-page-container] {
    margin: 0 auto;
    flex: none;
    transform-origin: center top;
  }

  [data-vivliostyle-viewer-viewport][data-vivliostyle-spread-view="true"]
    [data-vivliostyle-spread-container]
    [data-vivliostyle-page-container][data-vivliostyle-page-side="left"] {
    margin-right: 1px;
    transform-origin: right top;
  }

  [data-vivliostyle-viewer-viewport][data-vivliostyle-spread-view="true"]
    [data-vivliostyle-spread-container]
    [data-vivliostyle-page-container][data-vivliostyle-page-side="right"] {
    margin-left: 1px;
    transform-origin: left top;
  }

  [data-vivliostyle-viewer-viewport][data-vivliostyle-spread-view="true"]
    [data-vivliostyle-spread-container]
    [data-vivliostyle-page-container][data-vivliostyle-unpaired-page="true"] {
    margin-left: auto;
    margin-right: auto;
    transform-origin: center top;
  }
}
`;

/** vivliostyle-viewport.css */
export const VivliostyleViewportCss = `
[data-vivliostyle-layout-box] {
  position: absolute;
  left: 0;
  top: 0;
  right: 0;
  bottom: 0;
  overflow: hidden;
  z-index: -1;
  transform-origin: left top;
}

[data-vivliostyle-debug] [data-vivliostyle-layout-box] {
  right: auto;
  bottom: auto;
  overflow: visible;
  z-index: auto;
}

[data-vivliostyle-spread-container] {
  transform: scale(var(--viv-outputScale,1));
  transform-origin: left top;
}

/* Emulate high pixel ratio using zoom & transform:scale() */
@supports (zoom: 8) {
  [data-vivliostyle-layout-box] {
    zoom: calc(var(--viv-outputPixelRatio,1) / var(--viv-devicePixelRatio,1));
    transform: scale(calc(var(--viv-devicePixelRatio,1) / var(--viv-outputPixelRatio,1)));
  }
  [data-vivliostyle-spread-container] {
    zoom: calc(var(--viv-outputPixelRatio,1) / var(--viv-devicePixelRatio,1));
    transform: scale(calc(var(--viv-outputScale,1) * var(--viv-devicePixelRatio,1) / var(--viv-outputPixelRatio,1)));
  }
  /* Workaround for Chromium's default border etc. widths not zoomed but scaled down */
  [data-vivliostyle-spread-container] :where([style*=border],[style*=outline],[style*=rule]) {
    border-width: medium;
    outline-width: medium;
    column-rule-width: medium;
  }
  [data-vivliostyle-spread-container] ::-webkit-scrollbar {
    width: 8px;
    height: 8px;
  }
  [data-vivliostyle-spread-container] ::-webkit-scrollbar-track {
    background-color: #f4f4f4;
  }
  [data-vivliostyle-spread-container] ::-webkit-scrollbar-thumb {
    border-radius: 4px;
    background: #c7c7c7;
  }
  [data-vivliostyle-spread-container] ::-webkit-scrollbar-thumb:hover {
    background: #7d7d7d;
  }
}

[data-vivliostyle-page-container] {
  position: relative;
}

[data-vivliostyle-bleed-box] {
  position: absolute;
  overflow: hidden;
  background-origin: content-box !important;
}

[data-vivliostyle-page-box] ~ [data-vivliostyle-page-box] {
  display: none;
}

[data-vivliostyle-toc-box] {
  position: absolute;
  left: 3px;
  top: 3px;
  overflow: scroll;
  overflow-x: hidden;
  background: rgba(248, 248, 248, 0.9);
  border-radius: 2px;
  box-shadow: 1px 1px 2px rgba(0, 0, 0, 0.4);
}

@media print {
  [data-vivliostyle-toc-box] {
    display: none;
  }

  [data-vivliostyle-outer-zoom-box],
  [data-vivliostyle-spread-container] {
    width: 100% !important;
    height: 100% !important;
  }

  [data-vivliostyle-spread-container] {
    --viv-outputScale: 1 !important;
    --viv-devicePixelRatio: 1 !important;
    zoom: normal !important;
    transform: none !important;
    print-color-adjust: exact;
  }

  @supports (zoom: 8) {
    [data-vivliostyle-spread-container] [data-vivliostyle-page-container] {
      zoom: var(--viv-outputPixelRatio,1);
      /* transform: scale(calc(1 / var(--viv-outputPixelRatio,1))); */
      /* Use matrix instead of scale (Workaround for issue #1555) */
      transform: matrix(calc(1 / var(--viv-outputPixelRatio,1)), 0, 5e-324, calc(1 / var(--viv-outputPixelRatio,1)), 0, 0);
      transform-origin: left top;
    }
  }

  [data-vivliostyle-spread-container] [data-vivliostyle-page-container] {
    display: block !important;
    max-height: 100vh;
  }

  [data-vivliostyle-spread-container] [data-vivliostyle-page-container]:not(:last-child) {
    break-after: page;
  }

  /* Gecko-only hack, see https://bugzilla.mozilla.org/show_bug.cgi?id=267029#c17 */
  @-moz-document url-prefix()  {
    [data-vivliostyle-spread-container] [data-vivliostyle-page-container]:nth-last-child(n + 2) {
      top: -1px;
      margin-top: 1px;
      margin-bottom: -1px;
    }
    /* Workaround Gecko problem on page break */
    [data-vivliostyle-spread-container] [data-vivliostyle-page-container] {
      break-after: auto !important;
      height: 100% !important;
    }
  }
}
`;

/** validation.txt */
export const ValidationTxt = `
/*
 * Copyright 2013 Google, Inc.
 * Copyright 2015 Daishinsha Inc.
 * Copyright 2019 Vivliostyle Foundation
 *
 * CSS property validation.
 */
NUM = POS_NUM | ZERO | NEGATIVE;
NNEG_NUM = POS_NUM | ZERO;
INT = POS_INT | ZERO | NEGATIVE;
NNEG_INT = POS_INT | ZERO;
PERCENTAGE = POS_PERCENTAGE | ZERO | NEGATIVE;
STRICT_PERCENTAGE = POS_PERCENTAGE | ZERO_PERCENTAGE | NEGATIVE;
NNEG_PERCENTAGE = POS_PERCENTAGE | ZERO;
LENGTH = POS_LENGTH | ZERO | NEGATIVE;
NNEG_LENGTH = POS_LENGTH | ZERO;
PLENGTH = LENGTH | PERCENTAGE;
PPLENGTH = POS_LENGTH | ZERO | POS_PERCENTAGE;
ALENGTH = LENGTH | auto;
APLENGTH = PLENGTH | auto;
PAPLENGTH = PPLENGTH | auto;
ANGLE = POS_ANGLE | ZERO | NEGATIVE;
LENGTH_OR_NUM = LENGTH | NUM;
ANGLE_OR_NUM = ANGLE | NUM;
MIN_MAX_FIT_CONTENT = min-content | max-content | fit-content;
BG_POSITION_TERM = PLENGTH | left | center | right | top | bottom;
URI_OR_NONE = URI | none;
IMAGE = URI | IMAGE_FUNCTION | none;
background-attachment = COMMA( [scroll | fixed | local]+ );
background-color = COLOR;
background-image = COMMA( IMAGE+ );
background-position = COMMA( SPACE(BG_POSITION_TERM{1,4})+ ); /* relaxed */
background-repeat = COMMA( [repeat | repeat-x | repeat-y | no-repeat]+ );
border-collapse = collapse | separate;
BORDER_SIDE_COLOR = COLOR;
BORDER_SIDE_STYLE = none | hidden | dotted | dashed | solid | double | groove | ridge | inset | outset;
BORDER_SIDE_WIDTH = thin: 1px | medium: 3px | thick: 5px | NNEG_LENGTH;
border-spacing = LENGTH LENGTH?;
border-top-color = BORDER_SIDE_COLOR;
border-right-color = BORDER_SIDE_COLOR;
border-bottom-color = BORDER_SIDE_COLOR;
border-left-color = BORDER_SIDE_COLOR;
border-top-style = BORDER_SIDE_STYLE;
border-right-style = BORDER_SIDE_STYLE;
border-bottom-style = BORDER_SIDE_STYLE;
border-left-style = BORDER_SIDE_STYLE;
border-top-width = BORDER_SIDE_WIDTH;
border-right-width = BORDER_SIDE_WIDTH;
border-bottom-width = BORDER_SIDE_WIDTH;
border-left-width = BORDER_SIDE_WIDTH;
BORDER_RADIUS = PLENGTH{1,2};
border-top-left-radius = BORDER_RADIUS;
border-top-right-radius = BORDER_RADIUS;
border-bottom-right-radius = BORDER_RADIUS;
border-bottom-left-radius = BORDER_RADIUS;
border-image-source = IMAGE;
border-image-slice = [NUM | PERCENTAGE]{1,4} || fill; /* relaxed */
border-image-width = [NUM | PLENGTH | auto]{1,4};
border-image-outset = [NUM | LENGTH]{1,4};
border-image-repeat = [ stretch | repeat | round | space ]{1,2};
bottom = APLENGTH;
caption-side = top | bottom;
clip = rect(ALENGTH{4}) | rect(SPACE(ALENGTH{4})) | auto;
color = COLOR;
LIST_STYLE_TYPE = IDENT;
TYPE_OR_UNIT_IN_ATTR = string | color | url | integer | number | length | angle | time | frequency;
ATTR = attr(SPACE(IDENT TYPE_OR_UNIT_IN_ATTR?) [ STRING | IDENT | COLOR | INT | NUM | PLENGTH | ANGLE | POS_TIME | FREQUENCY]?);
CONTENT_LIST = [ STRING | URI | counter(IDENT LIST_STYLE_TYPE?) |
    counters(IDENT STRING LIST_STYLE_TYPE?) | ATTR |
    target-counter([ STRING | URI ] IDENT LIST_STYLE_TYPE?) |
    target-counter(ATTR IDENT LIST_STYLE_TYPE?) |
    target-counters([ STRING | URI ] IDENT STRING LIST_STYLE_TYPE?) |
    target-counters(ATTR IDENT STRING LIST_STYLE_TYPE?) |
    target-text([ STRING | URI ] [content | before | after | first-letter]?) |
    target-text(ATTR [content | before | after | first-letter]?) |
    leader([ dotted | solid | space ] | STRING ) |
    open-quote | close-quote | no-open-quote | no-close-quote |
    content([ text | before | after | first-letter ]?) |
    string(IDENT [first | start | last | first-except]?) |
    element(IDENT [first | start | last | first-except]?) ]+;
CONTENT = normal | none | CONTENT_LIST;
content = CONTENT;
COUNTER = [ IDENT INT? ]+ | none;
counter-increment = COUNTER;
counter-reset = COUNTER;
counter-set = COUNTER;
cursor = COMMA(URI* [ auto | crosshair | default | pointer | move | e-resize | ne-resize | nw-resize |
    n-resize | se-resize | sw-resize | s-resize | w-resize | text | wait | help | progress ]);
direction = ltr | rtl;
display = inline | block | list-item | inline-block | table | inline-table | table-row-group |
    table-header-group | table-footer-group | table-row | table-column-group | table-column |
    table-cell | table-caption | none | oeb-page-head | oeb-page-foot | flex | inline-flex |
    ruby | ruby-base | ruby-text | ruby-base-container | ruby-text-container | run-in | compact | marker |
    flow-root | grid | inline-grid | contents;
empty-cells = show | hide;
FAMILY = SPACE(IDENT+) | STRING;
FAMILY_LIST = COMMA( FAMILY+ );
font-family = FAMILY_LIST;
font-size = xx-small | x-small | small | medium | large | x-large | xx-large | larger | smaller | PPLENGTH;
font-style = normal | italic | oblique;
font-weight = normal | bold | bolder | lighter | POS_NUM;
height = PAPLENGTH | MIN_MAX_FIT_CONTENT;
left = APLENGTH;
letter-spacing = normal | LENGTH_OR_NUM;
line-height = normal | POS_NUM | PPLENGTH;
list-style-image = IMAGE;
list-style-position = inside | outside;
list-style-type = LIST_STYLE_TYPE;
margin-right = APLENGTH;
margin-left = APLENGTH;
margin-top = APLENGTH;
margin-bottom = APLENGTH;
NPLENGTH = none | PLENGTH;
max-height = NPLENGTH | MIN_MAX_FIT_CONTENT;
max-width = NPLENGTH | MIN_MAX_FIT_CONTENT;
min-height = APLENGTH | MIN_MAX_FIT_CONTENT;
min-width = APLENGTH | MIN_MAX_FIT_CONTENT;
orphans = POS_INT;
outline-offset = LENGTH;
outline-color = COLOR | invert;
outline-style = BORDER_SIDE_STYLE;
outline-width = BORDER_SIDE_WIDTH;
overflow = visible | hidden | scroll | auto | clip;
padding-right = PPLENGTH;
padding-left = PPLENGTH;
padding-top = PPLENGTH;
padding-bottom = PPLENGTH;
PAGE_BREAK = auto | always | avoid | left | right | recto | verso;
page-break-after = PAGE_BREAK;
page-break-before = PAGE_BREAK;
page-break-inside = avoid | auto;
position = static | relative | absolute | fixed | running(IDENT);
quotes = [STRING STRING]+ | none | auto;
right = APLENGTH;
table-layout = auto | fixed;
text-align = left | right | center | justify | start | end | match-parent | inside | outside;
text-indent = PLENGTH;
text-transform = capitalize | uppercase | lowercase | none;
top = APLENGTH;
vertical-align = baseline | sub | super | top | text-top | middle | bottom | text-bottom | PLENGTH;
visibility = visible | hidden | collapse;
white-space = normal | pre | nowrap | pre-wrap | pre-line | break-spaces;
widows = POS_INT;
width = PAPLENGTH | MIN_MAX_FIT_CONTENT;
word-spacing = normal | LENGTH_OR_NUM;
z-index = auto | INT;

[epub,moz,webkit]hyphens = auto | manual | none;
[webkit]hyphenate-character = auto | STRING;

/* css-logical */
margin-block-start = APLENGTH;
margin-block-end = APLENGTH;
margin-inline-start = APLENGTH;
margin-inline-end = APLENGTH;
padding-block-start = APLENGTH;
padding-block-end = APLENGTH;
padding-inline-start = APLENGTH;
padding-inline-end = APLENGTH;
border-block-start-color = BORDER_SIDE_COLOR;
border-block-end-color = BORDER_SIDE_COLOR;
border-inline-start-color = BORDER_SIDE_COLOR;
border-inline-end-color = BORDER_SIDE_COLOR;
border-block-start-style = BORDER_SIDE_STYLE;
border-block-end-style = BORDER_SIDE_STYLE;
border-inline-start-style = BORDER_SIDE_STYLE;
border-inline-end-style = BORDER_SIDE_STYLE;
border-block-start-width = BORDER_SIDE_WIDTH;
border-block-end-width = BORDER_SIDE_WIDTH;
border-inline-start-width = BORDER_SIDE_WIDTH;
border-inline-end-width = BORDER_SIDE_WIDTH;
block-start = APLENGTH;
block-end = APLENGTH;
inline-start = APLENGTH;
inline-end = APLENGTH;
block-size = PAPLENGTH | MIN_MAX_FIT_CONTENT;
inline-size = PAPLENGTH | MIN_MAX_FIT_CONTENT;
max-block-size = NPLENGTH | MIN_MAX_FIT_CONTENT;
max-inline-size = NPLENGTH | MIN_MAX_FIT_CONTENT;
min-block-size = APLENGTH | MIN_MAX_FIT_CONTENT;
min-inline-size = APLENGTH | MIN_MAX_FIT_CONTENT;

margin-inside = auto | APLENGTH;
margin-outside = auto | APLENGTH;
padding-inside = PPLENGTH;
padding-outside = PPLENGTH;
border-inside-color = BORDER_SIDE_COLOR;
border-outside-color = BORDER_SIDE_COLOR;
border-inside-style = BORDER_SIDE_STYLE;
border-outside-style = BORDER_SIDE_STYLE;
border-inside-width = BORDER_SIDE_WIDTH;
border-outside-width = BORDER_SIDE_WIDTH;
inside = APLENGTH;
outside = APLENGTH;

SHAPE = auto | rectangle( PLENGTH{4} ) |  ellipse( PLENGTH{4} ) |  circle( PLENGTH{3} ) |
    polygon( SPACE(PLENGTH+)+ );
[epubx]shape-inside = SHAPE;
[epubx,webkit]shape-outside = SHAPE;
[epubx]wrap-flow = auto | both | start | end | maximum | clear | around /* epub al */;

TRANSFORM_FUNCTION = matrix(NUM{6}) | translate(PLENGTH{1,2}) | translateX(PLENGTH) | translateY(PLENGTH) |
 scale(NUM{1,2}) | scaleX(NUM) | scaleY(NUM) | rotate(ANGLE) | skewX(ANGLE) | skewY(ANGLE);
[epub]transform = none | TRANSFORM_FUNCTION+;
[epub]transform-origin = [[[ top | bottom | left | right] PLENGTH?] | center | PLENGTH]{1,2}; /* relaxed */

BOX = border-box | padding-box | content-box;
SHADOW = SPACE(inset || LENGTH{2,4} || COLOR); /* relaxed */
[webkit]background-size = COMMA( SPACE( [PLENGTH | auto ]{1,2} | cover | contain)+ );
[webkit]background-origin = COMMA( BOX+ );
[webkit]background-clip = COMMA( BOX+ );
[webkit]box-shadow = none | COMMA( SHADOW+ );
text-shadow = none |  COMMA( SHADOW+ );
[webkit]box-decoration-break = slice | clone;
FILTER_FUNCTION = blur(LENGTH) | brightness(NUM | PERCENTAGE) | contrast(NUM | PERCENTAGE) | drop-shadow(SPACE(LENGTH{2,3} COLOR?))
                | grayscale(NUM | PERCENTAGE) | hue-rotate(ANGLE) | invert(NUM | PERCENTAGE) | opacity(NUM | PERCENTAGE)
                | saturate(NUM | PERCENTAGE) | sepia(NUM | PERCENTAGE);
FILTER_FUNCTION_LIST = FILTER_FUNCTION+;
[webkit]filter = none | FILTER_FUNCTION_LIST;

opacity = NUM;

[moz,webkit]column-width = LENGTH | auto;
[moz,webkit]column-count = INT | auto;
[moz,webkit]column-gap = LENGTH | normal;
[moz,webkit]column-rule-color = COLOR;
[moz,webkit]column-rule-style = BORDER_SIDE_STYLE;
[moz,webkit]column-rule-width = BORDER_SIDE_WIDTH;
BREAK = auto | avoid | avoid-page | page | left | right | recto | verso | avoid-column | column | avoid-region | region;
break-before = BREAK;
break-after = BREAK;
break-inside = auto | avoid | avoid-page | avoid-column | avoid-region;
[webkit]column-span = none | auto | all;
[moz]column-fill = auto | balance | balance-all;
margin-break = auto | keep | discard;

src = COMMA([SPACE(URI format(STRING+)?) | local(FAMILY)]+); /* for font-face */

[epubx,webkit]flow-from = IDENT;
[epubx,webkit]flow-into = IDENT;
[epubx]flow-linger = INT | none;
[epubx]flow-priority = INT;
[epubx]flow-options = none | [ exclusive || last || static ];
[epubx]page = INT | auto | IDENT; /* page: IDENT is for CSS Paged Media */
[epubx]min-page-width = LENGTH;
[epubx]min-page-height = LENGTH;
[epubx]required = true | false;
[epubx]enabled = true | false;
[epubx]conflicting-partitions = COMMA(IDENT+);
[epubx]required-partitions = COMMA(IDENT+);
[epubx]snap-height = LENGTH | none;
[epubx]snap-width = LENGTH | none;
[epubx]flow-consume = all | some;
[epubx]utilization = NUM;
[epubx]text-zoom = font-size | scale;

[adapt]template = URI_OR_NONE | footnote;
[adapt]behavior = IDENT;

/* CSS Fonts */
COMMON_LIG_VALUES        = [ common-ligatures | no-common-ligatures ];
DISCRETIONARY_LIG_VALUES = [ discretionary-ligatures | no-discretionary-ligatures ];
HISTORICAL_LIG_VALUES    = [ historical-ligatures | no-historical-ligatures ];
CONTEXTUAL_ALT_VALUES    = [ contextual | no-contextual ];
font-variant-ligatures = normal | none | [ COMMON_LIG_VALUES || DISCRETIONARY_LIG_VALUES || HISTORICAL_LIG_VALUES || CONTEXTUAL_ALT_VALUES ];
font-variant-caps = normal | small-caps | all-small-caps | petite-caps | all-petite-caps | unicase | titling-caps;
NUMERIC_FIGURE_VALUES   = [ lining-nums | oldstyle-nums ];
NUMERIC_SPACING_VALUES  = [ proportional-nums | tabular-nums ];
NUMERIC_FRACTION_VALUES = [ diagonal-fractions | stacked-fractions ];
font-variant-numeric = normal | [ NUMERIC_FIGURE_VALUES || NUMERIC_SPACING_VALUES || NUMERIC_FRACTION_VALUES || ordinal || slashed-zero ];
EAST_ASIAN_VARIANT_VALUES = [ jis78 | jis83 | jis90 | jis04 | simplified | traditional ];
EAST_ASIAN_WIDTH_VALUES   = [ full-width | proportional-width ];
font-variant-east-asian = normal | [ EAST_ASIAN_VARIANT_VALUES || EAST_ASIAN_WIDTH_VALUES || ruby ];
font-variant_css2 = normal | small-caps; /* for font shorthand */
font-size-adjust = none | NNEG_NUM;
[webkit]font-kerning = auto | normal | none;
font-feature-settings = COMMA( normal | SPACE( STRING [ on | off | INT ]? )+ );
FONT_STRETCH_CSS3_VALUES = normal | wider | narrower | ultra-condensed | extra-condensed | condensed | semi-condensed | semi-expanded | expanded | extra-expanded | ultra-expanded;
font-stretch = FONT_STRETCH_CSS3_VALUES | PERCENTAGE;
font-stretch_css3 = FONT_STRETCH_CSS3_VALUES; /* for font shorthand */
font-display = [ auto | block | swap | fallback | optional ];
unicode-range = COMMA( URANGE+ );

/* CSS Images */
image-resolution = RESOLUTION;
object-fit = fill | contain | cover | none | scale-down;
object-position = COMMA( SPACE(BG_POSITION_TERM{1,4})+ ); /* relaxed */

/* CSS Paged Media */
PAGE_SIZE = a10 | a9 | a8 | a7 | a6 | a5 | a4 | a3 | a2 | a1 | a0
          | b10 | b9 | b8 | b7 | b6 | b5 | b4 | b3 | b2 | b1 | b0
          | c10 | c9 | c8 | c7 | c6 | c5 | c4 | c3 | c2 | c1 | c0
          | jis-b10 | jis-b9 | jis-b8 | jis-b7 | jis-b6 | jis-b5 | jis-b4 | jis-b3 | jis-b2 | jis-b1 | jis-b0
          | letter | legal | ledger;
bleed = auto | LENGTH;
marks = none | [ crop || cross ];
size = POS_LENGTH{1,2} | auto | [ PAGE_SIZE || [ portrait | landscape ] ];
crop-offset = auto | LENGTH;
crop-marks-line-color = auto | COLOR;

/* CSS Page Floats */
clear = none | left | right | top | bottom | inline-start | inline-end | block-start | block-end | inside | outside | both | all | same | column | region | page;
float-reference = inline | column | region | page;
float = none | footnote | [ block-start || block-end || inline-start || inline-end || snap-block || snap-inline || left || right || top || bottom || inside || outside ];
float-min-wrap-block = PPLENGTH;

/* CSS Ruby */
ruby-align = start | center | space-between | space-around;
ruby-position = over | under | inter-character;

/* CSS Size Adjust */
[moz,webkit]text-size-adjust = auto | none | POS_PERCENTAGE;

/* CSS Text */
[webkit]line-break = auto | loose | normal | strict | anywhere;
overflow-wrap = normal | break-word | anywhere;
[moz]tab-size = NNEG_INT | NNEG_LENGTH;
[moz]text-align-last = auto | start | end | left | right | center | justify | inside | outside;
text-justify = auto | none | inter-word | inter-character;
word-break = normal | keep-all | break-all | break-word;
text-spacing-trim = auto | normal | space-all | trim-both | trim-auto |
    [[ trim-start | space-start | space-first ] ||
     [ trim-end | space-end | allow-end ] ||
     [ trim-adjacent | space-adjacent ]];
text-autospace = normal | auto | no-autospace |
    [[ ideograph-alpha || ideograph-numeric || punctuation ] || [ insert | replace ]];
hanging-punctuation = none | [ first || [ force-end | allow-end ] || last ];

/* CSS Text Decoration */
[webkit]text-decoration-color = COLOR;
[webkit]text-decoration-line = none | [ underline || overline || line-through || blink ];
[webkit]text-decoration-skip = none | [ objects || spaces || ink || edges || box-decoration ];
[webkit]text-decoration-style = solid | double | dotted | dashed | wavy;
[webkit]text-decoration-thickness = from-font | APLENGTH;
[epub,webkit]text-emphasis-color = COLOR;
[webkit]text-emphasis-position = [ over | under ] [ right | left ];
[epub,webkit]text-emphasis-style = none | [[ filled | open ] || [ dot | circle | double-circle | triangle | sesame ]] | STRING;
[webkit]text-underline-position = auto | [ under || [ left | right ]];

/* CSS Transforms */
[webkit]backface-visibility = visible | hidden;

/* CSS UI */
[moz,webkit]box-sizing = content-box | padding-box | border-box;
text-overflow = [clip | ellipsis | STRING]{1,2};

/* CSS Writing Modes */
[epub,webkit]text-combine = none | horizontal;
text-combine-upright = none | all; /* relaxed */
[epub,webkit]text-orientation = mixed | upright | sideways-right | sideways-left | sideways | use-glyph-orientation /* the following values are kept for backward-compatibility */ | vertical-right | rotate-right | rotate-left | rotate-normal | auto;
unicode-bidi = normal | embed | isolate | bidi-override | isolate-override | plaintext;
[epub,webkit]writing-mode = horizontal-tb | vertical-rl | lr-tb | rl-tb | tb-rl | lr | rl | tb;

/* CSS Flex box */
FLEX_BASIS = content | PAPLENGTH;
flex-direction = row | row-reverse | column | column-reverse;
flex-wrap = nowrap | wrap | wrap-reverse;
order = INT;
flex-grow = NNEG_NUM;
flex-shrink = NNEG_NUM;
flex-basis = FLEX_BASIS;
flex = none | [ [ NNEG_NUM NNEG_NUM? ] || FLEX_BASIS ];
justify-content = flex-start | flex-end | center | space-between | space-around;
align-items = flex-start | flex-end | center | baseline | stretch;
align-self = auto | flex-start | flex-end | center | baseline | stretch;
align-content = flex-start | flex-end | center | space-between | space-around | stretch;

/* Pointer Events */
touch-action = auto | none | [ pan-x || pan-y ] | manipulation;

/* SVG 2 */
OPACITY_VALUE = NUM | PERCENTAGE;
DASH_ARRAY = COMMA( SPACE( [ LENGTH | PERCENTAGE | NUM ]+ )+ );
PAINT = none | child | child(INT) | COLOR | SPACE( URI [none | COLOR]? ) | context-fill | context-stroke;
color-interpolation = auto | sRGB | linearRGB;
color-rendering = auto | optimizeSpeed | optimizeQuality;
fill = PAINT;
fill-opacity = OPACITY_VALUE;
fill-rule = nonzero | evenodd;
glyph-orientation-vertical = auto | NUM | ANGLE;
image-rendering = auto | optimizeSpeed | optimizeQuality | crisp-edges | pixelated;
marker-start = none | URI;
marker-mid = none | URI;
marker-end = none | URI;
pointer-events = bounding-box | visiblePainted | visibleFill | visibleStroke | visible | painted | fill | stroke | all | none;
paint-order = normal | [ fill || stroke || markers ];
shape-rendering = auto | optimizeSpeed | crispEdges | geometricPrecision;
stop-color = COLOR;
stop-opacity = OPACITY_VALUE;
stroke = PAINT;
stroke-dasharray = none | DASH_ARRAY;
stroke-dashoffset = PERCENTAGE | LENGTH_OR_NUM;
stroke-linecap = butt | round | square;
stroke-linejoin = miter | round | bevel;
stroke-miterlimit = NUM;
stroke-opacity = OPACITY_VALUE;
stroke-width = PERCENTAGE | LENGTH_OR_NUM;
text-anchor = start | middle | end;
text-rendering = auto | optimizeSpeed | optimizeLegibility | geometricPrecision;
vector-effect = none | SPACE( [ non-scaling-stroke | non-scaling-size | non-rotation | fixed-position ]+ [ viewport | screen ]? );

/* SVG 1.1 */
alignment-baseline = auto | baseline | before-edge | text-before-edge | middle | central | after-edge | text-after-edge | ideographic | alphabetic | hanging | mathematical;
baseline-shift = baseline | sub | super | PERCENTAGE | LENGTH_OR_NUM;
dominant-baseline = auto | use-script | no-change | reset-size | ideographic | alphabetic | hanging | mathematical | central | middle | text-after-edge | text-before-edge;
mask = none | URI;

/* css-masking-1 */
SHAPE_RADIUS = PLENGTH | closest-side | farthest-side;
FILL_RULE = nonzero | evenodd;
SHAPE_BOX = BOX | margin-box;
GEOMETRY_BOX = SHAPE_BOX | fill-box | stroke-box | view-box;
BASIC_SHAPE =
    inset( SPACE( PLENGTH{1,4} [ round PLENGTH{1,4} [ SLASH PLENGTH{1,4} ]? ]? ) )
  | circle(  SPACE( [SHAPE_RADIUS]?    [at BG_POSITION_TERM{1,4}]? ) )
  | ellipse( SPACE( SHAPE_RADIUS{2}? [at BG_POSITION_TERM{1,4}]? ) )
  | polygon( FILL_RULE? COMMA( SPACE( PLENGTH{2} )+ )+ );
[webkit]clip-path = none | URI | [ BASIC_SHAPE || GEOMETRY_BOX ];
clip-rule = nonzero | evenodd;

/* filters */
flood-color = COLOR;
flood-opacity = OPACITY_VALUE;
lighting-color = COLOR;

/* compositing-1 */
BLEND_MODE = normal | multiply | screen | overlay | darken | lighten | color-dodge | color-burn | hard-light | soft-light | difference | exclusion | hue | saturation | color | luminosity;
mix-blend-mode = BLEND_MODE;
isolation = auto | isolate;
background-blend-mode = COMMA( BLEND_MODE+ );

/* CSS GCPM */
string-set = COMMA( SPACE( IDENT CONTENT_LIST )+ | none );
footnote-policy = auto | line;

/* CSS Repeated Headers and Footers */
[viv]repeat-on-break = auto | none | header | footer;

/* Compatibility */
[webkit]text-fill-color = COLOR;
[webkit]text-stroke-color = COLOR;
[webkit]text-stroke-width = BORDER_SIDE_WIDTH;

DEFAULTS

background-attachment: scroll;
background-color: transparent;
background-image: none;
background-repeat: repeat;
background-position: 0% 0%;
background-clip: border-box;
background-origin: padding-box;
background-size: auto;
border-top-color: currentColor;
border-right-color: currentColor;
border-bottom-color: currentColor;
border-left-color: currentColor;
border-top-style: none;
border-right-style: none;
border-bottom-style: none;
border-left-style: none;
border-top-width: 3px;
border-right-width: 3px;
border-bottom-width: 3px;
border-left-width: 3px;
border-top-left-radius: 0;
border-top-right-radius: 0;
border-bottom-right-radius: 0;
border-bottom-left-radius: 0;
border-image-source: none;
border-image-slice: 100%;
border-image-width: 1;
border-image-outset: 0;
border-image-repeat: stretch;
column-count: auto;
column-gap: normal;
column-width: auto;
column-rule-color: currentColor;
column-rule-style: none;
column-rule-width: 3px;
column-fill: balance;
outline-color: currentColor;
outline-style: none;
outline-width: 3px;
flex-direction: row;
flex-wrap: nowrap;
font-family: serif;
font-style: normal;
font-size: medium;
font-size-adjust: none;
font-kerning: auto;
font-feature-settings: normal;
font-variant-ligatures: normal;
font-variant-caps: normal;
font-variant-numeric: normal;
font-variant-east-asian: normal;
font-weight: normal;
font-stretch: normal;
line-height: normal;
list-style-image: none;
list-style-position: outside;
list-style-type: disc;
margin-bottom: auto;
margin-left: auto;
margin-right: auto;
margin-top: auto;
padding-bottom: auto;
padding-left: auto;
padding-right: auto;
padding-top: auto;
text-autospace: normal;
text-emphasis-color: currentColor;
text-emphasis-style: none;
text-spacing-trim: normal;
text-stroke-color: currentColor;
text-stroke-width: 0;
marker-start: none;
marker-mid: none;
marker-end: none;

/* css-logical */
border-block-start-color: currentColor;
border-block-end-color: currentColor;
border-inline-start-color: currentColor;
border-inline-end-color: currentColor;
border-inside-color: currentColor;
border-outside-color: currentColor;
border-block-start-style: none;
border-block-end-style: none;
border-inline-start-style: none;
border-inline-end-style: none;
border-inside-style: none;
border-outside-style: none;
border-block-start-width: 3px;
border-block-end-width: 3px;
border-inline-start-width: 3px;
border-inline-end-width: 3px;
border-inside-width: 3px;
border-outside-width: 3px;

SHORTHANDS

all = ALL;
background = COMMA background-image [background-position [ / background-size ]] background-repeat
     background-attachment [background-origin background-clip] background-color; /* background-color is a special case, see the code */
border-top = border-top-width border-top-style border-top-color;
border-right = border-right-width border-right-style border-right-color;
border-bottom = border-bottom-width border-bottom-style border-bottom-color;
border-left = border-left-width border-left-style border-left-color;
border-inside = border-inside-width border-inside-style border-inside-color;
border-outside = border-outside-width border-outside-style border-outside-color;
border-width = INSETS border-top-width border-right-width border-bottom-width border-left-width;
border-style = INSETS border-top-style border-right-style border-bottom-style border-left-style;
border-color = INSETS border-top-color border-right-color border-bottom-color border-left-color;
border = border-width border-style border-color;
border-image = border-image-source border-image-slice [ / border-image-width [ / border-image-outset ] ]
     border-image-repeat;
border-radius = INSETS_SLASH border-top-left-radius border-top-right-radius
     border-bottom-right-radius border-bottom-left-radius;
[moz,webkit]columns = column-width column-count;
[moz,webkit]column-rule = column-rule-width column-rule-style column-rule-color;
flex-flow = flex-direction flex-wrap;
oeb-column-number = column-count;
outline = outline-width outline-style outline-color;
list-style = list-style-position list-style-type list-style-image;
margin = INSETS margin-top margin-right margin-bottom margin-left;
padding = INSETS padding-top padding-right padding-bottom padding-left;
font = FONT font-style font-variant_css2 font-weight font-stretch_css3 /* font-size line-height font-family are special-cased */;
font-variant = font-variant-ligatures font-variant-caps font-variant-numeric font-variant-east-asian;
[epub,webkit]text-emphasis = text-emphasis-style text-emphasis-color;
marker = INSETS marker-start marker-mid marker-end;
[webkit]text-stroke = text-stroke-width text-stroke-color;
text-decoration = text-decoration-line text-decoration-color text-decoration-style text-decoration-thickness;
text-spacing = TEXT_SPACING text-autospace text-spacing-trim;

/* css-logical */
margin-block = INSETS margin-block-start margin-block-end;
margin-inline = INSETS margin-inline-start margin-inline-end;
padding-block = INSETS padding-block-start padding-block-end;
padding-inline = INSETS padding-inline-start padding-inline-end;
border-block-width = INSETS border-block-start-width border-block-end-width;
border-block-style = INSETS border-block-start-style border-block-end-style;
border-block-color = INSETS border-block-start-color border-block-end-color;
border-inline-width = INSETS border-inline-start-width border-inline-end-width;
border-inline-style = INSETS border-inline-start-style border-inline-end-style;
border-inline-color = INSETS border-inline-start-color border-inline-end-color;
border-block = border-block-width border-block-style border-block-color;
border-inline = border-inline-width border-inline-style border-inline-color;
border-block-start = border-block-start-width border-block-start-style border-block-start-color;
border-block-end = border-block-end-width border-block-end-style border-block-end-color;
border-inline-start = border-inline-start-width border-inline-start-style border-inline-start-color;
border-inline-end = border-inline-end-width border-inline-end-style border-inline-end-color;
inset-block-start = block-start;
inset-block-end = block-end;
inset-inline-start = inline-start;
inset-inline-end = inline-end;
inset-inside = inside;
inset-outside = outside;
inset-block = INSETS block-start block-end;
inset-inline = INSETS inline-start inline-end;
inset = INSETS top right bottom left;

/* old names  */
word-wrap = overflow-wrap;
[adapt,webkit]margin-before = margin-block-start;
[adapt,webkit]margin-after = margin-block-end;
[adapt,webkit]margin-start = margin-inline-start;
[adapt,webkit]margin-end = margin-inline-end;
[adapt,webkit]padding-before = padding-block-start;
[adapt,webkit]padding-after = padding-block-end;
[adapt,webkit]padding-start = padding-inline-start;
[adapt,webkit]padding-end = padding-inline-end;
[adapt,webkit]border-before-color = border-block-start-color;
[adapt,webkit]border-after-color = border-block-end-color;
[adapt,webkit]border-start-color = border-inline-start-color;
[adapt,webkit]border-end-color = border-inline-end-color;
[adapt,webkit]border-before-style = border-block-start-style;
[adapt,webkit]border-after-style = border-block-end-style;
[adapt,webkit]border-start-style = border-inline-start-style;
[adapt,webkit]border-end-style = border-inline-end-style;
[adapt,webkit]border-before-width = border-block-start-width;
[adapt,webkit]border-after-width = border-block-end-width;
[adapt,webkit]border-start-width = border-inline-start-width;
[adapt,webkit]border-end-width = border-inline-end-width;
[adapt,webkit]before = block-start;
[adapt,webkit]after = block-end;
[adapt,webkit]start = inline-start;
[adapt,webkit]end = inline-end;

`;

/** user-agent.xml */
export const UserAgentXml = `
<!DOCTYPE html>
<html xmlns="http://www.w3.org/1999/xhtml" xmlns:s="http://www.pyroxy.com/ns/shadow">
<head>
<style><![CDATA[

.-vivliostyle-footnote-content {
  float: footnote;
}

.-vivliostyle-table-cell-container {
  display: block;
}

]]></style>
</head>
<body>

<s:template id="footnote"><s:content/><s:include class="-vivliostyle-footnote-content"/></s:template>

<s:template id="table-cell"><div data-vivliostyle-flow-root="true" class="-vivliostyle-table-cell-container"><s:content/></div></s:template>

</body>
</html>`;

/** user-agent-page.css */
export const UserAgentPageCss = `
@namespace "http://www.w3.org/1999/xhtml";

:root {
  hyphens: -epubx-expr(pref-hyphenate? "auto": "manual");
}
:root[data-vivliostyle-epub-spine-properties~="page-spread-left"] {
  break-before: left;
}
:root[data-vivliostyle-epub-spine-properties~="page-spread-right"] {
  break-before: right;
}

@-adapt-footnote-area {
  display: block;
  margin-block-start: 0.5em;
  margin-block-end: 0.5em;
}

@-adapt-footnote-area ::before {
  display: block;
  border-block-start-width: 1px;
  border-block-start-style: solid;
  border-block-start-color: black;
  margin-block-end: 0.4em;
  margin-inline-start: 0;
  margin-inline-end: 60%;
}

/* default page master */
@-epubx-page-master :background-host {
  @-epubx-partition :layout-host {
    -epubx-flow-from: body;
    top: -epubx-expr(header.margin-bottom-edge);
    bottom: -epubx-expr(page-height - footer.margin-top-edge);
    left: 0px;
    right: 0px;
    column-width: 25em;
  }
  @-epubx-partition footer :oeb-page-foot {
    writing-mode: horizontal-tb;
    -epubx-flow-from: oeb-page-foot;
    bottom: 0px;
    left: 0px;
    right: 0px;
  }
  @-epubx-partition header :oeb-page-head {
    writing-mode: horizontal-tb;
    -epubx-flow-from: oeb-page-head;
    top: 0px;
    left: 0px;
    right: 0px;
  }
}

@page {
  @top-left-corner {
    text-align: right;
    vertical-align: middle;
  }
  @top-left {
    text-align: left;
    vertical-align: middle;
  }
  @top-center {
    text-align: center;
    vertical-align: middle;
  }
  @top-right {
    text-align: right;
    vertical-align: middle;
  }
  @top-right-corner {
    text-align: left;
    vertical-align: middle;
  }
  @left-top {
    text-align: center;
    vertical-align: top;
  }
  @left-middle {
    text-align: center;
    vertical-align: middle;
  }
  @left-bottom {
    text-align: center;
    vertical-align: bottom;
  }
  @right-top {
    text-align: center;
    vertical-align: top;
  }
  @right-middle {
    text-align: center;
    vertical-align: middle;
  }
  @right-bottom {
    text-align: center;
    vertical-align: bottom;
  }
  @bottom-left-corner {
    text-align: right;
    vertical-align: middle;
  }
  @bottom-left {
    text-align: left;
    vertical-align: middle;
  }
  @bottom-center {
    text-align: center;
    vertical-align: middle;
  }
  @bottom-right {
    text-align: right;
    vertical-align: middle;
  }
  @bottom-right-corner {
    text-align: left;
    vertical-align: middle;
  }
}

@media print {
  @page {
    margin: 10%;
  }
}
`;

/** user-agent-base.css */
export const UserAgentBaseCss = `
@namespace "http://www.w3.org/1999/xhtml";
@namespace m "http://www.w3.org/1998/Math/MathML";
@namespace epub "http://www.idpf.org/2007/ops";

html,
address,
blockquote,
body,
dd,
div,
dl,
dt,
fieldset,
form,
frame,
frameset,
h1,
h2,
h3,
h4,
h5,
h6,
noframes,
ol,
p,
ul,
center,
dir,
hr,
menu,
pre,
details,
dialog,
legend,
listing,
optgroup,
option,
plaintext,
search,
xmp,
article,
section,
nav,
aside,
hgroup,
footer,
header,
figure,
figcaption,
main {
  display: block;
}
li {
  display: list-item;
}
head {
  display: none !important;
}
table {
  display: table;
}
tr {
  display: table-row;
}
thead {
  display: table-header-group;
  break-after: avoid;
}
tbody {
  display: table-row-group;
}
tfoot {
  display: table-footer-group;
  break-before: avoid;
}
col {
  display: table-column;
}
colgroup {
  display: table-column-group;
}
td,
th {
  display: table-cell;
}
caption {
  display: table-caption;
  text-align: center;
}
th {
  font-weight: bolder;
  text-align: center;
}
*[hidden],
link,
style,
script {
  display: none;
}
h1 {
  font-size: 2em;
  margin-block: 0.67em;
}
h2 {
  font-size: 1.5em;
  margin-block: 0.83em;
}
h3 {
  font-size: 1.17em;
  margin-block: 1em;
}
h4 {
  font-size: 1em;
  margin-block: 1.33em;
}
h5 {
  font-size: 0.83em;
  margin-block: 1.67em;
}
h6 {
  font-size: 0.67em;
  margin-block: 2.33em;
}
h1,
h2,
h3,
h4,
h5,
h6 {
  font-weight: bold;
  break-after: avoid;
}
p,
blockquote,
figure,
ul,
ol,
dl,
dir,
menu {
  margin-block: 1em;
}
b,
strong {
  font-weight: bolder;
}
blockquote,
figure {
  margin-inline: 40px;
}
i,
cite,
dfn,
em,
var,
address {
  font-style: italic;
}
pre,
tt,
code,
kbd,
samp {
  font-family: monospace;
  text-spacing: none;
  hanging-punctuation: none;
}
listing,
plaintext,
xmp,
pre {
  white-space: pre;
}
pre[wrap] {
  white-space: pre-wrap;
}
button,
textarea,
input,
select {
  display: inline-block;
}
big {
  font-size: 1.17em;
}
small,
sub,
sup {
  font-size: 0.83em;
}
sub {
  vertical-align: sub;
}
sup {
  vertical-align: super;
}
table {
  box-sizing: border-box;
  border-spacing: 2px;
  border-collapse: separate;
  text-indent: initial;
}
thead,
tbody,
tfoot,
table > tr {
  vertical-align: middle;
}
tr,
td,
th {
  vertical-align: inherit;
}
s,
strike,
del {
  text-decoration: line-through;
}
hr {
  border-style: inset;
  border-width: 1px;
  margin-block: 0.5em;
}
hr[color],
hr[noshade] {
  border-style: solid;
}
ol,
ul,
dir,
menu {
  padding-inline-start: 40px;
}
dd {
  margin-inline-start: 40px;
}
ol ul,
ul ol,
ul ul,
ol ol {
  margin-block: 0;
}
u,
ins {
  text-decoration: underline;
}
center {
  text-align: center;
}
q::before {
  content: open-quote;
}
q::after {
  content: close-quote;
}

ruby {
  display: ruby;
}
rp {
  display: none;
}
rbc {
  display: ruby-base-container;
}
rtc {
  display: ruby-text-container;
}
rb {
  display: ruby-base;
  white-space: nowrap;
}
rt {
  display: ruby-text;
}
rtc,
rt {
  text-emphasis: none;
  white-space: nowrap;
  line-height: 1;
}
rtc,
rt {
  font-size: 50%;
}
rtc:lang(zh-TW),
rt:lang(zh-TW) {
  font-size: 30%;
}
rtc > rt,
rtc > rt:lang(zh-TW) {
  font-size: 100%;
}

/* Bidi settings */
bdo[dir="ltr"] {
  direction: ltr;
  unicode-bidi: bidi-override;
}
bdo[dir="rtl"] {
  direction: rtl;
  unicode-bidi: bidi-override;
}
*[dir="ltr"] {
  direction: ltr;
  unicode-bidi: isolate;
}
*[dir="rtl"] {
  direction: rtl;
  unicode-bidi: isolate;
}

/* MathML */
m|math[display="block"] {
  display: block;
  display: block math;
}

/*------------------ epub-specific ---------------------*/

a[epub|type="noteref"],
a[epub\\:type="noteref"] {
  font-size: 0.75em;
  vertical-align: super;
  line-height: 0.01;
}

a[epub|type="noteref"]:href-epub-type(footnote, aside),
a[epub\\:type="noteref"]:href-epub-type(footnote, aside) {
  -adapt-template: footnote;
  text-decoration: none;
}

aside[epub|type="footnote"],
aside[epub\\:type="footnote"] {
  display: none;
}

aside[epub|type="footnote"]:footnote-content,
aside[epub\\:type="footnote"]:footnote-content {
  display: block;
  margin: 0.25em;
  font-size: 1.2em;
  line-height: 1.2;
}

epub|trigger {
  display: none;
}

epub|switch {
  display: inline;
}

epub|default {
  display: inline;
}

epub|case {
  display: none;
}

epub|case[required-namespace::supported] {
  display: inline;
}

epub|case[required-namespace::supported] ~ epub|case {
  display: none;
}

epub|case[required-namespace::supported] ~ epub|default {
  display: none;
}
`;

/** user-agent-toc.css */
export const UserAgentTocCss = `
@namespace "http://www.w3.org/1999/xhtml";

*:not([data-vivliostyle-role=doc-toc],
  [data-vivliostyle-role=doc-toc] *,
  :has([data-vivliostyle-role=doc-toc]),
  :is(h1,h2,h3,h4,h5,h6):has(+:not(nav)[data-vivliostyle-role=doc-toc])) {
  display: none;
}

[hidden] {
  display: revert;
}

[data-vivliostyle-role=doc-toc] li a {
  -adapt-behavior: toc-node-anchor;
}

[data-vivliostyle-role=doc-toc] li {
  -adapt-behavior: toc-node;
}

[data-vivliostyle-role=doc-toc] li > :not(ul,ol):first-child {
  -adapt-behavior: toc-node-first-child;
}

[data-vivliostyle-role=doc-toc] :is(ol,ul),
[data-vivliostyle-role=doc-toc]:is(ol,ul) {
  -adapt-behavior: toc-container;
}
`;

/** vivliostyle-polyfill.css */
export const VivliostylePolyfillCss = `
[data-viv-margin-discard~="block-start"] {
  margin-block-start: 0 !important;
}
[data-viv-margin-discard~="block-end"] {
  margin-block-end: 0 !important;
}
[data-viv-margin-discard~="inline-start"] {
  margin-inline-start: 0 !important;
}
[data-viv-margin-discard~="inline-end"] {
  margin-inline-end: 0 !important;
}

[data-viv-box-break~="inline-start"]:not([data-viv-box-break~="clone"]) {
  margin-inline-start: 0 !important;
  padding-inline-start: 0 !important;
  border-inline-start-width: 0 !important;
  border-start-start-radius: 0 !important;
  border-end-start-radius: 0 !important;
}
[data-viv-box-break~="inline-end"]:not([data-viv-box-break~="clone"]) {
  margin-inline-end: 0 !important;
  padding-inline-end: 0 !important;
  border-inline-end-width: 0 !important;
  border-start-end-radius: 0 !important;
  border-end-end-radius: 0 !important;
}
[data-viv-box-break~="block-start"]:not([data-viv-box-break~="clone"]):not(table[style*="border-collapse: collapse"]:has(>thead)) {
  margin-block-start: 0 !important;
  padding-block-start: 0 !important;
  border-block-start-width: 0 !important;
  border-start-start-radius: 0 !important;
  border-start-end-radius: 0 !important;
}
[data-viv-box-break~="block-end"]:not([data-viv-box-break~="clone"]):not(table[style*="border-collapse: collapse"]:has(>tfoot)) {
  margin-block-end: 0 !important;
  padding-block-end: 0 !important;
  border-block-end-width: 0 !important;
  border-end-start-radius: 0 !important;
  border-end-end-radius: 0 !important;
}
[data-viv-box-break~="block-start"][data-viv-box-break~="text-start"] {
  text-indent: 0 !important;
}
[data-viv-box-break~="block-end"][data-viv-box-break~="text-end"][data-viv-box-break~="justify"] {
  text-align-last: justify !important;
}
[data-viv-box-break~="block-end"][data-viv-box-break~="text-end"][data-viv-box-break~="justify"] > * {
  text-align-last: auto;
}
[data-viv-box-break~="block-end"][data-viv-box-break~="text-end"]:not([data-viv-box-break~="justify"]) {
  text-align-last: auto !important;
}

span.viv-anonymous-block {
  display: block;
}

[data-vivliostyle-page-container] {
  text-spacing-trim: space-all;
  text-autospace: no-autospace;
}
viv-ts-open.viv-ts-auto > viv-ts-inner,
viv-ts-open.viv-ts-trim > viv-ts-inner {
  margin-inline-start: -0.5em;
}
viv-ts-close.viv-ts-auto > viv-ts-inner,
viv-ts-close.viv-ts-trim > viv-ts-inner {
  letter-spacing: -0.5em;
}
viv-ts-close.viv-hang-end > viv-ts-inner,
viv-ts-close.viv-hang-last > viv-ts-inner {
  letter-spacing: -1em;
}
viv-ts-open.viv-ts-auto::before,
viv-ts-close.viv-ts-auto::after,
viv-ts-close.viv-hang-end::after {
  content: " ";
  font-family: Courier, monospace;
  word-spacing: normal;
  letter-spacing: -0.11em;
  line-height: 0;
  text-orientation: mixed;
  visibility: hidden;
}
viv-ts-close.viv-hang-end:not(.viv-hang-hw)::after {
  letter-spacing: 0.4em;
}
viv-ts-close.viv-hang-hw > viv-ts-inner {
  letter-spacing: -0.5em;
}
viv-ts-open.viv-hang-first > viv-ts-inner {
  display: inline-block;
  line-height: 1;
  inline-size: 1em;
  text-indent: 0;
  text-align: end;
  text-align-last: end;
  margin-inline-start: -1em;
}
viv-ts-thin-sp::after {
  content: " ";
  font-family: Times, serif;
  word-spacing: normal;
  letter-spacing: -0.125em;
  line-height: 0;
  text-orientation: mixed;
  visibility: hidden;
}
[style*=text-decoration] :is(viv-ts-thin-sp, viv-ts-close.viv-ts-auto)::after {
  visibility: visible;
}

span[data-viv-leader] {
  text-combine-upright: none;
  text-orientation: mixed;
  white-space: pre;
}
`;

export const UserAgentCounterStylesCss =
  String.raw`
/* https://drafts.csswg.org/css-counter-styles/#decimal */

/* https://drafts.csswg.org/css-counter-styles/#decimal-leading-zero */
@counter-style decimal-leading-zero {
  system: extends decimal;
  pad: 2 '0';
}

/* https://drafts.csswg.org/css-counter-styles/#valdef-counter-style-name-arabic-indic */
@counter-style arabic-indic {
  system: numeric;
  symbols: "\660" "\661" "\662" "\663" "\664" "\665" "\666" "\667" "\668" "\669";
  /* ٠ ١ ٢ ٣ ٤ ٥ ٦ ٧ ٨ ٩ */
}

/* https://drafts.csswg.org/css-counter-styles/#armenian */
@counter-style armenian {
  system: additive;
  range: 1 9999;
  additive-symbols: 9000 \554, 8000 \553, 7000 \552, 6000 \551, 5000 \550, 4000 \54F, 3000 \54E, 2000 \54D, 1000 \54C, 900 \54B, 800 \54A, 700 \549, 600 \548, 500 \547, 400 \546, 300 \545, 200 \544, 100 \543, 90 \542, 80 \541, 70 \540, 60 \53F, 50 \53E, 40 \53D, 30 \53C, 20 \53B, 10 \53A, 9 \539, 8 \538, 7 \537, 6 \536, 5 \535, 4 \534, 3 \533, 2 \532, 1 \531;
  /* 9000 Ք, 8000 Փ, 7000 Ւ, 6000 Ց, 5000 Ր, 4000 Տ, 3000 Վ, 2000 Ս, 1000 Ռ, 900 Ջ, 800 Պ, 700 Չ, 600 Ո, 500 Շ, 400 Ն, 300 Յ, 200 Մ, 100 Ճ, 90 Ղ, 80 Ձ, 70 Հ, 60 Կ, 50 Ծ, 40 Խ, 30 Լ, 20 Ի, 10 Ժ, 9 Թ, 8 Ը, 7 Է, 6 Զ, 5 Ե, 4 Դ, 3 Գ, 2 Բ, 1 Ա */
}

/* https://drafts.csswg.org/css-counter-styles/#valdef-counter-style-name-upper-armenian */
@counter-style upper-armenian {
  system: extends armenian;
}

/* https://drafts.csswg.org/css-counter-styles/#valdef-counter-style-name-lower-armenian */
@counter-style lower-armenian {
  system: additive;
  range: 1 9999;
  additive-symbols: 9000 "\584", 8000 "\583", 7000 "\582", 6000 "\581", 5000 "\580", 4000 "\57F", 3000 "\57E", 2000 "\57D", 1000 "\57C", 900 "\57B", 800 "\57A", 700 "\579", 600 "\578", 500 "\577", 400 "\576", 300 "\575", 200 "\574", 100 "\573", 90 "\572", 80 "\571", 70 "\570", 60 "\56F", 50 "\56E", 40 "\56D", 30 "\56C", 20 "\56B", 10 "\56A", 9 "\569", 8 "\568", 7 "\567", 6 "\566", 5 "\565", 4 "\564", 3 "\563", 2 "\562", 1 "\561";
  /* 9000 ք, 8000 փ, 7000 ւ, 6000 ց, 5000 ր, 4000 տ, 3000 վ, 2000 ս, 1000 ռ, 900 ջ, 800 պ, 700 չ, 600 ո, 500 շ, 400 ն, 300 յ, 200 մ, 100 ճ, 90 ղ, 80 ձ, 70 հ, 60 կ, 50 ծ, 40 խ, 30 լ, 20 ի, 10 ժ, 9 թ, 8 ը, 7 է, 6 զ, 5 ե, 4 դ, 3 գ, 2 բ, 1 ա */
}

/* https://drafts.csswg.org/css-counter-styles/#valdef-counter-style-name-bengali */
@counter-style bengali {
  system: numeric;
  symbols: "\9E6" "\9E7" "\9E8" "\9E9" "\9EA" "\9EB" "\9EC" "\9ED" "\9EE" "\9EF";
  /* ০ ১ ২ ৩ ৪ ৫ ৬ ৭ ৮ ৯ */
}

/* https://drafts.csswg.org/css-counter-styles/#valdef-counter-style-name-cambodian */
@counter-style cambodian {
  system: numeric;
  symbols: "\17E0" "\17E1" "\17E2" "\17E3" "\17E4" "\17E5" "\17E6" "\17E7" "\17E8" "\17E9";
  /* ០ ១ ២ ៣ ៤ ៥ ៦ ៧ ៨ ៩ */
}

/* https://drafts.csswg.org/css-counter-styles/#valdef-counter-style-name-khmer */
@counter-style khmer {
  system: extends cambodian;
}

/* https://drafts.csswg.org/css-counter-styles/#cjk-decimal */
@counter-style cjk-decimal {
  system: numeric;
  range: 0 infinite;
  symbols: \3007  \4E00  \4E8C  \4E09  \56DB  \4E94  \516D  \4E03  \516B  \4E5D;
  /* 〇 一 二 三 四 五 六 七 八 九 */
  suffix: "\3001";
  /* "、" */
}

/* https://drafts.csswg.org/css-counter-styles/#valdef-counter-style-name-devanagari */
@counter-style devanagari {
  system: numeric;
  symbols: "\966" "\967" "\968" "\969" "\96A" "\96B" "\96C" "\96D" "\96E" "\96F";
  /* ० १ २ ३ ४ ५ ६ ७ ८ ९ */
}

/* https://drafts.csswg.org/css-counter-styles/#georgian */
@counter-style georgian {
  system: additive;
  range: 1 19999;
  additive-symbols: 10000 \10F5, 9000 \10F0, 8000 \10EF, 7000 \10F4, 6000 \10EE, 5000 \10ED, 4000 \10EC, 3000 \10EB, 2000 \10EA, 1000 \10E9, 900 \10E8, 800 \10E7, 700 \10E6, 600 \10E5, 500 \10E4, 400 \10F3, 300 \10E2, 200 \10E1, 100 \10E0, 90 \10DF, 80 \10DE, 70 \10DD, 60 \10F2, 50 \10DC, 40 \10DB, 30 \10DA, 20 \10D9, 10 \10D8, 9 \10D7, 8 \10F1, 7 \10D6, 6 \10D5, 5 \10D4, 4 \10D3, 3 \10D2, 2 \10D1, 1 \10D0;
  /* 10000 ჵ, 9000 ჰ, 8000 ჯ, 7000 ჴ, 6000 ხ, 5000 ჭ, 4000 წ, 3000 ძ, 2000 ც, 1000 ჩ, 900 შ, 800 ყ, 700 ღ, 600 ქ, 500 ფ, 400 ჳ, 300 ტ, 200 ს, 100 რ, 90 ჟ, 80 პ, 70 ო, 60 ჲ, 50 ნ, 40 მ, 30 ლ, 20 კ, 10 ი, 9 თ, 8 ჱ, 7 ზ, 6 ვ, 5 ე, 4 დ, 3 გ, 2 ბ, 1 ა */
}

/* https://drafts.csswg.org/css-counter-styles/#valdef-counter-style-name-gujarati */
@counter-style gujarati {
  system: numeric;
  symbols: "\AE6" "\AE7" "\AE8" "\AE9" "\AEA" "\AEB" "\AEC" "\AED" "\AEE" "\AEF";
  /* ૦ ૧ ૨ ૩ ૪ ૫ ૬ ૭ ૮ ૯ */
}

/* https://drafts.csswg.org/css-counter-styles/#valdef-counter-style-name-gurmukhi */
@counter-style gurmukhi {
  system: numeric;
  symbols: "\A66" "\A67" "\A68" "\A69" "\A6A" "\A6B" "\A6C" "\A6D" "\A6E" "\A6F";
  /* ੦ ੧ ੨ ੩ ੪ ੫ ੬ ੭ ੮ ੯ */
}

/* https://drafts.csswg.org/css-counter-styles/#hebrew */
@counter-style hebrew {
  system: additive;
  range: 1 10999;
  additive-symbols: 10000 \5D9\5F3, 9000 \5D8\5F3, 8000 \5D7\5F3, 7000 \5D6\5F3, 6000 \5D5\5F3, 5000 \5D4\5F3, 4000 \5D3\5F3, 3000 \5D2\5F3, 2000 \5D1\5F3, 1000 \5D0\5F3, 400 \5EA, 300 \5E9, 200 \5E8, 100 \5E7, 90 \5E6, 80 \5E4, 70 \5E2, 60 \5E1, 50 \5E0, 40 \5DE, 30 \5DC, 20 \5DB, 19 \5D9\5D8, 18 \5D9\5D7, 17 \5D9\5D6, 16 \5D8\5D6, 15 \5D8\5D5, 10 \5D9, 9 \5D8, 8 \5D7, 7 \5D6, 6 \5D5, 5 \5D4, 4 \5D3, 3 \5D2, 2 \5D1, 1 \5D0;
  /* 10000 י׳, 9000 ט׳, 8000 ח׳, 7000 ז׳, 6000 ו׳, 5000 ה׳, 4000 ד׳, 3000 ג׳, 2000 ב׳, 1000 א׳, 400 ת, 300 ש, 200 ר, 100 ק, 90 צ, 80 פ, 70 ע, 60 ס, 50 נ, 40 מ, 30 ל, 20 כ, 19 יט, 18 יח, 17 יז, 16 טז, 15 טו, 10 י, 9 ט, 8 ח, 7 ז, 6 ו, 5 ה, 4 ד, 3 ג, 2 ב, 1 א */
  /* This system manually specifies the values for 19-15 to force the correct display of 15 and 16, which are commonly rewritten to avoid a close resemblance to the Tetragrammaton. */
  /* Implementations MAY choose to implement this manually to a higher range; see note below. */
}

/* https://drafts.csswg.org/css-counter-styles/#valdef-counter-style-name-kannada */
@counter-style kannada {
  system: numeric;
  symbols: "\CE6" "\CE7" "\CE8" "\CE9" "\CEA" "\CEB" "\CEC" "\CED" "\CEE" "\CEF";
  /* ೦ ೧ ೨ ೩ ೪ ೫ ೬ ೭ ೮ ೯ */
}

/* https://drafts.csswg.org/css-counter-styles/#valdef-counter-style-name-lao */
@counter-style lao {
  system: numeric;
  symbols: "\ED0" "\ED1" "\ED2" "\ED3" "\ED4" "\ED5" "\ED6" "\ED7" "\ED8" "\ED9";
  /* ໐ ໑ ໒ ໓ ໔ ໕ ໖ ໗ ໘ ໙ */
}

/* https://drafts.csswg.org/css-counter-styles/#valdef-counter-style-name-malayalam */
@counter-style malayalam {
  system: numeric;
  symbols: "\D66" "\D67" "\D68" "\D69" "\D6A" "\D6B" "\D6C" "\D6D" "\D6E" "\D6F";
  /* ൦ ൧ ൨ ൩ ൪ ൫ ൬ ൭ ൮ ൯ */
}

/* https://drafts.csswg.org/css-counter-styles/#valdef-counter-style-name-mongolian */
@counter-style mongolian {
  system: numeric;
  symbols: "\1810" "\1811" "\1812" "\1813" "\1814" "\1815" "\1816" "\1817" "\1818" "\1819";
  /* ᠐ ᠑ ᠒ ᠓ ᠔ ᠕ ᠖ ᠗ ᠘ ᠙ */
}

/* https://drafts.csswg.org/css-counter-styles/#valdef-counter-style-name-myanmar */
@counter-style myanmar {
  system: numeric;
  symbols: "\1040" "\1041" "\1042" "\1043" "\1044" "\1045" "\1046" "\1047" "\1048" "\1049";
  /* ၀ ၁ ၂ ၃ ၄ ၅ ၆ ၇ ၈ ၉ */
}

/* https://drafts.csswg.org/css-counter-styles/#valdef-counter-style-name-oriya */
@counter-style oriya {
  system: numeric;
  symbols: "\B66" "\B67" "\B68" "\B69" "\B6A" "\B6B" "\B6C" "\B6D" "\B6E" "\B6F";
  /* ୦ ୧ ୨ ୩ ୪ ୫ ୬ ୭ ୮ ୯ */
}

/* https://drafts.csswg.org/css-counter-styles/#valdef-counter-style-name-persian */
@counter-style persian {
  system: numeric;
  symbols: "\6F0" "\6F1" "\6F2" "\6F3" "\6F4" "\6F5" "\6F6" "\6F7" "\6F8" "\6F9";
  /* ۰ ۱ ۲ ۳ ۴ ۵ ۶ ۷ ۸ ۹ */
}

/* https://drafts.csswg.org/css-counter-styles/#lower-roman */
@counter-style lower-roman {
  system: additive;
  range: 1 3999;
  additive-symbols: 1000 m, 900 cm, 500 d, 400 cd, 100 c, 90 xc, 50 l, 40 xl, 10 x, 9 ix, 5 v, 4 iv, 1 i;
}

/* https://drafts.csswg.org/css-counter-styles/#upper-roman */
@counter-style upper-roman {
  system: additive;
  range: 1 3999;
  additive-symbols: 1000 M, 900 CM, 500 D, 400 CD, 100 C, 90 XC, 50 L, 40 XL, 10 X, 9 IX, 5 V, 4 IV, 1 I;
}

/* https://drafts.csswg.org/css-counter-styles/#valdef-counter-style-name-tamil */
@counter-style tamil {
  system: numeric;
  symbols: "\BE6" "\BE7" "\BE8" "\BE9" "\BEA" "\BEB" "\BEC" "\BED" "\BEE" "\BEF";
  /* ௦ ௧ ௨ ௩ ௪ ௫ ௬ ௭ ௮ ௯ */
}

/* https://drafts.csswg.org/css-counter-styles/#valdef-counter-style-name-telugu */
@counter-style telugu {
  system: numeric;
  symbols: "\C66" "\C67" "\C68" "\C69" "\C6A" "\C6B" "\C6C" "\C6D" "\C6E" "\C6F";
  /* ౦ ౧ ౨ ౩ ౪ ౫ ౬ ౭ ౮ ౯ */
}

/* https://drafts.csswg.org/css-counter-styles/#valdef-counter-style-name-thai */
@counter-style thai {
  system: numeric;
  symbols: "\E50" "\E51" "\E52" "\E53" "\E54" "\E55" "\E56" "\E57" "\E58" "\E59";
  /* ๐ ๑ ๒ ๓ ๔ ๕ ๖ ๗ ๘ ๙ */
}

/* https://drafts.csswg.org/css-counter-styles/#valdef-counter-style-name-tibetan */
@counter-style tibetan {
  system: numeric;
  symbols: "\F20" "\F21" "\F22" "\F23" "\F24" "\F25" "\F26" "\F27" "\F28" "\F29";
  /* ༠ ༡ ༢ ༣ ༤ ༥ ༦ ༧ ༨ ༩ */
}

/* https://drafts.csswg.org/css-counter-styles/#lower-alpha */
@counter-style lower-alpha {
  system: alphabetic;
  symbols: a b c d e f g h i j k l m n o p q r s t u v w x y z;
}

/* https://drafts.csswg.org/css-counter-styles/#lower-latin */
@counter-style lower-latin {
  system: extends lower-alpha;
}

/* https://drafts.csswg.org/css-counter-styles/#upper-alpha */
@counter-style upper-alpha {
  system: alphabetic;
  symbols: A B C D E F G H I J K L M N O P Q R S T U V W X Y Z;
}

/* https://drafts.csswg.org/css-counter-styles/#upper-latin */
@counter-style upper-latin {
  system: extends upper-alpha;
}

/* https://drafts.csswg.org/css-counter-styles/#lower-greek */
@counter-style lower-greek {
  system: alphabetic;
  symbols: "\3B1" "\3B2" "\3B3" "\3B4" "\3B5" "\3B6" "\3B7" "\3B8" "\3B9" "\3BA" "\3BB" "\3BC" "\3BD" "\3BE" "\3BF" "\3C0" "\3C1" "\3C3" "\3C4" "\3C5" "\3C6" "\3C7" "\3C8" "\3C9";
  /* α β γ δ ε ζ η θ ι κ λ μ ν ξ ο π ρ σ τ υ φ χ ψ ω */
}

/* https://drafts.csswg.org/css-counter-styles/#hiragana */
@counter-style hiragana {
  system: alphabetic;
  symbols: "\3042" "\3044" "\3046" "\3048" "\304A" "\304B" "\304D" "\304F" "\3051" "\3053" "\3055" "\3057" "\3059" "\305B" "\305D" "\305F" "\3061" "\3064" "\3066" "\3068" "\306A" "\306B" "\306C" "\306D" "\306E" "\306F" "\3072" "\3075" "\3078" "\307B" "\307E" "\307F" "\3080" "\3081" "\3082" "\3084" "\3086" "\3088" "\3089" "\308A" "\308B" "\308C" "\308D" "\308F" "\3090" "\3091" "\3092" "\3093";
  /* あ い う え お か き く け こ さ し す せ そ た ち つ て と な に ぬ ね の は ひ ふ へ ほ ま み む め も や ゆ よ ら り る れ ろ わ ゐ ゑ を ん */
  suffix: "、";
}

/* https://drafts.csswg.org/css-counter-styles/#hiragana-iroha */
@counter-style hiragana-iroha {
  system: alphabetic;
  symbols: "\3044" "\308D" "\306F" "\306B" "\307B" "\3078" "\3068" "\3061" "\308A" "\306C" "\308B" "\3092" "\308F" "\304B" "\3088" "\305F" "\308C" "\305D" "\3064" "\306D" "\306A" "\3089" "\3080" "\3046" "\3090" "\306E" "\304A" "\304F" "\3084" "\307E" "\3051" "\3075" "\3053" "\3048" "\3066" "\3042" "\3055" "\304D" "\3086" "\3081" "\307F" "\3057" "\3091" "\3072" "\3082" "\305B" "\3059";
  /* い ろ は に ほ へ と ち り ぬ る を わ か よ た れ そ つ ね な ら む う ゐ の お く や ま け ふ こ え て あ さ き ゆ め み し ゑ ひ も せ す */
  suffix: "、";
}

/* https://drafts.csswg.org/css-counter-styles/#katakana */
@counter-style katakana {
  system: alphabetic;
  symbols: "\30A2" "\30A4" "\30A6" "\30A8" "\30AA" "\30AB" "\30AD" "\30AF" "\30B1" "\30B3" "\30B5" "\30B7" "\30B9" "\30BB" "\30BD" "\30BF" "\30C1" "\30C4" "\30C6" "\30C8" "\30CA" "\30CB" "\30CC" "\30CD" "\30CE" "\30CF" "\30D2" "\30D5" "\30D8" "\30DB" "\30DE" "\30DF" "\30E0" "\30E1" "\30E2" "\30E4" "\30E6" "\30E8" "\30E9" "\30EA" "\30EB" "\30EC" "\30ED" "\30EF" "\30F0" "\30F1" "\30F2" "\30F3";
  /* ア イ ウ エ オ カ キ ク ケ コ サ シ ス セ ソ タ チ ツ テ ト ナ ニ ヌ ネ ノ ハ ヒ フ ヘ ホ マ ミ ム メ モ ヤ ユ ヨ ラ リ ル レ ロ ワ ヰ ヱ ヲ ン */
  suffix: "、";
}

/* https://drafts.csswg.org/css-counter-styles/#katakana-iroha */
@counter-style katakana-iroha {
  system: alphabetic;
  symbols: "\30A4" "\30ED" "\30CF" "\30CB" "\30DB" "\30D8" "\30C8" "\30C1" "\30EA" "\30CC" "\30EB" "\30F2" "\30EF" "\30AB" "\30E8" "\30BF" "\30EC" "\30BD" "\30C4" "\30CD" "\30CA" "\30E9" "\30E0" "\30A6" "\30F0" "\30CE" "\30AA" "\30AF" "\30E4" "\30DE" "\30B1" "\30D5" "\30B3" "\30A8" "\30C6" "\30A2" "\30B5" "\30AD" "\30E6" "\30E1" "\30DF" "\30B7" "\30F1" "\30D2" "\30E2" "\30BB" "\30B9";
  /* イ ロ ハ ニ ホ ヘ ト チ リ ヌ ル ヲ ワ カ ヨ タ レ ソ ツ ネ ナ ラ ム ウ ヰ ノ オ ク ヤ マ ケ フ コ エ テ ア サ キ ユ メ ミ シ ヱ ヒ モ セ ス */
  suffix: "、";
}

/* https://drafts.csswg.org/css-counter-styles/#disc */
/* https://drafts.csswg.org/css-counter-styles/#circle */
/* https://drafts.csswg.org/css-counter-styles/#square */
/* https://drafts.csswg.org/css-counter-styles/#disclosure-open */
/* https://drafts.csswg.org/css-counter-styles/#disclosure-closed */

/* https://drafts.csswg.org/css-counter-styles/#valdef-counter-style-name-cjk-earthly-branch */
@counter-style cjk-earthly-branch {
  system: fixed;
  symbols: "\5B50" "\4E11" "\5BC5" "\536F" "\8FB0" "\5DF3" "\5348" "\672A" "\7533" "\9149" "\620C" "\4EA5";
  /* 子 丑 寅 卯 辰 巳 午 未 申 酉 戌 亥 */
  suffix: "、";
  fallback: cjk-decimal;
}

/* https://drafts.csswg.org/css-counter-styles/#valdef-counter-style-name-cjk-heavenly-stem */
@counter-style cjk-heavenly-stem {
  system: fixed;
  symbols: "\7532" "\4E59" "\4E19" "\4E01" "\620A" "\5DF1" "\5E9A" "\8F9B" "\58EC" "\7678";
  /* 甲 乙 丙 丁 戊 己 庚 辛 壬 癸 */
  suffix: "、";
  fallback: cjk-decimal;
}

/* https://drafts.csswg.org/css-counter-styles/#japanese-informal */
@counter-style japanese-informal {
  system: additive;
  range: -9999 9999;
  additive-symbols: 9000 \4E5D\5343, 8000 \516B\5343, 7000 \4E03\5343, 6000 \516D\5343, 5000 \4E94\5343, 4000 \56DB\5343, 3000 \4E09\5343, 2000 \4E8C\5343, 1000 \5343, 900 \4E5D\767E, 800 \516B\767E, 700 \4E03\767E, 600 \516D\767E, 500 \4E94\767E, 400 \56DB\767E, 300 \4E09\767E, 200 \4E8C\767E, 100 \767E, 90 \4E5D\5341, 80 \516B\5341, 70 \4E03\5341, 60 \516D\5341, 50 \4E94\5341, 40 \56DB\5341, 30 \4E09\5341, 20 \4E8C\5341, 10 \5341, 9 \4E5D, 8 \516B, 7 \4E03, 6 \516D, 5 \4E94, 4 \56DB, 3 \4E09, 2 \4E8C, 1 \4E00, 0 \3007;
  /* 9000 九千, 8000 八千, 7000 七千, 6000 六千, 5000 五千, 4000 四千, 3000 三千, 2000 二千, 1000 千, 900 九百, 800 八百, 700 七百, 600 六百, 500 五百, 400 四百, 300 三百, 200 二百, 100 百, 90 九十, 80 八十, 70 七十, 60 六十, 50 五十, 40 四十, 30 三十, 20 二十, 10 十, 9 九, 8 八, 7 七, 6 六, 5 五, 4 四, 3 三, 2 二, 1 一, 0 〇 */
  suffix: '\3001';
  /* 、 */
  negative: "\30DE\30A4\30CA\30B9";
  /* マイナス */
  fallback: cjk-decimal;
}

/* https://drafts.csswg.org/css-counter-styles/#japanese-formal */
@counter-style japanese-formal {
  system: additive;
  range: -9999 9999;
  additive-symbols: 9000 \4E5D\9621, 8000 \516B\9621, 7000 \4E03\9621, 6000 \516D\9621, 5000 \4F0D\9621, 4000 \56DB\9621, 3000 \53C2\9621, 2000 \5F10\9621, 1000 \58F1\9621, 900 \4E5D\767E, 800 \516B\767E, 700 \4E03\767E, 600 \516D\767E, 500 \4F0D\767E, 400 \56DB\767E, 300 \53C2\767E, 200 \5F10\767E, 100 \58F1\767E, 90 \4E5D\62FE, 80 \516B\62FE, 70 \4E03\62FE, 60 \516D\62FE, 50 \4F0D\62FE, 40 \56DB\62FE, 30 \53C2\62FE, 20 \5F10\62FE, 10 \58F1\62FE, 9 \4E5D, 8 \516B, 7 \4E03, 6 \516D, 5 \4F0D, 4 \56DB, 3 \53C2, 2 \5F10, 1 \58F1, 0 \96F6;
  /* 9000 九阡, 8000 八阡, 7000 七阡, 6000 六阡, 5000 伍阡, 4000 四阡, 3000 参阡, 2000 弐阡, 1000 壱阡, 900 九百, 800 八百, 700 七百, 600 六百, 500 伍百, 400 四百, 300 参百, 200 弐百, 100 壱百, 90 九拾, 80 八拾, 70 七拾, 60 六拾, 50 伍拾, 40 四拾, 30 参拾, 20 弐拾, 10 壱拾, 9 九, 8 八, 7 七, 6 六, 5 伍, 4 四, 3 参, 2 弐, 1 壱, 0 零 */
  suffix: '\3001';
  /* 、 */
  negative: "\30DE\30A4\30CA\30B9";
  /* マイナス */
  fallback: cjk-decimal;
}

/* https://drafts.csswg.org/css-counter-styles/#korean-hangul-formal */
@counter-style korean-hangul-formal {
  system: additive;
  range: -9999 9999;
  additive-symbols: 9000 \AD6C\CC9C, 8000 \D314\CC9C, 7000 \CE60\CC9C, 6000 \C721\CC9C, 5000 \C624\CC9C, 4000 \C0AC\CC9C, 3000 \C0BC\CC9C, 2000 \C774\CC9C, 1000 \C77C\CC9C, 900 \AD6C\BC31, 800 \D314\BC31, 700 \CE60\BC31, 600 \C721\BC31, 500 \C624\BC31, 400 \C0AC\BC31, 300 \C0BC\BC31, 200 \C774\BC31, 100 \C77C\BC31, 90 \AD6C\C2ED, 80 \D314\C2ED, 70 \CE60\C2ED, 60 \C721\C2ED, 50 \C624\C2ED, 40 \C0AC\C2ED, 30 \C0BC\C2ED, 20 \C774\C2ED, 10 \C77C\C2ED, 9 \AD6C, 8 \D314, 7 \CE60, 6 \C721, 5 \C624, 4 \C0AC, 3 \C0BC, 2 \C774, 1 \C77C, 0 \C601;
  /* 9000 구천, 8000 팔천, 7000 칠천, 6000 육천, 5000 오천, 4000 사천, 3000 삼천, 2000 이천, 1000 일천, 900 구백, 800 팔백, 700 칠백, 600 육백, 500 오백, 400 사백, 300 삼백, 200 이백, 100 일백, 90 구십, 80 팔십, 70 칠십, 60 육십, 50 오십, 40 사십, 30 삼십, 20 이십, 10 일십, 9 구, 8 팔, 7 칠, 6 육, 5 오, 4 사, 3 삼, 2 이, 1 일, 0 영 */
  suffix: ', ';
  negative: "\B9C8\C774\B108\C2A4  ";
  /* 마이너스 (followed by a space) */
  fallback: cjk-decimal;
}

/* https://drafts.csswg.org/css-counter-styles/#korean-hanja-informal */
@counter-style korean-hanja-informal {
  system: additive;
  range: -9999 9999;
  additive-symbols: 9000 \4E5D\5343, 8000 \516B\5343, 7000 \4E03\5343, 6000 \516D\5343, 5000 \4E94\5343, 4000 \56DB\5343, 3000 \4E09\5343, 2000 \4E8C\5343, 1000 \5343, 900 \4E5D\767E, 800 \516B\767E, 700 \4E03\767E, 600 \516D\767E, 500 \4E94\767E, 400 \56DB\767E, 300 \4E09\767E, 200 \4E8C\767E, 100 \767E, 90 \4E5D\5341, 80 \516B\5341, 70 \4E03\5341, 60 \516D\5341, 50 \4E94\5341, 40 \56DB\5341, 30 \4E09\5341, 20 \4E8C\5341, 10 \5341, 9 \4E5D, 8 \516B, 7 \4E03, 6 \516D, 5 \4E94, 4 \56DB, 3 \4E09, 2 \4E8C, 1 \4E00, 0 \96F6;
  /* 9000 九千, 8000 八千, 7000 七千, 6000 六千, 5000 五千, 4000 四千, 3000 三千, 2000 二千, 1000 千, 900 九百, 800 八百, 700 七百, 600 六百, 500 五百, 400 四百, 300 三百, 200 二百, 100 百, 90 九十, 80 八十, 70 七十, 60 六十, 50 五十, 40 四十, 30 三十, 20 二十, 10 十, 9 九, 8 八, 7 七, 6 六, 5 五, 4 四, 3 三, 2 二, 1 一, 0 零 */
  suffix: ', ';
  negative: "\B9C8\C774\B108\C2A4  ";
  /* 마이너스 (followed by a space) */
  fallback: cjk-decimal;
}

/* https://drafts.csswg.org/css-counter-styles/#korean-hanja-formal */
@counter-style korean-hanja-formal {
  system: additive;
  range: -9999 9999;
  additive-symbols: 9000 \4E5D\4EDF, 8000 \516B\4EDF, 7000 \4E03\4EDF, 6000 \516D\4EDF, 5000 \4E94\4EDF, 4000 \56DB\4EDF, 3000 \53C3\4EDF, 2000 \8CB3\4EDF, 1000 \58F9\4EDF, 900 \4E5D\767E, 800 \516B\767E, 700 \4E03\767E, 600 \516D\767E, 500 \4E94\767E, 400 \56DB\767E, 300 \53C3\767E, 200 \8CB3\767E, 100 \58F9\767E, 90 \4E5D\62FE, 80 \516B\62FE, 70 \4E03\62FE, 60 \516D\62FE, 50 \4E94\62FE, 40 \56DB\62FE, 30 \53C3\62FE, 20 \8CB3\62FE, 10 \58F9\62FE, 9 \4E5D, 8 \516B, 7 \4E03, 6 \516D, 5 \4E94, 4 \56DB, 3 \53C3, 2 \8CB3, 1 \58F9, 0 \96F6;
  /* 9000 九仟, 8000 八仟, 7000 七仟, 6000 六仟, 5000 五仟, 4000 四仟, 3000 參仟, 2000 貳仟, 1000 壹仟, 900 九百, 800 八百, 700 七百, 600 六百, 500 五百, 400 四百, 300 參百, 200 貳百, 100 壹百, 90 九拾, 80 八拾, 70 七拾, 60 六拾, 50 五拾, 40 四拾, 30 參拾, 20 貳拾, 10 壹拾, 9 九, 8 八, 7 七, 6 六, 5 五, 4 四, 3 參, 2 貳, 1 壹, 0 零 */
  suffix: ', ';
  negative: "\B9C8\C774\B108\C2A4  ";
  /* 마이너스 (followed by a space) */
  fallback: cjk-decimal;
}
` +
  String.raw`
/* https://www.w3.org/TR/predefined-counter-styles/#adlam */
@counter-style adlam {
system: numeric;
symbols: '\01E950' '\01E951' '\01E952' '\01E953' '\01E954' '\01E955' '\01E956' '\01E957' '\01E958' '\01E959';
/* symbols: '𞥐' '𞥑' '𞥒' '𞥓' '𞥔' '𞥕' '𞥖' '𞥗' '𞥘' '𞥙'; */
}

/* https://www.w3.org/TR/predefined-counter-styles/#arabic-indic */
@counter-style arabic-indic {
system: numeric;
symbols: '\660' '\661' '\662' '\663' '\664' '\665' '\666' '\667' '\668' '\669';
/* symbols: '٠' '١' '٢' '٣' '٤' '٥' '٦' '٧' '٨' '٩'; */
}

/* https://www.w3.org/TR/predefined-counter-styles/#arabic-abjad */
@counter-style arabic-abjad {
system: fixed;
symbols: '\627' '\628' '\62C' '\62F' '\647\200D' '\648' '\632' '\62D' '\637' '\64A' '\643' '\644' '\645' '\646' '\633' '\639' '\641' '\635' '\642' '\631' '\634' '\62A' '\62B' '\62E' '\630' '\636' '\638' '\63A';
/* symbols: 'ا' 'ب' 'ج' 'د' 'ه‍' 'و' 'ز' 'ح' 'ط' 'ي' 'ك' 'ل' 'م' 'ن' 'س' 'ع' 'ف' 'ص' 'ق' 'ر' 'ش' 'ت' 'ث' 'خ' 'ذ' 'ض' 'ظ' 'غ'; */
}

/* https://www.w3.org/TR/predefined-counter-styles/#kashmiri */
@counter-style kashmiri {
system: alphabetic;
symbols: '\0627' '\0622' '\0628' '\067E' '\062A' '\0679' '\062B' '\062C' '\0686' '\062D' '\062E' '\062F' '\0688' '\0630' '\0631' '\0691' '\0632' '\0698' '\0633' '\0634' '\0635' '\0636' '\0637' '\0638' '\0639' '\063A' '\0641' '\0642' '\06A9' '\06AF' '\0644' '\0645' '\0646' '\06BA' '\0648' '\06C1' '\06BE' '\0621' '\06CC' '\06D2' '\06C4' '\0620';
suffix: ') ';
/* symbols: 'ا' 'آ' 'ب' 'پ' 'ت' 'ٹ' 'ث' 'ج' 'چ' 'ح' 'خ' 'د' 'ڈ' 'ذ' 'ر' 'ڑ' 'ز' 'ژ' 'س' 'ش' 'ص' 'ض' 'ط' 'ظ' 'ع' 'غ' 'ف' 'ق' 'ک' 'گ' 'ل' 'م' 'ن' 'ں' 'و' 'ہ' 'ھ' 'ء' 'ی' 'ے' 'ۄ' 'ؠ'; */
}

/* https://www.w3.org/TR/predefined-counter-styles/#maghrebi-abjad */
@counter-style maghrebi-abjad {
system: fixed;
symbols: '\627' '\628' '\62C' '\62F' '\647\200D' '\648' '\632' '\62D' '\637' '\64A' '\643' '\644' '\645' '\646' '\636' '\639' '\641' '\635' '\642' '\631' '\633' '\62A' '\62B' '\62E' '\630' '\638' '\63A' '\634';
/* symbols: 'ا' 'ب' 'ج' 'د' 'ه‍' 'و' 'ز' 'ح' 'ط' 'ي' 'ك' 'ل' 'م' 'ن' 'ص' 'ع' 'ف' 'ض' 'ق' 'ر' 'س' 'ت' 'ث' 'خ' 'ذ' 'ظ' 'غ' 'ش'; */
}

/* https://www.w3.org/TR/predefined-counter-styles/#persian */
@counter-style persian {
system: numeric;
symbols: '\6F0' '\6F1' '\6F2' '\6F3' '\6F4' '\6F5' '\6F6' '\6F7' '\6F8' '\6F9';
/* symbols: '۰' '۱' '۲' '۳' '۴' '۵' '۶' '۷' '۸' '۹';*/
}

/* https://www.w3.org/TR/predefined-counter-styles/#persian-abjad */
@counter-style persian-abjad {
system: fixed;
symbols: '\627' '\628' '\62C' '\62F' '\647\200D' '\648' '\632' '\62D' '\637' '\6CC' '\6A9' '\644' '\645' '\646' '\633' '\639' '\641' '\635' '\642' '\631' '\634' '\62A' '\62B' '\62E' '\630' '\636' '\638' '\63A';
/* symbols: 'ا' 'ب' 'ج' 'د' 'ه‍' 'و' 'ز' 'ح' 'ط' 'ی' 'ک' 'ل' 'م' 'ن' 'س' 'ع' 'ف' 'ص' 'ق' 'ر' 'ش' 'ت' 'ث' 'خ' 'ذ' 'ض' 'ظ' 'غ'; */
}

/* https://www.w3.org/TR/predefined-counter-styles/#persian-alphabetic */
@counter-style persian-alphabetic {
system: fixed;
symbols: '\627' '\628' '\67E' '\62A' '\62B' '\62C' '\686' '\62D' '\62E' '\62F' '\630' '\631' '\632' '\698' '\633' '\634' '\635' '\636' '\637' '\638' '\639' '\63A' '\641' '\642' '\6A9' '\6AF' '\644' '\645' '\646' '\648' '\647\200D' '\6CC';
/* symbols: 'ا' 'ب' 'پ' 'ت' 'ث' 'ج' 'چ' 'ح' 'خ' 'د' 'ذ' 'ر' 'ز' 'ژ' 'س' 'ش' 'ص' 'ض' 'ط' 'ظ' 'ع' 'غ' 'ف' 'ق' 'ک' 'گ' 'ل' 'م' 'ن' 'و' 'ه‍' 'ی'; */
}

/* https://www.w3.org/TR/predefined-counter-styles/#urdu */
@counter-style urdu {
system: numeric;
symbols: '\6F0' '\6F1' '\6F2' '\6F3' '\6F4' '\6F5' '\6F6' '\6F7' '\6F8' '\6F9';
/* symbols: '۰' '۱' '۲' '۳' '۴' '۵' '۶' '۷' '۸' '۹';*/
suffix: '۔ ';
}

/* https://www.w3.org/TR/predefined-counter-styles/#urdu-abjad */
@counter-style urdu-abjad {
system: fixed;
symbols:  '\0627' '\0628' '\062C' '\062F' '\06C1' '\0648' '\0632' '\062D' '\0637' '\06CC' '\06A9' '\0644' '\0645' '\0646' '\0633' '\0639' '\0641' '\0635' '\0642' '\0631' '\0634' '\062A' '\062B' '\062E' '\0630' '\0636' '\0638'  '\063A '; 
/* symbols: 'ا' 'ب' 'ج' 'د' 'ہ' 'و' 'ز' 'ح' 'ط' 'ی' 'ک' 'ل' 'م' 'ن' 'س' 'ع' 'ف' 'ص' 'ق' 'ر' 'ش' 'ت' 'ث' 'خ' 'ذ' 'ض' 'ظ' 'غ'; */
}

/* https://www.w3.org/TR/predefined-counter-styles/#urdu-alphabetic */
@counter-style urdu-alphabetic {
system: fixed;
symbols: '\0627' '\0628' '\067E' '\062A' '\0679' '\062B' '\062C' '\0686' '\062D' '\062E' '\062F' '\0688' '\0630' '\0631' '\0691' '\0632' '\0698' '\0633' '\0634' '\0635' '\0636' '\0637' '\0638' '\0639' '\063A' '\0641' '\0642' '\06A9' '\06AF' '\0644' '\0645' '\0646' '\06BA' '\0648' '\06C1' '\06BE' '\0621' '\06CC';
/* symbols: 'ا' 'ب' 'پ' 'ت' 'ٹ' 'ث' 'ج' 'چ' 'ح' 'خ' 'د' 'ڈ' 'ذ' 'ر' 'ڑ' 'ز' 'ژ' 'س' 'ش' 'ص' 'ض' 'ط' 'ظ' 'ع' 'غ' 'ف' 'ق' 'ک' 'گ' 'ل' 'م' 'ن' 'ں' 'و' 'ہ' 'ھ' 'ء' 'ی'; */
}

/* https://www.w3.org/TR/predefined-counter-styles/#armenian */
@counter-style armenian {
system: additive;
range: 1 9999;
additive-symbols: 9000 '\554', 8000 '\553', 7000 '\552', 6000 '\551', 5000 '\550', 4000 '\54F', 3000 '\54E', 2000 '\54D', 1000 '\54C', 900 '\54B', 800 '\54A', 700 '\549', 600 '\548', 500 '\547', 400 '\546', 300 '\545', 200 '\544', 100 '\543', 90 '\542', 80 '\541', 70 '\540', 60 '\53F', 50 '\53E', 40 '\53D', 30 '\53C', 20 '\53B', 10 '\53A', 9 '\539', 8 '\538', 7 '\537', 6 '\536', 5 '\535', 4 '\534', 3 '\533', 2 '\532', 1 '\531';
/* additive-symbols: 9000 'Ք', 8000 'Փ', 7000 'Ւ', 6000 'Ց', 5000 'Ր', 4000 'Տ', 3000 'Վ', 2000 'Ս', 1000 'Ռ', 900 'Ջ', 800 'Պ', 700 'Չ', 600 'Ո', 500 'Շ', 400 'Ն', 300 'Յ', 200 'Մ', 100 'Ճ', 90 'Ղ', 80 'Ձ', 70 'Հ', 60 'Կ', ;50 'Ծ', 40 'Խ', 30 'Լ', 20 'Ի', 10 'Ժ', 9 'Թ', 8 'Ը', 7 'Է', 6 'Զ', 5 'Ե', 4 'Դ', 3 'Գ', 2 'Բ', 1 'Ա'; */
}

/* https://www.w3.org/TR/predefined-counter-styles/#lower-armenian */
@counter-style lower-armenian {
system: additive;
range: 1 9999;
additive-symbols: 9000 '\584', 8000 '\583', 7000 '\582', 6000 '\581', 5000 '\580', 4000 '\57F', 3000 '\57E', 2000 '\57D', 1000 '\57C', 900 '\57B', 800 '\57A', 700 '\579', 600 '\578', 500 '\577', 400 '\576', 300 '\575', 200 '\574', 100 '\573', 90 '\572', 80 '\571', 70 '\570', 60 '\56F', 50 '\56E', 40 '\56D', 30 '\56C', 20 '\56B', 10 '\56A', 9 '\569', 8 '\568', 7 '\567', 6 '\566', 5 '\565', 4 '\564', 3 '\563', 2 '\562', 1 '\561';
/* additive-symbols: 9000 'ք', 8000 'փ', 7000 'ւ', 6000 'ց', 5000 'ր', 4000 'տ', 3000 'վ', 2000 'ս', 1000 'ռ', 900 'ջ', 800 'պ', 700 'չ', 600 'ո', 500 'շ', 400 'ն', 300 'յ', 200 'մ', 100 'ճ', 90 'ղ', 80 'ձ', 70 'հ', 60 'կ', 50 'ծ', 40 'խ', 30 'լ', 20 'ի', 10 'ժ', 9 'թ', 8 'ը', 7 'է', 6 'զ', 5 'ե', 4 'դ', 3 'գ', 2 'բ', 1 'ա'; */
}

/* https://www.w3.org/TR/predefined-counter-styles/#upper-armenian */
@counter-style upper-armenian {
system: additive;
range: 1 9999;
additive-symbols: 9000 '\554', 8000 '\553', 7000 '\552', 6000 '\551', 5000 '\550', 4000 '\54F', 3000 '\54E', 2000 '\54D', 1000 '\54C', 900 '\54B', 800 '\54A', 700 '\549', 600 '\548', 500 '\547', 400 '\546', 300 '\545', 200 '\544', 100 '\543', 90 '\542', 80 '\541', 70 '\540', 60 '\53F', 50 '\53E', 40 '\53D', 30 '\53C', 20 '\53B', 10 '\53A', 9 '\539', 8 '\538', 7 '\537', 6 '\536', 5 '\535', 4 '\534', 3 '\533', 2 '\532', 1 '\531';
/* additive-symbols: 9000 'Ք', 8000 'Փ', 7000 'Ւ', 6000 'Ց', 5000 'Ր', 4000 'Տ', 3000 'Վ', 2000 'Ս', 1000 'Ռ', 900 'Ջ', 800 'Պ', 700 'Չ', 600 'Ո', 500 'Շ', 400 'Ն', 300 'Յ', 200 'Մ', 100 'Ճ', 90 'Ղ', 80 'Ձ', 70 'Հ', 60 'Կ', 50 'Ծ', 40 'Խ', 30 'Լ', 20 'Ի', 10 'Ժ', 9 'Թ', 8 'Ը', 7 'Է', 6 'Զ', 5 'Ե', 4 'Դ', 3 'Գ', 2 'Բ', 1 'Ա'; */
}

/* https://www.w3.org/TR/predefined-counter-styles/#balinese */
@counter-style balinese {
system: numeric;
symbols: '\1B50'  '\1B51'  '\1B52'  '\1B53'  '\1B54'  '\1B55'  '\1B56'  '\1B57'  '\1B58'  '\1B59' ;
/* symbols: '᭐' '᭑' '᭒' '᭓' '᭔' '᭕' '᭖' '᭗' '᭘' '᭙'; */
}

/* https://www.w3.org/TR/predefined-counter-styles/#bamum */
@counter-style bamum {
system: numeric;
symbols: '\A6EF'  '\A6E6'  '\A6E7'  '\A6E8'  '\A6E9'  '\A6EA'  '\A6EB'  '\A6EC'  '\A6ED'  '\A6EE' ;
/* symbols: 'ꛯ' 'ꛦ' 'ꛧ' 'ꛨ' 'ꛩ' 'ꛪ' 'ꛫ' 'ꛬ' 'ꛭ' 'ꛮ'; */
}

/* https://www.w3.org/TR/predefined-counter-styles/#bengali */
@counter-style bengali {
system: numeric;
symbols: '\9E6' '\9E7' '\9E8' '\9E9' '\9EA' '\9EB' '\9EC' '\9ED' '\9EE' '\9EF';
/* symbols: '০' '১' '২' '৩' '৪' '৫' '৬' '৭' '৮' '৯'; */
}

/* https://www.w3.org/TR/predefined-counter-styles/#bangla */
@counter-style bangla {
system: alphabetic;
symbols: '\0995' '\0996' '\0997' '\0998' '\0999' '\099A' '\099B' '\099C' '\099D' '\099E' '\099F' '\09A0' '\09A1' '\09A1\09BC' '\09A2' '\09A2\09BC' '\09A3' '\09A4' '\09CE' '\09A5' '\09A6' '\09A7' '\09A8' '\09AA' '\09AB' '\09AC' '\09AD' '\09AE' '\09AF' '\09AF\09BC' '\09B0' '\09B2' '\09B6' '\09B7' '\09B8' '\09B9' ;
/* symbols: 'ক' 'খ' 'গ' 'ঘ' 'ঙ' 'চ' 'ছ' 'জ' 'ঝ' 'ঞ' 'ট' 'ঠ' 'ড' 'ড়' 'ঢ' 'ঢ়' 'ণ' 'ত' 'ৎ' 'থ' 'দ' 'ধ' 'ন' 'প' 'ফ' 'ব' 'ভ' 'ম' 'য' 'য়' 'র' 'ল' 'শ' 'ষ' 'স' 'হ' ; */
suffix: ') ';
}

/* https://www.w3.org/TR/predefined-counter-styles/#zhuyin */
@counter-style zhuyin {
  system: alphabetic;
  symbols: "\3105" "\3106" "\3107" "\3108" "\3109" "\310A" "\310B" "\310C" "\310D" "\310E" "\310F" "\3110" "\3111" "\3112" "\3113" "\3114" "\3115" "\3116" "\3117" "\3118" "\3119" "\311A" "\311B" "\311C" "\311D" "\311E" "\311F" "\3120" "\3121" "\3122" "\3123" "\3124" "\3125" "\3126" "\3127" "\3128" "\3129";
  /* ㄅㄆㄇㄈㄉㄊㄋㄌㄍㄎㄏㄐㄑㄒㄓㄔㄕㄖㄗㄘㄙㄚㄛㄜㄝㄞㄟㄠㄡㄢㄣㄤㄥㄦㄧㄨㄩ */
  suffix: "、";
}

/* https://www.w3.org/TR/predefined-counter-styles/#lower-belorussian */
@counter-style lower-belorussian {
system: alphabetic;
symbols: '\430' '\431' '\432' '\433' '\434' '\435' '\451' '\436' '\437' '\456' '\439' '\43A' '\43B' '\43C' '\43D' '\43E' '\43F' '\440' '\441' '\442' '\443' '\45E' '\444' '\445' '\446' '\447' '\448' '\44B' '\44C' '\44D' '\44E' '\44F';
/* symbols: 'а' 'б' 'в' 'г' 'д' 'е' 'ё' 'ж' 'з' 'і' 'й' 'к' 'л' 'м' 'н' 'о' 'п' 'р' 'с' 'т' 'у' 'ў' 'ф' 'х' 'ц' 'ч' 'ш' 'ы' 'ь' 'э' 'ю' 'я'; */
suffix: ') ';
}

/* https://www.w3.org/TR/predefined-counter-styles/#upper-belorussian */
@counter-style upper-belorussian {
system: alphabetic;
symbols: '\410' '\411' '\412' '\413' '\414' '\415' '\401' '\416' '\417' '\406' '\419' '\41A' '\41B' '\41C' '\41D' '\41E' '\41F' '\420' '\421' '\422' '\423' '\40E' '\424' '\425' '\426' '\427' '\428' '\42B' '\42C' '\42D' '\42E' '\42F';
/* symbols: 'А' 'Б' 'В' 'Г' 'Д' 'Е' 'Ё' 'Ж' 'З' 'І' 'Й' 'К' 'Л' 'М' 'Н' 'О' 'П' 'Р' 'С' 'Т' 'У' 'Ў' 'Ф' 'Х' 'Ц' 'Ч' 'Ш' 'Ы' 'Ь' 'Э' 'Ю' 'Я'; */
}

/* https://www.w3.org/TR/predefined-counter-styles/#lower-bulgarian */
@counter-style lower-bulgarian {
system: alphabetic;
symbols: '\430' '\431' '\432' '\433' '\434' '\435' '\436' '\437' '\438' '\439' '\43A' '\43B' '\43C' '\43D' '\43E' '\43F' '\440' '\441' '\442' '\443' '\444' '\445' '\446' '\447' '\448' '\449' '\44A' '\44C' '\44E' '\44F';
/* symbols: 'а' 'б' 'в' 'г' 'д' 'е' 'ж' 'з' 'и' 'й' 'к' 'л' 'м' 'н' 'о' 'п' 'р' 'с' 'т' 'у' 'ф' 'х' 'ц' 'ч' 'ш' 'щ' 'ъ' 'ь' 'ю' 'я'; */
suffix: ') ';
}

/* https://www.w3.org/TR/predefined-counter-styles/#upper-bulgarian */
@counter-style upper-bulgarian {
system: alphabetic;
symbols: '\410' '\411' '\412' '\413' '\414' '\415' '\416' '\417' '\418' '\419' '\41A' '\41B' '\41C' '\41D' '\41E' '\41F' '\420' '\421' '\422' '\423' '\424' '\425' '\426' '\427' '\428' '\429' '\42A' '\42C' '\42E' '\42F';
/* symbols: 'А' 'Б' 'В' 'Г' 'Д' 'Е' 'Ж' 'З' 'И' 'Й' 'К' 'Л' 'М' 'Н' 'О' 'П' 'Р' 'С' 'Т' 'У' 'Ф' 'Х' 'Ц' 'Ч' 'Ш' 'Щ' 'Ъ' 'Ь' 'Ю' 'Я'; */
}

/* https://www.w3.org/TR/predefined-counter-styles/#lower-macedonian */
@counter-style lower-macedonian {
system: alphabetic;
symbols: '\430' '\431' '\432' '\433' '\434' '\453' '\435' '\436' '\437' '\455' '\438' '\458' '\43A' '\43B' '\459' '\43C' '\43D' '\45A' '\43E' '\43F' '\440' '\441' '\442' '\45C' '\443' '\444' '\445' '\446' '\447' '\45F' '\448';
/* symbols: 'а' 'б' 'в' 'г' 'д' 'ѓ' 'е' 'ж' 'з' 'ѕ' 'и' 'ј' 'к' 'л' 'љ' 'м' 'н' 'њ' 'о' 'п' 'р' 'с' 'т' 'ќ' 'у' 'ф' 'х' 'ц' 'ч' 'џ' 'ш'; */
suffix: ') ';
}

/* https://www.w3.org/TR/predefined-counter-styles/#upper-macedonian */
@counter-style upper-macedonian {
system: alphabetic;
symbols: '\410' '\411' '\412' '\413' '\414' '\403' '\415' '\416' '\417' '\405' '\418' '\408' '\41A' '\41B' '\409' '\41C' '\41D' '\40A' '\41E' '\41F' '\420' '\421' '\422' '\40C' '\423' '\424' '\425' '\426' '\427' '\40F' '\428';
/* symbols: 'А' 'Б' 'В' 'Г' 'Д' 'Ѓ' 'Е' 'Ж' 'З' 'Ѕ' 'И' 'Ј' 'К' 'Л' 'Љ' 'М' 'Н' 'Њ' 'О' 'П' 'Р' 'С' 'Т' 'Ќ' 'У' 'Ф' 'Х' 'Ц' 'Ч' 'Џ' 'Ш'; */
}

/* https://www.w3.org/TR/predefined-counter-styles/#lower-russian */
@counter-style lower-russian {
system: alphabetic;
symbols: '\430' '\431' '\432' '\433' '\434' '\435' '\436' '\437' '\438' '\43A' '\43B' '\43C' '\43D' '\43E' '\43F' '\440' '\441' '\442' '\443' '\444' '\445' '\446' '\447' '\448' '\449' '\44D' '\44E' '\44F';
/* symbols: 'а' 'б' 'в' 'г' 'д' 'е' 'ж' 'з' 'и' 'к' 'л' 'м' 'н' 'о' 'п' 'р' 'с' 'т' 'у' 'ф' 'х' 'ц' 'ч' 'ш' 'щ' 'э' 'ю' 'я'; */
suffix: ') ';
}

/* https://www.w3.org/TR/predefined-counter-styles/#upper-russian */
@counter-style upper-russian {
system: alphabetic;
symbols: '\410' '\411' '\412' '\413' '\414' '\415' '\416' '\417' '\418' '\41A' '\41B' '\41C' '\41D' '\41E' '\41F' '\420' '\421' '\422' '\423' '\424' '\425' '\426' '\427' '\428' '\429' '\42D' '\42E' '\42F';
/* symbols: 'А' 'Б' 'В' 'Г' 'Д' 'Е' 'Ж' 'З' 'И' 'К' 'Л' 'М' 'Н' 'О' 'П' 'Р' 'С' 'Т' 'У' 'Ф' 'Х' 'Ц' 'Ч' 'Ш' 'Щ' 'Э' 'Ю' 'Я'; */
}

/* https://www.w3.org/TR/predefined-counter-styles/#lower-russian-full */
@counter-style lower-russian-full {
system: alphabetic;
symbols: '\430' '\431' '\432' '\433' '\434' '\435' '\451' '\436' '\437' '\438' '\439' '\43A' '\43B' '\43C' '\43D' '\43E' '\43F' '\440' '\441' '\442' '\443' '\444' '\445' '\446' '\447' '\448' '\449' '\44A' '\44B' '\44C' '\44D' '\44E' '\44F';
/* symbols: 'а' 'б' 'в' 'г' 'д' 'е' 'ё' 'ж' 'з' 'и' 'й' 'к' 'л' 'м' 'н' 'о' 'п' 'р' 'с' 'т' 'у' 'ф' 'х' 'ц' 'ч' 'ш' 'щ' 'ъ' 'ы' 'ь' 'э' 'ю' 'я'; */
suffix: ') ';
}

/* https://www.w3.org/TR/predefined-counter-styles/#upper-russian-full */
@counter-style upper-russian-full {
system: alphabetic;
symbols: '\410' '\411' '\412' '\413' '\414' '\415' '\401' '\416' '\417' '\418' '\419' '\41A' '\41B' '\41C' '\41D' '\41E' '\41F' '\420' '\421' '\422' '\423' '\424' '\425' '\426' '\427' '\428' '\429' '\42A' '\42B' '\42C' '\42D' '\42E' '\42F';
/* symbols: 'А' 'Б' 'В' 'Г' 'Д' 'Е' 'Ё' 'Ж' 'З' 'И' 'Й' 'К' 'Л' 'М' 'Н' 'О' 'П' 'Р' 'С' 'Т' 'У' 'Ф' 'Х' 'Ц' 'Ч' 'Ш' 'Щ' 'Ъ' 'Ы' 'Ь' 'Э' 'Ю' 'Я'; */
}

/* https://www.w3.org/TR/predefined-counter-styles/#lower-serbian */
@counter-style lower-serbian {
system: alphabetic;
symbols: '\430' '\431' '\432' '\433' '\434' '\452' '\435' '\436' '\437' '\438' '\458' '\43A' '\43B' '\459' '\43C' '\43D' '\45A' '\43E' '\43F' '\440' '\441' '\442' '\45B' '\443' '\444' '\445' '\446' '\447' '\45F' '\448';
/* symbols: 'а' 'б' 'в' 'г' 'д' 'ђ' 'е' 'ж' 'з' 'и' 'ј' 'к' 'л' 'љ' 'м' 'н' 'њ' 'о' 'п' 'р' 'с' 'т' 'ћ' 'у' 'ф' 'х' 'ц' 'ч' 'џ' 'ш'; */
suffix: ') ';
}

/* https://www.w3.org/TR/predefined-counter-styles/#upper-serbian */
@counter-style upper-serbian {
system: alphabetic;
symbols: '\410' '\411' '\412' '\413' '\414' '\402' '\415' '\416' '\417' '\418' '\408' '\41A' '\41B' '\409' '\41C' '\41D' '\40A' '\41E' '\41F' '\420' '\421' '\422' '\40B' '\423' '\424' '\425' '\426' '\427' '\40F' '\428';
/* symbols: 'А' 'Б' 'В' 'Г' 'Д' 'Ђ' 'Е' 'Ж' 'З' 'И' 'Ј' 'К' 'Л' 'Љ' 'М' 'Н' 'Њ' 'О' 'П' 'Р' 'С' 'Т' 'Ћ' 'У' 'Ф' 'Х' 'Ц' 'Ч' 'Џ' 'Ш'; */
}

/* https://www.w3.org/TR/predefined-counter-styles/#lower-ukrainian */
@counter-style lower-ukrainian {
system: alphabetic;
symbols: '\430' '\431' '\432' '\433' '\434' '\435' '\454' '\436' '\437' '\438' '\456' '\43A' '\43B' '\43C' '\43D' '\43E' '\43F' '\440' '\441' '\442' '\443' '\444' '\445' '\446' '\447' '\448' '\44E' '\44F';
/* symbols: 'а' 'б' 'в' 'г' 'д' 'е' 'є' 'ж' 'з' 'и' 'і' 'к' 'л' 'м' 'н' 'о' 'п' 'р' 'с' 'т' 'у' 'ф' 'х' 'ц' 'ч' 'ш' 'ю' 'я'; */
suffix: ') ';
}

/* https://www.w3.org/TR/predefined-counter-styles/#upper-ukrainian */
@counter-style upper-ukrainian {
system: alphabetic;
symbols: '\410' '\411' '\412' '\413' '\414' '\415' '\404' '\416' '\417' '\418' '\406' '\41A' '\41B' '\41C' '\41D' '\41E' '\41F' '\420' '\421' '\422' '\423' '\424' '\425' '\426' '\427' '\428' '\42E' '\42F';
/* symbols: 'А' 'Б' 'В' 'Г' 'Д' 'Е' 'Є' 'Ж' 'З' 'И' 'І' 'К' 'Л' 'М' 'Н' 'О' 'П' 'Р' 'С' 'Т' 'У' 'Ф' 'Х' 'Ц' 'Ч' 'Ш' 'Ю' 'Я'; */
}

/* https://www.w3.org/TR/predefined-counter-styles/#lower-ukrainian-full */
@counter-style lower-ukrainian-full {
system: alphabetic;
symbols: '\430' '\431' '\432' '\433' '\491' '\434' '\435' '\454' '\436' '\437' '\438' '\456' '\457' '\439' '\43A' '\43B' '\43C' '\43D' '\43E' '\43F' '\440' '\441' '\442' '\443' '\444' '\445' '\446' '\447' '\448' '\449' '\44C' '\44E' '\44F';
/* symbols: 'а' 'б' 'в' 'г' 'ґ' 'д' 'е' 'є' 'ж' 'з' 'и' 'і' 'ї' 'й' 'к' 'л' 'м' 'н' 'о' 'п' 'р' 'с' 'т' 'у' 'ф' 'х' 'ц' 'ч' 'ш' 'щ' 'ь' 'ю' 'я'; */
suffix: ') ';
}

/* https://www.w3.org/TR/predefined-counter-styles/#upper-ukrainian-full */
@counter-style upper-ukrainian-full {
system: alphabetic;
symbols: '\410' '\411' '\412' '\413' '\490' '\414' '\415' '\404' '\416' '\417' '\418' '\406' '\407' '\419' '\41A' '\41B' '\41C' '\41D' '\41E' '\41F' '\420' '\421' '\422' '\423' '\424' '\425' '\426' '\427' '\428' '\429' '\42C' '\42E' '\42F';
/* symbols: 'А' 'Б' 'В' 'Г' 'Ґ' 'Д' 'Е' 'Є' 'Ж' 'З' 'И' 'І' 'Ї' 'Й' 'К' 'Л' 'М' 'Н' 'О' 'П' 'Р' 'С' 'Т' 'У' 'Ф' 'Х' 'Ц' 'Ч' 'Ш' 'Щ' 'Ь' 'Ю' 'Я'; */
}

/* https://www.w3.org/TR/predefined-counter-styles/#bodo */
@counter-style bodo {
system: alphabetic;
symbols: '\915' '\916' '\917' '\918' '\919' '\91A' '\91B' '\91C' '\91D' '\91E' '\91F' '\920' '\921' '\922' '\923' '\924' '\925' '\926' '\927' '\928' '\92A' '\92B' '\92C' '\92D' '\92E' '\92F' '\930' '\932' '\935' '\936' '\937' '\938' '\939' ;
/* symbols: 'क' 'ख' 'ग' 'घ' 'ङ' 'च' 'छ' 'ज' 'झ' 'ञ' 'ट' 'ठ' 'ड' 'ढ' 'ण' 'त' 'थ' 'द' 'ध' 'न' 'प' 'फ' 'ब' 'भ' 'म' 'य' 'र' 'ल' 'व' 'श' 'ष' 'स' 'ह' */
suffix: ') ';
}

/* https://www.w3.org/TR/predefined-counter-styles/#devanagari */
@counter-style devanagari {
system: numeric;
symbols: '\966' '\967' '\968' '\969' '\96A' '\96B' '\96C' '\96D' '\96E' '\96F';
/* symbols: '०' '१' '२' '३' '४' '५' '६' '७' '८' '९'; */
}

/* https://www.w3.org/TR/predefined-counter-styles/#dogri */
@counter-style dogri {
system: alphabetic;
symbols: '\915' '\916' '\917' '\918' '\919' '\91A' '\91B' '\91C' '\91D' '\91E' '\91F' '\920' '\921' '\922' '\923' '\924' '\925' '\926' '\927' '\928' '\92A' '\92B' '\92C' '\92D' '\92E' '\92F' '\930' '\932' '\935' '\936' '\937' '\938' '\939';
/* symbols:  'क' 'ख' 'ग' 'घ' 'ङ' 'च' 'छ' 'ज' 'झ' 'ञ' 'ट' 'ठ' 'ड' 'ढ' 'ण' 'त' 'थ' 'द' 'ध' 'न' 'प' 'फ' 'ब' 'भ' 'म' 'य' 'र' 'ल' 'व' 'श' 'ष' 'स' 'ह' */
suffix: ') ';
}

/* https://www.w3.org/TR/predefined-counter-styles/#hindi */
@counter-style hindi {
system: alphabetic;
symbols: '\915' '\916' '\917' '\918' '\919' '\91A' '\91B' '\91C' '\91D' '\91E' '\91F' '\920' '\921' '\922' '\923' '\924' '\925' '\926' '\927' '\928' '\92A' '\92B' '\92C' '\92D' '\92E' '\92F' '\930' '\932' '\935' '\936' '\937' '\938' '\939';
/* symbols: 'क' 'ख' 'ग' 'घ' 'ङ' 'च' 'छ' 'ज' 'झ' 'ञ' 'ट' 'ठ' 'ड' 'ढ' 'ण' 'त' 'थ' 'द' 'ध' 'न' 'प' 'फ' 'ब' 'भ' 'म' 'य' 'र' 'ल' 'व' 'श' 'ष' 'स' 'ह'; */
}

/* https://www.w3.org/TR/predefined-counter-styles/#konkani */
@counter-style konkani {
system: alphabetic;
symbols:  '\915' '\916' '\917' '\918' '\919' '\91A' '\91B' '\91C' '\91D' '\91E' '\91F' '\920' '\921' '\922' '\923' '\924' '\925' '\926' '\927' '\928' '\92A' '\92B' '\92C' '\92D' '\92E' '\92F' '\930' '\932' '\935' '\936' '\937' '\938' '\939' '\933';
/* symbols:  'क' 'ख' 'ग' 'घ' 'ङ' 'च' 'छ' 'ज' 'झ' 'ञ' 'ट' 'ठ' 'ड' 'ढ' 'ण' 'त' 'थ' 'द' 'ध' 'न' 'प' 'फ' 'ब' 'भ' 'म' 'य' 'र' 'ल' 'व' 'श' 'ष' 'स' 'ह' 'ळ' ; */
suffix: ') ';
}

/* https://www.w3.org/TR/predefined-counter-styles/#maithili */
@counter-style maithili {
system: alphabetic;
symbols: '\915' '\916' '\917' '\918' '\919' '\91A' '\91B' '\91C' '\91D' '\91E' '\91F' '\920' '\921' '\922' '\923' '\924' '\925' '\926' '\927' '\928' '\92A' '\92B' '\92C' '\92D' '\92E' '\92F' '\930' '\932' '\935' '\936' '\937' '\938' '\939' ;
/* symbols: 'क' 'ख' 'ग' 'घ' 'ङ' 'च' 'छ' 'ज' 'झ' 'ञ' 'ट' 'ठ' 'ड' 'ढ' 'ण' 'त' 'थ' 'द' 'ध' 'न' 'प' 'फ' 'ब' 'भ' 'म' 'य' 'र' 'ल' 'व' 'श' 'ष' 'स' 'ह' */
suffix: ') ';
}

/* https://www.w3.org/TR/predefined-counter-styles/#marathi */
@counter-style marathi {
system: alphabetic;
symbols:  '\915' '\916' '\917' '\918' '\919' '\91A' '\91B' '\91C' '\91D' '\91E' '\91F' '\920' '\921' '\922' '\923' '\924' '\925' '\926' '\927' '\928' '\92A' '\92B' '\92C' '\92D' '\92E' '\92F' '\930' '\932' '\935' '\936' '\937' '\938' '\939' '\933';
/* symbols:  'क' 'ख' 'ग' 'घ' 'ङ' 'च' 'छ' 'ज' 'झ' 'ञ' 'ट' 'ठ' 'ड' 'ढ' 'ण' 'त' 'थ' 'द' 'ध' 'न' 'प' 'फ' 'ब' 'भ' 'म' 'य' 'र' 'ल' 'व' 'श' 'ष' 'स' 'ह' 'ळ' ; */
suffix: ') ';
}

/* https://www.w3.org/TR/predefined-counter-styles/#sanskrit */
@counter-style sanskrit {
system: alphabetic;
symbols: '\915' '\916' '\917' '\918' '\919' '\91A' '\91B' '\91C' '\91D' '\91E' '\91F' '\920' '\921' '\922' '\923' '\924' '\925' '\926' '\927' '\928' '\92A' '\92B' '\92C' '\92D' '\92E' '\92F' '\930' '\932' '\935' '\936' '\937' '\938' '\939' ;
/* symbols: 'क' 'ख' 'ग' 'घ' 'ङ' 'च' 'छ' 'ज' 'झ' 'ञ' 'ट' 'ठ' 'ड' 'ढ' 'ण' 'त' 'थ' 'द' 'ध' 'न' 'प' 'फ' 'ब' 'भ' 'म' 'य' 'र' 'ल' 'व' 'श' 'ष' 'स' 'ह'; */
suffix: ') ';
}

/* https://www.w3.org/TR/predefined-counter-styles/#sindhi */
@counter-style sindhi {
system: alphabetic;
symbols:  '\0915' '\0916' '\0916 \093C' '\0917' '\097B' '\0917 \093C' '\0918' '\0919' '\091A' '\091B' '\091C' '\097C' '\091C\093C' '\091D' '\091E' '\091F' '\0920' '\0921' '\097E' '\0921\093C' '\0922' '\0922 \093C' '\0923' '\0924' '\0925' '\0926' '\0927' '\0928' '\092A' '\092B' '\092B\093C' '\092C' '\097F' '\092D' '\092E' '\092F' '\0930' '\0932' '\0935' '\0936' '\0937' '\0938' '\0939' ;
/* symbols:  'क' 'ख' 'ख़' 'ग' 'ॻ' 'ग़' 'घ' 'ङ' 'च' 'छ' 'ज' 'ॼ' 'ज़' 'झ' 'ञ' 'ट' 'ठ' 'ड' 'ॾ' 'ड़' 'ढ' 'ढ़' 'ण' 'त' 'थ' 'द' 'ध' 'न' 'प' 'फ' 'फ़' 'ब' 'ॿ' 'भ' 'म' 'य' 'र' 'ल' 'व' 'श' 'ष' 'स' 'ह' ; */
suffix: ') ';
}

/* https://www.w3.org/TR/predefined-counter-styles/#afar */
@counter-style afar {
system: alphabetic;
symbols: '\1200' '\1208' '\1210' '\1218' '\1228' '\1230' '\1260' '\1270' '\1290' '\12A0' '\12A8' '\12C8' '\12D0' '\12E8' '\12F0' '\12F8' '\1308' '\1338' '\1348';
/* symbols: 'ሀ' 'ለ' 'ሐ' 'መ' 'ረ' 'ሰ' 'በ' 'ተ' 'ነ' 'አ' 'ከ' 'ወ' 'ዐ' 'የ' 'ደ' 'ዸ' 'ገ' 'ጸ' 'ፈ'; */
suffix: '\1366 '; /* ፦ */
}

/* https://www.w3.org/TR/predefined-counter-styles/#agaw */
@counter-style agaw {
system: alphabetic;
symbols: '\1200' '\1208' '\1210' '\1218' '\1228' '\1230' '\1238' '\1240' '\1250' '\1260' '\1268' '\1270' '\1278' '\1290' '\1298' '\1300' '\1308' '\1318' '\1320' '\1328' '\1330' '\1338' '\1348' '\1350';
/* symbols: 'ሀ' 'ለ' 'ሐ' 'መ' 'ረ' 'ሰ' 'ሸ' 'ቀ' 'ቐ' 'በ' 'ቨ' 'ተ' 'ቸ' 'ነ' 'ኘ' 'ጀ' 'ገ' 'ጘ' 'ጠ' 'ጨ' 'ጰ' 'ጸ' 'ፈ' 'ፐ'; */
suffix: '\1366 '; /* ፦ */
}

/* https://www.w3.org/TR/predefined-counter-styles/#ari */
@counter-style ari {
system: alphabetic;
symbols: '\1200' '\1208' '\1218' '\1228' '\1230' '\1238' '\1260' '\1268' '\1270' '\1278' '\1290' '\1300' '\1308' '\1328' '\1340' '\1350';
/* symbols: 'ሀ' 'ለ' 'መ' 'ረ' 'ሰ' 'ሸ' 'በ' 'ቨ' 'ተ' 'ቸ' 'ነ' 'ጀ' 'ገ' 'ጨ' 'ፀ' 'ፐ'; */
suffix: '\1366 '; /* ፦ */
}

/* https://www.w3.org/TR/predefined-counter-styles/#blin */
@counter-style blin {
system: alphabetic;
symbols: '\1200' '\1208' '\1210' '\1218' '\1230' '\1238' '\1228' '\1240' '\1250' '\1260' '\1270' '\1290' '\1300' '\1308' '\1318' '\1320' '\1328' '\1348' '\1278' '\1298' '\1338' '\1330' '\1350';
/* symbols: 'ሀ' 'ለ' 'ሐ' 'መ' 'ሰ' 'ሸ' 'ረ' 'ቀ' 'ቐ' 'በ' 'ተ' 'ነ' 'ጀ' 'ገ' 'ጘ' 'ጠ' 'ጨ' 'ፈ' 'ቸ' 'ኘ' 'ጸ' 'ጰ' 'ፐ'; */
suffix: '\1366 '; /* ፦ */
}

/* https://www.w3.org/TR/predefined-counter-styles/#dizi */
@counter-style dizi {
system: alphabetic;
symbols: '\1200' '\1208' '\1218' '\1228' '\1230' '\1238' '\1240' '\1260' '\1270' '\1278' '\1290' '\1298' '\1300' '\1308' '\1320' '\1328' '\1338' '\1340' '\1348';
/* symbols: 'ሀ' 'ለ' 'መ' 'ረ' 'ሰ' 'ሸ' 'ቀ' 'በ' 'ተ' 'ቸ' 'ነ' 'ኘ' 'ጀ' 'ገ' 'ጠ' 'ጨ' 'ጸ' 'ፀ' 'ፈ'; */
suffix: '\1366 '; /* ፦ */
}

/* https://www.w3.org/TR/predefined-counter-styles/#ethiopic-halehame */
@counter-style ethiopic-halehame {
system: alphabetic;
symbols: '\1200' '\1208' '\1210' '\1218' '\1220' '\1228' '\1230' '\1240' '\1260' '\1270' '\1280' '\1290' '\12A0' '\12A8' '\12C8' '\12D0' '\12D8' '\12E8' '\12F0' '\1308' '\1320' '\1330' '\1338' '\1340' '\1348' '\1350';
/* symbols: 'ሀ' 'ለ' 'ሐ' 'መ' 'ሠ' 'ረ' 'ሰ' 'ቀ' 'በ' 'ተ' 'ኀ' 'ነ' 'አ' 'ከ' 'ወ' 'ዐ' 'ዘ' 'የ' 'ደ' 'ገ' 'ጠ' 'ጰ' 'ጸ' 'ፀ' 'ፈ' 'ፐ'; */
suffix: '\1366 '; /* ፦ */
}

/* https://www.w3.org/TR/predefined-counter-styles/#ethiopic-halehame-am */
@counter-style ethiopic-halehame-am {
system: alphabetic;
symbols: '\1200' '\1208' '\1210' '\1218' '\1220' '\1228' '\1230' '\1238' '\1240' '\1260' '\1270' '\1278' '\1280' '\1290' '\1298' '\12A0' '\12A8' '\12B8' '\12C8' '\12D0' '\12D8' '\12E0' '\12E8' '\12F0' '\1300' '\1308' '\1320' '\1328' '\1330' '\1338' '\1340' '\1348' '\1350';
/* symbols: 'ሀ' 'ለ' 'ሐ' 'መ' 'ሠ' 'ረ' 'ሰ' 'ሸ' 'ቀ' 'በ' 'ተ' 'ቸ' 'ኀ' 'ነ' 'ኘ' 'አ' 'ከ' 'ኸ' 'ወ' 'ዐ' 'ዘ' 'ዠ' 'የ' 'ደ' 'ጀ' 'ገ' 'ጠ' 'ጨ' 'ጰ' 'ጸ' 'ፀ' 'ፈ' 'ፐ'; */
suffix: '\1366 '; /* ፦ */
}

/* https://www.w3.org/TR/predefined-counter-styles/#ethiopic-halehame-ti-er */
@counter-style ethiopic-halehame-ti-er {
system: alphabetic;
symbols: '\1200' '\1208' '\1210' '\1218' '\1228' '\1230' '\1238' '\1240' '\1250' '\1260' '\1270' '\1278' '\1290' '\1298' '\12A0' '\12A8' '\12B8' '\12C8' '\12D0' '\12D8' '\12E0' '\12E8' '\12F0' '\1300' '\1308' '\1320' '\1328' '\1330' '\1338' '\1348' '\1350';
/* symbols: 'ሀ' 'ለ' 'ሐ' 'መ' 'ረ' 'ሰ' 'ሸ' 'ቀ' 'ቐ' 'በ' 'ተ' 'ቸ' 'ነ' 'ኘ' 'አ' 'ከ' 'ኸ' 'ወ' 'ዐ' 'ዘ' 'ዠ' 'የ' 'ደ' 'ጀ' 'ገ' 'ጠ' 'ጨ' 'ጰ' 'ጸ' 'ፈ' 'ፐ'; */
suffix: '\1366 '; /* ፦ */
}

/* https://www.w3.org/TR/predefined-counter-styles/#ethiopic-halehame-ti-et */
@counter-style ethiopic-halehame-ti-et {
system: alphabetic;
symbols: '\1200' '\1208' '\1210' '\1218' '\1220' '\1228' '\1230' '\1238' '\1240' '\1250' '\1260' '\1270' '\1278' '\1280' '\1290' '\1298' '\12A0' '\12A8' '\12B8' '\12C8' '\12D0' '\12D8' '\12E0' '\12E8' '\12F0' '\1300' '\1308' '\1320' '\1328' '\1330' '\1338' '\1340' '\1348' '\1350';
/* symbols: 'ሀ' 'ለ' 'ሐ' 'መ' 'ሠ' 'ረ' 'ሰ' 'ሸ' 'ቀ' 'ቐ' 'በ' 'ተ' 'ቸ' 'ኀ' 'ነ' 'ኘ' 'አ' 'ከ' 'ኸ' 'ወ' 'ዐ' 'ዘ' 'ዠ' 'የ' 'ደ' 'ጀ' 'ገ' 'ጠ' 'ጨ' 'ጰ' 'ጸ' 'ፀ' 'ፈ' 'ፐ'; */
suffix: '\1366 '; /* ፦ */
}

/* https://www.w3.org/TR/predefined-counter-styles/#gedeo */
@counter-style gedeo {
system: alphabetic;
symbols: '\1200' '\1208' '\1218' '\1228' '\1230' '\1238' '\1240' '\1260' '\1270' '\1278' '\1290' '\1300' '\1308' '\1320' '\1328' '\1330' '\1338' '\1348' '\1350';
/* symbols: 'ሀ' 'ለ' 'መ' 'ረ' 'ሰ' 'ሸ' 'ቀ' 'በ' 'ተ' 'ቸ' 'ነ' 'ጀ' 'ገ' 'ጠ' 'ጨ' 'ጰ' 'ጸ' 'ፈ' 'ፐ'; */
suffix: '\1366 '; /* ፦ */
}

/* https://www.w3.org/TR/predefined-counter-styles/#gumuz */
@counter-style gumuz {
system: alphabetic;
symbols: '\1200' '\1210' '\1208' '\1210' '\1218' '\1228' '\1230' '\1238' '\1240' '\1260' '\1268' '\1270' '\1278' '\1290' '\1298' '\1308' '\1328' '\1330' '\1340' '\1350';
/* symbols: 'ሀ' 'ሐ' 'ለ' 'ሐ' 'መ' 'ረ' 'ሰ' 'ሸ' 'ቀ' 'በ' 'ቨ' 'ተ' 'ቸ' 'ነ' 'ኘ' 'ገ' 'ጨ' 'ጰ' 'ፀ' 'ፐ'; */
suffix: '\1366 '; /* ፦ */
}

/* https://www.w3.org/TR/predefined-counter-styles/#hadiyya */
@counter-style hadiyya {
system: alphabetic;
symbols: '\1200' '\1208' '\1218' '\1228' '\1230' '\1238' '\1240' '\1260' '\1270' '\1278' '\1290' '\1300' '\1308' '\1320' '\1328' '\1330' '\1348' '\1350';
/* symbols: 'ሀ' 'ለ' 'መ' 'ረ' 'ሰ' 'ሸ' 'ቀ' 'በ' 'ተ' 'ቸ' 'ነ' 'ጀ' 'ገ' 'ጠ' 'ጨ' 'ጰ' 'ፈ' 'ፐ'; */
suffix: '\1366 '; /* ፦ */
}

/* https://www.w3.org/TR/predefined-counter-styles/#harari */
@counter-style harari {
system: alphabetic;
symbols: '\1210' '\1208' '\1218' '\1228' '\1230' '\1238' '\1240' '\1260' '\1270' '\1278' '\1290' '\1298' '\1300' '\1308' '\1320' '\1328' '\1348';
/* symbols: 'ሐ' 'ለ' 'መ' 'ረ' 'ሰ' 'ሸ' 'ቀ' 'በ' 'ተ' 'ቸ' 'ነ' 'ኘ' 'ጀ' 'ገ' 'ጠ' 'ጨ' 'ፈ'; */
suffix: '\1366 '; /* ፦ */
}

/* https://www.w3.org/TR/predefined-counter-styles/#kaffa */
@counter-style kaffa {
system: alphabetic;
symbols: '\1200' '\1208' '\1210' '\1218' '\1220' '\1228' '\1230' '\1238' '\1240' '\1260' '\1270' '\1278' '\1280' '\1290' '\1300' '\1308' '\1320' '\1328' '\1330' '\1348' '\1350';
/* symbols: 'ሀ' 'ለ' 'ሐ' 'መ' 'ሠ' 'ረ' 'ሰ' 'ሸ' 'ቀ' 'በ' 'ተ' 'ቸ' 'ኀ' 'ነ' 'ጀ' 'ገ' 'ጠ' 'ጨ' 'ጰ' 'ፈ' 'ፐ'; */
suffix: '\1366 '; /* ፦ */
}

/* https://www.w3.org/TR/predefined-counter-styles/#kebena */
@counter-style kebena {
system: alphabetic;
symbols: '\1200' '\1208' '\1218' '\1228' '\1230' '\1238' '\1240' '\1260' '\1270' '\1278' '\1290' '\1300' '\1308' '\1320' '\1328' '\1330' '\1348' '\1350';
/* symbols: 'ሀ' 'ለ' 'መ' 'ረ' 'ሰ' 'ሸ' 'ቀ' 'በ' 'ተ' 'ቸ' 'ነ' 'ጀ' 'ገ' 'ጠ' 'ጨ' 'ጰ' 'ፈ' 'ፐ'; */
suffix: '\1366 '; /* ፦ */
}

/* https://www.w3.org/TR/predefined-counter-styles/#kembata */
@counter-style kembata {
system: alphabetic;
symbols: '\1200' '\1208' '\1218' '\1228' '\1230' '\1238' '\1240' '\1260' '\1268' '\1270' '\1278' '\1290' '\1300' '\1308' '\1320' '\1328' '\1330' '\1348';
/* symbols: 'ሀ' 'ለ' 'መ' 'ረ' 'ሰ' 'ሸ' 'ቀ' 'በ' 'ቨ' 'ተ' 'ቸ' 'ነ' 'ጀ' 'ገ' 'ጠ' 'ጨ' 'ጰ' 'ፈ'; */
suffix: '\1366 '; /* ፦ */
}

/* https://www.w3.org/TR/predefined-counter-styles/#konso */
@counter-style konso {
system: alphabetic;
symbols: '\1200' '\1208' '\1218' '\1228' '\1230' '\1238' '\1240' '\1260' '\1270' '\1278' '\1290' '\1298' '\1300' '\1348' '\1350';
/* symbols: 'ሀ' 'ለ' 'መ' 'ረ' 'ሰ' 'ሸ' 'ቀ' 'በ' 'ተ' 'ቸ' 'ነ' 'ኘ' 'ጀ' 'ፈ' 'ፐ'; */
suffix: '\1366 '; /* ፦ */
}

/* https://www.w3.org/TR/predefined-counter-styles/#kunama */
@counter-style kunama {
system: alphabetic;
symbols: '\1200' '\1208' '\1218' '\1228' '\1230' '\1238' '\1260' '\1270' '\1278' '\1290' '\1298' '\1300' '\1308';
/* symbols: 'ሀ' 'ለ' 'መ' 'ረ' 'ሰ' 'ሸ' 'በ' 'ተ' 'ቸ' 'ነ' 'ኘ' 'ጀ' 'ገ'; */
suffix: '\1366 '; /* ፦ */
}

/* https://www.w3.org/TR/predefined-counter-styles/#meen */
@counter-style meen {
system: alphabetic;
symbols: '\1200' '\1208' '\1218' '\1228' '\1230' '\1238' '\1240' '\1260' '\1270' '\1278' '\1280' '\1290' '\1298' '\1300' '\1308' '\1320' '\1328' '\1330' '\1350' '\1340';
/* symbols: 'ሀ' 'ለ' 'መ' 'ረ' 'ሰ' 'ሸ' 'ቀ' 'በ' 'ተ' 'ቸ' 'ኀ' 'ነ' 'ኘ' 'ጀ' 'ገ' 'ጠ' 'ጨ' 'ጰ' 'ፐ' 'ፀ'; */
suffix: '\1366 '; /* ፦ */
}

/* https://www.w3.org/TR/predefined-counter-styles/#oromo */
@counter-style oromo {
system: alphabetic;
symbols: '\1200' '\1208' '\1218' '\1228' '\1230' '\1238' '\1240' '\1260' '\1270' '\1278' '\1290' '\1298' '\12A0' '\12A8' '\12C8' '\12E8' '\12F0' '\12F8' '\1300' '\1308' '\1320' '\1328' '\1330' '\1338' '\1348';
/* symbols: 'ሀ' 'ለ' 'መ' 'ረ' 'ሰ' 'ሸ' 'ቀ' 'በ' 'ተ' 'ቸ' 'ነ' 'ኘ' 'አ' 'ከ' 'ወ' 'የ' 'ደ' 'ዸ' 'ጀ' 'ገ' 'ጠ' 'ጨ' 'ጰ' 'ጸ' 'ፈ'; */
suffix: '\1366 '; /* ፦ */
}

/* https://www.w3.org/TR/predefined-counter-styles/#saho */
@counter-style saho {
system: alphabetic;
symbols: '\1200' '\1208' '\1210' '\1218' '\1228' '\1230' '\1240' '\1260' '\1270' '\1290' '\1308' '\1320' '\1328' '\1330' '\1338' '\1348';
/* symbols: 'ሀ' 'ለ' 'ሐ' 'መ' 'ረ' 'ሰ' 'ቀ' 'በ' 'ተ' 'ነ' 'ገ' 'ጠ' 'ጨ' 'ጰ' 'ጸ' 'ፈ'; */
suffix: '\1366 '; /* ፦ */
}

/* https://www.w3.org/TR/predefined-counter-styles/#sidama */
@counter-style sidama {
system: alphabetic;
symbols: '\1200' '\1208' '\1218' '\1228' '\1230' '\1238' '\1240' '\1260' '\1270' '\1278' '\1290' '\1298' '\12A0' '\12A8' '\12C8' '\12E8' '\12F0' '\12F8' '\1300' '\1308' '\1320' '\1328' '\1330' '\1338' '\1348';
/* symbols: 'ሀ' 'ለ' 'መ' 'ረ' 'ሰ' 'ሸ' 'ቀ' 'በ' 'ተ' 'ቸ' 'ነ' 'ኘ' 'አ' 'ከ' 'ወ' 'የ' 'ደ' 'ዸ' 'ጀ' 'ገ' 'ጠ' 'ጨ' 'ጰ' 'ጸ' 'ፈ'; */
suffix: '\1366 '; /* ፦ */
}

/* https://www.w3.org/TR/predefined-counter-styles/#silti */
@counter-style silti {
system: alphabetic;
symbols: '\1200' '\1208' '\1218' '\1228' '\1230' '\1238' '\1240' '\1260' '\1270' '\1278' '\1290' '\1298' '\1300' '\1308' '\1320' '\1328' '\1330' '\1348';
/* symbols: 'ሀ' 'ለ' 'መ' 'ረ' 'ሰ' 'ሸ' 'ቀ' 'በ' 'ተ' 'ቸ' 'ነ' 'ኘ' 'ጀ' 'ገ' 'ጠ' 'ጨ' 'ጰ' 'ፈ'; */
suffix: '\1366 '; /* ፦ */
}

/* https://www.w3.org/TR/predefined-counter-styles/#tigre */
@counter-style tigre {
system: alphabetic;
symbols: '\1200' '\1208' '\1210' '\1218' '\1228' '\1230' '\1238' '\1240' '\1260' '\1270' '\1278' '\1290' '\12A0' '\12A8' '\12C8' '\12D0' '\12D8' '\12E8' '\12F0' '\1300' '\1308' '\1320' '\1328' '\1330' '\1338' '\1348' '\1350';
/* symbols: 'ሀ' 'ለ' 'ሐ' 'መ' 'ረ' 'ሰ' 'ሸ' 'ቀ' 'በ' 'ተ' 'ቸ' 'ነ' 'አ' 'ከ' 'ወ' 'ዐ' 'ዘ' 'የ' 'ደ' 'ጀ' 'ገ' 'ጠ' 'ጨ' 'ጰ' 'ጸ' 'ፈ' 'ፐ'; */
suffix: '\1366 '; /* ፦ */
}

/* https://www.w3.org/TR/predefined-counter-styles/#wolaita */
@counter-style wolaita {
system: alphabetic;
symbols: '\1200' '\1208' '\1218' '\1228' '\1230' '\1238' '\1240' '\1260' '\1270' '\1278' '\1290' '\1298' '\1230' '\1308' '\1320' '\1328' '\1330' '\1338' '\1340' '\1348' '\1350';
/* symbols: 'ሀ' 'ለ' 'መ' 'ረ' 'ሰ' 'ሸ' 'ቀ' 'በ' 'ተ' 'ቸ' 'ነ' 'ኘ' 'ሰ' 'ገ' 'ጠ' 'ጨ' 'ጰ' 'ጸ' 'ፀ' 'ፈ' 'ፐ'; */
suffix: '\1366 '; /* ፦ */
}

/* https://www.w3.org/TR/predefined-counter-styles/#yemsa */
@counter-style yemsa {
system: alphabetic;
symbols: '\1200' '\1208' '\1218' '\1228' '\1230' '\1238' '\1240' '\1260' '\1268' '\1270' '\1278' '\1290' '\1298' '\1300' '\1308' '\1318' '\1320' '\1328' '\1330' '\1348' '\1350';
/* symbols: 'ሀ' 'ለ' 'መ' 'ረ' 'ሰ' 'ሸ' 'ቀ' 'በ' 'ቨ' 'ተ' 'ቸ' 'ነ' 'ኘ' 'ጀ' 'ገ' 'ጘ' 'ጠ' 'ጨ' 'ጰ' 'ፈ' 'ፐ'; */
suffix: '\1366 '; /* ፦ */
}

/* https://www.w3.org/TR/predefined-counter-styles/#georgian */
@counter-style georgian {
system: additive;
range: 1 19999;
additive-symbols: 10000 '\10F5', 9000 '\10F0', 8000 '\10EF', 7000 '\10F4', 6000 '\10EE', 5000 '\10ED', 4000 '\10EC', 3000 '\10EB', 2000 '\10EA', 1000 '\10E9', 900 '\10E8', 800 '\10E7', 700 '\10E6', 600 '\10E5', 500 '\10E4', 400 '\10F3', 300 '\10E2', 200 '\10E1', 100 '\10E0', 90 '\10DF', 80 '\10DE', 70 '\10DD', 60 '\10F2', 50 '\10DC', 40 '\10DB', 30 '\10DA', 20 '\10D9', 10 '\10D8', 9 '\10D7', 8 '\10F1', 7 '\10D6', 6 '\10D5', 5 '\10D4', 4 '\10D3', 3 '\10D2', 2 '\10D1', 1 '\10D0';
/* additive-symbols: 10000 'ჵ', 9000 'ჰ', 8000 'ჯ', 7000 'ჴ', 6000 'ხ', 5000 'ჭ', 4000 'წ', 3000 'ძ', 2000 'ც', 1000 'ჩ', 900 'შ', 800 'ყ', 700 'ღ', 600 'ქ', 500 'ფ', 400 'ჳ', 300 'ტ', 200 'ს', 100 'რ', 90 'ჟ', 80 'პ', 70 'ო', 60 'ჲ', 50 'ნ', 40 'მ', 30 'ლ', 20 'კ', 10 'ი', 9 'თ', 8 'ჱ', 7 'ზ', 6 'ვ', 5 'ე', 4 'დ', 3 'გ', 2 'ბ', 1 'ა'; */
}

/* https://www.w3.org/TR/predefined-counter-styles/#greek-lower-modern */
@counter-style greek-lower-modern {
system: additive;
range: 1 999;
additive-symbols: 900 \3E1, 800 \3C9, 700 \3C8, 600 \3C7, 500 \3C6, 400 \3C5, 300 \3C4, 200 \3C3, 100 \3C1, 90 \3DF, 80 \3C0, 70 \3BF, 60 \3BE, 50 \3BD, 40 \3BC, 30 \3BB, 20 \3BA, 10 \3B9, 9 \3B8, 8 \3B7, 7 \3B6, 6 \3C3\3C4, 5 \3B5, 4 \3B4, 3 \3B3, 2 \3B2, 1 \3B1;
/* additive-symbols: 900 ϡ, 800 ω, 700 ψ, 600 χ, 500 φ, 400 υ, 300 τ, 200 σ, 100 ρ, 90 ϟ, 80 π, 70 ο, 60 ξ, 50 ν, 40 μ, 30 λ, 20 κ, 10 ι, 9 θ, 8 η, 7 ζ, 6 στ, 5 ε, 4 δ, 3 γ, 2 β, 1 α; */
}

/* https://www.w3.org/TR/predefined-counter-styles/#greek-upper-modern */
@counter-style greek-upper-modern {
system: additive;
range: 1 999;
additive-symbols: 900 \3E0, 800 \3A9, 700 \3A8, 600 \3A7, 500 \3A6, 400 \3A5, 300 \3A4, 200 \3A3, 100 \3A1, 90 \3DE, 80 \3A0, 70 \39F, 60 \39E, 50 \39D, 40 \39C, 30 \39B, 20 \39A, 10 \399, 9 \398, 8 \397, 7 \396, 6 \3A3\3A4, 5 \395, 4 \394, 3 \393, 2 \392, 1 \391;
/* additive-symbols: 900 Ϡ, 800 Ω, 700 Ψ, 600 Χ, 500 Φ, 400 Υ, 300 Τ, 200 Σ, 100 Ρ, 90 Ϟ, 80 Π, 70 Ο, 60 Ξ, 50 Ν, 40 Μ, 30 Λ, 20 Κ, 10 Ι, 9 Θ, 8 Η, 7 Ζ, 6 ΣΤ, 5 Ε, 4 Δ, 3 Γ, 2 Β, 1 Α; */
}

/* https://www.w3.org/TR/predefined-counter-styles/#greek-lower-ancient */
@counter-style greek-lower-ancient {
system: additive;
range: 1 999;
additive-symbols: 900 \3E1, 800 \3C9, 700 \3C8, 600 \3C7, 500 \3C6, 400 \3C5, 300 \3C4, 200 \3C3, 100 \3C1, 90 \3DF, 80 \3C0, 70 \3BF, 60 \3BE, 50 \3BD, 40 \3BC, 30 \3BB, 20 \3BA, 10 \3B9, 9 \3B8, 8 \3B7, 7 \3B6, 6 \3DB, 5 \3B5, 4 \3B4, 3 \3B3, 2 \3B2, 1 \3B1;
/* additive-symbols: 900 ϡ, 800 ω, 700 ψ, 600 χ, 500 φ, 400 υ, 300 τ, 200 σ, 100 ρ, 90 ϟ, 80 π, 70 ο, 60 ξ, 50 ν, 40 μ, 30 λ, 20 κ, 10 ι, 9 θ, 8 η, 7 ζ, 6 ϛ, 5 ε, 4 δ, 3 γ, 2 β, 1 α; */
}

/* https://www.w3.org/TR/predefined-counter-styles/#greek-upper-ancient */
@counter-style greek-upper-ancient {
system: additive;
range: 1 999;
additive-symbols: 900 \3E0, 800 \3A9, 700 \3A8, 600 \3A7, 500 \3A6, 400 \3A5, 300 \3A4, 200 \3A3, 100 \3A1, 90 \3DE, 80 \3A0, 70 \39F, 60 \39E, 50 \39D, 40 \39C, 30 \39B, 20 \39A, 10 \399, 9 \398, 8 \397, 7 \396, 6 \3DA, 5 \395, 4 \394, 3 \393, 2 \392, 1 \391;
/* additive-symbols: 900 Ϡ, 800 Ω, 700 Ψ, 600 Χ, 500 Φ, 400 Υ, 300 Τ, 200 Σ, 100 Ρ, 90 Ϟ, 80 Π, 70 Ο, 60 Ξ, 50 Ν, 40 Μ, 30 Λ, 20 Κ, 10 Ι, 9 Θ, 8 Η, 7 Ζ, 6 Ϛ, 5 Ε, 4 Δ, 3 Γ, 2 Β, 1 Α; */
}

/* https://www.w3.org/TR/predefined-counter-styles/#lower-greek */
@counter-style lower-greek {
system: alphabetic;
symbols: '\3B1' '\3B2' '\3B3' '\3B4' '\3B5' '\3B6' '\3B7' '\3B8' '\3B9' '\3BA' '\3BB' '\3BC' '\3BD' '\3BE' '\3BF' '\3C0' '\3C1' '\3C3' '\3C4' '\3C5' '\3C6' '\3C7' '\3C8' '\3C9';
/* symbols: 'α' 'β' 'γ' 'δ' 'ε' 'ζ' 'η' 'θ' 'ι' 'κ' 'λ' 'μ' 'ν' 'ξ' 'ο' 'π' 'ρ' 'σ' 'τ' 'υ' 'φ' 'χ' 'ψ' 'ω'; */
/* This style is only defined because CSS2.1 has it.  It doesn't appear to actually be used in Greek texts. */
}

/* https://www.w3.org/TR/predefined-counter-styles/#gujarati */
@counter-style gujarati {
system: numeric;
symbols: '\AE6' '\AE7' '\AE8' '\AE9' '\AEA' '\AEB' '\AEC' '\AED' '\AEE' '\AEF';
/* symbols: '૦' '૧' '૨' '૩' '૪' '૫' '૬' '૭' '૮' '૯'; */
}

/* https://www.w3.org/TR/predefined-counter-styles/#gujarati-alpha */
@counter-style gujarati-alpha {
system: alphabetic;
symbols: '\0A95' '\0A96' '\0A97' '\0A98' '\0A99' '\0A9A' '\0A9B' '\0A9C' '\0A9D' '\0A9E' '\0A9F' '\0AA0' '\0AA1' '\0AA2' '\0AA3' '\0AA4' '\0AA5' '\0AA6' '\0AA7' '\0AA8' '\0AAA' '\0AAB' '\0AAC' '\0AAD' '\0AAE' '\0AAF' '\0AB0' '\0AB2' '\0AB5' '\0AB6' '\0AB7' '\0AB8' '\0AB9' '\0AB3';
/* symbols:  'ક' 'ખ' 'ગ' 'ઘ' 'ઙ' 'ચ' 'છ' 'જ' 'ઝ' 'ઞ' 'ટ' 'ઠ' 'ડ' 'ઢ' 'ણ' 'ત' 'થ' 'દ' 'ધ' 'ન' 'પ' 'ફ' 'બ' 'ભ' 'મ' 'ય' 'ર' 'લ' 'વ' 'શ' 'ષ' 'સ' 'હ' 'ળ' ;  */
prefix: '( ';
suffix: ' ) ';
}

/* https://www.w3.org/TR/predefined-counter-styles/#gurmukhi */
@counter-style gurmukhi {
system: numeric;
symbols: '\A66' '\A67' '\A68' '\A69' '\A6A' '\A6B' '\A6C' '\A6D' '\A6E' '\A6F';
/* symbols: '੦' '੧' '੨' '੩' '੪' '੫' '੬' '੭' '੮' '੯'; */
}

/* https://www.w3.org/TR/predefined-counter-styles/#punjabi */
@counter-style punjabi {
system: alphabetic;
symbols: '\0A73' '\0A05' '\0A72' '\0A38' '\0A39' '\0A15' '\0A16' '\0A17' '\0A18' '\0A19' '\0A1A' '\0A1B' '\0A1C' '\0A1D' '\0A1E' '\0A1F' '\0A20' '\0A21 ' '\0A22' '\0A23' '\0A24' '\0A25' '\0A26' '\0A27' '\0A28' '\0A2A' '\0A2B ' '\0A2C' '\0A2D' '\0A2E' '\0A2F' '\0A30' '\0A32' '\0A35' '\0A5C' ;
/* symbols:  'ੳ' 'ਅ' 'ੲ' 'ਸ' 'ਹ' 'ਕ' 'ਖ' 'ਗ' 'ਘ' 'ਙ' 'ਚ' 'ਛ' 'ਜ' 'ਝ' 'ਞ' 'ਟ' 'ਠ' 'ਡ' 'ਢ' 'ਣ' 'ਤ' 'ਥ' 'ਦ' 'ਧ' 'ਨ' 'ਪ' 'ਫ' 'ਬ' 'ਭ' 'ਮ' 'ਯ' 'ਰ' 'ਲ' 'ਵ' 'ੜ' ;  */
suffix: ') ';
}

/* https://www.w3.org/TR/predefined-counter-styles/#hanifi-rohingya */
@counter-style hanifi-rohingya {
system: numeric;
symbols: '\10D30' '\10D31' '\10D32' '\10D33' '\10D34' '\10D35' '\10D36' '\10D37' '\10D38' '\10D39';
/* symbols: '𐴰' '𐴱' '𐴲' '𐴳' '𐴴' '𐴵' '𐴶' '𐴷' '𐴸' '𐴹'; */
}

/* https://www.w3.org/TR/predefined-counter-styles/#hebrew */
@counter-style hebrew {
system: additive;
range: 1 10999;
additive-symbols: 10000 \5D9\5F3, 9000 \5D8\5F3, 8000 \5D7\5F3, 7000 \5D6\5F3, 6000 \5D5\5F3, 5000 \5D4\5F3, 4000 \5D3\5F3, 3000 \5D2\5F3, 2000 \5D1\5F3, 1000 \5D0\5F3, 400 \5EA, 300 \5E9, 200 \5E8, 100 \5E7, 90 \5E6, 80 \5E4, 70 \5E2, 60 \5E1, 50 \5E0, 40 \5DE, 30 \5DC, 20 \5DB, 19 \5D9\5D8, 18 \5D9\5D7, 17 \5D9\5D6, 16 \5D8\5D6, 15 \5D8\5D5, 10 \5D9, 9 \5D8, 8 \5D7, 7 \5D6, 6 \5D5, 5 \5D4, 4 \5D3, 3 \5D2, 2 \5D1, 1 \5D0;
/* additive-symbols: 10000 י׳, 9000 ט׳, 8000 ח׳, 7000 ז׳, 6000 ו׳, 5000 ה׳, 4000 ד׳, 3000 ג׳, 2000 ב׳, 1000 א׳, 400 ת, 300 ש, 200 ר, 100 ק, 90 צ, 80 פ, 70 ע, 60 ס, 50 נ, 40 מ, 30 ל, 20 כ, 19 יט, 18 יח, 17 יז, 16 טז, 15 טו, 10 י, 9 ט, 8 ח, 7 ז, 6 ו, 5 ה, 4 ד, 3 ג, 2 ב, 1 א; */
}

/* https://www.w3.org/TR/predefined-counter-styles/#cjk-decimal */
@counter-style cjk-decimal {
system: numeric;
range: 0 infinite;
symbols: '\3007' '\4E00' '\4E8C' '\4E09' '\56DB' '\4E94' '\516D' '\4E03' '\516B' '\4E5D';
/* symbols: 〇 一 二 三 四 五 六 七 八 九; */
suffix: '\3001';
/* suffix: "、" */
}

/* https://www.w3.org/TR/predefined-counter-styles/#cjk-earthly-branch */
@counter-style cjk-earthly-branch {
system: fixed;
symbols: '\5B50' '\4E11' '\5BC5' '\536F' '\8FB0' '\5DF3' '\5348' '\672A' '\7533' '\9149' '\620C' '\4EA5';
suffix: '\3001';
fallback: cjk-decimal;
/* symbols: '子' '丑' '寅' '卯' '辰' '巳' '午' '未' '申' '酉' '戌' '亥'; */
/* suffix: '、'; */
}

/* https://www.w3.org/TR/predefined-counter-styles/#cjk-heavenly-stem */
@counter-style cjk-heavenly-stem {
system: fixed;
symbols: '\7532' '\4E59' '\4E19' '\4E01' '\620A' '\5DF1' '\5E9A' '\8F9B' '\58EC' '\7678';
suffix: '\3001';
fallback: cjk-decimal;
/* symbols: '甲' '乙' '丙' '丁' '戊' '己' '庚' '辛' '壬' '癸'; */
/* suffix: '、'; */
}

/* https://www.w3.org/TR/predefined-counter-styles/#circled-ideograph */
@counter-style circled-ideograph {
system: fixed;
symbols: '\3280' '\3281' '\3282' '\3283' '\3284' '\3285' '\3286' '\3287' '\3288' '\3289';
/* symbols: '㊀' '㊁' '㊂' '㊃' '㊄' '㊅' '㊆' '㊇' '㊈' '㊉'; */
suffix: ' ';
}

/* https://www.w3.org/TR/predefined-counter-styles/#parenthesized-ideograph */
@counter-style parenthesized-ideograph {
system: fixed;
symbols: '\3220' '\3221' '\3222' '\3223' '\3224' '\3225' '\3226' '\3227' '\3228' '\3229';
/* symbols: '㈠' '㈡' '㈢' '㈣' '㈤' '㈥' '㈦' '㈧' '㈨' '㈩'; */
suffix: ' ';
}

/* https://www.w3.org/TR/predefined-counter-styles/#cjk-tally-mark */
@counter-style cjk-tally-mark {
system: additive;
additive-symbols: 5 '\1D376', 4 '\1D375', 3 '\1D374', 2 '\1D373', 1 '\1D372';
/* symbols: 5 𝍶, 4 𝍵, 3 𝍴, 2 𝍳, 1 𝍲; */
suffix: ' ';
}

/* https://www.w3.org/TR/predefined-counter-styles/#cjk-stem-branch */
@counter-style cjk-stem-branch {
system: cyclic;
symbols:  '\7532\5B50' '\4E59\4E11' '\4E19\5BC5' '\4E01\536F' '\620A\8FB0' '\5DF1\5DF3' '\5E9A\5348' '\8F9B\672A' '\58EC\7533' '\7678\9149'
'\7532\620C' '\4E59\4EA5' '\4E19\5B50' '\4E01\4E11' '\620A\5BC5' '\5DF1\536F' '\5E9A\8FB0' '\8F9B\5DF3' '\58EC\5348' '\7678\672A'
'\7532\7533' '\4E59\9149' '\4E19\620C' '\4E01\4EA5' '\620A\5B50' '\5DF1\4E11' '\5E9A\5BC5' '\8F9B\536F' '\58EC\8FB0' '\7678\5DF3'
'\7532\5348' '\4E59\672A' '\4E19\7533' '\4E01\9149' '\620A\620C' '\5DF1\4EA5' '\5E9A\5B50' '\8F9B\4E11' '\58EC\5BC5' '\7678\536F'
'\7532\8FB0' '\4E59\5DF3' '\4E19\5348' '\4E01\672A' '\620A\7533' '\5DF1\9149' '\5E9A\620C' '\8F9B\4EA5' '\58EC\5B50' '\7678\4E11'
'\7532\5BC5' '\4E59\536F' '\4E19\8FB0' '\4E01\5DF3' '\620A\5348' '\5DF1\672A' '\5E9A\7533' '\8F9B\9149' '\58EC\620C' '\7678\4EA5';
/* 甲子 乙丑 丙寅 丁卯 戊辰 己巳 庚午 辛未 壬申 癸酉 */
/* 甲戌 乙亥 丙子 丁丑 戊寅 己卯 庚辰 辛巳 壬午 癸未 */   
/* 甲申 乙酉 丙戌 丁亥 戊子 己丑 庚寅 辛卯 壬辰 癸巳 */   
/* 甲午 乙未 丙申 丁酉 戊戌 己亥 庚子 辛丑 壬寅 癸卯 */   
/* 甲辰 乙巳 丙午 丁未 戊申 己酉 庚戌 辛亥 壬子 癸丑 */   
/* 甲寅 乙卯 丙辰 丁巳 戊午 己未 庚申 辛酉 壬戌 癸亥 */
suffix: '、';
}

/* https://www.w3.org/TR/predefined-counter-styles/#hiragana */
@counter-style hiragana {
system: alphabetic;
symbols: '\3042' '\3044' '\3046' '\3048' '\304A' '\304B' '\304D' '\304F' '\3051' '\3053' '\3055' '\3057' '\3059' '\305B' '\305D' '\305F' '\3061' '\3064' '\3066' '\3068' '\306A' '\306B' '\306C' '\306D' '\306E' '\306F' '\3072' '\3075' '\3078' '\307B' '\307E' '\307F' '\3080' '\3081' '\3082' '\3084' '\3086' '\3088' '\3089' '\308A' '\308B' '\308C' '\308D' '\308F' '\3090' '\3091' '\3092' '\3093';
/* symbols: あ い う え お か き く け こ さ し す せ そ た ち つ て と な に ぬ ね の は ひ ふ へ ほ ま み む め も や ゆ よ ら り る れ ろ わ ゐ ゑ を ん; */
suffix: '、';
}

/* https://www.w3.org/TR/predefined-counter-styles/#hiragana-iroha */
@counter-style hiragana-iroha {
system: alphabetic;
symbols: '\3044' '\308D' '\306F' '\306B' '\307B' '\3078' '\3068' '\3061' '\308A' '\306C' '\308B' '\3092' '\308F' '\304B' '\3088' '\305F' '\308C' '\305D' '\3064' '\306D' '\306A' '\3089' '\3080' '\3046' '\3090' '\306E' '\304A' '\304F' '\3084' '\307E' '\3051' '\3075' '\3053' '\3048' '\3066' '\3042' '\3055' '\304D' '\3086' '\3081' '\307F' '\3057' '\3091' '\3072' '\3082' '\305B' '\3059';
/* symbols: い ろ は に ほ へ と ち り ぬ る を わ か よ た れ そ つ ね な ら む う ゐ の お く や ま け ふ こ え て あ さ き ゆ め み し ゑ ひ も せ す; */
suffix: '、';
}

/* https://www.w3.org/TR/predefined-counter-styles/#katakana */
@counter-style katakana {
system: alphabetic;
symbols: '\30A2' '\30A4' '\30A6' '\30A8' '\30AA' '\30AB' '\30AD' '\30AF' '\30B1' '\30B3' '\30B5' '\30B7' '\30B9' '\30BB' '\30BD' '\30BF' '\30C1' '\30C4' '\30C6' '\30C8' '\30CA' '\30CB' '\30CC' '\30CD' '\30CE' '\30CF' '\30D2' '\30D5' '\30D8' '\30DB' '\30DE' '\30DF' '\30E0' '\30E1' '\30E2' '\30E4' '\30E6' '\30E8' '\30E9' '\30EA' '\30EB' '\30EC' '\30ED' '\30EF' '\30F0' '\30F1' '\30F2' '\30F3';
/* symbols: ア イ ウ エ オ カ キ ク ケ コ サ シ ス セ ソ タ チ ツ テ ト ナ ニ ヌ ネ ノ ハ ヒ フ ヘ ホ マ ミ ム メ モ ヤ ユ ヨ ラ リ ル レ ロ ワ ヰ ヱ ヲ ン; */
suffix: '、';
}

/* https://www.w3.org/TR/predefined-counter-styles/#katakana-iroha */
@counter-style katakana-iroha {
system: alphabetic;
symbols: '\30A4' '\30ED' '\30CF' '\30CB' '\30DB' '\30D8' '\30C8' '\30C1' '\30EA' '\30CC' '\30EB' '\30F2' '\30EF' '\30AB' '\30E8' '\30BF' '\30EC' '\30BD' '\30C4' '\30CD' '\30CA' '\30E9' '\30E0' '\30A6' '\30F0' '\30CE' '\30AA' '\30AF' '\30E4' '\30DE' '\30B1' '\30D5' '\30B3' '\30A8' '\30C6' '\30A2' '\30B5' '\30AD' '\30E6' '\30E1' '\30DF' '\30B7' '\30F1' '\30D2' '\30E2' '\30BB' '\30B9';
/* symbols: イ ロ ハ ニ ホ ヘ ト チ リ ヌ ル ヲ ワ カ ヨ タ レ ソ ツ ネ ナ ラ ム ウ ヰ ノ オ ク ヤ マ ケ フ コ エ テ ア サ キ ユ メ ミ シ ヱ ヒ モ セ ス; */
suffix: '、';
}

/* https://www.w3.org/TR/predefined-counter-styles/#circled-katakana */
@counter-style circled-katakana {
system: fixed;
symbols: '\32D0' '\32D1' '\32D2' '\32D3' '\32D4' '\32D5' '\32D6' '\32D7' '\32D8' '\32D9' '\32DA' '\32DB' '\32DC' '\32DD' '\32DE' '\32DF' '\32E0' '\32E1' '\32E2' '\32E3' '\32E4' '\32E5' '\32E6' '\32E7' '\32E8' '\32E9' '\32EA' '\32EB' '\32EC' '\32ED' '\32EE' '\32EF' '\32F0' '\32F1' '\32F2' '\32F3' '\32F4' '\32F5' '\32F6' '\32F7' '\32F8' '\32F9' '\32FA' '\32FB' '\32FC' '\32FD' '\32FE';
/* symbols: ㋐ ㋑ ㋒ ㋓ ㋔ ㋕ ㋖ ㋗ ㋘ ㋙ ㋚ ㋛ ㋜ ㋝ ㋞ ㋟ ㋠ ㋡ ㋢ ㋣ ㋤ ㋥ ㋦ ㋧ ㋨ ㋩ ㋪ ㋫ ㋬ ㋭ ㋮ ㋯ ㋰ ㋱ ㋲ ㋳ ㋴ ㋵ ㋶ ㋷ ㋸ ㋹ ㋺ ㋻ ㋼ ㋽ ㋾; */
suffix: ' ';
}

/* https://www.w3.org/TR/predefined-counter-styles/#japanese-informal */
@counter-style japanese-informal {
system: additive;
range: -9999 9999;
additive-symbols: 9000 \4E5D\5343, 8000 \516B\5343, 7000 \4E03\5343, 6000 \516D\5343, 5000 \4E94\5343, 4000 \56DB\5343, 3000 \4E09\5343, 2000 \4E8C\5343, 1000 \5343, 900 \4E5D\767E, 800 \516B\767E, 700 \4E03\767E, 600 \516D\767E, 500 \4E94\767E, 400 \56DB\767E, 300 \4E09\767E, 200 \4E8C\767E, 100 \767E, 90 \4E5D\5341, 80 \516B\5341, 70 \4E03\5341, 60 \516D\5341, 50 \4E94\5341, 40 \56DB\5341, 30 \4E09\5341, 20 \4E8C\5341, 10 \5341, 9 \4E5D, 8 \516B, 7 \4E03, 6 \516D, 5 \4E94, 4 \56DB, 3 \4E09, 2 \4E8C, 1 \4E00, 0 \3007;
/* additive-symbols: 9000 九千, 8000 八千, 7000 七千, 6000 六千, 5000 五千, 4000 四千, 3000 三千, 2000 二千, 1000 千, 900 九百, 800 八百, 700 七百, 600 六百, 500 五百, 400 四百, 300 三百, 200 二百, 100 百, 90 九十, 80 八十, 70 七十, 60 六十, 50 五十, 40 四十, 30 三十, 20 二十, 10 十, 9 九, 8 八, 7 七, 6 六, 5 五, 4 四, 3 三, 2 二, 1 一, 0 〇; */
suffix: '\3001';
/* suffix: '、'; */
negative: "\30DE\30A4\30CA\30B9";
/* negative: マイナス; */
fallback: cjk-decimal;
}

/* https://www.w3.org/TR/predefined-counter-styles/#japanese-formal */
@counter-style japanese-formal {
system: additive;
range: -9999 9999;
additive-symbols: 9000 \4E5D\9621, 8000 \516B\9621, 7000 \4E03\9621, 6000 \516D\9621, 5000 \4F0D\9621, 4000 \56DB\9621, 3000 \53C2\9621, 2000 \5F10\9621, 1000 \58F1\9621, 900 \4E5D\767E, 800 \516B\767E, 700 \4E03\767E, 600 \516D\767E, 500 \4F0D\767E, 400 \56DB\767E, 300 \53C2\767E, 200 \5F10\767E, 100 \58F1\767E, 90 \4E5D\62FE, 80 \516B\62FE, 70 \4E03\62FE, 60 \516D\62FE, 50 \4F0D\62FE, 40 \56DB\62FE, 30 \53C2\62FE, 20 \5F10\62FE, 10 \58F1\62FE, 9 \4E5D, 8 \516B, 7 \4E03, 6 \516D, 5 \4F0D, 4 \56DB, 3 \53C2, 2 \5F10, 1 \58F1, 0 \96F6;
/* additive-symbols: 9000 九阡, 8000 八阡, 7000 七阡, 6000 六阡, 5000 伍阡, 4000 四阡, 3000 参阡, 2000 弐阡, 1000 壱阡, 900 九百, 800 八百, 700 七百, 600 六百, 500 伍百, 400 四百, 300 参百, 200 弐百, 100 壱百, 90 九拾, 80 八拾, 70 七拾, 60 六拾, 50 伍拾, 40 四拾, 30 参拾, 20 弐拾, 10 壱拾, 9 九, 8 八, 7 七, 6 六, 5 伍, 4 四, 3 参, 2 弐, 1 壱, 0 零; */
suffix: '\3001';
/* suffix: 、; */
negative: "\30DE\30A4\30CA\30B9";
/* negative: マイナス; */
fallback: cjk-decimal;
}

/* https://www.w3.org/TR/predefined-counter-styles/#javanese */
@counter-style javanese {
system: numeric;
symbols: \A9D0  \A9D1  \A9D2  \A9D3  \A9D4  \A9D5  \A9D6  \A9D7  \A9D8  \A9D9 ;
/* symbols: ꧐ ꧑ ꧒ ꧓ ꧔ ꧕ ꧖ ꧗ ꧘ ꧙; */
}

/* https://www.w3.org/TR/predefined-counter-styles/#kannada */
@counter-style kannada {
system: numeric;
symbols: '\CE6' '\CE7' '\CE8' '\CE9' '\CEA' '\CEB' '\CEC' '\CED' '\CEE' '\CEF';
/* symbols: '೦' '೧' '೨' '೩' '೪' '೫' '೬' '೭' '೮' '೯'; */
}

/* https://www.w3.org/TR/predefined-counter-styles/#kannada-alpha */
@counter-style kannada-alpha {
system: alphabetic;
symbols: '\0C85' '\0C86' '\0C87' '\0C88' '\0C89' '\0C8A' '\0C8B' '\0C8E' '\0C8F' '\0C90' '\0C92' '\0C93' '\0C94' '\0C95' '\0C96' '\0C97' '\0C98' '\0C99' ;
/* symbols: 'ಅ' 'ಆ' 'ಇ' 'ಈ' 'ಉ' 'ಊ' 'ಋ' 'ಎ' 'ಏ' 'ಐ' 'ಒ' 'ಓ' 'ಔ' 'ಕ' 'ಖ' 'ಗ' 'ಘ' 'ಙ';  */
suffix: ') ';
}

/* https://www.w3.org/TR/predefined-counter-styles/#kayah-li */
@counter-style kayah-li {
system: numeric;
symbols: '\A901' '\A902' '\A903' '\A904' '\A905' '\A906' '\A907' '\A908' '\A909' '\A900';
/* symbols: ꤁ ꤂ ꤃ ꤄ ꤅ ꤆ ꤇ ꤈ ꤉ ꤀; */
}

/* https://www.w3.org/TR/predefined-counter-styles/#cambodian */
@counter-style cambodian {
system: numeric;
symbols: '\17E0' '\17E1' '\17E2' '\17E3' '\17E4' '\17E5' '\17E6' '\17E7' '\17E8' '\17E9';
/* symbols: '០' '១' '២' '៣' '៤' '៥' '៦' '៧' '៨' '៩'; */
}

/* https://www.w3.org/TR/predefined-counter-styles/#khmer */
@counter-style khmer {
system: numeric;
symbols: '\17E0' '\17E1' '\17E2' '\17E3' '\17E4' '\17E5' '\17E6' '\17E7' '\17E8' '\17E9';
/* symbols: '០' '១' '២' '៣' '៤' '៥' '៦' '៧' '៨' '៩'; */
}

/* https://www.w3.org/TR/predefined-counter-styles/#khmer-consonant */
@counter-style khmer-consonant {
system: alphabetic;
symbols: '\1780' '\1781' '\1782' '\1783' '\1784' '\1785' '\1786' '\1787' '\1788' '\1789' '\178A' '\178B' '\178C' '\178D' '\178E' '\178F' '\1790' '\1791' '\1792' '\1793' '\1794' '\1795' '\1796' '\1797' '\1798' '\1799' '\179A' '\179B' '\179C' '\179F' '\17A0' '\17A1' '\17A2';
/* symbols: 'ក' 'ខ' 'គ' 'ឃ' 'ង' 'ច' 'ឆ' 'ជ' 'ឈ' 'ញ' 'ដ' 'ឋ' 'ឌ' 'ឍ' 'ណ' 'ត' 'ថ' 'ទ' 'ធ' 'ន' 'ប' 'ផ' 'ព' 'ភ' 'ម' 'យ' 'រ' 'ល' 'វ' 'ស' 'ហ' 'ឡ' 'អ'; */
}

/* https://www.w3.org/TR/predefined-counter-styles/#circled-korean-consonant */
@counter-style circled-korean-consonant {
system: fixed;
symbols: '\3260' '\3261' '\3262' '\3263' '\3264' '\3265' '\3266' '\3267' '\3268' '\3269' '\326A' '\326B' '\326C' '\326D';
/* symbols: '㉠' '㉡' '㉢' '㉣' '㉤' '㉥' '㉦' '㉧' '㉨' '㉩' '㉪' '㉫' '㉬' '㉭'; */
suffix: ' ';
}

/* https://www.w3.org/TR/predefined-counter-styles/#circled-korean-syllable */
@counter-style circled-korean-syllable {
system: fixed;
symbols: '\326E' '\326F' '\3270' '\3271' '\3272' '\3273' '\3274' '\3275' '\3276' '\3277' '\3278' '\3279' '\327A' '\327B';
/* symbols: '㉮' '㉯' '㉰' '㉱' '㉲' '㉳' '㉴' '㉵' '㉶' '㉷' '㉸' '㉹' '㉺' '㉻'; */
suffix: ' ';
}

/* https://www.w3.org/TR/predefined-counter-styles/#hangul */
@counter-style hangul {
system: alphabetic;
symbols: '\AC00' '\B098' '\B2E4' '\B77C' '\B9C8' '\BC14' '\C0AC' '\C544' '\C790' '\CC28' '\CE74' '\D0C0' '\D30C' '\D558';
/* symbols: '가' '나' '다' '라' '마' '바' '사' '아' '자' '차' '카' '타' '파' '하'; */
}

/* https://www.w3.org/TR/predefined-counter-styles/#hangul-consonant */
@counter-style hangul-consonant {
system: alphabetic;
symbols: '\3131' '\3134' '\3137' '\3139' '\3141' '\3142' '\3145' '\3147' '\3148' '\314A' '\314B' '\314C' '\314D' '\314E';
/* symbols: 'ㄱ' 'ㄴ' 'ㄷ' 'ㄹ' 'ㅁ' 'ㅂ' 'ㅅ' 'ㅇ' 'ㅈ' 'ㅊ' 'ㅋ' 'ㅌ' 'ㅍ' 'ㅎ'; */
}

/* https://www.w3.org/TR/predefined-counter-styles/#korean-consonant */
@counter-style korean-consonant {
system: alphabetic;
symbols: '\3131' '\3134' '\3137' '\3139' '\3141' '\3142' '\3145' '\3147' '\3148' '\314A' '\314B' '\314C' '\314D' '\314E';
/* symbols: 'ㄱ' 'ㄴ' 'ㄷ' 'ㄹ' 'ㅁ' 'ㅂ' 'ㅅ' 'ㅇ' 'ㅈ' 'ㅊ' 'ㅋ' 'ㅌ' 'ㅍ' 'ㅎ'; */
}

/* https://www.w3.org/TR/predefined-counter-styles/#korean-hangul-formal */
@counter-style korean-hangul-formal {
system: additive;
range: -9999 9999;
additive-symbols: 9000 '\AD6C\CC9C', 8000 '\D314\CC9C', 7000 '\CE60\CC9C', 6000 '\C721\CC9C', 5000 '\C624\CC9C', 4000 '\C0AC\CC9C', 3000 '\C0BC\CC9C', 2000 '\C774\CC9C', 1000 '\C77C\CC9C', 900 '\AD6C\BC31', 800 '\D314\BC31', 700 '\CE60\BC31', 600 '\C721\BC31', 500 '\C624\BC31', 400 '\C0AC\BC31', 300 '\C0BC\BC31', 200 '\C774\BC31', 100 '\C77C\BC31', 90 '\AD6C\C2ED', 80 '\D314\C2ED', 70 '\CE60\C2ED', 60 '\C721\C2ED', 50 '\C624\C2ED', 40 '\C0AC\C2ED', 30 '\C0BC\C2ED', 20 '\C774\C2ED', 10 '\C77C\C2ED', 9 '\AD6C', 8 '\D314', 7 '\CE60', 6 '\C721', 5 '\C624', 4 '\C0AC', 3 '\C0BC', 2 '\C774', 1 '\C77C', 0 '\C601';
/* additive-symbols: 9000 구천, 8000 팔천, 7000 칠천, 6000 육천, 5000 오천, 4000 사천, 3000 삼천, 2000 이천, 1000 일천, 900 구백, 800 팔백, 700 칠백, 600 육백, 500 오백, 400 사백, 300 삼백, 200 이백, 100 일백, 90 구십, 80 팔십, 70 칠십, 60 육십, 50 오십, 40 사십, 30 삼십, 20 이십, 10 일십, 9 구, 8 팔, 7 칠, 6 육, 5 오, 4 사, 3 삼, 2 이, 1 일, 0 영 */
suffix:', ';
negative: "\B9C8\C774\B108\C2A4  ";
/* 마이너스 (followed by a space) */
}

/* https://www.w3.org/TR/predefined-counter-styles/#korean-syllable */
@counter-style korean-syllable {
system: alphabetic;
symbols: '\AC00' '\B098' '\B2E4' '\B77C' '\B9C8' '\BC14' '\C0AC' '\C544' '\C790' '\CC28' '\CE74' '\D0C0' '\D30C' '\D558';
/* symbols: '가' '나' '다' '라' '마' '바' '사' '아' '자' '차' '카' '타' '파' '하'; */
}

/* https://www.w3.org/TR/predefined-counter-styles/#parenthesized-hangul-consonant */
@counter-style parenthesized-hangul-consonant {
system: fixed;
symbols: '\3200' '\3201' '\3202' '\3203' '\3204' '\3205' '\3206' '\3207' '\3208' '\3209' '\320A' '\320B' '\320C' '\320D';
/* symbols: '㈀' '㈁' '㈂' '㈃' '㈄' '㈅' '㈆' '㈇' '㈈' '㈉' '㈊' '㈋' '㈌' '㈍'; */
suffix: ' ';
}

/* https://www.w3.org/TR/predefined-counter-styles/#parenthesized-hangul-syllable */
@counter-style parenthesized-hangul-syllable {
system: fixed;
symbols: '\320E' '\320F' '\3210' '\3211' '\3212' '\3213' '\3214' '\3215' '\3216' '\3217' '\3218' '\3219' '\321A';
/* symbols: '㈎' '㈏' '㈐' '㈑' '㈒' '㈓' '㈔' '㈕' '㈖' '㈗' '㈘' '㈙' '㈚'; */
suffix: ' ';
}

/* https://www.w3.org/TR/predefined-counter-styles/#korean-hanja-informal */
@counter-style korean-hanja-informal {
system: additive;
range: -9999 9999;
additive-symbols: 9000 \4E5D\5343, 8000 \516B\5343, 7000 \4E03\5343, 6000 \516D\5343, 5000 \4E94\5343, 4000 \56DB\5343, 3000 \4E09\5343, 2000 \4E8C\5343, 1000 \5343, 900 \4E5D\767E, 800 \516B\767E, 700 \4E03\767E, 600 \516D\767E, 500 \4E94\767E, 400 \56DB\767E, 300 \4E09\767E, 200 \4E8C\767E, 100 \767E, 90 \4E5D\5341, 80 \516B\5341, 70 \4E03\5341, 60 \516D\5341, 50 \4E94\5341, 40 \56DB\5341, 30 \4E09\5341, 20 \4E8C\5341, 10 \5341, 9 \4E5D, 8 \516B, 7 \4E03, 6 \516D, 5 \4E94, 4 \56DB, 3 \4E09, 2 \4E8C, 1 \4E00, 0 \96F6;
/* additive-symbols: 9000 九千, 8000 八千, 7000 七千, 6000 六千, 5000 五千, 4000 四千, 3000 三千, 2000 二千, 1000 千, 900 九百, 800 八百, 700 七百, 600 六百, 500 五百, 400 四百, 300 三百, 200 二百, 100 百, 90 九十, 80 八十, 70 七十, 60 六十, 50 五十, 40 四十, 30 三十, 20 二十, 10 十, 9 九, 8 八, 7 七, 6 六, 5 五, 4 四, 3 三, 2 二, 1 一, 0 零; */
suffix:', ';
negative: "\B9C8\C774\B108\C2A4  ";
/* 마이너스 (followed by a space) */
}

/* https://www.w3.org/TR/predefined-counter-styles/#korean-hanja-formal */
@counter-style korean-hanja-formal {
system: additive;
range: -9999 9999;
additive-symbols: 9000 \4E5D\4EDF, 8000 \516B\4EDF, 7000 \4E03\4EDF, 6000 \516D\4EDF, 5000 \4E94\4EDF, 4000 \56DB\4EDF, 3000 \53C3\4EDF, 2000 \8CB3\4EDF, 1000 \58F9\4EDF, 900 \4E5D\767E, 800 \516B\767E, 700 \4E03\767E, 600 \516D\767E, 500 \4E94\767E, 400 \56DB\767E, 300 \53C3\767E, 200 \8CB3\767E, 100 \58F9\767E, 90 \4E5D\62FE, 80 \516B\62FE, 70 \4E03\62FE, 60 \516D\62FE, 50 \4E94\62FE, 40 \56DB\62FE, 30 \53C3\62FE, 20 \8CB3\62FE, 10 \58F9\62FE, 9 \4E5D, 8 \516B, 7 \4E03, 6 \516D, 5 \4E94, 4 \56DB, 3 \53C3, 2 \8CB3, 1 \58F9, 0 \96F6;
/* additive-symbols: 9000 九仟, 8000 八仟, 7000 七仟, 6000 六仟, 5000 五仟, 4000 四仟, 3000 參仟, 2000 貳仟, 1000 壹仟, 900 九百, 800 八百, 700 七百, 600 六百, 500 五百, 400 四百, 300 參百, 200 貳百, 100 壹百, 90 九拾, 80 八拾, 70 七拾, 60 六拾, 50 五拾, 40 四拾, 30 參拾, 20 貳拾, 10 壹拾, 9 九, 8 八, 7 七, 6 六, 5 五, 4 四, 3 參, 2 貳, 1 壹, 0 零; */
suffix:', ';
negative: "\B9C8\C774\B108\C2A4  ";
/* 마이너스 (followed by a space) */
}

/* https://www.w3.org/TR/predefined-counter-styles/#lanna-hora */
@counter-style lanna-hora {
system: numeric;
symbols: '\1A80' '\1A81' '\1A82' '\1A83' '\1A84' '\1A85' '\1A86' '\1A87' '\1A88' '\1A89';
/* symbols: ᪀ ᪁ ᪂ ᪃ ᪄ ᪅ ᪆ ᪇ ᪈ ᪉; */
}

/* https://www.w3.org/TR/predefined-counter-styles/#lanna-tham */
@counter-style lanna-tham {
system: numeric;
symbols: '\1A90' '\1A91' '\1A92' '\1A93' '\1A94' '\1A95' '\1A96' '\1A97' '\1A98' '\1A99';
/* symbols: ᪐ ᪑ ᪒ ᪓ ᪔ ᪕ ᪖ ᪗ ᪘ ᪙; */
}

/* https://www.w3.org/TR/predefined-counter-styles/#lao */
@counter-style lao {
system: numeric;
symbols: '\ED0' '\ED1' '\ED2' '\ED3' '\ED4' '\ED5' '\ED6' '\ED7' '\ED8' '\ED9';
/* symbols: '໐' '໑' '໒' '໓' '໔' '໕' '໖' '໗' '໘' '໙'; */
}

/* https://www.w3.org/TR/predefined-counter-styles/#lower-alpha */
@counter-style lower-alpha {
system: alphabetic;
symbols: '\61' '\62' '\63' '\64' '\65' '\66' '\67' '\68' '\69' '\6A' '\6B' '\6C' '\6D' '\6E' '\6F' '\70' '\71' '\72' '\73' '\74' '\75' '\76' '\77' '\78' '\79' '\7A';
/* symbols: 'a' 'b' 'c' 'd' 'e' 'f' 'g' 'h' 'i' 'j' 'k' 'l' 'm' 'n' 'o' 'p' 'q' 'r' 's' 't' 'u' 'v' 'w' 'x' 'y' 'z'; */
}

/* https://www.w3.org/TR/predefined-counter-styles/#upper-alpha */
@counter-style upper-alpha {
system: alphabetic;
symbols: '\41' '\42' '\43' '\44' '\45' '\46' '\47' '\48' '\49' '\4A' '\4B' '\4C' '\4D' '\4E' '\4F' '\50' '\51' '\52' '\53' '\54' '\55' '\56' '\57' '\58' '\59' '\5A';
/* symbols: 'A' 'B' 'C' 'D' 'E' 'F' 'G' 'H' 'I' 'J' 'K' 'L' 'M' 'N' 'O' 'P' 'Q' 'R' 'S' 'T' 'U' 'V' 'W' 'X' 'Y' 'Z'; */
}

/* https://www.w3.org/TR/predefined-counter-styles/#fullwidth-lower-alpha */
@counter-style fullwidth-lower-alpha {
system: alphabetic;
symbols: '\FF41' '\FF42' '\FF43' '\FF44' '\FF45' '\FF46' '\FF47' '\FF48' '\FF49' '\FF4A' '\FF4B' '\FF4C' '\FF4D' '\FF4E' '\FF4F' '\FF50' '\FF51' '\FF52' '\FF53' '\FF54' '\FF55' '\FF56' '\FF57' '\FF58' '\FF59' '\FF5A';
/* symbols: 'ａ' 'ｂ' 'ｃ' 'ｄ' 'ｅ' 'ｆ' 'ｇ' 'ｈ' 'ｉ' 'ｊ' 'ｋ' 'ｌ' 'ｍ' 'ｎ' 'ｏ' 'ｐ' 'ｑ' 'ｒ' 'ｓ' 'ｔ' 'ｕ' 'ｖ' 'ｗ' 'ｘ' 'ｙ' 'ｚ'; */
suffix: '\FF0E';
}

/* https://www.w3.org/TR/predefined-counter-styles/#fullwidth-upper-alpha */
@counter-style fullwidth-upper-alpha {
system: alphabetic;
symbols: '\FF21' '\FF22' '\FF23' '\FF24' '\FF25' '\FF26' '\FF27' '\FF28' '\FF29' '\FF2A' '\FF2B' '\FF2C' '\FF2D' '\FF2E' '\FF2F' '\FF30' '\FF31' '\FF32' '\FF33' '\FF34' '\FF35' '\FF36' '\FF37' '\FF38' '\FF39' '\FF3A';
/* symbols: 'Ａ' 'Ｂ' 'Ｃ' 'Ｄ' 'Ｅ' 'Ｆ' 'Ｇ' 'Ｈ' 'Ｉ' 'Ｊ' 'Ｋ' 'Ｌ' 'Ｍ' 'Ｎ' 'Ｏ' 'Ｐ' 'Ｑ' 'Ｒ' 'Ｓ' 'Ｔ' 'Ｕ' 'Ｖ' 'Ｗ' 'Ｘ' 'Ｙ' 'Ｚ'; */
suffix: '\FF0E';
}

/* https://www.w3.org/TR/predefined-counter-styles/#lower-alpha-symbolic */
@counter-style lower-alpha-symbolic {
system: symbolic;
symbols: '\61' '\62' '\63' '\64' '\65' '\66' '\67' '\68' '\69' '\6A' '\6B' '\6C' '\6D' '\6E' '\6F' '\70' '\71' '\72' '\73' '\74' '\75' '\76' '\77' '\78' '\79' '\7A';
/* symbols: 'a' 'b' 'c' 'd' 'e' 'f' 'g' 'h' 'i' 'j' 'k' 'l' 'm' 'n' 'o' 'p' 'q' 'r' 's' 't' 'u' 'v' 'w' 'x' 'y' 'z'; */
}

/* https://www.w3.org/TR/predefined-counter-styles/#upper-alpha-symbolic */
@counter-style upper-alpha-symbolic {
system: symbolic;
symbols: '\41' '\42' '\43' '\44' '\45' '\46' '\47' '\48' '\49' '\4A' '\4B' '\4C' '\4D' '\4E' '\4F' '\50' '\51' '\52' '\53' '\54' '\55' '\56' '\57' '\58' '\59' '\5A';
/* symbols: 'A' 'B' 'C' 'D' 'E' 'F' 'G' 'H' 'I' 'J' 'K' 'L' 'M' 'N' 'O' 'P' 'Q' 'R' 'S' 'T' 'U' 'V' 'W' 'X' 'Y' 'Z'; */
}

/* https://www.w3.org/TR/predefined-counter-styles/#lower-oromo-qubee */
@counter-style lower-oromo-qubee {
system: alphabetic;
symbols: '\61' '\61\61' '\62' '\63' '\64' '\65' '\65\65' '\66' '\67' '\68' '\69' '\69\69' '\6A' '\6B' '\6C' '\6D' '\6E' '\6F' '\6F\6F' '\70' '\71' '\72' '\73' '\74' '\75' '\75\75' '\76' '\77' '\78' '\79' '\7A' '\63\68' '\64\68' '\6B\68' '\6E\79' '\70\68' '\73\68';
/* symbols: 'a' 'aa' 'b' 'c' 'd' 'e' 'ee' 'f' 'g' 'h' 'i' 'ii' 'j' 'k' 'l' 'm' 'n' 'o' 'oo' 'p' 'q' 'r' 's' 't' 'u' 'uu' 'v' 'w' 'x' 'y' 'z' 'ch' 'dh' 'kh' 'ny' 'ph' 'sh'; */
}

/* https://www.w3.org/TR/predefined-counter-styles/#upper-oromo-qubee */
@counter-style upper-oromo-qubee {
system: alphabetic;
symbols: '\41' '\41\41' '\42' '\43' '\44' '\45' '\45\45' '\46' '\47' '\48' '\49' '\49\49' '\4A' '\4B' '\4C' '\4D' '\4E' '\4F' '\4F\4F' '\50' '\51' '\52' '\53' '\54' '\55' '\55\55' '\56' '\57' '\58' '\59' '\5A' '\43\48' '\44\48' '\4B\48' '\4E\59' '\50\48' '\53\48';
/* symbols: 'A' 'AA' 'B' 'C' 'D' 'E' 'EE' 'F' 'G' 'H' 'I' 'II' 'J' 'K' 'L' 'M' 'N' 'O' 'OO' 'P' 'Q' 'R' 'S' 'T' 'U' 'UU' 'V' 'W' 'X' 'Y' 'Z' 'CH' 'DH' 'KH' 'NY' 'PH' 'SH'; */
}

/* https://www.w3.org/TR/predefined-counter-styles/#parenthesized-lower-latin */
@counter-style parenthesized-lower-latin {
system: fixed;
symbols: '\249C' '\249D' '\249E' '\249F' '\24A0' '\24A1' '\24A2' '\24A3' '\24A4' '\24A5' '\24A6' '\24A7' '\24A8' '\24A9' '\24AA' '\24AB' '\24AC' '\24AD' '\24AE' '\24AF' '\24B0' '\24B1' '\24B2' '\24B3' '\24B4' '\24B5';
/* symbols: '⒜' '⒝' '⒞' '⒟' '⒠' '⒡' '⒢' '⒣' '⒤' '⒥' '⒦' '⒧' '⒨' '⒩' '⒪' '⒫' '⒬' '⒭' '⒮' '⒯' '⒰' '⒱' '⒲' '⒳' '⒴' '⒵'; */
suffix: ' ';
}

/* https://www.w3.org/TR/predefined-counter-styles/#lepcha */
@counter-style lepcha {
system: numeric;
symbols: '\1C40' '\1C41' '\1C42' '\1C43' '\1C44' '\1C45' '\1C46' '\1C47' '\1C48' '\1C49';
/* symbols: '᱀' '᱁' '᱂' '᱃' '᱄' '᱅' '᱆' '᱇' '᱈' '᱉'; */
}

/* https://www.w3.org/TR/predefined-counter-styles/#limbu */
@counter-style limbu {
system: numeric;
symbols: \1946  \1947  \1948  \1949  \194A  \194B  \194C  \194D  \194E  \194F ;
/* symbols: ᥆ ᥇ ᥈ ᥉ ᥊ ᥋ ᥌ ᥍ ᥎ ᥏; */
}

/* https://www.w3.org/TR/predefined-counter-styles/#malayalam */
@counter-style malayalam {
system: numeric;
symbols: '\D66' '\D67' '\D68' '\D69' '\D6A' '\D6B' '\D6C' '\D6D' '\D6E' '\D6F';
/* symbols: '൦' '൧' '൨' '൩' '൪' '൫' '൬' '൭' '൮' '൯'; */
}

/* https://www.w3.org/TR/predefined-counter-styles/#malayalam-alpha */
@counter-style malayalam-alpha {
system: alphabetic;
symbols: '\D15' '\D7F' '\D16' '\D17' '\D18' '\D19' '\D1A''\D1B' '\D1C' '\D1D' '\D1E' '\D1F' '\D20' '\D21' '\D22' '\D23' '\D7A' '\D24' '\D25' '\D26' '\D27' '\D28' '\D7B' '\D2A' '\D2B' '\D2C' '\D2D' '\D2E' '\D2F' '\D30' '\D7C' '\D32' '\D7D' '\D35' '\D36' '\D37' '\D38' '\D39' '\D33' '\D7E' '\D34' '\D31' ;
/* symbols: 'ക' 'ൿ ''ഖ' 'ഗ' 'ഘ' 'ങ' 'ച' 'ഛ' 'ജ' 'ഝ' 'ഞ' ട' 'ഠ' 'ഡ' 'ഢ' 'ണ' 'ൺ' 'ത' 'ഥ' 'ദ' 'ധ' 'ന' 'ൻ' 'പ' 'ഫ' 'ബ' 'ഭ' 'മ' 'യ' 'ര' 'ർ' 'ല' 'ൽ' 'വ' 'ശ' 'ഷ' 'സ' 'ഹ' 'ള' 'ൾ' 'ഴ' 'റ' ; */
prefix: '(';
suffix: ') ';
}

/* https://www.w3.org/TR/predefined-counter-styles/#meetei */
@counter-style meetei {
system: numeric;
symbols: '\ABF0' '\ABF1' '\ABF2' '\ABF3' '\ABF4' '\ABF5' '\ABF6' '\ABF7' '\ABF8' '\ABF9';
/* symbols: '꯰' '꯱' '꯲' '꯳' '꯴' '꯵' '꯶' '꯷' '꯸' '꯹'; */
suffix: ') ';
}

/* https://www.w3.org/TR/predefined-counter-styles/#manipuri */
@counter-style manipuri {
system: alphabetic;
symbols: '\ABC0' '\ABC1' '\ABC2' '\ABC3' '\ABC4' '\ABC5' '\ABC6' '\ABC7' '\ABC8' '\ABC9' '\ABCA' '\ABCB' '\ABCC' '\ABCD' '\ABCE' '\ABCF' '\ABD0' '\ABD1' '\ABD2' '\ABD3' '\ABD4' '\ABD5' '\ABD6' '\ABD7' '\ABD8' '\ABD9' '\ABDA' ;
/* symbols: 'ꯀ' 'ꯁ' 'ꯂ' 'ꯃ' 'ꯄ' 'ꯅ' 'ꯆ' 'ꯇ' 'ꯈ' 'ꯉ' 'ꯊ' 'ꯋ' 'ꯌ' 'ꯍ' 'ꯎ' 'ꯏ' 'ꯐ' 'ꯑ' 'ꯒ' 'ꯓ' 'ꯔ' 'ꯕ' 'ꯖ' 'ꯗ' 'ꯘ' 'ꯙ' 'ꯚ'; */
}

/* https://www.w3.org/TR/predefined-counter-styles/#mongolian */
@counter-style mongolian {
system: numeric;
symbols: '\1810' '\1811' '\1812' '\1813' '\1814' '\1815' '\1816' '\1817' '\1818' '\1819';
/* symbols: '᠐' '᠑' '᠒' '᠓' '᠔' '᠕' '᠖' '᠗' '᠘' '᠙'; */
}

/* https://www.w3.org/TR/predefined-counter-styles/#mro */
@counter-style mro {
system: numeric;
symbols: \016A60  \016A61  \016A62  \016A63  \016A64  \016A65  \016A66  \016A67  \016A68  \016A69 ;
/* symbols: 𖩠 𖩡 𖩢 𖩣 𖩤 𖩥 𖩦 𖩧 𖩨 𖩩; */
}

/* https://www.w3.org/TR/predefined-counter-styles/#myanmar */
@counter-style myanmar {
system: numeric;
symbols: '\1040' '\1041' '\1042' '\1043' '\1044' '\1045' '\1046' '\1047' '\1048' '\1049';
/* symbols: '၀' '၁' '၂' '၃' '၄' '၅' '၆' '၇' '၈' '၉'; */
prefix: '('; suffix: ') '; 
}

/* https://www.w3.org/TR/predefined-counter-styles/#shan */
@counter-style shan {
system: numeric;
symbols: '\1090' '\1091' '\1092' '\1093' '\1094' '\1095' '\1096' '\1097' '\1098' '\1099';
/* symbols: '႐' '႑' '႒' '႓' '႔' '႕' '႖' '႗' '႘' '႙'; */
prefix: '('; suffix: ') '; 
}

/* https://www.w3.org/TR/predefined-counter-styles/#nko-cardinal */
@counter-style nko-cardinal {
system: numeric;
symbols: \07C1  \07C2  \07C3  \07C4  \07C5  \07C6  \07C7  \07C8  \07C9  \07C0;
/* symbols: ߁ ߂ ߃ ߄ ߅ ߆ ߇ ߈ ߉ ߀ */
suffix: ' - ';
}

/* https://www.w3.org/TR/predefined-counter-styles/#nag-mundari */
@counter-style nag-mundari {
system: numeric;
symbols: '\01E4F0' '\01E4F1' '\01E4F2' '\01E4F3' '\01E4F4' '\01E4F5' '\01E4F6' '\01E4F7' '\01E4F8' '\01E4F9' ;
/* symbols: 𞓰 𞓱 𞓲 𞓳 𞓴 𞓵 𞓶 𞓷 𞓸 𞓹; */
}

/* https://www.w3.org/TR/predefined-counter-styles/#newa */
@counter-style newa {
system: numeric;
symbols: '\011450' '\011451' '\011452' '\011453' '\011454' '\011455' '\011456' '\011457' '\011458' '\011459';
/* symbols: 𑑐 𑑑 𑑒 𑑓 𑑔 𑑕 𑑖 𑑗 𑑘 𑑙; */
}

/* https://www.w3.org/TR/predefined-counter-styles/#ol-chiki */
@counter-style ol-chiki {
system: numeric;
symbols: '\1C50' '\1C51' '\1C52' '\1C53' '\1C54' '\1C55' '\1C56' '\1C57' '\1C58' '\1C59';
/* symbols: '᱐' '᱑' '᱒' '᱓' '᱔' '᱕' '᱖' '᱗' '᱘' '᱙'; */
suffix: '. ';
}

/* https://www.w3.org/TR/predefined-counter-styles/#santali */
@counter-style santali {
system: alphabetic;
symbols: '\1C5A' '\1C5B' '\1C5C' '\1C5D' '\1C5E' '\1C5F' '\1C60' '\1C61' '\1C62' '\1C63' '\1C64' '\1C65' '\1C66' '\1C67' '\1C68' '\1C69' '\1C6A' '\1C6B' '\1C6C' '\1C6D' '\1C6E' '\1C6F' '\1C70' '\1C71' '\1C72' '\1C73' '\1C74' '\1C75' '\1C76' '\1C77' ;
/* symbols: 'ᱚ' 'ᱛ' 'ᱜ' 'ᱝ' 'ᱞ' 'ᱟ' 'ᱠ' 'ᱡ' 'ᱢ' 'ᱣ' 'ᱤ' 'ᱥ' 'ᱦ' 'ᱧ' 'ᱨ' 'ᱩ' 'ᱪ' 'ᱫ' 'ᱬ' 'ᱭ' 'ᱮ' 'ᱯ' 'ᱰ' 'ᱱ' 'ᱲ' 'ᱳ' 'ᱴ' 'ᱵ' 'ᱶ' 'ᱷ' */
prefix: '('; suffix: ') ';
}

/* https://www.w3.org/TR/predefined-counter-styles/#oriya */
@counter-style oriya {
system: numeric;
symbols: '\B66' '\B67' '\B68' '\B69' '\B6A' '\B6B' '\B6C' '\B6D' '\B6E' '\B6F';
/* symbols: '୦' '୧' '୨' '୩' '୪' '୫' '୬' '୭' '୮' '୯'; */
}

/* https://www.w3.org/TR/predefined-counter-styles/#odia */
@counter-style odia {
system: alphabetic;
symbols: '\0B15' '\0B16' '\0B17' '\0B18' '\0B19' '\0B1A' '\0B1B' '\0B1C' '\0B1D' '\0B1E' '\0B1F' '\0B20' '\0B21' '\0B21\0B3C' '\0B22' '\0B22\0B3C' '\0B23' '\0B24' '\0B25' '\0B26' '\0B27' '\0B28' '\0B2A' '\0B2B' '\0B2C' '\0B2D' '\0B2E' '\0B2F' '\0B5F' '\0B30' '\0B32' '\0B33' '\0B71' '\0B36' '\0B37' '\0B38' '\0B39' ;
/* symbols: 'କ' 'ଖ' 'ଗ' 'ଘ' 'ଙ' 'ଚ' 'ଛ' 'ଜ' 'ଝ' 'ଞ' 'ଟ' 'ଠ' 'ଡ' 'ଡ଼' 'ଢ' 'ଢ଼' 'ଣ' 'ତ' 'ଥ' 'ଦ' 'ଧ' 'ନ' 'ପ' 'ଫ' 'ବ' 'ଭ' 'ମ' 'ଯ' 'ୟ' 'ର' 'ଲ' 'ଳ' 'ୱ' 'ଶ' 'ଷ' 'ସ' 'ହ' ; */
prefix: '(';
suffix: ') ';
}

/* https://www.w3.org/TR/predefined-counter-styles/#sundanese */
@counter-style sundanese {
system: numeric;
symbols: '\1BB0' '\1BB1' '\1BB2' '\1BB3' '\1BB4' '\1BB5' '\1BB6' '\1BB7' '\1BB8' '\1BB9';
/* symbols: ᮰ ᮱ ᮲ ᮳ ᮴ ᮵ ᮶ ᮷ ᮸ ᮹; */
}

/* https://www.w3.org/TR/predefined-counter-styles/#tai-lue */
@counter-style tai-lue {
system: numeric;
symbols: '\19D0' '\19D1' '\19D2' '\19D3' '\19D4' '\19D5' '\19D6' '\19D7' '\19D8' '\19D9';
/* symbols: ᧐ ᧑ ᧒ ᧓ ᧔ ᧕ ᧖ ᧗ ᧘ ᧙; */
}

/* https://www.w3.org/TR/predefined-counter-styles/#ancient-tamil */
@counter-style ancient-tamil {
system: additive;
range: 1 9999;
additive-symbols: 9000 '\BEF\BF2', 8000 '\BEE\BF2', 7000 '\BED\BF2', 6000 '\BEC\BF2', 5000 '\BEB\BF2', 4000 '\BEA\BF2', 3000 '\BE9\BF2', 2000 '\BE8\BF2', 1000 '\BF2', 900 '\BEF\BF1', 800 '\BEE\BF1', 700 '\BED\BF1', 600 '\BEC\BF1', 500 '\BEB\BF1', 400 '\BEA\BF1', 300 '\BE9\BF1', 200 '\BE8\BF1', 100 '\BF1', 90 '\BEF\BF0', 80 '\BEE\BF0', 70 '\BED\BF0', 60 '\BEC\BF0', 50 '\BEB\BF0', 40 '\BEA\BF0', 30 '\BE9\BF0', 20 '\BE8\BF0', 10 '\BF0', 9 '\BEF', 8 '\BEE', 7 '\BED', 6 '\BEC', 5 '\BEB', 4 '\BEA', 3 '\BE9', 2 '\BE8', 1 '\BE7';
/* additive-symbols: 9000 '௯௲', 8000 '௮௲', 7000 '௭௲', 6000 '௬௲', 5000 '௫௲', 4000 '௪௲', 3000 '௩௲', 2000 '௨௲', 1000 '௲', 900 '௯௱', 800 '௮௱', 700 '௭௱', 600 '௬௱', 500 '௫௱', 400 '௪௱', 300 '௩௱', 200 '௨௱', 100 '௱', 90 '௯௰', 80 '௮௰', 70 '௭௰', 60 '௬௰', 50 '௫௰', 40 '௪௰', 30 '௩௰', 20 '௨௰', 10 '௰', 9 '௯', 8 '௮', 7 '௭', 6 '௬', 5 '௫', 4 '௪', 3 '௩', 2 '௨', 1 '௧'; */
}

/* https://www.w3.org/TR/predefined-counter-styles/#tamil */
@counter-style tamil {
system: numeric;
symbols: '\BE6' '\BE7' '\BE8' '\BE9' '\BEA' '\BEB' '\BEC' '\BED' '\BEE' '\BEF';
/* symbols: '௦' '௧' '௨' '௩' '௪' '௫' '௬' '௭' '௮' '௯'; */
}

/* https://www.w3.org/TR/predefined-counter-styles/#telugu */
@counter-style telugu {
system: numeric;
symbols: '\C66' '\C67' '\C68' '\C69' '\C6A' '\C6B' '\C6C' '\C6D' '\C6E' '\C6F';
/* symbols: '౦' '౧' '౨' '౩' '౪' '౫' '౬' '౭' '౮' '౯'; */
}

/* https://www.w3.org/TR/predefined-counter-styles/#telugu-alpha */
@counter-style telugu-alpha {
system: alphabetic;
symbols: '\C15' '\C16' '\C17' '\C18' '\C19' '\C1A' '\C58' '\C1B' '\C1C' '\C1D' '\C1E' '\C1F' '\C20' '\C21' '\C22' '\C23' '\C24' '\C25' '\C26' '\C27' '\C28' '\C2A' '\C2B' '\C2C' '\C2D' '\C2E' '\C2F' '\C30' '\C31' '\C32' '\C33' '\C34' '\C35' '\C36' '\C37' '\C38' '\C39' ;
/* symbols: 'క' 'ఖ' 'గ' 'ఘ' 'ఙ' 'చ' 'ౘ' 'ఛ' 'జ' 'ఝ' 'ఞ' 'ట' 'ఠ' 'డ' 'ఢ' 'ణ' 'త' 'థ' 'ద' 'ధ' 'న' 'ప' 'ఫ' 'బ' 'భ' 'మ' 'య' 'ర' 'ఱ' 'ల' 'ళ' 'ఴ' 'వ' 'శ' 'ష' 'స' 'హ' ; */
suffix: ') ';
}

/* https://www.w3.org/TR/predefined-counter-styles/#thai */
@counter-style thai {
system: numeric;
symbols: '\E50' '\E51' '\E52' '\E53' '\E54' '\E55' '\E56' '\E57' '\E58' '\E59';
/* symbols: '๐' '๑' '๒' '๓' '๔' '๕' '๖' '๗' '๘' '๙'; */
}

/* https://www.w3.org/TR/predefined-counter-styles/#thai-alpha */
@counter-style thai-alpha {
system: alphabetic;
symbols: '\E01' '\E02' '\E04' '\E07' '\E08' '\E09' '\E0A' '\E0B' '\E0C' '\E0D' '\E0E' '\E0F' '\E10' '\E11' '\E12' '\E13' '\E14' '\E15' '\E16' '\E17' '\E18' '\E19' '\E1A' '\E1B' '\E1C' '\E1D' '\E1E' '\E1F' '\E20' '\E21' '\E22' '\E23' '\E25' '\E27' '\E28' '\E29' '\E2A' '\E2B' '\E2C' '\E2D' '\E2E';
/* symbols: 'ก' 'ข' 'ค' 'ง' 'จ' 'ฉ' 'ช' 'ซ' 'ฌ' 'ญ' 'ฎ' 'ฏ' 'ฐ' 'ฑ' 'ฒ' 'ณ' 'ด' 'ต' 'ถ' 'ท' 'ธ' 'น' 'บ' 'ป' 'ผ' 'ฝ' 'พ' 'ฟ' 'ภ' 'ม' 'ย' 'ร' 'ล' 'ว' 'ศ' 'ษ' 'ส' 'ห' 'ฬ' 'อ' 'ฮ'; */
}

/* https://www.w3.org/TR/predefined-counter-styles/#tibetan */
@counter-style tibetan {
system: numeric;
symbols: '\F20' '\F21' '\F22' '\F23' '\F24' '\F25' '\F26' '\F27' '\F28' '\F29';
/* symbols: '༠' '༡' '༢' '༣' '༤' '༥' '༦' '༧' '༨' '༩'; */
}

/* https://www.w3.org/TR/predefined-counter-styles/#warang-citi */
@counter-style warang-citi {
system: numeric;
symbols: '\118E90' '\118E1' '\118E2' '\118E3' '\118E4' '\118E5' '\118E6' '\118E7' '\118E8' '\118E9';
/* symbols: '𑣠' '𑣡' '𑣢' '𑣣' '𑣤' '𑣥' '𑣦' '𑣧' '𑣨' '𑣩'; */
}

/* https://www.w3.org/TR/predefined-counter-styles/#binary */
@counter-style binary {
system: numeric;
symbols: '\30' '\31';
/* symbols: '0' '1'; */
}

/* https://www.w3.org/TR/predefined-counter-styles/#tally-mark */
@counter-style tally-mark {
system: additive;
additive-symbols: 5 '\1D378', 1 '\1D377';
/* symbols: 5 𝍸, 1 𝍷; */
suffix: ' ';
}

/* https://www.w3.org/TR/predefined-counter-styles/#circled-decimal */
@counter-style circled-decimal {
system: fixed 0;
symbols: '\24EA' '\2460' '\2461' '\2462' '\2463' '\2464' '\2465' '\2466' '\2467' '\2468' '\2469' '\246A' '\246B' '\246C' '\246D' '\246E' '\246F' '\2470' '\2471' '\2472' '\2473' '\3251' '\3252' '\3253' '\3254' '\3255' '\3256' '\3257' '\3258' '\3259' '\325a' '\325b' '\325c' '\325d' '\325e' '\325f' '\32b1' '\32b2' '\32b3' '\32b4' '\32b5' '\32b6' '\32b7' '\32b8' '\32b9' '\32ba' '\32bb' '\32bc' '\32bd' '\32be' '\32bf';
/* symbols: '⓪' '①' '②' '③' '④' '⑤' '⑥' '⑦' '⑧' '⑨' '⑩' '⑪' '⑫' '⑬' '⑭' '⑮' '⑯' '⑰' '⑱' '⑲' '⑳' '㉑' '㉒' '㉓' '㉔' '㉕' '㉖' '㉗' '㉘' '㉙' '㉚' '㉛' '㉜' '㉝' '㉞' '㉟' '㊱' '㊲' '㊳' '㊴' '㊵' '㊶' '㊷' '㊸' '㊹' '㊺' '㊻' '㊼' '㊽' '㊾' '㊿'; */
suffix: ' ';
}

/* https://www.w3.org/TR/predefined-counter-styles/#circled-lower-latin */
@counter-style circled-lower-latin {
system: fixed;
symbols: '\24D0' '\24D1' '\24D2' '\24D3' '\24D4' '\24D5' '\24D6' '\24D7' '\24D8' '\24D9' '\24DA' '\24DB' '\24DC' '\24DD' '\24DE' '\24DF' '\24E0' '\24E1' '\24E2' '\24E3' '\24E4' '\24E5' '\24E6' '\24E7' '\24E8' '\24E9';
/* symbols: 'ⓐ' 'ⓑ' 'ⓒ' 'ⓓ' 'ⓔ' 'ⓕ' 'ⓖ' 'ⓗ' 'ⓘ' 'ⓙ' 'ⓚ' 'ⓛ' 'ⓜ' 'ⓝ' 'ⓞ' 'ⓟ' 'ⓠ' 'ⓡ' 'ⓢ' 'ⓣ' 'ⓤ' 'ⓥ' 'ⓦ' 'ⓧ' 'ⓨ' 'ⓩ'; */
suffix: ' ';
}

/* https://www.w3.org/TR/predefined-counter-styles/#circled-upper-latin */
@counter-style circled-upper-latin {
system: fixed;
symbols: '\24B6' '\24B7' '\24B8' '\24B9' '\24BA' '\24BB' '\24BC' '\24BD' '\24BE' '\24BF' '\24C0' '\24C1' '\24C2' '\24C3' '\24C4' '\24C5' '\24C6' '\24C7' '\24C8' '\24C9' '\24CA' '\24CB' '\24CC' '\24CD' '\24CE' '\24CF';
/* symbols: 'Ⓐ' 'Ⓑ' 'Ⓒ' 'Ⓓ' 'Ⓔ' 'Ⓕ' 'Ⓖ' 'Ⓗ' 'Ⓘ' 'Ⓙ' 'Ⓚ' 'Ⓛ' 'Ⓜ' 'Ⓝ' 'Ⓞ' 'Ⓟ' 'Ⓠ' 'Ⓡ' 'Ⓢ' 'Ⓣ' 'Ⓤ' 'Ⓥ' 'Ⓦ' 'Ⓧ' 'Ⓨ' 'Ⓩ'; */
suffix: ' ';
}

/* https://www.w3.org/TR/predefined-counter-styles/#decimal */
@counter-style decimal {
system: numeric;
symbols: '\30' '\31' '\32' '\33' '\34' '\35' '\36' '\37' '\38' '\39';
/* symbols: '0' '1' '2' '3' '4' '5' '6' '7' '8' '9'; */
}

/* https://www.w3.org/TR/predefined-counter-styles/#decimal-leading-zero */
@counter-style decimal-leading-zero {
system: fixed -9;
symbols: '\2D\30\39' '\2D\30\38' '\2D\30\37' '\2D\30\36' '\2D\30\35' '\2D\30\34' '\2D\30\33' '\2D\30\32' '\2D\30\31' '\30\30' '\30\31' '\30\32' '\30\33' '\30\34' '\30\35' '\30\36' '\30\37' '\30\38' '\30\39';
/* symbols: '-09' '-08' '-07' '-06' '-05' '-04' '-03' '-02' '-01' '00' '01' '02' '03' '04' '05' '06' '07' '08' '09'; */
}

/* https://www.w3.org/TR/predefined-counter-styles/#dotted-decimal */
@counter-style dotted-decimal {
system: fixed;
symbols: '\2488' '\2489' '\248A' '\248B' '\248C' '\248D' '\248E' '\248F' '\2490' '\2491' '\2492' '\2493' '\2494' '\2495' '\2496' '\2497' '\2498' '\2499' '\249A' '\249B';
/* symbols: '⒈' '⒉' '⒊' '⒋' '⒌' '⒍' '⒎' '⒏' '⒐' '⒑' '⒒' '⒓' '⒔' '⒕' '⒖' '⒗' '⒘' '⒙' '⒚' '⒛'; */
suffix: ' ';
}

/* https://www.w3.org/TR/predefined-counter-styles/#double-circled-decimal */
@counter-style double-circled-decimal {
system: fixed;
symbols: '\24F5' '\24F6' '\24F7' '\24F8' '\24F9' '\24FA' '\24FB' '\24FC' '\24FD' '\24FE';
/* symbols: '⓵' '⓶' '⓷' '⓸' '⓹' '⓺' '⓻' '⓼' '⓽' '⓾'; */
suffix: ' ';
}

/* https://www.w3.org/TR/predefined-counter-styles/#filled-circled-decimal */
@counter-style filled-circled-decimal {
system: fixed;
symbols: '\2776' '\2777' '\2778' '\2779' '\277a' '\277b' '\277c' '\277d' '\277e' '\277f' '\24EB' '\24EC' '\24ED' '\24EE' '\24EF' '\24F0' '\24F1' '\24F2' '\24F3' '\24F4';
/* symbols: '❶' '❷' '❸' '❹' '❺' '❻' '❼' '❽' '❾' '❿' '⓫' '⓬' '⓭' '⓮' '⓯' '⓰' '⓱' '⓲' '⓳' '⓴'; */
suffix: ' ';
}

/* https://www.w3.org/TR/predefined-counter-styles/#fullwidth-decimal */
@counter-style fullwidth-decimal {
system: numeric;
symbols: '\FF10' '\FF11' '\FF12' '\FF13' '\FF14' '\FF15' '\FF16' '\FF17' '\FF18' '\FF19';
/* symbols: '０' '１' '２' '３' '４' '５' '６' '７' '８' '９'; */
suffix: '\FF0E';
/* suffix: '．'; */
}

/* https://www.w3.org/TR/predefined-counter-styles/#fullwidth-lower-roman */
@counter-style § {
system: fixed;
symbols: '\2170' '\2171' '\2172' '\2173' '\2174' '\2175' '\2176' '\2177' '\2178' '\2179' '\217A' '\217B';
/* symbols: 'ⅰ' 'ⅱ' 'ⅲ' 'ⅳ' 'ⅴ' 'ⅵ' 'ⅶ' 'ⅷ' 'ⅸ' 'ⅹ' 'ⅺ' 'ⅻ'; */
suffix: ' ';
}

/* https://www.w3.org/TR/predefined-counter-styles/#fullwidth-upper-roman */
@counter-style fullwidth-upper-roman {
system: fixed;
symbols: '\2160' '\2161' '\2162' '\2163' '\2164' '\2165' '\2166' '\2167' '\2168' '\2169' '\216A' '\216B';
/* symbols: 'Ⅰ' 'Ⅱ' 'Ⅲ' 'Ⅳ' 'Ⅴ' 'Ⅵ' 'Ⅶ' 'Ⅷ' 'Ⅸ' 'Ⅹ' 'Ⅺ' 'Ⅻ'; */
suffix: ' ';
}

/* https://www.w3.org/TR/predefined-counter-styles/#lower-hexadecimal */
@counter-style lower-hexadecimal {
system: numeric;
symbols: '\30' '\31' '\32' '\33' '\34' '\35' '\36' '\37' '\38' '\39' '\61' '\62' '\63' '\64' '\65' '\66';
/* symbols: '0' '1' '2' '3' '4' '5' '6' '7' '8' '9' 'a' 'b' 'c' 'd' 'e' 'f'; */
}

/* https://www.w3.org/TR/predefined-counter-styles/#lower-roman */
@counter-style lower-roman {
system: additive;
range: 1 3999;
additive-symbols: 1000 '\6D', 900 '\63\6D', 500 '\64', 400 '\63\64', 100 '\63', 90 '\78\63', 50 '\6C', 40 '\78\6C', 10 '\78', 9 '\69\78', 5 '\76', 4 '\69\76', 1 '\69';
/* additive-symbols: 1000 'm', 900 'cm', 500 'd', 400 'cd', 100 'c', 90 'xc', 50 'l', 40 'xl', 10 'x', 9 'ix', 5 'v', 4 'iv', 1 'i'; */
}

/* https://www.w3.org/TR/predefined-counter-styles/#new-base-60 */
@counter-style new-base-60 {
system: numeric;
symbols: '\30' '\31' '\32' '\33' '\34' '\35' '\36' '\37' '\38' '\39' '\41' '\42' '\43' '\44' '\45' '\46' '\47' '\48' '\4A' '\4B' '\4C' '\4D' '\4E' '\50' '\51' '\52' '\53' '\54' '\55' '\56' '\57' '\58' '\59' '\5A' '\5F' '\61' '\62' '\63' '\64' '\65' '\66' '\67' '\68' '\69' '\6A' '\6B' '\6D' '\6E' '\6F' '\70' '\71' '\72' '\73' '\74' '\75' '\76' '\77' '\78' '\79' '\7A';
/* symbols: '0' '1' '2' '3' '4' '5' '6' '7' '8' '9' 'A' 'B' 'C' 'D' 'E' 'F' 'G' 'H' 'J' 'K' 'L' 'M' 'N' 'P' 'Q' 'R' 'S' 'T' 'U' 'V' 'W' 'X' 'Y' 'Z' '_' 'a' 'b' 'c' 'd' 'e' 'f' 'g' 'h' 'i' 'j' 'k' 'm' 'n' 'o' 'p' 'q' 'r' 's' 't' 'u' 'v' 'w' 'x' 'y' 'z'; */
}

/* https://www.w3.org/TR/predefined-counter-styles/#octal */
@counter-style octal {
system: numeric;
symbols: '\30' '\31' '\32' '\33' '\34' '\35' '\36' '\37';
/* symbols: '0' '1' '2' '3' '4' '5' '6' '7'; */
}

/* https://www.w3.org/TR/predefined-counter-styles/#parenthesized-decimal */
@counter-style parenthesized-decimal {
system: fixed;
symbols: '\2474' '\2475' '\2476' '\2477' '\2478' '\2479' '\247A' '\247B' '\247C' '\247D' '\247E' '\247F' '\2480' '\2481' '\2482' '\2483' '\2484' '\2485' '\2486' '\2487';
/* symbols: '⑴' '⑵' '⑶' '⑷' '⑸' '⑹' '⑺' '⑻' '⑼' '⑽' '⑾' '⑿' '⒀' '⒁' '⒂' '⒃' '⒄' '⒅' '⒆' '⒇'; */
suffix: ' ';
}

/* https://www.w3.org/TR/predefined-counter-styles/#simple-lower-roman */
@counter-style simple-lower-roman {
system: additive;
range: 1 4999;
additive-symbols: 1000 '\6D', 500 '\64', 100 '\63', 50 '\6C', 10 '\78', 5 '\76', 1 '\69';
/* additive-symbols: 1000 'm', 500 'd', 100 'c', 50 'l', 10 'x', 5 'v', 1 'i'; */
}

/* https://www.w3.org/TR/predefined-counter-styles/#simple-upper-roman */
@counter-style simple-upper-roman {
system: additive;
range: 1 4999;
additive-symbols: 1000 '\4D', 500 '\44', 100 '\43', 50 '\4C', 10 '\58', 5 '\56', 1 '\49';
/* additive-symbols: 1000 'M', 500 'D', 100 'C', 50 'L', 10 'X', 5 'V', 1 'I'; */
}

/* https://www.w3.org/TR/predefined-counter-styles/#super-decimal */
@counter-style super-decimal {
system: numeric;
symbols: '\2070' '\B9' '\B2' '\B3' '\2074' '\2075' '\2076' '\2077' '\2078' '\2079';
/* symbols: '⁰' '¹' '²' '³' '⁴' '⁵' '⁶' '⁷' '⁸' '⁹'; */
}

/* https://www.w3.org/TR/predefined-counter-styles/#upper-hexadecimal */
@counter-style upper-hexadecimal {
system: numeric;
symbols: '\30' '\31' '\32' '\33' '\34' '\35' '\36' '\37' '\38' '\39' '\41' '\42' '\43' '\44' '\45' '\46';
/* symbols: '0' '1' '2' '3' '4' '5' '6' '7' '8' '9' 'A' 'B' 'C' 'D' 'E' 'F'; */
}

/* https://www.w3.org/TR/predefined-counter-styles/#upper-roman */
@counter-style upper-roman {
system: additive;
range: 1 3999;
additive-symbols: 1000 '\4D', 900 '\43\4D', 500 '\44', 400 '\43\44', 100 '\43', 90 '\58\43', 50 '\4C', 40 '\58\4C', 10 '\58', 9 '\49\58', 5 '\56', 4 '\49\56', 1 '\49';
/* additive-symbols: 1000 'M', 900 'CM', 500 'D', 400 'CD', 100 'C', 90 'XC', 50 'L', 40 'XL', 10 'X', 9 'IX', 5 'V', 4 'IV', 1 'I'; */
}` +
  // Legacy compatibility aliases
  // These short names were supported in older versions but are not standard CSS.
  `
@counter-style roman {
  system: extends lower-roman;
}
@counter-style latin {
  system: extends lower-latin;
}
@counter-style alpha {
  system: extends lower-alpha;
}
@counter-style greek {
  system: extends lower-greek;
}
@counter-style russian {
  system: extends lower-russian;
}
`;
