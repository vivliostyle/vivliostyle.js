/**
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
 * @fileoverview URL Utilities
 */
goog.provide("vivliostyle.urls");

/**
 * transform all urls in attributeValue using documentURLTransformer.
 *
 * @param {string} attributeValue
 * @param {string} baseUrl
 * @param {adapt.base.DocumentURLTransformer} documentURLTransformer
 * @returns {string} transformed attributeValue
 */
vivliostyle.urls.transformURIs = (attributeValue, baseUrl, documentURLTransformer) => attributeValue.replace(/[uU][rR][lL]\(\s*\"((\\([^0-9a-fA-F]+|[0-9a-fA-F]+\s*)|[^\"\r\n])+)\"/gm, (match, m1) => `url("${documentURLTransformer.transformURL(m1, baseUrl)}"`).replace(/[uU][rR][lL]\(\s*\'((\\([^0-9a-fA-F]+|[0-9a-fA-F]+\s*)|[^\'\r\n])+)\'/gm, (match, m1) => `url('${documentURLTransformer.transformURL(m1, baseUrl)}'`).replace(/[uU][rR][lL]\(\s*((\\([^0-9a-fA-F]+|[0-9a-fA-F]+\s*)|[^\"\'\r\n\)\s])+)/gm, (match, m1) => `url(${documentURLTransformer.transformURL(m1, baseUrl)}`);
