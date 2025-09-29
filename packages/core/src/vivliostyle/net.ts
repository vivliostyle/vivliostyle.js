/**
 * Copyright 2013 Google, Inc.
 * Copyright 2015 Daishinsha Inc.
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
import { UserAgentXml } from "./assets";

/**
 * @enum {string}
 */
export enum FetchResponseType {
  DEFAULT = "",
  ARRAYBUFFER = "arraybuffer",
  BLOB = "blob",
  DOCUMENT = "document",
  JSON = "json",
  TEXT = "text",
}

export type FetchResponse = Net.FetchResponse;

export function fetchFromURL(
  url: string,
  opt_type?: FetchResponseType,
  opt_method?: string,
): Task.Result<FetchResponse> {
  const frame: Task.Frame<FetchResponse> = Task.newFrame("fetchFromURL");
  const requestInit: RequestInit = {
    method: opt_method || "GET",
    mode: "cors",
  };

  const continuation = frame.suspend();
  const response: FetchResponse = {
    status: 0,
    statusText: "",
    url,
    contentType: null,
    responseText: null,
    responseXML: null,
    responseBlob: null,
  };

  fetch(url, requestInit)
    .then((res) => {
      response.status = res.status;
      response.url = res.url;
      response.statusText = res.statusText;
      response.contentType = res.headers
        .get("Content-Type")
        ?.replace(/;.*$/, "")
        .toLowerCase();

      if (!res.ok) {
        // TODO: Handle error response
        return res.text();
      }
      if (opt_type === FetchResponseType.BLOB) {
        return res.blob();
      }
      if (opt_type === FetchResponseType.ARRAYBUFFER) {
        return res.arrayBuffer();
      }
      if (opt_type === FetchResponseType.JSON) {
        return res.json();
      }

      // Aozorabunko's (X)HTML support
      if (
        /\/aozorabunko\/[^/]+\/cards\/[^/]+\/files\/[^/.]+\.html$/.test(url)
      ) {
        response.contentType = "text/html";
        return res.arrayBuffer().then((buffer) => {
          const decoder = new TextDecoder("Shift_JIS");
          const text = decoder.decode(buffer);
          return text;
        });
      }
      // Treat `data:,<h1>Hello</h1>` as text/html
      if (/^data:,(<|%3c)/i.test(url)) {
        response.contentType = "text/html";
      }

      return res.text();
    })
    .then((fetchedContent) => {
      if (
        opt_type === FetchResponseType.BLOB &&
        fetchedContent instanceof Blob
      ) {
        response.responseBlob = fetchedContent;
      } else if (
        opt_type === FetchResponseType.ARRAYBUFFER &&
        fetchedContent instanceof ArrayBuffer
      ) {
        response.responseBlob = makeBlob([fetchedContent]);
      } else if (opt_type === FetchResponseType.JSON) {
        response.responseText = JSON.stringify(fetchedContent);
      } else if (typeof fetchedContent === "string") {
        response.responseText = fetchedContent;
      }
      continuation.schedule(response);
    })
    .catch((e) => {
      Logging.logger.warn(e, `Error fetching ${url}`);
      continuation.schedule(response);
    });
  return frame.result();
}

export function makeBlob(parts: BlobPart[], opt_type?: string): Blob {
  const type = opt_type || "application/octet-stream";
  return new Blob(parts, { type });
}

export function readBlob(blob: Blob): Task.Result<ArrayBuffer> {
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
  URL.revokeObjectURL(url);
}

/**
 * @return url
 */
export function createObjectURL(blob: Blob): string {
  return URL.createObjectURL(blob);
}

/**
 * @template Resource
 */
export class ResourceStore<Resource> implements Net.ResourceStore<Resource> {
  resources: { [key: string]: Resource } = {};
  fetchers: { [key: string]: TaskUtil.Fetcher<Resource> } = {};

  constructor(
    public readonly parser: (
      p1: FetchResponse,
      p2: ResourceStore<Resource>,
    ) => Task.Result<Resource>,
    public readonly type: FetchResponseType,
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

    fetchFromURL(url, this.type).then((response) => {
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
      this.parser(response, this).then((resource) => {
        delete this.fetchers[url];
        this.resources[url] = resource;
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
      fetcher = new TaskUtil.Fetcher(
        () => this.fetchInner(url, opt_required, opt_message),
        `Fetch ${url}`,
      );
      this.fetchers[url] = fetcher;
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
  response: FetchResponse,
  store: JSONStore,
): Task.Result<Base.JSON> {
  const text = response.responseText;
  return Task.newResult(text ? Base.stringToJSON(text) : null);
}

export function newJSONStore(): JSONStore {
  return new ResourceStore(parseJSONResource, FetchResponseType.TEXT);
}

/**
 * @return holding event type (load/error/abort)
 */
export function loadElement(
  elem: Element,
  src?: string,
  alt?: string,
): TaskUtil.Fetcher<string> {
  const fetcher = new TaskUtil.Fetcher(
    () => {
      const frame: Task.Frame<string> = Task.newFrame("loadElement");
      const continuation = frame.suspend(elem);
      let done = false;
      const handler = (evt: Event) => {
        if (done) {
          return;
        } else {
          done = true;
        }
        continuation.schedule(evt ? evt.type : "timeout");
      };
      elem.addEventListener("load", handler, false);
      elem.addEventListener("error", handler, false);
      elem.addEventListener("abort", handler, false);
      if (elem.namespaceURI == Base.NS.SVG) {
        if (src) {
          elem.setAttributeNS(Base.NS.XLINK, "xlink:href", src);
        }
        // SVG handlers are not reliable
        setTimeout(handler, 300);
      } else if (elem.localName === "script") {
        setTimeout(handler, 3000);
      } else if (src) {
        (elem as any).src = src;
        if (alt) {
          (elem as any).alt = alt;
        }
      }
      return frame.result();
    },
    `loadElement ${src || elem.localName}`,
  );
  fetcher.start();
  return fetcher;
}
