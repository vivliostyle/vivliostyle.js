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
 * @fileoverview Font - Deal with embedded fonts.
 */
import * as Base from "./base";
import * as Css from "./css";
import * as CssCascade from "./css-cascade";
import * as Exprs from "./exprs";
import * as Logging from "./logging";
import * as Net from "./net";
import * as Task from "./task";
import * as TaskUtil from "./task-util";

export const traitProps: { [key: string]: Css.Val } = {
  "font-style": Css.ident.auto,
  "font-stretch": Css.ident.auto,
  "font-weight": Css.ident.auto,
  "unicode-range": Css.fullURange,
};

export const bogusFontData = `OTTO${new Date().valueOf()}`;

export let bogusFontCounter: number = 1;

export function makeFontTraitKey(properties: {
  [key: string]: Css.Val;
}): string {
  const sb = new Base.StringBuffer();
  for (const prop in traitProps) {
    sb.append(" ");
    sb.append(properties[prop].toString());
  }
  return sb.toString();
}

export function fillDefaults(properties: { [key: string]: Css.Val }): void {
  for (const prop in traitProps) {
    if (!properties[prop]) {
      properties[prop] = traitProps[prop];
    }
  }
}

export function prepareProperties(
  properties: CssCascade.ElementStyle,
  context: Exprs.Context,
): { [key: string]: Css.Val } {
  const result = {} as { [key: string]: Css.Val };
  for (const prop in properties) {
    result[prop] = CssCascade.getProp(properties, prop).evaluate(context, prop);
  }
  fillDefaults(result);
  return result;
}

/**
 * A font declared in a font-face rule.
 */
export class Face {
  fontTraitKey: string;
  src: string | null;
  blobURLs: string[] = [];
  blobs: Blob[] = [];
  family: string | null;

