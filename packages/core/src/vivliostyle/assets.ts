// vivliostyle-viewport-screen.css
export const VivliostyleViewportScreenCss = `
/*
 * Copyright 2017 Trim-marks Inc.
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
 */

@media screen {

    [data-vivliostyle-viewer-viewport] {
        background: #AAAAAA;
    }

    [data-vivliostyle-page-container] {
        background: white;
    }

    [data-vivliostyle-viewer-viewport] {
        display: -webkit-flex;
        display: flex;
        overflow: auto;
        position: relative;
    }

    [data-vivliostyle-outer-zoom-box] {
        margin: auto;
        overflow: hidden;
        -webkit-flex: none;
        flex: none;
    }

    [data-vivliostyle-viewer-viewport] [data-vivliostyle-spread-container] {
        display: -webkit-flex;
        display: flex;
        -webkit-flex: none;
        flex: none;
        -webkit-justify-content: center;
        justify-content: center;
        -moz-transform-origin: left top;
        -ms-transform-origin: left top;
        -webkit-transform-origin: left top;
        transform-origin: left top;
    }

    [data-vivliostyle-viewer-viewport][data-vivliostyle-page-progression=ltr] [data-vivliostyle-spread-container] {
        -webkit-flex-direction: row;
        flex-direction: row;
    }

    [data-vivliostyle-viewer-viewport][data-vivliostyle-page-progression=rtl] [data-vivliostyle-spread-container] {
        -webkit-flex-direction: row-reverse;
        flex-direction: row-reverse;
    }

    [data-vivliostyle-viewer-viewport] [data-vivliostyle-page-container] {
        margin: 0 auto;
        -webkit-flex: none;
        flex: none;
        transform-origin: center top;
    }

    [data-vivliostyle-viewer-viewport][data-vivliostyle-spread-view=true] [data-vivliostyle-page-container][data-vivliostyle-page-side=left] {
        margin-right: 1px;
        transform-origin: right top;
    }

    [data-vivliostyle-viewer-viewport][data-vivliostyle-spread-view=true] [data-vivliostyle-page-container][data-vivliostyle-page-side=right] {
        margin-left: 1px;
        transform-origin: left top;
    }

    [data-vivliostyle-viewer-viewport][data-vivliostyle-spread-view=true] [data-vivliostyle-page-container][data-vivliostyle-unpaired-page=true] {
        margin-left: auto;
        margin-right: auto;
        transform-origin: center top;
    }

}
`;

// vivliostyle-viewport.css
export const VivliostyleViewportCss = `
/*
 * Copyright 2015 Trim-marks Inc.
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
 */

[data-vivliostyle-layout-box] {
    position: absolute;
    left: 0;
    top: 0;
    right: 0;
    bottom: 0;
    overflow: hidden;
    z-index: -1;
}

[data-vivliostyle-debug] [data-vivliostyle-layout-box] {
    right: auto;
    bottom: auto;
    overflow: visible;
    z-index: auto;
}

[data-vivliostyle-page-container] {
    position: relative;
    overflow: hidden;
}

[data-vivliostyle-bleed-box] {
    position: absolute;
    overflow: hidden;
    max-width: 100%;
    max-height: 100%;
    box-sizing: border-box;
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
    background: rgba(248,248,248,0.9);
    border-radius: 2px;
    box-shadow: 1px 1px 2px rgba(0,0,0,0.4);
}

@media print {
    [data-vivliostyle-toc-box] {
        display: none;
    }

    [data-vivliostyle-outer-zoom-box], [data-vivliostyle-spread-container] {
        width: 100% !important;
        height: 100% !important;
    }

    [data-vivliostyle-spread-container], [data-vivliostyle-page-container] {
        -moz-transform: none !important;
        -ms-transform: none !important;
        -webkit-transform: none !important;
        transform: none !important;
    }

    [data-vivliostyle-page-container] {
        display: block !important;
        max-width: 100%;
        height: 100% !important;
        max-height: 100%;
    }

    /* Workaround for Chrome printing problem */
    /* [data-vivliostyle-page-box] {
        padding-bottom: 0 !important;
        overflow: visible !important;
    } */
    [data-vivliostyle-bleed-box] > div > div::before {
        display: block;
        content: "";
        padding-top: 0.015625px;
        margin-bottom: -0.015625px;
    }

    /* Gecko-only hack, see https://bugzilla.mozilla.org/show_bug.cgi?id=267029#c17 */
    @-moz-document regexp('.*') {
        [data-vivliostyle-page-container]:nth-last-child(n+2) {
            top: -1px;
            margin-top: 1px;
            margin-bottom: -1px;
        }
    }
}
`;

