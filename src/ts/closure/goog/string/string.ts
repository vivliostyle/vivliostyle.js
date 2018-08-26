// Copyright 2006 The Closure Library Authors. All Rights Reserved.
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//      http://www.apache.org/licenses/LICENSE-2.0
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS-IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

/**
 * @fileoverview Utilities for string manipulation.
 * @author arv@google.com (Erik Arvidsson)
 */

/**
 * Namespace for string utilities
 */

/**
 * @define {boolean} Enables HTML escaping of lowercase letter "e" which helps
 * with detection of double-escaping as this letter is frequently used.
 */
goog.define('goog.string.DETECT_DOUBLE_ESCAPING', false);

/**
 * @define {boolean} Whether to force non-dom html unescaping.
 */
goog.define('goog.string.FORCE_NON_DOM_HTML_UNESCAPING', false);

/**
 * Common Unicode string characters.
 * @enum {string}
 */
export enum Unicode {
  NBSP = '\u00a0'
}

/**
 * Fast prefix-checker.
 * @param str The string to check.
 * @param.
 * @return.
 */
export function startsWith(str: string, prefix: string): boolean {
  return str.lastIndexOf(prefix, 0) == 0;
}

/**
 * Fast suffix-checker.
 * @param str The string to check.
 * @param.
 * @return.
 */
export function endsWith(str: string, suffix: string): boolean {
  let l = str.length - suffix.length;
  return l >= 0 && str.indexOf(suffix, l) == l;
}

/**
 * Case-insensitive prefix-checker.
 * @param str The string to check.
 * @param.
 * @return (ignoring
 *     case).
 */
export function caseInsensitiveStartsWith(
    str: string, prefix: string): boolean {
  return caseInsensitiveCompare(prefix, str.substr(0, prefix.length)) == 0;
}

/**
 * Case-insensitive suffix-checker.
 * @param str The string to check.
 * @param.
 * @return (ignoring
 *     case).
 */
export function caseInsensitiveEndsWith(str: string, suffix: string): boolean {
  return caseInsensitiveCompare(
             suffix, str.substr(str.length - suffix.length, suffix.length)) ==
      0;
}

/**
 * Case-insensitive equality checker.
 * @param str1 First string to check.
 * @param str2 Second string to check.
 * @return are the same string,
 *     ignoring case.
 */
export function caseInsensitiveEquals(str1: string, str2: string): boolean {
  return str1.toLowerCase() == str2.toLowerCase();
}

/**
 * Does simple python-style string substitution.
 * subs("foo%s hot%s", "bar", "dog") becomes "foobar hotdog".
 * @param str The string containing the pattern.
 * @param var_args The items to substitute into the pattern.
 * @return in which each occurrence of
 *     {@code %s} has been replaced an argument from {@code var_args}.
 */
export function subs(str: string, ...var_args: any[]): string {
  let splitParts = str.split('%s');
  let returnString = '';
  let subsArguments = Array.prototype.slice.call(arguments, 1);
  while (subsArguments.length &&
         // Replace up to the last split part. We are inserting in the
         // positions between split parts.
         splitParts.length > 1) {
    returnString += splitParts.shift() + subsArguments.shift();
  }
  return returnString + splitParts.join('%s');
}

// Join unused '%s'

/**
 * Converts multiple whitespace chars (spaces, non-breaking-spaces, new lines
 * and tabs) to a single space, and strips leading and trailing whitespace.
 * @param str Input string.
 * @return with collapsed whitespace.
 */
export function collapseWhitespace(str: string): string {
  // Since IE doesn't include non-breaking-space (0xa0) in their \s character
  // class (as required by section 7.2 of the ECMAScript spec), we explicitly
  // include it in the regexp to enforce consistent cross-browser behavior.
  return str.replace(/[\s\xa0]+/g, ' ').replace(/^\s+|\s+$/g, '');
}

/**
 * Checks if a string is empty or contains only whitespaces.
 * @param str The string to check.
 * @return is empty or whitespace only.
 */
export function isEmptyOrWhitespace(str: string): boolean {
  // testing length == 0 first is actually slower in all browsers (about the
  // same in Opera).
  // Since IE doesn't include non-breaking-space (0xa0) in their \s character
  // class (as required by section 7.2 of the ECMAScript spec), we explicitly
  // include it in the regexp to enforce consistent cross-browser behavior.
  return /^[\s\xa0]*$/.test(str);
}

/**
 * Checks if a string is empty.
 * @param str The string to check.
 * @return is empty.
 */
export function isEmptyString(str: string): boolean {
  return str.length == 0;
}

/**
 * Checks if a string is empty or contains only whitespaces.
 *
 * TODO(user): Deprecate this when clients have been switched over to
 * goog.string.isEmptyOrWhitespace.
 *
 * @param str The string to check.
 * @return is empty or whitespace only.
 */
export const isEmpty = isEmptyOrWhitespace;

/**
 * Checks if a string is null, undefined, empty or contains only whitespaces.
 * @param str The string to check.
 * @return is null, undefined, empty, or
 *     whitespace only.
 * @deprecated Use goog.string.isEmptyOrWhitespace(goog.string.makeSafe(str))
 *     instead.
 */
export function isEmptyOrWhitespaceSafe(str: any): boolean {
  return isEmptyOrWhitespace(makeSafe(str));
}

/**
 * Checks if a string is null, undefined, empty or contains only whitespaces.
 *
 * TODO(user): Deprecate this when clients have been switched over to
 * goog.string.isEmptyOrWhitespaceSafe.
 *
 * @param str The string to check.
 * @return is null, undefined, empty, or
 *     whitespace only.
 */
export const isEmptySafe = isEmptyOrWhitespaceSafe;

/**
 * Checks if a string is all breaking whitespace.
 * @param str The string to check.
 * @return Whether the string is all breaking whitespace.
 */
export function isBreakingWhitespace(str: string): boolean {
  return !/[^\t\n\r ]/.test(str);
}

