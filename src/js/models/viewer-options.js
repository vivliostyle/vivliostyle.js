import ko from "knockout";
import urlParameters from "../stores/url-parameters";

function getViewerOptionsFromURL() {
    return {
        spreadView: (urlParameters.getParameter("spread") === "true")
    };
}

function ViewerOptions() {
    var urlOptions = getViewerOptionsFromURL();
    this.spreadView = ko.observable(urlOptions.spreadView || false);
}

ViewerOptions.prototype.toObject = function() {
    return {
        spreadView: this.spreadView()
    }
};

export default ViewerOptions;
