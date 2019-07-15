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
  private consoleDebug: any;
  private consoleInfo: any;
  private consoleWarn: any;
  private consoleError: any;
  private listeners: { [key in LogLevel]?: ((p1: ErrorInfo) => void)[] } = {};

  constructor(opt_console?: Console) {
    const c = opt_console || console;

    function makeConsoleMethod(method) {
      return args => method.apply(c, args);
    }
    this.consoleDebug = makeConsoleMethod(c.debug || c.log);
    this.consoleInfo = makeConsoleMethod(c.info || c.log);
    this.consoleWarn = makeConsoleMethod(c.warn || c.log);
    this.consoleError = makeConsoleMethod(c.error || c.log);
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
function argumentsToErrorInfo(args): ErrorInfo {
  const a = Array.from(args);
  let e = null;
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
