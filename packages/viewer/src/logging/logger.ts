/*
 * Copyright 2015 Daishinsha Inc.
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

enum LogLevel {
  Debug = "debug",
  Info = "info",
  Warn = "warn",
  Error = "error",
}

export default class Logger {
  logLevel: LogLevel;

  static getLogger(): Logger {
    return new Logger();
  }

  constructor() {
    this.logLevel = LogLevel.Error;
  }

  setLogLevel(logLevel: LogLevel): void {
    this.logLevel = logLevel;
  }

  debug(content: unknown): void {
    if (this.logLevel === LogLevel.Debug) {
      messageQueue.push({
        type: "debug",
        content,
      });
    }
  }

  info(content: unknown): void {
    if (this.logLevel === LogLevel.Debug || this.logLevel === LogLevel.Info) {
      messageQueue.push({
        type: "info",
        content,
      });
    }
  }

  warn(content: unknown): void {
    if (
      this.logLevel === LogLevel.Debug ||
      this.logLevel === LogLevel.Info ||
      this.logLevel === LogLevel.Warn
    ) {
      messageQueue.push({
        type: "warn",
        content,
      });
    }
  }

  error(content: unknown): void {
    if (
      this.logLevel === LogLevel.Debug ||
      this.logLevel === LogLevel.Info ||
      this.logLevel === LogLevel.Warn ||
      this.logLevel === LogLevel.Error
    ) {
      if (
        (content as { error: Error })?.error
          ?.toString()
          .includes("history.replaceState()")
      ) {
        // Ignore Safari's error,
        // "SecurityError: Attempt to use history.replaceState() more than 100 times per 30 seconds",
        // that may occur during consecutive page move using page slider or mouse wheel
        return;
      }
      messageQueue.push({
        type: "error",
        content,
      });
    }
  }
}