/**
 * Checks if a string contains all letters.
 * @param str string to check.
 * @return consists entirely of letters.
 */
export function isAlpha(str: string): boolean {
  return !/[^a-zA-Z]/.test(str);
}

/**
 * Checks if a string contains only numbers.
 * @param str string to check. If not a string, it will be
 *     casted to one.
 * @return is numeric.
 */
export function isNumeric(str: any): boolean {
  return !/[^0-9]/.test(str);
}

/**
 * Checks if a string contains only numbers or letters.
 * @param str string to check.
 * @return is alphanumeric.
 */
export function isAlphaNumeric(str: string): boolean {
  return !/[^a-zA-Z0-9]/.test(str);
}

/**
 * Checks if a character is a space character.
 * @param ch Character to check.
 * @return is a space.
 */
export function isSpace(ch: string): boolean {
  return ch == ' ';
}

/**
 * Checks if a character is a valid unicode character.
 * @param ch Character to check.
 * @return is a valid unicode character.
 */
export function isUnicodeChar(ch: string): boolean {
  return ch.length == 1 && ch >= ' ' && ch <= '~' ||
      ch >= '\u0080' && ch <= '\ufffd';
}

/**
 * Takes a string and replaces newlines with a space. Multiple lines are
 * replaced with a single space.
 * @param str The string from which to strip newlines.
 * @return stripped of newlines.
 */
export function stripNewlines(str: string): string {
  return str.replace(/(\r\n|\r|\n)+/g, ' ');
}

/**
 * Replaces Windows and Mac new lines with unix style: \r or \r\n with \n.
 * @param str The string to in which to canonicalize newlines.
 * @return with canonicalized newlines.
 */
export function canonicalizeNewlines(str: string): string {
  return str.replace(/(\r\n|\r|\n)/g, '\n');
}

/**
 * Normalizes whitespace in a string, replacing all whitespace chars with
 * a space.
 * @param str The string in which to normalize whitespace.
 * @return with all whitespace normalized.
 */
export function normalizeWhitespace(str: string): string {
  return str.replace(/\xa0|\s/g, ' ');
}

/**
 * Normalizes spaces in a string, replacing all consecutive spaces and tabs
 * with a single space. Replaces non-breaking space with a space.
 * @param str The string in which to normalize spaces.
 * @return with all consecutive spaces and tabs
 *    replaced with a single space.
 */
export function normalizeSpaces(str: string): string {
  return str.replace(/\xa0|[ \t]+/g, ' ');
}

/**
 * Removes the breaking spaces from the left and right of the string and
 * collapses the sequences of breaking spaces in the middle into single spaces.
 * The original and the result strings render the same way in HTML.
 * @param str A string in which to collapse spaces.
 * @return Copy of the string with normalized breaking spaces.
 */
export function collapseBreakingSpaces(str: string): string {
  return str.replace(/[\t\r\n ]+/g, ' ')
      .replace(/^[\t\r\n ]+|[\t\r\n ]+$/g, '');
}

/**
 * Trims white spaces to the left and right of a string.
 * @param str The string to trim.
 * @return.
 */
export const trim = goog.TRUSTED_SITE && String.prototype.trim ?
    function(str: string) :
    string {
      return str.trim();
    }: function(str: string): string {
      // Since IE doesn't include non-breaking-space (0xa0) in their \s
      // character class (as required by section 7.2 of the ECMAScript spec),
      // we explicitly include it in the regexp to enforce consistent
      // cross-browser behavior.
      return str.replace(/^[\s\xa0]+|[\s\xa0]+$/g, '');
    };

/**
 * Trims whitespaces at the left end of a string.
 * @param str The string to left trim.
 * @return.
 */
export function trimLeft(str: string): string {
  // Since IE doesn't include non-breaking-space (0xa0) in their \s character
  // class (as required by section 7.2 of the ECMAScript spec), we explicitly
  // include it in the regexp to enforce consistent cross-browser behavior.
  return str.replace(/^[\s\xa0]+/, '');
}

/**
 * Trims whitespaces at the right end of a string.
 * @param str The string to right trim.
 * @return.
 */
export function trimRight(str: string): string {
  // Since IE doesn't include non-breaking-space (0xa0) in their \s character
  // class (as required by section 7.2 of the ECMAScript spec), we explicitly
  // include it in the regexp to enforce consistent cross-browser behavior.
  return str.replace(/[\s\xa0]+$/, '');
}

/**
 * A string comparator that ignores case.
 * -1 = str1 less than str2
 *  0 = str1 equals str2
 *  1 = str1 greater than str2
 *
 * @param str1 The string to compare.
 * @param to.
 * @return The comparator result, as described above.
 */
export function caseInsensitiveCompare(str1: string, str2: string): number {
  let test1 = String(str1).toLowerCase();
  let test2 = String(str2).toLowerCase();
  if (test1 < test2) {
    return -1;
  } else {
    if (test1 == test2) {
      return 0;
    } else {
      return 1;
    }
  }
}

/**
 * Regular expression used for splitting a string into substrings of fractional
 * numbers, integers, and non-numeric characters.
 */
export const numerateCompareRegExp_: RegExp = /(\.\d+)|(\d+)|(\D+)/g;

/**
 * String comparison function that handles numbers in a way humans might expect.
 * Using this function, the string "File 2.jpg" sorts before "File 10.jpg". The
 * comparison is mostly case-insensitive, though strings that are identical
 * except for case are sorted with the upper-case strings before lower-case.
 *
 * This comparison function is significantly slower (about 500x) than either
 * the default or the case-insensitive compare. It should not be used in
 * time-critical code, but should be fast enough to sort several hundred short
 * strings (like filenames) with a reasonable delay.
 *
 * @param str1 The string to compare in a numerically sensitive way.
 * @param to.
 * @return less than 0 if str1 < str2, 0 if str1 == str2, greater than
 *     0 if str1 > str2.
 */
