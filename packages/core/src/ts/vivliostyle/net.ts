/**
 * Copyright 2013 Google, Inc.
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
 * @fileoverview Net - Fetch resource from a URL.
 */
import * as Base from "./base";
import * as Logging from "./logging";
import * as Task from "./task";
import * as TaskUtil from "./task-util";
import { Net, XmlDoc } from "./types";
import UserAgentXml from "../resources/user-agent.xml";

/**
 * @enum {string}
 */
export enum XMLHttpRequestResponseType {
  DEFAULT = "",
  ARRAYBUFFER = "arraybuffer",
  BLOB = "blob",
  DOCUMENT = "document",
  JSON = "json",
  TEXT = "text",
}

export type Response = Net.Response;

export function ajax(
  url: string,
  opt_type?: XMLHttpRequestResponseType,
  opt_method?: string,
  opt_data?: string,
  opt_contentType?: string,
): Task.Result<Response> {
  const frame: Task.Frame<Response> = Task.newFrame("ajax");
  const request = new XMLHttpRequest();
  const continuation = frame.suspend(request);
  const response: Response = {
    status: 0,
    statusText: "",
    url,
    contentType: null,
    responseText: null,
    responseXML: null,
    responseBlob: null,
  };
  request.open(opt_method || "GET", url, true);
  if (opt_type) {
    request.responseType = opt_type;
  }
  request.onreadystatechange = () => {
    if (request.readyState === 4) {
      response.status = request.status;
      response.statusText =
        request.statusText || (request.status == 404 && "Not Found") || "";
      if (response.status == 200 || response.status == 0) {
        if (
          (!opt_type || opt_type === XMLHttpRequestResponseType.DOCUMENT) &&
          request.responseXML &&
          request.responseXML.documentElement.localName != "parsererror"
        ) {
          response.responseXML = request.responseXML;
          response.contentType = (request.responseXML as any).contentType;
        } else if (
          (!opt_type || opt_type === XMLHttpRequestResponseType.DOCUMENT) &&
          request.response instanceof HTMLDocument
        ) {
          response.responseXML = request.response;
          response.contentType = (request.response as any).contentType;
        } else {
          const text = request.response;
          if (
            (!opt_type || opt_type === XMLHttpRequestResponseType.TEXT) &&
            typeof text == "string"
          ) {
            response.responseText = text;
          } else if (!text) {
            Logging.logger.warn("Unexpected empty success response for", url);
          } else {
            if (typeof text == "string") {
              response.responseBlob = makeBlob([text]);
            } else {
              response.responseBlob = text as Blob;
            }
          }
          const contentTypeHeader = request.getResponseHeader("Content-Type");
          if (contentTypeHeader) {
            response.contentType = contentTypeHeader.replace(/(.*);.*$/, "$1");
          }
        }
      }
      continuation.schedule(response);
    }
  };
  try {
    if (opt_data) {
      request.setRequestHeader(
        "Content-Type",
        opt_contentType || "text/plain; charset=UTF-8",
      );
      request.send(opt_data);
    } else {
      if (/^file:|^https?:\/\/[^/]+\.githubusercontent\.com|\.opf$/.test(url)) {
        // File or GitHub raw URL or .opf
        if (
          /\/aozorabunko\/[^/]+\/cards\/[^/]+\/files\/[^/.]+\.html$/.test(url)
        ) {
          // Aozorabunko's (X)HTML support
          request.overrideMimeType("text/html; charset=Shift_JIS");
        } else if (/\.(html|htm)$/.test(url)) {
          request.overrideMimeType("text/html; charset=UTF-8");
        } else if (/\.(xhtml|xht|xml|opf)$/.test(url)) {
          request.overrideMimeType("application/xml; charset=UTF-8");
        } else if (/\.(txt|css)$/.test(url)) {
          request.overrideMimeType("text/plain; charset=UTF-8");
        } else {
          // fallback to HTML
          request.overrideMimeType("text/html; charset=UTF-8");
        }
      } else if (/^data:,(<|%3C|%3c)/.test(url)) {
        request.overrideMimeType("text/html; charset=UTF-8");
      } else if (/^data:,/.test(url)) {
        request.overrideMimeType("text/plain; charset=UTF-8");
      }
      request.send(null);
    }
  } catch (e) {
    Logging.logger.warn(e, `Error fetching ${url}`);
    continuation.schedule(response);
  }
  return frame.result();
}

/**
 * @return Blob
 */
