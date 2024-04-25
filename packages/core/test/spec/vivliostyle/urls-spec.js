/**
 * Copyright 2017 Daishinsha Inc.
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
 */

import * as vivliostyle_urls from "../../../src/vivliostyle/urls";

describe("urls", function () {
  var module = vivliostyle_urls;
  var transformer = {
    transformURL: function (m1, baaseUrl) {
      return baaseUrl + "|" + m1 + "|";
    },
  };

  describe("transformURIs", function () {
    it("transform all urls in the attribute value.", function () {
      expect(
        module.transformURIs(
          'URL( "http://foo.com/test/?x=#bar" ),' +
            "url( #test ), " +
            "uRL('#test?x=\"') url other text",
          "aaa",
          transformer,
        ),
      ).toEqual(
        'url("aaa|http://foo.com/test/?x=#bar|" ),url(aaa|#test| ), url(\'aaa|#test?x="|\') url other text',
      );
    });
    it("transform all urls with url-modifier.", function () {
      expect(
        module.transformURIs(
          'URL( "http://foo.com/test/?x=#bar" test modifiers ),' +
            "url( #test rgb(100, 200, 50 ) test ), " +
            "uRL('#test?x=\"' calc(50% - 2em)) url other text",
          "aaa",
          transformer,
        ),
      ).toEqual(
        'url("aaa|http://foo.com/test/?x=#bar|" test modifiers ),url(aaa|#test| rgb(100, 200, 50 ) test ), url(\'aaa|#test?x="|\' calc(50% - 2em)) url other text',
      );
    });
    it("transform all urls with escape.", function () {
      expect(
        module.transformURIs(
          'URL( "aa\\"\\\'\\2F\\27 \\22  \\\r\\\nbb" \\"\\\'\\2F\\27 \\22  \\\r\\\n),' +
            "url( aa\\\"\\'\\2F\\27 \\22  \\\r\\\nbb ), " +
            "uRL('aa\\\"\\'\\2F\\27 \\22  \\\r\\\nbb' calc(50% - 2em)) url other text",
          "aaa",
          transformer,
        ),
      ).toEqual(
        "url(\"aaa|aa\\\"\\'\\2F\\27 \\22  \\\r\\\nbb|\" \\\"\\'\\2F\\27 \\22  \\\r\\\n),url(aaa|aa\\\"\\'\\2F\\27 \\22  \\\r\\\nbb| ), url('aaa|aa\\\"\\'\\2F\\27 \\22  \\\r\\\nbb|' calc(50% - 2em)) url other text",
      );
    });
  });
});
