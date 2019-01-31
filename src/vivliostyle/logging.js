/**
 * Copyright 2015 Trim-marks Inc.
 *
 * Vivliostyle.js is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * Vivliostyle.js is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with Vivliostyle.js.  If not, see <http://www.gnu.org/licenses/>.
 *
 * @fileoverview Logging utility
 */
goog.provide("vivliostyle.logging");

goog.require("vivliostyle.namespace");

goog.scope(() => {
    /**
     * Log level.
     * @enum {number}
     */
    vivliostyle.logging.LogLevel = {
        DEBUG: 1,
        INFO: 2,
        WARN: 3,
        ERROR: 4
    };
    /** @const */ const LogLevel = vivliostyle.logging.LogLevel;

    /**
     * @dict @typedef {{error: Error, messages: !Array<*>}}
     */
    vivliostyle.logging.ErrorInfo;

    /**
     * Class logging error, warning, information or debug messages.
     * @param {Console=} opt_console
     * @constructor
     */
    vivliostyle.logging.Logger = function(opt_console) {
        this.opt_console = opt_console;

        /** @const @private @type {Object<vivliostyle.logging.LogLevel, Array<!function(vivliostyle.logging.ErrorInfo):void>>} */
        this.listeners = {};
    };
    /** @const */
    const Logger = vivliostyle.logging.Logger;

    /** @const @private */
    Logger.prototype.consoleDebug = function(...args) {
        const msg = args[0];
        if (this.opt_console) {
            if (this.opt_console.debug) {
                this.opt_console.debug(...msg);
            } else {
                this.opt_console.log(...msg);
            }
        } else {
            console.debug(...msg);
        }
    };

    /** @const @private */
    Logger.prototype.consoleInfo = function(...args) {
        const msg = args[0];
        if (this.opt_console) {
            if (this.opt_console.info) {
                this.opt_console.info(...msg);
            } else {
                this.opt_console.log(...msg);
            }
        } else {
            console.info(...msg);
        }
    };

    /** @const @private */
    Logger.prototype.consoleWarn = function(...args) {
        const msg = args[0];
        if (this.opt_console) {
            if (this.opt_console.warn) {
                this.opt_console.warn(...msg);
            } else {
                this.opt_console.log(...msg);
            }
        } else {
            console.warn(...msg);
        }
    };

    /** @const @private */
    Logger.prototype.consoleError = function(...args) {
        const msg = args[0];
        if (this.opt_console) {
            if (this.opt_console.error) {
                this.opt_console.error(...msg);
            } else {
                this.opt_console.log(...msg);
            }
        } else {
            console.error(...msg);
        }
    };

    /**
     * @private
     * @param {vivliostyle.logging.LogLevel} level
     * @param {!vivliostyle.logging.ErrorInfo} args
     */
    Logger.prototype.triggerListeners = function(level, args) {
        const listeners = this.listeners[level];
        if (listeners) {
            listeners.forEach(listener => {
                listener(args);
            });
        }
    };

    /**
     * Add a listener function invoked when a log event with the specified level occurs.
     * @param {vivliostyle.logging.LogLevel} level
     * @param {!function(vivliostyle.logging.ErrorInfo):void} listener
     */
    Logger.prototype.addListener = function(level, listener) {
        let listeners = this.listeners[level];
        if (!listeners) {
            listeners = this.listeners[level] = [];
        }
        listeners.push(listener);
    };

    /**
     * @param args
     * @returns {!vivliostyle.logging.ErrorInfo}
     */
    function argumentsToErrorInfo(args) {
        const a = Array.from(args);
        let e = null;
        if (a[0] instanceof Error) {
            e = a.shift();
        }
        return {
            "error": e,
            "messages": a
        };
    }

    /**
     * @param {!vivliostyle.logging.ErrorInfo} args
     * @returns {Array.<string>}
     */
    function buildMessageAndStackTrace(args) {
        const e = args.error;
        const stack = e && (e["frameTrace"] || e["stack"]);
        let messages = [].concat(args["messages"]);
        if (e) {
            if (messages.length > 0) {
                messages = messages.concat(["\n"]);
            }
            messages = messages.concat([e["toString"]()]);
            if (stack) {
                messages = messages.concat(["\n"]).concat(stack);
            }
        }
        return messages;
    }

    /**
     * @param {...} var_args
     */
    Logger.prototype.debug = function(var_args) {
        const args = argumentsToErrorInfo(arguments);
        this.consoleDebug(buildMessageAndStackTrace(args));
        this.triggerListeners(LogLevel.DEBUG, args);
    };

    /**
     * @param {...} var_args
     */
    Logger.prototype.info = function(var_args) {
        const args = argumentsToErrorInfo(arguments);
        this.consoleInfo(buildMessageAndStackTrace(args));
        this.triggerListeners(LogLevel.INFO, args);
    };

    /**
     * @param {...} var_args
     */
    Logger.prototype.warn = function(var_args) {
        const args = argumentsToErrorInfo(arguments);
        this.consoleWarn(buildMessageAndStackTrace(args));
        this.triggerListeners(LogLevel.WARN, args);
    };

    /**
     * @param {...} var_args
     */
    Logger.prototype.error = function(var_args) {
        const args = argumentsToErrorInfo(arguments);
        this.consoleError(buildMessageAndStackTrace(args));
        this.triggerListeners(LogLevel.ERROR, args);
    };

    vivliostyle.logging.logger = new Logger();
});
