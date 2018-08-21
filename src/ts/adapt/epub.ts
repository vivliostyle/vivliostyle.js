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
 * @fileoverview Deal with META-INF/ and .opf files in EPUB container.
 */
import * as asserts from '../closure/goog/asserts/asserts';
import * as constants from '../vivliostyle/constants';
import * as counters from '../vivliostyle/counters';
import * as logging from '../vivliostyle/logging';

import {JSON} from './base';
import * as base from './base';
import {DocumentURLTransformer} from './base';
import * as cfi from './cfi';
import * as csscasc from './csscasc';
import {parseValue} from './cssparse';
import {Tokenizer} from './csstok';
import {Preferences, clonePreferences, letterbox} from './expr';
import * as font from './font';
import * as net from './net';
import * as ops from './ops';
import * as sha1 from './sha1';
import {Result} from './task';
import {Frame} from './task';
import {Continuation} from './task';
import * as task from './task';
import * as toc from './toc';
import {CustomRenderer, CustomRendererFactory, DefaultClientLayout, Viewport} from './vgen';
import {Page, DelayedItem, LayoutPosition, Spread} from './vtree';
import * as xmldoc from './xmldoc';

type Position = {
  spineIndex: number,
  pageIndex: number,
  offsetInItem: number
};

export {Position};

export class EPUBDocStore extends ops.OPSDocStore {
  plainXMLStore: any;
  jsonStore: any;
  opfByURL: {[key: string]: OPFDoc} = {};
  primaryOPFByEPubURL: {[key: string]: OPFDoc} = {};
  deobfuscators: {[key: string]: (p1: Blob) => Result<Blob>} = {};
  documents: {[key: string]: Result<xmldoc.XMLDocHolder>} = {};

  constructor() {
    super(this.makeDeobfuscatorFactory());
    this.plainXMLStore = xmldoc.newXMLDocStore();
    this.jsonStore = net.newJSONStore();
  }

  makeDeobfuscatorFactory():
      ((p1: string) => ((p1: Blob) => Result<Blob>) | null)|null {
    const self = this;
    return (url: string): ((p1: Blob) => Result<Blob>)|null => {
      return self.deobfuscators[url];
    };
  }

  loadAsPlainXML(url: string, opt_required?: boolean, opt_message?: string):
      Result<xmldoc.XMLDocHolder> {
    return this.plainXMLStore.load(url, opt_required, opt_message);
  }

  startLoadingAsPlainXML(url: string): void {
    this.plainXMLStore.fetch(url);
  }

  loadAsJSON(url: string): Result<JSON> {
    return this.jsonStore.load(url);
  }

  startLoadingAsJSON(url: string): void {
    this.jsonStore.fetch(url);
  }

  loadEPUBDoc(url: string, haveZipMetadata: boolean): Result<OPFDoc> {
    const self = this;
    const frame: Frame<OPFDoc> = task.newFrame('loadEPUBDoc');
    if (url.substring(url.length - 1) !== '/') {
      url = `${url}/`;
    }
    if (haveZipMetadata) {
      self.startLoadingAsJSON(`${url}?r=list`);
    }
    self.startLoadingAsPlainXML(`${url}META-INF/encryption.xml`);
    const containerURL = `${url}META-INF/container.xml`;
    self.loadAsPlainXML(
            containerURL, true,
            `Failed to fetch EPUB container.xml from ${containerURL}`)
        .then((containerXML) => {
          if (!containerXML) {
            logging.logger.error(`Received an empty response for EPUB container.xml ${
                containerURL}. This may be caused by the server not allowing cross origin requests.`);
          } else {
            const roots = containerXML.doc()
                              .child('container')
                              .child('rootfiles')
                              .child('rootfile')
                              .attribute('full-path');
            for (const root of roots) {
              if (root) {
                self.loadOPF(url, root, haveZipMetadata).thenFinish(frame);
                return;
              }
            }
            frame.finish(null);
          }
        });
    return frame.result();
  }

  loadOPF(epubURL: string, root: string, haveZipMetadata: boolean):
      Result<OPFDoc> {
    const self = this;
    const url = epubURL + root;
    let opf = self.opfByURL[url];
    if (opf) {
      return task.newResult(opf);
    }
    const frame: Frame<OPFDoc> = task.newFrame('loadOPF');
    self.loadAsPlainXML(url).then((opfXML) => {
      if (!opfXML) {
        logging.logger.error(`Received an empty response for EPUB OPF ${
            url}. This may be caused by the server not allowing cross origin requests.`);
      } else {
        self.loadAsPlainXML(`${epubURL}META-INF/encryption.xml`)
            .then((encXML) => {
              const zipMetadataResult = haveZipMetadata ?
                  self.loadAsJSON(`${epubURL}?r=list`) :
                  task.newResult(null);
              zipMetadataResult.then((zipMetadata) => {
                opf = new OPFDoc(self, epubURL);
                opf.initWithXMLDoc(
                       opfXML, encXML, zipMetadata, `${epubURL}?r=manifest`)
                    .then(() => {
                      self.opfByURL[url] = opf;
                      self.primaryOPFByEPubURL[epubURL] = opf;
                      frame.finish(opf);
                    });
              });
            });
      }
    });
    return frame.result();
  }

  addDocument(url: string, doc: Document) {
    const frame = task.newFrame('EPUBDocStore.load');
    const docURL = base.stripFragment(url);
    const r = this.documents[docURL] = this.parseOPSResource({
      status: 200,
      url: docURL,
      contentType: doc.contentType,
      responseText: null,
      responseXML: doc,
      responseBlob: null
    });
    r.thenFinish(frame);
    return frame.result();
  }

  /**
   * @override
   */
  load(url) {
    const docURL = base.stripFragment(url);
    let r = this.documents[docURL];
    if (r) {
      return r.isPending() ? r : task.newResult(r.get());
    } else {
      const frame = task.newFrame('EPUBDocStore.load');
      r = super(
          docURL, true,
          `Failed to fetch a source document from ${docURL}`);
      r.then((xmldoc) => {
        if (!xmldoc) {
          logging.logger.error(`Received an empty response for ${
              docURL}. This may be caused by the server not allowing cross origin requests.`);
        } else {
          frame.finish(xmldoc);
        }
      });
      return frame.result();
    }
  }
}

type OPFItemParam = {
  url: string,
  index: number,
  startPage: number|null,
  skipPagesBefore: number|null
};

export {OPFItemParam};

export class OPFItem {
  id: string|null = null;
  src: string = '';
  mediaType: string|null = null;
  itemRefElement: Element = null;
  spineIndex: number = -1;
  compressedSize: number = 0;
  compressed: boolean|null = null;
  epage: number = 0;
  epageCount: number = 0;
  startPage: number|null = null;
  skipPagesBefore: number|null = null;
  itemProperties: {[key: string]: boolean};

  constructor() {
    this.itemProperties = base.emptyObj;
  }

  initWithElement(itemElem: Element, opfURL: string): void {
    this.id = itemElem.getAttribute('id');
    this.src = base.resolveURL(itemElem.getAttribute('href'), opfURL);
    this.mediaType = itemElem.getAttribute('media-type');
    const propStr = itemElem.getAttribute('properties');
    if (propStr) {
      this.itemProperties = base.arrayToSet(propStr.split(/\s+/));
    }
  }

  initWithParam(param: OPFItemParam) {
    this.spineIndex = param.index;
    this.id = `item${param.index + 1}`;
    this.src = param.url;
    this.startPage = param.startPage;
    this.skipPagesBefore = param.skipPagesBefore;
  }
}

export const getOPFItemId = (item: OPFItem): string|null => item.id;

