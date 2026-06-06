module.exports = [
  {
    category: "Start page",
    files: [{ file: "", title: "Vivliostyle Viewer start page" }],
  },
  {
    category: "General",
    files: [
      { file: "counter_in_running.html", title: "Counter in running element" },
      { file: "print_media/index.html", title: "Print media" },
      {
        file: "vivliostyle_media/index.html",
        title: "'vivliostyle' vs 'screen' media",
      },
      {
        file: "running_header_adaptive.html",
        title: "Running header emulation with Adaptive Layout",
      },
      {
        file: "eal-generated-text-properties.html",
        title: "EAL generated text properties (Issue #1968)",
      },
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
      { file: "case_sensitivity/html.html", title: "HTML case sensitivity" },
      { file: "ruby-broken-pagination.html", title: "Ruby broken pagination" },
      {
        file: "css-parse-error/gradient-background-image.html",
        title: "Gradient background-image",
      },
      { file: "rem_in_page_margin.html", title: "rem in page margin" },
      {
        file: "root-font-var-calc.html",
        title: "rem/rlh with font shorthand var() calc() (Issue #1955)",
      },
      {
        file: "web_font_in_page_margin.html",
        title: "Web font in page margin",
      },
      { file: "crop-marks.html", title: "Printer marks" },
      { file: "empty_page.html", title: "Empty page" },
      {
        file: "case_sensitivity/attribute-selectors.xhtml",
        title: "Attribute selector case sensitivity (Issue #1972)",
      },
      {
        file: ["multiple_html/first.html", "multiple_html/second.html"],
        title: "Multiple HTML files",
      },
      { file: "absolute_positioning.html", title: "Absolute positioning" },
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
        title: "Relative positioning pagination",
      },
      {
        file: "relative_positioning_columns.html",
        title: "Relative positioning columns",
      },
      { file: "flex_and_large_img.html", title: "Flex box pagination" },
      {
        file: "unbreakable_box.html",
        title: "Unbreakable box at the end of a flow",
      },
      { file: "outline.html", title: "Outline" },
      { file: "font-feature-settings.html", title: "Font feature settings" },
      {
        file: "font-variation-settings.html",
        title: "font-variation-settings in @font-face",
      },
      { file: "background-gradient.html", title: "Background gradient" },
      {
        file: "incorrect_layout_with_empty_partition.html",
        title: "Incorrect layout with empty partition",
      },
      {
        file: "partition-overlap.html",
        title:
          "Partition overlap affects non-overlapping partition (Issue #1171)",
      },
      { file: "math-sample.html", title: "MathJax" },
      { file: "background-shorthand.html", title: "Background shorthand" },
      { file: "prefixed_properties.html", title: "Prefixed properties" },
      { file: "filter_property.html", title: "Filter property" },
      { file: "attr-type.html", title: "Typed attr() values (Issue #1485)" },
      { file: "content-attr.html", title: "Content attr()" },
      {
        file: "exclusion_with_printer_marks.html",
        title: "Exclusion with printer marks",
      },
      { file: "box-decoration-break.html", title: "box-decoration-break" },
      { file: "image-resolution.html", title: "image-resolution" },
      { file: "target_blank_link.html", title: "target=_blank links" },
      {
        file: "rem_in_relpos.html",
        title: "rem in position: relative element",
      },
      { file: "svg_properties.html", title: "SVG properties" },
      { file: "font_property.html", title: "Font property" },
      { file: "justification.html", title: "Justification" },
      {
        file: "justification_vertical.html",
        title: "Justification (vertical writing-mode)",
      },
      { file: "compositing.html", title: "Compositing and Blending" },
      { file: "content-url-element.html", title: "Content URL" },
      {
        file: "picture-element.html",
        title: "picture element with source media (Issue #1089)",
      },
      {
        file: "content-in-page-margin-box.html",
        title: "Content in page margin box",
      },
      {
        file: "page-margin-box-images.html",
        title: "Page margin box images (Issue #1867)",
      },
      {
        file: "counters-function-in-page-margin-box.html",
        title: "counters() in page margin boxes",
      },
      { file: "flowchunk_overflow_bug.html", title: "Flowchunk overflow bug" },
      { file: "pages_counter.html", title: "pages counter" },
      { file: "getRangeBoxes_bug.html", title: "getRangeBoxes bug" },
      { file: "viewport_unit.html", title: "viewport-percentage units" },
      {
        file: "viewport_unit_vertical.html",
        title: "viewport-percentage units (vertical writing-mode)",
      },
      {
        file: "page_viewport_unit.html",
        title: "page viewport-percentage units with calc()",
      },
      { file: "link-to-viewer.html", title: "Link to Vivliostyle Viewer" },
      {
        file: "print_media/styles-in-body.html",
        title: "Style elements in the body elements",
      },
      {
        file: "lists-attributes.html",
        title: "Attributes on list elements",
        options: "&bookMode=true",
      },
      {
        file: "z-index-at-page.html",
        title: "z-index on @page and page-margin boxes",
      },
      {
        file: "z-index-at-page-bare-text.html",
        title:
          "z-index on @page and page-margin boxes (bare text after float, Issue #1786)",
      },
      {
        file: "inset-shorthand.html",
        title: "inset shorthand property",
      },
      {
        file: "lh-rlh-units.html",
        title: "lh and rlh units",
      },
      {
        file: "margin-break.html",
        title: "margin-break property",
      },
      {
        file: "border-width-test.html",
        title: "border-width test",
      },
      {
        file: "initial-letter.html",
        title: "initial-letter property",
      },
      { file: "all-shorthand.html", title: "all shorthand property" },
      { file: "env-doc-title.html", title: "env(doc-title) function" },
    ],
  },
  {
    category: "Selectors",
    files: [
      { file: "attr_selectors.html", title: "Attribute selectors" },
      { file: "selector_bug.html", title: "Selector bug" },
      { file: "nth_selectors.html", title: "nth selectors" },
      { file: "empty_selector.html", title: "empty selector" },
      { file: "ui_state_selectors.html", title: "UI state selectors" },
      { file: "not-pseudo-selector.html", title: ":not pseudo selector" },
      { file: "nth-child-of.html", title: ":nth-child(An+B of S) selector" },
    ],
  },
  {
    category: "CSS Nesting",
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
    category: "Spread inside/outside properties",
    files: [
      {
        file: "spread-inside-outside/spread-inside-outside.html",
        title: "Spread inside/outside properties",
      },
      {
        file: "spread-inside-outside/float-inside-outside.html",
        title: "Float inside/outside values",
      },
      {
        file: "spread-inside-outside/page-float-inside-outside.html",
        title: "Page float inside/outside values",
      },
    ],
  },
  {
    category: "Cross-references",
    files: [
      { file: "target-counter.html", title: "target-counter" },
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
        title: "target-counter() with default page type",
      },
      {
        file: "target-counter-named-page-style.html",
        title: "target-counter() named page style (Issue #1966)",
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
        title: "target-counter() with nested :nth(1 of page type)",
      },
      {
        file: "target-counter-missing-page.html",
        title: "target-counter() missing page (Issue #1498)",
      },
      { file: "target-text.html", title: "target-text() - Basic Tests" },
      {
        file: "target-text-running-element.html",
        title: "target-text() in Running Elements",
      },
      {
        file: [
          "target-text-multiple/first.html",
          "target-text-multiple/second.html",
          "target-text-multiple/third.html",
        ],
        title: "target-text() - Cross-Document References",
      },
      {
        file: "target-text-reflow-navigation/publication.json",
        title:
          "target-text() reflow across WebPub spine navigation (Issue #1856)",
      },
      {
        file: "target-text-vs-named-strings.html",
        title: "target-text() vs Named Strings",
      },
      {
        file: "target-text-vs-named-strings-2.html",
        title: "target-text() vs Named Strings - first-letter with punctuation",
      },
      {
        file: "target-text-vs-named-strings-3.html",
        title: "target-text() vs Named Strings - with ::before",
      },
      {
        file: "target-text-vs-named-strings-4.html",
        title: "target-text() vs Named Strings - with ::before and ::after",
      },
    ],
  },
  {
    category: "Leader",
    files: [
      { file: "leader/content-leader.html", title: "content: leader()" },
      {
        file: "leader/content-leader-rtl.html",
        title: "content: leader() in RTL direction",
      },
      {
        file: "leader/toc-leader.html",
        title: "Table of Contents with leader()",
      },
      {
        file: "leader/toc-leader-vertical.html",
        title: "Table of Contents with leader() in vertical writing-mode",
      },
      {
        file: "leader/inline-siblings.html",
        title: "leader() with inline sibling elements",
      },
      {
        file: "leader/inline-siblings-vertical.html",
        title: "leader() with inline sibling elements (Vertical)",
      },
      {
        file: "leader/inline-siblings-before-after.html",
        title: "leader() with ::before and ::after pseudo-elements",
      },
      {
        file: "leader/inline-siblings-before-after-vertical.html",
        title: "leader() with ::before and ::after pseudo-elements (Vertical)",
      },
      {
        file: "leader/long-content.html",
        title: "leader() with long content",
      },
      {
        file: "leader/long-content-vertical.html",
        title: "leader() with long content (Vertical)",
      },
      {
        file: "leader/multi-column-balance.html",
        title: "leader() in multi-column with column-fill: balance",
      },
      {
        file: "leader/multi-column-balance-on-body.html",
        title: "leader() in multi-column on body with column-fill: balance",
      },
    ],
  },
  {
    category: "Counter style and list-style",
    files: [
      {
        file: "counter-style/test.html",
        title: "@counter-style rule",
      },
      {
        file: "counter-style/list-style-type-counter-style.html",
        title: "list-style-type with @counter-style",
      },
      {
        file: "counter-style/marker.html",
        title: "::marker pseudo-element",
      },
      {
        file: "counter-style/marker-block-child.html",
        title: "::marker with block child in list item (Issue #1831)",
      },
      {
        file: "counter-style/marker-empty-li.html",
        title: "::marker on empty list items",
      },
      {
        file: "counter-style/list-style-position.html",
        title: "list-style-position",
      },
      {
        file: "counter-style/list-style-position-super.html",
        title:
          "Outside marker alignment with superscript content (Issue #1780)",
      },
      {
        file: "counter-style/list-style-type-bullet.html",
        title: "list-style-type bullet marker",
      },
      {
        file: "counter-style/list-style-type-bullet-vertical.html",
        title: "list-style-type bullet marker (vertical writing-mode)",
      },
      {
        file: "counter-style/list-item-text-spacing.html",
        title: "List-item with text-spacing (Issue #1763)",
      },
    ],
  },
  {
    category: "Text Spacing",
    files: [
      {
        file: "text-spacing/text-spacing-ja.html",
        title: "Text Spacing (Japanese)",
      },
      {
        file: "text-spacing/text-spacing-zh-hans.html",
        title: "Text Spacing (Chinese, Simplified)",
      },
      {
        file: "text-spacing/text-spacing-zh-hant.html",
        title: "Text Spacing (Chinese, Traditional)",
      },
      {
        file: "text-spacing/ts-generated-content.html",
        title: "Text-spacing on generated content",
      },
      {
        file: "text-spacing/ts-generated-content-vertical.html",
        title: "Text-spacing on generated content (vertical writing-mode)",
      },
      {
        file: "text-spacing/text-spacing-trim-start-code.html",
        title: "text-spacing-trim after code element (Issue #1863)",
      },
    ],
  },
  {
    category: "Hanging Punctuation",
    files: [
      {
        file: "text-spacing/hanging-punctuation.html",
        title: "Hanging Punctuation",
      },
      {
        file: "text-spacing/ts-hp-allow-force-end.html",
        title: "Text-spacing & hanging-punctuation allow/force-end",
      },
      {
        file: "text-spacing/hanging-punctuation-first-indent-ja.html",
        title: "hanging-punctuation:first with text-indent (Japanese)",
      },
    ],
  },
  {
    category: "Blank page selector",
    files: [
      {
        file: "blank-page/blank-page.html",
        title: "Blank page selector",
      },
    ],
  },
  {
    category: "Nth page selector",
    files: [
      {
        file: "nth-page/nth-page.html",
        title: "nth() page selector",
      },
      {
        file: "nth-page/nth-page-counter-reset.html",
        title: "nth() page selector & page counter reset",
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
        title: "nth() page selector & page counter reset in multiple documents",
      },
      {
        file: "nth-page/nth-of-page.html",
        title: ":nth(An+B of C) page selector",
      },
    ],
  },
  {
    category: "Named Pages",
    files: [
      {
        file: "named-pages/named-pages.html",
        title: "Named Pages",
      },
      {
        file: "named-pages/page-groups.html",
        title: "Page Groups",
      },
      {
        file: "named-pages/page-groups-spread-breaks.html",
        title: "Page Groups with spread breaks",
      },
      {
        file: [
          "named-pages/page-groups-concat-blank-first.html",
          "named-pages/page-groups-concat-blank-second.html",
        ],
        title: "Page Groups across concatenated docs with boundary blank page",
      },
      {
        file: "named-pages/page-child-element.html",
        title: "Named Page on Child Element with Running Element (Issue #1833)",
      },
      {
        file: "named-pages/page-child-first-page.html",
        title: "Named Page on Child Element at Page Start",
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
        title: "Nested named page with :nth(1 of page type)",
      },
    ],
  },
  {
    category: "Named Strings",
    files: [
      {
        file: "named-strings/named-strings.html",
        title: "Named strings - string() function",
      },
      {
        file: "named-strings/string-set-content.html",
        title: "string-set with content() function",
      },
      {
        file: "named-strings/string-set-attr.html",
        title: "string-set with attr() function",
      },
      {
        file: "named-strings/string-set-counter-page.html",
        title: "string-set with counter(page) (Issue #1997)",
      },
    ],
  },
  {
    category: "Running Elements",
    files: [
      {
        file: "running-elements/running-elements.html",
        title: "Running Elements - running() and element() functions",
      },
      {
        file: "running-elements/page-margin-boxes.html",
        title: "Page Margin Boxes",
      },
    ],
  },
  {
    category: "Page breaks",
    files: [
      {
        file: "page_breaks/break-inside_values.html",
        title: "break-inside values",
      },
      { file: "page_breaks/break_values.html", title: "break values" },
      {
        file: "page_breaks/truncate_margin_at_breaks.html",
        title: "Truncate margin at breaks",
      },
      {
        file: "page_breaks/combine_breaks.html",
        title: "Combine forced break values",
      },
      {
        file: "page_breaks/combine_breaks_2.html",
        title: "Combine break value regressions (Issue #1842)",
      },
      {
        file: "page_breaks/break_left_right.html",
        title: "break-before/after: left/right",
      },
      {
        file: "page_breaks/page_break_between_flow_elements.html",
        title: "Page break between flow elements",
      },
      {
        file: "page_breaks/break_on_pseudo_of_flow_elements.html",
        title: "Break on pseudoelements of flow elements",
      },
      {
        file: "page_breaks/page_break_bug_with_exclusions.html",
        title: "Page break bug with exclusions (on Firefox)",
      },
      {
        file: "page_breaks/page_break_bug_in_vertical_text.html",
        title: "Page break bug in vertical text (on Firefox)",
      },
      {
        file: "page_breaks/class_C_break_point.html",
        title: "Class C break point",
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
    ],
  },
  {
    category: "Print",
    files: [
      {
        file: "print/chrome_page_top_margin_bug.html",
        title: "Chrome page top margin bug",
      },
    ],
  },
  {
    category: "Multi-column",
    files: [
      {
        file: "multi-column/column-fill_balance.html",
        title: "column-fill: balance",
      },
      {
        file: "multi-column/column-fill_balance_vertical.html",
        title: "column-fill: balance (vertical writing-mode)",
      },
      {
        file: "multi-column/column-fill_balance-all.html",
        title: "column-fill: balance-all",
      },
      {
        file: "multi-column/column-fill_balance-all_vertical.html",
        title: "column-fill: balance-all (vertical writing-mode)",
      },
      {
        file: "multi-column/mixed-multicol.html",
        title: "Mixed multi-column layout test",
      },
      {
        file: "multi-column/mixed-multicol-with-floats.html",
        title: "Mixed multi-column layout with floats",
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
      { file: "table/table_at_flow_root.html", title: "Table at flow root" },
      { file: "table/table_col_width.html", title: "Table column width" },
      {
        file: "table/table_col_width_vertical.html",
        title: "Table column width (vertical writing-mode)",
      },
      { file: "table/table_rowspan.html", title: "Table rowspan" },
      {
        file: "table/table_rowspan_vertical.html",
        title: "Table rowspan (vertical writing-mode)",
      },
      { file: "table/table_colspan.html", title: "Table colspan" },
      {
        file: "table/table_colspan_vertical.html",
        title: "Table colspan (vertical writing-mode)",
      },
      {
        file: "table/table_vertical_align.html",
        title: "Table vertical-align",
      },
      {
        file: "table/table_vertical_align_vertical.html",
        title: "Table vertical-align (vertical writing-mode)",
      },
      {
        file: "table/table_repeating_header_footer.html",
        title: "Table repeating header/footer",
      },
      {
        file: "table/table_repeating_header_footer_vertical.html",
        title: "Table repeating header/footer (vertical writing-mode)",
      },
      { file: "table/break_after_table.html", title: "Break after table" },
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
    ],
  },
  {
    category: "Float and Clear",
    files: [
      { file: "float-bug-test.html", title: "Float bug test" },
      { file: "left-float-bug.html", title: "Float bug test: Left float" },
      {
        file: "white-space_clear.html",
        title: "Combination of white-space and clear",
      },
      { file: "clear-bug-test.html", title: "Float clear bug" },
      { file: "float-text-offset-bug.html", title: "Float text offset bug" },
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
      { file: "relative_floats.html", title: "Floats with position: relative" },
      {
        file: "float-in-relative-bug.html",
        title: "Float in position:relative bug",
      },
    ],
  },
  {
    category: "Page floats",
    files: [
      {
        file: "page_floats/page_page_floats.html",
        title: "'Page' page floats",
      },
      {
        file: "page_floats/page_page_floats_2.html",
        title: "'Page' page floats (2 values)",
      },
      {
        file: "page_floats/page_page_floats_vertical.html",
        title: "'Page' page floats (vertical writing-mode)",
      },
      {
        file: "page_floats/page_page_floats_vertical_2.html",
        title: "'Page' page floats (vertical writing-mode, 2 values)",
      },
      {
        file: "page_floats/region_page_floats.html",
        title: "'Region' page floats",
      },
      {
        file: "page_floats/region_page_floats_vertical.html",
        title: "'Region' page floats (vertical writing-mode)",
      },
      {
        file: "page_floats/column_page_floats.html",
        title: "'Column' page floats",
      },
      {
        file: "page_floats/column_page_floats_2.html",
        title: "'Column' page floats (2 values)",
      },
      {
        file: "page_floats/column_page_floats_vertical.html",
        title: "'Column' page floats (vertical writing-mode)",
      },
      {
        file: "page_floats/column_page_floats_vertical_2.html",
        title: "'Column' page floats (vertical writing-mode, 2 values)",
      },
      {
        file: "page_floats/region_page_floats_with_exclusions.html",
        title: "'Region' page floats with exclusions",
      },
      {
        file: "page_floats/region_page_floats_with_exclusions_vertical.html",
        title: "'Region' page floats with exclusions (vertical writing-mode)",
      },
      {
        file: "page_floats/column_page_floats_with_exclusions.html",
        title: "'Column' page floats with exclusions",
      },
      {
        file: "page_floats/column_page_floats_with_exclusions_vertical.html",
        title: "'Column' page floats with exclusions (vertical writing-mode)",
      },
      {
        file: "page_floats/multiple_kind_of_page_floats.html",
        title: "Multiple kind of page floats",
      },
      {
        file: "page_floats/multiple_kind_of_page_floats_vertical.html",
        title: "Multiple kind of page floats (vertical writing-mode)",
      },
      {
        file: "page_floats/column_region_page_floats.html",
        title: "'Column' and 'region' page floats in single column",
      },
      {
        file: "page_floats/inline_page_floats.html",
        title: "Inline page floats",
      },
      {
        file: "page_floats/inline_page_floats_2.html",
        title: "Inline page floats (2 values)",
      },
      {
        file: "page_floats/inline_page_floats_vertical.html",
        title: "Inline page floats (vertical writing-mode)",
      },
      {
        file: "page_floats/inline_page_floats_vertical_2.html",
        title: "Inline page floats (vertical writing-mode, 2 values)",
      },
      {
        file: "page_floats/forced_break_and_page_floats.html",
        title: "Forced break and page floats",
      },
      {
        file: "page_floats/defer_page_page_floats_by_anchor.html",
        title: "Defer page page floats by anchor",
      },
      {
        file: "page_floats/defer_region_page_floats_by_anchor.html",
        title: "Defer region page floats by anchor",
      },
      {
        file: "page_floats/defer_column_page_floats_by_anchor.html",
        title: "Defer column page floats by anchor",
      },
      {
        file: "page_floats/fragmented_page_floats.html",
        title: "Fragmented page floats",
      },
      {
        file: "page_floats/multiple_deferred_page_floats.html",
        title: "Multiple deferred page floats",
      },
      {
        file: "page_floats/test_pagefloatlayoutcontext_previous_sibling.html",
        title: "Test PageFloatLayoutContext previous sibling",
      },
      {
        file: "page_floats/floats_deferred_by_larger_floats.html",
        title: "Floats deferred by larger floats",
      },
      {
        file: "page_floats/deferred_floats.html",
        title: "Deferred page floats",
      },
      {
        file: "page_floats/column-span_on_page_floats.html",
        title: "column-span on page floats",
      },
      { file: "page_floats/float_snap-block.html", title: "float: snap-block" },
      {
        file: "page_floats/float_snap-block_2.html",
        title: "float: snap-block (2 values)",
      },
      {
        file: "page_floats/clear_page_floats.html",
        title: "Clear page floats",
      },
      {
        file: "page_floats/clear_page_floats_vertical.html",
        title: "Clear page floats (vertical writing-mode)",
      },
      {
        file: "page_floats/clear_on_page_floats.html",
        title: "clear on page floats",
      },
      {
        file: "page_floats/text_around_fragmented_page_floats.html",
        title: "Forbid text around fragmented page floats",
      },
      {
        file: "page_floats/page_floats_and_break_avoid.html",
        title: "Page floats and break-*: avoid",
      },
      {
        file: "page_floats/float-min-wrap-block.html",
        title: "float-min-wrap-block",
      },
      {
        file: "page_floats/float-min-wrap-block_vertical.html",
        title: "float-min-wrap-block (vertical writing-mode)",
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
        title: "Footnotes widows bug",
      },
      {
        file: "footnotes/footnote-in-footnote.html",
        title: "Footnote in footnote (Issue #1352)",
      },
      {
        file: "footnotes/footnotes_and_page_floats.html",
        title: "Footnotes and page floats",
      },
      {
        file: "footnotes/clear-after-footnote.html",
        title: "Clear after footnote (Issue #1987)",
      },
      {
        file: "footnotes/footnote_with_pseudoelement.html",
        title: "Footnote with pseudoelement",
      },
      { file: "footnotes/footnote-policy.html", title: "footnote-policy" },
      {
        file: "footnotes/footnote-policy-line-fragmentation.html",
        title: "footnote-policy: line fragmentation (Issue #1899)",
      },
      {
        file: "footnotes/named-page-deferred-text.html",
        title: "Named page with deferred text after footnote (Issue #1991)",
      },
      {
        file: "footnotes/footnote-area-at-footnote.html",
        title: "Footnote area with @footnote",
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
        title: "Footnote call/marker counter styles",
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
          "DPUB duplicate reference with ::footnote-call/::footnote-marker",
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
        title: "DPUB ::footnote-call replaces noteref content",
      },
      {
        file: "footnotes/dpub-footnote-area-before-inherits-font-size.html",
        title: "DPUB @footnote ::before inherits @footnote font-size",
      },
      {
        file: "footnotes/dpub-footnote-call-marker-outside.html",
        title:
          "DPUB ::footnote-marker outside list-style-position (Issue #1884)",
      },
      {
        file: "footnotes/epub-footnotes-static-number.html",
        title: "EPUB footnotes (static numbering)",
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
        title: "Footnote fragmentation from inline anchor",
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
    category: "Repeating Elements",
    files: [
      {
        file: "repeating_elements/repeating_element.html",
        title: "repeating elements across fragment",
      },
      {
        file: "repeating_elements/repeating_element_vertical.html",
        title: "repeating elements across fragment (vertical writing-mode)",
      },
      {
        file: "repeating_elements/nesting.html",
        title: "nesting repeating elements",
      },
      {
        file: "repeating_elements/nesting_vertical.html",
        title: "nesting repeating elements (vertical writing-mode)",
      },
      { file: "repeating_elements/nesting_table.html", title: "nesting table" },
      {
        file: "repeating_elements/nesting_table_vertical.html",
        title: "nesting table (vertical writing-mode)",
      },
      {
        file: "repeating_elements/repeat-on-break_auto.html",
        title: "repeat-on-break: auto",
      },
      { file: "repeating_elements/flexbox.html", title: "flexbox" },
      {
        file: "repeating_elements/priority_of_dropping.html",
        title: "priority of dropping",
      },
      {
        file: "repeating_elements/repeating_page_floats.html",
        title: "Page floats with repeating elements",
      },
      {
        file: "repeating_elements/repeating_page_floats_vertical.html",
        title: "Page floats with repeating elements (vertical writing-mode)",
      },
    ],
  },
  {
    category: "nth-fragment selectors",
    files: [
      {
        file: "nth-fragment/nth-fragment_selectors.html",
        title: "nth-fragment selectors",
      },
      {
        file: "nth-fragment/nth-fragment_selectors_with_region_rule.html",
        title: "nth-fragment selectors with region rule",
      },
      {
        file: "nth-fragment/nesting_nth-fragment_selectors.html",
        title: "nesting nth-fragment selectors",
      },
      {
        file: "nth-fragment/nesting_nth-fragment_selectors2.html",
        title: "nesting nth-fragment selectors (2)",
      },
      {
        file: "nth-fragment/matching_multiple_elements_in_hierarchy.html",
        title: "matching multiple elements in the hierarchy",
      },
      {
        file: "nth-fragment/sibling_selector.html",
        title: "use nth-fragment with sibling selectors",
      },
      { file: "nth-fragment/table.html", title: "table" },
      { file: "nth-fragment/float.html", title: "page floats" },
    ],
  },
  {
    category: "after-if-continues pseudo elements",
    files: [
      {
        file: "after_if_continues/after-if-continues.html",
        title: "create and insert an after-if-continues pseudo element",
      },
      {
        file: "after_if_continues/after-if-continues_vertical.html",
        title:
          "create and insert an after-if-continues pseudo element (vertical writing-mode)",
      },
      {
        file: "after_if_continues/after-if-continues_page_float.html",
        title: "after-if-continues on page_float",
      },
    ],
  },
  {
    category: "device-cmyk() function",
    files: [
      {
        file: "device-cmyk/test.html",
        title: "device-cmyk() function",
      },
    ],
  },
];
