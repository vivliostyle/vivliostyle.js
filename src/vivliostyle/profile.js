/**
 * Copyright 2015 Vivliostyle Inc.
 * @fileoverview Utility for profiling
 */
goog.provide("vivliostyle.profile");

goog.require("vivliostyle.namespace");
goog.require("vivliostyle.logging");

goog.scope(function() {
    /**
     * Performance profiler measuring execution time of the script.
     * @param {Performance} performanceInstance
     * @constructor
     */
    vivliostyle.profile.Profiler = function(performanceInstance) {
        /** @const */ this.performanceInstance = performanceInstance;
        /** @const */ this.timestamps = {};

        /** @private @type {function(string, string, number=)} */ this.registerTiming = noop;
        // hack to export (non-prototype) methods
        /** @type {function(string, number=)} */ this["registerStartTiming"] = this.registerStartTiming = noop;
        /** @type {function(string, number=)} */ this["registerEndTiming"] = this.registerEndTiming = noop;
    };
    /** @const */ var Profiler = vivliostyle.profile.Profiler;

    function noop() {}

    /**
     * Registers start/end timing of some event.
     * @this {vivliostyle.profile.Profiler}
     * @param {string} name Name of event
     * @param {string} startEnd Either of "start" or "end"
     * @param {number=} timestamp Used as the actual timestamp of the event if specified, instead of "now"
     */
    function registerTiming(name, startEnd, timestamp) {
        if (!timestamp) {
            timestamp = this.performanceInstance.now();
        }
        var timestamps = this.timestamps[name];
        if (!timestamps) {
            timestamps = this.timestamps[name] = [];
        }
        var t, l = timestamps.length;
        for (var i = l-1; i >=0; i--) {
            t = timestamps[i];
            if (t && !t[startEnd]) break;
            t = null;
        }
        if (!t) {
            t = {};
            timestamps.push(t);
        }
        t[startEnd] = timestamp;
    }

    /**
     * Registers start timing of some event.
     * @this {vivliostyle.profile.Profiler}
     * @param {string} name Name of event
     * @param {number=} timestamp Used as the actual timestamp of the event if specified, instead of "now"
     */
    function registerStartTiming(name, timestamp) {
        this.registerTiming(name, "start", timestamp);
    }

    /**
     * Registers end timing of some event.
     * @this {vivliostyle.profile.Profiler}
     * @param {string} name Name of event
     * @param {number=} timestamp Used as the actual timestamp of the event if specified, instead of "now"
     */
    function registerEndTiming(name, timestamp) {
        this.registerTiming(name, "end", timestamp);
    }

    /**
     * Registers start timing of some event, even if profile is disabled.
     * @param {string} name Name of event
     * @param {number=} timestamp Used as the actual timestamp of the event if specified, instead of "now"
     */
    Profiler.prototype.forceRegisterStartTiming = function(name, timestamp) {
        registerTiming.call(this, name, "start", timestamp);
    };

    /**
     * Registers end timing of some event, even if profile is disabled.
     * @param {string} name Name of event
     * @param {number=} timestamp Used as the actual timestamp of the event if specified, instead of "now"
     */
    Profiler.prototype.forceRegisterEndTiming = function(name, timestamp) {
        registerTiming.call(this, name, "end", timestamp);
    };

    /**
     * Log registered timings (start/end/duration).
     * All values are printed in ms unit.
     */
    Profiler.prototype.printTimings = function() {
        var timestamps = this.timestamps;
        var st = "";
        Object.keys(timestamps).forEach(function(name) {
            var stamps = timestamps[name];
            var l = stamps.length;
            for (var i = 0; i < l; i++) {
                var t = stamps[i];
                st += name;
                if (l > 1) {
                    st += "(" + i + ")";
                }
                st += " => start: " + t["start"] + ", end: " + t["end"] + ", duration: " + (t["end"] - t["start"]) + "\n";
            }
        });
        vivliostyle.logging.logger.info(st);
    };

    /**
     * Disable profiling.
     */
    Profiler.prototype.disable = function() {
        this.registerTiming = noop;
        // hack to export (non-prototype) methods
        this["registerStartTiming"] = this.registerStartTiming = noop;
        this["registerEndTiming"] = this.registerEndTiming = noop;
    };

    /**
     * Enable profiling.
     */
    Profiler.prototype.enable = function() {
        this.registerTiming = registerTiming;
        // hack to export (non-prototype) methods
        this["registerStartTiming"] = this.registerStartTiming = registerStartTiming;
        this["registerEndTiming"] = this.registerEndTiming = registerEndTiming;
    };

    /**
     * Returns if profiling is enabled or not.
     * @returns {boolean}
     */
    Profiler.prototype.isEnabled = function() {
        return this.registerStartTiming === registerStartTiming;
    };

    var fallbackPerformanceInstance = /** @type {Performance} */ ({ now: Date.now });
    var performanceInstance = window && window.performance;
    var profiler = vivliostyle.profile.profiler = new Profiler(performanceInstance || fallbackPerformanceInstance);
    profiler.forceRegisterStartTiming("load_vivliostyle");

    vivliostyle.namespace.exportSymbol("vivliostyle.profile.profiler", profiler);
    goog.exportProperty(Profiler.prototype, "printTimings", Profiler.prototype.printTimings);
    goog.exportProperty(Profiler.prototype, "disable", Profiler.prototype.disable);
    goog.exportProperty(Profiler.prototype, "enable", Profiler.prototype.enable);
});
