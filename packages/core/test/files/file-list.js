module.exports = [
  {
    category: "Start page",
    files: [{ file: "", title: "Vivliostyle Viewer start page" }],
  },
  {
    category: "General",
    files: [
      { file: "empty_page.html", title: "Empty page (Issue #97)" },
      { file: "outline.html", title: "Outline (PR #183)" },
      { file: "math-sample.html", title: "MathJax (PR #212)" },
      {
        file: "prefixed_properties.html",
        title: "Prefixed properties (PR #215)",
      },
      { file: "attr-type.html", title: "Typed attr() values (Issue #1485)" },
      { file: "justification.html", title: "Justification (PR #311)" },
      {
        file: "justification_vertical.html",
        title: "Justification (vertical writing-mode, PR #352)",
      },
      {
        file: "border-width-test.html",
        title: "border-width test (PR #1085)",
      },
      {
        file: "all-shorthand.html",
        title: "all shorthand property (PR #1697)",
      },
    ],
  },
  {
    category: "Document and media",
    files: [
      {
        file: "filename%23hash.html",
        title: "Reserved character in filename (Issue #2076)",
      },
      {
        file: "vivliostyle_media/index.html",
        title: "'vivliostyle' vs 'screen' media (PR #500)",
      },
      {
        file: "lowercase-doctype",
        title: "Lowercase doctype must not cause parser error (Issue #2101)",
      },
      {
        file: ["multiple_html/first.html", "multiple_html/second.html"],
        title: "Multiple HTML files (PR #170)",
      },
      {
        file: "target_blank_link.html",
        title: "target=_blank links (PR #269)",
      },
      { file: "link-to-viewer.html", title: "Link to Vivliostyle Viewer" },
      {
        file: "lists-attributes.html",
        title: "Attributes on list elements",
        options: "&bookMode=true",
      },
    ],
  },
  {
    category: "Ruby and text emphasis",
    files: [
      {
        file: "ruby-text-emphasis/ruby-broken-pagination.html",
        title: "Ruby broken pagination (PR #139)",
      },
      {
        file: "ruby-text-emphasis/ruby-emphasis-line-spacing-horizontal.html",
        title: "Ruby and emphasis line spacing (horizontal, Issue #1604)",
      },
      {
        file: "ruby-text-emphasis/ruby-emphasis-line-spacing-vertical.html",
        title: "Ruby and emphasis line spacing (vertical, Issue #1604)",
      },
      {
        file: "ruby-text-emphasis/ruby-emphasis-start-border-horizontal.html",
        title: "Ruby and emphasis start borders (horizontal, Issue #1604)",
      },
      {
        file: "ruby-text-emphasis/ruby-emphasis-start-border-vertical.html",
        title: "Ruby and emphasis start borders (vertical, Issue #1604)",
      },
      {
        file: "ruby-text-emphasis/ruby-margin-reset-horizontal.html",
        title:
          "Ruby margin reset and important opt-out (horizontal, Issue #1604)",
      },
      {
        file: "ruby-text-emphasis/ruby-margin-reset-vertical.html",
        title:
          "Ruby margin reset and important opt-out (vertical, Issue #1604)",
      },
      {
        file: "ruby-text-emphasis/absolute-rt-page-break-horizontal.html",
        title:
          "Absolutely positioned rt at a page break (horizontal, Issue #2162)",
      },
      {
        file: "ruby-text-emphasis/absolute-rt-page-break-vertical.html",
        title:
          "Absolutely positioned rt at a page break (vertical, Issue #2162)",
      },
      {
        file: "ruby-text-emphasis/text-emphasis-position-root-lang.html",
        title:
          "text-emphasis-position at root with lang attribute (Issue #2167)",
      },
    ],
  },
  {
    category: "Selectors",
    files: [
      { file: "attr_selectors.html", title: "Attribute selectors (PR #137)" },
      { file: "selector_bug.html", title: "Selector bug (PR #177)" },
      { file: "nth_selectors.html", title: "nth selectors (PR #203)" },
      { file: "empty_selector.html", title: "empty selector (PR #205)" },
      {
        file: "ui_state_selectors.html",
        title: "UI state selectors (PR #206)",
      },
      {
        file: "not-pseudo-selector.html",
        title: ":not pseudo selector (PR #208)",
      },
      {
        file: "nth-child-of.html",
        title: ":nth-child(An+B of S) selector (PR #1622)",
      },
      {
        file: "case_sensitivity/html.html",
        title: "HTML case sensitivity (Issue #95)",
      },
      {
        file: "case_sensitivity/attribute-selectors.xhtml",
        title: "Attribute selector case sensitivity (Issue #1972)",
      },
    ],
  },
  {
    category: "CSS parsing",
    files: [
      {
        file: "css-parse-error/gradient-background-image.html",
        title: "Gradient background-image (PR #142)",
      },
      {
        file: "css-parse-error/forgiving-selector-list.html",
        title: "Syntax error in a forgiving selector list (PR #2083)",
      },
      {
        file: "css-parse-error/voided-alternative-pseudo-element.html",
        title: "Pseudo-element in a voided alternative (PR #2083)",
      },
      {
        file: "css-parse-error/unforgiving-selector-list.html",
        title: "Syntax error in an unforgiving selector list (PR #2083)",
      },
      {
        file: "css-parse-error/invalid-selector-in-a-rule.html",
        title: "Invalid selector in a rule (PR #2083)",
      },
      {
        file: "css-parse-error/pseudo-element-in-a-selector-list.html",
        title: "Pseudo-element in a selector list (PR #2083)",
      },
      {
        file: "css-parse-error/unknown-pseudo-class.html",
        title: "Unknown pseudo-class in a selector list (PR #2083)",
      },
      {
        file: "css-parse-error/dir-pseudo-class.html",
        title: ":dir() pseudo-class (PR #2093)",
      },
      {
        file: "css-parse-error/any-link-pseudo-class.html",
        title: ":any-link pseudo-class (PR #2093)",
      },
    ],
  },
  {
    category: "CSS nesting",
    files: [
      {
        file: "css-nesting-basic.html",
        title: "CSS Nesting basic (Issue #1032)",
      },
      {
        file: "css-nesting-conditionals.html",
        title: "CSS Nesting conditionals (Issue #1032)",
      },
    ],
  },
  {
    category: "Backgrounds, images, and effects",
    files: [
      {
        file: "background-gradient.html",
        title: "Background gradient (PR #191)",
      },
      {
        file: "background-shorthand.html",
        title: "Background shorthand (PR #213)",
      },
      {
        file: "background-position-var.html",
        title: "background-position with var() (Issue #2116)",
      },
      {
        file: "background-position-longhand-root.html",
        title:
          "background-position longhands on the root background (Issue #2116)",
      },
      { file: "filter_property.html", title: "Filter property (Issue #220)" },
      { file: "image-resolution.html", title: "image-resolution (PR #260)" },
      { file: "svg_properties.html", title: "SVG properties (PR #296)" },
      { file: "compositing.html", title: "Compositing and Blending (PR #313)" },
      { file: "content-url-element.html", title: "Content URL (PR #213)" },
      {
        file: "picture-element.html",
        title: "picture element with source media (Issue #1089)",
      },
    ],
  },
  {
    category: "Cascade layers",
    files: [
      {
        file: "cascade-layers.html",
        title: "Cascade layers (Issue #977)",
      },
      {
        file: "cascade-layers-important.html",
        title: "Cascade layers with !important (Issue #977)",
      },
      {
        file: "cascade-layers-page.html",
        title: "Cascade layers with @page (Issue #977)",
      },
      {
        file: "cascade-layers-import.html",
        title: "Cascade layers with @import (Issue #977)",
      },
      {
        file: "cascade-layers-counter-style.html",
        title: "Cascade layers with @counter-style (Issue #2110)",
      },
      {
        file: "cascade-layers-font-face.html",
        title: "Cascade layers with @font-face (Issue #2110)",
      },
    ],
  },
  {
    category: "Explicit defaulting keywords",
    files: [
      {
        file: "revert.html",
        title: "revert keyword (Issue #2111)",
      },
      {
        file: "revert-layer.html",
        title: "revert-layer keyword (Issue #2111)",
      },
      {
        file: "revert-rule.html",
        title: "revert-rule keyword (Issue #2111)",
      },
      {
        file: "revert-page.html",
        title: "Rollback keywords in @page (Issue #2111)",
      },
      {
        file: "toc-hidden.html",
        title: "hidden attribute in the table of contents (PR #1269)",
      },
    ],
  },
  {
    category: "Fonts and relative units",
    files: [
      {
        file: "rlh_unit/root-line-height-normal.html",
        title: "rlh with root line-height: normal (PR #2071)",
      },
      {
        file: "rlh_unit/root-line-height-numeric.html",
        title: "rlh with numeric root line-height (PR #2071)",
      },
      {
        file: "rlh_unit/root-self-reference.html",
        title: "lh/rlh on the root element itself (PR #2071)",
      },
      {
        file: "rlh_unit/root-calc-line-height.html",
        title: "lh in calc() on the root line-height (PR #2071)",
      },
      {
        file: "rlh_unit/root-calc-font-size.html",
        title: "lh in calc() on the root font-size (PR #2071)",
      },
      {
        file: "root-font-var-calc.html",
        title: "rem/rlh with font shorthand var() calc() (Issue #1955)",
      },
      {
        file: "rem_in_page_margin.html",
        title: "rem in page margin (PR #160)",
      },
      {
        file: "rem_in_relpos.html",
        title: "rem in position: relative element (PR #284)",
      },
      {
        file: "ic-unit-margin.html",
        title: "Margins using the ic unit (Issue #2197)",
      },
      {
        file: "web_font_in_page_margin.html",
        title: "Web font in page margin (PR #161)",
      },
      {
        file: "font-feature-settings.html",
        title: "Font feature settings (PR #184)",
      },
      {
        file: "font-variation-settings.html",
        title: "font-variation-settings in @font-face (PR #1694)",
      },
      { file: "font_property.html", title: "Font property (PR #301)" },
      {
        file: "relative-font-keywords-root.html",
        title: "Relative font keywords on the root element (Issue #2174)",
      },
      {
        file: "relative-font-keywords-footnote.html",
        title: "Relative font keywords in a footnote (Issue #2174)",
      },
      {
        file: "absolute-font-size-keywords.html",
        title: "Absolute font size keywords with rem/rlh/em (PR #2176)",
      },
      {
        file: "font-size-calc-values.html",
        title: "calc()/clamp()/unitless font size in a footnote (PR #2176)",
      },
      {
        file: "font-size-in-footnote.html",
        title:
          "Font size declared in a footnote resolved against the source parent (PR #2176)",
      },
      {
        file: "font-size-calc-root.html",
        title: "Root font size with a math function (PR #2176)",
      },
      {
        file: "font-size-root-zero.html",
        title: "Root font size zero (PR #2176)",
      },
      {
        file: "relative-font-weight-region-rule.html",
        title: "Relative font weight in a region rule (PR #2176)",
      },
      {
        file: "font-size-lh-unit-in-footnote.html",
        title: "lh unit of a detached font-size (PR #2176)",
      },
      {
        file: "font-size-inherit-region-rule.html",
        title: "font-size: inherit with a region rule (PR #2176)",
      },
      {
        file: "invalid-var-font-size.html",
        title: "Invalid font sizes from a var() substitution (PR #2176)",
      },
      {
        file: "font-size-root-negative-calc.html",
        title: "Root font size with a negative calc() (PR #2176)",
      },
      {
        file: "font-size-invalid-unit-root.html",
        title: "Root font size from an invalid substituted unit (PR #2176)",
      },
      {
        file: "defaulting-keyword-from-var.html",
        title: "CSS-wide keyword from a var() substitution (PR #2176)",
      },
      {
        file: "invalid-var-font-weight.html",
        title: "Invalid font weight from a var() substitution (PR #2176)",
      },
      {
        file: "absolute-font-size-keyword-xxx-large.html",
        title: "xxx-large absolute font size keyword (PR #2176)",
      },
      {
        file: "line-height-lh-region-rule.html",
        title: "line-height: lh with a region rule (PR #2176)",
      },
      {
        file: "font-weight-math-function.html",
        title: "Font weight from a math function (PR #2176)",
      },
      {
        file: "font-size-math-keyword.html",
        title: "math font size keyword of a footnote (PR #2176)",
      },
      {
        file: "invalid-var-line-height.html",
        title: "Invalid line-height from a var() substitution (PR #2176)",
      },
      {
        file: "line-height-negative-calc.html",
        title: "Negative computed line-height (PR #2176)",
      },
      {
        file: "font-size-browser-unit.html",
        title: "font-size with a browser resolved unit (PR #2176)",
      },
      {
        file: "font-size-root-browser-unit.html",
        title: "Root font size from a browser resolved unit (PR #2176)",
      },
      {
        file: "line-height-root-unitless-function.html",
        title: "Root line height from a math function of numbers (PR #2176)",
      },
      {
        file: "lh-rlh-units.html",
        title: "lh and rlh units",
      },
      {
        file: "line-height-normal-units.html",
        title: "lh and rlh with normal line-height (PR #2199)",
      },
      {
        file: "font-relative-metrics.html",
        title: "Font-relative lengths with actual metrics (PR #2198)",
      },
      {
        file: "font-relative-metrics-initial.html",
        title: "Root metric calculations with initial font size (PR #2198)",
      },
      {
        file: "font-relative-metrics-region.html",
        title: "Font metrics and footnote region priority (PR #2198)",
      },
      {
        file: "deferred-font-relative-lengths.html",
        title: "Deferred font-relative lengths (PR #2198)",
      },
      {
        file: "font-relative-metrics-root.html",
        title: "Actual font metrics in root sizing (PR #2198)",
      },
      {
        file: "script-loaded-font-metrics.html",
        title: "Root metrics after a script-loaded font (PR #2198)",
        skipLayoutRegression: true,
      },
    ],
  },
  {
    category: "CSS lengths and math functions",
    files: [
      {
        file: "page-size-math-functions.html",
        title: "Page size from standalone math functions (PR #2182)",
      },
      {
        file: "calc-page-layout.html",
        title: "calc() in headings and page properties (PR #2182)",
      },
      {
        file: "calc-number-division.html",
        title: "calc() with dimensional cancellation (PR #2182)",
      },
      {
        file: "viewport_unit.html",
        title: "viewport-percentage units (PR #507)",
      },
      {
        file: "viewport_unit_vertical.html",
        title: "viewport-percentage units (vertical writing-mode, PR #507)",
      },
      {
        file: "browser-viewport-units.html",
        title: "Browser viewport units in shorthands and longhands (PR #2198)",
      },
      {
        file: "page_viewport_unit.html",
        title: "page viewport-percentage units with calc() (PR #507)",
      },
      {
        file: "browser-viewport-page-descriptors.html",
        title: "Browser viewport units in page descriptors (PR #2198)",
        // Older viewers cannot render NaN page geometry; use the local reftest.
        skipLayoutRegression: true,
      },
      {
        file: "adaptive-viewport-page-boxes.html",
        title: "Browser viewport units in adaptive page boxes (PR #2198)",
        // Older viewers cannot render NaN page geometry; use the local reftest.
        skipLayoutRegression: true,
      },
    ],
  },
  {
    category: "Spread inside/outside properties",
    files: [
      {
        file: "spread-inside-outside/spread-inside-outside.html",
        title: "Spread inside/outside properties (PR #1519)",
      },
      {
        file: "spread-inside-outside/float-inside-outside.html",
        title: "Float inside/outside values (PR #1519)",
      },
      {
        file: "spread-inside-outside/page-float-inside-outside.html",
        title: "Page float inside/outside values (PR #1519)",
      },
    ],
  },
  {
    category: "Cross-references",
    files: [
      { file: "target-counter.html", title: "target-counter (PR #248)" },
      {
        file: "cross-scope-counters.html",
        title: "Cross-scope counters (Issue #1692)",
      },
      {
        file: "target-counter-and-margin-bug.html",
        title: "target-counter and margin bug",
      },
      {
        file: "target-counter-default-page-type.html",
        title: "target-counter() with default page type (PR #1714)",
      },
      {
        file: "issue2043-theme-base-toc/publication.json",
        title: "theme-base TOC vars with target-counter() (Issue #2043)",
      },
      {
        file: "target-counter-named-page-style.html",
        title: "target-counter() named page style (Issue #1966)",
      },
      {
        file: "target-counter-named-page-after-toc.html",
        title: "target-counter() named page after TOC page (Issue #2172)",
      },
      {
        file: "named-page-pre-preserved-newlines.html",
        title:
          "Named page pre continuation at preserved newlines before a span (Issue #2172)",
      },
      {
        file: "target-counter-named-pages-left-right.html",
        title: "target-counter() named pages with :left/:right (Issue #1497)",
      },
      {
        file: "target-counter-page-group-nth.html",
        title: "target-counter() with :nth(1 of Page) (Issue #1990)",
      },
      {
        file: "target-counter-nested-page-group-nth.html",
        title: "target-counter() with nested :nth(1 of page type) (PR #2003)",
      },
      {
        file: "target-counter-missing-page.html",
        title: "target-counter() missing page (Issue #1498)",
      },
      {
        file: "target-text.html",
        title: "target-text() - Basic Tests (PR #1575)",
      },
      {
        file: "target-text-running-element.html",
        title: "target-text() in Running Elements (PR #1575)",
      },
      {
        file: [
          "target-text-multiple/first.html",
          "target-text-multiple/second.html",
          "target-text-multiple/third.html",
        ],
        title: "target-text() - Cross-Document References (PR #1575)",
      },
      {
        file: "target-text-reflow-navigation/publication.json",
        title:
          "target-text() reflow across WebPub spine navigation (Issue #1856)",
      },
      {
        file: "target-text-shrinking-spine/publication.json",
        title:
          "target-text() reflow that shrinks an earlier WebPub spine (PR #2132)",
      },
      {
        file: "target-counter-retained-source/publication.json",
        title:
          "target-counter() reflow after a retained source value changes (PR #2132)",
      },
      {
        file: "target-text-vs-named-strings.html",
        title: "target-text() vs Named Strings (PR #1575)",
      },
      {
        file: "target-text-vs-named-strings-2.html",
        title:
          "target-text() vs Named Strings - first-letter with punctuation (PR #1575)",
      },
      {
        file: "target-text-vs-named-strings-3.html",
        title: "target-text() vs Named Strings - with ::before (PR #1575)",
      },
      {
        file: "target-text-vs-named-strings-4.html",
        title:
          "target-text() vs Named Strings - with ::before and ::after (PR #1575)",
      },
      {
        file: "target-counter-blank-page-typeerror.html",
        title: "target-counter after spread blank page (Issue #2013)",
      },
    ],
  },
  {
    category: "Leader",
    files: [
      {
        file: "leader/content-leader.html",
        title: "content: leader() (PR #1090)",
      },
      {
        file: "leader/content-leader-rtl.html",
        title: "content: leader() in RTL direction (PR #1096)",
      },
      {
        file: "leader/toc-leader.html",
        title: "Table of Contents with leader() (PR #1096)",
      },
      {
        file: "leader/toc-leader-vertical.html",
        title:
          "Table of Contents with leader() in vertical writing-mode (PR #1096)",
      },
      {
        file: "leader/inline-siblings.html",
        title: "leader() with inline sibling elements (PR #1577)",
      },
      {
        file: "leader/inline-siblings-vertical.html",
        title: "leader() with inline sibling elements (Vertical, PR #1577)",
      },
      {
        file: "leader/inline-siblings-before-after.html",
        title: "leader() with ::before and ::after pseudo-elements (PR #1577)",
      },
      {
        file: "leader/inline-siblings-before-after-vertical.html",
        title:
          "leader() with ::before and ::after pseudo-elements (Vertical, PR #1582)",
      },
      {
        file: "leader/long-content.html",
        title: "leader() with long content (PR #1582)",
      },
      {
        file: "leader/long-content-vertical.html",
        title: "leader() with long content (Vertical, PR #1582)",
      },
      {
        file: "leader/multi-column-balance.html",
        title: "leader() in multi-column with column-fill: balance (PR #1601)",
      },
      {
        file: "leader/multi-column-balance-on-body.html",
        title:
          "leader() in multi-column on body with column-fill: balance (PR #1601)",
      },
      {
        file: "leader/wrapped-following-content.html",
        title:
          "leader() followed by content that wraps before the leader expands (PR #2154)",
      },
      {
        file: "leader/wrapped-following-content-sideways-lr.html",
        title:
          "leader() followed by wrapped content in sideways-lr (Issue #1480)",
      },
      {
        file: "leader/wrapped-following-content-vertical.html",
        title:
          "leader() followed by content that wraps before the leader expands (Vertical, PR #2154)",
      },
      {
        file: "leader/container-padding.html",
        title:
          "leader() in a block container with padding beside its lines (PR #2156)",
      },
      {
        file: "leader/container-padding-vertical.html",
        title:
          "leader() in a block container with padding beside its lines (Vertical, PR #2156)",
      },
      {
        file: "leader/block-size.html",
        title: "leader() in a block container taller than its lines (PR #2157)",
      },
      {
        file: "leader/block-size-vertical.html",
        title:
          "leader() in a block container taller than its lines (Vertical, PR #2157)",
      },
      {
        file: "leader/atomic-inline-following-content.html",
        title: "leader() followed by an atomic inline box (PR #2157)",
      },
      {
        file: "leader/atomic-inline-following-content-vertical.html",
        title: "leader() followed by an atomic inline box (Vertical, PR #2157)",
      },
      {
        file: "leader/displaced-following-content.html",
        title:
          "leader() followed by content displaced along the block axis (PR #2156)",
      },
      {
        file: "leader/displaced-following-content-vertical.html",
        title:
          "leader() followed by content displaced along the block axis (Vertical, PR #2156)",
      },
      {
        file: "leader/line-break-before-leader.html",
        title:
          "leader() that does not fit beside the content before it (PR #2157)",
      },
      {
        file: "leader/line-break-before-leader-vertical.html",
        title:
          "leader() that does not fit beside the content before it (Vertical, PR #2157)",
      },
      {
        file: "leader/opposite-directions.html",
        title: "leader() running against the direction of its line (PR #2160)",
      },
      {
        file: "leader/opposite-directions-vertical.html",
        title:
          "leader() running against the direction of its line (Vertical, PR #2160)",
      },
      {
        file: "leader/column-fragment.html",
        title:
          "leader() in a block container that continues in another column (PR #2159)",
      },
      {
        file: "leader/column-fragment-vertical.html",
        title:
          "leader() in a block container that continues in another column (Vertical, PR #2159)",
      },
    ],
  },
  {
    category: "Counter style and list-style",
    files: [
      {
        file: "counter-style/test.html",
        title: "@counter-style rule (PR #1600)",
      },
      {
        file: "counter-style/list-style-type-counter-style.html",
        title: "list-style-type with @counter-style (PR #1600)",
      },
      {
        file: "counter-style/marker.html",
        title: "::marker pseudo-element (PR #1609)",
      },
      {
        file: "counter-style/marker-font-face.html",
        title: "Font family defined by @font-face on ::marker (PR #2122)",
      },
      {
        file: "counter-style/marker-block-child.html",
        title: "::marker with block child in list item (Issue #1831)",
      },
      {
        file: "counter-style/marker-empty-li.html",
        title: "::marker on empty list items (PR #1832)",
      },
      {
        file: "counter-style/list-style-position.html",
        title: "list-style-position (PR #1609)",
      },
      {
        file: "counter-style/list-style-position-super.html",
        title:
          "Outside marker alignment with superscript content (Issue #1780)",
      },
      {
        file: "counter-style/list-style-type-bullet.html",
        title: "list-style-type bullet marker (PR #1609)",
      },
      {
        file: "counter-style/list-style-type-bullet-vertical.html",
        title:
          "list-style-type bullet marker (vertical writing-mode, PR #1609)",
      },
      {
        file: "counter-style/list-item-text-spacing.html",
        title: "List-item with text-spacing (Issue #1763)",
      },
    ],
  },
  {
    category: "Text spacing",
    files: [
      {
        file: "text-spacing/text-spacing-ja.html",
        title: "Text Spacing (Japanese, PR #814)",
      },
      {
        file: "text-spacing/text-spacing-zh-hans.html",
        title: "Text Spacing (Chinese, Simplified, PR #814)",
      },
      {
        file: "text-spacing/text-spacing-zh-hant.html",
        title: "Text Spacing (Chinese, Traditional, PR #814)",
      },
      {
        file: "text-spacing/ts-generated-content.html",
        title: "Text-spacing on generated content (PR #853)",
      },
      {
        file: "text-spacing/ts-generated-content-vertical.html",
        title:
          "Text-spacing on generated content (vertical writing-mode, PR #853)",
      },
      {
        file: "text-spacing/vo-tr-quotes-vertical.html",
        title: "Vertical vo=Tr characters fallback (Issue #2023)",
      },
      {
        file: "text-spacing/text-spacing-trim-start-code.html",
        title: "text-spacing-trim after code element (Issue #1863)",
      },
      {
        file: "text-spacing/inherited-spacing-properties.html",
        title:
          "Text-spacing fillers with inherited spacing properties (PR #2035)",
      },
      {
        file: "text-spacing/text-decoration.html",
        title: "Continuous text decorations across text-autospace (PR #2124)",
      },
      {
        file: "text-spacing/line-break-stability.html",
        title: "Line breaking stability with text-spacing (Issue #2142)",
      },
      {
        file: "text-spacing/first-line-break-duplication.html",
        title:
          "Forced break and text-autospace after ::first-line (Issue #2196)",
      },
      {
        file: "text-spacing/native-text-spacing.html",
        title: "Native text spacing and fallback (Issues #2151, #1562)",
      },
      {
        file: "text-spacing/page-break-punctuation.html",
        title: "Page break after text-spacing punctuation (PR #2211)",
      },
      {
        file: "text-spacing/text-spacing-trim-all.html",
        title: "text-spacing-trim: trim-all (Issue #2214)",
      },
      {
        file: "text-spacing/autospace-margin-border-padding.html",
        title: "text-autospace across margin, border, or padding (PR #2228)",
      },
    ],
  },
  {
    category: "Hanging punctuation",
    files: [
      {
        file: "text-spacing/hanging-punctuation-ascii.html",
        title: "ASCII hanging-punctuation first/last (Issue #2192)",
      },
      {
        file: "text-spacing/hanging-punctuation.html",
        title: "Hanging Punctuation (PR #814)",
      },
      {
        file: "text-spacing/ts-hp-allow-force-end.html",
        title: "Text-spacing & hanging-punctuation allow/force-end (PR #851)",
      },
      {
        file: "text-spacing/hanging-punctuation-first-indent-ja.html",
        title:
          "hanging-punctuation:first with text-indent (Japanese, PR #1084)",
      },
      {
        file: "text-spacing/hanging-punctuation-rtl.html",
        title: "hanging-punctuation:last in right-to-left text (PR #2206)",
      },
      {
        file: "text-spacing/hanging-punctuation-inline-border.html",
        title:
          "hanging-punctuation first/last with inline border/padding (Issue #2194)",
      },
    ],
  },
  {
    category: "Blank page selector",
    files: [
      {
        file: "blank-page/blank-page.html",
        title: "Blank page selector (PR #721)",
      },
    ],
  },
  {
    category: "Nth page selector",
    files: [
      {
        file: "nth-page/nth-page.html",
        title: "nth() page selector (PR #700)",
      },
      {
        file: "nth-page/nth-page-counter-reset.html",
        title: "nth() page selector & page counter reset (PR #700)",
      },
      {
        file: "nth-page/page-counter-set-reset.html",
        title:
          "Page counter set/reset in page and element contexts (Issue #1978)",
      },
      {
        file: "nth-page/custom-page-counter-set-reset.html",
        title:
          "Custom page counter set/reset in page and element contexts (Issue #1978)",
      },
      {
        file: [
          "nth-page/nth-page.html",
          "nth-page/nth-page-counter-reset.html",
          "nth-page/nth-page.html",
        ],
        title:
          "nth() page selector & page counter reset in multiple documents (PR #700)",
      },
      {
        file: "nth-page/nth-of-page.html",
        title: ":nth(An+B of C) page selector (PR #1623)",
      },
    ],
  },
  {
    category: "Named pages",
    files: [
      {
        file: "named-pages/named-pages.html",
        title: "Named Pages (PR #714)",
      },
      {
        file: "named-pages/page-groups.html",
        title: "Page Groups (PR #714)",
      },
      {
        file: "named-pages/page-groups-spread-breaks.html",
        title: "Page Groups with spread breaks (PR #714)",
      },
      {
        file: [
          "named-pages/page-groups-concat-blank-first.html",
          "named-pages/page-groups-concat-blank-second.html",
        ],
        title:
          "Page Groups across concatenated docs with boundary blank page (PR #1749)",
      },
      {
        file: "named-pages/page-child-element.html",
        title: "Named Page on Child Element with Running Element (Issue #1833)",
      },
      {
        file: "named-pages/page-child-first-page.html",
        title: "Named Page on Child Element at Page Start (PR #1967)",
      },
      {
        file: "named-pages/page-name-propagation.html",
        title: "Named page propagation (Issue #1998)",
      },
      {
        file: "named-pages/page-rule-override-first-page.html",
        title: "@page override on first page (Issue #2002)",
      },
      {
        file: "nested-page-group-nth.html",
        title: "Nested named page with :nth(1 of page type) (PR #2003)",
      },
    ],
  },
  {
    category: "Page properties and margin boxes",
    files: [
      {
        file: "outline-offset-at-page.html",
        title: "outline-offset on @page (Issue #2000)",
      },
      {
        file: "page-writing-mode.html",
        title: "writing-mode on @page (Issue #2001)",
      },
      {
        file: "page-writing-mode-vertical.html",
        title: "writing-mode on @page, vertical root (Issue #2001)",
      },
      {
        file: "writing-mode-horizontal-tb.html",
        title: "Pagination in horizontal-tb (Issue #1480)",
      },
      {
        file: "writing-mode-vertical-rl.html",
        title: "Pagination in vertical-rl (Issue #1480)",
      },
      {
        file: "writing-mode-vertical-lr.html",
        title: "Pagination in vertical-lr (Issue #1480)",
      },
      {
        file: "writing-mode-sideways-rl.html",
        title: "Pagination in sideways-rl (Issue #1480)",
      },
      {
        file: "writing-mode-sideways-lr.html",
        title: "Pagination in sideways-lr (Issue #1480)",
      },
      {
        file: "writing-mode-vertical-lr-features.html",
        title: "Layout features in vertical-lr (Issue #1480)",
      },
      {
        file: "writing-mode-sideways-rl-features.html",
        title: "Layout features in sideways-rl (Issue #1480)",
      },
      {
        file: "writing-mode-sideways-lr-features.html",
        title: "Layout features in sideways-lr (Issue #1480)",
      },
      {
        file: "writing-mode-variable-page-floats.html",
        title:
          "Substituted writing-mode with page and region floats (Issue #1480)",
      },
      {
        file: "writing-mode-balanced-columns.html",
        title: "Balanced columns preserve block-start (Issue #1480)",
      },
      {
        file: "writing-mode-margin-align.html",
        title: "Page-margin alignment in sideways-lr (Issue #1480)",
      },
      {
        file: "writing-mode-detached-clear.html",
        title: "Clear inside detached vertical float areas (Issue #1480)",
      },
      {
        file: "writing-mode-footnote-override.html",
        title: "Footnotes with a different writing mode (Issue #1480)",
      },
      {
        file: "writing-mode-opposite-column-rules.html",
        title: "Column rules with opposite ancestor progression (Issue #1480)",
      },
      {
        file: "writing-mode-opposite-float-wrap.html",
        title:
          "Opposite ancestor and column float wrap directions (Issue #1480)",
      },
      {
        file: "writing-mode-ancestor-float-wrap.html",
        title: "Ancestor float minimum wrap in vertical-lr (Issue #1480)",
      },
      {
        file: "writing-mode-page-area-direction.html",
        title: "Page float direction differs from page context (Issue #1480)",
      },
      {
        file: "writing-mode-body-page-units.html",
        title:
          "Logical page units with writing-mode propagated from body (Issue #1480)",
      },
      {
        file: "writing-mode-body-footnotes.html",
        title: "Footnotes with writing-mode propagated from body (Issue #1480)",
      },
      {
        file: "writing-mode-body-page-context.html",
        title:
          "writing-mode on body not inherited by page context (Issue #1122)",
      },
      {
        file: "content-in-page-margin-box.html",
        title: "Content in page margin box (PR #316)",
      },
      {
        file: "page-margin-box-images.html",
        title: "Page margin box images (Issue #1867)",
      },
      {
        file: "counters-function-in-page-margin-box.html",
        title: "counters() in page margin boxes (PR #1655)",
      },
      { file: "pages_counter.html", title: "pages counter (PR #367)" },
      {
        file: "z-index-at-page.html",
        title: "z-index on @page and page-margin boxes",
      },
      {
        file: "z-index-at-page-bare-text.html",
        title:
          "z-index on @page and page-margin boxes (bare text after float, Issue #1786)",
      },
    ],
  },
  {
    category: "Named strings",
    files: [
      {
        file: "named-strings/named-strings.html",
        title: "Named strings - string() function (PR #680)",
      },
      {
        file: "named-strings/string-set-content.html",
        title: "string-set with content() function (PR #680)",
      },
      {
        file: "named-strings/string-set-attr.html",
        title: "string-set with attr() function (PR #680)",
      },
      {
        file: "named-strings/string-set-counter-page.html",
        title: "string-set with counter(page) (Issue #1997)",
      },
    ],
  },
  {
    category: "Generated content and pseudo-elements",
    files: [
      {
        file: "eal-generated-text-properties.html",
        title: "EAL generated text properties (Issue #1968)",
      },
      {
        file: "pseudo-element-context/after-float-footnote-increment.html",
        title:
          "Explicit counter-increment on an element with a footnote ::after (PR #2085)",
      },
      {
        file: "pseudo-element-context/after-content-function.html",
        title:
          "content(before) in the ::after of an element with children (PR #2085)",
      },
      {
        file: "pseudo-element-context/after-list-item-counter.html",
        title:
          "list-item counter in the pseudo-elements of an ordered list (PR #2085)",
      },
      {
        file: "pseudo-element-context/first-letter-content-marker.html",
        title:
          "content(marker) in the ::first-letter of a non-list-item element (PR #2147)",
      },
      { file: "content-attr.html", title: "Content attr() (PR #234)" },
      {
        file: "initial-letter.html",
        title: "initial-letter property (PR #1617)",
      },
      {
        file: "env-doc-title.html",
        title: "env(doc-title) function (PR #1841)",
      },
      {
        file: "first-line-line-height.html",
        title: "::first-line line-height on the first line box (PR #2203)",
      },
      {
        file: "first-line-next-block-pushed.html",
        title:
          "Block after ::first-line is not pushed to the next page (PR #2205)",
      },
    ],
  },
  {
    category: "Running elements",
    files: [
      {
        file: "running-elements/running-elements.html",
        title: "Running Elements - running() and element() functions (PR #680)",
      },
      {
        file: "running-elements/page-margin-boxes.html",
        title: "Page Margin Boxes (PR #1170)",
      },
      {
        file: "counter_in_running.html",
        title: "Counter in running element (PR #1327)",
      },
      {
        file: "running_header_adaptive.html",
        title: "Running header emulation with Adaptive Layout (PR #113)",
      },
    ],
  },
  {
    category: "Page breaks",
    files: [
      {
        file: "page_breaks/break-inside_values.html",
        title: "break-inside values (PR #127)",
      },
      {
        file: "page_breaks/break_values.html",
        title: "break values (PR #127)",
      },
      {
        file: "page_breaks/truncate_margin_at_breaks.html",
        title: "Truncate margin at breaks (PR #186)",
      },
      {
        file: "page_breaks/combine_breaks.html",
        title: "Combine forced break values (PR #188)",
      },
      {
        file: "page_breaks/combine_breaks_2.html",
        title: "Combine break value regressions (Issue #1842)",
      },
      {
        file: "page_breaks/break-before-flex-at-page-start.html",
        title: "Consumed break-before on a flex box at page start (PR #2132)",
      },
      {
        file: "page_breaks/break_left_right.html",
        title: "break-before/after: left/right (PR #238)",
      },
      {
        file: "page_breaks/page_break_between_flow_elements.html",
        title: "Page break between flow elements (PR #238)",
      },
      {
        file: "page_breaks/break_on_pseudo_of_flow_elements.html",
        title: "Break on pseudoelements of flow elements (PR #238)",
      },
      {
        file: "page_breaks/page_break_bug_with_exclusions.html",
        title: "Page break bug with exclusions (on Firefox, PR #261)",
      },
      {
        file: "page_breaks/page_break_bug_in_vertical_text.html",
        title: "Page break bug in vertical text (on Firefox, PR #263)",
      },
      {
        file: "page_breaks/class_C_break_point.html",
        title: "Class C break point (PR #383)",
      },
      {
        file: "page_breaks/block-start-out-of-flow-break.html",
        title: "Block-start out-of-flow break (Issue #1775)",
      },
      {
        file: "page_breaks/block-start-out-of-flow-break-vertical.html",
        title:
          "Block-start out-of-flow break (vertical writing-mode) (Issue #1775)",
      },
      {
        file: "page_breaks/page-breaking-with-container-padding-border.html",
        title: "Page breaking with container padding/border (Issue #1846)",
      },
      {
        file: "page_breaks/page-breaking-with-container-padding-border-cjk.html",
        title:
          "Page breaking with container padding/border and CJK text (PR #2218)",
      },
      {
        file: "page_breaks/page-breaking-with-container-padding-border-cjk-vertical.html",
        title:
          "Page breaking with container padding/border and CJK text (vertical writing-mode, PR #2218)",
      },
      {
        file: "page_breaks/line-height-inline-br.html",
        title: "Line fitting with inline elements and BR (Issue #2163)",
      },
      {
        file: "page_breaks/line-height-inline-br-vertical.html",
        title:
          "Line fitting with inline elements and BR, vertical writing-mode (Issue #2163)",
      },
      {
        file: "page_breaks/line-height-line-fitting.html",
        title:
          "Line fitting with line-height smaller than font ascent + descent (Issue #2163)",
      },
      {
        file: "page_breaks/line-height-line-fitting-vertical.html",
        title:
          "Line fitting with line-height smaller than font ascent + descent, vertical writing-mode (Issue #2163)",
      },
    ],
  },
  {
    category: "Positioning and fragmentation",
    files: [
      {
        file: "eal-zero-size-flow-partition.html",
        title:
          "EAL zero-size flow partition must not loop forever (Issue #941)",
        skipLayoutRegression: true,
      },
      {
        file: "invalid-page-area.html",
        title: "Invalid page area must not loop forever (Issue #941)",
        skipLayoutRegression: true,
      },
      {
        file: "absolute-inline-child-page-break-horizontal.html",
        title:
          "Absolutely positioned span in an inline element at a page break (horizontal, Issue #2162)",
      },
      {
        file: "absolute-inline-child-page-break-vertical.html",
        title:
          "Absolutely positioned span in an inline element at a page break (vertical, Issue #2162)",
      },
      {
        file: "absolute-inline-line-numbers-horizontal.html",
        title:
          "Code pagination with absolutely positioned line numbers and annotations (horizontal, PR #2183)",
      },
      {
        file: "absolute-inline-line-numbers-vertical.html",
        title:
          "Code pagination with absolutely positioned line numbers and annotations (vertical, PR #2183)",
      },
      {
        file: "absolute_positioning.html",
        title: "Absolute positioning (PR #172)",
      },
      {
        file: "abspos-page-break-bug.html",
        title:
          "Absolute positioned box with page break - no duplication (Issue #1870)",
      },
      {
        file: "abspos-page-break-test.html",
        title: "Absolute positioned boxes not moved to next page (Issue #1869)",
      },
      {
        file: "relative_positioning_pagination.html",
        title: "Relative positioning pagination (PR #172)",
      },
      {
        file: "relative_positioning_columns.html",
        title: "Relative positioning columns (PR #172)",
      },
      {
        file: "flex_and_large_img.html",
        title: "Flex box pagination (PR #176)",
      },
      {
        file: "unbreakable_box.html",
        title: "Unbreakable box at the end of a flow (PR #176)",
      },
      {
        file: "incorrect_layout_with_empty_partition.html",
        title: "Incorrect layout with empty partition (PR #201)",
      },
      {
        file: "partition-overlap.html",
        title:
          "Partition overlap affects non-overlapping partition (Issue #1171)",
      },
      {
        file: "box-decoration-break.html",
        title: "box-decoration-break (PR #250)",
      },
      {
        file: "flowchunk_overflow_bug.html",
        title: "Flowchunk overflow bug (PR #361)",
      },
      { file: "getRangeBoxes_bug.html", title: "getRangeBoxes bug" },
      {
        file: "inset-shorthand.html",
        title: "inset shorthand property (PR #964)",
      },
      {
        file: "margin-break.html",
        title: "margin-break property",
      },
    ],
  },
  {
    category: "Print",
    files: [
      {
        file: "print/chrome_page_top_margin_bug.html",
        title: "Chrome page top margin bug (PR #394)",
      },
      { file: "print_media/index.html", title: "Print media (PR #78)" },
      { file: "crop-marks.html", title: "Printer marks (PR #169)" },
      {
        file: "exclusion_with_printer_marks.html",
        title: "Exclusion with printer marks (PR #249)",
      },
      {
        file: "print_media/styles-in-body.html",
        title: "Style elements in the body elements (PR #78)",
      },
    ],
  },
  {
    category: "Multi-column",
    files: [
      {
        file: "multi-column/column-fill_balance.html",
        title: "column-fill: balance (PR #387)",
      },
      {
        file: "multi-column/column-fill_balance_vertical.html",
        title: "column-fill: balance (vertical writing-mode, PR #387)",
      },
      {
        file: "multi-column/column-fill_balance-all.html",
        title: "column-fill: balance-all (PR #387)",
      },
      {
        file: "multi-column/column-fill_balance-all_vertical.html",
        title: "column-fill: balance-all (vertical writing-mode, PR #387)",
      },
      {
        file: "multi-column/mixed-multicol.html",
        title: "Mixed multi-column layout test (PR #1750)",
      },
      {
        file: "multi-column/mixed-multicol-with-floats.html",
        title: "Mixed multi-column layout with floats (PR #1750)",
      },
      {
        file: "multi-column/multicol-in-page-float.html",
        title: "Multi-column in page float (Issue #1751)",
      },
      {
        file: "multi-column/multicol-column-fill-auto.html",
        title:
          "column-fill: auto in non-root multicol (Issue #1720, #1758, #1773)",
      },
      {
        file: "multi-column/column-rule-page-floats-footnotes.html",
        title: "Column rule with page floats and footnotes (Issue #1493)",
      },
      {
        file: "multi-column/column-rule-page-floats-footnotes-vertical.html",
        title:
          "Column rule with page floats and footnotes (vertical writing-mode) (Issue #1493, #1764)",
      },
      {
        file: "multi-column/multicol-page-block-end-float.html",
        title: "Multi-column text and page block-end float (Issue #1826)",
      },
    ],
  },
  {
    category: "Table",
    files: [
      {
        file: "table/table_at_flow_root.html",
        title: "Table at flow root (PR #319)",
      },
      {
        file: "table/table_col_width.html",
        title: "Table column width (PR #311)",
      },
      {
        file: "table/table_col_width_vertical.html",
        title: "Table column width (vertical writing-mode, PR #311)",
      },
      { file: "table/table_rowspan.html", title: "Table rowspan (PR #311)" },
      {
        file: "table/table_rowspan_vertical.html",
        title: "Table rowspan (vertical writing-mode, PR #311)",
      },
      { file: "table/table_colspan.html", title: "Table colspan (PR #311)" },
      {
        file: "table/table_colspan_vertical.html",
        title: "Table colspan (vertical writing-mode, PR #311)",
      },
      {
        file: "table/table_vertical_align.html",
        title: "Table vertical-align (PR #311)",
      },
      {
        file: "table/table_vertical_align_vertical.html",
        title: "Table vertical-align (vertical writing-mode, PR #311)",
      },
      {
        file: "table/table_repeating_header_footer.html",
        title: "Table repeating header/footer (PR #319)",
      },
      {
        file: "table/table_repeating_header_footer_vertical.html",
        title: "Table repeating header/footer (vertical writing-mode, PR #319)",
      },
      {
        file: "table/break_after_table.html",
        title: "Break after table (PR #397)",
      },
      {
        file: "table/table-break.html",
        title: "Table page break (auto + forced) (Issue #1492, #1849)",
      },
      {
        file: "table/nrmc-table-break-column.html",
        title: "Table column break in non-root multicol (Issue #1854)",
      },
      {
        file: "table/table-rowspan-anchor-target.html",
        title: "Table rowspan in anchor target (Issue #1905)",
      },
      {
        file: "table/overflow-into-margin-after-multipage-table.html",
        title:
          "Page content overflows into margin after multi-page table (Issue #1902)",
      },
      {
        file: "table/table-header-repeat.html",
        title:
          "Table header repeat with complex multipage tables (Issue #1873)",
      },
      {
        file: "table/table-header-repeat-nested-rowspan.html",
        title: "Table header repeat with nested rowspans (Issue #1980)",
      },
      {
        file: "table/table-caption-order.html",
        title:
          "Table caption order when table breaks across pages (Issue #2137)",
      },
    ],
  },
  {
    category: "Float and clear",
    files: [
      { file: "float-bug-test.html", title: "Float bug test (PR #228)" },
      {
        file: "left-float-bug.html",
        title: "Float bug test: Left float (PR #228)",
      },
      {
        file: "white-space_clear.html",
        title: "Combination of white-space and clear (PR #222)",
      },
      { file: "clear-bug-test.html", title: "Float clear bug (PR #225)" },
      {
        file: "float-text-offset-bug.html",
        title: "Float text offset bug (PR #227)",
      },
      {
        file: "float-clear.html",
        title: "Float with clear (Issue #1803)",
      },
      {
        file: "float-clear-vertical.html",
        title: "Float with clear, vertical-rl (Issue #1803)",
      },
      {
        file: "float-lh-rlh.html",
        title: "Float with lh/rlh height (Issue #1494, #1738)",
      },
      {
        file: "float-in-position-relative.html",
        title: "Float in position:relative across page break (Issue #1885)",
      },
      {
        file: "float-in-position-relative-vertical.html",
        title:
          "Float in position:relative across page break, vertical writing mode (Issue #1885)",
      },
      {
        file: "relative_floats.html",
        title: "Floats with position: relative (PR #240)",
      },
      {
        file: "float-in-relative-bug.html",
        title: "Float in position:relative bug (PR #388)",
      },
    ],
  },
  {
    category: "Page floats",
    files: [
      {
        file: "page_floats/page_page_floats.html",
        title: "'Page' page floats (PR #324)",
      },
      {
        file: "page_floats/page_page_floats_2.html",
        title: "'Page' page floats (2 values, PR #1444)",
      },
      {
        file: "page_floats/page_page_floats_vertical.html",
        title: "'Page' page floats (vertical writing-mode, PR #324)",
      },
      {
        file: "page_floats/page_page_floats_vertical_2.html",
        title: "'Page' page floats (vertical writing-mode, 2 values, PR #1444)",
      },
      {
        file: "page_floats/region_page_floats.html",
        title: "'Region' page floats (PR #324)",
      },
      {
        file: "page_floats/region_page_floats_vertical.html",
        title: "'Region' page floats (vertical writing-mode, PR #324)",
      },
      {
        file: "page_floats/column_page_floats.html",
        title: "'Column' page floats (PR #324)",
      },
      {
        file: "page_floats/column_page_floats_2.html",
        title: "'Column' page floats (2 values, PR #1444)",
      },
      {
        file: "page_floats/column_page_floats_vertical.html",
        title: "'Column' page floats (vertical writing-mode, PR #324)",
      },
      {
        file: "page_floats/column_page_floats_vertical_2.html",
        title:
          "'Column' page floats (vertical writing-mode, 2 values, PR #1444)",
      },
      {
        file: "page_floats/region_page_floats_with_exclusions.html",
        title: "'Region' page floats with exclusions (PR #324)",
      },
      {
        file: "page_floats/region_page_floats_with_exclusions_vertical.html",
        title:
          "'Region' page floats with exclusions (vertical writing-mode, PR #324)",
      },
      {
        file: "page_floats/column_page_floats_with_exclusions.html",
        title: "'Column' page floats with exclusions (PR #324)",
      },
      {
        file: "page_floats/column_page_floats_with_exclusions_vertical.html",
        title:
          "'Column' page floats with exclusions (vertical writing-mode, PR #324)",
      },
      {
        file: "page_floats/multiple_kind_of_page_floats.html",
        title: "Multiple kind of page floats (PR #324)",
      },
      {
        file: "page_floats/multiple_kind_of_page_floats_vertical.html",
        title: "Multiple kind of page floats (vertical writing-mode, PR #324)",
      },
      {
        file: "page_floats/column_region_page_floats.html",
        title: "'Column' and 'region' page floats in single column (PR #324)",
      },
      {
        file: "page_floats/inline_page_floats.html",
        title: "Inline page floats (PR #324)",
      },
      {
        file: "page_floats/inline_page_floats_2.html",
        title: "Inline page floats (2 values, PR #1444)",
      },
      {
        file: "page_floats/inline_page_floats_vertical.html",
        title: "Inline page floats (vertical writing-mode, PR #324)",
      },
      {
        file: "page_floats/inline_page_floats_vertical_2.html",
        title: "Inline page floats (vertical writing-mode, 2 values, PR #1444)",
      },
      {
        file: "page_floats/forced_break_and_page_floats.html",
        title: "Forced break and page floats (PR #324)",
      },
      {
        file: "page_floats/defer_page_page_floats_by_anchor.html",
        title: "Defer page page floats by anchor (PR #324)",
      },
      {
        file: "page_floats/defer_region_page_floats_by_anchor.html",
        title: "Defer region page floats by anchor (PR #324)",
      },
      {
        file: "page_floats/defer_column_page_floats_by_anchor.html",
        title: "Defer column page floats by anchor (PR #324)",
      },
      {
        file: "page_floats/fragmented_page_floats.html",
        title: "Fragmented page floats (PR #324)",
      },
      {
        file: "page_floats/multiple_deferred_page_floats.html",
        title: "Multiple deferred page floats (PR #324)",
      },
      {
        file: "page_floats/test_pagefloatlayoutcontext_previous_sibling.html",
        title: "Test PageFloatLayoutContext previous sibling (PR #324)",
      },
      {
        file: "page_floats/floats_deferred_by_larger_floats.html",
        title: "Floats deferred by larger floats (PR #343)",
      },
      {
        file: "page_floats/deferred_floats.html",
        title: "Deferred page floats (PR #343)",
      },
      {
        file: "page_floats/column-span_on_page_floats.html",
        title: "column-span on page floats (PR #322)",
      },
      {
        file: "page_floats/float_snap-block.html",
        title: "float: snap-block (PR #346)",
      },
      {
        file: "page_floats/float_snap-block_2.html",
        title: "float: snap-block (2 values, PR #346)",
      },
      {
        file: "page_floats/clear_page_floats.html",
        title: "Clear page floats (PR #347)",
      },
      {
        file: "page_floats/clear_page_floats_vertical.html",
        title: "Clear page floats (vertical writing-mode, PR #347)",
      },
      {
        file: "page_floats/page-float-clear-page.html",
        title: "Page float with clear: page (Issue #2010)",
      },
      {
        file: "page_floats/column-float-clear-column.html",
        title: "Column float with clear: column (Issue #2010)",
      },
      {
        file: "page_floats/column-float-clear-page.html",
        title: "Column float with clear: page (Issue #2010)",
      },
      {
        file: "page_floats/clear_on_page_floats.html",
        title: "clear on page floats (PR #378)",
      },
      {
        file: "page_floats/text_around_fragmented_page_floats.html",
        title: "Forbid text around fragmented page floats (PR #379)",
      },
      {
        file: "page_floats/page_floats_and_break_avoid.html",
        title: "Page floats and break-*: avoid (PR #382)",
      },
      {
        file: "page_floats/float-min-wrap-block.html",
        title: "float-min-wrap-block (PR #382)",
      },
      {
        file: "page_floats/float-min-wrap-block_vertical.html",
        title: "float-min-wrap-block (vertical writing-mode, PR #382)",
      },
      {
        file: "page_floats/target-counter-and-page-floats.html",
        title: "Target-counter and Page Floats",
      },
      {
        file: "page_floats/page-float-in-page-float.html",
        title: "Page float in page float (Issue #1675)",
      },
      {
        file: "page_floats/page-float-spacing.html",
        title:
          "Page float padding, border, and margin-bottom cases (Issue #1752)",
      },
      {
        file: "page_floats/page-float-spacing.html",
        title:
          "Page float padding, border, and margin-bottom cases with fontSize=18 (Issue #1752)",
        options: "&fontSize=18",
      },
    ],
  },
  {
    category: "Footnotes",
    files: [
      {
        file: "footnotes/footnotes_widows_bug.html",
        title: "Footnotes widows bug (PR #328)",
      },
      {
        file: "footnotes/footnote-in-footnote.html",
        title: "Footnote in footnote (Issue #1352)",
      },
      {
        file: "footnotes/footnotes_and_page_floats.html",
        title: "Footnotes and page floats (PR #343)",
      },
      {
        file: "footnotes/clear-after-footnote.html",
        title: "Clear after footnote (Issue #1987)",
      },
      {
        file: "footnotes/footnote_with_pseudoelement.html",
        title: "Footnote with pseudoelement (PR #345)",
      },
      {
        file: "footnotes/footnote-policy.html",
        title: "footnote-policy (PR #353)",
      },
      {
        file: "footnotes/footnote-policy-line-fragmentation.html",
        title: "footnote-policy: line fragmentation (Issue #1899)",
      },
      {
        file: "footnotes/footnote-policy-line-break.html",
        title: "footnote-policy: line break before anchor line (Issue #2006)",
      },
      {
        file: "footnotes/footnote-policy-line-break-vertical.html",
        title:
          "footnote-policy: line break before anchor line (vertical writing-mode) (Issue #2006)",
      },
      {
        file: "footnotes/footnote-policy-line-long.html",
        title: "Long footnote with footnote-policy: line (Issue #2029)",
      },
      {
        file: "footnotes/footnote-fragmentation-target-counter.html",
        title:
          "Long footnote fragmentation with target-counter() (Issue #2026)",
      },
      {
        file: "footnotes/named-page-deferred-text.html",
        title: "Named page with deferred text after footnote (Issue #1991)",
      },
      {
        file: "footnotes/named-page-deferred-text-first-child.html",
        title:
          "First-child named page must not revive after deferred text (Issue #1991 regression)",
      },
      {
        file: "footnotes/footnote-area-at-footnote.html",
        title: "Footnote area with @footnote (PR #1644)",
      },
      {
        file: "footnotes/footnote-area-page-overrides-top-level.html",
        title: "@page @footnote overrides top-level @footnote (Issue #1723)",
      },
      {
        file: "footnotes/footnote-before-content.html",
        title: "@footnote ::before content (Issue #1723)",
      },
      {
        file: "footnotes/footnote-text-spacing.html",
        title: "Footnote text-spacing (Issue #868)",
      },
      {
        file: "footnotes/footnote-page-counter-reset.html",
        title: "Footnote and page counter-reset (Issue #421)",
      },
      {
        file: "footnotes/footnote-call-marker-counter-style.html",
        title: "Footnote call/marker counter styles (PR #1707)",
      },
      {
        file: "footnotes/footnote-display.html",
        title: "footnote-display (Issue #1825)",
      },
      {
        file: "footnotes/footnotes-in-table.html",
        title: "Footnotes in table (Issue #438)",
      },
      {
        file: "footnotes/footnotes-in-table-2.html",
        title: "Footnotes in table 2 (Issue #1657)",
      },
      {
        file: "footnotes/footnotes-in-table-rowspan-colspan.html",
        title: "Footnotes in table with rowspan/colspan (Issue #1667)",
      },
      {
        file: "footnotes/footnotes-in-table-avoided-rows.html",
        title:
          "Shared line-policy footnotes in avoided table rows (Issue #2186)",
      },
      {
        file: "footnotes/footnotes-in-table-avoided-short-row.html",
        title:
          "Line-policy footnote constraints in a table that fits (Issue #2186)",
      },
      {
        file: "footnotes/footnotes-in-table-avoided-single-last-row.html",
        title:
          "Single line-policy footnote in an avoided final table row (Issue #2186)",
      },
      {
        file: "footnotes/footnotes-in-table-avoided-both-last-row.html",
        title:
          "All line-policy footnotes in one avoided table row (Issue #2186)",
      },
      {
        file: "footnotes/footnotes-in-multicol.html",
        title: "Footnotes in multi-column (Issue #1460)",
      },
      {
        file: "footnotes/footnotes-in-multicol-vertical.html",
        title:
          "Footnotes in multi-column (vertical writing-mode) (Issue #1460)",
      },
      {
        file: "footnotes/footnote-in-page-float.html",
        title: "Footnotes in page float (Issue #1675)",
      },
      {
        file: "footnotes/footnotes-anywhere.html",
        title: "Footnotes anywhere (Issue #1669)",
      },
      {
        file: "footnotes/dpub-footnotes-target-counter.html",
        title: "DPUB footnotes with target-counter() (Issue #1700)",
      },
      {
        file: "footnotes/dpub-footnote-duplicate-reference.html",
        title:
          "DPUB noteref duplicate reference should not duplicate footnote body (Issue #1767)",
      },
      {
        file: "footnotes/dpub-footnote-duplicate-reference-call-marker.html",
        title:
          "DPUB duplicate reference with ::footnote-call/::footnote-marker (PR #1768)",
      },
      {
        file: "footnotes/dpub-footnote-inherit.html",
        title:
          "DPUB footnote should inherit from source parent, not noteref (Issue #1770)",
      },
      {
        file: "footnotes/dpub-footnote-display.html",
        title: "DPUB footnote-display (Issue #1884)",
      },
      {
        file: "footnotes/dpub-footnote-policy.html",
        title: "DPUB footnote-policy comparison (Issue #1884)",
      },
      {
        file: "footnotes/dpub-footnote-call-marker.html",
        title: "DPUB ::footnote-call/::footnote-marker (Issue #1884)",
      },
      {
        file: "footnotes/dpub-footnote-call-replaces-content.html",
        title: "DPUB ::footnote-call replaces noteref content (PR #1887)",
      },
      {
        file: "footnotes/dpub-footnote-area-before-inherits-font-size.html",
        title:
          "DPUB @footnote ::before inherits @footnote font-size (PR #1887)",
      },
      {
        file: "footnotes/dpub-footnote-call-marker-outside.html",
        title:
          "DPUB ::footnote-marker outside list-style-position (Issue #1884)",
      },
      {
        file: "footnotes/epub-footnotes-static-number.html",
        title: "EPUB footnotes (static numbering, PR #1703)",
      },
      {
        file: "footnotes/epub-footnote-duplicate-reference.xhtml",
        title:
          "EPUB noteref duplicate reference should not duplicate footnote body (Issue #1767)",
      },
      {
        file: "footnotes/default-footnote-pseudo-styles.html",
        title: "Default ::footnote-call/::footnote-marker styles (Issue #1701)",
      },
      {
        file: "footnotes/footnote-marker-outside-style.html",
        title:
          "::footnote-marker with list-style-position: outside (Issue #1702)",
      },
      {
        file: "footnotes/footnote-in-list-item.html",
        title:
          "Footnote in list item should not inherit list marker (Issue #1838)",
      },
      {
        file: "footnotes/footnote-marker-position-inherit-initial.html",
        title:
          "::footnote-marker list-style-position inherit/initial (Issue #1838)",
      },
      {
        file: "footnotes/footnote-fragmentation.html",
        title: "Footnote fragmentation across pages (Issue #1875)",
      },
      {
        file: "footnotes/footnote-fragmentation-inline-anchor.html",
        title: "Footnote fragmentation from inline anchor (PR #1903)",
      },
      {
        file: "footnotes/footnote-fragmentation-multicol.html",
        title: "Footnote fragmentation in multi-column (Issue #1879)",
      },
      {
        file: "footnotes/footnote-fragmentation-multicol-moved-call.html",
        title:
          "Footnote fragmentation in multi-column after moving call (Issue #1891)",
      },
      {
        file: "footnotes/footnote-area-max-height.html",
        title: "Footnote area max-height (Issue #1878)",
      },
      {
        file: "footnotes/footnote-area-max-height-box-sizing.html",
        title: "Footnote area max-height with box-sizing (Issue #1878)",
      },
      {
        file: "footnotes/footnote-area-max-height-vertical.html",
        title: "Footnote area max-block-size vertical (Issue #1878)",
      },
      {
        file: "footnotes/footnote-marker-with-float.html",
        title: "Footnote marker with float:left overflow (Issue #1956)",
      },
    ],
  },
  {
    category: "Repeating elements",
    files: [
      {
        file: "repeating_elements/repeating_element.html",
        title: "repeating elements across fragment (PR #323)",
      },
      {
        file: "repeating_elements/repeating_element_vertical.html",
        title:
          "repeating elements across fragment (vertical writing-mode, PR #323)",
      },
      {
        file: "repeating_elements/nesting.html",
        title: "nesting repeating elements (PR #323)",
      },
      {
        file: "repeating_elements/nesting_vertical.html",
        title: "nesting repeating elements (vertical writing-mode, PR #323)",
      },
      {
        file: "repeating_elements/nesting_table.html",
        title: "nesting table (PR #323)",
      },
      {
        file: "repeating_elements/nesting_table_vertical.html",
        title: "nesting table (vertical writing-mode, PR #323)",
      },
      {
        file: "repeating_elements/repeat-on-break_auto.html",
        title: "repeat-on-break: auto (PR #323)",
      },
      { file: "repeating_elements/flexbox.html", title: "flexbox (PR #323)" },
      {
        file: "repeating_elements/priority_of_dropping.html",
        title: "priority of dropping (PR #323)",
      },
      {
        file: "repeating_elements/repeating_page_floats.html",
        title: "Page floats with repeating elements (PR #323)",
      },
      {
        file: "repeating_elements/repeating_page_floats_vertical.html",
        title:
          "Page floats with repeating elements (vertical writing-mode, PR #323)",
      },
    ],
  },
  {
    category: "nth-fragment selectors",
    files: [
      {
        file: "nth-fragment/nth-fragment_selectors.html",
        title: "nth-fragment selectors (PR #323)",
      },
      {
        file: "nth-fragment/nth-fragment_selectors_with_region_rule.html",
        title: "nth-fragment selectors with region rule (PR #323)",
      },
      {
        file: "nth-fragment/nesting_nth-fragment_selectors.html",
        title: "nesting nth-fragment selectors (PR #323)",
      },
      {
        file: "nth-fragment/nesting_nth-fragment_selectors2.html",
        title: "nesting nth-fragment selectors (2, PR #323)",
      },
      {
        file: "nth-fragment/matching_multiple_elements_in_hierarchy.html",
        title: "matching multiple elements in the hierarchy (PR #342)",
      },
      {
        file: "nth-fragment/sibling_selector.html",
        title: "use nth-fragment with sibling selectors (PR #323)",
      },
      { file: "nth-fragment/table.html", title: "table (PR #342)" },
      { file: "nth-fragment/float.html", title: "page floats (PR #323)" },
    ],
  },
  {
    category: "after-if-continues pseudo-elements",
    files: [
      {
        file: "after_if_continues/after-if-continues.html",
        title:
          "create and insert an after-if-continues pseudo element (PR #348)",
      },
      {
        file: "after_if_continues/after-if-continues_vertical.html",
        title:
          "create and insert an after-if-continues pseudo element (vertical writing-mode, PR #348)",
      },
      {
        file: "after_if_continues/after-if-continues_page_float.html",
        title: "after-if-continues on page_float (PR #348)",
      },
    ],
  },
  {
    category: "device-cmyk() function",
    files: [
      {
        file: "device-cmyk/test.html",
        title: "device-cmyk() function (PR #1627)",
      },
    ],
  },
];
