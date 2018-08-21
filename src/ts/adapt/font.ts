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
 * @fileoverview Deal with embedded fonts.
 */
import * as logging from '../vivliostyle/logging';

import * as base from './base';
import * as css from './css';
import {ElementStyle, getProp} from './csscasc';
import * as cssparse from './cssparse';
import * as cssprop from './cssprop';
import * as expr from './expr';
import * as net from './net';
import * as task from './task';
import * as taskutil from './taskutil';

export const traitProps: {[key: string]: css.Val} = {
  'font-style': css.ident.normal,
  'font-variant': css.ident.normal,
  'font-weight': css.ident.normal
};

export const bogusFontData = `OTTO${(new Date()).valueOf()}`;

export const bogusFontCounter: number = 1;

export const makeFontTraitKey =
    (properties: {[key: string]: css.Val}): string => {
      const sb = new base.StringBuffer();
      for (const prop in traitProps) {
        sb.append(' ');
        sb.append(properties[prop].toString());
      }
      return sb.toString();
    };

export const fillDefaults = (properties: {[key: string]: css.Val}) => {
  for (const prop in traitProps) {
    if (!properties[prop]) {
      properties[prop] = traitProps[prop];
    }
  }
};

export const prepareProperties =
    (properties: ElementStyle, context: expr.Context):
        {[key: string]: css.Val} => {
          const result = ({} as {[key: string]: css.Val});
          for (const prop in properties) {
            result[prop] =
                getProp(properties, prop).evaluate(context, prop);
          }
          fillDefaults(result);
          return result;
        };

/**
 * A font declared in a font-face rule.
 */
export class Face {
  fontTraitKey: any;
  src: any;
  blobURLs: string[] = [];
  blobs: Blob[] = [];
  family: any;

  constructor(public readonly properties: {[key: string]: css.Val}) {
    this.fontTraitKey = makeFontTraitKey(this.properties);
    this.src =
        this.properties['src'] ? this.properties['src'].toString() : null;
    const family = this.properties['font-family'];
    this.family = family ? family.stringValue() : null;
  }

  /**
   * Check if font traits are the same for two font faces
   */
  traitsEqual(other: Face): boolean {
    return this.fontTraitKey == other.fontTraitKey;
  }

  /**
   * Create "at" font-face rule.
   */
  makeAtRule(src: string, fontBytes: Blob): string {
    const sb = new base.StringBuffer();
    sb.append('@font-face {\n  font-family: ');
    sb.append((this.family as string));
    sb.append(';\n  ');
    for (const prop in traitProps) {
      sb.append(prop);
      sb.append(': ');
      this.properties[prop].appendTo(sb, true);
      sb.append(';\n  ');
    }
    if (fontBytes) {
      sb.append('src: url("');
      const blobURL = net.createObjectURL(fontBytes);
      sb.append(blobURL);
      this.blobURLs.push(blobURL);
      this.blobs.push(fontBytes);
      sb.append('")');
    } else {
      sb.append('src: ');
      sb.append(src);
    }
    sb.append(';\n}\n');
    return sb.toString();
  }
}

/**
 * Set of the fonts declared in all stylesheets of a document.
 * @param deobfuscator function
 *     that takes url and returns data deobfuscator
 */
export class DocumentFaces {
  /**
   * Maps source font family names to the family names used in the HTML view.
   */
  familyMap: any = ({} as {[key: string]: string});

  constructor(public readonly deobfuscator:
                  ((p1: string) => ((p1: Blob) => task.Result<Blob>) | null)|
              null) {}

  registerFamily(srcFace: Face, viewFace: Face): void {
    const srcFamily = (srcFace.family as string);
    const viewFamilyFromSrc = this.familyMap[srcFamily];
    const viewFamilyFromView = viewFace.family;
    if (viewFamilyFromSrc) {
      if (viewFamilyFromSrc != viewFamilyFromView) {
        throw new Error(`E_FONT_FAMILY_INCONSISTENT ${srcFace.family}`);
      }
    } else {
      this.familyMap[srcFamily] = (viewFamilyFromView as string);
    }
  }

  filterFontFamily(val: css.Val): css.Val {
    if (val instanceof css.CommaList) {
      const list = (val as css.CommaList).values;
      const newValues = ([] as css.Val[]);
      for (const v of list) {
        const r = this.familyMap[v.stringValue()];
        if (r) {
          newValues.push(css.getName(r));
        }
        newValues.push(v);
      }
      return new css.CommaList(newValues);
    } else {
      const rf = this.familyMap[val.stringValue()];
      if (rf) {
        return new css.CommaList([css.getName(rf), val]);
      }
      return val;
    }
  }
}

/**
 * Object that loads fonts in a document and allocates font families for them
 * in the view document
 * @param head where to add styles in the view document (normally head element)
 * @param body where to probe text in the view document (normally body element)
 */
export class Mapper {
  /**
   * Maps Face.src to an entry for an already-loaded font.
   */
  srcURLMap: {[key: string]: taskutil.Fetcher<Face>} = {};
  familyPrefix: any;
  familyCounter: number = 0;

