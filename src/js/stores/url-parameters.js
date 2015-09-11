import stringUtil from "../utils/string-util"

function getRegExpForParameter(name) {
    return new RegExp("[#&]" + stringUtil.escapeUnicodeString(name) + "=([^&]*)");
}

function URLParameterStore() {
    this.location = window ? window.location : {url: ""};
}

URLParameterStore.prototype.getParameter = function(name) {
    var url = this.location.href;
    var regexp = getRegExpForParameter(name);
    var r = url.match(regexp);
    if (r) {
        return r[1];
    } else {
        return null;
    }
};

URLParameterStore.prototype.setParameter = function(name, value) {
    var url = this.location.href;
    var updated;
    var regexp = getRegExpForParameter(name);
    var r = url.match(regexp);
    if (r) {
        var l = r[1].length;
        var start = r.index + r[0].length - l;
        updated = url.substring(0, start) + value + url.substring(start + l);
    } else {
        updated = url + (url.match(/#/) ? "&" : "#") + name + "=" + value;
    }
    this.location.href = updated;
};

export default new URLParameterStore();