export function makeBlob(
  parts: (string | Blob | ArrayBuffer | ArrayBufferView)[],
  opt_type?: string,
): any {
  const type = opt_type || "application/octet-stream";
  const builderCtr = window["WebKitBlobBuilder"] || window["MSBlobBuilder"]; // deprecated
  if (builderCtr) {
    const builder = new builderCtr();
    for (let i = 0; i < parts.length; i++) {
      builder.append(parts[i]);
    }
    return builder.getBlob(type);
  }
  return new Blob(parts, { type });
}

/**
 * @return Task.Result.<ArrayBuffer>
 */
export function readBlob(blob: Blob): any {
  const frame: Task.Frame<ArrayBuffer> = Task.newFrame("readBlob");
  const fileReader = new FileReader();
  const continuation = frame.suspend(fileReader);
  fileReader.addEventListener(
    "load",
    () => {
      continuation.schedule(fileReader.result as ArrayBuffer);
    },
    false,
  );
  fileReader.readAsArrayBuffer(blob);
  return frame.result();
}

export function revokeObjectURL(url: string): void {
  (window["URL"] || window["webkitURL"]).revokeObjectURL(url);
}

/**
 * @return url
 */
export function createObjectURL(blob: Blob): string {
  return (window["URL"] || window["webkitURL"]).createObjectURL(blob);
}

/**
 * @template Resource
 */
export class ResourceStore<Resource> implements Net.ResourceStore<Resource> {
  resources: { [key: string]: Resource } = {};
  fetchers: { [key: string]: TaskUtil.Fetcher<Resource> } = {};

  constructor(
    public readonly parser: (
      p1: Response,
      p2: ResourceStore<Resource>,
    ) => Task.Result<Resource>,
    public readonly type: XMLHttpRequestResponseType,
  ) {}

  /**
   * @return resource for the given URL
   */
  load(
    url: string,
    opt_required?: boolean,
    opt_message?: string,
  ): Task.Result<Resource> {
    url = Base.stripFragment(url);
    const resource = this.resources[url];
    if (typeof resource != "undefined") {
      return Task.newResult(resource);
    }
    return this.fetch(url, opt_required, opt_message).get();
  }

  private fetchInner(
    url: string,
    opt_required?: boolean,
    opt_message?: string,
  ): Task.Result<Resource> {
    const self = this;
    const frame: Task.Frame<Resource> = Task.newFrame("fetch");

    // Hack for TOCView.showTOC()
    const isTocBox = url.endsWith("?viv-toc-box");
    if (isTocBox) {
      url = url.replace("?viv-toc-box", "");
    }
    const userAgentXmlUrl = Base.resolveURL(
      "user-agent.xml",
      Base.resourceBaseURL,
    );
    const isUserAgentXml = !isTocBox && url === userAgentXmlUrl;
    if (isUserAgentXml) {
      // Change "user-agent.xml" URL to data URL
      url = `data:application/xml,${encodeURIComponent(UserAgentXml)}`;
    }

    ajax(url, self.type).then((response) => {
      if (response.status >= 400) {
        if (opt_required) {
          throw new Error(
            (opt_message || `Failed to fetch required resource: ${url}`) +
              ` (${response.status}${
                response.statusText ? " " + response.statusText : ""
              })`,
          );
        }
      }
      if (isTocBox) {
        // Hack for TOCView.showTOC()
        url += "?viv-toc-box";
        response.url += "?viv-toc-box";
      } else if (isUserAgentXml) {
        // Restore "user-agent.xml" URL
        response.url = url = userAgentXmlUrl;
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
  fetch(
    url: string,
    opt_required?: boolean,
    opt_message?: string,
  ): TaskUtil.Fetcher<Resource> {
    url = Base.stripFragment(url);
    const resource = this.resources[url];
    if (resource) {
      return null;
    }
    let fetcher = this.fetchers[url];
    if (!fetcher) {
      const self = this;
      fetcher = new TaskUtil.Fetcher(
        () => self.fetchInner(url, opt_required, opt_message),
        `Fetch ${url}`,
      );
      self.fetchers[url] = fetcher;
      fetcher.start();
    }
    return fetcher;
  }

  get(url: string): XmlDoc.XMLDocHolder {
    const resource: unknown = this.resources[Base.stripFragment(url)];
    return resource as XmlDoc.XMLDocHolder;
  }

  delete(url: string) {
    delete this.resources[Base.stripFragment(url)];
  }
}

export type JSONStore = ResourceStore<Base.JSON>;

export function parseJSONResource(
  response: Response,
  store: JSONStore,
): Task.Result<Base.JSON> {
  const text = response.responseText;
  return Task.newResult(text ? Base.stringToJSON(text) : null);
}

export function newJSONStore(): JSONStore {
  return new ResourceStore(parseJSONResource, XMLHttpRequestResponseType.TEXT);
}
