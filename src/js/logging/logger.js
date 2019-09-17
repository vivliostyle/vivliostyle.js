/*
 * Copyright 2015 Trim-marks Inc.
 *
 * This file is part of Vivliostyle UI.
 *
 * Vivliostyle UI is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * Vivliostyle UI is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with Vivliostyle UI.  If not, see <http://www.gnu.org/licenses/>.
 */

import messageQueue from "../models/message-queue";

const LogLevel = {
    DEBUG: "debug",
    INFO: "info",
    WARN: "warn",
    ERROR: "error"
};

class Logger {
    constructor() {
        this.logLevel = LogLevel.ERROR;
    }

    setLogLevel(logLevel) {
        this.logLevel = logLevel;
    }

    debug(content) {
        if (this.logLevel === LogLevel.DEBUG) {
            messageQueue.push({
                type: "debug",
                content
            });
        }
    }

    info(content) {
        if (this.logLevel === LogLevel.DEBUG || this.logLevel === LogLevel.INFO) {
            messageQueue.push({
                type: "info",
                content
            });
        }
    }

    warn(content) {
        if (this.logLevel === LogLevel.DEBUG || this.logLevel === LogLevel.INFO || this.logLevel === LogLevel.WARN) {
            messageQueue.push({
                type: "warn",
                content
            });
        }
    }

    error(content) {
        if (
            this.logLevel === LogLevel.DEBUG ||
            this.logLevel === LogLevel.INFO ||
            this.logLevel === LogLevel.WARN ||
            this.logLevel === LogLevel.ERROR
        ) {
            messageQueue.push({
                type: "error",
                content
            });
        }
    }
}

Logger.LogLevel = LogLevel;

const instance = new Logger();

Logger.getLogger = () => instance;

export default Logger;
