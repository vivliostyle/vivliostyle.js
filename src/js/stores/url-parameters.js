"use strict";
import stringUtil from "../utils/string-util"

function URLParameterStore() {
    this.location = window ? window.location : {url: ""};
}

URLParameterStore.prototype.getParameter = function(name) {
    var url = this.location.href;
    var regexp = new RegExp("[#&]" + stringUtil.escapeUnicodeString(name) + "=([^&]*)");
    var r = url.match(regexp);
    if (r) {
        return r[1];
    } else {
        return null;
    }
};

export default new URLParameterStore();