export function numerateCompare(str1: string, str2: string): number {
  if (str1 == str2) {
    return 0;
  }
  if (!str1) {
    return -1;
  }
  if (!str2) {
    return 1;
  }

  // Using match to split the entire string ahead of time turns out to be faster
  // for most inputs than using RegExp.exec or iterating over each character.
  let tokens1 = str1.toLowerCase().match(numerateCompareRegExp_);
  let tokens2 = str2.toLowerCase().match(numerateCompareRegExp_);
  let count = Math.min(tokens1.length, tokens2.length);
  for (let i = 0; i < count; i++) {
    let a = tokens1[i];
    let b = tokens2[i];

    // Compare pairs of tokens, returning if one token sorts before the other.
    if (a != b) {
      // Only if both tokens are integers is a special comparison required.
      // Decimal numbers are sorted as strings (e.g., '.09' < '.1').
      let num1 = parseInt(a, 10);
      if (!isNaN(num1)) {
        let num2 = parseInt(b, 10);
        if (!isNaN(num2) && num1 - num2) {
          return num1 - num2;
        }
      }
      return a < b ? -1 : 1;
    }
  }

  // If one string is a substring of the other, the shorter string sorts first.
  if (tokens1.length != tokens2.length) {
    return tokens1.length - tokens2.length;
  }

  // The two strings must be equivalent except for case (perfect equality is
  // tested at the head of the function.) Revert to default ASCII-betical string
  // comparison to stablize the sort.
  return str1 < str2 ? -1 : 1;
}

/**
 * URL-encodes a string
 * @param str The string to url-encode.
 * @return that is safe for urls.
 *     Note that '#', ':', and other characters used to delimit portions
 *     of URLs *will* be encoded.
 */
export function urlEncode(str: any): string {
  return encodeURIComponent(String(str));
}

/**
 * URL-decodes the string. We need to specially handle '+'s because
 * the javascript library doesn't convert them to spaces.
 * @param str The string to url decode.
 * @return.
 */
export function urlDecode(str: string): string {
  return decodeURIComponent(str.replace(/\+/g, ' '));
}

/**
 * Converts \n to <br>s or <br />s.
 * @param str The string in which to convert newlines.
 * @param opt_xml Whether to use XML compatible tags.
 * @return with converted newlines.
 */
export function newLineToBr(str: string, opt_xml?: boolean): string {
  return str.replace(/(\r\n|\r|\n)/g, opt_xml ? '<br />' : '<br>');
}

/**
 * Escapes double quote '"' and single quote '\'' characters in addition to
 * '&', '<', and '>' so that a string can be included in an HTML tag attribute
 * value within double or single quotes.
 *
 * It should be noted that > doesn't need to be escaped for the HTML or XML to
 * be valid, but it has been decided to escape it for consistency with other
 * implementations.
 *
 * With goog.string.DETECT_DOUBLE_ESCAPING, this function escapes also the
 * lowercase letter "e".
 *
 * NOTE(user):
 * HtmlEscape is often called during the generation of large blocks of HTML.
 * Using statics for the regular expressions and strings is an optimization
 * that can more than half the amount of time IE spends in this function for
 * large apps, since strings and regexes both contribute to GC allocations.
 *
 * Testing for the presence of a character before escaping increases the number
 * of function calls, but actually provides a speed increase for the average
 * case -- since the average case often doesn't require the escaping of all 4
 * characters and indexOf() is much cheaper than replace().
 * The worst case does suffer slightly from the additional calls, therefore the
 * opt_isLikelyToContainHtmlChars option has been included for situations
 * where all 4 HTML entities are very likely to be present and need escaping.
 *
 * Some benchmarks (times tended to fluctuate +-0.05ms):
 *                                     FireFox                     IE6
 * (no chars / average (mix of cases) / all 4 chars)
 * no checks                     0.13 / 0.22 / 0.22         0.23 / 0.53 / 0.80
 * indexOf                       0.08 / 0.17 / 0.26         0.22 / 0.54 / 0.84
 * indexOf + re test             0.07 / 0.17 / 0.28         0.19 / 0.50 / 0.85
 *
 * An additional advantage of checking if replace actually needs to be called
 * is a reduction in the number of object allocations, so as the size of the
 * application grows the difference between the various methods would increase.
 *
 * @param str string to be escaped.
 * @param opt_isLikelyToContainHtmlChars Don't perform a check to see
 *     if the character needs replacing - use this option if you expect each of
 *     the characters to appear often. Leave false if you expect few html
 *     characters to occur in your strings, such as if you are escaping HTML.
 * @return.
 */
export function htmlEscape(
    str: string, opt_isLikelyToContainHtmlChars?: boolean): string {
  if (opt_isLikelyToContainHtmlChars) {
    str = str.replace(AMP_RE_, '&amp;')
              .replace(LT_RE_, '&lt;')
              .replace(GT_RE_, '&gt;')
              .replace(QUOT_RE_, '&quot;')
              .replace(SINGLE_QUOTE_RE_, '&#39;')
              .replace(NULL_RE_, '&#0;');
    if (goog.string.DETECT_DOUBLE_ESCAPING) {
      str = str.replace(E_RE_, '&#101;');
    }
    return str;
  } else {
    // quick test helps in the case when there are no chars to replace, in
    // worst case this makes barely a difference to the time taken
    if (!ALL_RE_.test(str)) {
      return str;
    }

    // str.indexOf is faster than regex.test in this case
    if (str.indexOf('&') != -1) {
      str = str.replace(AMP_RE_, '&amp;');
    }
    if (str.indexOf('<') != -1) {
      str = str.replace(LT_RE_, '&lt;');
    }
    if (str.indexOf('>') != -1) {
      str = str.replace(GT_RE_, '&gt;');
    }
    if (str.indexOf('"') != -1) {
      str = str.replace(QUOT_RE_, '&quot;');
    }
    if (str.indexOf('\'') != -1) {
      str = str.replace(SINGLE_QUOTE_RE_, '&#39;');
    }
    if (str.indexOf('\x00') != -1) {
      str = str.replace(NULL_RE_, '&#0;');
    }
    if (goog.string.DETECT_DOUBLE_ESCAPING && str.indexOf('e') != -1) {
      str = str.replace(E_RE_, '&#101;');
    }
    return str;
  }
}

