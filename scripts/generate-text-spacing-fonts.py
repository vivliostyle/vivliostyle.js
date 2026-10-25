#!/usr/bin/env -S uv run --script
# /// script
# requires-python = ">=3.11"
# dependencies = ["fonttools==4.63.0", "brotli==1.2.0"]
# ///
"""Generate the woff2 font for the text-spacing polyfill (#2034).

Vivliostyle's text-spacing implementation inserts hidden filler spaces whose
advance width must be independent of the installed fonts. This script builds
the woff2 font those fillers use: U+0020 with an advance of exactly 0.5 em.
The fillers that need other widths derive them with `letter-spacing` in the
UA stylesheet.

In Blink, unless the filler elements have `text-rendering:
geometricPrecision`, web fonts are laid out without subpixel positioning and
the advances are rounded to whole pixels.
(see QuerySystemRenderStyle in font_platform_data.cc)

Base64-encode the output (`base64 -w0 viv-ts-sp.woff2`) for the data URI in
the @font-face `src` in assets.ts.
"""

from typing import BinaryIO

from fontTools.fontBuilder import FontBuilder
from fontTools.misc.timeTools import timestampSinceEpoch
from fontTools.pens.ttGlyphPen import TTGlyphPen
from fontTools.ttLib import TTFont


def set_vertical_metrics(
    font: TTFont, ascender: int, descender: int, line_gap: int
) -> None:
    hhea = font["hhea"]
    hhea.ascent = ascender
    hhea.descent = descender
    hhea.lineGap = line_gap
    os2 = font["OS/2"]
    os2.version = 4
    os2.sTypoAscender = ascender
    os2.sTypoDescender = descender
    os2.sTypoLineGap = line_gap
    os2.usWinAscent = ascender
    os2.usWinDescent = -descender
    USE_TYPO_METRICS = 1 << 7
    os2.fsSelection |= USE_TYPO_METRICS


def build_woff2(space_advance: int, units_per_em: int, f: BinaryIO) -> None:
    SPACE = "space"
    # The missing-glyph slot the TrueType spec requires at GID 0. The label
    # follows the glyph name that CFF mandates there (".notdef"); in TrueType
    # it does not particularly have to be ".notdef".
    NOTDEF = ".notdef"
    # Chromium's sanitizer rejects a font in which no glyph has any contour,
    # so place a dummy glyph carrying one; keeping it out of cmap makes it
    # unreachable.
    DUMMY = "dummy"

    fb = FontBuilder(units_per_em, isTTF=True)
    fb.font.flavor = "woff2"
    fb.setupGlyphOrder([NOTDEF, SPACE, DUMMY])
    fb.setupCharacterMap({0x20: SPACE})
    empty = TTGlyphPen(None).glyph()
    dummy_pen = TTGlyphPen(None)
    dummy_pen.moveTo((0, 0))
    dummy_pen.lineTo((1, 0))
    dummy_pen.lineTo((0, 1))
    dummy_pen.closePath()
    fb.setupGlyf({NOTDEF: empty, SPACE: empty, DUMMY: dummy_pen.glyph()})
    # glyph name -> (advance width, left side bearing)
    fb.setupHorizontalMetrics(
        {NOTDEF: (0, 0), SPACE: (space_advance, 0), DUMMY: (0, 0)}
    )

    # Chromium's sanitizer rejects a font that lacks any of the tables below.
    fb.setupHorizontalHeader()
    fb.setupNameTable({})
    fb.setupOS2()
    fb.setupPost()

    # FIXME: Workaround for the regression introduced by #2035.
    # Give the font the metrics of Times, namely those of Liberation Serif, the
    # standard substitute for "Times" on Linux.
    # https://github.com/liberationfonts/liberation-fonts/releases/tag/2.1.5
    # Without vertical metrics, underlines vanish. For overlines and
    # line-throughs to behave like native spacing with an arbitrary font, the
    # filler would need the same vertical metrics as that font; this problem
    # predates #2035.
    TIMES_UNITS_PER_EM = 2048

    def times_metric(value: int) -> int:
        return round(value * units_per_em / TIMES_UNITS_PER_EM)

    TIMES_ASCENDER = 1825
    TIMES_DESCENDER = -443
    TIMES_LINE_GAP = 87
    set_vertical_metrics(
        fb.font,
        times_metric(TIMES_ASCENDER),
        times_metric(TIMES_DESCENDER),
        times_metric(TIMES_LINE_GAP),
    )

    # For deterministic output
    epoch = timestampSinceEpoch(0)
    fb.updateHead(created=epoch, modified=epoch)

    fb.font.save(f)


def main() -> None:
    UNITS_PER_EM = 2048
    with open("viv-ts-sp.woff2", "wb") as f:
        build_woff2(UNITS_PER_EM // 2, UNITS_PER_EM, f)


if __name__ == "__main__":
    main()