// validation.txt
export const ValidationTxt = `
/*
 * Copyright 2013 Google, Inc.
 * Copyright 2015 Trim-marks Inc.
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
NNEG_LENGTH = POS_LENGTH | ZERO | NEGATIVE;
PLENGTH = LENGTH | PERCENTAGE;
PPLENGTH = POS_LENGTH | ZERO | POS_PERCENTAGE;
ALENGTH = LENGTH | auto;
APLENGTH = PLENGTH | auto;
PAPLENGTH = PPLENGTH | auto;
ANGLE = POS_ANGLE | ZERO | NEGATIVE;
LENGTH_OR_NUM = LENGTH | NUM;
ANGLE_OR_NUM = ANGLE | NUM;
SCOLOR = HASHCOLOR | aliceblue: #F0F8FF | antiquewhite: #FAEBD7 | aqua: #00FFFF | aquamarine: #7FFFD4 | azure: #F0FFFF |
    beige: #F5F5DC | bisque: #FFE4C4 | black: #000000 | blanchedalmond: #FFEBCD | blue: #0000FF | blueviolet: #8A2BE2 | brown: #A52A2A |
    burlywood: #DEB887 | cadetblue: #5F9EA0 | chartreuse: #7FFF00 | chocolate: #D2691E | coral: #FF7F50 | cornflowerblue: #6495ED |
    cornsilk: #FFF8DC | crimson: #DC143C | cyan: #00FFFF | darkblue: #00008B | darkcyan: #008B8B | darkgoldenrod: #B8860B |
    darkgray: #A9A9A9 | darkgreen: #006400 | darkgrey: #A9A9A9 | darkkhaki: #BDB76B | darkmagenta: #8B008B | darkolivegreen: #556B2F |
    darkorange: #FF8C00 | darkorchid: #9932CC | darkred: #8B0000 | darksalmon: #E9967A | darkseagreen: #8FBC8F | darkslateblue: #483D8B |
    darkslategray: #2F4F4F | darkslategrey: #2F4F4F | darkturquoise: #00CED1 | darkviolet: #9400D3 | deeppink: #FF1493 |
    deepskyblue: #00BFFF | dimgray: #696969 | dimgrey: #696969 | dodgerblue: #1E90FF | firebrick: #B22222 | floralwhite: #FFFAF0 |
    forestgreen: #228B22 | fuchsia: #FF00FF | gainsboro: #DCDCDC | ghostwhite: #F8F8FF | gold: #FFD700 | goldenrod: #DAA520 |
    gray: #808080 | green: #008000 | greenyellow: #ADFF2F | grey: #808080 | honeydew: #F0FFF0 | hotpink: #FF69B4 | indianred: #CD5C5C |
    indigo: #4B0082 | ivory: #FFFFF0 | khaki: #F0E68C | lavender: #E6E6FA | lavenderblush: #FFF0F5 | lawngreen: #7CFC00 |
    lemonchiffon: #FFFACD | lightblue: #ADD8E6 | lightcoral: #F08080 | lightcyan: #E0FFFF | lightgoldenrodyellow: #FAFAD2 |
    lightgray: #D3D3D3 | lightgreen: #90EE90 | lightgrey: #D3D3D3 | lightpink: #FFB6C1 | lightsalmon: #FFA07A | lightseagreen: #20B2AA |
    lightskyblue: #87CEFA | lightslategray: #778899 | lightslategrey: #778899 | lightsteelblue: #B0C4DE | lightyellow: #FFFFE0 |
    lime: #00FF00 | limegreen: #32CD32 | linen: #FAF0E6 | magenta: #FF00FF | maroon: #800000 | mediumaquamarine: #66CDAA |
    mediumblue: #0000CD | mediumorchid: #BA55D3 | mediumpurple: #9370DB | mediumseagreen: #3CB371 | mediumslateblue: #7B68EE |
    mediumspringgreen: #00FA9A | mediumturquoise: #48D1CC | mediumvioletred: #C71585 | midnightblue: #191970 | mintcream: #F5FFFA |
    mistyrose: #FFE4E1 | moccasin: #FFE4B5 | navajowhite: #FFDEAD | navy: #000080 | oldlace: #FDF5E6 | olive: #808000 |
    olivedrab: #6B8E23 | orange: #FFA500 | orangered: #FF4500 | orchid: #DA70D6 | palegoldenrod: #EEE8AA | palegreen: #98FB98 |
    paleturquoise: #AFEEEE | palevioletred: #DB7093 | papayawhip: #FFEFD5 | peachpuff: #FFDAB9 | peru: #CD853F | pink: #FFC0CB |
    plum: #DDA0DD | powderblue: #B0E0E6 | purple: #800080 | rebeccapurple: #663399 | red: #FF0000 | rosybrown: #BC8F8F | royalblue: #4169E1 |
    saddlebrown: #8B4513 | salmon: #FA8072 | sandybrown: #F4A460 | seagreen: #2E8B57 | seashell: #FFF5EE | sienna: #A0522D |
    silver: #C0C0C0 | skyblue: #87CEEB | slateblue: #6A5ACD | slategray: #708090 | slategrey: #708090 | snow: #FFFAFA |
    springgreen: #00FF7F | steelblue: #4682B4 | tan: #D2B48C | teal: #008080 | thistle: #D8BFD8 | tomato: #FF6347 |
    turquoise: #40E0D0 | violet: #EE82EE | wheat: #F5DEB3 | white: #FFFFFF | whitesmoke: #F5F5F5 | yellow: #FFFF00 |
    yellowgreen: #9ACD32 | transparent | currentcolor;
RGBCOLOR = rgb(INT{3}) | rgb(STRICT_PERCENTAGE{3});
RGBACOLOR = rgba(NUM{4}) | rgba(STRICT_PERCENTAGE{3} NUM);
HSLCOLOR = hsl(NUM PERCENTAGE{2});
HSLACOLOR = hsl(NUM PERCENTAGE{2} NUM);
COLOR = SCOLOR | RGBCOLOR | RGBACOLOR | HSLCOLOR | HSLACOLOR;
BG_POSITION_TERM = PLENGTH | left | center | right | top | bottom;
SIDE_OR_CORNER =  [left | right] || [top | bottom];
COLOR_STOP = SPACE(COLOR [PERCENTAGE | LENGTH]?);
LINEAR_GRADIENT = linear-gradient([ANGLE | SPACE(to SIDE_OR_CORNER)]? COLOR_STOP+) |
                  repeating-linear-gradient([ANGLE | SPACE(to SIDE_OR_CORNER)]? COLOR_STOP+) |;
GRADIENT_EXTENT = closest-corner | closest-side | farthest-corner | farthest-side;
GRADIENT_POSITION = at BG_POSITION_TERM{1,4};
GRADIENT_SHAPE = SPACE(circle LENGTH? GRADIENT_POSITION?) | SPACE(ellipse PLENGTH{2}? GRADIENT_POSITION?)| SPACE([circle | ellipse] GRADIENT_EXTENT? GRADIENT_POSITION?);
RADIAL_GRADIENT = radial-gradient([GRADIENT_SHAPE | SPACE(GRADIENT_POSITION)]? COLOR_STOP+) |
                  repeating-radial-gradient([GRADIENT_SHAPE | SPACE(GRADIENT_POSITION)]? COLOR_STOP+);
URI_OR_NONE = URI | none;
IMAGE =  URI | LINEAR_GRADIENT | RADIAL_GRADIENT | none;
azimuth = ANGLE | [[ left-side | far-left | left | center-left | center | center-right | right | far-right | right-side ] || behind ] | leftwards | rightwards;
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
clear = none | left | right | top | bottom | both | all | same;
clip = rect(ALENGTH{4}) | rect(SPACE(ALENGTH{4})) | auto;
color = COLOR;
LIST_STYLE_TYPE = disc | circle | square | decimal | decimal-leading-zero | lower-roman |
    upper-roman | lower-greek | lower-latin | upper-latin | armenian | georgian | lower-alpha |
    upper-alpha | russian | upper-russian | lower-russian | cjk-ideographic | trad-chinese-informal |
    hebrew | none;
TYPE_OR_UNIT_IN_ATTR = string | color | url | integer | number | length | angle | time | frequency;
ATTR = attr(SPACE(IDENT TYPE_OR_UNIT_IN_ATTR?) [ STRING | IDENT | COLOR | INT | NUM | PLENGTH | ANGLE | POS_TIME | FREQUENCY]?);
CONTENT = normal | none |
    [ STRING | URI | counter(IDENT LIST_STYLE_TYPE?) |
    counters(IDENT STRING LIST_STYLE_TYPE?) | ATTR |
    target-counter([ STRING | URI ] IDENT LIST_STYLE_TYPE?) |
    target-counter(ATTR IDENT LIST_STYLE_TYPE?) |
    target-counters([ STRING | URI ] IDENT STRING LIST_STYLE_TYPE?) |
    target-counters(ATTR IDENT STRING LIST_STYLE_TYPE?) |
    open-quote | close-quote | no-open-quote | no-close-quote ]+;
content = CONTENT;
COUNTER = [ IDENT INT? ]+ | none;
counter-increment = COUNTER;
counter-reset = COUNTER;
counter-set = COUNTER;
cue-after = URI_OR_NONE;
cue-before = URI_OR_NONE;
cursor = COMMA(URI* [ auto | crosshair | default | pointer | move | e-resize | ne-resize | nw-resize |
    n-resize | se-resize | sw-resize | s-resize | w-resize | text | wait | help | progress ]);
direction = ltr | rtl;
display = inline | block | list-item | inline-block | table | inline-table | table-row-group |
    table-header-group | table-footer-group | table-row | table-column-group | table-column |
    table-cell | table-caption | none | oeb-page-head | oeb-page-foot | flex | inline-flex |
    ruby | ruby-base | ruby-text | ruby-base-container | ruby-text-container | run-in | compact | marker;
elevation = ANGLE | below | level | above | higher | lower;
empty-cells = show | hide;
FAMILY = SPACE(IDENT+) | STRING;
FAMILY_LIST = COMMA( FAMILY+ );
font-family = FAMILY_LIST;
font-size = xx-small | x-small | small | medium | large | x-large | xx-large | larger | smaller | PPLENGTH | POS_NUM;
font-style = normal | italic | oblique;
font-variant = normal | small-caps;
font-weight = normal | bold | bolder | lighter | 100 | 200 | 300 | 400 | 500 | 600 | 700 | 800 | 900;
height = PAPLENGTH | POS_NUM ;
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
max-height = NPLENGTH;
max-width = NPLENGTH;
min-height = auto | PLENGTH;
min-width = auto | PLENGTH;
orphans = POS_INT;
outline-offset = LENGTH;
outline-color = COLOR | invert;
outline-style = BORDER_SIDE_STYLE;
outline-width = BORDER_SIDE_WIDTH;
overflow = visible | hidden | scroll | auto;
padding-right = PPLENGTH;
padding-left = PPLENGTH;
padding-top = PPLENGTH;
padding-bottom = PPLENGTH;
PAGE_BREAK = auto | always | avoid | left | right | recto | verso;
page-break-after = PAGE_BREAK;
page-break-before = PAGE_BREAK;
page-break-inside = avoid | auto;
PAUSE = POS_TIME | ZERO | POS_PERCENTAGE;
pause-after = PAUSE;
pause-before = PAUSE;
pitch-range = NUM;
pitch = FREQUENCY | x-low | low | medium | high | x-high;
play-during = [URI [ mix || repeat ]?] | auto | none;
position = static | relative | absolute | fixed;
quotes = [STRING STRING]+ | none;
richness = NUM;
right = APLENGTH;
speak-header = once | always;
speak-numeral = digits | continuous;
speak-punctuation = code | none;
speech-rate = NUM | x-slow | slow | medium | fast | x-fast | faster | slower;
stress = NUM;
table-layout = auto | fixed;
text-align = left | right | center | justify | start | end;
text-decoration = none | [ underline || overline || line-through || blink ];
text-indent = PLENGTH;
text-transform = capitalize | uppercase | lowercase | none;
top = APLENGTH;
vertical-align = baseline | sub | super | top | text-top | middle | bottom | text-bottom | PLENGTH;
visibility = visible | hidden | collapse;
voice-family = FAMILY_LIST;
volume = NUM | PERCENTAGE | silent | x-soft | soft | medium | loud | x-loud;
white-space = normal | pre | nowrap | pre-wrap | pre-line;
widows = POS_INT;
width = PAPLENGTH | POS_NUM ;
word-spacing = normal | LENGTH_OR_NUM;
z-index = auto | INT;

[epub,moz,ms,webkit]hyphens = auto | manual | none;
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
block-size = PAPLENGTH | POS_NUM;
inline-size = PAPLENGTH | POS_NUM;
max-block-size = NPLENGTH;
max-inline-size = NPLENGTH;
min-block-size = auto | PLENGTH;
min-inline-size = auto | PLENGTH;

SHAPE = auto | rectangle( PLENGTH{4} ) |  ellipse( PLENGTH{4} ) |  circle( PLENGTH{3} ) |
    polygon( SPACE(PLENGTH+)+ );
[epubx]shape-inside = SHAPE;
[epubx,webkit]shape-outside = SHAPE;
[epubx,ms]wrap-flow = auto | both | start | end | maximum | clear | around /* epub al */;

TRANSFORM_FUNCTION = matrix(NUM{6}) | translate(PLENGTH{1,2}) | translateX(PLENGTH) | translateY(PLENGTH) |
 scale(NUM{1,2}) | scaleX(NUM) | scaleY(NUM) | rotate(ANGLE) | skewX(ANGLE) | skewY(ANGLE);
[epub,ms]transform = none | TRANSFORM_FUNCTION+;
[epub,ms]transform-origin = [[[ top | bottom | left | right] PLENGTH?] | center | PLENGTH]{1,2}; /* relaxed */

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

src = COMMA([SPACE(URI format(STRING+)?) | local(FAMILY)]+); /* for font-face */

[epubx,webkit]flow-from = IDENT;
[epubx,webkit]flow-into = IDENT;
[epubx]flow-linger = INT | none;
[epubx]flow-priority = INT;
[epubx]flow-options = none | [ exclusive || last || static ];
[epubx]page = INT | auto;
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

[adapt]template = URI_OR_NONE;
[adapt]behavior = IDENT;

/* CSS Fonts */
font-size-adjust = none | NNEG_NUM;
[webkit]font-kerning = auto | normal | none;
font-variant-east-asian = normal | [[ jis78 | jis83 | jis90 | jis04 | simplified | traditional ] || [ full-width | proportional-width ] || ruby];
font-feature-settings = COMMA( SPACE( STRING [ on | off | INT ]? )+ );
font-stretch = normal | wider | narrower | ultra-condensed | extra-condensed | condensed | semi-condensed | semi-expanded | expanded | extra-expanded | ultra-expanded;

/* CSS Images */
image-resolution = RESOLUTION;
object-fit = fill | contain | cover | none | scale-down;
object-position = COMMA( SPACE(BG_POSITION_TERM{1,4})+ ); /* relaxed */

/* CSS Paged Media */
PAGE_SIZE = a5 | a4 | a3 | b5 | b4 | jis-b5 | jis-b4 | letter | legal | ledger;
bleed = auto | LENGTH;
marks = none | [ crop || cross ];
size = POS_LENGTH{1,2} | auto | [ PAGE_SIZE || [ portrait | landscape ] ];

/* CSS Page Floats */
float-reference = inline | column | region | page;
float = block-start | block-end | inline-start | inline-end | snap-block | snap-inline | left | right | top | bottom | none | footnote;
float-min-wrap-block = PPLENGTH;

/* CSS Ruby */
ruby-align = start | center | space-between | space-around;
ruby-position = over | under | inter-character;

/* CSS Size Adjust */
[moz,ms]text-size-adjust = auto | none | POS_PERCENTAGE;

/* CSS Text */
[ms,webkit]line-break = auto | loose | normal | strict;
overflow-wrap = normal | break-word;
[moz]tab-size = NNEG_INT | NNEG_LENGTH;
[moz,ms]text-align-last = auto | start | end | left | right | center | justify;
[ms]text-justify = auto | none | inter-word | inter-character | inter-ideograph /* specified in UA stylesheet for IE */;
[ms]word-break = normal | keep-all | break-all | break-word;
[ms]word-wrap = normal | break-word;

/* CSS Text Decoration */
[webkit]text-decoration-color = COLOR;
[webkit]text-decoration-line = none | [ underline || overline || line-through || blink ];
[webkit]text-decoration-skip = none | [ objects || spaces || ink || edges || box-decoration ];
[webkit]text-decoration-style = solid | double | dotted | dashed | wavy;
[epub,webkit]text-emphasis-color = COLOR;
[webkit]text-emphasis-position = [ over | under ] [ right | left ];
[epub,webkit]text-emphasis-style = none | [[ filled | open ] || [ dot | circle | double-circle | triangle | sesame ]] | STRING;
[ms,webkit]text-underline-position = auto | [ under || [ left | right ]];

/* CSS Transforms */
[ms,webkit]backface-visibility = visible | hidden;

/* CSS UI */
box-sizing = content-box | padding-box | border-box;
[ms]text-overflow = [clip | ellipsis | STRING]{1,2};

/* CSS Writing Modes */
[webkit]text-combine = none | horizontal;
[epub,ms]text-combine-horizontal = none | all | [ digits POS_INT? ]; /* relaxed */
text-combine-upright = none | all | [ digits POS_INT? ]; /* relaxed */
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
[ms]touch-action = auto | none | [ pan-x || pan-y ] | manipulation;

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
footnote-policy = auto | line;

[viv]repeat-on-break = auto | none | header | footer;

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
font-variant: normal;
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
text-emphasis-color: currentColor;
text-emphasis-style: none;
marker-start: none;
marker-mid: none;
marker-end: none;

/* css-logical */
border-block-start-color: currentColor;
border-block-end-color: currentColor;
border-inline-start-color: currentColor;
border-inline-end-color: currentColor;
border-block-start-style: none;
border-block-end-style: none;
border-inline-start-style: none;
border-inline-end-style: none;
border-block-start-width: 3px;
border-block-end-width: 3px;
border-inline-start-width: 3px;
border-inline-end-width: 3px;

SHORTHANDS

background = COMMA background-image [background-position [ / background-size ]] background-repeat
     background-attachment [background-origin background-clip] background-color; /* background-color is a special case, see the code */
border-top = border-top-width border-top-style border-top-color;
border-right = border-right-width border-right-style border-right-color;
border-bottom = border-bottom-width border-bottom-style border-bottom-color;
border-left = border-left-width border-left-style border-left-color;
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
list-style = list-style-type list-style-position list-style-image;
margin = INSETS margin-top margin-right margin-bottom margin-left;
padding = INSETS padding-top padding-right padding-bottom padding-left;
pause = INSETS pause-before pause-after;
font = FONT font-style font-variant font-weight font-stretch /* font-size line-height font-family are special-cased */;
[epub,webkit]text-emphasis = text-emphasis-style text-emphasis-color;
marker = INSETS marker-start marker-mid marker-end;

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
inset-block = INSETS block-start block-end;
inset-inline = INSETS inline-start inline-end;

/* old names  */
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

// user-agent.xml
export const UserAgentXml = `
<!DOCTYPE html>
<html xmlns="http://www.w3.org/1999/xhtml" xmlns:s="http://www.pyroxy.com/ns/shadow">
<head>
<style><![CDATA[

.footnote-content {
  float: footnote;
}

.table-cell-container {
  display: block;
}

]]></style>
</head>
<body>

