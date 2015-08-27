import obs from "../../../src/js/utils/observable-util";

describe("Observable Utils", function() {
    describe("readonlyObservable", function() {
        it("returns a getter and a writable observable", function() {
            var o = obs.readonlyObservable(1);

            expect(o.getter()).toBe(1);
            expect(o.value()).toBe(1);

            o.value(2);

            expect(o.getter()).toBe(2);
            expect(o.value()).toBe(2);
        });

        it("the getter notifies when the value is updated", function() {
            var o = obs.readonlyObservable(1);
            var x = 1;
            o.getter.subscribe(function(y) { x = y; });
            o.value(2);

            expect(x).toBe(2);
        });

        it("throws when trying to write on the getter", function() {
            var o = obs.readonlyObservable(1);
            function set() { o.getter(2); }

            expect(set).toThrow();
        });
    });
});
