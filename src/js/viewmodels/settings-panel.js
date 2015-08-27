import ko from "knockout";

function SettingsPanel() {
    this.opened = ko.observable(false);

    ["toggle"].forEach(function(methodName) {
        this[methodName] = this[methodName].bind(this);
    }, this);
}

SettingsPanel.prototype.toggle = function() {
    this.opened(!this.opened());
};

export default SettingsPanel;
