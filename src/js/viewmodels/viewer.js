/*
 * Copyright 2015 Vivliostyle Inc.
 *
 * This file is part of Vivliostyle UI.
 *
 * Vivliostyle UI is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * Vivliostyle UI is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with Vivliostyle UI.  If not, see <http://www.gnu.org/licenses/>.
 */

import ko from "knockout";
import obs from "../utils/observable-util";
import Logger from "../logging/logger";
import vivliostyle from "../models/vivliostyle";

function Viewer(viewerSettings, viewerOptions) {
    this.viewerOptions_ = viewerOptions;
    this.documentOptions_ = null;
    this.viewer_ = new vivliostyle.viewer.Viewer(viewerSettings, viewerOptions.toObject());
    var state_ = this.state_= {
        status: obs.readonlyObservable("loading"),
        pageProgression: obs.readonlyObservable(vivliostyle.constants.LTR)
    };
    this.state = {
        status: state_.status.getter,
        navigatable: ko.pureComputed(function() {
            return state_.status.value() === "complete";
        }),
        pageProgression: state_.pageProgression.getter
    };

    this.setupViewerEventHandler();
    this.setupViewerOptionSubscriptions();
}

Viewer.prototype.setupViewerEventHandler = function() {
    var logger = Logger.getLogger();
    this.viewer_.addListener("debug", function(payload) {
        logger.debug(payload.content);
    });
    this.viewer_.addListener("info", function(payload) {
        logger.info(payload.content);
    });
    this.viewer_.addListener("warn", function(payload) {
        logger.warn(payload.content);
    });
    this.viewer_.addListener("error", function(payload) {
        logger.error(payload.content);
    });
    this.viewer_.addListener("resizestart", function() {
        var status = this.state.status();
        if (status === "complete") {
            this.state_.status.value("resizing");
        }
    }.bind(this));
    this.viewer_.addListener("resizeend", function() {
        this.state_.status.value("complete");
    }.bind(this));
    this.viewer_.addListener("loaded", function() {
        this.state_.pageProgression.value(this.viewer_.getCurrentPageProgression());
        this.state_.status.value("complete");
        if (this.viewerOptions_.profile()) {
            vivliostyle.profile.profiler.printTimings();
        }
    }.bind(this));
    this.viewer_.addListener("nav", function(payload) {
        var cfi = payload.cfi;
        if (cfi) {
            this.documentOptions_.fragment(cfi);
        }
    }.bind(this));
    this.viewer_.addListener("hyperlink", function(payload) {
        if (payload.internal) {
            this.viewer_.navigateToInternalUrl(payload.href);
        } else {
            window.location.href = payload.href;
        }
    }.bind(this));
};

Viewer.prototype.setupViewerOptionSubscriptions = function() {
    ko.computed(function() {
        var viewerOptions = this.viewerOptions_.toObject();
        if (this.state.status.peek() === "complete") {
            this.viewer_.setOptions(viewerOptions);
        }
    }, this).extend({rateLimit: 0});
};

Viewer.prototype.loadDocument = function(documentOptions, viewerOptions) {
    this.state_.status.value("loading");
    if (viewerOptions) {
        this.viewerOptions_.copyFrom(viewerOptions);
    }
    this.documentOptions_ = documentOptions;
    if (documentOptions.url()) {
        this.viewer_.loadDocument(documentOptions.url(), documentOptions.toObject(), this.viewerOptions_.toObject());
    } else if (documentOptions.epubUrl()) {
        this.viewer_.loadEPUB(documentOptions.epubUrl(), documentOptions.toObject(), this.viewerOptions_.toObject());
    }
};

Viewer.prototype.navigateToPrevious = function() {
    this.viewer_.navigateToPage("previous");
};

Viewer.prototype.navigateToNext = function() {
    this.viewer_.navigateToPage("next");
};

Viewer.prototype.navigateToLeft = function() {
    this.viewer_.navigateToPage("left");
};

Viewer.prototype.navigateToRight = function() {
    this.viewer_.navigateToPage("right");
};

Viewer.prototype.navigateToFirst = function() {
    this.viewer_.navigateToPage("first");
};

Viewer.prototype.navigateToLast = function() {
    this.viewer_.navigateToPage("last");
};

Viewer.prototype.queryZoomFactor = function(type) {
    return this.viewer_.queryZoomFactor(type);
};

export default Viewer;
