/**
 * Copyright 2013 Google, Inc.
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
 * @fileoverview Utilities asynchronous execution and cooperative multitasking.
 */
goog.provide('adapt.taskutil');

goog.require('vivliostyle.logging');
goog.require('adapt.task');


/**
 * A class that can fetch or compute a resource that may be needed by multiple tasks.
 * The first time a resource is requested, it is fetched and then given to everyone
 * requesting it.
 * @constructor
 * @template T
 * @param {function():!adapt.task.Result.<T>} fetch function that fetches/computes
 *    a resource; it will be run in a separate task.
 * @param {string=} opt_name
 */
adapt.taskutil.Fetcher = function(fetch, opt_name) {
    /** @const */ this.fetch = fetch;
    /** @const */ this.name = opt_name;
    /** @type {boolean} */ this.arrived = false;
    /** @type {T} */ this.resource = null;
    /** @type {adapt.task.Task} */ this.task = null;
    /** @type {?Array.<function(*):void>} */ this.piggybacks = [];
};

/**
 * Start fetching/computing a resource, don't block current task.
 * @return {void}
 */
adapt.taskutil.Fetcher.prototype.start = function() {
    if (!this.task) {
        const self = this;
        this.task = adapt.task.currentTask().getScheduler().run(() => {
            const frame = adapt.task.newFrame("Fetcher.run");
            self.fetch().then(resource => {
                const piggibacks = self.piggybacks;
                self.arrived = true;
                self.resource = resource;
                self.task = null;
                self.piggybacks = [];
                if (piggibacks) {
                    for (let i = 0; i < piggibacks.length; i++) {
                        try {
                            piggibacks[i](resource);
                        } catch (err) {
                            vivliostyle.logging.logger.error(err, "Error:");
                        }
                    }
                }
                frame.finish(resource);
            });
            return frame.result();
        }, this.name);
    }
};

/**
 * @param {function(T):void} fn
 * @return {void}
 */
adapt.taskutil.Fetcher.prototype.piggyback = function(fn) {
    if (this.arrived) {
        fn(this.resource);
    } else {
        this.piggybacks.push(fn);
    }
};

/**
 * Fetches the resource, waits for it to arrive if it is already being fetched.
 * @return {!adapt.task.Result.<T>}
 */
adapt.taskutil.Fetcher.prototype.get = function() {
    if (this.arrived)
        return adapt.task.newResult(this.resource);
    this.start();
    return /** @type {!adapt.task.Result.<T>} */ (this.task.join());
};

/**
 * @return {boolean}
 */
adapt.taskutil.Fetcher.prototype.hasArrived = function() {
    return this.arrived;
};

/**
 * Wait for all Fetcher objects in the array to arrive
 * @param {Array.<adapt.taskutil.Fetcher>} fetchers
 * @return {!adapt.task.Result.<boolean>}
 */
adapt.taskutil.waitForFetchers = fetchers => {
    if (fetchers.length == 0)
        return adapt.task.newResult(true);
    if (fetchers.length == 1)
        return fetchers[0].get().thenReturn(true);
    const frame = adapt.task.newFrame("waitForFetches");
    let i = 0;
    frame.loop(() => {
        while (i < fetchers.length) {
            const fetcher = fetchers[i++];
            if (!fetcher.hasArrived())
                return fetcher.get().thenReturn(true);
        }
        return adapt.task.newResult(false);
    }).then(() => {
        frame.finish(true);
    });
    return frame.result();
};

/**
 * @param {Element} elem
 * @param {string} src
 * @return {!adapt.taskutil.Fetcher.<string>} holding event type (load/error/abort)
 */
adapt.taskutil.loadElement = (elem, src) => {
    let width = null;
    let height = null;
    if (elem.localName == "img") {
        width = elem.getAttribute("width");
        height = elem.getAttribute("height");
    }
    const fetcher = new adapt.taskutil.Fetcher(() => {
        /** @type {!adapt.task.Frame.<string>} */ const frame = adapt.task.newFrame("loadImage");
        const continuation = frame.suspend(elem);
        let done = false;
        /** @param {Event} evt */
        const handler = evt => {
            if (done) {
                return;
            } else {
                done = true;
            }

            if (elem.localName == "img") {
                // IE puts these bogus attributes, even if they were not present
                if (!width) {
                    elem.removeAttribute("width");
                }
                if (!height) {
                    elem.removeAttribute("height");
                }
            }
            continuation.schedule(evt ? evt.type : "timeout");
        };
        elem.addEventListener("load", handler, false);
        elem.addEventListener("error", handler, false);
        elem.addEventListener("abort", handler, false);
        if (elem.namespaceURI == adapt.base.NS.SVG) {
            elem.setAttributeNS(adapt.base.NS.XLINK, "xlink:href", src);
            // SVG handlers are not reliable
            setTimeout(handler, 300);
        } else {
            elem.src = src;
        }
        return frame.result();
    }, "loadElement " + src);
    fetcher.start();
    return fetcher;
};
