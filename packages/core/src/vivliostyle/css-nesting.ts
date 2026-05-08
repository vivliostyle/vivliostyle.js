/**
 * Copyright 2026 Vivliostyle Foundation
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
 * @fileoverview CssNesting - CSS Nesting preprocessor.
 */

type StatementResult = {
  statements: string[];
  changed: boolean;
};

const LEGACY_PSEUDO_ELEMENTS = new Set([
  "before",
  "after",
  "first-line",
  "first-letter",
]);

const SUPPORTED_GROUP_RULES = new Set(["media", "supports", "-epubx-when"]);
const DECLARATION_OR_BLOCK_TERMINATORS = new Set([";", "}"]);
const RULE_HEADER_TERMINATORS = new Set(["{", ";", "}"]);
const DECLARATION_START_TERMINATORS = new Set([";", "{", "}"]);

const SCOPE_SELECTOR = ":where(:scope)";
const NO_MATCH_SELECTOR = ":where(:not(*))";

export function expandNesting(input: string): string {
  const { statements, changed } = expandBlock(input, 0, input.length, null);
  return changed ? statements.join("\n") : input;
}

function expandBlock(
  input: string,
  start: number,
  end: number,
  parentSelector: string | null,
): StatementResult {
  const statements: string[] = [];
  const declarations: string[] = [];
  let changed = false;
  let index = start;

  const flushDeclarations = () => {
    if (declarations.length === 0) {
      return;
    }
    if (parentSelector) {
      statements.push(serializeRule(parentSelector, declarations));
    } else {
      statements.push(serializeDeclarations(declarations));
    }
    declarations.length = 0;
  };

  while (index < end) {
    index = skipIgnorable(input, index, end);
    if (index >= end || input[index] === "}") {
      break;
    }

    if (input[index] === "@") {
      const atRule = readAtRule(input, index, end);
      if (!atRule) {
        break;
      }
      if (parentSelector && !SUPPORTED_GROUP_RULES.has(atRule.name)) {
        declarations.push(compactWhitespace(input.slice(index, atRule.end)));
        index = atRule.end;
        continue;
      }
      flushDeclarations();
      if (atRule.hasBlock && SUPPORTED_GROUP_RULES.has(atRule.name)) {
        const inner = expandBlock(
          input,
          atRule.blockStart,
          atRule.blockEnd,
          parentSelector,
        );
        changed ||= inner.changed || parentSelector != null;
        statements.push(
          `${atRule.header} {${joinStatements(inner.statements)}}`,
        );
      } else {
        statements.push(compactWhitespace(input.slice(index, atRule.end)));
      }
      index = atRule.end;
      continue;
    }

    if (parentSelector && isDeclarationStart(input, index, end)) {
      const declaration = readDeclaration(input, index, end);
      if (!declaration) {
        break;
      }
      declarations.push(compactWhitespace(declaration.text));
      index = declaration.end;
      continue;
    }

    flushDeclarations();
    const rule = readStyleRule(input, index, end);
    if (!rule) {
      const raw = readUntilSemicolonOrBrace(input, index, end);
      statements.push(compactWhitespace(raw.text));
      index = raw.end;
      continue;
    }
    if (
      parentSelector &&
      shouldKeepRuleLikeChunkInDeclarations(input, index, rule)
    ) {
      const raw = readRuleLikeDeclaration(input, index, rule.end, end);
      declarations.push(compactWhitespace(raw.text));
      index = raw.end;
      continue;
    }

    const selector = parentSelector
      ? expandNestedSelectorList(parentSelector, rule.prelude)
      : replaceScopeAmpersands(rule.prelude);
    if (selector) {
      changed ||= parentSelector != null;
      const inner = expandBlock(
        input,
        rule.blockStart,
        rule.blockEnd,
        selector,
      );
      changed ||= inner.changed;
      if (inner.statements.length === 0) {
        statements.push(`${selector} {}`);
      } else {
        statements.push(...inner.statements);
      }
    }
    index = rule.end;
  }

  flushDeclarations();
  return { statements, changed };
}

