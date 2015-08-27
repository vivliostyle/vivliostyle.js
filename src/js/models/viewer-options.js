import ko from "knockout";
import urlParameters from "../stores/url-parameters";

function getViewerOptionsFromURL() {
    return {
        spreadView: (urlParameters.getParameter("spread") === "true")
    };
}

function ViewerOptions() {
    var urlOptions = getViewerOptionsFromURL();
    this.fontSize = ko.observable(16);
    this.spreadView = ko.observable(urlOptions.spreadView || false);
}

ViewerOptions.prototype.toObject = function() {
    return {
        fontSize: this.fontSize(),
        spreadView: this.spreadView()
    }
};

export default ViewerOptions;
