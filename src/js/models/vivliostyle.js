function Vivliostyle() {
    this.viewer = null;
    this.constants = null;
}

Vivliostyle.prototype.setInstance = function(vivliostyle) {
    this.viewer = vivliostyle.viewer;
    this.constants = vivliostyle.constants;
};

export default new Vivliostyle();
