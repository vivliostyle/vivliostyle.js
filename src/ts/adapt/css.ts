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
 * @fileoverview CSS Values and utilities to handle them.
 */
import * as base from './base';
import * as expr from './expr';

export class Visitor {
  /**
   * @return void
   */
  visitValues(values: Val[]): any {
    for (let i = 0; i < values.length; i++) {
      values[i].visit(this);
    }
  }

  visitEmpty(empty: Val): Val {
    throw new Error('E_CSS_EMPTY_NOT_ALLOWED');
  }

  visitSlash(slash: Val): Val {
    throw new Error('E_CSS_SLASH_NOT_ALLOWED');
  }

  visitStr(str: Str): Val {
    throw new Error('E_CSS_STR_NOT_ALLOWED');
  }

  visitIdent(ident: Ident): Val {
    throw new Error('E_CSS_IDENT_NOT_ALLOWED');
  }

  visitNumeric(numeric: Numeric): Val {
    throw new Error('E_CSS_NUMERIC_NOT_ALLOWED');
  }

  visitNum(num: Num): Val {
    throw new Error('E_CSS_NUM_NOT_ALLOWED');
  }

  visitInt(num: Int): Val {
    return this.visitNum(num);
  }

  visitColor(color: Color): Val {
    throw new Error('E_CSS_COLOR_NOT_ALLOWED');
  }

  visitURL(url: URL): Val {
    throw new Error('E_CSS_URL_NOT_ALLOWED');
  }

  visitSpaceList(list: SpaceList): Val {
    throw new Error('E_CSS_LIST_NOT_ALLOWED');
  }

  visitCommaList(list: CommaList): Val {
    throw new Error('E_CSS_COMMA_NOT_ALLOWED');
  }

  visitFunc(func: Func): Val {
    throw new Error('E_CSS_FUNC_NOT_ALLOWED');
  }

  visitExpr(expr: Expr): Val {
    throw new Error('E_CSS_EXPR_NOT_ALLOWED');
  }
}

export class FilterVisitor extends adapt.css.Visitor {
  constructor() {
    Visitor.call(this);
  }

  visitValues(values: Val[]): Val[] {
    let arr: Val[] = null;
    for (let i = 0; i < values.length; i++) {
      const before = values[i];
      const after = before.visit(this);
      if (arr) {
        arr[i] = after;
      } else {
        if (before !== after) {
          arr = new Array(values.length);
          for (let k = 0; k < i; k++) {
            arr[k] = values[k];
          }
          arr[i] = after;
        }
      }
    }
    return arr || values;
  }

  /**
   * @override
   */
  visitStr(str) str

  /**
   * @override
   */
  visitIdent(ident) ident

  /**
   * @override
   */
  visitSlash(slash) slash

  /**
   * @override
   */
  visitNumeric(numeric) numeric

  /**
   * @override
   */
  visitNum(num) num

  /**
   * @override
   */
  visitInt(num) num

  /**
   * @override
   */
  visitColor(color) color

  /**
   * @override
   */
  visitURL(url) url

  /**
   * @override
   */
  visitSpaceList(list) {
    const values = this.visitValues(list.values);
    if (values === list.values) {
      return list;
    }
    return new SpaceList(values);
  }

  /**
   * @override
   */
  visitCommaList(list) {
    const values = this.visitValues(list.values);
    if (values === list.values) {
      return list;
    }
    return new CommaList(values);
  }

  /**
   * @override
   */
  visitFunc(func) {
    const values = this.visitValues(func.values);
    if (values === func.values) {
      return func;
    }
    return new Func(func.name, values);
  }

  /**
   * @override
   */
  visitExpr(expr) expr
}
goog.inherits(FilterVisitor, Visitor);

export class Val {
  /**
   * @override
   */
  toString(): string {
    const buf = new base.StringBuffer();
    this.appendTo(buf, true);
    return buf.toString();
  }

  stringValue(): string {
    const buf = new base.StringBuffer();
    this.appendTo(buf, false);
    return buf.toString();
  }

  toExpr(scope: expr.LexicalScope, ref: expr.Val): expr.Val {
    throw new Error('F_ABSTRACT');
  }

  appendTo(buf: base.StringBuffer, toString: boolean): void {
    buf.append('[error]');
  }

  isExpr(): boolean false

  isNumeric(): boolean false

  isNum(): boolean false

  isIdent(): boolean false

  isSpaceList(): boolean false
}
Val.prototype.visit = goog.abstractMethod;

export class Empty extends adapt.css.Val {
  constructor() {
    Val.call(this);
    if (empty) {
      throw new Error('E_INVALID_CALL');
    }
  }

  /**
   * @override
   */
  toExpr(scope, ref) new expr.Const(scope, '')

  /**
   * @override
   */
  appendTo(buf, toString) {}

  /**
   * @override
   */
  visit(visitor) {
    return visitor.visitEmpty(this);
  }
}
goog.inherits(Empty, Val);

export const empty: Empty = new Empty();

export class Slash extends adapt.css.Val {
  constructor() {
    Val.call(this);
    if (slash) {
      throw new Error('E_INVALID_CALL');
    }
  }

