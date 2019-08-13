/**
 * Copyright 2013 Google, Inc.
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
 * @fileoverview UserAgentPageCss - UA page style definitions.
 */
export default `\
@namespace html "http://www.w3.org/1999/xhtml";
@namespace fb2 "http://www.gribuser.ru/xml/fictionbook/2.0";

html|body, fb2|body {
  hyphens: -epubx-expr(pref-hyphenate?"auto":"manual");
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