<s:template id="footnote"><s:content/><s:include class="footnote-content"/></s:template>

<s:template id="table-cell"><div data-vivliostyle-flow-root="true" class="table-cell-container"><s:content/></div></s:template>

</body>
</html>`;

// user-agent-page.css
export const UserAgentPageCss = `
@namespace html "http://www.w3.org/1999/xhtml";

html|body {
  hyphens: -epubx-expr(pref-hyphenate? "auto": "manual");
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

// user-agent-base.css
export const UserAgentBaseCss = `
@namespace html "http://www.w3.org/1999/xhtml";

html|html,
html|address,
html|blockquote,
html|body,
html|dd,
html|div,
html|dl,
html|dt,
html|fieldset,
html|form,
html|frame,
html|frameset,
html|h1,
html|h2,
html|h3,
html|h4,
html|h5,
html|h6,
html|noframes,
html|ol,
html|p,
html|ul,
html|center,
html|dir,
html|hr,
html|menu,
html|pre,
html|article,
html|section,
html|nav,
html|aside,
html|hgroup,
html|footer,
html|header,
html|figure,
html|figcaption,
html|main {
  display: block;
  unicode-bidi: normal;
}
html|li {
  display: list-item;
}
html|head {
  display: none !important;
}
html|table {
  display: table;
}
html|tr {
  display: table-row;
}
html|thead {
  display: table-header-group;
  break-after: avoid;
}
html|tbody {
  display: table-row-group;
}
html|tfoot {
  display: table-footer-group;
  break-before: avoid;
}
html|col {
  display: table-column;
}
html|colgroup {
  display: table-column-group;
}
html|td,
html|th {
  display: table-cell;
}
html|caption {
  display: table-caption;
  text-align: center;
}
html|th {
  font-weight: bolder;
  text-align: center;
}
html|*[hidden],
html|link,
html|style,
html|script {
  display: none;
}
html|body {
  margin: 8px;
}
html|h1 {
  font-size: 2em;
  margin-block-start: 0.67em;
  margin-block-end: 0.67em;
  margin-inline-start: 0em;
  margin-inline-end: 0em;
}
html|h2 {
  font-size: 1.5em;
  margin-block-start: 0.75em;
  margin-block-end: 0.75em;
  margin-inline-start: 0em;
  margin-inline-end: 0em;
}
html|h3 {
  font-size: 1.17em;
  margin-block-start: 0.83em;
  margin-block-end: 0.83em;
  margin-inline-start: 0em;
  margin-inline-end: 0em;
}
html|h4,
html|p,
html|blockquote,
html|ul,
html|fieldset,
html|form,
html|ol,
html|dl,
html|dir,
html|menu,
html|h5,
html|h6 {
  margin-block-start: 1em;
  margin-block-end: 1em;
  margin-inline-start: 0em;
  margin-inline-end: 0em;
}
html|h5 {
  font-size: 0.83em;
}
html|h6 {
  font-size: 0.75em;
}
html|h1,
html|h2,
html|h3,
html|h4,
html|h5,
html|h6,
html|b,
html|strong {
  font-weight: bolder;
}
html|h1,
html|h2,
html|h3,
html|h4,
html|h5,
html|h6 {
  break-after: avoid;
}
html|blockquote {
  margin-block-start: 0px;
  margin-block-end: 0px;
  margin-inline-start: 40px;
  margin-inline-end: 40px;
}
html|i,
html|cite,
html|em,
html|var,
html|address {
  font-style: italic;
}
html|pre,
html|tt,
html|code,
html|kbd,
html|samp {
  font-family: monospace;
}
html|pre {
  white-space: pre;
}
html|button,
html|textarea,
html|input,
html|select {
  display: inline-block;
}
html|big {
  font-size: 1.17em;
}
html|small,
html|sub,
html|sup {
  font-size: 0.83em;
}
html|sub {
  vertical-align: sub;
}
html|sup {
  vertical-align: super;
}
html|table {
  border-spacing: 2px;
}
html|thead,
html|tbody,
html|tfoot {
  vertical-align: middle;
}
/* for XHTML tables without tbody */
html|table > html|tr {
  vertical-align: middle;
}
html|td,
html|th {
  vertical-align: inherit;
}
html|s,
html|strike,
html|del {
  text-decoration: line-through;
}
html|hr {
  border: 1px inset;
}
html|ol,
html|ul,
html|dir,
html|menu,
html|dd {
  margin: 0px;
  margin-inline-start: 40px;
}
html|ol html|ul,
html|ul html|ol,
html|ul html|ul,
html|ol html|ol {
  margin-block-start: 0;
  margin-block-end: 0;
}
html|u,
html|ins {
  text-decoration: underline;
}
html|center {
  text-align: center;
}
html|q:before {
  content: open-quote;
}
html|q:after {
  content: close-quote;
}

html|audio,
html|video {
  break-inside: avoid;
}

html|ruby {
  display: ruby;
}
html|rp {
  display: none;
}
html|rbc {
  display: ruby-base-container;
}
html|rtc {
  display: ruby-text-container;
}
html|rb {
  display: ruby-base;
  white-space: nowrap;
}
html|rt {
  display: ruby-text;
}
html|ruby,
html|rb,
html|rt,
html|rbc,
html|rtc {
  unicode-bidi: isolate;
}

html|rtc,
html|rt {
  font-variant-east-asian: ruby;
  text-emphasis: none;
  white-space: nowrap;
  line-height: 1;
}

html|rtc:lang(zh),
html|rt:lang(zh) {
  ruby-align: center;
}

html|rtc,
html|rt {
  font-size: 50%;
}

html|rtc:lang(zh-TW),
html|rt:lang(zh-TW) {
  font-size: 30%;
}

html|rtc > html|rt,
html|rtc > html|rt:lang(zh-TW) {
  font-size: 100%;
}

/* Bidi settings */
html|bdo[dir="ltr"] {
  direction: ltr;
  unicode-bidi: bidi-override;
}
html|bdo[dir="rtl"] {
  direction: rtl;
  unicode-bidi: bidi-override;
}
html|*[dir="ltr"] {
  direction: ltr;
  unicode-bidi: embed;
}
html|*[dir="rtl"] {
  direction: rtl;
  unicode-bidi: embed;
}

/*------------------ epub-specific ---------------------*/

@namespace epub "http://www.idpf.org/2007/ops";

html|a[epub|type="noteref"] {
  font-size: 0.75em;
  vertical-align: super;
  line-height: 0.01;
}

html|a[epub|type="noteref"]:href-epub-type(footnote) {
  -adapt-template: url(user-agent.xml#footnote);
  text-decoration: none;
}

html|aside[epub|type="footnote"] {
  display: none;
}

html|aside[epub|type="footnote"]:footnote-content {
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

/*--------------- ncx and toc ----------------------*/

@namespace ncx "http://www.daisy.org/z3986/2005/ncx/";

ncx|ncx {
  display: block;
  padding-top: 10px;
  padding-bottom: 10px;
}

ncx|content {
  display: none;
}

body > * {
  -adapt-behavior: body-child;
}

[role="doc-toc"],
[role="directory"],
nav,
.toc,
#toc,
#table-of-contents,
#contents {
  -adapt-behavior: toc-root;
}

[role="doc-toc"] a,
[role="directory"] a,
nav a,
.toc a,
#toc a,
ncx|navLabel {
  -adapt-behavior: toc-node-anchor;
}

[role="doc-toc"] li,
[role="directory"] li,
nav li,
.toc li,
#toc li,
ncx|navPoint {
  -adapt-behavior: toc-node;
}

[role="doc-toc"] li > *:first-child,
[role="directory"] li > *:first-child,
nav li > *:first-child,
.toc li > *:first-child,
#toc li > *:first-child {
  -adapt-behavior: toc-node-first-child;
}

[role="doc-toc"] ol,
[role="directory"] ol,
nav ol,
.toc ol,
#toc ol,
[role="doc-toc"] ul,
[role="directory"] ul,
nav ul,
.toc ul,
#toc ul,
ol[role="doc-toc"],
ol[role="directory"],
ol.toc,
ol#toc,
ul[role="doc-toc"],
ul[role="directory"],
ul.toc,
ul#toc {
  -adapt-behavior: toc-container;
}
`;