  /**
   * @override
   */
  toExpr(scope, ref) new expr.Const(scope, '/')

  /**
   * @override
   */
  appendTo(buf, toString) {
    buf.append('/');
  }

  /**
   * @override
   */
  visit(visitor) {
    return visitor.visitSlash(this);
  }
}
goog.inherits(Slash, Val);

export const slash: Slash = new Slash();

export class Str extends adapt.css.Val {
  constructor(public str: string) {
    Val.call(this);
  }

  /**
   * @override
   */
  toExpr(scope, ref) {
    return new expr.Const(scope, this.str);
  }

  /**
   * @override
   */
  appendTo(buf, toString) {
    if (toString) {
      buf.append('"');
      buf.append(base.escapeCSSStr(this.str));
      buf.append('"');
    } else {
      buf.append(this.str);
    }
  }

  /**
   * @override
   */
  visit(visitor) {
    return visitor.visitStr(this);
  }
}
goog.inherits(Str, Val);

export class Ident extends adapt.css.Val {
  constructor(public name: string) {
    Val.call(this);
    if (nameTable[name]) {
      throw new Error('E_INVALID_CALL');
    }
    nameTable[name] = this;
  }

  /**
   * @override
   */
  toExpr(scope, ref) {
    return new expr.Const(scope, this.name);
  }

  /**
   * @override
   */
  appendTo(buf, toString) {
    if (toString) {
      buf.append(base.escapeCSSIdent(this.name));
    } else {
      buf.append(this.name);
    }
  }

  /**
   * @override
   */
  visit(visitor) {
    return visitor.visitIdent(this);
  }

  /**
   * @override
   */
  isIdent() true
}
goog.inherits(Ident, Val);

export const getName = (name: string): Ident => {
  let r = nameTable[name];
  if (!r) {
    r = new Ident(name);
  }
  return r;
};

export class Numeric extends adapt.css.Val {
  unit: string;

  constructor(public num: number, unit: string) {
    Val.call(this);
    this.unit = unit.toLowerCase();
  }

  /**
   * @override
   */
  toExpr(scope, ref) {
    if (this.num == 0) {
      return scope.zero;
    }
    if (ref && this.unit == '%') {
      if (this.num == 100) {
        return ref;
      }
      return new expr.Multiply(
          scope, ref, new expr.Const(scope, this.num / 100));
    }
    return new expr.Numeric(scope, this.num, this.unit);
  }

  /**
   * @override
   */
  appendTo(buf, toString) {
    buf.append(this.num.toString());
    buf.append(this.unit);
  }

  /**
   * @override
   */
  visit(visitor) {
    return visitor.visitNumeric(this);
  }

  /**
   * @override
   */
  isNumeric() true
}

// units are case-insensitive in CSS
goog.inherits(Numeric, Val);

export class Num extends adapt.css.Val {
  num: any;

  constructor(num: number) {
    Val.call(this);
    this.num = num;
  }

  /**
   * @override
   */
  toExpr(scope) {
    if (this.num == 0) {
      return scope.zero;
    }
    if (this.num == 1) {
      return scope.one;
    }
    return new expr.Const(scope, this.num);
  }

  /**
   * @override
   */
  appendTo(buf, toString) {
    buf.append(this.num.toString());
  }

  /**
   * @override
   */
  visit(visitor) {
    return visitor.visitNum(this);
  }

  /**
   * @override
   */
  isNum() true
}
goog.inherits(Num, Val);

export class Int extends adapt.css.Num {
  constructor(num: number) {
    Num.call(this, num);
  }

  /**
   * @override
   */
  visit(visitor) {
    return visitor.visitInt(this);
  }
}
goog.inherits(Int, Num);

export class Color extends adapt.css.Val {
  constructor(public rgb: number) {
    Val.call(this);
  }

  /**
   * @override
   */
  appendTo(buf, toString) {
    buf.append('#');
    const str = this.rgb.toString(16);
    buf.append('000000'.substr(str.length));
    buf.append(str);
  }

  /**
   * @override
   */
  visit(visitor) {
    return visitor.visitColor(this);
  }
}
goog.inherits(Color, Val);

export class URL extends adapt.css.Val {
  constructor(public url: string) {
    Val.call(this);
  }

  /**
   * @override
   */
  appendTo(buf, toString) {
    buf.append('url("');
    buf.append(base.escapeCSSStr(this.url));
    buf.append('")');
  }

  /**
   * @override
   */
  visit(visitor) {
    return visitor.visitURL(this);
  }
}
goog.inherits(URL, Val);

export const appendList =
    (buf: base.StringBuffer, values: Val[], separator: string,
     toString: boolean): void => {
      const length = values.length;
      values[0].appendTo(buf, toString);
      for (let i = 1; i < length; i++) {
        buf.append(separator);
        values[i].appendTo(buf, toString);
      }
    };

export class SpaceList extends adapt.css.Val {
  constructor(public values: Val[]) {
    Val.call(this);
  }

