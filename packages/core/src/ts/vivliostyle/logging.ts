/**
 * Copyright 2015 Trim-marks Inc.
 * Copyright 2019 Vivliostyle Foundation
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
 * @fileoverview Logging - Logging utility
 */

/**
 * Log level.
 * @enum {number}
 */
export enum LogLevel {
  DEBUG = 1,
  INFO,
  WARN,
  ERROR
}

export type ErrorInfo = {
  error: Error;
  messages: any[];
};

/**
 * Class logging error, warning, information or debug messages.
 */
export class Logger {
  private listeners: { [key in LogLevel]?: ((p1: ErrorInfo) => void)[] } = {};

  constructor(private opt_console?: Console) {}

  private consoleDebug(msg: any[]) {
    if (this.opt_console) {
      if (this.opt_console.debug) {
        this.opt_console.debug(...msg);
      } else {
        this.opt_console.log(...msg);
      }
    } else {
      console.debug(...msg); // eslint-disable-line no-console
    }
  }

  private consoleInfo(msg: any[]) {
    if (this.opt_console) {
      if (this.opt_console.info) {
        this.opt_console.info(...msg);
      } else {
        this.opt_console.log(...msg);
      }
    } else {
      console.info(...msg); // eslint-disable-line no-console
    }
  }

  private consoleWarn(msg: any[]) {
    if (this.opt_console) {
      if (this.opt_console.warn) {
        this.opt_console.warn(...msg);
      } else {
        this.opt_console.log(...msg);
      }
    } else {
      console.warn(...msg); // eslint-disable-line no-console
    }
  }

  private consoleError(msg: any[]) {
    if (this.opt_console) {
      if (this.opt_console.error) {
        this.opt_console.error(...msg);
      } else {
        this.opt_console.log(...msg);
      }
    } else {
      console.error(...msg); // eslint-disable-line no-console
    }
  }

  private triggerListeners(level: LogLevel, args: ErrorInfo) {
    const listeners = this.listeners[level];
    if (listeners) {
      listeners.forEach(listener => {
        listener(args);
      });
    }
  }

  /**
   * Add a listener function invoked when a log event with the specified level
   * occurs.
   */
  addListener(level: LogLevel, listener: (p1: ErrorInfo) => void) {
    let listeners = this.listeners[level];
    if (!listeners) {
      listeners = this.listeners[level] = [];
    }
    listeners.push(listener);
  }

  debug(...var_args: any[]) {
    const args = argumentsToErrorInfo(arguments);
    this.consoleDebug(buildMessageAndStackTrace(args));
    this.triggerListeners(LogLevel.DEBUG, args);
  }

  info(...var_args: any[]) {
    const args = argumentsToErrorInfo(arguments);
    this.consoleInfo(buildMessageAndStackTrace(args));
    this.triggerListeners(LogLevel.INFO, args);
  }

  warn(...var_args: any[]) {
    const args = argumentsToErrorInfo(arguments);
    this.consoleWarn(buildMessageAndStackTrace(args));
    this.triggerListeners(LogLevel.WARN, args);
  }

  error(...var_args: any[]) {
    const args = argumentsToErrorInfo(arguments);
    this.consoleError(buildMessageAndStackTrace(args));
    this.triggerListeners(LogLevel.ERROR, args);
  }
}

/**
 * @param args
 */
function argumentsToErrorInfo(args: IArguments): ErrorInfo {
  const a = Array.from(args);
  let e: Error = null;
  if (a[0] instanceof Error) {
    e = a.shift();
  }
  return { error: e, messages: a };
}

function buildMessageAndStackTrace(args: ErrorInfo): string[] {
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

export const logger = new Logger();
