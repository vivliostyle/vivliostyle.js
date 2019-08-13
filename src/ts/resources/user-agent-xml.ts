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
 * @fileoverview UserAgentXml - UA special style definitions.
 */
export default `\
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
</html>
`;