  /**
   * @override
   */
  appendTo(buf, toString) {
    appendList(buf, this.values, ' ', toString);
  }

  /**
   * @override
   */
  visit(visitor) {
    return visitor.visitSpaceList(this);
  }

  /**
   * @override
   */
  isSpaceList() true
}
goog.inherits(SpaceList, Val);

export class CommaList extends adapt.css.Val {
  constructor(public values: Val[]) {
    Val.call(this);
  }

  /**
   * @override
   */
  appendTo(buf, toString) {
    appendList(buf, this.values, ',', toString);
  }

  /**
   * @override
   */
  visit(visitor) {
    return visitor.visitCommaList(this);
  }
}
goog.inherits(CommaList, Val);

export class Func extends adapt.css.Val {
  constructor(public name: string, public values: Val[]) {
    Val.call(this);
  }

  /**
   * @override
   */
  appendTo(buf, toString) {
    buf.append(base.escapeCSSIdent(this.name));
    buf.append('(');
    appendList(buf, this.values, ',', toString);
    buf.append(')');
  }

  /**
   * @override
   */
  visit(visitor) {
    return visitor.visitFunc(this);
  }
}
goog.inherits(Func, Val);

export class Expr extends adapt.css.Val {
  constructor(public expr: expr.Val) {
    Val.call(this);
  }

  /**
   * @override
   */
  toExpr() {
    return this.expr;
  }

  /**
   * @override
   */
  appendTo(buf, toString) {
    buf.append('-epubx-expr(');
    this.expr.appendTo(buf, 0);
    buf.append(')');
  }

  /**
   * @override
   */
  visit(visitor) {
    return visitor.visitExpr(this);
  }

  /**
   * @override
   */
  isExpr() true
}
goog.inherits(Expr, Val);

export const toNumber = (val: Val, context: expr.Context): number => {
  if (val) {
    if (val.isNumeric()) {
      const numeric = (val as Numeric);
      return context.queryUnitSize(numeric.unit, false) * numeric.num;
    }
    if (val.isNum()) {
      return (val as Num).num;
    }
  }
  return 0;
};

/**
 * Convert numeric value to px
 */
export const convertNumericToPx = (val: Val, context: expr.Context): Numeric =>
    new Numeric(toNumber(val, context), 'px');

export const ident: {[key: string]: Ident} = {
  absolute: getName('absolute'),
  all: getName('all'),
  always: getName('always'),
  auto: getName('auto'),
  avoid: getName('avoid'),
  balance: getName('balance'),
  balance_all: getName('balance-all'),
  block: getName('block'),
  block_end: getName('block-end'),
  block_start: getName('block-start'),
  both: getName('both'),
  bottom: getName('bottom'),
  border_box: getName('border-box'),
  break_all: getName('break-all'),
  break_word: getName('break-word'),
  crop: getName('crop'),
  cross: getName('cross'),
  column: getName('column'),
  exclusive: getName('exclusive'),
  _false: getName('false'),
  fixed: getName('fixed'),
  flex: getName('flex'),
  footnote: getName('footnote'),
  footer: getName('footer'),
  header: getName('header'),
  hidden: getName('hidden'),
  horizontal_tb: getName('horizontal-tb'),
  inherit: getName('inherit'),
  inline: getName('inline'),
  inline_block: getName('inline-block'),
  inline_end: getName('inline-end'),
  inline_start: getName('inline-start'),
  landscape: getName('landscape'),
  left: getName('left'),
  line: getName('line'),
  list_item: getName('list-item'),
  ltr: getName('ltr'),
  manual: getName('manual'),
  none: getName('none'),
  normal: getName('normal'),
  oeb_page_foot: getName('oeb-page-foot'),
  oeb_page_head: getName('oeb-page-head'),
  page: getName('page'),
  relative: getName('relative'),
  right: getName('right'),
  same: getName('same'),
  scale: getName('scale'),
  snap_block: getName('snap-block'),
  spread: getName('spread'),
  _static: getName('static'),
  rtl: getName('rtl'),
  table: getName('table'),
  table_caption: getName('table-caption'),
  table_cell: getName('table-cell'),
  table_footer_group: getName('table-footer-group'),
  table_header_group: getName('table-header-group'),
  table_row: getName('table-row'),
  top: getName('top'),
  transparent: getName('transparent'),
  vertical_lr: getName('vertical-lr'),
  vertical_rl: getName('vertical-rl'),
  visible: getName('visible'),
  _true: getName('true')
};

export const hundredPercent: Numeric = new Numeric(100, '%');

export const fullWidth: Numeric = new Numeric(100, 'vw');

export const fullHeight: Numeric = new Numeric(100, 'vh');

export const numericZero: Numeric = new Numeric(0, 'px');

export const processingOrder = {
  'font-size': 1,
  'color': 2
};

/**
 * Function to sort property names in the order they should be processed
 */
export const processingOrderFn = (name1: string, name2: string): number => {
  const n1 = processingOrder[name1] || Number.MAX_VALUE;
  const n2 = processingOrder[name2] || Number.MAX_VALUE;
  return n1 - n2;
};