function serializeRule(selector: string, declarations: string[]): string {
  return `${selector} { ${serializeDeclarations(declarations)} }`;
}

function serializeDeclarations(declarations: string[]): string {
  return declarations
    .map((declaration) =>
      declaration.endsWith(";") ? declaration : `${declaration};`,
    )
    .join(" ");
}

function joinStatements(statements: string[]): string {
  if (statements.length === 0) {
    return "";
  }
  return ` ${statements.join(" ")} `;
}

function expandNestedSelectorList(
  parentSelector: string,
  prelude: string,
): string | null {
  const nestingSelector = makeNestingSelector(parentSelector);
  if (!nestingSelector) {
    return null;
  }
  const selectors = splitTopLevel(prelude, ",");
  const expanded = selectors
    .map((selector) => selector.trim())
    .filter(Boolean)
    .map((selector) => {
      const replaced = replaceAmpersands(selector, nestingSelector);
      if (replaced.found) {
        return replaced.text;
      }
      return `${nestingSelector} ${selector}`;
    })
    .filter(Boolean);
  if (expanded.length === 0) {
    return null;
  }
  return expanded.join(", ");
}

export function replaceScopeAmpersands(selector: string): string {
  return replaceAmpersands(selector.trim(), SCOPE_SELECTOR).text;
}

function makeNestingSelector(parentSelector: string): string | null {
  const selectors = splitTopLevel(parentSelector, ",")
    .map((selector) => selector.trim())
    .filter(Boolean)
    .filter((selector) => !containsPseudoElement(selector));
  if (selectors.length === 0) {
    return null;
  }
  return `:is(${selectors.join(", ")})`;
}

function containsPseudoElement(selector: string): boolean {
  let index = 0;
  while (index < selector.length) {
    const escaped = skipEscapedCodePoint(selector, index);
    if (escaped != null) {
      index = escaped;
      continue;
    }
    const skipped = skipQuotedStringOrComment(selector, index, selector.length);
    if (skipped != null) {
      index = skipped;
      continue;
    }
    const char = selector[index];
    if (char === ":") {
      if (selector[index + 1] === ":") {
        return true;
      }
      const identStart = index + 1;
      const identEnd = readName(selector, identStart, selector.length);
      const ident = selector.slice(identStart, identEnd).toLowerCase();
      if (LEGACY_PSEUDO_ELEMENTS.has(ident)) {
        return true;
      }
      index = identEnd;
      continue;
    }
    index++;
  }
  return false;
}

function replaceAmpersands(
  selector: string,
  replacement: string,
): { text: string; found: boolean } {
  let index = 0;
  let found = false;
  let result = "";
  const functionStack: string[] = [];
  const replacementContainsHas = containsHasPseudoClass(replacement);
  while (index < selector.length) {
    const escaped = skipEscapedCodePoint(selector, index);
    if (escaped != null) {
      result += selector.slice(index, escaped);
      index = escaped;
      continue;
    }
    const skipped = skipQuotedStringOrComment(selector, index, selector.length);
    if (skipped != null) {
      result += selector.slice(index, skipped);
      index = skipped;
      continue;
    }
    const char = selector[index];
    if (char === ":" && selector[index + 1] !== ":") {
      const identStart = index + 1;
      const identEnd = readName(selector, identStart, selector.length);
      if (identEnd > identStart && selector[identEnd] === "(") {
        functionStack.push(selector.slice(identStart, identEnd).toLowerCase());
        result += selector.slice(index, identEnd + 1);
        index = identEnd + 1;
        continue;
      }
    }
    if (char === "(") {
      functionStack.push("");
      result += char;
      index++;
      continue;
    }
    if (char === ")") {
      functionStack.pop();
      result += char;
      index++;
      continue;
    }
    if (char === "&") {
      result +=
        replacementContainsHas && functionStack.includes("has")
          ? NO_MATCH_SELECTOR
          : replacement;
      found = true;
      index++;
      continue;
    }
    result += char;
    index++;
  }
  return { text: result, found };
}