  constructor(public readonly properties: { [key: string]: Css.Val }) {
    this.fontTraitKey = makeFontTraitKey(this.properties);
    this.src = this.properties["src"]
      ? this.properties["src"].toString()
      : null;
    const family = this.properties["font-family"];
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
    const sb = new Base.StringBuffer();
    sb.append("@font-face {\n  font-family: ");
    sb.append(this.family as string);
    sb.append(";\n  ");
    for (const prop in traitProps) {
      sb.append(prop);
      sb.append(": ");
      this.properties[prop].appendTo(sb, true);
      sb.append(";\n  ");
    }
    if (fontBytes) {
      sb.append('src: url("');
      const blobURL = Net.createObjectURL(fontBytes);
      sb.append(blobURL);
      this.blobURLs.push(blobURL);
      this.blobs.push(fontBytes);
      sb.append('")');
    } else {
      sb.append("src: ");
      sb.append(src);
    }
    sb.append(";\n}\n");
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
  familyMap = {} as { [key: string]: string };

  constructor(
    public readonly deobfuscator:
      | ((p1: string) => ((p1: Blob) => Task.Result<Blob>) | null)
      | null,
  ) {}

  registerFamily(srcFace: Face, viewFace: Face): void {
    const srcFamily = srcFace.family as string;
    const viewFamilyFromSrc = this.familyMap[srcFamily];
    const viewFamilyFromView = viewFace.family;
    if (viewFamilyFromSrc) {
      if (viewFamilyFromSrc != viewFamilyFromView) {
        throw new Error(`E_FONT_FAMILY_INCONSISTENT ${srcFace.family}`);
      }
    } else {
      this.familyMap[srcFamily] = viewFamilyFromView as string;
    }
  }

  filterFontFamily(val: Css.Val): Css.Val {
    if (val instanceof Css.CommaList) {
      const list = (val as Css.CommaList).values;
      const newValues = [] as Css.Val[];
      for (const v of list) {
        const r = this.familyMap[v.stringValue()];
        if (r) {
          newValues.push(Css.getName(r));
        }
        newValues.push(v);
      }
      return new Css.CommaList(newValues);
    } else {
      const rf = this.familyMap[val.stringValue()];
      if (rf) {
        return new Css.CommaList([Css.getName(rf), val]);
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
  srcURLMap: { [key: string]: TaskUtil.Fetcher<Face> } = {};
  familyPrefix: string;
  familyCounter: number = 0;

  constructor(
    public readonly head: Element,
    public readonly body: Element,
    opt_familyPrefix?: string,
  ) {
    this.familyPrefix = opt_familyPrefix || "Fnt_";
  }

  getViewFontFamily(srcFace: Face, documentFaces: DocumentFaces): string {
    const srcFamily = srcFace.family as string;
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
    srcFace: Face,
    fontBytes: Blob,
    documentFaces: DocumentFaces,
  ): Task.Result<Face> {
    const frame: Task.Frame<Face> = Task.newFrame("initFont");
    const src = srcFace.src as string;
    const props = {} as { [key: string]: Css.Val };
    for (const prop in traitProps) {
      props[prop] = srcFace.properties[prop];
    }
    const fontFamily = this.getViewFontFamily(srcFace, documentFaces);
    props["font-family"] = Css.getName(fontFamily);
    const viewFontFace = new Face(props);
    const style = this.head.ownerDocument.createElement("style");
    style.textContent = viewFontFace.makeAtRule(src, fontBytes);
    this.head.appendChild(style);
    Logging.logger.debug("Load font:", src);
    frame.finish(viewFontFace);
    return frame.result();
  }

  loadFont(
    srcFace: Face,
    documentFaces: DocumentFaces,
  ): TaskUtil.Fetcher<Face> {
    const src = srcFace.src as string;
    const srcFamilySrc = srcFace.family + ";" + src;
    let fetcher = this.srcURLMap[srcFamilySrc];
    if (fetcher) {
      fetcher.piggyback((viewFaceParam) => {
        const viewFace = viewFaceParam as Face;
        if (!viewFace.traitsEqual(srcFace)) {
          Logging.logger.warn("E_FONT_FACE_INCOMPATIBLE", srcFace.src);
        } else {
          documentFaces.registerFamily(srcFace, viewFace);
          Logging.logger.debug("Found already-loaded font:", src);
        }
      });
    } else {
      fetcher = new TaskUtil.Fetcher(() => {
        const frame: Task.Frame<Face> = Task.newFrame("loadFont");
        // Get URL from `@font-face` src value.
        const url = src.replace(/^url\("([^"]+)"\).*$/, "$1");
        const deobfuscator = documentFaces.deobfuscator
          ? documentFaces.deobfuscator(url)
          : null;
        if (deobfuscator) {
          Net.ajax(url, Net.XMLHttpRequestResponseType.BLOB).then((xhr) => {
            if (!xhr.responseBlob) {
              frame.finish(null);
              return;
            }
            deobfuscator(xhr.responseBlob).then((fontBytes) => {
              this.initFont(srcFace, fontBytes, documentFaces).thenFinish(
                frame,
              );
            });
          });
        } else {
          this.initFont(srcFace, null, documentFaces).thenFinish(frame);
        }
        return frame.result();
      }, `loadFont ${src}`);
      this.srcURLMap[srcFamilySrc] = fetcher;
      fetcher.start();
    }
    return fetcher;
  }

  findOrLoadFonts(
    srcFaces: Face[],
    documentFaces: DocumentFaces,
  ): Task.Result<boolean> {
    const fetchers = [] as TaskUtil.Fetcher<Face>[];
    for (const srcFace of srcFaces) {
      if (!srcFace.src || !srcFace.family) {
        Logging.logger.warn("E_FONT_FACE_INVALID");
        continue;
      }
      fetchers.push(this.loadFont(srcFace, documentFaces));
    }
    return TaskUtil.waitForFetchers(fetchers).thenAsync(() =>
      this.waitFontLoading(),
    );
  }

  waitFontLoading(): Task.Result<boolean> {
    const fonts = this.head.ownerDocument.fonts; // FontFaceSet
    let unloadedCount = 0;
    fonts.forEach((fontFace) => {
      if (fontFace.status === "unloaded") {
        unloadedCount++;
        fontFace.load();
      }
    });
    if (unloadedCount === 0) {
      return Task.newResult(true);
    }
    const frame: Task.Frame<boolean> = Task.newFrame("waitFontLoading");
    frame
      .loop(() => {
        return frame.sleep(20).thenAsync(() => {
          if (fonts.status === "loading") {
            return Task.newResult(true); // continue
          }
          return Task.newResult(false); // break
        });
      })
      .thenFinish(frame);
    return frame.result();
  }
}
