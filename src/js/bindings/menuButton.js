import ko from "knockout";

var supportTouchEvents = ("ontouchstart" in window);

ko.bindingHandlers.menuButton = {
    init: function(element, valueAccessor) {
        if (ko.unwrap(valueAccessor())) {
            if (supportTouchEvents) {
                element.addEventListener("touchstart", function() {
                    ko.utils.toggleDomNodeCssClass(element, "hover active", true);
                });
                element.addEventListener("touchend", function() {
                    ko.utils.toggleDomNodeCssClass(element, "hover active", false);
                });
            } else {
                element.addEventListener("mouseover", function() {
                    ko.utils.toggleDomNodeCssClass(element, "hover", true);
                });
                element.addEventListener("mousedown", function() {
                    ko.utils.toggleDomNodeCssClass(element, "active", true);
                });
                element.addEventListener("mouseup", function() {
                    ko.utils.toggleDomNodeCssClass(element, "active", false);
                });
                element.addEventListener("mouseout", function() {
                    ko.utils.toggleDomNodeCssClass(element, "hover", false);
                });
            }
        }
    }
};
