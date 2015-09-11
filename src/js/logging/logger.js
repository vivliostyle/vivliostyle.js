function Logger() {
    this.console = window.console;
}

Logger.prototype.log = function() {
    if (this.console) {
        if (typeof this.console.log === "function") {
            this.console.log.apply(this.console, arguments);
        }
    }
};

Logger.prototype.error = function() {
    if (this.console) {
        if (typeof this.console.error === "function") {
            this.console.error.apply(this.console, arguments);
        } else {
            this.log.apply(this, arguments);
        }
    }
};

export default new Logger();
