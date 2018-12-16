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
 * @fileoverview Fetch resource from a URL.
 */
import * as logging from '../vivliostyle/logging';

import {JSON} from './base';
import * as base from './base';
import * as task from './task';
import {Fetcher} from './taskutil';
import {XMLDocHolder} from './xmldoc';

/**
 * @enum {string}
 */
export enum XMLHttpRequestResponseType {
  DEFAULT = '',
  ARRAYBUFFER = 'arraybuffer',
  BLOB = 'blob',
  DOCUMENT = 'document',
  JSON = 'json',
  TEXT = 'text'
}
type Response = {
  status: number,
  url: string,
  contentType: string|null,
  responseText: string|null,
  responseXML: Document,
  responseBlob: Blob
};

export {Response};

export const ajax = (url: string, opt_type?: XMLHttpRequestResponseType,
                     opt_method?: string, opt_data?: string,
                     opt_contentType?: string): task.Result<Response> => {
  const frame: task.Frame<Response> = task.newFrame('ajax');
  const request = new XMLHttpRequest();
  const continuation = frame.suspend(request);
  const response: Response = {
    status: 0,
    url,
    contentType: null,
    responseText: null,
    responseXML: null,
    responseBlob: null
  };
  request.open(opt_method || 'GET', url, true);
  if (opt_type) {
    request.responseType = opt_type;
  }
  request.onreadystatechange = () => {
    if (request.readyState === 4) {
      response.status = request.status;
      if (response.status == 200 || response.status == 0) {
        if ((!opt_type || opt_type === XMLHttpRequestResponseType.DOCUMENT) &&
            request.responseXML &&
            request.responseXML.documentElement.localName != 'parsererror') {
          response.responseXML = request.responseXML;
          response.contentType = (request.responseXML as any).contentType;
        } else if ((!opt_type || opt_type === XMLHttpRequestResponseType.DOCUMENT) &&
            request.response instanceof HTMLDocument) {
          response.responseXML = request.response;
          response.contentType = (request.response as any).contentType;
        } else {
          const text = request.response;
          if ((!opt_type || opt_type === XMLHttpRequestResponseType.TEXT) &&
              typeof text == 'string') {
            response.responseText = text;
          } else if (!text) {
            logging.logger.warn(
                'Unexpected empty success response for', url);
          } else {
            if (typeof text == 'string') {
              response.responseBlob = makeBlob([text]);
            } else {
              response.responseBlob = (text as Blob);
            }
          }
          const contentTypeHeader = request.getResponseHeader('Content-Type');
          if (contentTypeHeader) {
            response.contentType =
                contentTypeHeader.replace(/(.*);.*$/, '$1');
          }
        }
      }
      continuation.schedule(response);
    }
  };
  try {
    if (opt_data) {
      request.setRequestHeader(
          'Content-Type', opt_contentType || 'text/plain; charset=UTF-8');
      request.send(opt_data);
    } else {
      if (url.match(/file:\/\/.*(\.html$|\.htm$)/)) {
        request.overrideMimeType('text/html');
      }
      request.send(null);
    }
  } catch (e) {
    logging.logger.warn(e, `Error fetching ${url}`);
    continuation.schedule(response);
  }
  return frame.result();
};

/**
 * @return Blob
 */
export const makeBlob =
    (parts: (string|Blob|ArrayBuffer|ArrayBufferView)[],
     opt_type?: string): any => {
      const type = opt_type || 'application/octet-stream';
      const builderCtr = window['WebKitBlobBuilder'] || window['MSBlobBuilder'];

      // deprecated
      if (builderCtr) {
        const builder = new builderCtr();
        for (let i = 0; i < parts.length; i++) {
          builder.append(parts[i]);
        }
        return builder.getBlob(type);
      }
      return new Blob(parts, {type});
    };

/**
 * @return task.Result.<ArrayBuffer>
 */
export const readBlob = (blob: Blob): any => {
  const frame: task.Frame<ArrayBuffer> = task.newFrame('readBlob');
  const fileReader = new FileReader();
  const continuation = frame.suspend(fileReader);
  fileReader.addEventListener('load', () => {
    continuation.schedule((fileReader.result as ArrayBuffer));
  }, false);
  fileReader.readAsArrayBuffer(blob);
  return frame.result();
};

export const revokeObjectURL = (url: string) => {
  (window['URL'] || window['webkitURL']).revokeObjectURL(url);
};

/**
 * @return url
 */
export const createObjectURL = (blob: Blob): string =>
    (window['URL'] || window['webkitURL']).createObjectURL(blob);

/**
 * @template Resource
 */
export class ResourceStore<Resource> {
  resources: {[key: string]: Resource} = {};
  fetchers: {[key: string]: Fetcher<Resource>} = {};

  constructor(
      public readonly parser:
          (p1: Response, p2: ResourceStore<Resource>) => task.Result<Resource>,
      public readonly type: XMLHttpRequestResponseType) {}

  /**
   * @return resource for the given URL
   */
  load(url: string, opt_required?: boolean, opt_message?: string):
      task.Result<Resource> {
    url = base.stripFragment(url);
    const resource = this.resources[url];
    if (typeof resource != 'undefined') {
      return task.newResult(resource);
    }
    return this.fetch(url, opt_required, opt_message).get();
  }

  private fetchInner(url: string, opt_required?: boolean, opt_message?: string):
      task.Result<Resource> {
    const self = this;
    const frame: task.Frame<Resource> = task.newFrame('fetch');
    ajax(url, self.type).then((response) => {
      if (opt_required && response.status >= 400) {
        throw new Error(
            opt_message || `Failed to fetch required resource: ${url}`);
      }
      self.parser(response, self).then((resource) => {
        delete self.fetchers[url];
        self.resources[url] = resource;
        frame.finish(resource);
      });
    });
    return frame.result();
  }

  /**
   * @return fetcher for the resource for the given URL
   */
  fetch(url: string, opt_required?: boolean, opt_message?: string):
      Fetcher<Resource> {
    url = base.stripFragment(url);
    const resource = this.resources[url];
    if (resource) {
      return null;
    }
    let fetcher = this.fetchers[url];
    if (!fetcher) {
      const self = this;
      fetcher = new Fetcher(
          () => self.fetchInner(url, opt_required, opt_message),
          `Fetch ${url}`);
      self.fetchers[url] = fetcher;
      fetcher.start();
    }
    return fetcher;
  }

  get(url: string): XMLDocHolder {
    const resource: unknown = this.resources[base.stripFragment(url)];
    return resource as XMLDocHolder;
  }

  delete(url: string) {
    delete this.resources[base.stripFragment(url)];
  }
}
type JSONStore = ResourceStore<JSON>;

export {JSONStore};

export const parseJSONResource =
    (response: Response, store: JSONStore): task.Result<JSON> => {
      const text = response.responseText;
      return task.newResult(text ? base.stringToJSON(text) : null);
    };

/**
 * return {adapt.net.JSONStore}
 */
export const newJSONStore = () =>
    new ResourceStore(parseJSONResource, XMLHttpRequestResponseType.TEXT);
