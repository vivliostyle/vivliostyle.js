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
import * as logging from '../vivliostyle/logging';
import * as base from './base';
import * as task from './task';

/**
 * A class that can fetch or compute a resource that may be needed by multiple
 * tasks. The first time a resource is requested, it is fetched and then given
 * to everyone requesting it.
 * @template T
 * @param fetch function that fetches/computes
 *    a resource; it will be run in a separate task.
 */
export class Fetcher {
  name: any;
  arrived: boolean = false;
  resource: T = null;
  task: task.Task = null;
  piggybacks: ((p1: any) => void)[]|null = [];

  constructor(public readonly fetch: () => task.Result<T>, opt_name?: string) {
    this.name = opt_name;
  }

  /**
   * Start fetching/computing a resource, don't block current task.
   */
  start(): void {
    if (!this.task) {
      const self = this;
      this.task = task.currentTask().getScheduler().run(() => {
        const frame = task.newFrame('Fetcher.run');
        self.fetch().then((resource) => {
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
                logging.logger.error(err, 'Error:');
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
  get(): task.Result<T> {
    if (this.arrived) {
      return task.newResult(this.resource);
    }
    this.start();
    return (this.task.join() as task.Result<T>);
  }

  hasArrived(): boolean {
    return this.arrived;
  }
}

/**
 * Wait for all Fetcher objects in the array to arrive
 */
export const waitForFetchers = (fetchers: Fetcher[]): task.Result<boolean> => {
  if (fetchers.length == 0) {
    return task.newResult(true);
  }
  if (fetchers.length == 1) {
    return fetchers[0].get().thenReturn(true);
  }
  const frame = task.newFrame('waitForFetches');
  let i = 0;
  frame
      .loop(() => {
        while (i < fetchers.length) {
          const fetcher = fetchers[i++];
          if (!fetcher.hasArrived()) {
            return fetcher.get().thenReturn(true);
          }
        }
        return task.newResult(false);
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
  if (elem.localName == 'img') {
    width = elem.getAttribute('width');
    height = elem.getAttribute('height');
  }
  const fetcher = new Fetcher(() => {
    const frame: task.Frame<string> = task.newFrame('loadImage');
    const continuation = frame.suspend(elem);
    let done = false;
    const handler = (evt: Event) => {
      if (done) {
        return;
      } else {
        done = true;
      }
      if (elem.localName == 'img') {
        // IE puts these bogus attributes, even if they were not present
        if (!width) {
          elem.removeAttribute('width');
        }
        if (!height) {
          elem.removeAttribute('height');
        }
      }
      continuation.schedule(evt ? evt.type : 'timeout');
    };
    elem.addEventListener('load', handler, false);
    elem.addEventListener('error', handler, false);
    elem.addEventListener('abort', handler, false);
    if (elem.namespaceURI == base.NS.SVG) {
      elem.setAttributeNS(base.NS.XLINK, 'xlink:href', src);

      // SVG handlers are not reliable
      setTimeout(handler, 300);
    } else {
      elem.src = src;
    }
    return frame.result();
  }, `loadElement ${src}`);
  fetcher.start();
  return fetcher;
};
