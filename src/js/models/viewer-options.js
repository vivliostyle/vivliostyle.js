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

function ViewerOptions() {
    var defaultValues = getDefaultValues();
    var urlOptions = getViewerOptionsFromURL();
    this.fontSize = ko.observable(defaultValues.fontSize);
    this.spreadView = ko.observable(urlOptions.spreadView || defaultValues.spreadView);
}

ViewerOptions.prototype.toObject = function() {
    return {
        fontSize: this.fontSize(),
        spreadView: this.spreadView()
    }
};

ViewerOptions.getDefaultValues = getDefaultValues;

export default ViewerOptions;