function containsHasPseudoClass(selector: string): boolean {
  let index = 0;
  while (index < selector.length) {
    const escaped = skipEscapedCodePoint(selector, index);
    if (escaped != null) {
      index = escaped;
      continue;
    }
    const skipped = skipQuotedStringOrComment(selector, index, selector.length);
    if (skipped != null) {
      index = skipped;
      continue;
    }
    const char = selector[index];
    if (char === ":" && selector[index + 1] !== ":") {
      const identStart = index + 1;
      const identEnd = readName(selector, identStart, selector.length);
      if (
        identEnd > identStart &&
        selector.slice(identStart, identEnd).toLowerCase() === "has" &&
        selector[identEnd] === "("
      ) {
        return true;
      }
      index = identEnd;
      continue;
    }
    index++;
  }
  return false;
}

function splitTopLevel(input: string, separator: string): string[] {
  const parts: string[] = [];
  let start = 0;
  let index = 0;
  let parenDepth = 0;
  let bracketDepth = 0;
  while (index < input.length) {
    const escaped = skipEscapedCodePoint(input, index);
    if (escaped != null) {
      index = escaped;
      continue;
    }
    const skipped = skipQuotedStringOrComment(input, index, input.length);
    if (skipped != null) {
      index = skipped;
      continue;
    }
    const char = input[index];
    switch (char) {
      case "(":
        parenDepth++;
        break;
      case ")":
        parenDepth = Math.max(0, parenDepth - 1);
        break;
      case "[":
        bracketDepth++;
        break;
      case "]":
        bracketDepth = Math.max(0, bracketDepth - 1);
        break;
      default:
        if (parenDepth === 0 && bracketDepth === 0 && char === separator) {
          parts.push(input.slice(start, index));
          start = index + 1;
        }
        break;
    }
    index++;
  }
  parts.push(input.slice(start));
  return parts;
}

function isDeclarationStart(
  input: string,
  start: number,
  end: number,
): boolean {
  const identStart = start;
  const identEnd = readPropertyName(input, identStart, end);
  if (identEnd <= identStart) {
    return false;
  }
  const colonIndex = skipIgnorable(input, identEnd, end);
  if (colonIndex >= end || input[colonIndex] !== ":") {
    return false;
  }
  const terminator = findTopLevelTerminator(
    input,
    colonIndex + 1,
    end,
    DECLARATION_START_TERMINATORS,
  );
  if (terminator?.char === "{") {
    return !isLikelyNestedTypeOrUniversalSelector(
      input,
      start,
      identEnd,
      colonIndex,
      terminator.index,
    );
  }
  return true;
}

function isLikelyNestedTypeOrUniversalSelector(
  input: string,
  start: number,
  identEnd: number,
  colonIndex: number,
  blockIndex: number,
): boolean {
  if (skipIgnorable(input, identEnd, blockIndex) !== colonIndex) {
    return false;
  }
  const afterColon = skipIgnorable(input, colonIndex + 1, blockIndex);
  if (afterColon !== colonIndex + 1 || afterColon >= blockIndex) {
    return false;
  }
  const char = input[afterColon];
  return char === ":" || char === "\\" || /[A-Za-z_-]/.test(char);
}

function readPropertyName(input: string, start: number, end: number): number {
  let index = start;
  if (input[index] === "-") {
    index++;
    if (index < end && input[index] === "-") {
      index++;
    }
  }
  return readName(input, index, end);
}

function readName(input: string, start: number, end: number): number {
  let index = start;
  while (index < end) {
    const char = input[index];
    if (char === "\\") {
      index += 2;
      continue;
    }
    if (!/[0-9A-Za-z_-]/.test(char)) {
      break;
    }
    index++;
  }
  return index;
}

function readDeclaration(
  input: string,
  start: number,
  end: number,
): { text: string; end: number } | null {
  const result = findTopLevelTerminator(
    input,
    start,
    end,
    DECLARATION_OR_BLOCK_TERMINATORS,
  );
  if (!result) {
    const text = input.slice(start, end).trim();
    if (!text) {
      return null;
    }
    return {
      text,
      end,
    };
  }
  const declarationEnd = result.char === ";" ? result.index + 1 : result.index;
  return {
    text: input.slice(start, declarationEnd).trim(),
    end: declarationEnd,
  };
}