/**
 * Regular expression that matches an ampersand, for use in escaping.
 */
export const AMP_RE_: RegExp = /&/g;

/**
 * Regular expression that matches a less than sign, for use in escaping.
 */
export const LT_RE_: RegExp = /</g;

/**
 * Regular expression that matches a greater than sign, for use in escaping.
 */
export const GT_RE_: RegExp = />/g;

/**
 * Regular expression that matches a double quote, for use in escaping.
 */
export const QUOT_RE_: RegExp = /"/g;

/**
 * Regular expression that matches a single quote, for use in escaping.
 */
export const SINGLE_QUOTE_RE_: RegExp = /'/g;

/**
 * Regular expression that matches null character, for use in escaping.
 */
export const NULL_RE_: RegExp = /\x00/g;

/**
 * Regular expression that matches a lowercase letter "e", for use in escaping.
 */
export const E_RE_: RegExp = /e/g;

/**
 * Regular expression that matches any character that needs to be escaped.
 */
export const ALL_RE_: RegExp =
    goog.string.DETECT_DOUBLE_ESCAPING ? /[\x00&<>"'e]/ : /[\x00&<>"']/;

/**
 * Unescapes an HTML string.
 *
 * @param str The string to unescape.
 * @return.
 */
export function unescapeEntities(str: string): string {
  if (contains(str, '&')) {
    // We are careful not to use a DOM if we do not have one or we explicitly
    // requested non-DOM html unescaping.
    if (!goog.string.FORCE_NON_DOM_HTML_UNESCAPING &&
        'document' in goog.global) {
      return unescapeEntitiesUsingDom_(str);
    } else {
      // Fall back on pure XML entities
      return unescapePureXmlEntities_(str);
    }
  }
  return str;
}

/**
 * Unescapes a HTML string using the provided document.
 *
 * @param str The string to unescape.
 * @param document A document to use in escaping the string.
 * @return.
 */
export function unescapeEntitiesWithDocument(
    str: string, document: Document): string {
  if (contains(str, '&')) {
    return unescapeEntitiesUsingDom_(str, document);
  }
  return str;
}

/**
 * Unescapes an HTML string using a DOM to resolve non-XML, non-numeric
 * entities. This function is XSS-safe and whitespace-preserving.
 * @param str The string to unescape.
 * @param opt_document An optional document to use for creating
 *     elements. If this is not specified then the default window.document
 *     will be used.
 * @return string.
 */
export function unescapeEntitiesUsingDom_(
    str: string, opt_document?: Document): string {
  let seen:
      {[key: string]:
           string} = {'&amp;': '&', '&lt;': '<', '&gt;': '>', '&quot;': '"'};
  let div;
  if (opt_document) {
    div = opt_document.createElement('div');
  } else {
    div = goog.global.document.createElement('div');
  }

  // Match as many valid entity characters as possible. If the actual entity
  // happens to be shorter, it will still work as innerHTML will return the
  // trailing characters unchanged. Since the entity characters do not include
  // open angle bracket, there is no chance of XSS from the innerHTML use.
  // Since no whitespace is passed to innerHTML, whitespace is preserved.
  return str.replace(HTML_ENTITY_PATTERN_, function(s, entity) {
    // Check for cached entity.
    let value = seen[s];
    if (value) {
      return value;
    }

    // Check for numeric entity.
    if (entity.charAt(0) == '#') {
      // Prefix with 0 so that hex entities (e.g. &#x10) parse as hex numbers.
      let n = Number('0' + entity.substr(1));
      if (!isNaN(n)) {
        value = String.fromCharCode(n);
      }
    }

    // Fall back to innerHTML otherwise.
    if (!value) {
      // Append a non-entity character to avoid a bug in Webkit that parses
      // an invalid entity at the end of innerHTML text as the empty string.
      div.innerHTML = s + ' ';

      // Then remove the trailing character from the result.
      value = div.firstChild.nodeValue.slice(0, -1);
    }

    // Cache and return.
    return seen[s] = value;
  });
}

/**
 * Unescapes XML entities.
 * @param str The string to unescape.
 * @return.
 */
export function unescapePureXmlEntities_(str: string): string {
  return str.replace(/&([^;]+);/g, function(s, entity) {
    switch (entity) {
      case 'amp':
        return '&';
      case 'lt':
        return '<';
      case 'gt':
        return '>';
      case 'quot':
        return '"';
      default:
        if (entity.charAt(0) == '#') {
          // Prefix with 0 so that hex entities (e.g. &#x10) parse as hex.
          let n = Number('0' + entity.substr(1));
          if (!isNaN(n)) {
            return String.fromCharCode(n);
          }
        }

        // For invalid entities we just return the entity
        return s;
    }
  });
}

/**
 * Regular expression that matches an HTML entity.
 * See also HTML5: Tokenization / Tokenizing character references.
 */
export const HTML_ENTITY_PATTERN_: RegExp = /&([^;\s<&]+);?/g;

/**
 * Do escaping of whitespace to preserve spatial formatting. We use character
 * entity #160 to make it safer for xml.
 * @param str The string in which to escape whitespace.
 * @param opt_xml Whether to use XML compatible tags.
 * @return.
 */
export function whitespaceEscape(str: string, opt_xml?: boolean): string {
  // This doesn't use goog.string.preserveSpaces for backwards compatibility.
  return newLineToBr(str.replace(/  /g, ' &#160;'), opt_xml);
}

/**
 * Preserve spaces that would be otherwise collapsed in HTML by replacing them
 * with non-breaking space Unicode characters.
 * @param str The string in which to preserve whitespace.
 * @return with preserved whitespace.
 */
export function preserveSpaces(str: string): string {
  return str.replace(/(^|[\n ]) /g, '$1' + Unicode.NBSP);
}

/**
 * Strip quote characters around a string.  The second argument is a string of
 * characters to treat as quotes.  This can be a single character or a string of
 * multiple character and in that case each of those are treated as possible
 * quote characters. For example:
 *
 * <pre>
 * goog.string.stripQuotes('"abc"', '"`') --> 'abc'
 * goog.string.stripQuotes('`abc`', '"`') --> 'abc'
 * </pre>
 *
 * @param str The string to strip.
 * @param quoteChars The quote characters to strip.
 * @return without the quotes.
 */
export function stripQuotes(str: string, quoteChars: string): string {
  let length = quoteChars.length;
  for (let i = 0; i < length; i++) {
    let quoteChar = length == 1 ? quoteChars : quoteChars.charAt(i);
    if (str.charAt(0) == quoteChar && str.charAt(str.length - 1) == quoteChar) {
      return str.substring(1, str.length - 1);
    }
  }
  return str;
}

/**
 * Truncates a string to a certain length and adds '...' if necessary.  The
 * length also accounts for the ellipsis, so a maximum length of 10 and a string
 * 'Hello World!' produces 'Hello W...'.
 * @param str The string to truncate.
 * @param chars Max number of characters.
 * @param opt_protectEscapedCharacters Whether to protect escaped
 *     characters from being cut off in the middle.
 * @return string.
 */
export function truncate(
    str: string, chars: number,
    opt_protectEscapedCharacters?: boolean): string {
  if (opt_protectEscapedCharacters) {
    str = unescapeEntities(str);
  }
  if (str.length > chars) {
    str = str.substring(0, chars - 3) + '...';
  }
  if (opt_protectEscapedCharacters) {
    str = htmlEscape(str);
  }
  return str;
}

/**
 * Truncate a string in the middle, adding "..." if necessary,
 * and favoring the beginning of the string.
 * @param str The string to truncate the middle of.
 * @param chars Max number of characters.
 * @param opt_protectEscapedCharacters Whether to protect escaped
 *     characters from being cutoff in the middle.
 * @param opt_trailingChars Optional number of trailing characters to
 *     leave at the end of the string, instead of truncating as close to the
 *     middle as possible.
 * @return.
 */
export function truncateMiddle(
    str: string, chars: number, opt_protectEscapedCharacters?: boolean,
    opt_trailingChars?: number): string {
  if (opt_protectEscapedCharacters) {
    str = unescapeEntities(str);
  }
  if (opt_trailingChars && str.length > chars) {
    if (opt_trailingChars > chars) {
      opt_trailingChars = chars;
    }
    let endPoint = str.length - opt_trailingChars;
    let startPoint = chars - opt_trailingChars;
    str = str.substring(0, startPoint) + '...' + str.substring(endPoint);
  } else {
    if (str.length > chars) {
      // Favor the beginning of the string:
      let half = Math.floor(chars / 2);
      let endPos = str.length - half;
      half += chars % 2;
      str = str.substring(0, half) + '...' + str.substring(endPos);
    }
  }
  if (opt_protectEscapedCharacters) {
    str = htmlEscape(str);
  }
  return str;
}

/**
 * Special chars that need to be escaped for goog.string.quote.
 */
export const specialEscapeChars_: {[key: string]: string} = {
  '\x00': '\\0',
  '\b': '\\b',
  '\f': '\\f',
  '\n': '\\n',
  '\r': '\\r',
  '\t': '\\t',
  '\x0B': '\\x0B',
  // '\v' is not supported in JScript
  '"': '\\"',
  '\\': '\\\\'
};

/**
 * Character mappings used internally for goog.string.escapeChar.
 */
export const jsEscapeCache_: {[key: string]: string} = {
  '\'': '\\\''
};

/**
 * Encloses a string in double quotes and escapes characters so that the
 * string is a valid JS string.
 * @param s The string to quote.
 * @return surrounded by double quotes.
 */
export function quote(s: string): string {
  s = String(s);
  if (s.quote) {
    return s.quote();
  } else {
    let sb = ['"'];
    for (let i = 0; i < s.length; i++) {
      let ch = s.charAt(i);
      let cc = ch.charCodeAt(0);
      sb[i + 1] = specialEscapeChars_[ch] ||
          (cc > 31 && cc < 127 ? ch : escapeChar(ch));
    }
    sb.push('"');
    return sb.join('');
  }
}

/**
 * Takes a string and returns the escaped string for that character.
 * @param str The string to escape.
 * @return.
 */
export function escapeString(str: string): string {
  let sb = [];
  for (let i = 0; i < str.length; i++) {
    sb[i] = escapeChar(str.charAt(i));
  }
  return sb.join('');
}

/**
 * Takes a character and returns the escaped string for that character. For
 * example escapeChar(String.fromCharCode(15)) -> "\\x0E".
 * @param c The character to escape.
 * @return.
 */
export function escapeChar(c: string): string {
  if (c in jsEscapeCache_) {
    return jsEscapeCache_[c];
  }
  if (c in specialEscapeChars_) {
    return jsEscapeCache_[c] = specialEscapeChars_[c];
  }
  let rv = c;
  let cc = c.charCodeAt(0);
  if (cc > 31 && cc < 127) {
    rv = c;
  } else {
    // tab is 9 but handled above
    if (cc < 256) {
      rv = '\\x';
      if (cc < 16 || cc > 256) {
        rv += '0';
      }
    } else {
      rv = '\\u';
      if (cc < 4096) {
        // \u1000
        rv += '0';
      }
    }
    rv += cc.toString(16).toUpperCase();
  }
  return jsEscapeCache_[c] = rv;
}

/**
 * Determines whether a string contains a substring.
 * @param str The string to search.
 * @param subString The substring to search for.
 * @return.
 */
export function contains(str: string, subString: string): boolean {
  return str.indexOf(subString) != -1;
}

/**
 * Determines whether a string contains a substring, ignoring case.
 * @param str The string to search.
 * @param subString The substring to search for.
 * @return.
 */
export function caseInsensitiveContains(
    str: string, subString: string): boolean {
  return contains(str.toLowerCase(), subString.toLowerCase());
}

/**
 * Returns the non-overlapping occurrences of ss in s.
 * If either s or ss evalutes to false, then returns zero.
 * @param s The string to look in.
 * @param ss The string to look for.
 * @return Number of occurrences of ss in s.
 */
export function countOf(s: string, ss: string): number {
  return s && ss ? s.split(ss).length - 1 : 0;
}

/**
 * Removes a substring of a specified length at a specific
 * index in a string.
 * @param s The base string from which to remove.
 * @param index The index at which to remove the substring.
 * @param stringLength The length of the substring to remove.
 * @return with the substring removed or the full
 *     string if nothing is removed or the input is invalid.
 */
export function removeAt(
    s: string, index: number, stringLength: number): string {
  let resultStr = s;

  // If the index is greater or equal to 0 then remove substring
  if (index >= 0 && index < s.length && stringLength > 0) {
    resultStr = s.substr(0, index) +
        s.substr(index + stringLength, s.length - index - stringLength);
  }
  return resultStr;
}

/**
 *  Removes the first occurrence of a substring from a string.
 *  @param s The base string from which to remove.
 *  @param ss The string to remove.
 *  @return removed or the full
 *      string if nothing is removed.
 */
export function remove(s: string, ss: string): string {
  let re = new RegExp(regExpEscape(ss), '');
  return s.replace(re, '');
}

/**
 *  Removes all occurrences of a substring from a string.
 *  @param s The base string from which to remove.
 *  @param ss The string to remove.
 *  @return removed or the full
 *      string if nothing is removed.
 */
export function removeAll(s: string, ss: string): string {
  let re = new RegExp(regExpEscape(ss), 'g');
  return s.replace(re, '');
}

/**
 * Escapes characters in the string that are not safe to use in a RegExp.
 * @param s The string to escape. If not a string, it will be casted
 *     to one.
 * @return.
 */
export function regExpEscape(s: any): string {
  return String(s)
      .replace(/([-()\[\]{}+?*.$\^|,:#<!\\])/g, '\\$1')
      .replace(/\x08/g, '\\x08');
}

/**
 * Repeats a string n times.
 * @param string The string to repeat.
 * @param length The number of times to repeat.
 * @return repetitions of
 *     {@code string}.
 */
export function repeat(string: string, length: number): string {
  return (new Array(length + 1)).join(string);
}

/**
 * Pads number to given length and optionally rounds it to a given precision.
 * For example:
 * <pre>padNumber(1.25, 2, 3) -> '01.250'
 * padNumber(1.25, 2) -> '01.25'
 * padNumber(1.25, 2, 1) -> '01.3'
 * padNumber(1.25, 0) -> '1.25'</pre>
 *
 * @param num The number to pad.
 * @param length The desired length.
 * @param opt_precision The desired precision.
 * @return as a string with the given options.
 */
export function padNumber(
    num: number, length: number, opt_precision?: number): string {
  let s = goog.isDef(opt_precision) ? num.toFixed(opt_precision) : String(num);
  let index = s.indexOf('.');
  if (index == -1) {
    index = s.length;
  }
  return repeat('0', Math.max(0, length - index)) + s;
}

/**
 * Returns a string representation of the given object, with
 * null and undefined being returned as the empty string.
 *
 * @param obj The object to convert.
 * @return.
 */
export function makeSafe(obj: any): string {
  return obj == null ? '' : String(obj);
}

/**
 * Concatenates string expressions. This is useful
 * since some browsers are very inefficient when it comes to using plus to
 * concat strings. Be careful when using null and undefined here since
 * these will not be included in the result. If you need to represent these
 * be sure to cast the argument to a String first.
 * For example:
 * <pre>buildString('a', 'b', 'c', 'd') -> 'abcd'
 * buildString(null, undefined) -> ''
 * </pre>
 * @param var_args A list of strings to concatenate. If not a string,
 *     it will be casted to one.
 * @return.
 */
export function buildString(...var_args: any[]): string {
  return Array.prototype.join.call(arguments, '');
}

/**
 * Returns a string with at least 64-bits of randomness.
 *
 * Doesn't trust Javascript's random function entirely. Uses a combination of
 * random and current timestamp, and then encodes the string in base-36 to
 * make it shorter.
 *
 * @return A random string, e.g. sn1s7vb4gcic.
 */
export function getRandomString(): string {
  let x = 2147483648;
  return Math.floor(Math.random() * x).toString(36) +
      Math.abs(Math.floor(Math.random() * x) ^ goog.now()).toString(36);
}

/**
 * Compares two version numbers.
 *
 * @param version1 Version of first item.
 * @param version2 Version of second item.
 *
 * @return is higher.
 *                   0 if arguments are equal.
 *                  -1 if {@code version2} is higher.
 */
export function compareVersions(
    version1: string|number, version2: string|number): number {
  let order = 0;

  // Trim leading and trailing whitespace and split the versions into
  // subversions.
  let v1Subs = trim(String(version1)).split('.');
  let v2Subs = trim(String(version2)).split('.');
  let subCount = Math.max(v1Subs.length, v2Subs.length);

  // Iterate over the subversions, as long as they appear to be equivalent.
  for (let subIdx = 0; order == 0 && subIdx < subCount; subIdx++) {
    let v1Sub = v1Subs[subIdx] || '';
    let v2Sub = v2Subs[subIdx] || '';

    // Split the subversions into pairs of numbers and qualifiers (like 'b').
    // Two different RegExp objects are needed because they are both using
    // the 'g' flag.
    let v1CompParser = new RegExp('(\\d*)(\\D*)', 'g');
    let v2CompParser = new RegExp('(\\d*)(\\D*)', 'g');
    do {
      let v1Comp = v1CompParser.exec(v1Sub) || ['', '', ''];
      let v2Comp = v2CompParser.exec(v2Sub) || ['', '', ''];

      // Break if there are no more matches.
      if (v1Comp[0].length == 0 && v2Comp[0].length == 0) {
        break;
      }

      // Parse the numeric part of the subversion. A missing number is
      // equivalent to 0.
      let v1CompNum = v1Comp[1].length == 0 ? 0 : parseInt(v1Comp[1], 10);
      let v2CompNum = v2Comp[1].length == 0 ? 0 : parseInt(v2Comp[1], 10);

      // Compare the subversion components. The number has the highest
      // precedence. Next, if the numbers are equal, a subversion without any
      // qualifier is always higher than a subversion with any qualifier. Next,
      // the qualifiers are compared as strings.
      order = compareElements_(v1CompNum, v2CompNum) ||
          compareElements_(v1Comp[2].length == 0, v2Comp[2].length == 0) ||
          compareElements_(v1Comp[2], v2Comp[2]);
    } while (
        // Stop as soon as an inequality is discovered.
        order == 0);
  }
  return order;
}

/**
 * Compares elements of a version number.
 *
 * @param left An element from a version number.
 * @param right An element from a version number.
 *
 * @return is higher.
 *                   0 if arguments are equal.
 *                  -1 if {@code right} is higher.
 */
export function compareElements_(
    left: string|number|boolean, right: string|number|boolean): number {
  if (left < right) {
    return -1;
  } else {
    if (left > right) {
      return 1;
    }
  }
  return 0;
}

/**
 * Maximum value of #goog.string.hashCode, exclusive. 2^32.
 */
export const HASHCODE_MAX_: number = 4294967296;

/**
 * String hash function similar to java.lang.String.hashCode().
 * The hash code for a string is computed as
 * s[0] * 31 ^ (n - 1) + s[1] * 31 ^ (n - 2) + ... + s[n - 1],
 * where s[i] is the ith character of the string and n is the length of
 * the string. We mod the result to make it between 0 (inclusive) and 2^32
 * (exclusive).
 * @param str A string.
 * @return, between 0 (inclusive) and 2^32
 *  (exclusive). The empty string returns 0.
 */
export function hashCode(str: string): number {
  let result = 0;
  for (let i = 0; i < str.length; ++i) {
    result = 31 * result + str.charCodeAt(i);

    // Normalize to 4 byte range, 0 ... 2^32.
    result %= HASHCODE_MAX_;
  }
  return result;
}

/**
 * The most recent unique ID. |0 is equivalent to Math.floor in this case.
 */
export let uniqueStringCounter_: number = Math.random() * 2147483648 | 0;

/**
 * Generates and returns a string which is unique in the current document.
 * This is useful, for example, to create unique IDs for DOM elements.
 * @return A unique id.
 */
export function createUniqueString(): string {
  return 'goog_' + uniqueStringCounter_++;
}

/**
 * Converts the supplied string to a number, which may be Infinity or NaN.
 * This function strips whitespace: (toNumber(' 123') === 123)
 * This function accepts scientific notation: (toNumber('1e1') === 10)
 *
 * This is better than Javascript's built-in conversions because, sadly:
 *     (Number(' ') === 0) and (parseFloat('123a') === 123)
 *
 * @param str The string to convert.
 * @return The number the supplied string represents, or NaN.
 */
export function toNumber(str: string): number {
  let num = Number(str);
  if (num == 0 && isEmptyOrWhitespace(str)) {
    return NaN;
  }
  return num;
}

/**
 * Returns whether the given string is lower camel case (e.g. "isFooBar").
 *
 * Note that this assumes the string is entirely letters.
 * @see http://en.wikipedia.org/wiki/CamelCase#Variations_and_synonyms
 *
 * @param str String to test.
 * @return Whether the string is lower camel case.
 */
export function isLowerCamelCase(str: string): boolean {
  return /^[a-z]+([A-Z][a-z]*)*$/.test(str);
}

/**
 * Returns whether the given string is upper camel case (e.g. "FooBarBaz").
 *
 * Note that this assumes the string is entirely letters.
 * @see http://en.wikipedia.org/wiki/CamelCase#Variations_and_synonyms
 *
 * @param str String to test.
 * @return Whether the string is upper camel case.
 */
export function isUpperCamelCase(str: string): boolean {
  return /^([A-Z][a-z]*)+$/.test(str);
}

/**
 * Converts a string from selector-case to camelCase (e.g. from
 * "multi-part-string" to "multiPartString"), useful for converting
 * CSS selectors and HTML dataset keys to their equivalent JS properties.
 * @param str The string in selector-case form.
 * @return The string in camelCase form.
 */
export function toCamelCase(str: string): string {
  return String(str).replace(/\-([a-z])/g, function(all, match) {
    return match.toUpperCase();
  });
}

/**
 * Converts a string from camelCase to selector-case (e.g. from
 * "multiPartString" to "multi-part-string"), useful for converting JS
 * style and dataset properties to equivalent CSS selectors and HTML keys.
 * @param str The string in camelCase form.
 * @return The string in selector-case form.
 */
export function toSelectorCase(str: string): string {
  return String(str).replace(/([A-Z])/g, '-$1').toLowerCase();
}

/**
 * Converts a string into TitleCase. First character of the string is always
 * capitalized in addition to the first letter of every subsequent word.
 * Words are delimited by one or more whitespaces by default. Custom delimiters
 * can optionally be specified to replace the default, which doesn't preserve
 * whitespace delimiters and instead must be explicitly included if needed.
 *
 * Default delimiter => " ":
 *    goog.string.toTitleCase('oneTwoThree')    => 'OneTwoThree'
 *    goog.string.toTitleCase('one two three')  => 'One Two Three'
 *    goog.string.toTitleCase('  one   two   ') => '  One   Two   '
 *    goog.string.toTitleCase('one_two_three')  => 'One_two_three'
 *    goog.string.toTitleCase('one-two-three')  => 'One-two-three'
 *
 * Custom delimiter => "_-.":
 *    goog.string.toTitleCase('oneTwoThree', '_-.')       => 'OneTwoThree'
 *    goog.string.toTitleCase('one two three', '_-.')     => 'One two three'
 *    goog.string.toTitleCase('  one   two   ', '_-.')    => '  one   two   '
 *    goog.string.toTitleCase('one_two_three', '_-.')     => 'One_Two_Three'
 *    goog.string.toTitleCase('one-two-three', '_-.')     => 'One-Two-Three'
 *    goog.string.toTitleCase('one...two...three', '_-.') => 'One...Two...Three'
 *    goog.string.toTitleCase('one. two. three', '_-.')   => 'One. two. three'
 *    goog.string.toTitleCase('one-two.three', '_-.')     => 'One-Two.Three'
 *
 * @param str String value in camelCase form.
 * @param opt_delimiters Custom delimiter character set used to
 *      distinguish words in the string value. Each character represents a
 *      single delimiter. When provided, default whitespace delimiter is
 *      overridden and must be explicitly included if needed.
 * @return String value in TitleCase form.
 */
export function toTitleCase(str: string, opt_delimiters?: string): string {
  let delimiters =
      goog.isString(opt_delimiters) ? regExpEscape(opt_delimiters) : '\\s';

  // For IE8, we need to prevent using an empty character set. Otherwise,
  // incorrect matching will occur.
  delimiters = delimiters ? '|[' + delimiters + ']+' : '';
  let regexp = new RegExp('(^' + delimiters + ')([a-z])', 'g');
  return str.replace(regexp, function(all, p1, p2) {
    return p1 + p2.toUpperCase();
  });
}

/**
 * Capitalizes a string, i.e. converts the first letter to uppercase
 * and all other letters to lowercase, e.g.:
 *
 * goog.string.capitalize('one')     => 'One'
 * goog.string.capitalize('ONE')     => 'One'
 * goog.string.capitalize('one two') => 'One two'
 *
 * Note that this function does not trim initial whitespace.
 *
 * @param str String value to capitalize.
 * @return String value with first letter in uppercase.
 */
export function capitalize(str: string): string {
  return String(str.charAt(0)).toUpperCase() +
      String(str.substr(1)).toLowerCase();
}

/**
 * Parse a string in decimal or hexidecimal ('0xFFFF') form.
 *
 * To parse a particular radix, please use parseInt(string, radix) directly. See
 * https://developer.mozilla.org/en/JavaScript/Reference/Global_Objects/parseInt
 *
 * This is a wrapper for the built-in parseInt function that will only parse
 * numbers as base 10 or base 16.  Some JS implementations assume strings
 * starting with "0" are intended to be octal. ES3 allowed but discouraged
 * this behavior. ES5 forbids it.  This function emulates the ES5 behavior.
 *
 * For more information, see Mozilla JS Reference: http://goo.gl/8RiFj
 *
 * @param value The value to be parsed.
 * @return The number, parsed. If the string failed to parse, this
 *     will be NaN.
 */
export function parseInt(value: string|number|null|undefined): number {
  // Force finite numbers to strings.
  if (isFinite(value)) {
    value = String(value);
  }
  if (goog.isString(value)) {
    // If the string starts with '0x' or '-0x', parse as hex.
    return /^\s*-?0x/i.test(value) ? parseInt(value, 16) : parseInt(value, 10);
  }
  return NaN;
}

/**
 * Splits a string on a separator a limited number of times.
 *
 * This implementation is more similar to Python or Java, where the limit
 * parameter specifies the maximum number of splits rather than truncating
 * the number of results.
 *
 * See http://docs.python.org/2/library/stdtypes.html#str.split
 * See JavaDoc: http://goo.gl/F2AsY
 * See Mozilla reference: http://goo.gl/dZdZs
 *
 * @param str String to split.
 * @param separator The separator.
 * @param limit The limit to the number of splits. The resulting array
 *     will have a maximum length of limit+1.  Negative numbers are the same
 *     as zero.
 * @return The string, split.
 */
export function splitLimit(
    str: string, separator: string, limit: number): string[] {
  let parts = str.split(separator);
  let returnVal = [];

  // Only continue doing this while we haven't hit the limit and we have
  // parts left.
  while (limit > 0 && parts.length) {
    returnVal.push(parts.shift());
    limit--;
  }

  // If there are remaining parts, append them to the end.
  if (parts.length) {
    returnVal.push(parts.join(separator));
  }
  return returnVal;
}

/**
 * Computes the Levenshtein edit distance between two strings.
 * @return The edit distance between the two strings.
 */
export function editDistance(a: string, b: string): number {
  let v0 = [];
  let v1 = [];
  if (a == b) {
    return 0;
  }
  if (!a.length || !b.length) {
    return Math.max(a.length, b.length);
  }
  for (let i = 0; i < b.length + 1; i++) {
    v0[i] = i;
  }
  for (let i = 0; i < a.length; i++) {
    v1[0] = i + 1;
    for (let j = 0; j < b.length; j++) {
      let cost = a[i] != b[j];

      // Cost for the substring is the minimum of adding one character, removing
      // one character, or a swap.
      v1[j + 1] = Math.min(v1[j] + 1, v0[j + 1] + 1, v0[j] + cost);
    }
    for (let j = 0; j < v0.length; j++) {
      v0[j] = v1[j];
    }
  }
  return v1[b.length];
}