export const makeDeobfuscator = (uid: string): (p1: Blob) => Result<Blob> => {
  // TODO: use UTF8 of uid
  const sha1 = sha1.bytesToSHA1Int8(uid);
  return (blob) => {
    const frame = (task.newFrame('deobfuscator') as Frame<Blob>);
    let head;
    let tail;
    if (blob.slice) {
      head = blob.slice(0, 1040);
      tail = blob.slice(1040, blob.size);
    } else {
      head = blob['webkitSlice'](0, 1040);
      tail = blob['webkitSlice'](1040, blob.size - 1040);
    }
    net.readBlob(head).then((buf) => {
      const dataView = new DataView(buf);
      for (let k = 0; k < dataView.byteLength; k++) {
        let b = dataView.getUint8(k);
        b ^= sha1[k % 20];
        dataView.setUint8(k, b);
      }
      frame.finish(net.makeBlob([dataView, tail]));
    });
    return frame.result();
  };
};

export const makeObfuscationKey = (uid: string): string =>
    `1040:${sha1.bytesToSHA1Hex(uid)}`;
type RawMetaItem = {
  name: string,
  value: string,
  id: string|null,
  refines: string|null,
  scheme: string|null,
  lang: string|null,
  order: number
};

export {RawMetaItem};

export const predefinedPrefixes = {
  'dcterms': 'http://purl.org/dc/terms/',
  'marc': 'http://id.loc.gov/vocabulary/',
  'media': 'http://www.idpf.org/epub/vocab/overlays/#',
  'onix': 'http://www.editeur.org/ONIX/book/codelists/current.html#',
  'xsd': 'http://www.w3.org/2001/XMLSchema#'
};

export const defaultIRI = 'http://idpf.org/epub/vocab/package/#';

export const metaTerms = {
  language: `${predefinedPrefixes['dcterms']}language`,
  title: `${predefinedPrefixes['dcterms']}title`,
  creator: `${predefinedPrefixes['dcterms']}creator`,
  titleType: `${defaultIRI}title-type`,
  displaySeq: `${defaultIRI}display-seq`,
  alternateScript: `${defaultIRI}alternate-script`
};

export const getMetadataComparator = (term: string, lang: string): (
    p1: JSON, p2: JSON) => number => {
  const empty = {};
  return (item1, item2) => {
    let m1;
    let m2;
    const r1 = item1['r'] || empty;
    const r2 = item2['r'] || empty;
    if (term == metaTerms.title) {
      m1 = r1[metaTerms.titleType] == 'main';
      m2 = r2[metaTerms.titleType] == 'main';
      if (m1 != m2) {
        return m1 ? -1 : 1;
      }
    }
    let i1 = parseInt(r1[metaTerms.displaySeq], 10);
    if (isNaN(i1)) {
      i1 = Number.MAX_VALUE;
    }
    let i2 = parseInt(r2[metaTerms.displaySeq], 10);
    if (isNaN(i2)) {
      i2 = Number.MAX_VALUE;
    }
    if (i1 != i2) {
      return i1 - i2;
    }
    if (term != metaTerms.language && lang) {
      m1 = (r1[metaTerms.language] || r1[metaTerms.alternateScript]) == lang;
      m2 = (r2[metaTerms.language] || r2[metaTerms.alternateScript]) == lang;
      if (m1 != m2) {
        return m1 ? -1 : 1;
      }
    }
    return item1['o'] - item2['o'];
  };
};

export const readMetadata = (mroot: xmldoc.NodeList, prefixes: string|null): JSON => {
  // Parse prefix map (if any)
  let prefixMap;
  if (!prefixes) {
    prefixMap = predefinedPrefixes;
  } else {
    prefixMap = {};
    for (const pn in predefinedPrefixes) {
      prefixMap[pn] = predefinedPrefixes[pn];
    }
    let r;

    // This code permits any non-ASCII characters in the name to avoid bloating
    // the pattern.
    while (
        (r = prefixes.match(
             /(^\s*[A-Z_a-z\u007F-\uFFFF][-.A-Z_a-z0-9\u007F-\uFFFF]*):\s*(\S+)/)) !=
        null) {
      prefixes = prefixes.substr(r[0].length);
      prefixMap[r[1]] = r[2];
    }
  }
  const resolveProperty = (val: string|null): string|null => {
    if (val) {
      const r = val.match(/^\s*(([^:]*):)?(\S+)\s*$/);
      if (r) {
        const iri = r[1] ? prefixMap[r[1]] : defaultIRI;
        if (iri) {
          return iri + r[3];
        }
      }
    }
    return null;
  };
  let order = 1;

  // List of metadata items.
  const rawItems = mroot.childElements().forEachNonNull((node) => {
    if (node.localName == 'meta') {
      const p = resolveProperty(node.getAttribute('property'));
      if (p) {
        return {
          name: p,
          value: node.textContent,
          id: node.getAttribute('id'),
          order: order++,
          refines: node.getAttribute('refines'),
          lang: null,
          scheme: resolveProperty(node.getAttribute('scheme'))
        };
      }
    } else {
      if (node.namespaceURI == base.NS.DC) {
        return {
          name: predefinedPrefixes['dcterms'] + node.localName,
          order: order++,
          lang: node.getAttribute('xml:lang'),
          value: node.textContent,
          id: node.getAttribute('id'),
          refines: null,
          scheme: null
        };
      }
    }
    return null;
  });

  // Items grouped by their target id.
  const rawItemsByTarget =
      base.multiIndexArray(rawItems, (rawItem) => rawItem.refines);
  const makeMetadata = (map) =>
      base.mapObj(map, (rawItemArr, itemName) => {
        const result = base.map(rawItemArr, (rawItem) => {
          const entry = {'v': rawItem.value, 'o': rawItem.order};
          if (rawItem.schema) {
            entry['s'] = rawItem.scheme;
          }
          if (rawItem.id || rawItem.lang) {
            let refs = rawItemsByTarget[rawItem.id];
            if (refs || rawItem.lang) {
              if (rawItem.lang) {
                // Special handling for xml:lang
                const langItem = {
                  name: metaTerms.language,
                  value: rawItem.lang,
                  lang: null,
                  id: null,
                  refines: rawItem.id,
                  scheme: null,
                  order: rawItem.order
                };
                if (refs) {
                  refs.push(langItem);
                } else {
                  refs = [langItem];
                }
              }
              const entryMap =
                  base.multiIndexArray(refs, (rawItem) => rawItem.name);
              entry['r'] = makeMetadata(entryMap);
            }
          }
          return entry;
        });
        return result;
      });
  const metadata = makeMetadata(base.multiIndexArray(
      rawItems, (rawItem) => rawItem.refines ? null : rawItem.name));
  let lang = null;
  if (metadata[metaTerms.language]) {
    lang = metadata[metaTerms.language][0]['v'];
  }
  const sortMetadata = (metadata) => {
    for (const term in metadata) {
      const arr = (metadata[term] as Array);
      arr.sort(getMetadataComparator(term, lang));
      for (let i = 0; i < arr.length; i++) {
        const r = arr[i]['r'];
        if (r) {
          sortMetadata(r);
        }
      }
    }
  };
  sortMetadata(metadata);
  return metadata;
};

export const getMathJaxHub = (): Object => {
  const math = window['MathJax'];
  if (math) {
    return math['Hub'];
  }
  return null;
};

export const checkMathJax = (): void => {
  if (getMathJaxHub()) {
    csscasc.supportedNamespaces[base.NS.MATHML] = true;
  }
};

export const supportedMediaTypes = {
  'appliaction/xhtml+xml': true,
  'image/jpeg': true,
  'image/png': true,
  'image/svg+xml': true,
  'image/gif': true,
  'audio/mp3': true
};

export const transformedIdPrefix = 'viv-id-';