function readStyleRule(
  input: string,
  start: number,
  end: number,
): {
  prelude: string;
  blockStart: number;
  blockEnd: number;
  end: number;
} | null {
  const header = findTopLevelTerminator(
    input,
    start,
    end,
    RULE_HEADER_TERMINATORS,
  );
  if (!header || header.char !== "{") {
    return null;
  }
  const blockEnd = findMatchingBrace(input, header.index, end);
  if (blockEnd < 0) {
    return null;
  }
  return {
    prelude: compactWhitespace(input.slice(start, header.index)),
    blockStart: header.index + 1,
    blockEnd,
    end: blockEnd + 1,
  };
}

function shouldKeepRuleLikeChunkInDeclarations(
  input: string,
  start: number,
  rule: {
    prelude: string;
    blockStart: number;
    blockEnd: number;
    end: number;
  },
): boolean {
  if (!isPlausibleNestedSelectorPrelude(input, start, rule.blockStart - 1)) {
    return true;
  }
  const bodyStart = skipIgnorable(input, rule.blockStart, rule.blockEnd);
  return bodyStart < rule.blockEnd && input[bodyStart] === ";";
}

function isPlausibleNestedSelectorPrelude(
  input: string,
  start: number,
  end: number,
): boolean {
  const index = skipIgnorable(input, start, end);
  if (index >= end) {
    return false;
  }
  const char = input[index];
  return (
    char === "&" ||
    char === "." ||
    char === "#" ||
    char === ":" ||
    char === "[" ||
    char === "|" ||
    char === "*" ||
    char === ">" ||
    char === "+" ||
    char === "~" ||
    char === "\\" ||
    /[A-Za-z_-]/.test(char)
  );
}

function readRuleLikeDeclaration(
  input: string,
  start: number,
  ruleEnd: number,
  end: number,
): { text: string; end: number } {
  const suffixStart = skipIgnorable(input, ruleEnd, end);
  const declarationEnd =
    suffixStart < end && input[suffixStart] === ";" ? suffixStart + 1 : ruleEnd;
  return {
    text: input.slice(start, declarationEnd),
    end: declarationEnd,
  };
}

function readAtRule(
  input: string,
  start: number,
  end: number,
): {
  name: string;
  header: string;
  hasBlock: boolean;
  blockStart: number;
  blockEnd: number;
  end: number;
} | null {
  const header = findTopLevelTerminator(
    input,
    start,
    end,
    RULE_HEADER_TERMINATORS,
  );
  if (!header) {
    return null;
  }
  const nameEnd = readName(input, start + 1, end);
  const name = input.slice(start + 1, nameEnd).toLowerCase();
  const headerText = compactWhitespace(input.slice(start, header.index));
  if (header.char !== "{") {
    return {
      name,
      header: headerText,
      hasBlock: false,
      blockStart: -1,
      blockEnd: -1,
      end: header.index + (header.char === ";" ? 1 : 0),
    };
  }
  const blockEnd = findMatchingBrace(input, header.index, end);
  if (blockEnd < 0) {
    return null;
  }
  return {
    name,
    header: headerText,
    hasBlock: true,
    blockStart: header.index + 1,
    blockEnd,
    end: blockEnd + 1,
  };
}

function readUntilSemicolonOrBrace(
  input: string,
  start: number,
  end: number,
): { text: string; end: number } {
  const result = findTopLevelTerminator(
    input,
    start,
    end,
    DECLARATION_OR_BLOCK_TERMINATORS,
  );
  if (!result) {
    return { text: input.slice(start, end), end };
  }
  const sliceEnd = result.char === ";" ? result.index + 1 : result.index;
  return { text: input.slice(start, sliceEnd), end: sliceEnd };
}

