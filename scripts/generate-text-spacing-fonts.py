#!/usr/bin/env -S uv run --script
# /// script
# requires-python = ">=3.11"
# dependencies = ["fonttools==4.63.0", "brotli==1.2.0"]
# ///
"""Generate the woff2 font for the text-spacing polyfill (#2034).

Vivliostyle's text-spacing implementation inserts hidden filler spaces whose
advance width must be independent of the installed fonts. This script builds
the woff2 font those fillers use. It carries U+0020 in three widths, selected
per filler with stylistic sets:

- default: 0.5 em, the punctuation trim/space fillers (viv-ts-open/viv-ts-close)
- ss01:    0.125 em, the inter-script thin space (viv-ts-thin-sp)
- ss02:    1 em, the hanging-punctuation filler (viv-ts-close.viv-hang-end)

In Blink, unless the filler elements have `text-rendering:
geometricPrecision`, web fonts are laid out without subpixel positioning and
the advances are rounded to whole pixels.
(see QuerySystemRenderStyle in font_platform_data.cc)

Base64-encode the output (`base64 -w0 viv-ts-sp.woff2`) for the data URI in
the @font-face `src` in assets.ts.
"""

from typing import BinaryIO

from fontTools.feaLib.builder import addOpenTypeFeaturesFromString
from fontTools.fontBuilder import FontBuilder
from fontTools.misc.timeTools import timestampSinceEpoch
from fontTools.pens.ttGlyphPen import TTGlyphPen


def build_woff2(f: BinaryIO) -> None:
    UNITS_PER_EM = 2048

    SPACE = "space"
    SPACE_THIN = "space.thin"
    SPACE_HANG = "space.hang"
    # The missing-glyph slot the TrueType spec requires at GID 0. The label
    # follows the glyph name that CFF mandates there (".notdef"); in TrueType
    # it does not particularly have to be ".notdef".
    NOTDEF = ".notdef"
    # Chromium's sanitizer rejects a font in which no glyph has any contour,
    # so place a dummy glyph carrying one; keeping it out of cmap makes it
    # unreachable.
    DUMMY = "dummy"

    fb = FontBuilder(UNITS_PER_EM, isTTF=True)
    fb.font.flavor = "woff2"
    fb.setupGlyphOrder([NOTDEF, SPACE, SPACE_THIN, SPACE_HANG, DUMMY])
    fb.setupCharacterMap({0x20: SPACE})
    empty = TTGlyphPen(None).glyph()
    dummy_pen = TTGlyphPen(None)
    dummy_pen.moveTo((0, 0))
    dummy_pen.lineTo((1, 0))
    dummy_pen.lineTo((0, 1))
    dummy_pen.closePath()
    dummy = dummy_pen.glyph()
    fb.setupGlyf(
        {
            NOTDEF: empty,
            SPACE: empty,
            SPACE_THIN: empty,
            SPACE_HANG: empty,
            DUMMY: dummy,
        }
    )
    # glyph name -> (advance width, left side bearing)
    fb.setupHorizontalMetrics(
        {
            NOTDEF: (0, 0),
            SPACE: (UNITS_PER_EM // 2, 0),
            SPACE_THIN: (UNITS_PER_EM // 8, 0),
            SPACE_HANG: (UNITS_PER_EM, 0),
            DUMMY: (0, 0),
        }
    )
    addOpenTypeFeaturesFromString(
        fb.font,
        f"""
        feature ss01 {{ sub {SPACE} by {SPACE_THIN}; }} ss01;
        feature ss02 {{ sub {SPACE} by {SPACE_HANG}; }} ss02;
        """,
    )

    # Chromium's sanitizer rejects a font that lacks any of the tables below.
    fb.setupHorizontalHeader()
    fb.setupNameTable({})
    fb.setupOS2()
    fb.setupPost()

    # For deterministic output
    epoch = timestampSinceEpoch(0)
    fb.updateHead(created=epoch, modified=epoch)

    fb.font.save(f)


def main() -> None:
    with open("viv-ts-sp.woff2", "wb") as f:
        build_woff2(f)


if __name__ == "__main__":
    main()