  constructor(
      public readonly head: Element, public readonly body: Element,
      opt_familyPrefix?: string) {
    this.familyPrefix = opt_familyPrefix || 'Fnt_';
  }

  getViewFontFamily(srcFace: Face, documentFaces: DocumentFaces): string {
    const srcFamily = (srcFace.family as string);
    let viewFamily = documentFaces.familyMap[srcFamily];
    if (viewFamily) {
      return viewFamily;
    }
    viewFamily = this.familyPrefix + ++this.familyCounter;
    documentFaces.familyMap[srcFamily] = viewFamily;
    return viewFamily;
  }

  /**
   * @param fontBytes deobfuscated font bytes (if deobfuscation is needed)
   */
  private initFont(
      srcFace: Face, fontBytes: Blob,
      documentFaces: DocumentFaces): task.Result<Face> {
    const frame: task.Frame<Face> = task.newFrame('initFont');
    const self = this;
    const src = (srcFace.src as string);
    const props = ({} as {[key: string]: css.Val});
    for (const prop in traitProps) {
      props[prop] = srcFace.properties[prop];
    }
    const fontFamily = self.getViewFontFamily(srcFace, documentFaces);
    props['font-family'] = css.getName(fontFamily);
    const viewFontFace = new Face(props);
    const probe =
        (self.body.ownerDocument.createElement('span') as HTMLElement);
    probe.textContent = 'M';
    const killTime = (new Date()).valueOf() + 1000;
    const style = self.head.ownerDocument.createElement('style');
    const bogusData = bogusFontData + bogusFontCounter++;
    style.textContent = viewFontFace.makeAtRule('', net.makeBlob([bogusData]));
    self.head.appendChild(style);
    self.body.appendChild(probe);
    probe.style.visibility = 'hidden';
    probe.style.fontFamily = fontFamily;
    for (const pname in traitProps) {
      base.setCSSProperty(probe, pname, props[pname].toString());
    }
    const rect = probe.getBoundingClientRect();
    const initWidth = rect.right - rect.left;
    const initHeight = rect.bottom - rect.top;
    style.textContent = viewFontFace.makeAtRule(src, fontBytes);
    logging.logger.info('Starting to load font:', src);
    let loaded = false;
    frame
        .loop(() => {
          const rect = probe.getBoundingClientRect();
          const currWidth = rect.right - rect.left;
          const currHeight = rect.bottom - rect.top;
          if (initWidth != currWidth || initHeight != currHeight) {
            loaded = true;
            return task.newResult(false);
          }
          const currTime = (new Date()).valueOf();
          if (currTime > killTime) {
            return task.newResult(false);
          }
          return frame.sleep(10);
        })
        .then(() => {
          if (loaded) {
            logging.logger.info('Loaded font:', src);
          } else {
            logging.logger.warn('Failed to load font:', src);
          }
          self.body.removeChild(probe);
          frame.finish(viewFontFace);
        });
    return frame.result();
  }

  loadFont(srcFace: Face, documentFaces: DocumentFaces):
      taskutil.Fetcher<Face> {
    const src = (srcFace.src as string);
    let fetcher = this.srcURLMap[src];
    const self = this;
    if (fetcher) {
      fetcher.piggyback((viewFaceParam) => {
        const viewFace = (viewFaceParam as Face);
        if (!viewFace.traitsEqual(srcFace)) {
          logging.logger.warn('E_FONT_FACE_INCOMPATIBLE', srcFace.src);
        } else {
          documentFaces.registerFamily(srcFace, viewFace);
          logging.logger.warn('Found already-loaded font:', src);
        }
      });
    } else {
      fetcher = new taskutil.Fetcher(() => {
        const frame: task.Frame<Face> = task.newFrame('loadFont');
        const deobfuscator =
            documentFaces.deobfuscator ? documentFaces.deobfuscator(src) : null;
        if (deobfuscator) {
          net.ajax(src, net.XMLHttpRequestResponseType.BLOB).then((xhr) => {
            if (!xhr.responseBlob) {
              frame.finish(null);
              return;
            }
            deobfuscator(xhr.responseBlob).then((fontBytes) => {
              self.initFont(srcFace, fontBytes, documentFaces)
                  .thenFinish(frame);
            });
          });
        } else {
          self.initFont(srcFace, null, documentFaces).thenFinish(frame);
        }
        return frame.result();
      }, `loadFont ${src}`);
      this.srcURLMap[src] = fetcher;
      fetcher.start();
    }
    return fetcher;
  }

  findOrLoadFonts(srcFaces: Face[], documentFaces: DocumentFaces):
      task.Result<boolean> {
    const fetchers = ([] as taskutil.Fetcher<Face>[]);
    for (const srcFace of srcFaces) {
      if (!srcFace.src || !srcFace.family) {
        logging.logger.warn('E_FONT_FACE_INVALID');
        continue;
      }
      fetchers.push(this.loadFont(srcFace, documentFaces));
    }
    return taskutil.waitForFetchers(fetchers);
  }
}
