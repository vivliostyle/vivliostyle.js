import ko from "knockout"

var util = {
    readonlyObservable: function(value) {
        var obs = ko.observable(value);
        return {
            getter: ko.pureComputed(function() { return obs(); }),
            value: obs
        };
    }
};

export default util;