function findTopLevelTerminator(
  input: string,
  start: number,
  end: number,
  terminators: Set<string>,
): { index: number; char: string } | null {
  let index = start;
  let parenDepth = 0;
  let bracketDepth = 0;
  let braceDepth = 0;
  while (index < end) {
    const skipped = skipQuotedStringOrComment(input, index, end);
    if (skipped != null) {
      index = skipped;
      continue;
    }
    const char = input[index];
    switch (char) {
      case "(":
        parenDepth++;
        break;
      case ")":
        parenDepth = Math.max(0, parenDepth - 1);
        break;
      case "[":
        bracketDepth++;
        break;
      case "]":
        bracketDepth = Math.max(0, bracketDepth - 1);
        break;
      case "{":
        if (
          parenDepth === 0 &&
          bracketDepth === 0 &&
          braceDepth === 0 &&
          terminators.has(char)
        ) {
          return { index, char };
        }
        braceDepth++;
        break;
      case "}":
        if (
          parenDepth === 0 &&
          bracketDepth === 0 &&
          braceDepth === 0 &&
          terminators.has(char)
        ) {
          return { index, char };
        }
        braceDepth = Math.max(0, braceDepth - 1);
        break;
      default:
        if (
          parenDepth === 0 &&
          bracketDepth === 0 &&
          braceDepth === 0 &&
          terminators.has(char)
        ) {
          return { index, char };
        }
        break;
    }
    index++;
  }
  return null;
}

function findMatchingBrace(
  input: string,
  openIndex: number,
  end: number,
): number {
  let index = openIndex + 1;
  let depth = 1;
  while (index < end) {
    const skipped = skipQuotedStringOrComment(input, index, end);
    if (skipped != null) {
      index = skipped;
      continue;
    }
    const char = input[index];
    if (char === "{") {
      depth++;
    } else if (char === "}") {
      depth--;
      if (depth === 0) {
        return index;
      }
    }
    index++;
  }
  return -1;
}

function skipIgnorable(input: string, start: number, end: number): number {
  let index = start;
  while (index < end) {
    const char = input[index];
    if (isCssWhitespace(char)) {
      index++;
      continue;
    }
    if (char === "/" && input[index + 1] === "*") {
      index = skipComment(input, index, end);
      continue;
    }
    break;
  }
  return index;
}

function skipComment(input: string, start: number, end: number): number {
  const closeIndex = input.indexOf("*/", start + 2);
  if (closeIndex < 0 || closeIndex + 2 > end) {
    return end;
  }
  return closeIndex + 2;
}

function skipQuotedStringOrComment(
  input: string,
  start: number,
  end: number,
): number | null {
  const char = input[start];
  if (char === '"' || char === "'") {
    return skipString(input, start);
  }
  if (char === "/" && input[start + 1] === "*") {
    return skipComment(input, start, end);
  }
  return null;
}

function skipEscapedCodePoint(input: string, start: number): number | null {
  if (input[start] !== "\\") {
    return null;
  }
  if (start + 1 >= input.length) {
    return input.length;
  }
  return start + 2;
}

function skipString(input: string, start: number): number {
  const quote = input[start];
  let index = start + 1;
  while (index < input.length) {
    const char = input[index];
    if (char === "\\") {
      index += 2;
      continue;
    }
    if (char === quote) {
      return index + 1;
    }
    index++;
  }
  return input.length;
}

function isCssWhitespace(char: string): boolean {
  return (
    char === " " ||
    char === "\n" ||
    char === "\r" ||
    char === "\t" ||
    char === "\f"
  );
}

function compactWhitespace(text: string): string {
  let result = "";
  let index = 0;
  let pendingSpace = false;

  while (index < text.length) {
    const skipped = skipQuotedStringOrComment(text, index, text.length);
    if (skipped != null && text[index] !== "/") {
      if (pendingSpace && result.length > 0) {
        result += " ";
        pendingSpace = false;
      }
      result += text.slice(index, skipped);
      index = skipped;
      continue;
    }

    if (skipped != null) {
      pendingSpace = result.length > 0;
      index = skipped;
      continue;
    }

    const char = text[index];

    if (isCssWhitespace(char)) {
      pendingSpace = result.length > 0;
      index++;
      continue;
    }

    if (pendingSpace && result.length > 0) {
      result += " ";
      pendingSpace = false;
    }

    result += char;
    index++;
  }

  return result;
}
