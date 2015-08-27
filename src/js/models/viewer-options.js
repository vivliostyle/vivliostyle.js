import ko from "knockout";
import urlParameters from "../stores/url-parameters";

function getViewerOptionsFromURL() {
    return {
        spreadView: (urlParameters.getParameter("spread") === "true")
    };
}

function getDefaultValues() {
    return {
        fontSize: 16,
        spreadView: false
    };
}

function ViewerOptions(options) {
    this.fontSize = ko.observable();
    this.spreadView = ko.observable();
    if (options) {
        this.copyFrom(options);
    } else {
        var defaultValues = getDefaultValues();
        var urlOptions = getViewerOptionsFromURL();
        this.fontSize(defaultValues.fontSize);
        this.spreadView(urlOptions.spreadView || defaultValues.spreadView);
    }
}

ViewerOptions.prototype.copyFrom = function(other) {
    this.fontSize(other.fontSize());
    this.spreadView(other.spreadView());
};

ViewerOptions.prototype.toObject = function() {
    return {
        fontSize: this.fontSize(),
        spreadView: this.spreadView()
    }
};

ViewerOptions.getDefaultValues = getDefaultValues;

export default ViewerOptions;
