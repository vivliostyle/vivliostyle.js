/**
 * Copyright 2013 Google, Inc.
 * @fileoverview Content developer support.
 */
goog.provide('adapt.devel');

goog.require('adapt.epub');

/**
 * @param {adapt.epub.OPFView} viewer
 */
adapt.devel.showTools = function(viewer) {
	var tools = adapt.devel.getTools(viewer);
	if (!tools) {
		tools = new adapt.devel.Tools(viewer);
		viewer.tools = tools;
	}
	tools.show();
};

/**
 * @param {adapt.epub.OPFView} viewer
 * @return {adapt.devel.Tools}
 */
adapt.devel.getTools = function(viewer) {
	return /** @type {adapt.devel.Tools} */ (viewer.tools);
};

/**
 * @param {adapt.epub.OPFView} viewer
 * @constructor
 */
adapt.devel.Tools = function(viewer) {
	/** @const */ this.viewer = viewer;
	/** @type {HTMLElement} */ this.root = null;
	/** @type {number} */ this.rootLeft = 100;
	/** @type {number} */ this.rootTop = 100;
	/** @type {number} */ this.rootWidth = 100;
	/** @type {number} */ this.rootHeight = 100;
	this.buildUI();
};

adapt.devel.Tools.prototype.buildUI = function() {
	var div = this.makeContainer();
	div.style.visibility = "hidden";
	div.style.zIndex = "100";
	div.style.background = "white";
	div.style.border = "2px solid black";
	div.fontSize = "10px";
	div.lineHeight = "10px";
	this.viewer.viewport.root.appendChild(div);
	this.root = div;
	this.buildToolbar();
};

adapt.devel.Tools.prototype.makeContainer = function() {
	var div = /** @type {HTMLElement} */ (this.viewer.viewport.document.createElement("div"));	
	div.style.position = "absolute";
	div.overflow = "hidden";
	div.style.fontFamily = "sans-serif";
	div.style.cursor = "pointer";
	return div;
};

adapt.devel.Tools.prototype.sizeUI = function() {
	var div = this.root;
	div.style.left = this.rootLeft + "px";
	div.style.top = this.rootTop + "px";
	div.style.width = this.rootWidth + "px";
	div.style.height = this.rootHeight + "px";
};

adapt.devel.Tools.prototype.buildToolbar = function() {
	var self = this;
	var close = this.makeContainer();
	close.textContent = "x";
	close.style.top = "2px";
	close.style.right = "5px";
	close.addEventListener("click", function() {
		self.root.style.visibility = "hidden";
	}, false);
	this.root.appendChild(close);
	
	var move = this.makeContainer();
	move.textContent = "...";
	move.style.top = "2px";
	move.style.left = "2px";
	move.style.cursor = "move";
	move.addEventListener("mousedown", function(evt) {
		var initX = evt.clientX;
		var initY = evt.clientY;
		var capture = self.makeContainer();
		capture.style.zIndex = "101";
		capture.style.left = "0px";
		capture.style.right = "0px";
		capture.style.width = "100%";
		capture.style.height = "100%";
		capture.style.background = "rgba(0,0,0,0.01)";
		capture.style.cursor = "move";
		self.viewer.viewport.root.appendChild(capture);
		capture.addEventListener("mousemove", function(evt) {
			var dx = evt.clientX - initX;
			var dy = evt.clientY - initY;
			self.root.style.left = (self.rootLeft + dx) + "px";
			self.root.style.top = (self.rootTop + dy) + "px";
		}, false);
		capture.addEventListener("mouseup", function(evt) {
			self.rootLeft += evt.clientX - initX;
			self.rootTop += evt.clientY - initY;
			self.root.style.left = self.rootLeft + "px";
			self.root.style.top = self.rootTop + "px";
			self.viewer.viewport.root.removeChild(capture);
		}, false);
	}, false);
	this.root.appendChild(move);
};

adapt.devel.Tools.prototype.show = function() {
	this.rootLeft = this.viewer.viewport.width / 2 - 10;
	this.rootTop = this.viewer.viewport.height / 2 - 10;
	this.rootWidth = this.viewer.viewport.width / 2;
	this.rootHeight = this.viewer.viewport.height / 2;
	this.sizeUI();
	this.root.style.visibility = "visible";
};