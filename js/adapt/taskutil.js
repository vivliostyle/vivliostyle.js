goog.provide('adapt.taskutil');

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
	/** @type {?Array.<function(*):void>} */ this.piggybacks = null;
};

/**
 * Start fetching/computing a resource, don't block current task.
 * @return {void}
 */
adapt.taskutil.Fetcher.prototype.start = function() {
	if (!this.task) {
		var self = this;
		this.task = adapt.task.currentTask().getScheduler().run(function() {
			var frame = adapt.task.newFrame("Fetcher.run");
			self.fetch().then(function(resource) {
				var piggibacks = self.piggybacks;
				self.arrived = true;
				self.resource = resource;
				self.task = null;
				self.piggybacks = null;
				if (piggibacks) {
					for (var i = 0; i < piggibacks.length; i++) {
						try {
							piggibacks[i](resource);
						} catch (err) {
							adapt.base.log("Error: " + err);
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
adapt.taskutil.waitForFetchers = function(fetchers) {
	if (fetchers.length == 0)
		return adapt.task.newResult(true);
	if (fetchers.length == 1)
		return fetchers[0].get().thenReturn(true);
	var frame = adapt.task.newFrame("waitForFetches");
	var i = 0;
	frame.loop(function() {
		while (i < fetchers.length) {
			var fetcher = fetchers[i++];
			if (!fetcher.hasArrived())
				return fetcher.get().thenReturn(true);
		}
		return adapt.task.newResult(false);
	}).then(function() {
		frame.finish(true);
	});
	return frame.result();
};

/**
 * @param {HTMLImageElement} img
 * @param {string} src
 * @return {!adapt.taskutil.Fetcher.<string>} holding event type (load/error/abort)
 */
adapt.taskutil.loadImage = function(img, src) {
	var width = img.getAttribute("width");
	var height = img.getAttribute("height");
	return new adapt.taskutil.Fetcher(function() {
	    /** @type {!adapt.task.Frame.<string>} */ var frame = adapt.task.newFrame("loadImage");
	    var continuation = frame.suspend(img);
	    /** @param {Event} evt */
		var handler = function(evt) {
			// IE puts these bogus attributes, even if they were not present
			if (!width) {
				img.removeAttribute("width");
			}
			if (!height) {
				img.removeAttribute("height");
			}
			continuation.schedule(evt.type);
		};
		img.addEventListener("load", handler, false);
		img.addEventListener("error", handler, false);
		img.addEventListener("abort", handler, false);
		img.src = src;
		return frame.result();
	}, "loadImage " + src);
};