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
        spreadView: false,
        zoom: 1
    };
}

function ViewerOptions(options) {
    this.fontSize = ko.observable();
    this.spreadView = ko.observable();
    this.zoom = ko.observable();
    if (options) {
        this.copyFrom(options);
    } else {
        var defaultValues = getDefaultValues();
        var urlOptions = getViewerOptionsFromURL();
        this.fontSize(defaultValues.fontSize);
        this.spreadView(urlOptions.spreadView || defaultValues.spreadView);
        this.zoom(defaultValues.zoom);
    }
}

ViewerOptions.prototype.copyFrom = function(other) {
    this.fontSize(other.fontSize());
    this.spreadView(other.spreadView());
    this.zoom(other.zoom());
};

ViewerOptions.prototype.toObject = function() {
    return {
        fontSize: this.fontSize(),
        spreadView: this.spreadView(),
        zoom: this.zoom()
    }
};

ViewerOptions.getDefaultValues = getDefaultValues;

export default ViewerOptions;
