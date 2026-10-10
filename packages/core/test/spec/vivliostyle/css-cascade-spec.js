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
          var action = cascade.tags.get("div");
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
            expect(cascade.tags.get("div")).toBeUndefined();
            expect(cascade.tags.get("*").condition.firstActions.length).toBe(1);
          },
        );
      });

      it("voids :nth-child(An+B of S) whose alternative was voided", function (done) {
        // Selectors Level 4 gives S a <complex-real-selector-list>.
        parseCascade(
          "div:nth-child(2n of !!!, .x) { color: red }",
          done,
          function (cascade) {
            expect(Array.from(cascade.tags.keys())).toEqual([]);
          },
        );
      });

      it("voids :has() whose alternative was voided", function (done) {
        // Selectors Level 4 gives `:has()` a <relative-selector-list>.
        parseCascade(
          "div:has(# p, q) { color: red }",
          done,
          function (cascade) {
            expect(Array.from(cascade.tags.keys())).toEqual([]);
          },
        );
      });

      it("drops a voided unforgiving list from the forgiving list around it", function (done) {
        parseCascade(
          "div:is(:has(.x, # p), .z) span { color: red }",
          done,
          function (cascade) {
            expect(cascade.tags.get("*").condition.firstActions.length).toBe(1);
          },
        );
      });

      it("takes the alternative the parser rebuilds after recovering", function (done) {
        parseCascade(
          "div:is(!!!}p, .x) { color: red }",
          done,
          function (cascade) {
            expect(cascade.tags.get("*").condition.firstActions.length).toBe(2);
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
            expect(Array.from(cascade.tags.keys())).toEqual([]);
            expect(Array.from(cascade.classes.keys())).toEqual([]);
          },
        );
      });

      it("voids the selectors that precede the invalid one", function (done) {
        parseCascade(
          "a, b:has(# p), c { color: red } e { color: blue }",
          done,
          function (cascade) {
            expect(Array.from(cascade.tags.keys())).toEqual(["e"]);
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
            expect(cascade.tags.get("*").condition.firstActions.length).toBe(1);
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
            expect(cascade.tags.get("*").chained.chained.specificity).toBe(257);
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
            expect(cascade.tags.get("span")).toEqual(
              jasmine.any(adapt_csscasc.WiredConditionScope),
            );
            expect(cascade.tags.get("span").chained).toEqual(
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
            expect(cascade.tags.get("div").chained.specificity).toBe(1);
          },
        );
      });

      it("keeps the view condition of the voided selector out of the next rule", function (done) {
        parseCascade(
          "p::nth-fragment(2n+1):not(# a) { color: red } q { color: blue }",
          done,
          function (cascade) {
            expect(cascade.tags.get("q").viewConditionId).toBeNull();
          },
        );
      });

      it("drops a rule whose selector never finished", function (done) {
        // The rule never reaches its body, so nothing it built is taken.
        parseCascade(
          "div:is(!!!}p>{}) span { color: red }",
          done,
          function (cascade) {
            expect(Array.from(cascade.tags.keys())).toEqual([]);
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
            expect(cascade.tags.get("*").condition.firstActions.length).toBe(1);
            expect(cascade.tags.get("span")).toEqual(
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
            expect(Array.from(cascade.tags.keys())).toEqual([]);
          },
        );
      });

      it("matches nothing when it was the only alternative", function (done) {
        parseCascade(
          "div:is(::before) span { color: red }",
          done,
          function (cascade) {
            expect(cascade.tags.get("div").condition.condition).toBe("");
          },
        );
      });

      it("keeps a pseudo-element outside such a list", function (done) {
        parseCascade(
          "div:is(.x) ::before { color: red }",
          done,
          function (cascade) {
            var applied = cascade.tags.get("*").list[1].chained;
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
            expect(Array.from(cascade.tags.keys())).toEqual([]);
          },
        );
      });

      it("keeps the rules that follow", function (done) {
        parseCascade(
          "p:unknown-pseudo { color: red } div { color: blue }",
          done,
          function (cascade) {
            expect(Array.from(cascade.tags.keys())).toEqual(["div"]);
          },
        );
      });

      it("keeps the view condition of the voided selector out of the next rule", function (done) {
        parseCascade(
          "p::nth-fragment(2n+1):unknown-pseudo { color: red } q { color: blue }",
          done,
          function (cascade) {
            expect(cascade.tags.get("q").viewConditionId).toBeNull();
          },
        );
      });

      it("drops only the alternative inside a forgiving list", function (done) {
        parseCascade(
          "div:is(.x, :unknown-pseudo) span { color: red }",
          done,
          function (cascade) {
            expect(cascade.tags.get("*").condition.firstActions.length).toBe(1);
            expect(cascade.tags.get("span")).toEqual(
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
            expect(Array.from(cascade.tags.keys())).toEqual(["q"]);
          },
        );
      });

      it("voids the rule for the functional form of :link", function (done) {
        parseCascade(
          "a:link(x) { color: red } q { color: blue }",
          done,
          function (cascade) {
            expect(Array.from(cascade.tags.keys())).toEqual(["q"]);
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
              expect(Array.from(cascade.tags.keys())).toEqual(["q"]);
            },
          );
        });
      });

      it("voids the selectors around a bare href-epub-type", function (done) {
        parseCascade(
          "a:href-epub-type, q { color: red } r { color: blue }",
          done,
          function (cascade) {
            expect(Array.from(cascade.tags.keys())).toEqual(["r"]);
          },
        );
      });

      it("keeps the view condition out of the next rule when the void comes first", function (done) {
        parseCascade(
          "p:lang::nth-fragment(2n+1) { color: red } q { color: blue }",
          done,
          function (cascade) {
            expect(Array.from(cascade.tags.keys())).toEqual(["q"]);
            expect(cascade.tags.get("q").viewConditionId).toBeNull();
          },
        );
      });

      it("does not delegate a pseudo-class only because the browser supports it", function (done) {
        expect(CSS.supports("selector(:focus-visible)")).toBe(true);
        parseCascade(
          "p:focus-visible { color: red } q { color: blue }",
          done,
          function (cascade) {
            // The rule survives as valid CSS, but its selector matches
            // nothing instead of being handed to the native matcher.
            expect(Array.from(cascade.tags.keys())).toEqual(["p", "q"]);
            var action = cascade.tags.get("p");
            expect(action).toEqual(
              jasmine.any(adapt_csscasc.WiredConditionScope),
            );
            expect(action.condition.condition).toBe("");
          },
        );
      });
    });

    describe("a pseudo-element name case", function () {
      it("takes a pseudo-element name case-insensitively", function (done) {
        parseCascade("p:BEFORE, h1 { color: red }", done, function (cascade) {
          expect(Array.from(cascade.tags.keys())).toEqual(["p", "h1"]);
          expect(cascade.tags.get("p").pseudoelement).toBe("before");
        });
      });

      it("takes a functional pseudo-element name case-insensitively", function (done) {
        parseCascade(
          "p::NTH-FRAGMENT(2n+1) { color: red } q { color: blue }",
          done,
          function (cascade) {
            expect(Array.from(cascade.tags.keys())).toEqual(["p", "q"]);
            expect(cascade.tags.get("p").viewConditionId).toBe("NFS_2_1");
          },
        );
      });

      it("voids the rule for the functional form of a pseudo-element alias", function (done) {
        parseCascade(
          "p:before(x) { color: red } q { color: blue }",
          done,
          function (cascade) {
            expect(Array.from(cascade.tags.keys())).toEqual(["q"]);
          },
        );
      });
    });

    describe(":any-link", function () {
      it("matches as :link does", function (done) {
        parseCascade(":any-link { color: red }", done, function (cascade) {
          expect(Array.from(cascade.tags.keys())).toEqual(["a"]);
          expect(cascade.tags.get("a").condition).toEqual(
            jasmine.any(adapt_csscasc.CheckAttributePresentAction),
          );
          expect(cascade.tags.get("a").condition.ns).toBe("");
          expect(cascade.tags.get("a").condition.name).toBe("href");
          expect(cascade.tags.get("a").chained.specificity).toBe(256);
        });
      });

      it("keeps the source text :has() takes for :any-link", function (done) {
        parseCascade(
          "div:has(:any-link) { color: red }",
          done,
          function (cascade) {
            var action = cascade.tags.get("div").condition;
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
            expect(Array.from(cascade.tags.keys())).toEqual(["q"]);
          },
        );
      });
    });

    describe(":dir()", function () {
      it("compiles to a directionality check", function (done) {
        parseCascade("p:dir(rtl) { color: red }", done, function (cascade) {
          expect(cascade.tags.get("p")).toEqual(
            jasmine.any(adapt_csscasc.WiredGuard),
          );
          expect(cascade.tags.get("p").condition).toEqual(
            jasmine.any(adapt_csscasc.MatchesNativeSelectorAction),
          );
          expect(cascade.tags.get("p").condition.selector).toBe(":dir(rtl)");
          expect(cascade.tags.get("p").chained.specificity).toBe(257);
        });
      });

      it("takes the name and the argument case-insensitively", function (done) {
        parseCascade(
          "p:DIR(RTL) { color: red } q { color: blue }",
          done,
          function (cascade) {
            expect(Array.from(cascade.tags.keys())).toEqual(["p", "q"]);
            expect(cascade.tags.get("p").condition.selector).toBe(":dir(rtl)");
          },
        );
      });

      it("matches nothing for an identifier other than ltr and rtl", function (done) {
        parseCascade(
          "p:dir(foo) { color: red } q { color: blue }",
          done,
          function (cascade) {
            expect(Array.from(cascade.tags.keys())).toEqual(["p", "q"]);
            expect(cascade.tags.get("p")).toEqual(
              jasmine.any(adapt_csscasc.WiredConditionScope),
            );
            expect(cascade.tags.get("p").condition.condition).toBe("");
            expect(cascade.tags.get("p").chained.specificity).toBe(257);
          },
        );
      });

      it("voids the rule when the argument is missing", function (done) {
        parseCascade(
          "p:dir() { color: red } q { color: blue }",
          done,
          function (cascade) {
            expect(Array.from(cascade.tags.keys())).toEqual(["q"]);
          },
        );
      });

      it("voids the rule when the argument is not a single identifier", function (done) {
        parseCascade(
          "p:dir(ltr rtl) { color: red } q { color: blue }",
          done,
          function (cascade) {
            expect(Array.from(cascade.tags.keys())).toEqual(["q"]);
          },
        );
      });

      it("voids the rule when the argument is a string", function (done) {
        parseCascade(
          'p:dir("ltr") { color: red } q { color: blue }',
          done,
          function (cascade) {
            expect(Array.from(cascade.tags.keys())).toEqual(["q"]);
          },
        );
      });

      it("voids the rule when used without an argument list", function (done) {
        parseCascade(
          "p:dir { color: red } q { color: blue }",
          done,
          function (cascade) {
            expect(Array.from(cascade.tags.keys())).toEqual(["q"]);
          },
        );
      });

      it("voids only the enclosing rule inside :not()", function (done) {
        parseCascade(
          "p:not(:dir()) { color: red } q { color: blue }",
          done,
          function (cascade) {
            expect(Array.from(cascade.tags.keys())).toEqual(["q"]);
          },
        );
      });

      it("drops only the alternative from a forgiving list", function (done) {
        parseCascade(
          "div:is(:dir(), .x) span { color: red }",
          done,
          function (cascade) {
            expect(cascade.tags.get("*").condition.firstActions.length).toBe(1);
            expect(cascade.tags.get("span")).toBeDefined();
          },
        );
      });

      it("keeps the selectors after the comma when the only alternative is voided", function (done) {
        parseCascade(
          "p:is(:dir()), q { color: red }",
          done,
          function (cascade) {
            expect(Array.from(cascade.tags.keys())).toEqual(["p", "q"]);
            expect(cascade.tags.get("p").condition.condition).toBe("");
          },
        );
      });

      it("drops only the alternative when the void starts two lists deep", function (done) {
        parseCascade(
          "div:is(:not(:dir()), .x) span { color: red }",
          done,
          function (cascade) {
            expect(cascade.tags.get("*").condition.firstActions.length).toBe(1);
            expect(cascade.tags.get("span")).toBeDefined();
          },
        );
      });

      it("voids the selectors before and after when :has() holds it", function (done) {
        parseCascade(
          "a, b:has(:dir()), c { color: red } e { color: blue }",
          done,
          function (cascade) {
            expect(Array.from(cascade.tags.keys())).toEqual(["e"]);
          },
        );
      });

      it("balances nested parentheses in an invalid argument", function (done) {
        parseCascade(
          "div:is(:dir(a(b)), .x) span { color: red }",
          done,
          function (cascade) {
            expect(cascade.tags.get("*").condition.firstActions.length).toBe(1);
            expect(cascade.tags.get("span")).toBeDefined();
          },
        );
      });

      it("keeps the source text of a forgiving list :has() takes", function (done) {
        parseCascade(
          "div:has(:is(:dir())) { color: red }",
          done,
          function (cascade) {
            var action = cascade.tags.get("div").condition;
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
            expect(Array.from(cascade.tags.keys())).toEqual(["q"]);
          },
        );
      });

      it("keeps the selectors after the comma inside :where()", function (done) {
        parseCascade(
          "p:where(:dir()), q { color: red }",
          done,
          function (cascade) {
            expect(Array.from(cascade.tags.keys())).toEqual(["p", "q"]);
            expect(cascade.tags.get("p").condition.condition).toBe("");
          },
        );
      });

      it("keeps the rule inside :not()", function (done) {
        parseCascade(
          ":not(:dir(ltr)) + div { color: red }",
          done,
          function (cascade) {
            expect(cascade.tags.get("*").condition).toEqual(
              jasmine.any(adapt_csscasc.MatchesNoneAction),
            );
            expect(
              cascade.tags.get("*").condition.firstActions[0].condition,
            ).toEqual(jasmine.any(adapt_csscasc.MatchesNativeSelectorAction));
            expect(cascade.tags.get("*").chained).toEqual(
              jasmine.any(adapt_csscasc.ConditionItemAction),
            );
            expect(cascade.tags.get("div")).toBeDefined();
          },
        );
      });

      it("keeps the source text of the alternative :has() takes", function (done) {
        parseCascade(
          "div:has(*:dir(ltr)) { color: red }",
          done,
          function (cascade) {
            var action = cascade.tags.get("div").condition;
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
          expect(cascade.tags.get("div")).toEqual(
            jasmine.any(adapt_csscasc.ConditionItemAction),
          );
        });
      });

      it("registers a following sibling condition before the chain restarts", function (done) {
        parseCascade("div ~ p { color: red }", done, function (cascade) {
          expect(cascade.tags.get("div")).toEqual(
            jasmine.any(adapt_csscasc.ConditionItemAction),
          );
        });
      });

      it("keeps the source text of the alternatives :has() takes", function (done) {
        parseCascade("div:has(p, q) { color: red }", done, function (cascade) {
          var action = cascade.tags.get("div").condition;
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
            var action = cascade.tags.get("div").condition;
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
          expect(Array.from(cascade.ids.keys())).toEqual(["a"]);
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
        expect(Array.from(cascade.tags.keys())).toEqual(["div"]);
        expect(cascade.tags.get("div")).toEqual(
          jasmine.any(adapt_csscasc.ApplyRuleAction),
        );
      });

      it("keeps the view condition of a selector out of the next rule", function (done) {
        parseCascade(
          "p::nth-fragment(2n+1) { color: red } q { color: blue }",
          done,
          function (cascade) {
            expect(cascade.tags.get("q").viewConditionId).toBeNull();
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

    describe("valid but unsupported selectors", function () {
      var handler;

      beforeEach(function () {
        handler = cascadeParserHandler(
          new adapt_exprs.LexicalScope(null),
          adapt_cssvalid.baseValidatorSet(),
        );
        handler.startSelectorRule();
      });

      function expectNeverMatching() {
        expect(handler.selectorListVoided).toBe(false);
        expect(handler.chain.actions.length).toBe(1);
        var action = handler.chain.actions[0];
        expect(action).toEqual(jasmine.any(adapt_csscasc.CheckConditionAction));
        expect(action.condition).toBe("");
      }

      it("keeps :host as a never-matching selector", function () {
        handler.pseudoclassSelector("host", null);

        expectNeverMatching();
      });

      it("keeps the functional form :host(.foo) as a never-matching selector", function () {
        handler.pseudoclassSelector("host", [".foo"]);

        expectNeverMatching();
      });

      it("follows the host browser on :host-context(.foo)", function () {
        // `:host-context()` is supported by Chrome only; a browser that does
        // not recognize it treats the selector as invalid, and so does this
        // handler.
        handler.pseudoclassSelector("host-context", [".foo"]);

        if (CSS.supports("selector(:host-context(.foo))")) {
          expectNeverMatching();
        } else {
          expect(handler.selectorListVoided).toBe(true);
        }
      });

      it("voids the selector list when a functional pseudo-class argument is invalid", function () {
        handler.pseudoclassSelector("host", ["a b"]);

        expect(handler.selectorListVoided).toBe(true);
      });

      it("voids the selector list for an escaped name that is not valid CSS", function () {
        // `:\69s\28 \.foo` is one pseudo-class name, not `:is(.foo)`.
        handler.pseudoclassSelector("is(.foo", null);

        expect(handler.selectorListVoided).toBe(true);
      });

      it("voids the selector list for a pseudo-class that is not valid CSS", function () {
        handler.pseudoclassSelector("this-is-not-css", null);

        expect(handler.selectorListVoided).toBe(true);
      });

      it("keeps ::selection as a never-matching selector", function () {
        handler.pseudoelementSelector("selection", null);

        expectNeverMatching();
      });

      it("keeps ::slotted(.foo) as a never-matching selector", function () {
        handler.pseudoelementSelector("slotted", [".foo"]);

        expectNeverMatching();
      });

      it("voids the selector list when a functional pseudo-element argument is invalid", function () {
        handler.pseudoelementSelector("slotted", ["a b"]);

        expect(handler.selectorListVoided).toBe(true);
      });

      it("voids the selector list for a pseudo-element that is not valid CSS", function () {
        handler.pseudoelementSelector("this-is-not-css", null);

        expect(handler.selectorListVoided).toBe(true);
      });
    });

    describe("valid but unsupported selectors in a selector list", function () {
      function parseAndCheck(done, text, fn) {
        var handler = cascadeParserHandler(
          new adapt_exprs.LexicalScope(null),
          adapt_cssvalid.baseValidatorSet(),
        );
        var tokenizer = new adapt_csstok.Tokenizer(text, handler.owner);

        adapt_task.start(function () {
          adapt_cssparse
            .parseStylesheet(tokenizer, handler.owner, null, null, null)
            .then(function (result) {
              expect(result).toBe(true);
              fn(handler);
              done();
            });
          return adapt_task.newResult(true);
        });
      }

      it("keeps the rest of the selector list when it contains :host", function (done) {
        parseAndCheck(done, ":host, p { color: red; }", function (handler) {
          expect(Array.from(handler.cascade.tags.keys())).toContain("p");
        });
      });

      it("parses a compound selector argument of ::slotted()", function (done) {
        parseAndCheck(
          done,
          "x::slotted(.foo), p { color: red; }",
          function (handler) {
            expect(Array.from(handler.cascade.tags.keys())).toContain("p");
          },
        );
      });

      it("voids the whole selector list when ::slotted() has an invalid argument", function (done) {
        parseAndCheck(
          done,
          "::slotted(a b), p { color: red; }",
          function (handler) {
            expect(Array.from(handler.cascade.tags.keys())).not.toContain("p");
          },
        );
      });

      it("voids the whole selector list when ::part() has an invalid argument", function (done) {
        parseAndCheck(
          done,
          "::part(#x), p { color: red; }",
          function (handler) {
            expect(Array.from(handler.cascade.tags.keys())).not.toContain("p");
          },
        );
      });

      it("keeps a pseudo-class that follows an unsupported pseudo-element", function (done) {
        parseAndCheck(
          done,
          "::part(button):hover, p { color: red; }",
          function (handler) {
            expect(Array.from(handler.cascade.tags.keys())).toContain("p");
          },
        );
      });

      it("voids the whole selector list when it contains an invalid selector", function (done) {
        parseAndCheck(
          done,
          ":this-is-not-css, p { color: red; }",
          function (handler) {
            expect(Array.from(handler.cascade.tags.keys())).not.toContain("p");
          },
        );
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

  describe("applyCalcFilter validity of a math function", function () {
    function newContext() {
      return new adapt_exprs.Context(
        new adapt_exprs.LexicalScope(null),
        800,
        600,
        16,
        20,
      );
    }

    function parseValue(cssText) {
      return adapt_cssparse.parseValue(
        new adapt_exprs.LexicalScope(null),
        new adapt_csstok.Tokenizer(cssText, null),
        "",
      );
    }

    function applyCalcFilter(style) {
      var cascadeInstance = {
        context: newContext(),
        root: document.createElement("div"),
        scope: new adapt_exprs.LexicalScope(null),
      };
      cascadeInstance.applyCalcFilter =
        adapt_csscasc.CascadeInstance.prototype.applyCalcFilter;
      cascadeInstance.applyCalcFilter(style, cascadeInstance.context);
      return style;
    }

    it("does not make a math function that the browser rejects valid", function () {
      // `calc(round(20px))` is invalid for a length, because the one-argument
      // `round()` is a `<number>` (CSS Values 4 §10.3), and
      // `calc(mod(20px, 7))` mixes a length and a number: the browser rejects
      // such a declaration and keeps the initial value, so this engine must
      // not turn it into the evaluated length. The evaluation is generic (it
      // also serves the values that only this engine resolves), so the
      // original function is checked against the property first. (Review)
      var style = {
        width: new adapt_csscasc.CascadeValue(
          parseValue("calc(round(20px))"),
          1,
        ),
        "margin-left": new adapt_csscasc.CascadeValue(
          parseValue("calc(mod(20px, 7))"),
          1,
        ),
      };
      applyCalcFilter(style);
      expect(style["width"].value.toString()).toBe("unset");
      expect(style["margin-left"].value.toString()).toBe("unset");
    });

    it("evaluates a math function that the browser accepts", function () {
      var style = {
        width: new adapt_csscasc.CascadeValue(
          parseValue("calc(round(20px, 7px))"),
          1,
        ),
      };
      applyCalcFilter(style);
      expect(style["width"].value.toString()).toBe("21px");
    });

    it("keeps a function that only this engine resolves", function () {
      // A value of a function that the browser does not know, e.g. the
      // `leader()` of a `content` declaration, is not a math function: the
      // check against the property must not reject it. The internal page
      // viewport units are checked as the lengths they are. (Review)
      var style = {
        content: new adapt_csscasc.CascadeValue(
          parseValue("leader(dotted)"),
          1,
        ),
        width: new adapt_csscasc.CascadeValue(parseValue("min(2pvw, 50px)"), 1),
      };
      applyCalcFilter(style);
      expect(style["content"].value.toString()).toBe("leader(dotted)");
      expect(style["width"].value.toString()).toBe("min(2pvw,50px)");
    });

    it("preserves legacy calc arithmetic with a unitless zero", function () {
      var style = {
        "margin-left": new adapt_csscasc.CascadeValue(
          parseValue("calc(0 - 10px)"),
          1,
        ),
        "padding-left": new adapt_csscasc.CascadeValue(
          parseValue("calc(20px - calc(0 - 10px))"),
          1,
        ),
      };
      applyCalcFilter(style);
      expect(style["margin-left"].value.toString()).toBe("-10px");
      expect(style["padding-left"].value.toString()).toBe("30px");
    });

    it("validates math types in Vivliostyle page properties", function () {
      [
        "margin-inside",
        "margin-outside",
        "padding-inside",
        "padding-outside",
        "border-inside-width",
        "border-outside-width",
        "inside",
        "outside",
        "block-start",
        "block-end",
        "inline-start",
        "inline-end",
        "min-page-width",
        "min-page-height",
        "snap-width",
        "snap-height",
        "float-min-wrap-block",
        "bleed",
        "crop-offset",
      ].forEach((name) => {
        [
          ["calc(mod(20px, 7))", "unset"],
          ["calc(mod(20px, 7px))", "6px"],
        ].forEach(([input, expected]) => {
          var style = {};
          style[name] = new adapt_csscasc.CascadeValue(parseValue(input), 1);
          applyCalcFilter(style);
          expect(style[name].value.toString())
            .withContext(name + ": " + input)
            .toBe(expected);
        });
      });
    });

    it("rejects percentage math in length-only page properties", function () {
      var style = {};
      ["margin-inside", "padding-outside", "bleed", "crop-offset"].forEach(
        (name) => {
          style[name] = new adapt_csscasc.CascadeValue(
            parseValue("calc(mod(20%, 7%))"),
            1,
          );
        },
      );
      applyCalcFilter(style);
      expect(style["margin-inside"].value.toString()).toBe("calc(mod(20%,7%))");
      expect(style["padding-outside"].value.toString()).toBe(
        "calc(mod(20%,7%))",
      );
      expect(style["bleed"].value.toString()).toBe("unset");
      expect(style["crop-offset"].value.toString()).toBe("unset");
    });

    it("validates math after expanding inset page aliases", function () {
      ["inset-inside", "inset-outside"].forEach((name) => {
        var style = {};
        var scope = new adapt_exprs.LexicalScope(null);
        adapt_cssvalid
          .baseValidatorSet()
          .validatePropertyAndHandleShorthand(
            name,
            parseValue("calc(mod(20px, 7))"),
            false,
            scope,
            {
              simpleProperty: function (propName, value) {
                style[propName] = new adapt_csscasc.CascadeValue(value, 1);
              },
            },
          );
        var expandedName = name.replace("inset-", "");
        expect(style[expandedName]).withContext(name).toBeDefined();
        applyCalcFilter(style);
        expect(style[expandedName].value.toString())
          .withContext(name)
          .toBe("unset");
      });
    });

    it("validates number-only math in Vivliostyle properties", function () {
      ["flow-linger", "flow-priority", "page", "utilization"].forEach(
        (name) => {
          [
            ["calc(mod(20px, 7px))", "unset"],
            ["calc(mod(20, 7))", "6"],
          ].forEach(([input, expected]) => {
            var style = {};
            style[name] = new adapt_csscasc.CascadeValue(parseValue(input), 1);
            applyCalcFilter(style);
            expect(style[name].value.toString())
              .withContext(name + ": " + input)
              .toBe(expected);
          });
        },
      );
    });

    it("preserves unrestricted utilization number calculations", function () {
      [
        ["calc(min(-0.5, 1))", "-0.5"],
        ["calc(max(0.25, 0.5))", "0.5"],
        ["calc(mod(-20, 7))", "1"],
        ["calc(min(20px, 7px))", "unset"],
        ["calc(min(20%, 7%))", "unset"],
      ].forEach(([input, expected]) => {
        var style = {
          utilization: new adapt_csscasc.CascadeValue(parseValue(input), 1),
        };
        applyCalcFilter(style);
        expect(style.utilization.value.toString())
          .withContext(input)
          .toBe(expected);
      });
    });

    it("checks min, max, and clamp types inside calc", function () {
      [
        ["calc(min(20px, 7))", "unset"],
        ["calc(max(20px, 7))", "unset"],
        ["calc(clamp(7, 20px, 30px))", "unset"],
        ["calc(min(20px, 7px))", "7px"],
        ["calc(max(20px, 7px))", "20px"],
        ["calc(clamp(7px, 20px, 30px))", "calc(clamp(7px,20px,30px))"],
        ["calc(min(2pvw, 7))", "unset"],
      ].forEach(([input, expected]) => {
        var style = {
          width: new adapt_csscasc.CascadeValue(parseValue(input), 1),
        };
        applyCalcFilter(style);
        expect(style.width.value.toString()).withContext(input).toBe(expected);
      });
    });

    it("validates each page size dimension independently of native size support", function () {
      var nativeSupports = CSS.supports.bind(CSS);
      var supports = spyOn(CSS, "supports");
      [true, false].forEach((sizeSupported) => {
        supports.and.callFake((name, value) =>
          name === "size" ? sizeSupported : nativeSupports(name, value),
        );
        [
          ["calc(min(20px, 7))", "unset"],
          ["calc(min(20px, 7)) 30px", "unset"],
          ["30px calc(min(20px, 7))", "unset"],
          ["calc(min(20%, 7%)) 30px", "unset"],
          ["calc(min(20, 7))", "unset"],
          ["calc(min(20px, 7px))", "7px"],
          ["calc(min(20px, 7px)) calc(max(20px, 30px))", "7px 30px"],
          ["calc(20px - calc(0 - 10px)) calc(min(20px, 7px))", "30px 7px"],
          ["a4 landscape", "a4 landscape"],
          ["auto", "auto"],
        ].forEach(([input, expected]) => {
          var style = {
            size: new adapt_csscasc.CascadeValue(parseValue(input), 1),
          };
          applyCalcFilter(style);
          expect(style.size.value.toString())
            .withContext(input + ", native size: " + sizeSupported)
            .toBe(expected);
        });
      });
      expect(supports.calls.allArgs().some(([name]) => name === "size")).toBe(
        false,
      );
    });

    it("evaluates calculations in Vivliostyle page properties", function () {
      var style = {};
      ["margin-inside", "margin-outside", "bleed", "crop-offset"].forEach(
        (name) => {
          style[name] = new adapt_csscasc.CascadeValue(
            parseValue("calc(20px + 5px)"),
            1,
          );
        },
      );
      applyCalcFilter(style);
      Object.keys(style).forEach((name) => {
        expect(style[name].value.toString()).withContext(name).toBe("25px");
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

    it("is left to the browser when there is nothing left to roll back to", function () {
      var style = {};
      declare(style, red, adapt_cssparse.SPECIFICITY_AUTHOR);
      declare(
        style,
        adapt_css.ident.revert,
        adapt_cssparse.SPECIFICITY_AUTHOR + 1,
      );

      expect(resolved(style)).toBe(adapt_css.ident.revert);
    });

    it("leaves revert-layer to the browser when there is nothing left to roll back to", function () {
      var tree = new adapt_csscasc.CascadeLayerTree();
      var first = tree.register(null, ["first"]);
      var style = {};
      declare(style, red, adapt_cssparse.SPECIFICITY_AUTHOR, first);
      declare(
        style,
        adapt_css.ident.revert_layer,
        adapt_cssparse.SPECIFICITY_AUTHOR + 1,
        first,
      );

      expect(resolved(style)).toBe(adapt_css.ident.revert_layer);
    });

    it("leaves revert-rule to the browser when there is nothing left to roll back to", function () {
      var style = {};
      declare(style, red, adapt_cssparse.SPECIFICITY_AUTHOR, null, 1);
      declare(
        style,
        adapt_css.ident.revert_rule,
        adapt_cssparse.SPECIFICITY_AUTHOR + 1,
        null,
        1,
      );

      expect(resolved(style)).toBe(adapt_css.ident.revert_rule);
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

    // A keyword that a var() substitution puts into a declaration is not
    // canonicalized, so the rollback kind has to be dispatched
    // case-insensitively: mixing the kinds up would drop the declarations of
    // the wrong origins or rules. (Review)
    it("rolls a mixed-case revert-layer back to the previous layer", function () {
      var tree = new adapt_csscasc.CascadeLayerTree();
      var first = tree.register(null, ["first"]);
      var second = tree.register(null, ["second"]);
      var style = {};
      declare(style, green, adapt_cssparse.SPECIFICITY_AUTHOR, first);
      declare(
        style,
        adapt_css.getName("REVERT-LAYER"),
        adapt_cssparse.SPECIFICITY_AUTHOR,
        second,
      );

      expect(resolved(style)).toBe(green);
    });

    it("keeps the declarations of other rules for a mixed-case revert-rule", function () {
      var style = {};
      declare(style, green, adapt_cssparse.SPECIFICITY_AUTHOR, null, 1);
      declare(style, red, adapt_cssparse.SPECIFICITY_AUTHOR + 1, null, 2);
      declare(
        style,
        adapt_css.getName("Revert-Rule"),
        adapt_cssparse.SPECIFICITY_AUTHOR + 2,
        null,
        2,
      );

      expect(resolved(style)).toBe(green);
    });

    it("reports the kind of a rollback keyword of any casing", function () {
      expect(adapt_css.getRollbackKind(adapt_css.ident.revert)).toBe("revert");
      expect(adapt_css.getRollbackKind(adapt_css.ident.revert_layer)).toBe(
        "revert-layer",
      );
      expect(adapt_css.getRollbackKind(adapt_css.getName("REVERT-UNIT"))).toBe(
        null,
      );
      expect(adapt_css.getRollbackKind(adapt_css.getName("REVERT-RULE"))).toBe(
        "revert-rule",
      );
      expect(adapt_css.getRollbackKind(new adapt_css.Num(1))).toBe(null);
      expect(adapt_css.isRollbackValue(adapt_css.getName("Revert-Layer"))).toBe(
        true,
      );
    });
  });

  describe("font keywords", function () {
    function cascadeValue(value) {
      return new adapt_csscasc.CascadeValue(value, 0);
    }

    function newContext() {
      return new adapt_exprs.Context(
        new adapt_exprs.LexicalScope(null),
        800,
        600,
        16,
        20,
      );
    }

    function resolveFontValue(props, propName, value) {
      var visitor = new adapt_csscasc.InheritanceVisitor(props, newContext());
      visitor.setPropName(propName);
      return value.visit(visitor);
    }

    describe("resolveRelativeFontSizeKeyword", function () {
      it("multiplies the parent font size by 1.2 for larger", function () {
        expect(
          adapt_csscasc.resolveRelativeFontSizeKeyword(
            adapt_css.ident.larger,
            16,
          ),
        ).toBe(19.2);
      });

      it("divides the parent font size by 1.2 for smaller", function () {
        expect(
          adapt_csscasc.resolveRelativeFontSizeKeyword(
            adapt_css.ident.smaller,
            16,
          ),
        ).toBeCloseTo(13.3333, 3);
      });
    });

    describe("CSS-wide keywords", function () {
      it("recognizes them whatever the casing is", function () {
        // A var() substitution preserves the casing of the custom property,
        // e.g. the `INITIAL` of `float: var(--missing, INITIAL)`, which the
        // browser treats as `initial`. (Review)
        ["inherit", "INHERIT", "Initial", "unset", "UNSET"].forEach((name) => {
          expect(adapt_css.isDefaultingValue(adapt_css.getName(name))).toBe(
            true,
          );
        });
        ["revert", "REVERT", "revert-layer"].forEach((name) => {
          expect(adapt_css.isDefaultingValue(adapt_css.getName(name))).toBe(
            true,
          );
        });
        expect(adapt_css.isDefaultingValue(adapt_css.getName("auto"))).toBe(
          false,
        );
        expect(adapt_css.isDefaultingValue(null)).toBe(false);
      });

      it("maps the keywords of a substitution to the canonical ones", function () {
        // The rest of the cascade compares these keywords with the canonical
        // identifiers by identity. (Review)
        expect(
          adapt_css.canonicalWideKeyword(adapt_css.getName("INHERIT")),
        ).toBe(adapt_css.ident.inherit);
        expect(
          adapt_css.canonicalWideKeyword(adapt_css.getName("Initial")),
        ).toBe(adapt_css.ident.initial);
        expect(adapt_css.canonicalWideKeyword(adapt_css.getName("UNSET"))).toBe(
          adapt_css.ident.unset,
        );
        // Anything else is kept, a rollback keyword included (its checks are
        // insensitive to the casing already).
        const revert = adapt_css.getName("REVERT");
        expect(adapt_css.canonicalWideKeyword(revert)).toBe(revert);
        const numeric = new adapt_css.Numeric(1, "px");
        expect(adapt_css.canonicalWideKeyword(numeric)).toBe(numeric);
      });
    });

    describe("resolveAbsoluteFontSizeKeyword", function () {
      it("maps the absolute size keywords to the browsers' table", function () {
        var expected = {
          "xx-small": 9,
          "x-small": 10,
          small: 13,
          medium: 16,
          large: 18,
          "x-large": 24,
          "xx-large": 32,
          "xxx-large": 48,
        };
        for (var keyword in expected) {
          expect(
            adapt_csscasc.resolveAbsoluteFontSizeKeyword(
              adapt_css.getName(keyword),
              16,
            ),
          ).toBe(expected[keyword]);
        }
      });

      it("resolves xxx-large, which CSS Fonts 4 added", function () {
        // Modern browsers accept `xxx-large`, so the validator passes it
        // through and it must not stay an identifier: it is three times the
        // default font size. (Review)
        expect(
          adapt_csscasc.resolveAbsoluteFontSizeKeyword(
            adapt_css.getName("xxx-large"),
            16,
          ),
        ).toBe(48);
        expect(
          adapt_csscasc.resolveAbsoluteFontSizeKeyword(
            adapt_css.getName("xxx-large"),
            20,
          ),
        ).toBe(60);
      });

      it("uses the browsers' table for the usual default sizes", function () {
        // The engines look the keyword up in a table when the default font
        // size is 9..16px: with a 12px default, `small` is 10px and not the
        // 13/16 x 12px = 9.75px of a linear scaling. (Review)
        expect(
          adapt_csscasc.resolveAbsoluteFontSizeKeyword(
            adapt_css.getName("small"),
            12,
          ),
        ).toBe(10);
        expect(
          adapt_csscasc.resolveAbsoluteFontSizeKeyword(
            adapt_css.getName("x-large"),
            12,
          ),
        ).toBe(18);
        expect(
          adapt_csscasc.resolveAbsoluteFontSizeKeyword(
            adapt_css.getName("xx-large"),
            12,
          ),
        ).toBe(24);
      });

      it("uses the browsers' factors outside the table range", function () {
        // Outside 9..16px the engines apply the factors of CSS Fonts 4, with
        // 8/9 rounded to 0.89: with a 20px default, `small` is 0.89 x 20px =
        // 17.8px and `large` is 1.2 x 20px = 24px. (Review)
        expect(
          adapt_csscasc.resolveAbsoluteFontSizeKeyword(
            adapt_css.getName("small"),
            20,
          ),
        ).toBeCloseTo(17.8, 3);
        expect(
          adapt_csscasc.resolveAbsoluteFontSizeKeyword(
            adapt_css.getName("large"),
            20,
          ),
        ).toBeCloseTo(24, 3);
        expect(
          adapt_csscasc.resolveAbsoluteFontSizeKeyword(
            adapt_css.getName("xx-small"),
            20,
          ),
        ).toBeCloseTo(12, 3);
      });

      it("returns null for other values", function () {
        expect(
          adapt_csscasc.resolveAbsoluteFontSizeKeyword(
            adapt_css.ident.larger,
            16,
          ),
        ).toBeNull();
        expect(
          adapt_csscasc.resolveAbsoluteFontSizeKeyword(
            new adapt_css.Numeric(1.5, "em"),
            16,
          ),
        ).toBeNull();
      });

      it("matches the keywords case-insensitively", function () {
        // A keyword substituted from a custom property (`var()`) is not
        // canonicalized to lowercase by the validator. (Issue #2174 follow-up)
        expect(
          adapt_csscasc.resolveAbsoluteFontSizeKeyword(
            adapt_css.getName("LARGE"),
            16,
          ),
        ).toBe(18);
      });
    });

    describe("hasKeywordName", function () {
      it("compares the keyword names case-insensitively", function () {
        expect(
          adapt_csscasc.hasKeywordName(adapt_css.ident.larger, "larger"),
        ).toBe(true);
        expect(
          adapt_csscasc.hasKeywordName(adapt_css.getName("LARGER"), "larger"),
        ).toBe(true);
        expect(
          adapt_csscasc.hasKeywordName(adapt_css.ident.smaller, "larger"),
        ).toBe(false);
        expect(
          adapt_csscasc.hasKeywordName(
            new adapt_css.Numeric(2, "em"),
            "larger",
          ),
        ).toBe(false);
      });
    });

    describe("resolveRelativeFontWeight", function () {
      var bolder = adapt_css.ident.bolder;
      var lighter = adapt_css.ident.lighter;

      it("maps bolder per the CSS Fonts 4 relative weights table", function () {
        expect(adapt_csscasc.resolveRelativeFontWeight(bolder, 100)).toBe(400);
        expect(adapt_csscasc.resolveRelativeFontWeight(bolder, 200)).toBe(400);
        expect(adapt_csscasc.resolveRelativeFontWeight(bolder, 300)).toBe(400);
        expect(adapt_csscasc.resolveRelativeFontWeight(bolder, 400)).toBe(700);
        expect(adapt_csscasc.resolveRelativeFontWeight(bolder, 500)).toBe(700);
        expect(adapt_csscasc.resolveRelativeFontWeight(bolder, 600)).toBe(900);
        expect(adapt_csscasc.resolveRelativeFontWeight(bolder, 700)).toBe(900);
        expect(adapt_csscasc.resolveRelativeFontWeight(bolder, 800)).toBe(900);
        expect(adapt_csscasc.resolveRelativeFontWeight(bolder, 900)).toBe(900);
      });

      it("maps lighter per the CSS Fonts 4 relative weights table", function () {
        expect(adapt_csscasc.resolveRelativeFontWeight(lighter, 100)).toBe(100);
        expect(adapt_csscasc.resolveRelativeFontWeight(lighter, 200)).toBe(100);
        expect(adapt_csscasc.resolveRelativeFontWeight(lighter, 300)).toBe(100);
        expect(adapt_csscasc.resolveRelativeFontWeight(lighter, 400)).toBe(100);
        expect(adapt_csscasc.resolveRelativeFontWeight(lighter, 500)).toBe(100);
        expect(adapt_csscasc.resolveRelativeFontWeight(lighter, 600)).toBe(400);
        expect(adapt_csscasc.resolveRelativeFontWeight(lighter, 700)).toBe(400);
        expect(adapt_csscasc.resolveRelativeFontWeight(lighter, 800)).toBe(700);
        expect(adapt_csscasc.resolveRelativeFontWeight(lighter, 900)).toBe(700);
      });

      it("uses the cutoffs of the CSS Fonts 4 table for weights that are not multiples of 100", function () {
        // Browsers (checked in Chromium and WebKit): bolder uses 400 below
        // 350, 700 below 550 and 900 otherwise.
        expect(adapt_csscasc.resolveRelativeFontWeight(bolder, 349)).toBe(400);
        expect(adapt_csscasc.resolveRelativeFontWeight(bolder, 350)).toBe(700);
        expect(adapt_csscasc.resolveRelativeFontWeight(bolder, 549)).toBe(700);
        expect(adapt_csscasc.resolveRelativeFontWeight(bolder, 550)).toBe(900);
        // A heavier inherited weight than 900 is kept as it is (the numeric
        // range of font-weight goes up to 1000).
        expect(adapt_csscasc.resolveRelativeFontWeight(bolder, 901)).toBe(901);
        expect(adapt_csscasc.resolveRelativeFontWeight(bolder, 950)).toBe(950);
        expect(adapt_csscasc.resolveRelativeFontWeight(bolder, 1000)).toBe(
          1000,
        );
        // lighter uses 100 below 550, 400 below 750 and 700 otherwise; a weight
        // that is already lighter than 100 is kept.
        expect(adapt_csscasc.resolveRelativeFontWeight(lighter, 549)).toBe(100);
        expect(adapt_csscasc.resolveRelativeFontWeight(lighter, 550)).toBe(400);
        expect(adapt_csscasc.resolveRelativeFontWeight(lighter, 749)).toBe(400);
        expect(adapt_csscasc.resolveRelativeFontWeight(lighter, 750)).toBe(700);
        expect(adapt_csscasc.resolveRelativeFontWeight(lighter, 99)).toBe(99);
        expect(adapt_csscasc.resolveRelativeFontWeight(lighter, 1)).toBe(1);
      });
    });

    describe("usesLineHeightUnit", function () {
      it("detects the lh unit of a value", function () {
        var parse = (text) =>
          adapt_cssparse.parseValue(
            new adapt_exprs.LexicalScope(null),
            new adapt_csstok.Tokenizer(text, null),
            "",
          );
        expect(
          adapt_csscasc.usesLineHeightUnit(parse("calc(1lh + 10px)")),
        ).toBe(true);
        expect(adapt_csscasc.usesLineHeightUnit(parse("calc(2 * 20px)"))).toBe(
          false,
        );
        expect(adapt_csscasc.usesLineHeightUnit(new adapt_css.Num(1.5))).toBe(
          false,
        );
      });
    });

    describe("resolveLineHeightValueToPx", function () {
      it("resolves the lh unit against the inherited line height", function () {
        // `line-height: calc(1lh + 10px)` with a 40px line height of the
        // parent is 50px, not 26px (the preferred line height of 16px is
        // 19.2px, which the lh unit must not fall back to).
        var func = adapt_cssparse.parseValue(
          new adapt_exprs.LexicalScope(null),
          new adapt_csstok.Tokenizer("calc(1lh + 10px)", null),
          "",
        );
        expect(
          adapt_csscasc.resolveLineHeightValueToPx(newContext(), func, 16, 40),
        ).toBe(50);
      });

      it("resolves a function of unitless numbers against the font size", function () {
        // `min(1, 2)` is the number 1, which is a valid line height: its
        // computed value is the number multiplied by the font size of the
        // element (16px here), not an unresolved length. (Review)
        var func = adapt_cssparse.parseValue(
          new adapt_exprs.LexicalScope(null),
          new adapt_csstok.Tokenizer("min(1, 2)", null),
          "",
        );
        expect(
          adapt_csscasc.resolveLineHeightValueToPx(newContext(), func, 16, 40),
        ).toBe(16);
      });

      it("resolves a number-returning function of a dimension", function () {
        // `min(sign(20px), 2)` is the number 1: the dimension of the argument
        // of `sign()` belongs to a number and does not make the function a
        // length, so the computed line height is the number multiplied by the
        // font size of the element (16px here), and an element that declares
        // such a function (e.g. the root element) keeps the declaration
        // instead of a fixed px value. (Review)
        var func = adapt_cssparse.parseValue(
          new adapt_exprs.LexicalScope(null),
          new adapt_csstok.Tokenizer("min(sign(20px), 2)", null),
          "",
        );
        expect(
          adapt_csscasc.resolveLineHeightValueToPx(newContext(), func, 16, 40),
        ).toBe(16);
      });

      it("clamps a negative result to the non-negative range", function () {
        // `line-height: calc(1lh - 100px)` with a 40px inherited line height
        // computes to -60, which the non-negative computed-value range of
        // `line-height` clamps to 0. Materializing `-60px` would make the
        // browser reject the declaration and inherit the 40px instead of
        // applying zero. (Review)
        var func = adapt_cssparse.parseValue(
          new adapt_exprs.LexicalScope(null),
          new adapt_csstok.Tokenizer("calc(1lh - 100px)", null),
          "",
        );
        expect(
          adapt_csscasc.resolveLineHeightValueToPx(newContext(), func, 16, 40),
        ).toBe(0);
      });
    });

    describe("isInvalidLineHeight", function () {
      it("rejects the post-substitution forms the browser rejects", function () {
        // `line-height` accepts `normal`, a non-negative number or a
        // non-negative length or percentage, so an unknown keyword or a
        // dimension that a var() substitution put into the declaration is
        // rejected by the browser, which keeps the inherited line height. A
        // math function is allowed until it is evaluated. (Review)
        expect(
          adapt_csscasc.isInvalidLineHeight(
            newContext(),
            adapt_css.getName("nonsense"),
          ),
        ).toBe(true);
        expect(
          adapt_csscasc.isInvalidLineHeight(
            newContext(),
            new adapt_css.Num(-1),
          ),
        ).toBe(true);
        expect(
          adapt_csscasc.isInvalidLineHeight(
            newContext(),
            new adapt_css.Numeric(-5, "px"),
          ),
        ).toBe(true);
        expect(
          adapt_csscasc.isInvalidLineHeight(
            newContext(),
            new adapt_css.Numeric(5, "s"),
          ),
        ).toBe(true);
        expect(
          adapt_csscasc.isInvalidLineHeight(
            newContext(),
            adapt_css.getName("normal"),
          ),
        ).toBe(false);
        expect(
          adapt_csscasc.isInvalidLineHeight(
            newContext(),
            new adapt_css.Num(1.5),
          ),
        ).toBe(false);
        expect(
          adapt_csscasc.isInvalidLineHeight(
            newContext(),
            new adapt_css.Numeric(2, "em"),
          ),
        ).toBe(false);
        expect(
          adapt_csscasc.isInvalidLineHeight(
            newContext(),
            new adapt_css.Func("calc", [new adapt_css.Num(2)]),
          ),
        ).toBe(false);
        // A math function that the browser rejects at computed-value time is
        // invalid as well: the element keeps the inherited line height.
        // (Review)
        expect(
          adapt_csscasc.isInvalidLineHeight(
            newContext(),
            adapt_cssparse.parseValue(
              new adapt_exprs.LexicalScope(null),
              new adapt_csstok.Tokenizer("min(10px, 2)", null),
              "",
            ),
          ),
        ).toBe(true);
        expect(
          adapt_csscasc.isInvalidLineHeight(
            newContext(),
            adapt_cssparse.parseValue(
              new adapt_exprs.LexicalScope(null),
              new adapt_csstok.Tokenizer("calc(1lh - 100px)", null),
              "",
            ),
          ),
        ).toBe(false);
      });

      it("accepts the internal viewport units of this engine", function () {
        // A browser does not know the `pv*` units of this engine, so
        // `CSS.supports()` rejects a declaration that uses one, although this
        // engine resolves it: `line-height: 2pvw` is a valid line height here,
        // and a descendant that resolves an `lh` unit against it must not get
        // the line height of an ancestor instead. (Review)
        expect(
          adapt_csscasc.isInvalidLineHeight(
            newContext(),
            new adapt_css.Numeric(2, "pvw"),
          ),
        ).toBe(false);
        expect(
          adapt_csscasc.isInvalidLineHeight(
            newContext(),
            new adapt_cssparse.parseValue(
              new adapt_exprs.LexicalScope(null),
              new adapt_csstok.Tokenizer("calc(2pvw + 1px)", null),
              "",
            ),
          ),
        ).toBe(false);
        // A dimension that this engine does not resolve either is invalid.
        expect(
          adapt_csscasc.isInvalidLineHeight(
            newContext(),
            new adapt_css.Numeric(5, "s"),
          ),
        ).toBe(true);
        // The internal unit is checked as the length it is: a value that mixes
        // types and an unknown function stay invalid, so that the walk keeps
        // the inherited line height for them, as the browser does. (Review)
        function parse(text) {
          return adapt_cssparse.parseValue(
            new adapt_exprs.LexicalScope(null),
            new adapt_csstok.Tokenizer(text, null),
            "",
          );
        }
        expect(
          adapt_csscasc.isInvalidLineHeight(
            newContext(),
            parse("min(2pvw, 1)"),
          ),
        ).toBe(true);
        expect(
          adapt_csscasc.isInvalidLineHeight(newContext(), parse("foo(2pvw)")),
        ).toBe(true);
        expect(
          adapt_csscasc.isInvalidLineHeight(
            newContext(),
            parse("calc(2pvw + 1px)"),
          ),
        ).toBe(false);
      });

      it("rejects a function whose result is not a number", function () {
        // `CSS.supports()` only knows the syntax, so a supported function that
        // computes `NaN`, e.g. `log(100, 0)`, is not detected by it: such a
        // declaration is invalid at computed-value time as well, and the
        // browser keeps the inherited line height. A function whose value is a
        // number, e.g. `min(1, 2)`, is valid. (Review)
        function parse(text) {
          return adapt_cssparse.parseValue(
            new adapt_exprs.LexicalScope(null),
            new adapt_csstok.Tokenizer(text, null),
            "",
          );
        }
        expect(
          adapt_csscasc.isInvalidLineHeight(newContext(), parse("log(100, 0)")),
        ).toBe(true);
        expect(
          adapt_csscasc.isInvalidLineHeight(
            newContext(),
            parse("round(40px, 0)"),
          ),
        ).toBe(true);
        expect(
          adapt_csscasc.isInvalidLineHeight(newContext(), parse("min(1, 2)")),
        ).toBe(false);
        expect(
          adapt_csscasc.isInvalidLineHeight(
            newContext(),
            parse("round(40px, 7px)"),
          ),
        ).toBe(false);
        // A value that this engine cannot evaluate, e.g. one with a unit that
        // only the browser resolves, is not known to be invalid. (Review)
        expect(
          adapt_csscasc.isInvalidLineHeight(
            newContext(),
            parse("min(1ch, 2px)"),
          ),
        ).toBe(false);
      });
    });

    describe("isSupportedFunctionValue", function () {
      function resolve(text) {
        return adapt_csscasc.resolveFontSizeValueToPx(
          newContext(),
          adapt_cssparse.parseValue(
            new adapt_exprs.LexicalScope(null),
            new adapt_csstok.Tokenizer(text, null),
            "",
          ),
        );
      }

      it("rejects a function whose type the property does not accept", function () {
        // The math functions of CSS Values 4 are evaluated as numbers of the
        // expression language, which cannot see that `round()` rounds a length
        // to a multiple of a number (invalid) or that `sign()` returns a number
        // instead of a length, so the browser decides: the declaration is
        // invalid and the element inherits. (Review)
        expect(resolve("round(20px, 7)")).toBe(null);
        expect(resolve("sign(20px)")).toBe(null);
        // A call whose shape this engine cannot evaluate, e.g. the
        // <rounding-strategy> of round() (an argument that is not a number),
        // is left unresolved as well: the browser resolves it. (Review)
        expect(resolve("round(up, 20px, 7px)")).toBe(null);
        expect(resolve("round(up, 20px)")).toBe(null);
        expect(resolve("round(20px, 7px)")).toBe(21);
        expect(resolve("abs(-20px)")).toBe(20);
        // A function that is valid inside an arithmetic expression: the number
        // that sign() returns is multiplied by a length.
        expect(resolve("calc(sign(20px) * 20px)")).toBe(20);
      });
    });

    describe("browserFontRelativeUnitRatio", function () {
      it("reports the ratio of the units that only the browser resolves", function () {
        // The metrics of these units are not obtainable before the source
        // document is laid out, so CSS Values 4 §6.1 is followed: `ch` and `ex`
        // must be assumed to be 0.5em and `ic` 1em when their metric cannot be
        // determined. `cap` has no numeric assumption there, so the typical cap
        // height of the Latin fonts is used. (Review)
        expect(adapt_csscasc.browserFontRelativeUnitRatio("ch")).toBe(0.5);
        expect(adapt_csscasc.browserFontRelativeUnitRatio("ex")).toBe(0.5);
        expect(adapt_csscasc.browserFontRelativeUnitRatio("cap")).toBe(0.7);
        expect(adapt_csscasc.browserFontRelativeUnitRatio("ic")).toBe(1);
        expect(adapt_csscasc.browserFontRelativeUnitRatio("em")).toBe(null);
        expect(adapt_csscasc.browserFontRelativeUnitRatio("px")).toBe(null);
      });
    });

    describe("getInheritedLineHeight", function () {
      function inheritedLineHeight(fontSize, lineHeight) {
        var props = {
          "font-size": new adapt_csscasc.CascadeValue(fontSize, 0),
          "line-height": new adapt_csscasc.CascadeValue(lineHeight, 0),
        };
        return new adapt_csscasc.InheritanceVisitor(
          props,
          newContext(),
        ).getInheritedLineHeight();
      }

      it("reduces the math functions of an inherited line height", function () {
        // An ancestor line height that is a math function of CSS Values 4,
        // e.g. `round(40px, 7px)` = 42px, must be resolved as well: a
        // descendant that resolves the `lh` unit against it would otherwise
        // use the line height of the synthetic parent. (Review)
        var props = {
          "font-size": new adapt_csscasc.CascadeValue(
            new adapt_css.Numeric(16, "px"),
            0,
          ),
          "line-height": new adapt_csscasc.CascadeValue(
            adapt_cssparse.parseValue(
              new adapt_exprs.LexicalScope(null),
              new adapt_csstok.Tokenizer("round(40px, 7px)", null),
              "",
            ),
            0,
          ),
        };
        expect(
          new adapt_csscasc.InheritanceVisitor(
            props,
            newContext(),
          ).getInheritedLineHeight(),
        ).toBe(42);
      });

      it("resolves a line height in a unit that only the browser resolves", function () {
        // The `ch`/`ex`/`cap`/`ic` units come from the metrics of the font,
        // which this engine cannot obtain: the assumptions of CSS Values 4 are
        // used against the font size of the element, as the root sizing does,
        // so that a footnote that resolves `1lh` against such a line height
        // does not fall back to the root line height. `5ch` of a 16px font is
        // 5 x 0.5em x 16px = 40px, and `5rem`/`5rlh` are not affected. (Review)
        function inherited(text) {
          var props = {
            "font-size": new adapt_csscasc.CascadeValue(
              new adapt_css.Numeric(16, "px"),
              0,
            ),
            "line-height": new adapt_csscasc.CascadeValue(
              new adapt_cssparse.parseValue(
                new adapt_exprs.LexicalScope(null),
                new adapt_csstok.Tokenizer(text, null),
                "",
              ),
              0,
            ),
          };
          return new adapt_csscasc.InheritanceVisitor(
            props,
            newContext(),
          ).getInheritedLineHeight();
        }
        expect(inherited("5ch")).toBe(40);
        expect(inherited("5ic")).toBe(80);
        expect(inherited("2.5ex")).toBe(20);
      });

      it("resolves a line height in an internal viewport unit", function () {
        // The `pvw` unit of this engine is 1% of the page box width, which the
        // context of this spec gives as its 800px viewport: the footnote that
        // resolves `1lh` against `line-height: 2pvw` uses the 16px of the unit
        // rather than the preferred line height. (Review)
        var props = {
          "font-size": new adapt_csscasc.CascadeValue(
            new adapt_css.Numeric(16, "px"),
            0,
          ),
          "line-height": new adapt_csscasc.CascadeValue(
            new adapt_css.Numeric(2, "pvw"),
            0,
          ),
        };
        expect(
          new adapt_csscasc.InheritanceVisitor(
            props,
            newContext(),
          ).getInheritedLineHeight(),
        ).toBe(16);
        // ... also when the inherited font size is a value that only the
        // browser resolves.
        props["font-size"] = new adapt_csscasc.CascadeValue(
          adapt_css.getName("math"),
          0,
        );
        expect(
          new adapt_csscasc.InheritanceVisitor(
            props,
            newContext(),
          ).getInheritedLineHeight(),
        ).toBe(16);
      });

      it("clamps a negative computed line height to zero", function () {
        // `line-height: min(-10px, -20px)` computes to -20px, which the
        // non-negative computed-value range of `line-height` clamps to 0: a
        // descendant that resolves `calc(1lh + 10px)` against it computes 10px,
        // not 0px from the -20px of the calculation. (Review)
        function inherited(text) {
          var props = {
            "font-size": new adapt_csscasc.CascadeValue(
              new adapt_css.Numeric(16, "px"),
              0,
            ),
            "line-height": new adapt_csscasc.CascadeValue(
              adapt_cssparse.parseValue(
                new adapt_exprs.LexicalScope(null),
                new adapt_csstok.Tokenizer(text, null),
                "",
              ),
              0,
            ),
          };
          return new adapt_csscasc.InheritanceVisitor(
            props,
            newContext(),
          ).getInheritedLineHeight();
        }
        expect(inherited("min(-10px, -20px)")).toBe(0);
        expect(inherited("min(1, 2)")).toBe(16);
      });

      it("resolves an absolute line height without the inherited font size", function () {
        // The inherited font size may be a value that only the browser
        // resolves, e.g. the `math` keyword of an ancestor; an absolute line
        // height does not depend on it, so a descendant that resolves the `lh`
        // unit still finds a length. A relative line height needs the font
        // size, so it stays unknown. (Review)
        expect(
          inheritedLineHeight(
            adapt_css.getName("math"),
            new adapt_css.Numeric(40, "px"),
          ),
        ).toBe(40);
        expect(
          inheritedLineHeight(
            adapt_css.getName("math"),
            new adapt_css.Num(1.5),
          ),
        ).toBe(null);
        // A relative line height is resolved against the given parent font
        // size, which is the metric that the font-relative units refer to.
        // (Review)
        var props = {
          "font-size": new adapt_csscasc.CascadeValue(
            new adapt_css.Numeric(16, "px"),
            0,
          ),
          "line-height": new adapt_csscasc.CascadeValue(
            new adapt_css.Num(1.5),
            0,
          ),
        };
        expect(
          new adapt_csscasc.InheritanceVisitor(
            props,
            newContext(),
          ).getInheritedLineHeight(32),
        ).toBe(48);
      });

      it("materializes a percentage line height where it is declared", function () {
        // The computed value of a percentage line height is the length of the
        // element that declares it, so the accumulated value must be that
        // length: the `150%` declared at 16px is the 24px that a descendant
        // inherits, not the percentage of the 32px of an intervening level,
        // and a unit whose metric only the browser resolves is the assumed
        // size of the declaring level (`5ch` = 5 x 0.5em x 16px = 40px).
        // A function keeps only those values converted, so a function of
        // unitless numbers stays the multiplier that it is, and the
        // percentages of another property are unchanged. (Review)
        var props = {
          "font-size": new adapt_csscasc.CascadeValue(
            new adapt_css.Numeric(16, "px"),
            0,
          ),
        };
        var visitor = new adapt_csscasc.InheritanceVisitor(props, newContext());
        function accumulated(propName, text) {
          visitor.setPropName(propName);
          return adapt_cssparse
            .parseValue(
              new adapt_exprs.LexicalScope(null),
              new adapt_csstok.Tokenizer(text, null),
              "",
            )
            .visit(visitor)
            .toString();
        }
        expect(accumulated("line-height", "150%")).toBe("24px");
        expect(accumulated("line-height", "calc(150%)")).toBe("calc(24px)");
        expect(accumulated("line-height", "min(200%, 40px)")).toBe(
          "min(32px,40px)",
        );
        expect(accumulated("line-height", "5ch")).toBe("40px");
        expect(accumulated("line-height", "2ic")).toBe("32px");
        expect(accumulated("line-height", "calc(1.5)")).toBe("calc(1.5)");
        expect(accumulated("line-height", "1.5")).toBe("1.5");
        expect(accumulated("width", "150%")).toBe("150%");
      });
    });

    describe("isNegativeLiteralLineHeight", function () {
      it("detects the negative literals of a line height", function () {
        // A negative literal is invalid and makes the element inherit the
        // parent line height, while a math function that computes a negative
        // value is valid and is clamped to zero. (Review)
        expect(
          adapt_csscasc.isNegativeLiteralLineHeight(
            new adapt_css.Numeric(-5, "px"),
          ),
        ).toBe(true);
        expect(
          adapt_csscasc.isNegativeLiteralLineHeight(new adapt_css.Num(-2)),
        ).toBe(true);
        expect(
          adapt_csscasc.isNegativeLiteralLineHeight(
            new adapt_css.Numeric(2, "em"),
          ),
        ).toBe(false);
        expect(
          adapt_csscasc.isNegativeLiteralLineHeight(
            adapt_cssparse.parseValue(
              new adapt_exprs.LexicalScope(null),
              new adapt_csstok.Tokenizer("calc(10px - 20px)", null),
              "",
            ),
          ),
        ).toBe(false);
      });
    });

    describe("convertFontSizeToPx", function () {
      it("resolves a unit that only the browser resolves against the parent", function () {
        // `ch` has no unit size here, so it is resolved with the ratio of the
        // default font and the font size of the parent — for detached content
        // that is the source parent whose metrics the element would use before
        // it is reparented, not the synthetic parent it is rendered in.
        // Without a parent font size the value is preserved and resolved by
        // the browser. (Review)
        var fromParent = adapt_csscasc.convertFontSizeToPx(
          new adapt_css.Numeric(5, "ch"),
          32,
          newContext(),
        );
        expect(fromParent.num).toBe(80);
        expect(fromParent.unit).toBe("px");
        var kept = adapt_csscasc.convertFontSizeToPx(
          new adapt_css.Numeric(5, "ch"),
          null,
          newContext(),
        );
        expect(kept.num).toBe(5);
        expect(kept.unit).toBe("ch");
        expect(
          adapt_csscasc.resolveFontSizeValueToPx(
            newContext(),
            new adapt_css.Numeric(2, "ch"),
          ),
        ).toBe(null);
      });
    });

    describe("InheritanceVisitor of the math font size", function () {
      it("resolves the math keyword against the inherited font size", function () {
        // The math font size is 1em of the inherited font size for the depths
        // that this engine represents, so a detached element uses the font
        // size of its source parent instead of the one of the synthetic parent
        // that the browser resolves the keyword in. (Review)
        var props = {
          "font-size": new adapt_csscasc.CascadeValue(
            new adapt_css.Numeric(32, "px"),
            0,
          ),
        };
        var visitor = new adapt_csscasc.InheritanceVisitor(props, newContext());
        visitor.setPropName("font-size");
        var resolved = visitor.visitIdent(adapt_css.getName("math"));
        expect(resolved.num).toBe(32);
        expect(resolved.unit).toBe("px");
        // The keyword of another property, e.g. `font-family: math`, is an
        // ordinary value.
        visitor.setPropName("font-family");
        expect(visitor.visitIdent(adapt_css.getName("math"))).toBe(
          adapt_css.getName("math"),
        );
      });
    });

    describe("InheritanceVisitor with an unresolved font size", function () {
      function visitorWithFontSize(value) {
        var props = {
          "font-size": new adapt_csscasc.CascadeValue(value, 0),
        };
        var visitor = new adapt_csscasc.InheritanceVisitor(props, newContext());
        visitor.setPropName("text-indent");
        return visitor;
      }

      it("leaves an em value to the browser when the size is unresolved", function () {
        // The font size of the element is a unit that only the browser
        // resolves, so a dependent `em` value must not be resolved against the
        // inherited fallback: it is preserved and resolved by the browser
        // against the computed size. (Review)
        var em = new adapt_css.Numeric(1, "em");
        var kept = visitorWithFontSize(
          new adapt_css.Numeric(5, "ch"),
        ).visitNumeric(em);
        expect(kept).toBe(em);
        var converted = visitorWithFontSize(
          new adapt_css.Numeric(32, "px"),
        ).visitNumeric(new adapt_css.Numeric(1, "em"));
        expect(converted.num).toBe(32);
        expect(converted.unit).toBe("px");
      });
    });

    describe("resolveFontSizeValueToPx", function () {
      it("resolves a unitless zero to 0", function () {
        // `font-size: 0` is a Css.Num (not a Css.Numeric) and must be treated
        // as the absolute length `0px`.
        expect(
          adapt_csscasc.resolveFontSizeValueToPx(
            newContext(),
            new adapt_css.Int(0),
          ),
        ).toBe(0);
        expect(
          adapt_csscasc.resolveFontSizeValueToPx(
            newContext(),
            new adapt_css.Num(0),
          ),
        ).toBe(0);
      });

      it("clamps a negative value to zero", function () {
        // `font-size` has a non-negative computed-value range, so a math
        // expression that computes a negative value is clamped to zero.
        expect(
          adapt_csscasc.resolveFontSizeValueToPx(
            newContext(),
            new adapt_css.Numeric(-10, "px"),
            16,
          ),
        ).toBe(0);
        expect(
          adapt_csscasc.resolveFontSizeValueToPx(
            newContext(),
            adapt_cssparse.parseValue(
              new adapt_exprs.LexicalScope(null),
              new adapt_csstok.Tokenizer("calc(10px - 20px)", null),
              "",
            ),
            16,
          ),
        ).toBe(0);
      });

      it("rejects a dimension without a unit size", function () {
        // `font-size: var(--size)` with `--size: 5s` is invalid at
        // computed-value time, so the declaration is rejected and the element
        // inherits the parent font size instead of resolving NaN. (Review)
        expect(
          adapt_csscasc.resolveFontSizeValueToPx(
            newContext(),
            new adapt_css.Numeric(5, "s"),
            16,
          ),
        ).toBe(null);
        expect(
          adapt_csscasc.resolveFontSizeValueToPx(
            newContext(),
            new adapt_css.Numeric(NaN, "px"),
            16,
          ),
        ).toBe(null);
        expect(
          adapt_csscasc.resolveFontSizeValueToPx(
            newContext(),
            new adapt_css.Numeric(Infinity, "px"),
            16,
          ),
        ).toBe(null);
      });

      it("detects an invalid font weight number", function () {
        // CSS Fonts 4 accepts a weight in the 1-1000 range; a number outside
        // it, e.g. one that a var() substitution put into the declaration, is
        // invalid, while a math function that computes such a value is clamped.
        // (Review)
        expect(
          adapt_csscasc.isInvalidFontWeight(
            newContext(),
            new adapt_css.Num(-10),
          ),
        ).toBe(true);
        expect(
          adapt_csscasc.isInvalidFontWeight(newContext(), new adapt_css.Num(0)),
        ).toBe(true);
        expect(
          adapt_csscasc.isInvalidFontWeight(
            newContext(),
            new adapt_css.Num(1001),
          ),
        ).toBe(true);
        expect(
          adapt_csscasc.isInvalidFontWeight(
            newContext(),
            new adapt_css.Num(NaN),
          ),
        ).toBe(true);
        expect(
          adapt_csscasc.isInvalidFontWeight(newContext(), new adapt_css.Num(1)),
        ).toBe(false);
        expect(
          adapt_csscasc.isInvalidFontWeight(
            newContext(),
            new adapt_css.Num(700.5),
          ),
        ).toBe(false);
        expect(
          adapt_csscasc.isInvalidFontWeight(
            newContext(),
            new adapt_css.Num(1000),
          ),
        ).toBe(false);
        expect(
          adapt_csscasc.isInvalidFontWeight(
            newContext(),
            new adapt_css.Int(700),
          ),
        ).toBe(false);
      });

      it("rejects every invalid post-substitution font weight form", function () {
        // `font-weight` accepts a number in the 1-1000 range and the keywords,
        // so an unknown keyword or a dimension that a var() substitution puts
        // into the declaration is invalid as well, while a math function is
        // allowed until it is evaluated. (Review)
        expect(
          adapt_csscasc.isInvalidFontWeight(
            newContext(),
            adapt_css.getName("nonsense"),
          ),
        ).toBe(true);
        expect(
          adapt_csscasc.isInvalidFontWeight(
            newContext(),
            new adapt_css.Numeric(700, "px"),
          ),
        ).toBe(true);
        expect(
          adapt_csscasc.isInvalidFontWeight(
            newContext(),
            new adapt_css.Numeric(1, "em"),
          ),
        ).toBe(true);
        for (const keyword of [
          "normal",
          "bold",
          "bolder",
          "lighter",
          "initial",
          "inherit",
          "unset",
        ]) {
          expect(
            adapt_csscasc.isInvalidFontWeight(
              newContext(),
              adapt_css.getName(keyword),
            ),
          ).toBe(false);
        }
        expect(
          adapt_csscasc.isInvalidFontWeight(
            newContext(),
            new adapt_css.Func("calc", [new adapt_css.Num(650)]),
          ),
        ).toBe(false);
        // A supported function that this engine does not evaluate, e.g.
        // `round(650, 100)`, is valid: the browser computes it, so the
        // declaration must not be dropped. (Review)
        expect(
          adapt_csscasc.isInvalidFontWeight(
            newContext(),
            adapt_cssparse.parseValue(
              new adapt_exprs.LexicalScope(null),
              new adapt_csstok.Tokenizer("round(650, 100)", null),
              "",
            ),
          ),
        ).toBe(false);
        expect(
          adapt_csscasc.isInvalidFontWeight(
            newContext(),
            adapt_cssparse.parseValue(
              new adapt_exprs.LexicalScope(null),
              new adapt_csstok.Tokenizer("min(900px, 1em)", null),
              "",
            ),
          ),
        ).toBe(true);
        // A supported function whose result is not a number, e.g.
        // `log(100, 0)`, and the `NaN` constant are invalid as well: this
        // engine keeps the inherited weight, which a relative keyword of a
        // descendant must resolve against. (The browsers accept such a
        // declaration and censor the `NaN` to zero, which the range of CSS
        // Fonts 4 turns into the weight 1; the difference of that basis is
        // recorded with the limitations of the pull request. Review)
        function invalidFontWeight(text) {
          return adapt_csscasc.isInvalidFontWeight(
            newContext(),
            adapt_cssparse.parseValue(
              new adapt_exprs.LexicalScope(null),
              new adapt_csstok.Tokenizer(text, null),
              "",
            ),
          );
        }
        expect(invalidFontWeight("log(100, 0)")).toBe(true);
        expect(invalidFontWeight("calc(NaN)")).toBe(true);
      });

      it("evaluates number valued math functions of a font weight", function () {
        // The validator passes a browser-supported math function through, e.g.
        // `min(900, 1000)`, which must be reduced before the range is
        // validated: `getFontWeight()` and the cascade use this evaluation.
        // (Review)
        function evaluate(text) {
          return adapt_csscasc.evaluateFontWeightMathFunction(
            newContext(),
            adapt_cssparse.parseValue(
              new adapt_exprs.LexicalScope(null),
              new adapt_csstok.Tokenizer(text, null),
              "",
            ),
          );
        }
        expect(evaluate("min(900, 1000)").num).toBe(900);
        expect(evaluate("max(100, 800)").num).toBe(800);
        expect(evaluate("clamp(100, 500, 900)").num).toBe(500);
        expect(evaluate("calc(650 + 50)").num).toBe(700);
        // not a number: an unsupported argument or a length
        expect(evaluate("min(900px, 1em)")).toBe(null);
        expect(evaluate("nonsense")).toBe(null);
        // The math functions of CSS Values 4 are evaluated as well, so that a
        // relative keyword of a detached descendant resolves against the
        // computed weight of the parent: round(650, 100) is 700 and
        // abs(-650) is 650. (Review)
        expect(evaluate("round(650, 100)").num).toBe(700);
        expect(evaluate("abs(-650)").num).toBe(650);
        // A calculation that overflows to an infinity is clamped to the range
        // of CSS Fonts 4 instead of being left unresolved: `exp(1000)` is
        // 1000, which a detached descendant that uses `bolder` resolves
        // against. (Review)
        expect(evaluate("exp(1000)").num).toBe(1000);
        // ... the same when the calculation is wrapped in a `calc()`, whose
        // result the cascade clamps with the same range. (Review)
        expect(evaluate("calc(exp(1000))").num).toBe(1000);
        expect(evaluate("calc(log(100, 0))")).toBe(null);
        // ... and a result below the range is clamped to its minimum.
        expect(evaluate("min(0, 100)").num).toBe(1);
      });

      it("keeps the rollback keywords of any casing", function () {
        // A var() fallback such as `var(--missing, REVERT)` is not
        // canonicalized, so the keywords must be compared case insensitively:
        // they are not invalid weights, and the cascade resolves them as a
        // rollback. (Review)
        // The Ident constructor rejects a name that already exists, so the
        // names must be looked up through getName().
        expect(
          adapt_csscasc.isInvalidFontWeight(
            newContext(),
            adapt_css.getName("REVERT"),
          ),
        ).toBe(false);
        expect(
          adapt_csscasc.isInvalidFontWeight(
            newContext(),
            adapt_css.getName("REVERT-LAYER"),
          ),
        ).toBe(false);
        expect(adapt_css.isRollbackValue(adapt_css.getName("REVERT"))).toBe(
          true,
        );
      });

      it("preserves a valid font size that cannot be resolved here", function () {
        // The validator passes browser-supported values through, e.g. the
        // `math` keyword or a unit that only the browser resolves, so a
        // detached element must keep them instead of inheriting a numeric
        // value; a value that a substitution made invalid is not preserved.
        // (Review)
        expect(
          adapt_csscasc.isValidUnresolvedFontSize(
            newContext(),
            adapt_css.getName("math"),
          ),
        ).toBe(true);
        expect(
          adapt_csscasc.isValidUnresolvedFontSize(
            newContext(),
            new adapt_css.Numeric(2, "ch"),
          ),
        ).toBe(true);
        expect(
          adapt_csscasc.isValidUnresolvedFontSize(
            newContext(),
            new adapt_css.Numeric(5, "s"),
          ),
        ).toBe(false);
        expect(
          adapt_csscasc.isValidUnresolvedFontSize(
            newContext(),
            adapt_css.getName("nonsense"),
          ),
        ).toBe(false);
        // A supported function whose computation is not a number, e.g.
        // `round(20px, 0px)`, is invalid at computed-value time, so the element
        // keeps the value that the source parent accumulated instead of the
        // declaration. (Review)
        expect(
          adapt_csscasc.isValidUnresolvedFontSize(
            newContext(),
            adapt_cssparse.parseValue(
              new adapt_exprs.LexicalScope(null),
              new adapt_csstok.Tokenizer("round(20px, 0px)", null),
              "",
            ),
          ),
        ).toBe(false);
        expect(
          adapt_csscasc.isValidUnresolvedFontSize(
            newContext(),
            adapt_cssparse.parseValue(
              new adapt_exprs.LexicalScope(null),
              new adapt_csstok.Tokenizer("round(20px, 7px)", null),
              "",
            ),
          ),
        ).toBe(true);
      });

      it("detects a negative literal font size", function () {
        // A negative literal length is invalid for `font-size`, unlike a math
        // function that computes a negative value: the cascade turns it into
        // `unset`, which the walk materializes as the inherited font size.
        // (Review)
        expect(
          adapt_csscasc.isNegativeLiteralFontSize(
            new adapt_css.Numeric(-10, "px"),
          ),
        ).toBe(true);
        expect(
          adapt_csscasc.isNegativeLiteralFontSize(
            new adapt_css.Numeric(0, "px"),
          ),
        ).toBe(false);
        expect(
          adapt_csscasc.isNegativeLiteralFontSize(
            adapt_cssparse.parseValue(
              new adapt_exprs.LexicalScope(null),
              new adapt_csstok.Tokenizer("calc(10px - 20px)", null),
              "",
            ),
          ),
        ).toBe(false);
      });

      it("resolves math functions whose name is not lowercase", function () {
        // A function name is matched case-insensitively, e.g. `CALC(2em)`.
        var parse = (text) =>
          adapt_cssparse.parseValue(
            new adapt_exprs.LexicalScope(null),
            new adapt_csstok.Tokenizer(text, null),
            "",
          );
        // The parser lowercases the name of a parsed value (`calc`), so the
        // comparison of the visitor is covered with a hand-built function.
        expect(parse("CALC(2em)").toString()).toBe("calc(2em)");
        expect(
          adapt_csscasc.resolveFontSizeValueToPx(
            newContext(),
            new adapt_css.Func("CALC", [new adapt_css.Numeric(2, "em")]),
            16,
          ),
        ).toBe(32);
        expect(
          adapt_csscasc.resolveFontSizeValueToPx(
            newContext(),
            new adapt_css.Func("CLAMP", [
              new adapt_css.Numeric(10, "px"),
              new adapt_css.Numeric(2, "em"),
              new adapt_css.Numeric(30, "px"),
            ]),
            16,
          ),
        ).toBe(30);
      });

      it("does not resolve a nonzero unitless number", function () {
        // Only a unitless zero is a valid `font-size`; a var() substitution
        // can carry any other number, and a browser rejects such a declaration
        // and inherits the parent font size instead.
        expect(
          adapt_csscasc.resolveFontSizeValueToPx(
            newContext(),
            new adapt_css.Num(5),
          ),
        ).toBe(null);
        expect(
          adapt_csscasc.resolveFontSizeValueToPx(
            newContext(),
            new adapt_css.Int(5),
          ),
        ).toBe(null);
      });

      it("resolves a clamp() of absolute lengths", function () {
        expect(
          adapt_csscasc.resolveFontSizeValueToPx(
            newContext(),
            new adapt_css.Func("clamp", [
              new adapt_css.Numeric(10, "px"),
              new adapt_css.Numeric(20, "px"),
              new adapt_css.Numeric(30, "px"),
            ]),
          ),
        ).toBe(20);
      });

      it("resolves a clamp() that uses root font relative units", function () {
        // When the root font size is not known yet (as in the root sizing
        // itself), 1rem is the initial font size.
        expect(
          adapt_csscasc.resolveFontSizeValueToPx(
            newContext(),
            new adapt_css.Func("clamp", [
              new adapt_css.Numeric(1, "rem"),
              new adapt_css.Numeric(24, "px"),
              new adapt_css.Numeric(3, "rem"),
            ]),
          ),
        ).toBe(24);
      });

      it("resolves a clamp() that uses parent relative units", function () {
        // At the root element (and while resolving it) the parent font size is
        // the initial font size.
        expect(
          adapt_csscasc.resolveFontSizeValueToPx(
            newContext(),
            new adapt_css.Func("clamp", [
              new adapt_css.Numeric(1, "em"),
              new adapt_css.Numeric(20, "px"),
              new adapt_css.Numeric(2, "em"),
            ]),
            16,
          ),
        ).toBe(20);
        expect(
          adapt_csscasc.resolveFontSizeValueToPx(
            newContext(),
            new adapt_css.Func("clamp", [
              new adapt_css.Numeric(50, "%"),
              new adapt_css.Numeric(20, "px"),
              new adapt_css.Numeric(200, "%"),
            ]),
            16,
          ),
        ).toBe(20);
      });

      it("resolves a math function inside an arithmetic expression", function () {
        // `calc(clamp(10px, 20px, 30px) + 5px)`: the clamp() is reduced to its
        // px value before the expression around it is evaluated.
        const value = adapt_cssparse.parseValue(
          new adapt_exprs.LexicalScope(null),
          new adapt_csstok.Tokenizer(
            "calc(clamp(10px, 20px, 30px) + 5px)",
            null,
          ),
          "",
        );
        expect(
          adapt_csscasc.resolveFontSizeValueToPx(newContext(), value),
        ).toBe(25);
      });

      it("clamps a negative result to zero", function () {
        // font-size has a non-negative computed-value range, e.g. an element
        // with `font-size: calc(10px - 20px)` computes to 0px.
        expect(
          adapt_csscasc.resolveFontSizeValueToPx(
            newContext(),
            new adapt_css.Func("max", [
              new adapt_css.Numeric(-30, "px"),
              new adapt_css.Numeric(-10, "px"),
            ]),
          ),
        ).toBe(0);
        expect(
          adapt_csscasc.resolveFontSizeValueToPx(
            newContext(),
            new adapt_css.Func("calc", [new adapt_css.Numeric(-1, "px")]),
          ),
        ).toBe(0);
      });

      it("returns null for a value that cannot be resolved", function () {
        expect(
          adapt_csscasc.resolveFontSizeValueToPx(
            newContext(),
            new adapt_css.Func("var", [new adapt_css.AnyToken("--missing")]),
          ),
        ).toBeNull();
      });
    });

    describe("InheritanceVisitor", function () {
      it("resolves font-size: larger against the accumulated parent size", function () {
        var props = {
          "font-size": cascadeValue(new adapt_css.Numeric(16, "px")),
        };
        var resolved = resolveFontValue(
          props,
          "font-size",
          adapt_css.ident.larger,
        );
        expect(resolved instanceof adapt_css.Numeric).toBe(true);
        expect(resolved.num).toBe(19.2);
        expect(resolved.unit).toBe("px");
      });

      it("resolves font-size: smaller against the accumulated parent size", function () {
        var props = {
          "font-size": cascadeValue(new adapt_css.Numeric(16, "px")),
        };
        var resolved = resolveFontValue(
          props,
          "font-size",
          adapt_css.ident.smaller,
        );
        expect(resolved instanceof adapt_css.Numeric).toBe(true);
        expect(resolved.num).toBeCloseTo(13.3333, 3);
        expect(resolved.unit).toBe("px");
      });

      it("resolves nested relative font-size keywords level by level", function () {
        var props = {
          "font-size": cascadeValue(new adapt_css.Numeric(16, "px")),
        };
        var visitor = new adapt_csscasc.InheritanceVisitor(props, newContext());
        visitor.setPropName("font-size");
        props["font-size"] = cascadeValue(
          adapt_css.ident.smaller.visit(visitor),
        );
        var resolved = adapt_css.ident.smaller.visit(visitor);
        expect(resolved.num).toBeCloseTo(11.1111, 3);
      });

      it("uses the inherited font-size as the em base", function () {
        var props = {
          "font-size": cascadeValue(new adapt_css.Numeric(19.2, "px")),
        };
        var resolved = resolveFontValue(
          props,
          "letter-spacing",
          new adapt_css.Numeric(2, "em"),
        );
        expect(resolved.num).toBe(38.4);
        expect(resolved.unit).toBe("px");
      });

      it("resolves font-size: x-large against the default font size", function () {
        var resolved = resolveFontValue(
          {},
          "font-size",
          adapt_css.getName("x-large"),
        );
        expect(resolved instanceof adapt_css.Numeric).toBe(true);
        expect(resolved.num).toBe(24);
        expect(resolved.unit).toBe("px");
      });

      it("uses an absolute size keyword as the em base", function () {
        var props = {
          "font-size": cascadeValue(adapt_css.getName("small")),
        };
        var resolved = resolveFontValue(
          props,
          "letter-spacing",
          new adapt_css.Numeric(2, "em"),
        );
        expect(resolved.num).toBe(26);
        expect(resolved.unit).toBe("px");
      });

      it("resolves font-weight: bolder against the inherited weight", function () {
        var props = {
          "font-weight": cascadeValue(new adapt_css.Int(700)),
        };
        var resolved = resolveFontValue(
          props,
          "font-weight",
          adapt_css.ident.bolder,
        );
        expect(resolved.num).toBe(900);
      });

      it("resolves font-weight: lighter against the inherited weight", function () {
        var props = {
          "font-weight": cascadeValue(new adapt_css.Int(400)),
        };
        var resolved = resolveFontValue(
          props,
          "font-weight",
          adapt_css.ident.lighter,
        );
        expect(resolved.num).toBe(100);
      });

      it("treats font-weight: bold as 700 when resolving bolder", function () {
        var props = {
          "font-weight": cascadeValue(adapt_css.ident.bold),
        };
        var resolved = resolveFontValue(
          props,
          "font-weight",
          adapt_css.ident.bolder,
        );
        expect(resolved.num).toBe(900);
      });

      it("uses the initial weight 400 when no ancestor declared font-weight", function () {
        var resolved = resolveFontValue(
          {},
          "font-weight",
          adapt_css.ident.bolder,
        );
        expect(resolved.num).toBe(700);
      });

      it("leaves other keywords unchanged", function () {
        var props = {};
        expect(
          resolveFontValue(props, "font-size", adapt_css.ident.solid),
        ).toBe(adapt_css.ident.solid);
        expect(resolveFontValue(props, "color", adapt_css.ident.larger)).toBe(
          adapt_css.ident.larger,
        );
      });

      it("uses a non-canonical size keyword as the em base", function () {
        // `font-size: var(--x)` with `--x: SMALL` reaches the visitor without
        // being canonicalized to lowercase by the validator, and CSS keywords
        // are ASCII case-insensitive. (Issue #2174 follow-up)
        var props = { "font-size": cascadeValue(adapt_css.getName("SMALL")) };
        var resolved = resolveFontValue(
          props,
          "letter-spacing",
          new adapt_css.Numeric(2, "em"),
        );
        expect(resolved.num).toBe(26);
        expect(resolved.unit).toBe("px");
      });

      it("resolves a relative keyword coming from a custom property", function () {
        var props = {
          "font-size": cascadeValue(new adapt_css.Numeric(16, "px")),
        };
        var resolved = resolveFontValue(
          props,
          "font-size",
          adapt_css.getName("LARGER"),
        );
        expect(resolved instanceof adapt_css.Numeric).toBe(true);
        expect(resolved.num).toBe(19.2);
        expect(resolved.unit).toBe("px");
      });

      it("uses font-size: 0 (a unitless number) as the em base", function () {
        var props = { "font-size": cascadeValue(new adapt_css.Int(0)) };
        var resolved = resolveFontValue(
          props,
          "letter-spacing",
          new adapt_css.Numeric(2, "em"),
        );
        expect(resolved.num).toBe(0);
        expect(resolved.unit).toBe("px");
      });

      it("uses a calc() font-size as the em base", function () {
        var props = {
          "font-size": cascadeValue(
            new adapt_css.Func("calc", [new adapt_css.Numeric(32, "px")]),
          ),
        };
        var resolved = resolveFontValue(
          props,
          "letter-spacing",
          new adapt_css.Numeric(2, "em"),
        );
        expect(resolved.num).toBe(64);
        expect(resolved.unit).toBe("px");
      });

      it("uses a clamp() font-size as the em base", function () {
        var props = {
          "font-size": cascadeValue(
            new adapt_css.Func("clamp", [
              new adapt_css.Numeric(16, "px"),
              new adapt_css.Numeric(32, "px"),
              new adapt_css.Numeric(48, "px"),
            ]),
          ),
        };
        var resolved = resolveFontValue(
          props,
          "letter-spacing",
          new adapt_css.Numeric(2, "em"),
        );
        expect(resolved.num).toBe(64);
        expect(resolved.unit).toBe("px");
      });

      it("evaluates a sum argument of a clamp() font-size", function () {
        // `clamp(1rem, 1.5em + 8px, 3rem)` after the walk converted the
        // relative units of the arguments to px.
        var props = {
          "font-size": cascadeValue(
            new adapt_css.Func("clamp", [
              new adapt_css.Numeric(16, "px"),
              new adapt_css.SpaceList([
                new adapt_css.Numeric(24, "px"),
                new adapt_css.AnyToken("+"),
                new adapt_css.Numeric(8, "px"),
              ]),
              new adapt_css.Numeric(48, "px"),
            ]),
          ),
        };
        var resolved = resolveFontValue(
          props,
          "letter-spacing",
          new adapt_css.Numeric(2, "em"),
        );
        expect(resolved.num).toBe(64);
        expect(resolved.unit).toBe("px");
      });

      it("uses a nested math function as the em base", function () {
        // `min(40px, max(1em, 20px))` after the walk converted the relative
        // units of the arguments to px.
        var props = {
          "font-size": cascadeValue(
            new adapt_css.Func("min", [
              new adapt_css.Numeric(40, "px"),
              new adapt_css.Func("max", [
                new adapt_css.Numeric(16, "px"),
                new adapt_css.Numeric(20, "px"),
              ]),
            ]),
          ),
        };
        var resolved = resolveFontValue(
          props,
          "letter-spacing",
          new adapt_css.Numeric(2, "em"),
        );
        expect(resolved.num).toBe(40); // min(40px, max(16px, 20px)) = 20px
        expect(resolved.unit).toBe("px");
      });

      it("keeps the default font size for a font-size that cannot be resolved", function () {
        var props = {
          "font-size": cascadeValue(
            new adapt_css.Func("var", [new adapt_css.AnyToken("--missing")]),
          ),
        };
        var resolved = resolveFontValue(
          props,
          "letter-spacing",
          new adapt_css.Numeric(2, "em"),
        );
        expect(resolved.num).toBe(32);
        expect(resolved.unit).toBe("px");
      });

      it("leaves an overflowing length calculation to the browser", function () {
        // `calc(exp(1000) * 1px)` computes to an infinity, which no length can
        // represent: materializing it would serialize the invalid
        // `Infinitypx`, so the value is left to the browser, which clamps the
        // calculation to its range. (Review)
        var value = adapt_cssparse.parseValue(
          new adapt_exprs.LexicalScope(null),
          new adapt_csstok.Tokenizer("calc(exp(1000) * 1px)", null),
          "",
        );
        expect(
          adapt_csscasc.resolveFontSizeValueToPx(newContext(), value, 16),
        ).toBe(null);
        // The evaluated value is still the calc(), not a length of an
        // infinity that serializes as `Infinitypx`. (Review)
        var evaluated = adapt_csscasc.evaluateCSSToCSS(
          newContext(),
          value,
          "font-size",
        );
        expect(evaluated.toString()).toContain("calc");
      });

      it("keeps a unitless calculation a number, not a length", function () {
        // The math functions of CSS Values 4 that return a `<number>`, e.g.
        // `sign()`, are evaluated as unitless numbers by this language, which
        // converts every dimension to a number: `calc(sign(20px))` is the
        // number 1, and materializing `1px` would make a property that needs a
        // length, e.g. `width`, accept a value that the browser rejects. A
        // function that keeps the type of its argument stays a length.
        // (Review)
        function evaluate(text, propName) {
          return adapt_csscasc
            .evaluateCSSToCSS(
              newContext(),
              adapt_cssparse.parseValue(
                new adapt_exprs.LexicalScope(null),
                new adapt_csstok.Tokenizer(text, null),
                "",
              ),
              propName,
            )
            .toString();
        }
        expect(evaluate("calc(sign(20px))", "width")).toBe("1");
        expect(evaluate("calc(abs(-20px))", "width")).toBe("20px");
        expect(evaluate("calc(sign(20px) * 1px)", "width")).toBe("1px");
        // `hypot()` computes to the common type of its arguments, a length
        // here. (Review)
        expect(evaluate("calc(hypot(3px, 4px))", "width")).toBe("5px");
        expect(evaluate("calc(hypot(3, 4))", "width")).toBe("5");
        // A value that is not finite is serialized as the JavaScript name and
        // evaluated again by the checks of a declaration, e.g.
        // `evaluatesToNaN()`: the name is a constant, not an undefined name.
        // (Review)
        expect(evaluate("calc(Infinity)", "width")).toBe("Infinity");
        expect(evaluate("calc(NaN)", "width")).toBe("calc(NaN)");
        // A calculation with a keyword that this engine cannot evaluate as a
        // number, e.g. the `<rounding-strategy>` of `round(up, 650, 100)`, is
        // valid CSS that the browser computes: it is left as it is instead of
        // being parsed (the parser would report the keyword as a syntax error)
        // and must not be treated as a calculation that computes NaN. (Review)
        expect(evaluate("calc(round(up, 650, 100))", "font-weight")).toBe(
          "calc(round(up,650,100))",
        );
        // The dimension of an argument of a number-returning function is not a
        // dimension of the calculation: `sign(20px)` is the number 1 even
        // through a function that keeps the type of its arguments. (Review)
        expect(evaluate("calc(min(sign(20px), 2))", "width")).toBe("1");
        expect(evaluate("calc(abs(sign(20px)))", "width")).toBe("1");
        // The arguments of such a function are opaque however deeply they are
        // nested: `calc(2 * sign(abs(20px)))` is the unitless number 2, and
        // materializing `2px` would make a property that needs a length accept
        // it and, for `font-weight`, reject the declaration. (Review)
        expect(evaluate("calc(2 * sign(abs(20px)))", "width")).toBe("2");
        expect(evaluate("calc(2 * sign(abs(20px)))", "font-weight")).toBe("2");
        expect(evaluate("calc(abs(sign(min(1px, 2px))))", "width")).toBe("1");
        expect(evaluate("calc(round(20px, 7px))", "width")).toBe("21px");
      });

      it("keeps dimensionally cancelled lengths as numbers", function () {
        if (!CSS.supports("z-index", "calc(30px / 20px)")) {
          // Firefox enables CSS typed arithmetic by default starting in 158.
          // Run automatically when the host supports dimensional division.
          pending("Requires native CSS typed division (Firefox 158 or later)");
          return;
        }
        function evaluate(text) {
          return adapt_csscasc.evaluateCSSToCSS(
            newContext(),
            adapt_cssparse.parseValue(
              new adapt_exprs.LexicalScope(null),
              new adapt_csstok.Tokenizer(text, null),
              "",
            ),
            "line-height",
          );
        }
        expect(evaluate("calc(30px / 20px)").toString()).toBe("1.5");
        expect(evaluate("calc(2 * (30px / 20px))").toString()).toBe("3");
        expect(evaluate("calc(30px / 20px * 10px)").toString()).toBe("15px");
        expect(evaluate("calc(min(30px / 20px, 2))").toString()).toBe("1.5");
        var value = adapt_cssparse.parseValue(
          new adapt_exprs.LexicalScope(null),
          new adapt_csstok.Tokenizer("calc(150% / 100%)", null),
          "",
        );
        expect(
          adapt_csscasc.resolveLineHeightValueToPx(newContext(), value, 32, 40),
        ).toBe(48);
        expect(adapt_csscasc.isUnitlessNumberValue(value)).toBe(true);
      });

      it("uses the initial font size when the accumulated font-size was removed", function () {
        // `font-size: initial` (e.g. `all: initial`) removes the accumulated
        // value; the initial font size is medium. (Issue #1696)
        var resolved = resolveFontValue(
          {},
          "letter-spacing",
          new adapt_css.Numeric(2, "em"),
        );
        expect(resolved.num).toBe(32);
        expect(resolved.unit).toBe("px");
      });

      it("resolves the lh unit of a font-size against the inherited line height", function () {
        // For `font-size`, the `lh` unit refers to the computed line height of
        // the parent, which is accumulated as `line-height` of the source
        // parent. (Issue #2174 follow-up)
        var props = {
          "font-size": cascadeValue(new adapt_css.Numeric(16, "px")),
          "line-height": cascadeValue(new adapt_css.Numeric(40, "px")),
        };
        var resolved = resolveFontValue(
          props,
          "font-size",
          new adapt_css.Numeric(1, "lh"),
        );
        expect(resolved.num).toBe(40);
        expect(resolved.unit).toBe("px");
      });

      it("resolves the lh unit of a font-size against a multiplier line height", function () {
        var props = {
          "font-size": cascadeValue(new adapt_css.Numeric(20, "px")),
          "line-height": cascadeValue(new adapt_css.Num(1.5)),
        };
        var resolved = resolveFontValue(
          props,
          "font-size",
          new adapt_css.Numeric(1, "lh"),
        );
        expect(resolved.num).toBe(30);
        expect(resolved.unit).toBe("px");
      });

      it("resolves the lh unit against a computed line height", function () {
        // `line-height: calc(2 * 20px)` stays a function while the inherited
        // values are accumulated.
        var props = {
          "font-size": cascadeValue(new adapt_css.Numeric(16, "px")),
          "line-height": cascadeValue(
            adapt_cssparse.parseValue(
              new adapt_exprs.LexicalScope(null),
              new adapt_csstok.Tokenizer("calc(2 * 20px)", null),
              "",
            ),
          ),
        };
        var resolved = resolveFontValue(
          props,
          "font-size",
          new adapt_css.Numeric(1, "lh"),
        );
        expect(resolved.num).toBe(40);
        expect(resolved.unit).toBe("px");
      });

      it("resolves the lh unit against a percentage computed line height", function () {
        // The percentage of a computed `line-height` refers to the font size of
        // the element itself, so `calc(150%)` of 20px is 30px.
        var props = {
          "font-size": cascadeValue(new adapt_css.Numeric(20, "px")),
          "line-height": cascadeValue(
            adapt_cssparse.parseValue(
              new adapt_exprs.LexicalScope(null),
              new adapt_csstok.Tokenizer("calc(150%)", null),
              "",
            ),
          ),
        };
        var resolved = resolveFontValue(
          props,
          "font-size",
          new adapt_css.Numeric(1, "lh"),
        );
        expect(resolved.num).toBe(30);
        expect(resolved.unit).toBe("px");
      });

      it("reduces the other math functions of CSS Values 4", function () {
        // The `lh` unit is replaced by px before the value is evaluated, and
        // the math functions of CSS Values 4 are evaluated as well: a value
        // that stayed unresolved would let a detached descendant resolve the
        // unit in the synthetic parent. (Review)
        var func = adapt_cssparse.parseValue(
          new adapt_exprs.LexicalScope(null),
          new adapt_csstok.Tokenizer("round(1lh, 7px)", null),
          "",
        );
        expect(
          adapt_csscasc.resolveLineHeightValueToPx(newContext(), func, 16, 40),
        ).toBe(42);
      });

      it("reduces a math function that uses the lh unit", function () {
        // `line-height: max(1lh, 5px)` on a detached element: the `lh` unit
        // refers to the line height that the element inherits (10px), so the
        // value is 10px and not the 5px of the placeholder unit size. (Review)
        var func = adapt_cssparse.parseValue(
          new adapt_exprs.LexicalScope(null),
          new adapt_csstok.Tokenizer("max(1lh, 5px)", null),
          "",
        );
        expect(
          adapt_csscasc.resolveLineHeightValueToPx(newContext(), func, 16, 10),
        ).toBe(10);
        expect(
          adapt_csscasc.resolveLineHeightValueToPx(newContext(), func, 16, 40),
        ).toBe(40);
      });

      it("resolves the lh unit against a math function line height", function () {
        // A math function such as `min(40px, 2em)` is valid, so the inherited
        // line height is its computed 32px (the em refers to the 16px font size
        // of the parent), not the preferred line height. (Review)
        var props = {
          "font-size": cascadeValue(new adapt_css.Numeric(16, "px")),
          "line-height": cascadeValue(
            adapt_cssparse.parseValue(
              new adapt_exprs.LexicalScope(null),
              new adapt_csstok.Tokenizer("min(40px, 2em)", null),
              "",
            ),
          ),
        };
        var resolved = resolveFontValue(
          props,
          "font-size",
          new adapt_css.Numeric(1, "lh"),
        );
        expect(resolved.num).toBe(32);
        expect(resolved.unit).toBe("px");
      });

      it("clamps a negative parent font size to zero", function () {
        var props = {
          "font-size": cascadeValue(new adapt_css.Numeric(-10, "px")),
        };
        var resolved = resolveFontValue(
          props,
          "letter-spacing",
          new adapt_css.Numeric(2, "em"),
        );
        expect(resolved.num).toBe(0);
        expect(resolved.unit).toBe("px");
      });

      it("resolves bolder against an accumulated weight that is a function", function () {
        // `font-weight` accepts `calc(650)`, which stays a function while the
        // inherited values are accumulated.
        var props = {
          "font-weight": cascadeValue(
            new adapt_css.Func("calc", [new adapt_css.Num(650)]),
          ),
        };
        var resolved = resolveFontValue(
          props,
          "font-weight",
          adapt_css.ident.bolder,
        );
        expect(resolved.num).toBe(900);
      });

      it("resolves bolder against a non-canonical bold weight", function () {
        var props = {
          "font-weight": cascadeValue(adapt_css.getName("BOLD")),
        };
        var resolved = resolveFontValue(
          props,
          "font-weight",
          adapt_css.ident.bolder,
        );
        expect(resolved.num).toBe(900);
      });
    });
  });
});