export class OPFDoc {
  opfXML: xmldoc.XMLDocHolder = null;
  encXML: xmldoc.XMLDocHolder = null;
  items: OPFItem[] = null;
  spine: OPFItem[] = null;
  itemMap: {[key: string]: OPFItem} = null;
  itemMapByPath: {[key: string]: OPFItem} = null;
  uid: string|null = null;
  bindings: {[key: string]: string} = {};
  lang: string|null = null;
  epageCount: number = 0;
  metadata: JSON = {};
  ncxToc: OPFItem = null;
  xhtmlToc: OPFItem = null;
  cover: OPFItem = null;
  fallbackMap: {[key: string]: string} = {};
  pageProgression: constants.PageProgression|null = null;
  documentURLTransformer: any;

  constructor(
      public readonly store: EPUBDocStore, public readonly epubURL: string) {
    this.documentURLTransformer = this.createDocumentURLTransformer();
    checkMathJax();
  }

  createDocumentURLTransformer() {
    const self = this;

    class OPFDocumentURLTransformer implements DocumentURLTransformer {
      /**
       * @override
       */
      transformFragment(fragment, baseURL) {
        const url = baseURL + (fragment ? `#${fragment}` : '');
        return transformedIdPrefix + base.escapeNameStrToHex(url, ':');
      }

      /**
       * @override
       */
      transformURL(url, baseURL) {
        const r = url.match(/^([^#]*)#?(.*)$/);
        if (r) {
          const path = r[1] || baseURL;
          const fragment = r[2];
          if (path) {
            if (self.items.some((item) => item.src === path)) {
              return `#${this.transformFragment(fragment, path)}`;
            }
          }
        }
        return url;
      }

      /**
       * @override
       */
      restoreURL(encoded) {
        if (encoded.charAt(0) === '#') {
          encoded = encoded.substring(1);
        }
        if (encoded.indexOf(transformedIdPrefix) === 0) {
          encoded = encoded.substring(transformedIdPrefix.length);
        }
        const decoded = base.unescapeStrFromHex(encoded, ':');
        const r = decoded.match(/^([^#]*)#?(.*)$/);
        return r ? [r[1], r[2]] : [];
      }
    }
    return new OPFDocumentURLTransformer();
  }

  /**
   * Metadata is organized in the following way: fully-expanded property names
   * (with IRI prefixes prepended) point to an array of values. Array contains
   * at least one element. First element is primary and should be used by
   * default. Element values are objects have the following keys:
   * - "v" - item value as string,
   * - "s" - scheme,
   * - "o" - index in the order of appearing in the source,
   * - "r" - refinement submetadata (organized just like the top-level
   * metadata).
   */
  getMetadata(): JSON {
    return this.metadata;
  }

  getPathFromURL(url: string): string|null {
    if (this.epubURL) {
      return url.substr(0, this.epubURL.length) == this.epubURL ?
          decodeURI(url.substr(this.epubURL.length)) :
          null;
    } else {
      return url;
    }
  }

  initWithXMLDoc(
      opfXML: xmldoc.XMLDocHolder, encXML: xmldoc.XMLDocHolder,
      zipMetadata: JSON, manifestURL: string): Result {
    const self = this;
    this.opfXML = opfXML;
    this.encXML = encXML;
    const pkg = opfXML.doc().child('package');
    const uidref = pkg.attribute('unique-identifier')[0];
    if (uidref) {
      const uidElem = opfXML.getElement(`${opfXML.url}#${uidref}`);
      if (uidElem) {
        this.uid = uidElem.textContent.replace(/[ \n\r\t]/g, '');
      }
    }
    const srcToFallbackId = {};
    this.items = base.map(
        pkg.child('manifest').child('item').asArray(), (node) => {
          const item = new OPFItem();
          const elem = (node as Element);
          item.initWithElement(elem, opfXML.url);
          const fallback = elem.getAttribute('fallback');
          if (fallback && !supportedMediaTypes[item.mediaType]) {
            srcToFallbackId[item.src] = fallback;
          }
          if (!self.xhtmlToc && item.itemProperties['nav']) {
            self.xhtmlToc = item;
          }
          if (!self.cover && item.itemProperties['cover-image']) {
            self.cover = item;
          }
          return item;
        });
    this.itemMap = base.indexArray(
        this.items, (getOPFItemId as (p1: OPFItem) => string | null));
    this.itemMapByPath = base.indexArray(
        this.items, (item) => self.getPathFromURL(item.src));
    for (const src in srcToFallbackId) {
      let fallbackSrc = src;
      while (true) {
        let item = this.itemMap[srcToFallbackId[fallbackSrc]];
        if (!item) {
          break;
        }
        if (supportedMediaTypes[item.mediaType]) {
          this.fallbackMap[src] = item.src;
          break;
        }
        fallbackSrc = item.src;
      }
    }
    this.spine = base.map(
        pkg.child('spine').child('itemref').asArray(), (node, index) => {
          const elem = (node as Element);
          const id = elem.getAttribute('idref');
          const item = self.itemMap[(id as string)];
          if (item) {
            item.itemRefElement = elem;
            item.spineIndex = index;
          }
          return item;
        });
    const tocAttr = pkg.child('spine').attribute('toc')[0];
    if (tocAttr) {
      this.ncxToc = this.itemMap[tocAttr];
    }
    const pageProgressionAttr =
        pkg.child('spine').attribute('page-progression-direction')[0];
    if (pageProgressionAttr) {
      this.pageProgression = constants.PageProgression.of(pageProgressionAttr);
    }
    const idpfObfURLs = !encXML ?
        [] :
        encXML.doc()
            .child('encryption')
            .child('EncryptedData')
            .predicate(xmldoc.predicate.withChild(
                'EncryptionMethod',
                xmldoc.predicate.withAttribute(
                    'Algorithm', 'http://www.idpf.org/2008/embedding')))
            .child('CipherData')
            .child('CipherReference')
            .attribute('URI');
    const mediaTypeElems = pkg.child('bindings').child('mediaType').asArray();
    for (let i = 0; i < mediaTypeElems.length; i++) {
      const handlerId = mediaTypeElems[i].getAttribute('handler');
      let mediaType = mediaTypeElems[i].getAttribute('media-type');
      if (mediaType && handlerId && this.itemMap[handlerId]) {
        this.bindings[mediaType] = this.itemMap[handlerId].src;
      }
    }
    this.metadata =
        readMetadata(pkg.child('metadata'), pkg.attribute('prefix')[0]);
    if (this.metadata[metaTerms.language]) {
      this.lang = this.metadata[metaTerms.language][0]['v'];
    }
    if (!zipMetadata) {
      if (idpfObfURLs.length > 0 && this.uid) {
        // Have to deobfuscate in JavaScript
        const deobfuscator = makeDeobfuscator(this.uid);
        for (let i = 0; i < idpfObfURLs.length; i++) {
          this.store.deobfuscators[this.epubURL + idpfObfURLs[i]] =
              deobfuscator;
        }
      }
      return task.newResult(true);
    }
    const manifestText = new base.StringBuffer();
    const obfuscations = {};
    if (idpfObfURLs.length > 0 && this.uid) {
      // Deobfuscate in the server.
      const obfuscationKey = makeObfuscationKey(this.uid);
      for (let i = 0; i < idpfObfURLs.length; i++) {
        obfuscations[idpfObfURLs[i]] = obfuscationKey;
      }
    }
    for (let i = 0; i < zipMetadata.length; i++) {
      const entry = zipMetadata[i];
      const encodedPath = entry['n'];
      if (encodedPath) {
        const path = decodeURI(encodedPath);
        let item = this.itemMapByPath[path];
        let mediaType = null;
        if (item) {
          item.compressed = entry['m'] != 0;
          item.compressedSize = entry['c'];
          if (item.mediaType) {
            mediaType = item.mediaType.replace(/\s+/g, '');
          }
        }
        const obfuscation = obfuscations[path];
        if (mediaType || obfuscation) {
          manifestText.append(encodedPath);
          manifestText.append(' ');
          manifestText.append(mediaType || 'application/octet-stream');
          if (obfuscation) {
            manifestText.append(' ');
            manifestText.append(obfuscation);
          }
          manifestText.append('\n');
        }
      }
    }
    self.assignAutoPages();
    return net.ajax(
        manifestURL, net.XMLHttpRequestResponseType.DEFAULT, 'POST',
        manifestText.toString(), 'text/plain');
  }

  assignAutoPages(): void {
    let epage = 0;
    for (const item of this.spine) {
      const epageCount = Math.ceil(item.compressedSize / 1024);
      item.epage = epage;
      item.epageCount = epageCount;
      epage += epageCount;
    }
    this.epageCount = epage;
  }

  /**
   * Creates a fake OPF "document" that contains OPS chapters.
   */
  initWithChapters(params: OPFItemParam[], doc: Document|null) {
    this.itemMap = {};
    this.itemMapByPath = {};
    this.items = [];
    this.spine = this.items;

    // create a minimum fake OPF XML for navigation with EPUB CFI
    const opfXML = this.opfXML = new xmldoc.XMLDocHolder(
        null, '',
        (new DOMParser()).parseFromString('<spine></spine>', 'text/xml'));
    params.forEach(function(param) {
      const item = new OPFItem();
      item.initWithParam(param);
      asserts.assert(item.id);
      const itemref = opfXML.document.createElement('itemref');
      itemref.setAttribute('idref', item.id);
      opfXML.root.appendChild(itemref);
      item.itemRefElement = itemref;
      this.itemMap[item.id] = item;
      this.itemMapByPath[param.url] = item;
      this.items.push(item);
    }, this);
    if (doc) {
      return this.store.addDocument(params[0].url, doc);
    } else {
      return task.newResult(null);
    }
  }

  /**
   * @return cfi
   */
  getCFI(spineIndex: number, offsetInItem: number): Result<string|null> {
    const item = this.spine[spineIndex];
    const frame: Frame<string|null> = task.newFrame('getCFI');
    this.store.load(item.src).then((xmldoc) => {
      const node = xmldoc.getNodeByOffset(offsetInItem);
      let cfi = null;
      if (node) {
        const startOffset = xmldoc.getNodeOffset(node, 0, false);
        const offsetInNode = offsetInItem - startOffset;
        const fragment = new cfi.Fragment();
        fragment.prependPathFromNode(node, offsetInNode, false, null);
        if (item.itemRefElement) {
          fragment.prependPathFromNode(item.itemRefElement, 0, false, null);
        }
        cfi = fragment.toString();
      }
      frame.finish(cfi);
    });
    return frame.result();
  }

  resolveFragment(fragstr: string|null): Result<Position|null> {
    const self = this;
    return task.handle(
        'resolveFragment',
        (frame: Frame<Position|null>):
            void => {
              if (!fragstr) {
                frame.finish(null);
                return;
              }
              let fragment = new cfi.Fragment();
              fragment.fromString(fragstr);
              let item;
              if (self.opfXML) {
                const opfNav = fragment.navigate(self.opfXML.document);
                if (opfNav.node.nodeType != 1 || opfNav.after || !opfNav.ref) {
                  frame.finish(null);
                  return;
                }
                const elem = (opfNav.node as Element);
                const idref = elem.getAttribute('idref');
                if (elem.localName != 'itemref' || !idref ||
                    !self.itemMap[idref]) {
                  frame.finish(null);
                  return;
                }
                item = self.itemMap[idref];
                fragment = opfNav.ref;
              } else {
                item = self.spine[0];
              }
              self.store.load(item.src).then((xmldoc) => {
                const nodeNav = fragment.navigate(xmldoc.document);
                const offset = xmldoc.getNodeOffset(
                    nodeNav.node, nodeNav.offset, nodeNav.after);
                frame.finish({
                  spineIndex: item.spineIndex,
                  offsetInItem: offset,
                  pageIndex: -1
                });
              });
            },
        (frame: Frame<Position|null>, err: Error):
            void => {
              logging.logger.warn(err, 'Cannot resolve fragment:', fragstr);
              frame.finish(null);
            });
  }

  resolveEPage(epage: number): Result<Position|null> {
    const self = this;
    return task.handle(
        'resolveEPage',
        (frame: Frame<Position|null>):
            void => {
              if (epage <= 0) {
                frame.finish({spineIndex: 0, offsetInItem: 0, pageIndex: -1});
                return;
              }
              const spineIndex =
                  base.binarySearch(self.spine.length, (index) => {
                    const item = self.spine[index];
                    return item.epage + item.epageCount > epage;
                  });
              const item = self.spine[spineIndex];
              self.store.load(item.src).then((xmldoc) => {
                epage -= item.epage;
                if (epage > item.epageCount) {
                  epage = item.epageCount;
                }
                let offset = 0;
                if (epage > 0) {
                  const totalOffset = xmldoc.getTotalOffset();
                  offset = Math.round(totalOffset * epage / item.epageCount);
                  if (offset == totalOffset) {
                    offset--;
                  }
                }
                frame.finish({spineIndex, offsetInItem: offset, pageIndex: -1});
              });
            },
        (frame: Frame<Position|null>, err: Error):
            void => {
              logging.logger.warn(err, 'Cannot resolve epage:', epage);
              frame.finish(null);
            });
  }

  getEPageFromPosition(position: Position): Result<number> {
    const item = this.spine[position.spineIndex];
    if (position.offsetInItem <= 0) {
      return task.newResult(item.epage);
    }
    const frame: Frame<number> = task.newFrame('getEPage');
    this.store.load(item.src).then((xmldoc) => {
      const totalOffset = xmldoc.getTotalOffset();
      const offset = Math.min(totalOffset, position.offsetInItem);
      frame.finish(item.epage + offset * item.epageCount / totalOffset);
    });
    return frame.result();
  }
}
type PageAndPosition = {
  page: Page,
  position: Position
};

export {PageAndPosition};

export const makePageAndPosition =
    (page: Page, pageIndex: number): PageAndPosition => ({
      page,
      position:
          {spineIndex: page.spineIndex, pageIndex, offsetInItem: page.offset}
    });
type OPFViewItem = {
  item: OPFItem,
  xmldoc: xmldoc.XMLDocHolder,
  instance: ops.StyleInstance,
  layoutPositions: LayoutPosition[],
  pages: Page[],
  complete: boolean
};

export {OPFViewItem};

export class OPFView implements CustomRendererFactory {
  spineItems: OPFViewItem[] = [];
  spineItemLoadingContinuations: Continuation[][] = [];
  pref: any;
  clientLayout: any;
  counterStore: any;
  tocView: any;

  constructor(
      public readonly opf: OPFDoc, public readonly viewport: Viewport,
      public readonly fontMapper: font.Mapper, pref: Preferences,
      public readonly pageSheetSizeReporter:
          (p1: {width: number, height: number},
           p2: {[key: string]: {width: number, height: number}}, p3: number,
           p4: number) => any) {
    this.pref = clonePreferences(pref);
    this.clientLayout = new DefaultClientLayout(viewport);
    this.counterStore = new counters.CounterStore(opf.documentURLTransformer);
  }

  private getPage(position: Position): Page {
    const viewItem = this.spineItems[position.spineIndex];
    return viewItem ? viewItem.pages[position.pageIndex] : null;
  }

  getCurrentPageProgression(position: Position): constants.PageProgression
      |null {
    if (this.opf.pageProgression) {
      return this.opf.pageProgression;
    } else {
      const viewItem = this.spineItems[position ? position.spineIndex : 0];
      return viewItem ? viewItem.instance.pageProgression : null;
    }
  }

  private finishPageContainer(
      viewItem: OPFViewItem, page: Page, pageIndex: number) {
    page.container.style.display = 'none';
    page.container.style.visibility = 'visible';
    page.container.style.position = '';
    page.container.style.top = '';
    page.container.style.left = '';
    page.container.setAttribute(
        'data-vivliostyle-page-side', (page.side as string));
    const oldPage = viewItem.pages[pageIndex];
    page.isFirstPage = viewItem.item.spineIndex == 0 && pageIndex == 0;
    viewItem.pages[pageIndex] = page;
    if (oldPage) {
      viewItem.instance.viewport.contentContainer.replaceChild(
          page.container, oldPage.container);
      oldPage.dispatchEvent(
          {type: 'replaced', target: null, currentTarget: null, newPage: page});
    } else {
      viewItem.instance.viewport.contentContainer.appendChild(page.container);
    }
    this.pageSheetSizeReporter(
        {
          width: viewItem.instance.pageSheetWidth,
          height: viewItem.instance.pageSheetHeight
        },
        viewItem.instance.pageSheetSize, viewItem.item.spineIndex,
        viewItem.instance.pageNumberOffset + pageIndex);
  }

  /**
   * Render a single page. If the new page contains elements with ids that are
   * referenced from other pages by 'target-counter()', those pages are rendered
   * too (calling `renderSinglePage` recursively).
   */
  private renderSinglePage(viewItem: OPFViewItem, pos: LayoutPosition):
      Result<OPFView.RenderSinglePageResult> {
    const frame: Frame<OPFView.RenderSinglePageResult> =
        task.newFrame('renderSinglePage');
    let page = this.makePage(viewItem, pos);
    const self = this;
    viewItem.instance.layoutNextPage(page, pos).then((posParam) => {
      pos = (posParam as LayoutPosition);
      const pageIndex =
          pos ? pos.page - 1 : viewItem.layoutPositions.length - 1;
      self.finishPageContainer(viewItem, page, pageIndex);
      self.counterStore.finishPage(page.spineIndex, pageIndex);

      // If the position of the page break change, we should re-layout the next
      // page too.
      let cont = null;
      if (pos) {
        const prevPos = viewItem.layoutPositions[pos.page];
        viewItem.layoutPositions[pos.page] = pos;
        if (prevPos && viewItem.pages[pos.page]) {
          if (!pos.isSamePosition(prevPos)) {
            cont = self.renderSinglePage(viewItem, pos);
          }
        }
      }
      if (!cont) {
        cont = task.newResult(true);
      }
      cont.then(() => {
        const unresolvedRefs = self.counterStore.getUnresolvedRefsToPage(page);
        let index = 0;
        frame
            .loopWithFrame((loopFrame) => {
              index++;
              if (index > unresolvedRefs.length) {
                loopFrame.breakLoop();
                return;
              }
              const refs = unresolvedRefs[index - 1];
              refs.refs = refs.refs.filter((ref) => !ref.isResolved());
              if (refs.refs.length === 0) {
                loopFrame.continueLoop();
                return;
              }
              self.getPageViewItem(refs.spineIndex).then((viewItem) => {
                if (!viewItem) {
                  loopFrame.continueLoop();
                  return;
                }
                self.counterStore.pushPageCounters(refs.pageCounters);
                self.counterStore.pushReferencesToSolve(refs.refs);
                const pos = viewItem.layoutPositions[refs.pageIndex];
                self.renderSinglePage(viewItem, pos).then((result) => {
                  self.counterStore.popPageCounters();
                  self.counterStore.popReferencesToSolve();
                  const resultPosition = result.pageAndPosition.position;
                  if (resultPosition.spineIndex === page.spineIndex &&
                      resultPosition.pageIndex === pageIndex) {
                    page = result.pageAndPosition.page;
                  }
                  loopFrame.continueLoop();
                });
              });
            })
            .then(() => {
              page.isLastPage = !pos &&
                  viewItem.item.spineIndex === self.opf.spine.length - 1;
              if (page.isLastPage) {
                asserts.assert(self.viewport);
                self.counterStore.finishLastPage(self.viewport);
              }
              frame.finish({
                pageAndPosition: makePageAndPosition(page, pageIndex),
                nextLayoutPosition: pos
              });
            });
      });
    });
    return frame.result();
  }

  private normalizeSeekPosition(position: Position, viewItem: OPFViewItem):
      Position|null {
    let pageIndex = position.pageIndex;
    let seekOffset = -1;
    if (pageIndex < 0) {
      seekOffset = position.offsetInItem;

      // page with offset higher than seekOffset
      const seekOffsetPageIndex = base.binarySearch(
          viewItem.layoutPositions.length, (pageIndex) => {
            // 'noLookAhead' argument of getPosition must be true, since
            // otherwise StyleInstance.currentLayoutPosition is modified
            // unintentionally.
            const offset = viewItem.instance.getPosition(
                viewItem.layoutPositions[pageIndex], true);
            return offset > seekOffset;
          });
      if (seekOffsetPageIndex === viewItem.layoutPositions.length) {
        if (viewItem.complete) {
          pageIndex = viewItem.layoutPositions.length - 1;
        } else {
          // need to search through pages that are not yet produced
          pageIndex = Number.POSITIVE_INFINITY;
        }
      } else {
        // page that contains seekOffset
        pageIndex = seekOffsetPageIndex - 1;
      }
    }
    return ({
      spineIndex: position.spineIndex,
      pageIndex,
      offsetInItem: seekOffset
    } as Position);
  }

  /**
   * Find a page corresponding to a specified position among already laid out
   * pages.
   * @param sync If true, find the page synchronously (not waiting another
   *     rendering task)
   */
  private findPage(position: Position, sync?: boolean):
      Result<PageAndPosition|null> {
    const self = this;
    const frame: Frame<PageAndPosition|null> = task.newFrame('findPage');
    self.getPageViewItem(position.spineIndex).then((viewItem) => {
      if (!viewItem) {
        frame.finish(null);
        return;
      }
      let resultPage = null;
      let pageIndex;
      frame
          .loopWithFrame((loopFrame) => {
            const normalizedPosition =
                self.normalizeSeekPosition(position, viewItem);
            pageIndex = normalizedPosition.pageIndex;
            resultPage = viewItem.pages[pageIndex];
            if (resultPage) {
              loopFrame.breakLoop();
            } else {
              if (viewItem.complete) {
                pageIndex = viewItem.layoutPositions.length - 1;
                resultPage = viewItem.pages[pageIndex];
                loopFrame.breakLoop();
              } else {
                if (sync) {
                  self.renderPage(normalizedPosition).then((result) => {
                    if (result) {
                      resultPage = result.page;
                    }
                    loopFrame.breakLoop();
                  });
                } else {
                  // Wait for the layout task and retry
                  frame.sleep(100).then(() => {
                    loopFrame.continueLoop();
                  });
                }
              }
            }
          })
          .then(() => {
            asserts.assert(resultPage);
            frame.finish(makePageAndPosition(resultPage, pageIndex));
          });
    });
    return frame.result();
  }

  /**
   * Renders a page at the specified position.
   */
  renderPage(position: Position): Result<PageAndPosition|null> {
    const self = this;
    const frame: Frame<PageAndPosition|null> =
        task.newFrame('renderPage');
    self.getPageViewItem(position.spineIndex).then((viewItem) => {
      if (!viewItem) {
        frame.finish(null);
        return;
      }
      const normalizedPosition = self.normalizeSeekPosition(position, viewItem);
      let pageIndex = normalizedPosition.pageIndex;
      const seekOffset = normalizedPosition.offsetInItem;
      let resultPage = viewItem.pages[pageIndex];
      if (resultPage) {
        frame.finish(makePageAndPosition(resultPage, pageIndex));
        return;
      }
      frame
          .loopWithFrame((loopFrame) => {
            if (pageIndex < viewItem.layoutPositions.length) {
              loopFrame.breakLoop();
              return;
            }
            if (viewItem.complete) {
              pageIndex = viewItem.layoutPositions.length - 1;
              loopFrame.breakLoop();
              return;
            }
            let pos =
                viewItem.layoutPositions[viewItem.layoutPositions.length - 1];
            self.renderSinglePage(viewItem, pos).then((result) => {
              const page = result.pageAndPosition.page;
              pos = result.nextLayoutPosition;
              if (pos) {
                if (seekOffset >= 0) {
                  // Searching for offset, don't know the page number.
                  const offset = viewItem.instance.getPosition(pos);
                  if (offset > seekOffset) {
                    resultPage = page;
                    pageIndex = viewItem.layoutPositions.length - 2;
                    loopFrame.breakLoop();
                    return;
                  }
                }
                loopFrame.continueLoop();
              } else {
                resultPage = page;
                pageIndex = result.pageAndPosition.position.pageIndex;
                viewItem.complete = true;
                loopFrame.breakLoop();
              }
            });
          })
          .then(() => {
            resultPage = resultPage || viewItem.pages[pageIndex];
            const pos = viewItem.layoutPositions[pageIndex];
            if (resultPage) {
              frame.finish(makePageAndPosition(resultPage, pageIndex));
              return;
            }
            self.renderSinglePage(viewItem, pos).then((result) => {
              if (!result.nextLayoutPosition) {
                viewItem.complete = true;
              }
              frame.finish(result.pageAndPosition);
            });
          });
    });
    return frame.result();
  }

  renderAllPages(): Result<PageAndPosition|null> {
    return this.renderPagesUpto({
      spineIndex: this.opf.spine.length - 1,
      pageIndex: Number.POSITIVE_INFINITY,
      offsetInItem: -1
    });
  }

  /**
   * Render pages from (spineIndex=0, pageIndex=0) to the specified (spineIndex,
   * pageIndex).
   */
  renderPagesUpto(position: Position): Result<PageAndPosition|null> {
    const self = this;
    const frame: Frame<PageAndPosition|null> =
        task.newFrame('renderAllPages');
    if (!position) {
      position = {spineIndex: 0, pageIndex: 0, offsetInItem: 0};
    }
    const spineIndex = position.spineIndex;
    const pageIndex = position.pageIndex;
    let s = 0;
    let lastResult;
    frame
        .loopWithFrame((loopFrame) => {
          const pos = {
            spineIndex: s,
            pageIndex: s === spineIndex ? pageIndex : Number.POSITIVE_INFINITY,
            offsetInItem: s === spineIndex ? position.offsetInItem : -1
          };
          self.renderPage(pos).then((result) => {
            lastResult = result;
            if (++s > spineIndex) {
              loopFrame.breakLoop();
            } else {
              loopFrame.continueLoop();
            }
          });
        })
        .then(() => {
          frame.finish(lastResult);
        });
    return frame.result();
  }

  /**
   * Move to the first page and render it.
   */
  firstPage(): Result<PageAndPosition|null> {
    return this.findPage({spineIndex: 0, pageIndex: 0, offsetInItem: -1});
  }

  /**
   * Move to the last page and render it.
   */
  lastPage(): Result<PageAndPosition|null> {
    return this.findPage({
      spineIndex: this.opf.spine.length - 1,
      pageIndex: Number.POSITIVE_INFINITY,
      offsetInItem: -1
    });
  }

  /**
   * Move to the next page position and render page.
   * @param sync If true, get the page synchronously (not waiting another
   *     rendering task)
   */
  nextPage(position: Position, sync: boolean): Result<PageAndPosition|null> {
    const self = this;
    let spineIndex = position.spineIndex;
    let pageIndex = position.pageIndex;
    const frame: Frame<PageAndPosition|null> = task.newFrame('nextPage');
    self.getPageViewItem(spineIndex).then((viewItem) => {
      if (!viewItem) {
        frame.finish(null);
        return;
      }
      if (viewItem.complete &&
          pageIndex == viewItem.layoutPositions.length - 1) {
        if (spineIndex >= self.opf.spine.length - 1) {
          frame.finish(null);
          return;
        }
        spineIndex++;
        pageIndex = 0;
      } else {
        pageIndex++;
      }
      self.findPage({spineIndex, pageIndex, offsetInItem: -1}, sync)
          .thenFinish(frame);
    });
    return frame.result();
  }

  /**
   * Move to the previous page and render it.
   */
  previousPage(position: Position): Result<PageAndPosition|null> {
    let spineIndex = position.spineIndex;
    let pageIndex = position.pageIndex;
    if (pageIndex == 0) {
      if (spineIndex == 0) {
        return task.newResult((null as PageAndPosition | null));
      }
      spineIndex--;
      pageIndex = Number.POSITIVE_INFINITY;
    } else {
      pageIndex--;
    }
    return this.findPage({spineIndex, pageIndex, offsetInItem: -1});
  }

  /**
   * @param page This page should be a currently displayed page.
   */
  private isRectoPage(page: Page, position: Position): boolean {
    const isLeft = page.side === constants.PageSide.LEFT;
    const isLTR = this.getCurrentPageProgression(position) ===
        constants.PageProgression.LTR;
    return !isLeft && isLTR || isLeft && !isLTR;
  }

  /**
   * Get a spread containing the currently displayed page.
   * @param sync If true, get the spread synchronously (not waiting another
   *     rendering task)
   */
  getSpread(position: Position, sync: boolean): Result<Spread> {
    const frame: Frame<Spread> = task.newFrame('getCurrentSpread');
    const page = this.getPage(position);
    if (!page) {
      return task.newResult(
          /** @type Spread */
          ({left: null, right: null} as Spread));
    }
    const isLeft = page.side === constants.PageSide.LEFT;
    let other;
    if (this.isRectoPage(page, position)) {
      other = this.previousPage(position);
    } else {
      other = this.nextPage(position, sync);
    }
    other.then((otherPageAndPosition) => {
      const otherPage = otherPageAndPosition && otherPageAndPosition.page;
      if (isLeft) {
        frame.finish({left: page, right: otherPage});
      } else {
        frame.finish({left: otherPage, right: page});
      }
    });
    return frame.result();
  }

  /**
   * Move to the next spread and render pages.
   * @param sync If true, get the spread synchronously (not waiting another
   *     rendering task)
   * @returns The 'verso' page of the next spread.
   */
  nextSpread(position: Position, sync?: boolean): Result<PageAndPosition|null> {
    const page = this.getPage(position);
    if (!page) {
      return task.newResult((null as PageAndPosition | null));
    }
    const isRecto = this.isRectoPage(page, position);
    const next = this.nextPage(position, !!sync);
    if (isRecto) {
      return next;
    } else {
      const self = this;
      return next.thenAsync((result) => {
        if (result) {
          return self.nextPage(result.position, !!sync);
        } else {
          return task.newResult((null as PageAndPosition | null));
        }
      });
    }
  }

  /**
   * Move to the previous spread and render pages.
   * @returns The 'recto' page of the previous spread.
   */
  previousSpread(position: Position): Result<PageAndPosition|null> {
    const page = this.getPage(position);
    if (!page) {
      return task.newResult((null as PageAndPosition | null));
    }
    const isRecto = this.isRectoPage(page, position);
    const prev = this.previousPage(position);
    if (isRecto) {
      const self = this;
      return prev.thenAsync((result) => {
        if (result) {
          return self.previousPage(result.position);
        } else {
          return task.newResult((null as PageAndPosition | null));
        }
      });
    } else {
      return prev;
    }
  }

  /**
   * Move to the epage specified by the given number (zero-based) and render it.
   */
  navigateToEPage(epage: number): Result<PageAndPosition|null> {
    const frame: Frame<PageAndPosition|null> =
        task.newFrame('navigateToEPage');
    const self = this;
    this.opf.resolveEPage(epage).then((position) => {
      if (position) {
        self.findPage(position).thenFinish(frame);
      } else {
        frame.finish(null);
      }
    });
    return frame.result();
  }

  /**
   * Move to the page specified by the given CFI and render it.
   */
  navigateToFragment(fragment: string): Result<PageAndPosition|null> {
    const frame: Frame<PageAndPosition|null> =
        task.newFrame('navigateToCFI');
    const self = this;
    self.opf.resolveFragment(fragment).then((position) => {
      if (position) {
        self.findPage(position).thenFinish(frame);
      } else {
        frame.finish(null);
      }
    });
    return frame.result();
  }

  /**
   * Move to the page specified by the given URL and render it.
   */
  navigateTo(href: string, position: Position): Result<PageAndPosition|null> {
    logging.logger.debug('Navigate to', href);
    let path = this.opf.getPathFromURL(base.stripFragment(href));
    if (!path) {
      if (this.opf.opfXML && href.match(/^#epubcfi\(/)) {
        // CFI fragment is "relative" to OPF.
        path = this.opf.getPathFromURL(this.opf.opfXML.url);
      } else {
        if (href.charAt(0) === '#') {
          const restored = this.opf.documentURLTransformer.restoreURL(href);
          if (this.opf.opfXML) {
            path = this.opf.getPathFromURL(restored[0]);
          } else {
            path = restored[0];
          }
          href = path + (restored[1] ? `#${restored[1]}` : '');
        }
      }
      if (path == null) {
        return task.newResult((null as PageAndPosition | null));
      }
    }
    const item = this.opf.itemMapByPath[path];
    if (!item) {
      if (this.opf.opfXML &&
          path == this.opf.getPathFromURL(this.opf.opfXML.url)) {
        // CFI link?
        const fragmentIndex = href.indexOf('#');
        if (fragmentIndex >= 0) {
          return this.navigateToFragment(href.substr(fragmentIndex + 1));
        }
      }
      return task.newResult((null as PageAndPosition | null));
    }
    const frame: Frame<PageAndPosition|null> =
        task.newFrame('navigateTo');
    const self = this;
    self.getPageViewItem(item.spineIndex).then((viewItem) => {
      const target = viewItem.xmldoc.getElement(href);
      if (target) {
        self.findPage({
              spineIndex: item.spineIndex,
              pageIndex: -1,
              offsetInItem: viewItem.xmldoc.getElementOffset(target)
            })
            .thenFinish(frame);
      } else {
        if (position.spineIndex !== item.spineIndex) {
          // no fragment, different spine item
          self.findPage(
                  {spineIndex: item.spineIndex, pageIndex: 0, offsetInItem: -1})
              .thenFinish(frame);
        } else {
          frame.finish(null);
        }
      }
    });
    return frame.result();
  }

  makePage(viewItem: OPFViewItem, pos: LayoutPosition): Page {
    const viewport = viewItem.instance.viewport;
    const pageCont = (viewport.document.createElement('div') as HTMLElement);
    pageCont.setAttribute('data-vivliostyle-page-container', true);
    pageCont.style.position = 'absolute';
    pageCont.style.top = '0';
    pageCont.style.left = '0';
    if (!constants.isDebug) {
      pageCont.style.visibility = 'hidden';
    }
    viewport.layoutBox.appendChild(pageCont);
    const bleedBox = (viewport.document.createElement('div') as HTMLElement);
    bleedBox.setAttribute('data-vivliostyle-bleed-box', true);
    pageCont.appendChild(bleedBox);
    const page = new Page(pageCont, bleedBox);
    page.spineIndex = viewItem.item.spineIndex;
    page.position = pos;
    page.offset = viewItem.instance.getPosition(pos);
    if (page.offset === 0) {
      const id = this.opf.documentURLTransformer.transformFragment(
          '', viewItem.item.src);
      bleedBox.setAttribute('id', id);
      page.registerElementWithId(bleedBox, id);
    }
    if (viewport !== this.viewport) {
      const matrix = letterbox(
          this.viewport.width, this.viewport.height, viewport.width,
          viewport.height);
      const cssMatrix = parseValue(
          null, new Tokenizer(matrix, null), '');
      page.delayedItems.push(
          new DelayedItem(pageCont, 'transform', cssMatrix));
    }
    return page;
  }

  makeObjectView(
      xmldoc: xmldoc.XMLDocHolder, srcElem: Element, viewParent: Element,
      computedStyle): Result<Element> {
    let data = srcElem.getAttribute('data');
    let result: Element = null;
    if (data) {
      data = base.resolveURL(data, xmldoc.url);
      let mediaType = srcElem.getAttribute('media-type');
      if (!mediaType) {
        const path = this.opf.getPathFromURL(data);
        if (path) {
          const item = this.opf.itemMapByPath[path];
          if (item) {
            mediaType = item.mediaType;
          }
        }
      }
      if (mediaType) {
        const handlerSrc = this.opf.bindings[mediaType];
        if (handlerSrc) {
          result = this.viewport.document.createElement('iframe');
          result.style.border = 'none';
          const srcParam = base.lightURLEncode(data);
          const typeParam = base.lightURLEncode(mediaType);
          const sb = new base.StringBuffer();
          sb.append(handlerSrc);
          sb.append('?src=');
          sb.append(srcParam);
          sb.append('&type=');
          sb.append(typeParam);
          for (let c = srcElem.firstChild; c; c = c.nextSibling) {
            if (c.nodeType == 1) {
              const ce = (c as Element);
              if (ce.localName == 'param' &&
                  ce.namespaceURI == base.NS.XHTML) {
                const pname = ce.getAttribute('name');
                const pvalue = ce.getAttribute('value');
                if (pname && pvalue) {
                  sb.append('&');
                  sb.append(encodeURIComponent(pname));
                  sb.append('=');
                  sb.append(encodeURIComponent(pvalue));
                }
              }
            }
          }
          result.setAttribute('src', sb.toString());
          const width = srcElem.getAttribute('width');
          if (width) {
            result.setAttribute('width', width);
          }
          const height = srcElem.getAttribute('height');
          if (height) {
            result.setAttribute('height', height);
          }
        }
      }
    }
    if (!result) {
      result = this.viewport.document.createElement('span');
      result.setAttribute('data-adapt-process-children', 'true');
    }

    // Need to cast because we need {Element}, not {!Element}
    return task.newResult((result as Element));
  }

  makeMathJaxView(
      xmldoc: xmldoc.XMLDocHolder, srcElem: Element, viewParent: Element,
      computedStyle): Result<Element> {
    // See if MathJax installed, use it if it is.
    const hub = getMathJaxHub();
    if (hub) {
      const doc = viewParent.ownerDocument;
      const span = doc.createElement('span');
      viewParent.appendChild(span);
      const clonedMath = doc.importNode(srcElem, true);
      this.resolveURLsInMathML(clonedMath, xmldoc);
      span.appendChild(clonedMath);
      const queue = hub['queue'];
      queue['Push'](['Typeset', hub, span]);
      const frame: Frame<Element> = task.newFrame('makeMathJaxView');
      const continuation = frame.suspend();
      queue['Push'](() => {
        continuation.schedule(span);
      });
      return frame.result();
    }
    return task.newResult((null as Element));
  }

  private resolveURLsInMathML(node: Node, xmldoc: xmldoc.XMLDocHolder) {
    if (node == null) {
      return;
    }
    if (node.nodeType === 1 && node.tagName === 'mglyph') {
      const attrs = node.attributes;
      for (const attr of attrs) {
        if (attr.name !== 'src') {
          continue;
        }
        const newUrl = base.resolveURL(attr.nodeValue, xmldoc.url);
        if (attr.namespaceURI) {
          node.setAttributeNS(attr.namespaceURI, attr.name, newUrl);
        } else {
          node.setAttribute(attr.name, newUrl);
        }
      }
    }
    if (node.firstChild) {
      this.resolveURLsInMathML(node.firstChild, xmldoc);
    }
    if (node.nextSibling) {
      this.resolveURLsInMathML(node.nextSibling, xmldoc);
    }
  }

  // TODO move makeSSEView to a more appropriate class (SSE XML content is not
  // allowed in EPUB)
  /**
   * @param computedStyle
   */
  makeSSEView(
      xmldoc: xmldoc.XMLDocHolder, srcElem: Element, viewParent: Element,
      computedStyle): Result<Element> {
    const doc = viewParent ? viewParent.ownerDocument : this.viewport.document;
    const srcTagName = srcElem.localName;
    let tagName;
    switch (srcTagName) {
      case 't':
      case 'tab':
      case 'ec':
      case 'nt':
      case 'fraction':
      case 'comment':
      case 'mark':
        tagName = 'span';
        break;
      case 'ruby':
      case 'rp':
      case 'rt':
        tagName = srcTagName;
        break;
      default:
        tagName = 'div';
    }
    const result = doc.createElement(tagName);
    result.setAttribute('data-adapt-process-children', 'true');

    // Need to cast because we need {Element}, not {!Element}
    return task.newResult((result as Element));
  }

  /**
   * @override
   */
  makeCustomRenderer(xmldoc: xmldoc.XMLDocHolder): CustomRenderer {
    const self = this;
    return (srcElem: Element, viewParent: Element,
            computedStyle): Result<Element> => {
      if (srcElem.localName == 'object' &&
          srcElem.namespaceURI == base.NS.XHTML) {
        return self.makeObjectView(xmldoc, srcElem, viewParent, computedStyle);
      } else {
        if (srcElem.namespaceURI == base.NS.MATHML) {
          return self.makeMathJaxView(
              xmldoc, srcElem, viewParent, computedStyle);
        } else {
          if (srcElem.namespaceURI == base.NS.SSE) {
            return self.makeSSEView(xmldoc, srcElem, viewParent, computedStyle);
          } else {
            if (srcElem.dataset && srcElem.dataset['mathTypeset'] == 'true') {
              return self.makeMathJaxView(
                  xmldoc, srcElem, viewParent, computedStyle);
            }
          }
        }
      }
      return task.newResult((null as Element));
    };
  }

  getPageViewItem(spineIndex: number): Result<OPFViewItem> {
    const self = this;
    if (spineIndex >= self.opf.spine.length) {
      return task.newResult((null as OPFViewItem));
    }
    let viewItem = self.spineItems[spineIndex];
    if (viewItem) {
      return task.newResult(viewItem);
    }
    const frame: Frame<OPFViewItem> = task.newFrame('getPageViewItem');

    // If loading for the item has already been started, suspend and wait for
    // the result.
    let loadingContinuations = this.spineItemLoadingContinuations[spineIndex];
    if (loadingContinuations) {
      const cont = frame.suspend();
      loadingContinuations.push(cont);
      return frame.result();
    } else {
      loadingContinuations = this.spineItemLoadingContinuations[spineIndex] =
          [];
    }
    const item = self.opf.spine[spineIndex];
    const store = self.opf.store;
    store.load(item.src).then((xmldoc) => {
      if (item.epageCount == 0 && self.opf.spine.length == 1) {
        // Single-chapter doc without epages (e.g. FB2).
        // Estimate that offset=2700 roughly corresponds to 1024 bytes of
        // compressed size.
        item.epageCount = Math.ceil(xmldoc.getTotalOffset() / 2700);
        self.opf.epageCount = item.epageCount;
      }
      const style = store.getStyleForDoc(xmldoc);
      const customRenderer = self.makeCustomRenderer(xmldoc);
      let viewport = self.viewport;
      const viewportSize = style.sizeViewport(
          viewport.width, viewport.height, viewport.fontSize);
      if (viewportSize.width != viewport.width ||
          viewportSize.height != viewport.height ||
          viewportSize.fontSize != viewport.fontSize) {
        viewport = new Viewport(
            viewport.window, viewportSize.fontSize, viewport.root,
            viewportSize.width, viewportSize.height);
      }
      const previousViewItem = self.spineItems[spineIndex - 1];
      let pageNumberOffset;
      if (item.startPage !== null) {
        pageNumberOffset = item.startPage - 1;
      } else {
        pageNumberOffset = previousViewItem ?
            previousViewItem.instance.pageNumberOffset +
                previousViewItem.pages.length :
            0;
        if (item.skipPagesBefore !== null) {
          pageNumberOffset += item.skipPagesBefore;
        }
      }
      self.counterStore.forceSetPageCounter(pageNumberOffset);
      const instance = new ops.StyleInstance(
          style, xmldoc, self.opf.lang, viewport, self.clientLayout,
          self.fontMapper, customRenderer, self.opf.fallbackMap,
          pageNumberOffset, self.opf.documentURLTransformer, self.counterStore);
      instance.pref = self.pref;
      instance.init().then(() => {
        viewItem = {
          item,
          xmldoc,
          instance,
          layoutPositions: [null],
          pages: [],
          complete: false
        };
        self.spineItems[spineIndex] = viewItem;
        frame.finish(viewItem);
        loadingContinuations.forEach((c) => {
          c.schedule(viewItem);
        });
      });
    });
    return frame.result();
  }

  removeRenderedPages() {
    const items = this.spineItems;
    for (const item of items) {
      if (item) {
        item.pages.splice(0);
      }
    }
    this.viewport.clear();
  }

  /**
   * Returns if at least one page has 'auto' size
   */
  hasAutoSizedPages(): boolean {
    const items = this.spineItems;
    for (const item of items) {
      if (item) {
        const pages = item.pages;
        for (const page of pages) {
          if (page.isAutoPageWidth && page.isAutoPageHeight) {
            return true;
          }
        }
      }
    }
    return false;
  }

  hasPages(): boolean {
    return this.spineItems.some((item) => item && item.pages.length > 0);
  }

  showTOC(autohide: boolean): Result<Page> {
    const opf = this.opf;
    const toc = opf.xhtmlToc || opf.ncxToc;
    if (!toc) {
      return task.newResult((null as Page));
    }
    const frame: Frame<Page> = task.newFrame('showTOC');
    if (!this.tocView) {
      this.tocView = new toc.TOCView(
          opf.store, toc.src, opf.lang, this.clientLayout, this.fontMapper,
          this.pref, this, opf.fallbackMap, opf.documentURLTransformer,
          this.counterStore);
    }
    const viewport = this.viewport;
    const tocWidth = Math.min(350, Math.round(0.67 * viewport.width) - 16);
    const tocHeight = viewport.height - 6;
    const pageCont = (viewport.document.createElement('div') as HTMLElement);
    viewport.root.appendChild(pageCont);
    pageCont.style.position = 'absolute';
    pageCont.style.visibility = 'hidden';
    pageCont.style.left = '3px';
    pageCont.style.top = '3px';
    pageCont.style.width = `${tocWidth + 10}px`;
    pageCont.style.maxHeight = `${tocHeight}px`;
    pageCont.style.overflow = 'scroll';
    pageCont.style.overflowX = 'hidden';
    pageCont.style.background = '#EEE';
    pageCont.style.border = '1px outset #999';
    pageCont.style['borderRadius'] = '2px';
    pageCont.style['boxShadow'] = ' 5px 5px rgba(128,128,128,0.3)';
    this.tocView
        .showTOC(
            pageCont, viewport, tocWidth, tocHeight, this.viewport.fontSize)
        .then((page) => {
          pageCont.style.visibility = 'visible';
          frame.finish(page);
        });
    return frame.result();
  }

  hideTOC(): void {
    if (this.tocView) {
      this.tocView.hideTOC();
    }
  }

  isTOCVisible(autohide): boolean {
    return this.tocView && this.tocView.isTOCVisible();
  }
}

export interface RenderSinglePageResult {
  pageAndPosition: PageAndPosition;
  nextLayoutPosition: LayoutPosition;
}

export {OPFView};
