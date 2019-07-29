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
 * @fileoverview TaskUtil - Utilities asynchronous execution and cooperative
 * multitasking.
 */
import * as Base from "./base";
import * as Task from "./task";
import * as Logging from "../vivliostyle/logging";

/**
 * A class that can fetch or compute a resource that may be needed by multiple
 * tasks. The first time a resource is requested, it is fetched and then given
 * to everyone requesting it.
 * @template T
 * @param fetch function that fetches/computes
 *    a resource; it will be run in a separate task.
 */
export class Fetcher<T> {
  name: any;
  arrived: boolean = false;
  resource: T = null;
  task: Task.Task = null;
  piggybacks: ((p1: any) => void)[] | null = [];

  constructor(public readonly fetch: () => Task.Result<T>, opt_name?: string) {
    this.name = opt_name;
  }

  /**
   * Start fetching/computing a resource, don't block current task.
   */
  start(): void {
    if (!this.task) {
      const self = this;
      this.task = Task.currentTask()
        .getScheduler()
        .run(() => {
          const frame = Task.newFrame("Fetcher.run");
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
                  Logging.logger.error(err, "Error:");
                }
              }
            }
            frame.finish(resource);
          });
          return frame.result();
        }, this.name);
    }
  }

  piggyback(fn: (p1: T) => void): void {
    if (this.arrived) {
      fn(this.resource);
    } else {
      this.piggybacks.push(fn);
    }
  }

  /**
   * Fetches the resource, waits for it to arrive if it is already being
   * fetched.
   */
  get(): Task.Result<T> {
    if (this.arrived) {
      return Task.newResult(this.resource);
    }
    this.start();
    return this.task.join() as Task.Result<T>;
  }

  hasArrived(): boolean {
    return this.arrived;
  }
}

/**
 * Wait for all Fetcher objects in the array to arrive
 */
export const waitForFetchers = <T>(
  fetchers: Fetcher<T>[]
): Task.Result<boolean> => {
  if (fetchers.length == 0) {
    return Task.newResult(true);
  }
  if (fetchers.length == 1) {
    return fetchers[0].get().thenReturn(true);
  }
  const frame = Task.newFrame<boolean>("waitForFetches");
  let i = 0;
  frame
    .loop(() => {
      while (i < fetchers.length) {
        const fetcher = fetchers[i++];
        if (!fetcher.hasArrived()) {
          return fetcher.get().thenReturn(true);
        }
      }
      return Task.newResult(false);
    })
    .then(() => {
      frame.finish(true);
    });
  return frame.result();
};

/**
 * @return holding event type (load/error/abort)
 */
export const loadElement = (elem: Element, src: string): Fetcher<string> => {
  let width = null;
  let height = null;
  if (elem.localName == "img") {
    width = elem.getAttribute("width");
    height = elem.getAttribute("height");
  }
  const fetcher = new Fetcher(() => {
    const frame: Task.Frame<string> = Task.newFrame("loadImage");
    const continuation = frame.suspend(elem);
    let done = false;
    const handler = (evt: Event) => {
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
    if (elem.namespaceURI == Base.NS.SVG) {
      elem.setAttributeNS(Base.NS.XLINK, "xlink:href", src);

      // SVG handlers are not reliable
      setTimeout(handler, 300);
    } else {
      (elem as any).src = src;
    }
    return frame.result();
  }, `loadElement ${src}`);
  fetcher.start();
  return fetcher;
};
