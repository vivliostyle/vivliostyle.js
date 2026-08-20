/**
 * Copyright 2017 Daishinsha Inc.
 * Copyright 2026 Vivliostyle Foundation
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

import * as adapt_css from "../../../src/vivliostyle/css";
import * as adapt_csscasc from "../../../src/vivliostyle/css-cascade";
import * as adapt_cssvalid from "../../../src/vivliostyle/css-validator";
import * as adapt_exprs from "../../../src/vivliostyle/exprs";
import * as adapt_cssparse from "../../../src/vivliostyle/css-parser";
import * as adapt_csstok from "../../../src/vivliostyle/css-tokenizer";
import * as adapt_task from "../../../src/vivliostyle/task";
import * as vivliostyle_plugin from "../../../src/vivliostyle/plugin";
import * as vivliostyle_test_util_mock_plugin from "../../util/mock/vivliostyle/plugin-mock";

describe("css-cascade", function () {
  function cascadeParserHandler(scope, validatorSet) {
    const dispatchHandler = new adapt_cssparse.DispatchParserHandler(
      scope,
      (owner) =>
        new adapt_csscasc.CascadeParserHandler(
          scope,
          owner,
          null,
          null,
          null,
          validatorSet,
          null,
        ),
    );
    return dispatchHandler.initialSlave;
  }

  describe("IsNthSiblingAction", function () {
    it("when a=0, matches if currentSiblingOrder=b", function () {
      var action = new adapt_csscasc.IsNthSiblingAction(0, 3);
      var chained = jasmine.createSpyObj("chained", ["apply"]);
      var wired = action.wire(chained);

      wired.apply({ instance: { currentSiblingOrder: 1 } });
      expect(chained.apply).not.toHaveBeenCalled();

      wired.apply({ instance: { currentSiblingOrder: 3 } });
      expect(chained.apply).toHaveBeenCalled();
    });

    it("when a is non-zero, matches if non-negative n which satisfies currentSiblingOrder=an+b exists", function () {
      var action = new adapt_csscasc.IsNthSiblingAction(3, 0);
      var chained = jasmine.createSpyObj("chained", ["apply"]);
      var wired = action.wire(chained);

      wired.apply({ instance: { currentSiblingOrder: 1 } });
      expect(chained.apply).not.toHaveBeenCalled();

      wired.apply({ instance: { currentSiblingOrder: 2 } });
      expect(chained.apply).not.toHaveBeenCalled();

      wired.apply({ instance: { currentSiblingOrder: 3 } });
      expect(chained.apply).toHaveBeenCalled();

      chained = jasmine.createSpyObj("chained", ["apply"]);
      wired = action.wire(chained);

      wired.apply({ instance: { currentSiblingOrder: 4 } });
      expect(chained.apply).not.toHaveBeenCalled();

      wired.apply({ instance: { currentSiblingOrder: 5 } });
      expect(chained.apply).not.toHaveBeenCalled();

      wired.apply({ instance: { currentSiblingOrder: 6 } });
      expect(chained.apply).toHaveBeenCalled();

      action = new adapt_csscasc.IsNthSiblingAction(2, 3);
      chained = jasmine.createSpyObj("chained", ["apply"]);
      wired = action.wire(chained);

      wired.apply({ instance: { currentSiblingOrder: 1 } });
      expect(chained.apply).not.toHaveBeenCalled();

      wired.apply({ instance: { currentSiblingOrder: 2 } });
      expect(chained.apply).not.toHaveBeenCalled();

      wired.apply({ instance: { currentSiblingOrder: 3 } });
      expect(chained.apply).toHaveBeenCalled();

      chained = jasmine.createSpyObj("chained", ["apply"]);
      wired = action.wire(chained);

      wired.apply({ instance: { currentSiblingOrder: 4 } });
      expect(chained.apply).not.toHaveBeenCalled();

      wired.apply({ instance: { currentSiblingOrder: 5 } });
      expect(chained.apply).toHaveBeenCalled();

      chained = jasmine.createSpyObj("chained", ["apply"]);
      wired = action.wire(chained);

      wired.apply({ instance: { currentSiblingOrder: 6 } });
      expect(chained.apply).not.toHaveBeenCalled();

      wired.apply({ instance: { currentSiblingOrder: 7 } });
      expect(chained.apply).toHaveBeenCalled();

      action = new adapt_csscasc.IsNthSiblingAction(-3, 0);
      chained = jasmine.createSpyObj("chained", ["apply"]);
      wired = action.wire(chained);

      wired.apply({ instance: { currentSiblingOrder: 1 } });
      expect(chained.apply).not.toHaveBeenCalled();

      wired.apply({ instance: { currentSiblingOrder: 2 } });
      expect(chained.apply).not.toHaveBeenCalled();

      wired.apply({ instance: { currentSiblingOrder: 3 } });
      expect(chained.apply).not.toHaveBeenCalled();

      action = new adapt_csscasc.IsNthSiblingAction(-2, 5);
      chained = jasmine.createSpyObj("chained", ["apply"]);
      wired = action.wire(chained);

      wired.apply({ instance: { currentSiblingOrder: 1 } });
      expect(chained.apply).toHaveBeenCalled();

      chained = jasmine.createSpyObj("chained", ["apply"]);
      wired = action.wire(chained);

      wired.apply({ instance: { currentSiblingOrder: 2 } });
      expect(chained.apply).not.toHaveBeenCalled();

      wired.apply({ instance: { currentSiblingOrder: 3 } });
      expect(chained.apply).toHaveBeenCalled();

      chained = jasmine.createSpyObj("chained", ["apply"]);
      wired = action.wire(chained);

      wired.apply({ instance: { currentSiblingOrder: 4 } });
      expect(chained.apply).not.toHaveBeenCalled();

      wired.apply({ instance: { currentSiblingOrder: 5 } });
      expect(chained.apply).toHaveBeenCalled();

      chained = jasmine.createSpyObj("chained", ["apply"]);
      wired = action.wire(chained);

      wired.apply({ instance: { currentSiblingOrder: 6 } });
      expect(chained.apply).not.toHaveBeenCalled();

      wired.apply({ instance: { currentSiblingOrder: 7 } });
      expect(chained.apply).not.toHaveBeenCalled();
    });
  });

  describe("IsNthSiblingOfTypeAction", function () {
    function dummyCascadeInstance(counts, namespaceURI) {
      var ns = namespaceURI === undefined ? "foo" : namespaceURI;
      var element = { namespaceURI: ns, localName: "bar" };
      var currentSiblingTypeCounts = { byNamespace: {}, noNamespace: null };
      if (ns === null) {
        currentSiblingTypeCounts.noNamespace = counts;
      } else {
        currentSiblingTypeCounts.byNamespace[ns] = counts;
      }
      return {
        instance: {
          currentSiblingTypeCounts: currentSiblingTypeCounts,
          currentNamespace: element.namespaceURI,
          currentLocalName: element.localName,
        },
      };
    }

    it("when a=0, matches if currentSiblingTypeCounts[namespace][locaName]=b", function () {
      var action = new adapt_csscasc.IsNthSiblingOfTypeAction(0, 3);
      var chained = jasmine.createSpyObj("chained", ["apply"]);
      var wired = action.wire(chained);

      wired.apply(dummyCascadeInstance({ bar: 1, baz: 3 }));
      expect(chained.apply).not.toHaveBeenCalled();

      wired.apply(dummyCascadeInstance({ bar: 3, baz: 3 }));
      expect(chained.apply).toHaveBeenCalled();
    });

    it("when a is non-zero, matches if non-negative n which satisfies currentSiblingTypeCounts[namespace][locaName]=an+b exists", function () {
      var action = new adapt_csscasc.IsNthSiblingOfTypeAction(3, 0);
      var chained = jasmine.createSpyObj("chained", ["apply"]);
      var wired = action.wire(chained);

      wired.apply(dummyCascadeInstance({ bar: 1, baz: 3 }));
      expect(chained.apply).not.toHaveBeenCalled();

      wired.apply(dummyCascadeInstance({ bar: 2, baz: 3 }));
      expect(chained.apply).not.toHaveBeenCalled();

      wired.apply(dummyCascadeInstance({ bar: 3, baz: 1 }));
      expect(chained.apply).toHaveBeenCalled();

      chained = jasmine.createSpyObj("chained", ["apply"]);
      wired = action.wire(chained);

      wired.apply(dummyCascadeInstance({ bar: 4, baz: 3 }));
      expect(chained.apply).not.toHaveBeenCalled();

      wired.apply(dummyCascadeInstance({ bar: 5, baz: 3 }));
      expect(chained.apply).not.toHaveBeenCalled();

      wired.apply(dummyCascadeInstance({ bar: 6, baz: 1 }));
      expect(chained.apply).toHaveBeenCalled();

      action = new adapt_csscasc.IsNthSiblingOfTypeAction(2, 3);
      chained = jasmine.createSpyObj("chained", ["apply"]);
      wired = action.wire(chained);

      wired.apply(dummyCascadeInstance({ bar: 1, baz: 3 }));
      expect(chained.apply).not.toHaveBeenCalled();

      wired.apply(dummyCascadeInstance({ bar: 2, baz: 3 }));
      expect(chained.apply).not.toHaveBeenCalled();

      wired.apply(dummyCascadeInstance({ bar: 3, baz: 1 }));
      expect(chained.apply).toHaveBeenCalled();

      chained = jasmine.createSpyObj("chained", ["apply"]);
      wired = action.wire(chained);

      wired.apply(dummyCascadeInstance({ bar: 4, baz: 3 }));
      expect(chained.apply).not.toHaveBeenCalled();

      wired.apply(dummyCascadeInstance({ bar: 5, baz: 1 }));
      expect(chained.apply).toHaveBeenCalled();

      chained = jasmine.createSpyObj("chained", ["apply"]);
      wired = action.wire(chained);

      wired.apply(dummyCascadeInstance({ bar: 6, baz: 3 }));
      expect(chained.apply).not.toHaveBeenCalled();

      wired.apply(dummyCascadeInstance({ bar: 7, baz: 3 }));
      expect(chained.apply).toHaveBeenCalled();

      action = new adapt_csscasc.IsNthSiblingOfTypeAction(-3, 0);
      chained = jasmine.createSpyObj("chained", ["apply"]);
      wired = action.wire(chained);

      wired.apply(dummyCascadeInstance({ bar: 1, baz: 3 }));
      expect(chained.apply).not.toHaveBeenCalled();

      wired.apply(dummyCascadeInstance({ bar: 2, baz: 3 }));
      expect(chained.apply).not.toHaveBeenCalled();

      wired.apply(dummyCascadeInstance({ bar: 3, baz: 3 }));
      expect(chained.apply).not.toHaveBeenCalled();

      action = new adapt_csscasc.IsNthSiblingOfTypeAction(-2, 5);
      chained = jasmine.createSpyObj("chained", ["apply"]);
      wired = action.wire(chained);

      wired.apply(dummyCascadeInstance({ bar: 1, baz: 2 }));
      expect(chained.apply).toHaveBeenCalled();

      chained = jasmine.createSpyObj("chained", ["apply"]);
      wired = action.wire(chained);

      wired.apply(dummyCascadeInstance({ bar: 2, baz: 1 }));
      expect(chained.apply).not.toHaveBeenCalled();

      wired.apply(dummyCascadeInstance({ bar: 3, baz: 2 }));
      expect(chained.apply).toHaveBeenCalled();

      chained = jasmine.createSpyObj("chained", ["apply"]);
      wired = action.wire(chained);

      wired.apply(dummyCascadeInstance({ bar: 4, baz: 1 }));
      expect(chained.apply).not.toHaveBeenCalled();

      wired.apply(dummyCascadeInstance({ bar: 5, baz: 2 }));
      expect(chained.apply).toHaveBeenCalled();

      chained = jasmine.createSpyObj("chained", ["apply"]);
      wired = action.wire(chained);

      wired.apply(dummyCascadeInstance({ bar: 6, baz: 1 }));
      expect(chained.apply).not.toHaveBeenCalled();

      wired.apply(dummyCascadeInstance({ bar: 7, baz: 1 }));
      expect(chained.apply).not.toHaveBeenCalled();
    });

    it("counts an element without a namespace in the no-namespace slot", function () {
      var action = new adapt_csscasc.IsNthSiblingOfTypeAction(0, 3);
      var chained = jasmine.createSpyObj("chained", ["apply"]);
      var wired = action.wire(chained);

      wired.apply(dummyCascadeInstance({ bar: 1, baz: 3 }, null));
      expect(chained.apply).not.toHaveBeenCalled();

      wired.apply(dummyCascadeInstance({ bar: 3, baz: 3 }, null));
      expect(chained.apply).toHaveBeenCalled();
    });

    it("does not read namespaced counts for an element without a namespace", function () {
      var action = new adapt_csscasc.IsNthSiblingOfTypeAction(0, 3);
      var chained = jasmine.createSpyObj("chained", ["apply"]);
      var wired = action.wire(chained);

      var cascadeInstance = dummyCascadeInstance({ bar: 1 }, null);
      cascadeInstance.instance.currentSiblingTypeCounts.byNamespace["foo"] = {
        bar: 3,
      };
      wired.apply(cascadeInstance);
      expect(chained.apply).not.toHaveBeenCalled();
    });
  });

  describe("IsNthLastSiblingAction", function () {
    function dummyCascadeInstance(count) {
      return {
        instance: {
          currentFollowingSiblingOrder: null,
          currentSiblingOrder: 3,
        },
        currentElement: { parentNode: { childElementCount: count } },
      };
    }

    it("when a=0, matches if currentFollowingSiblingOrder=b", function () {
      var action = new adapt_csscasc.IsNthLastSiblingAction(0, 3);
      var chained = jasmine.createSpyObj("chained", ["apply"]);
      var wired = action.wire(chained);

      var cascadeInstance = dummyCascadeInstance(4);
      wired.apply(cascadeInstance);
      expect(chained.apply).not.toHaveBeenCalled();
      expect(cascadeInstance.instance.currentFollowingSiblingOrder).toBe(2);

      cascadeInstance = dummyCascadeInstance(5);
      wired.apply(cascadeInstance);
      expect(chained.apply).toHaveBeenCalled();
      expect(cascadeInstance.instance.currentFollowingSiblingOrder).toBe(3);
    });

    it("when a is non-zero, matches if non-negative n which satisfies currentFollowingSiblingOrder=an+b exists", function () {
      var action = new adapt_csscasc.IsNthLastSiblingAction(3, 0);
      var chained = jasmine.createSpyObj("chained", ["apply"]);
      var wired = action.wire(chained);

      var cascadeInstance = dummyCascadeInstance(3);
      wired.apply(cascadeInstance);
      expect(chained.apply).not.toHaveBeenCalled();
      expect(cascadeInstance.instance.currentFollowingSiblingOrder).toBe(1);

      cascadeInstance = dummyCascadeInstance(4);
      wired.apply(cascadeInstance);
      expect(chained.apply).not.toHaveBeenCalled();
      expect(cascadeInstance.instance.currentFollowingSiblingOrder).toBe(2);

      cascadeInstance = dummyCascadeInstance(5);
      wired.apply(cascadeInstance);
      expect(chained.apply).toHaveBeenCalled();
      expect(cascadeInstance.instance.currentFollowingSiblingOrder).toBe(3);

      chained = jasmine.createSpyObj("chained", ["apply"]);
      wired = action.wire(chained);

      cascadeInstance = dummyCascadeInstance(6);
      wired.apply(cascadeInstance);
      expect(chained.apply).not.toHaveBeenCalled();
      expect(cascadeInstance.instance.currentFollowingSiblingOrder).toBe(4);

      cascadeInstance = dummyCascadeInstance(7);
      wired.apply(cascadeInstance);
      expect(chained.apply).not.toHaveBeenCalled();
      expect(cascadeInstance.instance.currentFollowingSiblingOrder).toBe(5);

      cascadeInstance = dummyCascadeInstance(8);
      wired.apply(cascadeInstance);
      expect(chained.apply).toHaveBeenCalled();
      expect(cascadeInstance.instance.currentFollowingSiblingOrder).toBe(6);

      action = new adapt_csscasc.IsNthLastSiblingAction(2, 3);
      chained = jasmine.createSpyObj("chained", ["apply"]);
      wired = action.wire(chained);

      cascadeInstance = dummyCascadeInstance(3);
      wired.apply(cascadeInstance);
      expect(chained.apply).not.toHaveBeenCalled();
      expect(cascadeInstance.instance.currentFollowingSiblingOrder).toBe(1);

      cascadeInstance = dummyCascadeInstance(4);
      wired.apply(cascadeInstance);
      expect(chained.apply).not.toHaveBeenCalled();
      expect(cascadeInstance.instance.currentFollowingSiblingOrder).toBe(2);

      cascadeInstance = dummyCascadeInstance(5);
      wired.apply(cascadeInstance);
      expect(chained.apply).toHaveBeenCalled();
      expect(cascadeInstance.instance.currentFollowingSiblingOrder).toBe(3);

      chained = jasmine.createSpyObj("chained", ["apply"]);
      wired = action.wire(chained);

      cascadeInstance = dummyCascadeInstance(6);
      wired.apply(cascadeInstance);
      expect(chained.apply).not.toHaveBeenCalled();
      expect(cascadeInstance.instance.currentFollowingSiblingOrder).toBe(4);

      cascadeInstance = dummyCascadeInstance(7);
      wired.apply(cascadeInstance);
      expect(chained.apply).toHaveBeenCalled();
      expect(cascadeInstance.instance.currentFollowingSiblingOrder).toBe(5);

      chained = jasmine.createSpyObj("chained", ["apply"]);
      wired = action.wire(chained);

      cascadeInstance = dummyCascadeInstance(8);
      wired.apply(cascadeInstance);
      expect(chained.apply).not.toHaveBeenCalled();
      expect(cascadeInstance.instance.currentFollowingSiblingOrder).toBe(6);

      cascadeInstance = dummyCascadeInstance(9);
      wired.apply(cascadeInstance);
      expect(chained.apply).toHaveBeenCalled();
      expect(cascadeInstance.instance.currentFollowingSiblingOrder).toBe(7);

      action = new adapt_csscasc.IsNthLastSiblingAction(-3, 0);
      chained = jasmine.createSpyObj("chained", ["apply"]);
      wired = action.wire(chained);

      cascadeInstance = dummyCascadeInstance(3);
      wired.apply(cascadeInstance);
      expect(chained.apply).not.toHaveBeenCalled();
      expect(cascadeInstance.instance.currentFollowingSiblingOrder).toBe(1);

      cascadeInstance = dummyCascadeInstance(4);
      wired.apply(cascadeInstance);
      expect(chained.apply).not.toHaveBeenCalled();
      expect(cascadeInstance.instance.currentFollowingSiblingOrder).toBe(2);

      cascadeInstance = dummyCascadeInstance(5);
      wired.apply(cascadeInstance);
      expect(chained.apply).not.toHaveBeenCalled();
      expect(cascadeInstance.instance.currentFollowingSiblingOrder).toBe(3);

      action = new adapt_csscasc.IsNthLastSiblingAction(-2, 5);
      chained = jasmine.createSpyObj("chained", ["apply"]);
      wired = action.wire(chained);

      cascadeInstance = dummyCascadeInstance(3);
      wired.apply(cascadeInstance);
      expect(chained.apply).toHaveBeenCalled();
      expect(cascadeInstance.instance.currentFollowingSiblingOrder).toBe(1);

      chained = jasmine.createSpyObj("chained", ["apply"]);
      wired = action.wire(chained);

      cascadeInstance = dummyCascadeInstance(4);
      wired.apply(cascadeInstance);
      expect(chained.apply).not.toHaveBeenCalled();
      expect(cascadeInstance.instance.currentFollowingSiblingOrder).toBe(2);

      cascadeInstance = dummyCascadeInstance(5);
      wired.apply(cascadeInstance);
      expect(chained.apply).toHaveBeenCalled();

      chained = jasmine.createSpyObj("chained", ["apply"]);
      wired = action.wire(chained);
      expect(cascadeInstance.instance.currentFollowingSiblingOrder).toBe(3);

      cascadeInstance = dummyCascadeInstance(6);
      wired.apply(cascadeInstance);
      expect(chained.apply).not.toHaveBeenCalled();
      expect(cascadeInstance.instance.currentFollowingSiblingOrder).toBe(4);

      cascadeInstance = dummyCascadeInstance(7);
      wired.apply(cascadeInstance);
      expect(chained.apply).toHaveBeenCalled();
      expect(cascadeInstance.instance.currentFollowingSiblingOrder).toBe(5);

      chained = jasmine.createSpyObj("chained", ["apply"]);
      wired = action.wire(chained);

      cascadeInstance = dummyCascadeInstance(8);
      wired.apply(cascadeInstance);
      expect(chained.apply).not.toHaveBeenCalled();
      expect(cascadeInstance.instance.currentFollowingSiblingOrder).toBe(6);

      cascadeInstance = dummyCascadeInstance(9);
      wired.apply(cascadeInstance);
      expect(chained.apply).not.toHaveBeenCalled();
      expect(cascadeInstance.instance.currentFollowingSiblingOrder).toBe(7);
    });
  });

  describe("IsNthLastSiblingOfTypeAction", function () {
    function dummyCascadeInstance(counts, namespaceURI) {
      var ns = namespaceURI === undefined ? "foo" : namespaceURI;
      var currentElement = { namespaceURI: ns, localName: "bar" };
      var element = currentElement;
      Object.keys(counts).forEach(function (name) {
        for (var i = counts[name]; i > 0; i--) {
          element = element.nextElementSibling = {
            namespaceURI: currentElement.namespaceURI,
            localName: name,
          };
        }
      });
      return {
        instance: {
          currentFollowingSiblingTypeCounts: {
            byNamespace: {},
            noNamespace: null,
          },
          currentNamespace: currentElement.namespaceURI,
          currentLocalName: currentElement.localName,
        },
        currentElement: currentElement,
      };
    }

    it("when a=0, matches if currentFollowingSiblingTypeCounts[namespace][locaName]=b", function () {
      var action = new adapt_csscasc.IsNthLastSiblingOfTypeAction(0, 3);
      var chained = jasmine.createSpyObj("chained", ["apply"]);
      var wired = action.wire(chained);

      var cascadeInstance = dummyCascadeInstance({ bar: 1, baz: 2 });
      wired.apply(cascadeInstance);
      expect(chained.apply).not.toHaveBeenCalled();
      expect(
        cascadeInstance.instance.currentFollowingSiblingTypeCounts,
      ).toEqual({
        byNamespace: { foo: { bar: 2, baz: 2 } },
        noNamespace: null,
      });

      cascadeInstance = dummyCascadeInstance({ bar: 2, baz: 1 });
      wired.apply(cascadeInstance);
      expect(chained.apply).toHaveBeenCalled();
      expect(
        cascadeInstance.instance.currentFollowingSiblingTypeCounts,
      ).toEqual({
        byNamespace: { foo: { bar: 3, baz: 1 } },
        noNamespace: null,
      });
    });

    it("when a is non-zero, matches if non-negative n which satisfies currentFollowingSiblingTypeCounts[namespace][locaName]=an+b exists", function () {
      var action = new adapt_csscasc.IsNthLastSiblingOfTypeAction(3, 0);
      var chained = jasmine.createSpyObj("chained", ["apply"]);
      var wired = action.wire(chained);

      var cascadeInstance = dummyCascadeInstance({ bar: 0, baz: 2 });
      wired.apply(cascadeInstance);
      expect(chained.apply).not.toHaveBeenCalled();
      expect(
        cascadeInstance.instance.currentFollowingSiblingTypeCounts,
      ).toEqual({
        byNamespace: { foo: { bar: 1, baz: 2 } },
        noNamespace: null,
      });

      cascadeInstance = dummyCascadeInstance({ bar: 1, baz: 2 });
      wired.apply(cascadeInstance);
      expect(chained.apply).not.toHaveBeenCalled();
      expect(
        cascadeInstance.instance.currentFollowingSiblingTypeCounts,
      ).toEqual({
        byNamespace: { foo: { bar: 2, baz: 2 } },
        noNamespace: null,
      });

      cascadeInstance = dummyCascadeInstance({ bar: 2, baz: 1 });
      wired.apply(cascadeInstance);
      expect(chained.apply).toHaveBeenCalled();
      expect(
        cascadeInstance.instance.currentFollowingSiblingTypeCounts,
      ).toEqual({
        byNamespace: { foo: { bar: 3, baz: 1 } },
        noNamespace: null,
      });

      chained = jasmine.createSpyObj("chained", ["apply"]);
      wired = action.wire(chained);

      cascadeInstance = dummyCascadeInstance({ bar: 3, baz: 3 });
      wired.apply(cascadeInstance);
      expect(chained.apply).not.toHaveBeenCalled();
      expect(
        cascadeInstance.instance.currentFollowingSiblingTypeCounts,
      ).toEqual({
        byNamespace: { foo: { bar: 4, baz: 3 } },
        noNamespace: null,
      });

      cascadeInstance = dummyCascadeInstance({ bar: 4, baz: 3 });
      wired.apply(cascadeInstance);
      expect(chained.apply).not.toHaveBeenCalled();
      expect(
        cascadeInstance.instance.currentFollowingSiblingTypeCounts,
      ).toEqual({
        byNamespace: { foo: { bar: 5, baz: 3 } },
        noNamespace: null,
      });

      cascadeInstance = dummyCascadeInstance({ bar: 5, baz: 1 });
      wired.apply(cascadeInstance);
      expect(chained.apply).toHaveBeenCalled();
      expect(
        cascadeInstance.instance.currentFollowingSiblingTypeCounts,
      ).toEqual({
        byNamespace: { foo: { bar: 6, baz: 1 } },
        noNamespace: null,
      });

      action = new adapt_csscasc.IsNthLastSiblingOfTypeAction(2, 3);
      chained = jasmine.createSpyObj("chained", ["apply"]);
      wired = action.wire(chained);

      cascadeInstance = dummyCascadeInstance({ bar: 0, baz: 3 });
      wired.apply(cascadeInstance);
      expect(chained.apply).not.toHaveBeenCalled();
      expect(
        cascadeInstance.instance.currentFollowingSiblingTypeCounts,
      ).toEqual({
        byNamespace: { foo: { bar: 1, baz: 3 } },
        noNamespace: null,
      });

      cascadeInstance = dummyCascadeInstance({ bar: 1, baz: 3 });
      wired.apply(cascadeInstance);
      expect(chained.apply).not.toHaveBeenCalled();
      expect(
        cascadeInstance.instance.currentFollowingSiblingTypeCounts,
      ).toEqual({
        byNamespace: { foo: { bar: 2, baz: 3 } },
        noNamespace: null,
      });

      cascadeInstance = dummyCascadeInstance({ bar: 2, baz: 1 });
      wired.apply(cascadeInstance);
      expect(chained.apply).toHaveBeenCalled();
      expect(
        cascadeInstance.instance.currentFollowingSiblingTypeCounts,
      ).toEqual({
        byNamespace: { foo: { bar: 3, baz: 1 } },
        noNamespace: null,
      });

      chained = jasmine.createSpyObj("chained", ["apply"]);
      wired = action.wire(chained);

      cascadeInstance = dummyCascadeInstance({ bar: 3, baz: 3 });
      wired.apply(cascadeInstance);
      expect(chained.apply).not.toHaveBeenCalled();
      expect(
        cascadeInstance.instance.currentFollowingSiblingTypeCounts,
      ).toEqual({
        byNamespace: { foo: { bar: 4, baz: 3 } },
        noNamespace: null,
      });

      cascadeInstance = dummyCascadeInstance({ bar: 4, baz: 1 });
      wired.apply(cascadeInstance);
      expect(chained.apply).toHaveBeenCalled();
      expect(
        cascadeInstance.instance.currentFollowingSiblingTypeCounts,
      ).toEqual({
        byNamespace: { foo: { bar: 5, baz: 1 } },
        noNamespace: null,
      });

      chained = jasmine.createSpyObj("chained", ["apply"]);
      wired = action.wire(chained);

      cascadeInstance = dummyCascadeInstance({ bar: 5, baz: 3 });
      wired.apply(cascadeInstance);
      expect(chained.apply).not.toHaveBeenCalled();
      expect(
        cascadeInstance.instance.currentFollowingSiblingTypeCounts,
      ).toEqual({
        byNamespace: { foo: { bar: 6, baz: 3 } },
        noNamespace: null,
      });

      cascadeInstance = dummyCascadeInstance({ bar: 6, baz: 3 });
      wired.apply(cascadeInstance);
      expect(chained.apply).toHaveBeenCalled();
      expect(
        cascadeInstance.instance.currentFollowingSiblingTypeCounts,
      ).toEqual({
        byNamespace: { foo: { bar: 7, baz: 3 } },
        noNamespace: null,
      });

      action = new adapt_csscasc.IsNthLastSiblingOfTypeAction(-3, 0);
      chained = jasmine.createSpyObj("chained", ["apply"]);
      wired = action.wire(chained);

      cascadeInstance = dummyCascadeInstance({ bar: 0, baz: 3 });
      wired.apply(cascadeInstance);
      expect(chained.apply).not.toHaveBeenCalled();
      expect(
        cascadeInstance.instance.currentFollowingSiblingTypeCounts,
      ).toEqual({
        byNamespace: { foo: { bar: 1, baz: 3 } },
        noNamespace: null,
      });

      cascadeInstance = dummyCascadeInstance({ bar: 1, baz: 3 });
      wired.apply(cascadeInstance);
      expect(chained.apply).not.toHaveBeenCalled();
      expect(
        cascadeInstance.instance.currentFollowingSiblingTypeCounts,
      ).toEqual({
        byNamespace: { foo: { bar: 2, baz: 3 } },
        noNamespace: null,
      });

      cascadeInstance = dummyCascadeInstance({ bar: 2, baz: 3 });
      wired.apply(cascadeInstance);
      expect(chained.apply).not.toHaveBeenCalled();
      expect(
        cascadeInstance.instance.currentFollowingSiblingTypeCounts,
      ).toEqual({
        byNamespace: { foo: { bar: 3, baz: 3 } },
        noNamespace: null,
      });

      action = new adapt_csscasc.IsNthLastSiblingOfTypeAction(-2, 5);
      chained = jasmine.createSpyObj("chained", ["apply"]);
      wired = action.wire(chained);

      cascadeInstance = dummyCascadeInstance({ bar: 0, baz: 2 });
      wired.apply(cascadeInstance);
      expect(chained.apply).toHaveBeenCalled();
      expect(
        cascadeInstance.instance.currentFollowingSiblingTypeCounts,
      ).toEqual({
        byNamespace: { foo: { bar: 1, baz: 2 } },
        noNamespace: null,
      });

      chained = jasmine.createSpyObj("chained", ["apply"]);
      wired = action.wire(chained);

      cascadeInstance = dummyCascadeInstance({ bar: 1, baz: 1 });
      wired.apply(cascadeInstance);
      expect(chained.apply).not.toHaveBeenCalled();
      expect(
        cascadeInstance.instance.currentFollowingSiblingTypeCounts,
      ).toEqual({
        byNamespace: { foo: { bar: 2, baz: 1 } },
        noNamespace: null,
      });

      cascadeInstance = dummyCascadeInstance({ bar: 2, baz: 2 });
      wired.apply(cascadeInstance);
      expect(chained.apply).toHaveBeenCalled();
      expect(
        cascadeInstance.instance.currentFollowingSiblingTypeCounts,
      ).toEqual({
        byNamespace: { foo: { bar: 3, baz: 2 } },
        noNamespace: null,
      });

      chained = jasmine.createSpyObj("chained", ["apply"]);
      wired = action.wire(chained);

      cascadeInstance = dummyCascadeInstance({ bar: 3, baz: 1 });
      wired.apply(cascadeInstance);
      expect(chained.apply).not.toHaveBeenCalled();
      expect(
        cascadeInstance.instance.currentFollowingSiblingTypeCounts,
      ).toEqual({
        byNamespace: { foo: { bar: 4, baz: 1 } },
        noNamespace: null,
      });

      cascadeInstance = dummyCascadeInstance({ bar: 4, baz: 2 });
      wired.apply(cascadeInstance);
      expect(chained.apply).toHaveBeenCalled();
      expect(
        cascadeInstance.instance.currentFollowingSiblingTypeCounts,
      ).toEqual({
        byNamespace: { foo: { bar: 5, baz: 2 } },
        noNamespace: null,
      });

      chained = jasmine.createSpyObj("chained", ["apply"]);
      wired = action.wire(chained);

      cascadeInstance = dummyCascadeInstance({ bar: 5, baz: 1 });
      wired.apply(cascadeInstance);
      expect(chained.apply).not.toHaveBeenCalled();
      expect(
        cascadeInstance.instance.currentFollowingSiblingTypeCounts,
      ).toEqual({
        byNamespace: { foo: { bar: 6, baz: 1 } },
        noNamespace: null,
      });

      cascadeInstance = dummyCascadeInstance({ bar: 6, baz: 1 });
      wired.apply(cascadeInstance);
      expect(chained.apply).not.toHaveBeenCalled();
      expect(
        cascadeInstance.instance.currentFollowingSiblingTypeCounts,
      ).toEqual({
        byNamespace: { foo: { bar: 7, baz: 1 } },
        noNamespace: null,
      });
    });

    it("fills the no-namespace slot when the element has no namespace", function () {
      var action = new adapt_csscasc.IsNthLastSiblingOfTypeAction(0, 3);
      var chained = jasmine.createSpyObj("chained", ["apply"]);
      var wired = action.wire(chained);

      var cascadeInstance = dummyCascadeInstance({ bar: 1, baz: 2 }, null);
      wired.apply(cascadeInstance);
      expect(chained.apply).not.toHaveBeenCalled();
      expect(
        cascadeInstance.instance.currentFollowingSiblingTypeCounts,
      ).toEqual({
        byNamespace: {},
        noNamespace: { bar: 2, baz: 2 },
      });

      cascadeInstance = dummyCascadeInstance({ bar: 2, baz: 1 }, null);
      wired.apply(cascadeInstance);
      expect(chained.apply).toHaveBeenCalled();
      expect(
        cascadeInstance.instance.currentFollowingSiblingTypeCounts,
      ).toEqual({
        byNamespace: {},
        noNamespace: { bar: 3, baz: 1 },
      });
    });

    it("keeps namespaced and no-namespace siblings in separate slots", function () {
      var currentElement = {
        namespaceURI: "foo",
        localName: "bar",
        nextElementSibling: {
          namespaceURI: null,
          localName: "bar",
          nextElementSibling: {
            namespaceURI: "foo",
            localName: "bar",
            nextElementSibling: null,
          },
        },
      };
      var cascadeInstance = {
        instance: {
          currentFollowingSiblingTypeCounts: {
            byNamespace: {},
            noNamespace: null,
          },
          currentNamespace: currentElement.namespaceURI,
          currentLocalName: currentElement.localName,
        },
        currentElement: currentElement,
      };
      var action = new adapt_csscasc.IsNthLastSiblingOfTypeAction(0, 2);
      var chained = jasmine.createSpyObj("chained", ["apply"]);

      action.wire(chained).apply(cascadeInstance);

      expect(
        cascadeInstance.instance.currentFollowingSiblingTypeCounts,
      ).toEqual({
        byNamespace: { foo: { bar: 2 } },
        noNamespace: { bar: 1 },
      });
      expect(chained.apply).toHaveBeenCalled();
    });
  });

  describe("IsNthSiblingOfSelectorAction", function () {
    function dummyElement(namespaceURI, localName) {
      return {
        namespaceURI: namespaceURI,
        localName: localName,
        previousElementSibling: null,
        getAttribute: function () {
          return null;
        },
      };
    }

    it("probes a sibling without a namespace against the no-namespace counts", function () {
      var first = dummyElement(null, "bar");
      var current = dummyElement(null, "bar");
      current.previousElementSibling = first;
      var instance = {
        currentNamespace: null,
        currentLocalName: "bar",
        currentId: null,
        currentSiblingOrder: 2,
        currentSiblingTypeCounts: {
          byNamespace: {},
          noNamespace: { bar: 2 },
        },
      };
      var cascadeInstance = {
        instance: instance,
        currentStyle: {},
        currentClassNames: [],
        currentEpubTypes: [],
        currentElement: current,
      };
      var action = new adapt_csscasc.IsNthSiblingOfSelectorAction(0, 2, [
        [new adapt_csscasc.IsNthSiblingOfTypeAction(0, 2)],
      ]);
      var chained = jasmine.createSpyObj("chained", ["apply"]);

      action.wire(chained).apply(cascadeInstance);

      // The probe reads the same slot the main walk writes, so no "" bucket
      // is created on the side.
      expect(instance.currentSiblingTypeCounts).toEqual({
        byNamespace: {},
        noNamespace: { bar: 2 },
      });
      expect(chained.apply).toHaveBeenCalled();
      expect(instance.currentNamespace).toBeNull();
      expect(instance.currentLocalName).toBe("bar");
      expect(instance.currentSiblingOrder).toBe(2);
    });

    it("probes a sibling in a window carrying that sibling", function () {
      var first = dummyElement("http://www.w3.org/1999/xhtml", "p");
      first.classList = ["first"];
      var current = dummyElement("http://www.w3.org/1999/xhtml", "p");
      current.previousElementSibling = first;
      var instance = {
        currentNamespace: "http://www.w3.org/1999/xhtml",
        currentLocalName: "p",
        currentId: null,
        currentSiblingOrder: 2,
      };
      var mainStyle = {};
      var mainEpubTypes = ["chapter"];
      var cascadeInstance = {
        instance: instance,
        currentStyle: mainStyle,
        currentClassNames: ["current"],
        currentEpubTypes: mainEpubTypes,
        currentElement: current,
      };
      var seen = [];
      var recorder = new adapt_csscasc.ChainedAction();
      recorder.matches = function (window) {
        seen.push(window);
        return true;
      };
      var action = new adapt_csscasc.IsNthSiblingOfSelectorAction(0, 2, [
        [recorder],
      ]);

      action
        .wire(jasmine.createSpyObj("chained", ["apply"]))
        .apply(cascadeInstance);

      expect(seen.length).toBe(2);
      var probe = seen[1];
      expect(probe.currentElement).toBe(first);
      expect(probe.currentClassNames).toEqual(["first"]);
      expect(probe.currentStyle).toBe(mainStyle);
      expect(probe.currentEpubTypes).toBe(mainEpubTypes);
      expect(probe.instance).toBe(instance);
    });
  });

  describe("AfterPseudoelementItem", function () {
    it("processes the after props against the style captured for its element", function () {
      var afterprop = { content: "after content" };
      var element = { localName: "p" };
      var elementStyle = { display: "block" };
      var item = new adapt_csscasc.AfterPseudoelementItem(
        afterprop,
        element,
        elementStyle,
      );
      var cascadeInstance = jasmine.createSpyObj("cascadeInstance", [
        "processPseudoelementProps",
      ]);

      expect(item.pop(cascadeInstance, 0)).toBe(true);

      expect(cascadeInstance.processPseudoelementProps).toHaveBeenCalledWith(
        afterprop,
        element,
        elementStyle,
      );
    });
  });

  describe("IsEmptyAction", function () {
    function dummyCascadeInstance(children) {
      if (children) {
        var node = children[0];
        for (var i = 1; i < children.length; i++) {
          node = node.nextSibling = children[i];
        }
      }
      return { currentElement: { firstChild: children ? children[0] : null } };
    }

    var action = new adapt_csscasc.IsEmptyAction();
    var chained;
    var wired;

    beforeEach(function () {
      chained = jasmine.createSpyObj("chained", ["apply"]);
      wired = action.wire(chained);
    });

    it("applies if the element has no children", function () {
      wired.apply(dummyCascadeInstance(null));
      expect(chained.apply).toHaveBeenCalled();
    });

    it("applies if the element has only comment nodes or empty text nodes (length=0) as its children", function () {
      wired.apply(
        dummyCascadeInstance([
          { nodeType: Node.COMMENT_NODE, length: 10 },
          { nodeType: Node.TEXT_NODE, length: 0 },
        ]),
      );
      expect(chained.apply).toHaveBeenCalled();
    });

    it("not applies if the element has an element child", function () {
      wired.apply(dummyCascadeInstance([{ nodeType: Node.ELEMENT_NODE }]));
      expect(chained.apply).not.toHaveBeenCalled();
    });

    it("not applies if the element has a non-empty text node as a child", function () {
      wired.apply(
        dummyCascadeInstance([{ nodeType: Node.TEXT_NODE, length: 1 }]),
      );
      expect(chained.apply).not.toHaveBeenCalled();
    });
  });

  describe("IsEnabledAction", function () {
    var action = new adapt_csscasc.IsEnabledAction();
    var chained;
    var wired;

    beforeEach(function () {
      chained = jasmine.createSpyObj("chained", ["apply"]);
      wired = action.wire(chained);
    });

    it("applies if the element's 'disabled' property is false (not undefined)", function () {
      wired.apply({ currentElement: { disabled: false } });
      expect(chained.apply).toHaveBeenCalled();
    });

    it("not applies if the element's 'disabled' property is true", function () {
      wired.apply({ currentElement: { disabled: true } });
      expect(chained.apply).not.toHaveBeenCalled();
    });

    it("not applies if the element does not have 'disabled' property", function () {
      wired.apply({ currentElement: {} });
      expect(chained.apply).not.toHaveBeenCalled();
    });
  });

  describe("IsDisabledAction", function () {
    var action = new adapt_csscasc.IsDisabledAction();
    var chained;
    var wired;

    beforeEach(function () {
      chained = jasmine.createSpyObj("chained", ["apply"]);
      wired = action.wire(chained);
    });

    it("applies if the element's 'disabled' property is true", function () {
      wired.apply({ currentElement: { disabled: true } });
      expect(chained.apply).toHaveBeenCalled();
    });

    it("not applies if the element's 'disabled' property is false (not undefined)", function () {
      wired.apply({ currentElement: { disabled: false } });
      expect(chained.apply).not.toHaveBeenCalled();
    });

    it("not applies if the element does not have 'disabled' property", function () {
      wired.apply({ currentElement: {} });
      expect(chained.apply).not.toHaveBeenCalled();
    });
  });

  describe("IsCheckedAction", function () {
    var action = new adapt_csscasc.IsCheckedAction();
    var chained;
    var wired;

    beforeEach(function () {
      chained = jasmine.createSpyObj("chained", ["apply"]);
      wired = action.wire(chained);
    });

    it("applies if the element's 'selected' property is true", function () {
      wired.apply({ currentElement: { selected: true } });
      expect(chained.apply).toHaveBeenCalled();
    });

    it("applies if the element's 'checked' property is true", function () {
      wired.apply({ currentElement: { checked: true } });
      expect(chained.apply).toHaveBeenCalled();
    });

    it("not applies if the element's 'selected' property is false (not undefined)", function () {
      wired.apply({ currentElement: { selected: false } });
      expect(chained.apply).not.toHaveBeenCalled();
    });

    it("not applies if the element's 'checked' property is false (not undefined)", function () {
      wired.apply({ currentElement: { checked: false } });
      expect(chained.apply).not.toHaveBeenCalled();
    });

    it("not applies if the element does not have 'selected' nor 'checked' property", function () {
      wired.apply({ currentElement: {} });
      expect(chained.apply).not.toHaveBeenCalled();
    });
  });

  describe("the selector under parse", function () {
    function parseCascade(cssText, done, callback) {
      var handler = cascadeParserHandler(
        new adapt_exprs.LexicalScope(null),
        adapt_cssvalid.baseValidatorSet(),
      );
      parseCascade.handler = handler;
      handler.owner.startStylesheet(adapt_cssparse.StylesheetFlavor.AUTHOR);
      adapt_task.start(function () {
        adapt_cssparse
          .parseStylesheetFromText(cssText, handler.owner, null, null, null)
          .then(function (parsed) {
            expect(parsed).toBe(true);
            callback(handler.finish());
            done();
          });
        return adapt_task.newResult(true);
      });
    }

    describe("a syntax error inside the argument", function () {
      it("fails a list whose only alternative was voided", function (done) {
        parseCascade("div:is(!!!) { color: red }", done, function (cascade) {
          var action = cascade.tags["div"];
          expect(action).toEqual(
            jasmine.any(adapt_csscasc.WiredConditionScope),
          );
          expect(action.condition.condition).toBe("");
        });
      });

      it("drops the voided alternative and keeps the rest", function (done) {
        parseCascade(
          "div:is(!!!, .x) { color: red }",
          done,
          function (cascade) {
            expect(cascade.tags["div"]).toBeUndefined();
            expect(cascade.tags["*"].condition.firstActions.length).toBe(1);
          },
        );
      });

      it("voids :nth-child(An+B of S) whose alternative was voided", function (done) {
        // Selectors Level 4 gives S a <complex-real-selector-list>.
        parseCascade(
          "div:nth-child(2n of !!!, .x) { color: red }",
          done,
          function (cascade) {
            expect(Object.keys(cascade.tags)).toEqual([]);
          },
        );
      });

      it("voids :has() whose alternative was voided", function (done) {
        // Selectors Level 4 gives `:has()` a <relative-selector-list>.
        parseCascade(
          "div:has(# p, q) { color: red }",
          done,
          function (cascade) {
            expect(Object.keys(cascade.tags)).toEqual([]);
          },
        );
      });

      it("drops a voided unforgiving list from the forgiving list around it", function (done) {
        parseCascade(
          "div:is(:has(.x, # p), .z) span { color: red }",
          done,
          function (cascade) {
            expect(cascade.tags["*"].condition.firstActions.length).toBe(1);
          },
        );
      });

      it("takes the alternative the parser rebuilds after recovering", function (done) {
        parseCascade(
          "div:is(!!!}p, .x) { color: red }",
          done,
          function (cascade) {
            expect(cascade.tags["*"].condition.firstActions.length).toBe(2);
          },
        );
      });

      it("voids the rule when an unforgiving list is voided", function (done) {
        // A style rule takes a selector list that is not forgiving either, so
        // the selectors after the comma go with it.
        parseCascade(
          "x:not(u|y, .c d, z) { color: red }",
          done,
          function (cascade) {
            expect(Object.keys(cascade.tags)).toEqual([]);
            expect(Object.keys(cascade.classes)).toEqual([]);
          },
        );
      });

      it("voids the selectors that precede the invalid one", function (done) {
        parseCascade(
          "a, b:has(# p), c { color: red } e { color: blue }",
          done,
          function (cascade) {
            expect(Object.keys(cascade.tags)).toEqual(["e"]);
          },
        );
      });

      it("emits nothing for a combinator in a voided alternative", function (done) {
        // The condition a combinator registers is read by the rest of that
        // alternative, which is dropped.
        parseCascade(
          "div:is(# p q, .x) { color: red }",
          done,
          function (cascade) {
            expect(cascade.tags["*"].condition.firstActions.length).toBe(1);
          },
        );
      });

      it("leaves the specificity of a voided alternative out of the list", function (done) {
        // Selectors 4 computes the specificity of a forgiving list from the
        // alternatives it keeps.
        parseCascade(
          "div:is(# #i, .x) { color: red }",
          done,
          function (cascade) {
            expect(cascade.tags["*"].chained.chained.specificity).toBe(257);
          },
        );
      });

      it("keeps a pseudo-element of a voided alternative out of the enclosing selector", function (done) {
        // Recording a pseudo-element does not touch the selector under parse,
        // so the parser reaches `::before` with the alternative already voided.
        parseCascade(
          "div:is(.x, # ::before) span { color: red }",
          done,
          function (cascade) {
            expect(cascade.tags["span"]).toEqual(
              jasmine.any(adapt_csscasc.WiredConditionScope),
            );
            expect(cascade.tags["span"].chained).toEqual(
              jasmine.any(adapt_csscasc.ApplyRuleAction),
            );
          },
        );
      });

      it("leaves the specificity of a pseudo-element in a voided alternative out of the list", function (done) {
        parseCascade(
          "div:is(*, # ::before) { color: red }",
          done,
          function (cascade) {
            expect(cascade.tags["div"].chained.specificity).toBe(1);
          },
        );
      });

      it("keeps the view condition of the voided selector out of the next rule", function (done) {
        parseCascade(
          "p::nth-fragment(2n+1):not(# a) { color: red } q { color: blue }",
          done,
          function (cascade) {
            expect(cascade.tags["q"].viewConditionId).toBeNull();
          },
        );
      });

      it("drops a rule whose selector never finished", function (done) {
        // The rule never reaches its body, so nothing it built is taken.
        parseCascade(
          "div:is(!!!}p>{}) span { color: red }",
          done,
          function (cascade) {
            expect(Object.keys(cascade.tags)).toEqual([]);
          },
        );
      });
    });

    describe("a pseudo-element inside the argument", function () {
      it("drops the alternative from a forgiving list", function (done) {
        parseCascade(
          "div:is(.x, ::before) span { color: red }",
          done,
          function (cascade) {
            expect(cascade.tags["*"].condition.firstActions.length).toBe(1);
            expect(cascade.tags["span"]).toEqual(
              jasmine.any(adapt_csscasc.WiredConditionScope),
            );
          },
        );
      });

      it("voids the rule when the list is not forgiving", function (done) {
        parseCascade(
          "div:not(.x, ::before) span { color: red }",
          done,
          function (cascade) {
            expect(Object.keys(cascade.tags)).toEqual([]);
          },
        );
      });

      it("matches nothing when it was the only alternative", function (done) {
        parseCascade(
          "div:is(::before) span { color: red }",
          done,
          function (cascade) {
            expect(cascade.tags["div"].condition.condition).toBe("");
          },
        );
      });

      it("keeps a pseudo-element outside such a list", function (done) {
        parseCascade(
          "div:is(.x) ::before { color: red }",
          done,
          function (cascade) {
            var applied = cascade.tags["*"].list[1].chained;
            expect(applied.pseudoelement).toBe("before");
          },
        );
      });
    });

    describe("an unknown pseudo-class", function () {
      it("voids the rule", function (done) {
        parseCascade(
          "p:unknown-pseudo, div { color: red }",
          done,
          function (cascade) {
            expect(Object.keys(cascade.tags)).toEqual([]);
          },
        );
      });

      it("keeps the rules that follow", function (done) {
        parseCascade(
          "p:unknown-pseudo { color: red } div { color: blue }",
          done,
          function (cascade) {
            expect(Object.keys(cascade.tags)).toEqual(["div"]);
          },
        );
      });

      it("keeps the view condition of the voided selector out of the next rule", function (done) {
        parseCascade(
          "p::nth-fragment(2n+1):unknown-pseudo { color: red } q { color: blue }",
          done,
          function (cascade) {
            expect(cascade.tags["q"].viewConditionId).toBeNull();
          },
        );
      });

      it("drops only the alternative inside a forgiving list", function (done) {
        parseCascade(
          "div:is(.x, :unknown-pseudo) span { color: red }",
          done,
          function (cascade) {
            expect(cascade.tags["*"].condition.firstActions.length).toBe(1);
            expect(cascade.tags["span"]).toEqual(
              jasmine.any(adapt_csscasc.WiredConditionScope),
            );
          },
        );
      });
    });

    describe("a pseudo-class in the wrong form", function () {
      it("voids the rule for the functional form of a plain pseudo-class", function (done) {
        parseCascade(
          "p:empty(x) { color: red } q { color: blue }",
          done,
          function (cascade) {
            expect(Object.keys(cascade.tags)).toEqual(["q"]);
          },
        );
      });

      it("voids the rule for the functional form of :link", function (done) {
        parseCascade(
          "a:link(x) { color: red } q { color: blue }",
          done,
          function (cascade) {
            expect(Object.keys(cascade.tags)).toEqual(["q"]);
          },
        );
      });

      [
        "dir",
        "href-epub-type",
        "href-role-type",
        "lang",
        "nth-child",
        "nth-last-child",
        "nth-last-of-type",
        "nth-of-type",
      ].forEach(function (name) {
        it("voids the rule for a bare :" + name, function (done) {
          parseCascade(
            "p:" + name + " { color: red } q { color: blue }",
            done,
            function (cascade) {
              expect(Object.keys(cascade.tags)).toEqual(["q"]);
            },
          );
        });
      });

      it("voids the selectors around a bare href-epub-type", function (done) {
        parseCascade(
          "a:href-epub-type, q { color: red } r { color: blue }",
          done,
          function (cascade) {
            expect(Object.keys(cascade.tags)).toEqual(["r"]);
          },
        );
      });

      it("keeps the view condition out of the next rule when the void comes first", function (done) {
        parseCascade(
          "p:lang::nth-fragment(2n+1) { color: red } q { color: blue }",
          done,
          function (cascade) {
            expect(Object.keys(cascade.tags)).toEqual(["q"]);
            expect(cascade.tags["q"].viewConditionId).toBeNull();
          },
        );
      });

      it("does not delegate a pseudo-class only because the browser supports it", function (done) {
        expect(CSS.supports("selector(:focus-visible)")).toBe(true);
        parseCascade(
          "p:focus-visible { color: red } q { color: blue }",
          done,
          function (cascade) {
            expect(Object.keys(cascade.tags)).toEqual(["q"]);
          },
        );
      });
    });

    describe("a pseudo-element name case", function () {
      it("takes a pseudo-element name case-insensitively", function (done) {
        parseCascade("p:BEFORE, h1 { color: red }", done, function (cascade) {
          expect(Object.keys(cascade.tags)).toEqual(["p", "h1"]);
          expect(cascade.tags["p"].pseudoelement).toBe("before");
        });
      });

      it("takes a functional pseudo-element name case-insensitively", function (done) {
        parseCascade(
          "p::NTH-FRAGMENT(2n+1) { color: red } q { color: blue }",
          done,
          function (cascade) {
            expect(Object.keys(cascade.tags)).toEqual(["p", "q"]);
            expect(cascade.tags["p"].viewConditionId).toBe("NFS_2_1");
          },
        );
      });

      it("voids the rule for the functional form of a pseudo-element alias", function (done) {
        parseCascade(
          "p:before(x) { color: red } q { color: blue }",
          done,
          function (cascade) {
            expect(Object.keys(cascade.tags)).toEqual(["q"]);
          },
        );
      });
    });

    describe(":any-link", function () {
      it("matches as :link does", function (done) {
        parseCascade(":any-link { color: red }", done, function (cascade) {
          expect(Object.keys(cascade.tags)).toEqual(["a"]);
          expect(cascade.tags["a"].condition).toEqual(
            jasmine.any(adapt_csscasc.CheckAttributePresentAction),
          );
          expect(cascade.tags["a"].condition.ns).toBe("");
          expect(cascade.tags["a"].condition.name).toBe("href");
          expect(cascade.tags["a"].chained.specificity).toBe(256);
        });
      });

      it("keeps the source text :has() takes for :any-link", function (done) {
        parseCascade(
          "div:has(:any-link) { color: red }",
          done,
          function (cascade) {
            var action = cascade.tags["div"].condition;
            expect(action).toEqual(
              jasmine.any(adapt_csscasc.MatchesRelationalAction),
            );
            expect(action.selectorTexts).toEqual([":any-link"]);
          },
        );
      });

      it("voids the rule for the functional form", function (done) {
        parseCascade(
          ":any-link(x) { color: red } q { color: blue }",
          done,
          function (cascade) {
            expect(Object.keys(cascade.tags)).toEqual(["q"]);
          },
        );
      });
    });

    describe(":dir()", function () {
      it("compiles to a directionality check", function (done) {
        parseCascade("p:dir(rtl) { color: red }", done, function (cascade) {
          expect(cascade.tags["p"]).toEqual(
            jasmine.any(adapt_csscasc.WiredGuard),
          );
          expect(cascade.tags["p"].condition).toEqual(
            jasmine.any(adapt_csscasc.MatchesNativeSelectorAction),
          );
          expect(cascade.tags["p"].condition.selector).toBe(":dir(rtl)");
          expect(cascade.tags["p"].chained.specificity).toBe(257);
        });
      });

      it("takes the name and the argument case-insensitively", function (done) {
        parseCascade(
          "p:DIR(RTL) { color: red } q { color: blue }",
          done,
          function (cascade) {
            expect(Object.keys(cascade.tags)).toEqual(["p", "q"]);
            expect(cascade.tags["p"].condition.selector).toBe(":dir(rtl)");
          },
        );
      });

      it("matches nothing for an identifier other than ltr and rtl", function (done) {
        parseCascade(
          "p:dir(foo) { color: red } q { color: blue }",
          done,
          function (cascade) {
            expect(Object.keys(cascade.tags)).toEqual(["p", "q"]);
            expect(cascade.tags["p"]).toEqual(
              jasmine.any(adapt_csscasc.WiredConditionScope),
            );
            expect(cascade.tags["p"].condition.condition).toBe("");
            expect(cascade.tags["p"].chained.specificity).toBe(257);
          },
        );
      });

      it("voids the rule when the argument is missing", function (done) {
        parseCascade(
          "p:dir() { color: red } q { color: blue }",
          done,
          function (cascade) {
            expect(Object.keys(cascade.tags)).toEqual(["q"]);
          },
        );
      });

      it("voids the rule when the argument is not a single identifier", function (done) {
        parseCascade(
          "p:dir(ltr rtl) { color: red } q { color: blue }",
          done,
          function (cascade) {
            expect(Object.keys(cascade.tags)).toEqual(["q"]);
          },
        );
      });

      it("voids the rule when the argument is a string", function (done) {
        parseCascade(
          'p:dir("ltr") { color: red } q { color: blue }',
          done,
          function (cascade) {
            expect(Object.keys(cascade.tags)).toEqual(["q"]);
          },
        );
      });

      it("voids the rule when used without an argument list", function (done) {
        parseCascade(
          "p:dir { color: red } q { color: blue }",
          done,
          function (cascade) {
            expect(Object.keys(cascade.tags)).toEqual(["q"]);
          },
        );
      });

      it("voids only the enclosing rule inside :not()", function (done) {
        parseCascade(
          "p:not(:dir()) { color: red } q { color: blue }",
          done,
          function (cascade) {
            expect(Object.keys(cascade.tags)).toEqual(["q"]);
          },
        );
      });

      it("drops only the alternative from a forgiving list", function (done) {
        parseCascade(
          "div:is(:dir(), .x) span { color: red }",
          done,
          function (cascade) {
            expect(cascade.tags["*"].condition.firstActions.length).toBe(1);
            expect(cascade.tags["span"]).toBeDefined();
          },
        );
      });

      it("keeps the selectors after the comma when the only alternative is voided", function (done) {
        parseCascade(
          "p:is(:dir()), q { color: red }",
          done,
          function (cascade) {
            expect(Object.keys(cascade.tags)).toEqual(["p", "q"]);
            expect(cascade.tags["p"].condition.condition).toBe("");
          },
        );
      });

      it("drops only the alternative when the void starts two lists deep", function (done) {
        parseCascade(
          "div:is(:not(:dir()), .x) span { color: red }",
          done,
          function (cascade) {
            expect(cascade.tags["*"].condition.firstActions.length).toBe(1);
            expect(cascade.tags["span"]).toBeDefined();
          },
        );
      });

      it("voids the selectors before and after when :has() holds it", function (done) {
        parseCascade(
          "a, b:has(:dir()), c { color: red } e { color: blue }",
          done,
          function (cascade) {
            expect(Object.keys(cascade.tags)).toEqual(["e"]);
          },
        );
      });

      it("balances nested parentheses in an invalid argument", function (done) {
        parseCascade(
          "div:is(:dir(a(b)), .x) span { color: red }",
          done,
          function (cascade) {
            expect(cascade.tags["*"].condition.firstActions.length).toBe(1);
            expect(cascade.tags["span"]).toBeDefined();
          },
        );
      });

      it("keeps the source text of a forgiving list :has() takes", function (done) {
        parseCascade(
          "div:has(:is(:dir())) { color: red }",
          done,
          function (cascade) {
            var action = cascade.tags["div"].condition;
            expect(action).toEqual(
              jasmine.any(adapt_csscasc.MatchesRelationalAction),
            );
            expect(action.selectorTexts).toEqual([":is(:dir())"]);
          },
        );
      });

      it("voids the rule when the of-S list holds it", function (done) {
        parseCascade(
          "li:nth-child(2n of :dir()) { color: red } q { color: blue }",
          done,
          function (cascade) {
            expect(Object.keys(cascade.tags)).toEqual(["q"]);
          },
        );
      });

      it("keeps the selectors after the comma inside :where()", function (done) {
        parseCascade(
          "p:where(:dir()), q { color: red }",
          done,
          function (cascade) {
            expect(Object.keys(cascade.tags)).toEqual(["p", "q"]);
            expect(cascade.tags["p"].condition.condition).toBe("");
          },
        );
      });

      it("keeps the rule inside :not()", function (done) {
        parseCascade(
          ":not(:dir(ltr)) + div { color: red }",
          done,
          function (cascade) {
            expect(cascade.tags["*"].condition).toEqual(
              jasmine.any(adapt_csscasc.MatchesNoneAction),
            );
            expect(
              cascade.tags["*"].condition.firstActions[0].condition,
            ).toEqual(jasmine.any(adapt_csscasc.MatchesNativeSelectorAction));
            expect(cascade.tags["*"].chained).toEqual(
              jasmine.any(adapt_csscasc.ConditionItemAction),
            );
            expect(cascade.tags["div"]).toBeDefined();
          },
        );
      });

      it("keeps the source text of the alternative :has() takes", function (done) {
        parseCascade(
          "div:has(*:dir(ltr)) { color: red }",
          done,
          function (cascade) {
            var action = cascade.tags["div"].condition;
            expect(action).toEqual(
              jasmine.any(adapt_csscasc.MatchesRelationalAction),
            );
            expect(action.selectorTexts).toEqual(["*:dir(ltr)"]);
          },
        );
      });
    });

    describe("without a syntax error", function () {
      it("registers a sibling condition before the chain restarts", function (done) {
        // The condition item is read by the rest of the selector, so it must
        // not be guarded by the condition it sets.
        parseCascade("div + p { color: red }", done, function (cascade) {
          expect(cascade.tags["div"]).toEqual(
            jasmine.any(adapt_csscasc.ConditionItemAction),
          );
        });
      });

      it("registers a following sibling condition before the chain restarts", function (done) {
        parseCascade("div ~ p { color: red }", done, function (cascade) {
          expect(cascade.tags["div"]).toEqual(
            jasmine.any(adapt_csscasc.ConditionItemAction),
          );
        });
      });

      it("keeps the source text of the alternatives :has() takes", function (done) {
        parseCascade("div:has(p, q) { color: red }", done, function (cascade) {
          var action = cascade.tags["div"].condition;
          expect(action).toEqual(
            jasmine.any(adapt_csscasc.MatchesRelationalAction),
          );
          expect(action.selectorTexts).toEqual(["p", " q"]);
        });
      });

      it("takes the alternatives of :nth-last-child(An+B of S)", function (done) {
        parseCascade(
          "div:nth-last-child(2n of .x) { color: red }",
          done,
          function (cascade) {
            var action = cascade.tags["div"].condition;
            expect(action).toEqual(
              jasmine.any(adapt_csscasc.IsNthLastSiblingOfSelectorAction),
            );
            expect(action.firstActions.length).toBe(1);
          },
        );
      });

      it("takes the selector in the order the parser reports it", function (done) {
        // The first action decides which table the rule is indexed under, and
        // the id table is looked up by `currentId` while CheckIdAction also
        // accepts `currentXmlId`.
        parseCascade("#a#b { color: red }", done, function (cascade) {
          expect(Object.keys(cascade.ids)).toEqual(["a"]);
        });
      });

      it("leaves no selector behind once the rule is applied", function () {
        // A handler that answers an at-rule itself, as ops does for
        // `@-epubx-page-template`, receives a second rule body with no
        // selector rule in between.
        var handler = cascadeParserHandler(
          new adapt_exprs.LexicalScope(null),
          adapt_cssvalid.baseValidatorSet(),
        );
        handler.startSelectorRule();
        handler.tagSelector(null, "div");
        handler.startRuleBody();
        handler.startRuleBody();

        var cascade = handler.finish();
        expect(Object.keys(cascade.tags)).toEqual(["div"]);
        expect(cascade.tags["div"]).toEqual(
          jasmine.any(adapt_csscasc.ApplyRuleAction),
        );
      });

      it("keeps the view condition of a selector out of the next rule", function (done) {
        parseCascade(
          "p::nth-fragment(2n+1) { color: red } q { color: blue }",
          done,
          function (cascade) {
            expect(cascade.tags["q"].viewConditionId).toBeNull();
          },
        );
      });
    });
  });

  describe("MatchesNativeSelectorAction", function () {
    function matches(element, selector) {
      return new adapt_csscasc.MatchesNativeSelectorAction(selector).matches({
        currentElement: element,
      });
    }

    it("matches in an XHTML document", function () {
      var doc = new DOMParser().parseFromString(
        '<html xmlns="http://www.w3.org/1999/xhtml"><body>' +
          '<section dir="rtl"><p></p></section></body></html>',
        "application/xhtml+xml",
      );
      var element = doc.getElementsByTagName("p")[0];
      expect(matches(element, ":dir(rtl)")).toBe(true);
      expect(matches(element, ":dir(ltr)")).toBe(false);
    });

    it("hands the selector to the matcher for every element it answers for", function () {
      var first = {
        matches: jasmine.createSpy("matches").and.returnValue(true),
      };
      var second = {
        matches: jasmine.createSpy("matches").and.returnValue(false),
      };
      var third = {
        matches: jasmine.createSpy("matches").and.returnValue(true),
      };
      var action = new adapt_csscasc.MatchesNativeSelectorAction(":dir(rtl)");
      expect(action.matches({ currentElement: first })).toBe(true);
      expect(action.matches({ currentElement: second })).toBe(false);
      expect(action.matches({ currentElement: third })).toBe(true);
      expect(first.matches).toHaveBeenCalledWith(":dir(rtl)");
      expect(second.matches).toHaveBeenCalledWith(":dir(rtl)");
      expect(third.matches).toHaveBeenCalledWith(":dir(rtl)");
    });

    it("matches nothing without an element", function () {
      var action = new adapt_csscasc.MatchesNativeSelectorAction(":dir(ltr)");
      // A rule cascade carries no element at all.
      expect(action.matches({})).toBe(false);
      expect(action.matches({ currentElement: null })).toBe(false);
    });

    it("matches nothing when the native matcher throws", function () {
      var element = {
        matches: jasmine
          .createSpy("matches")
          .and.throwError(new DOMException("Invalid selector", "SyntaxError")),
      };
      var action = new adapt_csscasc.MatchesNativeSelectorAction(":dir(rtl)");
      expect(action.matches({ currentElement: element })).toBe(false);
      expect(element.matches).toHaveBeenCalledWith(":dir(rtl)");
    });
  });

  describe("CascadeParserHandler", function () {
    describe("simpleProperty", function () {
      vivliostyle_test_util_mock_plugin.setup();

      it("convert property declaration by calling functions registered to 'SIMPLE_PROPERTY' hook", function () {
        function hook1(original) {
          return {
            name: original["name"] + "1",
            value: adapt_css.getName(original["value"].stringValue() + "1"),
            important: original["important"],
          };
        }

        function hook2(original) {
          return {
            name: original["name"] + "2",
            value: adapt_css.getName(original["value"].stringValue() + "2"),
            important: !original["important"],
          };
        }

        var handler = cascadeParserHandler(
          new adapt_exprs.LexicalScope(null),
          adapt_cssvalid.baseValidatorSet(),
        );
        var style = (handler.elementStyle = {});
        handler.simpleProperty("foo", adapt_css.getName("bar"), false);
        var originalPriority = style["foo"].priority;
        expect(style["foo"].value).toBe(adapt_css.getName("bar"));

        vivliostyle_plugin.registerHook("SIMPLE_PROPERTY", hook1);
        style = handler.elementStyle = {};
        handler.simpleProperty("foo", adapt_css.getName("bar"), false);
        expect("foo" in style).toBe(false);
        expect(style["foo1"].value).toBe(adapt_css.getName("bar1"));
        // Deleted the next assertion because CascadeParserHandler.simpleProperty() now increments priority:
        // expect(style["foo1"].priority).toBe(originalPriority);

        vivliostyle_plugin.registerHook("SIMPLE_PROPERTY", hook2);
        style = handler.elementStyle = {};
        handler.simpleProperty("foo", adapt_css.getName("bar"), false);
        expect("foo1" in style).toBe(false);
        expect(style["foo12"].value).toBe(adapt_css.getName("bar12"));
        expect(style["foo12"].priority).not.toBe(originalPriority);
      });
    });

    describe("attributeSelector", function () {
      var handler;

      beforeEach(function () {
        handler = cascadeParserHandler(
          new adapt_exprs.LexicalScope(null),
          adapt_cssvalid.baseValidatorSet(),
        );
        handler.startSelectorRule();
      });

      describe("Attribute presence selector", function () {
        it("use CheckAttributePresentAction when the operator is EOF (no operator)", function () {
          handler.attributeSelector(
            "ns",
            "foo",
            adapt_csstok.TokenType.EOF,
            null,
          );

          expect(handler.chain.actions.length).toBe(1);
          var action = handler.chain.actions[0];
          expect(action).toEqual(
            jasmine.any(adapt_csscasc.CheckAttributePresentAction),
          );
          expect(action.ns).toBe("ns");
          expect(action.name).toBe("foo");
        });
      });

      describe("Attribute equality selector", function () {
        it("use CheckAttributeEqAction when the operator is '='", function () {
          handler.attributeSelector(
            "ns",
            "foo",
            adapt_csstok.TokenType.EQ,
            "bar",
          );

          expect(handler.chain.actions.length).toBe(1);
          var action = handler.chain.actions[0];
          expect(action).toEqual(
            jasmine.any(adapt_csscasc.CheckAttributeEqAction),
          );
          expect(action.ns).toBe("ns");
          expect(action.name).toBe("foo");
          expect(action.value).toBe("bar");
          expect(action.caseSensitivity).toBeNull();
        });

        it("stores the attribute selector modifier when present", function () {
          handler.attributeSelector(
            "ns",
            "foo",
            adapt_csstok.TokenType.EQ,
            "bar",
            "i",
          );

          expect(handler.chain.actions.length).toBe(1);
          var action = handler.chain.actions[0];
          expect(action).toEqual(
            jasmine.any(adapt_csscasc.CheckAttributeEqAction),
          );
          expect(action.caseSensitivity).toBe("i");
        });
      });

      describe("~= attribute selector", function () {
        it("use CheckAttributeRegExpAction when the value is not empty and contains no whitespaces", function () {
          handler.attributeSelector(
            "ns",
            "foo",
            adapt_csstok.TokenType.TILDE_EQ,
            "bar",
          );

          expect(handler.chain.actions.length).toBe(1);
          var action = handler.chain.actions[0];
          expect(action).toEqual(
            jasmine.any(adapt_csscasc.CheckAttributeRegExpAction),
          );
          expect(action.ns).toBe("ns");
          expect(action.name).toBe("foo");
          var regexp = action.regexp;
          expect("bar".match(regexp)).toBeTruthy();
          expect("a bar b".match(regexp)).toBeTruthy();
          expect("abar b".match(regexp)).toBeFalsy();
        });

        it("represents nothing when the value contains whitespaces", function () {
          handler.attributeSelector(
            "ns",
            "foo",
            adapt_csstok.TokenType.TILDE_EQ,
            "b c",
          );

          expect(handler.chain.actions.length).toBe(1);
          var action = handler.chain.actions[0];
          expect(action).toEqual(
            jasmine.any(adapt_csscasc.CheckConditionAction),
          );
          expect(action.condition).toBe("");
        });

        it("represents nothing when the value is an empty string", function () {
          handler.attributeSelector(
            "ns",
            "foo",
            adapt_csstok.TokenType.TILDE_EQ,
            "",
          );

          expect(handler.chain.actions.length).toBe(1);
          var action = handler.chain.actions[0];
          expect(action).toEqual(
            jasmine.any(adapt_csscasc.CheckConditionAction),
          );
          expect(action.condition).toBe("");
        });
      });

      describe("|= attribute selector", function () {
        it("use CheckAttributeRegExpAction when the value is a non-empty string", function () {
          handler.attributeSelector(
            "ns",
            "foo",
            adapt_csstok.TokenType.BAR_EQ,
            "bar",
          );

          expect(handler.chain.actions.length).toBe(1);
          var action = handler.chain.actions[0];
          expect(action).toEqual(
            jasmine.any(adapt_csscasc.CheckAttributeRegExpAction),
          );
          expect(action.ns).toBe("ns");
          expect(action.name).toBe("foo");
          var regexp = action.regexp;
          expect("bar".match(regexp)).toBeTruthy();
          expect("bar-b".match(regexp)).toBeTruthy();
          expect("barb".match(regexp)).toBeFalsy();
          expect("a-bar-b".match(regexp)).toBeFalsy();
        });

        it("also use CheckAttributeRegExpAction when the value is an empty string", function () {
          handler.attributeSelector(
            "ns",
            "foo",
            adapt_csstok.TokenType.BAR_EQ,
            "",
          );

          expect(handler.chain.actions.length).toBe(1);
          var action = handler.chain.actions[0];
          expect(action).toEqual(
            jasmine.any(adapt_csscasc.CheckAttributeRegExpAction),
          );
          expect(action.ns).toBe("ns");
          expect(action.name).toBe("foo");
          var regexp = action.regexp;
          expect("-bar".match(regexp)).toBeTruthy();
          expect("-".match(regexp)).toBeTruthy();
          expect("bar-b".match(regexp)).toBeFalsy();
        });
      });

      describe("^= attribute selector", function () {
        it("use CheckAttributeRegExpAction when the value is a non-empty string", function () {
          handler.attributeSelector(
            "ns",
            "foo",
            adapt_csstok.TokenType.HAT_EQ,
            "bar",
          );

          expect(handler.chain.actions.length).toBe(1);
          var action = handler.chain.actions[0];
          expect(action).toEqual(
            jasmine.any(adapt_csscasc.CheckAttributeRegExpAction),
          );
          expect(action.ns).toBe("ns");
          expect(action.name).toBe("foo");
          var regexp = action.regexp;
          expect("bar".match(regexp)).toBeTruthy();
          expect("bar-b".match(regexp)).toBeTruthy();
          expect("barb".match(regexp)).toBeTruthy();
          expect("a-bar-b".match(regexp)).toBeFalsy();
        });

        it("creates an ASCII-case-insensitive regexp when the i modifier is passed", function () {
          handler.attributeSelector(
            "ns",
            "foo",
            adapt_csstok.TokenType.HAT_EQ,
            "bar",
            "i",
          );

          expect(handler.chain.actions.length).toBe(1);
          var action = handler.chain.actions[0];
          expect(action).toEqual(
            jasmine.any(adapt_csscasc.CheckAttributeRegExpAction),
          );
          expect("BAR".match(action.regexp)).toBeTruthy();
          expect("Bar-baz".match(action.regexp)).toBeTruthy();
        });

        it("does not use Unicode case folding for the i modifier", function () {
          handler.attributeSelector(
            "ns",
            "foo",
            adapt_csstok.TokenType.HAT_EQ,
            "ä",
            "i",
          );

          expect(handler.chain.actions.length).toBe(1);
          var action = handler.chain.actions[0];
          expect(action).toEqual(
            jasmine.any(adapt_csscasc.CheckAttributeRegExpAction),
          );
          expect("äbc".match(action.regexp)).toBeTruthy();
          expect("Äbc".match(action.regexp)).toBeFalsy();
        });

        it("represents nothing when the value is an empty string", function () {
          handler.attributeSelector(
            "ns",
            "foo",
            adapt_csstok.TokenType.HAT_EQ,
            "",
          );

          expect(handler.chain.actions.length).toBe(1);
          var action = handler.chain.actions[0];
          expect(action).toEqual(
            jasmine.any(adapt_csscasc.CheckConditionAction),
          );
          expect(action.condition).toBe("");
        });
      });

      describe("$= attribute selector", function () {
        it("use CheckAttributeRegExpAction when the value is a non-empty string", function () {
          handler.attributeSelector(
            "ns",
            "foo",
            adapt_csstok.TokenType.DOLLAR_EQ,
            "bar",
          );

          expect(handler.chain.actions.length).toBe(1);
          var action = handler.chain.actions[0];
          expect(action).toEqual(
            jasmine.any(adapt_csscasc.CheckAttributeRegExpAction),
          );
          expect(action.ns).toBe("ns");
          expect(action.name).toBe("foo");
          var regexp = action.regexp;
          expect("bar".match(regexp)).toBeTruthy();
          expect("b-bar".match(regexp)).toBeTruthy();
          expect("bbar".match(regexp)).toBeTruthy();
          expect("bbarb".match(regexp)).toBeFalsy();
        });

        it("represents nothing when the value is an empty string", function () {
          handler.attributeSelector(
            "ns",
            "foo",
            adapt_csstok.TokenType.DOLLAR_EQ,
            "",
          );

          expect(handler.chain.actions.length).toBe(1);
          var action = handler.chain.actions[0];
          expect(action).toEqual(
            jasmine.any(adapt_csscasc.CheckConditionAction),
          );
          expect(action.condition).toBe("");
        });
      });

      describe("*= attribute selector", function () {
        it("use CheckAttributeRegExpAction when the value is a non-empty string", function () {
          handler.attributeSelector(
            "ns",
            "foo",
            adapt_csstok.TokenType.STAR_EQ,
            "bar",
          );

          expect(handler.chain.actions.length).toBe(1);
          var action = handler.chain.actions[0];
          expect(action).toEqual(
            jasmine.any(adapt_csscasc.CheckAttributeRegExpAction),
          );
          expect(action.ns).toBe("ns");
          expect(action.name).toBe("foo");
          var regexp = action.regexp;
          expect("bar".match(regexp)).toBeTruthy();
          expect("a bar b".match(regexp)).toBeTruthy();
          expect("abarb".match(regexp)).toBeTruthy();
          expect("foo".match(regexp)).toBeFalsy();
        });

        it("represents nothing when the value is an empty string", function () {
          handler.attributeSelector(
            "ns",
            "foo",
            adapt_csstok.TokenType.STAR_EQ,
            "",
          );

          expect(handler.chain.actions.length).toBe(1);
          var action = handler.chain.actions[0];
          expect(action).toEqual(
            jasmine.any(adapt_csscasc.CheckConditionAction),
          );
          expect(action.condition).toBe("");
        });
      });

      it("voids the selector when an unsupported operator is passed", function () {
        handler.attributeSelector("ns", "foo", null, "bar");

        expect(handler.chain.actions).toBeUndefined();
        expect(handler.selectorListVoided).toBe(true);
      });
    });
  });

  describe("CascadeInstance", function () {
    describe("attribute selectors", function () {
      it("matches XML attribute names case-sensitively", function () {
        var doc = new DOMParser().parseFromString(
          "<root data-Case='value' />",
          "text/xml",
        );
        var element = doc.documentElement;
        var action = new adapt_csscasc.CheckAttributePresentAction(
          "",
          "data-Case",
        );
        var chained = jasmine.createSpyObj("chained", ["apply"]);
        var wired = action.wire(chained);

        wired.apply({ currentElement: element });
        expect(chained.apply).toHaveBeenCalled();

        action = new adapt_csscasc.CheckAttributePresentAction("", "data-case");
        chained = jasmine.createSpyObj("chained", ["apply"]);
        wired = action.wire(chained);

        wired.apply({ currentElement: element });
        expect(chained.apply).not.toHaveBeenCalled();
      });

      it("matches attribute values ASCII-case-insensitively with the i flag", function () {
        var doc = new DOMParser().parseFromString(
          "<!DOCTYPE html><html><body><div data-state='OPEN'></div></body></html>",
          "text/html",
        );
        var element = doc.body.firstElementChild;
        var action = new adapt_csscasc.CheckAttributeEqAction(
          "",
          "data-state",
          "open",
          "i",
        );
        var chained = jasmine.createSpyObj("chained", ["apply"]);
        var wired = action.wire(chained);

        wired.apply({ currentElement: element });
        expect(chained.apply).toHaveBeenCalled();
      });

      it("does not use Unicode case folding for the i flag", function () {
        var doc = new DOMParser().parseFromString(
          "<!DOCTYPE html><html><body><div data-state='Ä'></div></body></html>",
          "text/html",
        );
        var element = doc.body.firstElementChild;
        var action = new adapt_csscasc.CheckAttributeEqAction(
          "",
          "data-state",
          "ä",
          "i",
        );
        var chained = jasmine.createSpyObj("chained", ["apply"]);
        var wired = action.wire(chained);

        wired.apply({ currentElement: element });
        expect(chained.apply).not.toHaveBeenCalled();
      });

      it("keeps exact attribute value matching with the s flag", function () {
        var doc = new DOMParser().parseFromString(
          "<!DOCTYPE html><html><body><div data-state='OPEN'></div></body></html>",
          "text/html",
        );
        var element = doc.body.firstElementChild;
        var action = new adapt_csscasc.CheckAttributeEqAction(
          "",
          "data-state",
          "open",
          "s",
        );
        var chained = jasmine.createSpyObj("chained", ["apply"]);
        var wired = action.wire(chained);

        wired.apply({ currentElement: element });
        expect(chained.apply).not.toHaveBeenCalled();
      });
    });

    describe("markerAllowedProps", function () {
      it("includes text-orientation for vertical writing mode support", function () {
        expect(adapt_csscasc.CascadeInstance.markerAllowedProps).toContain(
          "text-orientation",
        );
      });

      it("includes all required marker properties", function () {
        const expectedProps = [
          "color",
          "font-family",
          "font-size",
          "font-style",
          "font-weight",
          "font-variant",
          "unicode-bidi",
          "direction",
          "white-space",
          "text-transform",
          "text-combine-upright",
          "text-orientation",
        ];
        expectedProps.forEach((prop) => {
          expect(adapt_csscasc.CascadeInstance.markerAllowedProps).toContain(
            prop,
          );
        });
      });
    });
  });

  describe("VarFilterVisitor regression coverage", function () {
    function parseValue(cssText) {
      return adapt_cssparse.parseValue(
        new adapt_exprs.LexicalScope(null),
        new adapt_csstok.Tokenizer(cssText, null),
        "",
      );
    }

    function createCascadeValue(cssText) {
      return new adapt_csscasc.CascadeValue(parseValue(cssText), 1);
    }

    function applyVarFilter(style, element, ancestorEntries, validatorSet) {
      var styleMap = new Map();
      styleMap.set(element, style);
      (ancestorEntries || []).forEach(function (entry) {
        styleMap.set(entry.element, entry.style);
      });

      validatorSet = validatorSet || {
        getShorthand: function () {
          return null;
        },
        defaultValues: {},
      };

      var cascadeInstance = {
        context: {},
        root: element,
        scope: new adapt_exprs.LexicalScope(null),
        validatorSet: validatorSet,
        styles: {
          styleOf: function (currentElement) {
            return styleMap.get(currentElement) || null;
          },
        },
      };
      cascadeInstance.applyVarFilter =
        adapt_csscasc.CascadeInstance.prototype.applyVarFilter;
      cascadeInstance.applyVarFilter([style], element);
    }

    it("keeps self-referential custom properties guaranteed-invalid instead of using their fallback", function () {
      var element = document.createElement("div");
      var style = {
        "--a": createCascadeValue("var(--a, red)"),
        color: createCascadeValue("var(--a, green)"),
      };

      applyVarFilter(style, element);

      expect(style["--a"].value).toBe(adapt_css.ident.initial);
      expect(style.color.value.toString()).toBe("green");
    });

    it("keeps cross-cyclic custom properties guaranteed-invalid regardless of declaration order", function () {
      [
        {
          "--a": createCascadeValue("var(--b)"),
          "--b": createCascadeValue("var(--a, green)"),
          color: createCascadeValue("var(--b, blue)"),
        },
        {
          "--b": createCascadeValue("var(--a, green)"),
          "--a": createCascadeValue("var(--b)"),
          color: createCascadeValue("var(--b, blue)"),
        },
      ].forEach(function (style) {
        var element = document.createElement("div");

        applyVarFilter(style, element);

        expect(style["--a"].value).toBe(adapt_css.ident.initial);
        expect(style["--b"].value).toBe(adapt_css.ident.initial);
        expect(style.color.value.toString()).toBe("blue");
      });
    });

    it("keeps fallback available for properties that only reference a cyclic custom property", function () {
      var element = document.createElement("div");
      var style = {
        "--a": createCascadeValue("var(--b)"),
        "--b": createCascadeValue("var(--a)"),
        "--x": createCascadeValue("var(--a, green)"),
        color: createCascadeValue("var(--x, blue)"),
      };

      applyVarFilter(style, element);

      expect(style["--a"].value).toBe(adapt_css.ident.initial);
      expect(style["--b"].value).toBe(adapt_css.ident.initial);
      expect(style["--x"].value.toString()).toBe("green");
      expect(style.color.value.toString()).toBe("green");
    });

    it("treats fallback references as part of the custom property dependency cycle", function () {
      var element = document.createElement("div");
      var style = {
        "--a": createCascadeValue("var(--b, var(--c))"),
        "--b": createCascadeValue("green"),
        "--c": createCascadeValue("var(--a)"),
        color: createCascadeValue("var(--a, blue)"),
      };

      applyVarFilter(style, element);

      expect(style["--a"].value).toBe(adapt_css.ident.initial);
      expect(style["--c"].value).toBe(adapt_css.ident.initial);
      expect(style.color.value.toString()).toBe("blue");
    });

    it("resolves ordinary properties after marking cyclic custom properties invalid", function () {
      var element = document.createElement("div");
      var style = {
        color: createCascadeValue("var(--a, blue)"),
        "--a": createCascadeValue("var(--b, var(--c))"),
        "--b": createCascadeValue("green"),
        "--c": createCascadeValue("var(--a)"),
      };

      applyVarFilter(style, element);

      expect(style["--a"].value).toBe(adapt_css.ident.initial);
      expect(style["--c"].value).toBe(adapt_css.ident.initial);
      expect(style.color.value.toString()).toBe("blue");
    });

    it("propagates fallback-cycle membership back to the calling custom property", function () {
      var element = document.createElement("div");
      var style = {
        "--a": createCascadeValue("var(--b, red)"),
        "--b": createCascadeValue("var(--c, var(--a))"),
        "--c": createCascadeValue("green"),
        color: createCascadeValue("var(--a, blue)"),
      };

      applyVarFilter(style, element);

      expect(style["--a"].value).toBe(adapt_css.ident.initial);
      expect(style["--b"].value).toBe(adapt_css.ident.initial);
      expect(style.color.value.toString()).toBe("blue");
    });

    it("keeps fallback-only cycle dependencies invalid even when the substituted branch is otherwise valid", function () {
      var element = document.createElement("div");
      var style = {
        "--a": createCascadeValue("var(--c, var(--b))"),
        "--b": createCascadeValue("var(--a)"),
        "--c": createCascadeValue("red"),
        color: createCascadeValue("var(--a, blue)"),
      };

      applyVarFilter(style, element);

      expect(style["--a"].value).toBe(adapt_css.ident.initial);
      expect(style["--b"].value).toBe(adapt_css.ident.initial);
      expect(style.color.value.toString()).toBe("blue");
    });

    it("preserves originating element custom property context for pseudo-elements", function () {
      var element = document.createElement("div");
      var beforeStyle = {
        color: createCascadeValue("var(--x)"),
        "--x": createCascadeValue("var(--y)"),
      };
      var style = {
        "--y": createCascadeValue("green"),
        _pseudos: {
          before: beforeStyle,
        },
      };

      applyVarFilter(style, element);

      expect(beforeStyle["--x"].value.toString()).toBe("green");
      expect(beforeStyle.color.value.toString()).toBe("green");
    });

    it("does not treat owner-element fallback references as pseudo-element cycles", function () {
      var element = document.createElement("div");
      var style = {
        _pseudos: {
          before: {
            "--a": createCascadeValue("var(--c, var(--b))"),
            color: createCascadeValue("var(--a, blue)"),
          },
        },
        "--b": createCascadeValue("var(--a, green)"),
      };

      applyVarFilter(style, element);

      expect(style["--b"].value.toString()).toBe("green");
      expect(style._pseudos.before["--a"].value.toString()).toBe("green");
      expect(style._pseudos.before.color.value.toString()).toBe("green");
    });

    it("uses fallback when a custom property references an invalid inherited variable", function () {
      var body = document.createElement("body");
      var element = document.createElement("p");
      body.appendChild(element);
      var bodyStyle = {
        "--c": createCascadeValue("var(--a)"),
      };
      var style = {
        "--a": createCascadeValue("var(--b)"),
        "--b": createCascadeValue("var(--c, green)"),
        color: createCascadeValue("var(--a)"),
      };

      applyVarFilter(style, element, [{ element: body, style: bodyStyle }]);

      expect(style["--b"].value.toString()).toBe("green");
      expect(style["--a"].value.toString()).toBe("green");
      expect(style.color.value.toString()).toBe("green");
    });

    it("treats unresolved var() in ordinary properties as unset", function () {
      var element = document.createElement("div");
      var style = {
        color: createCascadeValue("var(--missing)"),
      };

      applyVarFilter(style, element);

      expect(style.color.value).toBe(adapt_css.ident.unset);
    });

    it("treats inherited custom property keywords that resolve nowhere as unset in ordinary properties", function () {
      var element = document.createElement("a");
      var root = document.createElement("div");
      root.appendChild(element);
      var rootStyle = {
        "--toc-anchor-color": createCascadeValue("inherit"),
      };
      var style = {
        color: createCascadeValue("var(--toc-anchor-color)"),
      };

      applyVarFilter(style, element, [{ element: root, style: rootStyle }]);

      expect(style.color.value).toBe(adapt_css.ident.unset);
    });

    it("expands all with var-substituted CSS-wide values into browser-backed longhands", function () {
      var element = document.createElement("div");
      var validatorSet = adapt_cssvalid.baseValidatorSet();
      var style = {
        all: createCascadeValue("var(--reset, initial)"),
        transition: createCascadeValue("opacity 1s ease"),
      };

      applyVarFilter(style, element, null, validatorSet);

      expect(style.all).toBeUndefined();
      expect(style.transition).toBeDefined();
      expect(style["transition-property"]).toBeDefined();
      expect(style["transition-duration"]).toBeDefined();
      expect(style["transition-property"].value).toBe(adapt_css.ident.initial);
      expect(style["transition-duration"].value).toBe(adapt_css.ident.initial);
    });

    it("keeps var-substituted properties that Vivliostyle validates itself (Issue #2116)", function () {
      var element = document.createElement("div");
      var validatorSet = adapt_cssvalid.baseValidatorSet();
      var style = {
        "--pos": createCascadeValue("15mm 12.6mm"),
        "background-position": createCascadeValue("var(--pos)"),
        overflow: createCascadeValue("var(--ov)"),
        "--ov": createCascadeValue("hidden"),
      };

      applyVarFilter(style, element, null, validatorSet);

      expect(style["background-position"]).toBeDefined();
      expect(style["background-position"].value.toString()).toBe("15mm 12.6mm");
      expect(style["background-position-x"]).toBeUndefined();
      expect(style["background-position-y"]).toBeUndefined();
      expect(style.overflow).toBeDefined();
      expect(style.overflow.value.toString()).toBe("hidden");
      expect(style["overflow-x"]).toBeUndefined();
      expect(style["overflow-y"]).toBeUndefined();
    });
  });

  describe("AttrValueFilterVisitor regression coverage", function () {
    function parseValue(cssText) {
      return adapt_cssparse.parseValue(
        new adapt_exprs.LexicalScope(null),
        new adapt_csstok.Tokenizer(cssText, null),
        "",
      );
    }

    function createCascadeValue(cssText) {
      return new adapt_csscasc.CascadeValue(parseValue(cssText), 1);
    }

    function applyAttrFilter(style, element, validatorSet) {
      validatorSet = validatorSet || adapt_cssvalid.baseValidatorSet();

      var cascadeInstance = {
        scope: new adapt_exprs.LexicalScope(null),
        validatorSet: validatorSet,
      };
      cascadeInstance.applyAttrFilter =
        adapt_csscasc.CascadeInstance.prototype.applyAttrFilter;
      cascadeInstance.applyAttrFilterInner =
        adapt_csscasc.CascadeInstance.prototype.applyAttrFilterInner;
      cascadeInstance.applyAttrFilter(element, style);
    }

    it("treats missing typed attr() without fallback as unset", function () {
      var element = document.createElement("div");
      var style = {
        opacity: createCascadeValue("attr(data-opacity number)"),
      };

      applyAttrFilter(style, element);

      expect(style.opacity.value).toBe(adapt_css.ident.unset);
    });

    it("invalidates attr() fallback when the property validator rejects it", function () {
      var element = document.createElement("div");
      element.setAttribute("data-opacity", "not-a-number");
      var style = {
        opacity: createCascadeValue("attr(data-opacity number, red)"),
      };

      applyAttrFilter(style, element);

      expect(style.opacity.value).toBe(adapt_css.ident.unset);
    });

    it("invalidates the whole property when nested attr() makes the final value invalid", function () {
      var element = document.createElement("div");
      var style = {
        transform: createCascadeValue("translateX(attr(data-x px, red))"),
      };

      applyAttrFilter(style, element);

      expect(style.transform.value).toBe(adapt_css.ident.unset);
    });

    it("keeps the whole property when nested attr() fallback yields a valid value", function () {
      var element = document.createElement("div");
      var style = {
        transform: createCascadeValue("translateX(attr(data-x px, 5px))"),
      };

      applyAttrFilter(style, element);

      expect(style.transform.value.toString()).toBe("translatex(5px)");
    });

    it("trims attribute whitespace before appending unit keywords", function () {
      var element = document.createElement("div");
      element.setAttribute("data-size", "50 ");
      var style = {
        "font-size": createCascadeValue("attr(data-size px, 10px)"),
      };

      applyAttrFilter(style, element);

      expect(style["font-size"].value.toString()).toBe("50px");
    });
  });

  describe("rollback keywords", function () {
    beforeEach(function () {
      // Every style sheet is parsed before the cascade runs, so the property
      // is known to need its losing declarations kept before any of them is
      // merged in.
      adapt_csscasc.noteRollbackDeclaration("color", adapt_css.ident.revert);
    });

    function declare(style, value, priority, layer, ruleId) {
      adapt_csscasc.setPropCascadeValue(
        style,
        "color",
        new adapt_csscasc.CascadeValue(
          value,
          priority,
          layer || null,
          ruleId || 0,
        ),
      );
    }

    function resolved(style) {
      adapt_csscasc.resolveRollbackValues(style);
      return style.color.value;
    }

    var green = adapt_css.getName("green");
    var red = adapt_css.getName("red");
    var blue = adapt_css.getName("blue");

    it("rolls an author declaration back to the user-agent origin", function () {
      var style = {};
      declare(style, green, adapt_cssparse.SPECIFICITY_USER_AGENT);
      declare(style, red, adapt_cssparse.SPECIFICITY_AUTHOR);
      declare(
        style,
        adapt_css.ident.revert,
        adapt_cssparse.SPECIFICITY_AUTHOR + 1,
      );

      expect(resolved(style)).toBe(green);
    });

    it("rolls a user declaration back past the author origin", function () {
      var style = {};
      declare(style, green, adapt_cssparse.SPECIFICITY_USER_AGENT);
      declare(style, red, adapt_cssparse.SPECIFICITY_AUTHOR_IMPORTANT);
      declare(
        style,
        adapt_css.ident.revert,
        adapt_cssparse.SPECIFICITY_USER_IMPORTANT,
      );

      expect(resolved(style)).toBe(green);
    });

    it("becomes unset when there is nothing left to roll back to", function () {
      var style = {};
      declare(style, red, adapt_cssparse.SPECIFICITY_AUTHOR);
      declare(
        style,
        adapt_css.ident.revert,
        adapt_cssparse.SPECIFICITY_AUTHOR + 1,
      );

      expect(resolved(style)).toBe(adapt_css.ident.unset);
    });

    it("rolls revert-layer back to the previous layer", function () {
      var tree = new adapt_csscasc.CascadeLayerTree();
      var first = tree.register(null, ["first"]);
      var second = tree.register(null, ["second"]);
      var style = {};
      declare(style, green, adapt_cssparse.SPECIFICITY_AUTHOR, first);
      declare(
        style,
        adapt_css.ident.revert_layer,
        adapt_cssparse.SPECIFICITY_AUTHOR,
        second,
      );

      expect(resolved(style)).toBe(green);
    });

    // WPT css/css-cascade/revert-layer-005.html
    it("rolls an important revert-layer back to the earlier layer, dropping the later layer's important declaration", function () {
      var tree = new adapt_csscasc.CascadeLayerTree();
      var a = tree.register(null, ["a"]);
      var b = tree.register(null, ["b"]);
      var c = tree.register(null, ["c"]);
      var style = {};
      declare(style, green, adapt_cssparse.SPECIFICITY_AUTHOR, a);
      declare(
        style,
        adapt_css.ident.revert_layer,
        adapt_cssparse.SPECIFICITY_AUTHOR_IMPORTANT,
        b,
      );
      declare(style, red, adapt_cssparse.SPECIFICITY_AUTHOR_IMPORTANT, c);

      expect(resolved(style)).toBe(green);
    });

    // WPT css/css-cascade/revert-layer-009.html
    it("rolls revert-layer in the style attribute back to the author style sheets", function () {
      var style = {};
      declare(style, green, adapt_cssparse.SPECIFICITY_AUTHOR);
      declare(style, red, adapt_cssparse.SPECIFICITY_STYLE);
      declare(
        style,
        adapt_css.ident.revert_layer,
        adapt_cssparse.SPECIFICITY_STYLE + 1,
      );

      expect(resolved(style)).toBe(green);
    });

    it("skips every declaration of its own rule for revert-rule", function () {
      var style = {};
      declare(style, green, adapt_cssparse.SPECIFICITY_AUTHOR, null, 1);
      declare(style, red, adapt_cssparse.SPECIFICITY_AUTHOR + 1, null, 2);
      declare(
        style,
        adapt_css.ident.revert_rule,
        adapt_cssparse.SPECIFICITY_AUTHOR + 2,
        null,
        2,
      );

      expect(resolved(style)).toBe(green);
    });

    it("takes declarations caught in a revert-rule cycle out of the cascade", function () {
      var style = {};
      declare(style, blue, adapt_cssparse.SPECIFICITY_AUTHOR, null, 1);
      declare(
        style,
        adapt_css.ident.revert_rule,
        adapt_cssparse.SPECIFICITY_AUTHOR + 1,
        null,
        2,
      );
      declare(
        style,
        adapt_css.ident.revert_rule,
        adapt_cssparse.SPECIFICITY_AUTHOR + 2,
        null,
        3,
      );

      expect(resolved(style)).toBe(blue);
    });
  });
});
