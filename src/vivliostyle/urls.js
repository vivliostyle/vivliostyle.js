/**
 * Copyright 2015 Vivliostyle Inc.
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
vivliostyle.urls.transformURIs = function(attributeValue, baseUrl, documentURLTransformer) {
    return attributeValue.replace(/[uU][rR][lL]\(\s*\"((\\([^0-9a-fA-F]+|[0-9a-fA-F]+\s*)|[^\"\r\n])+)\"/gm, function(match, m1) {
        return 'url("' + documentURLTransformer.transformURL(m1, baseUrl)+ '"';
    }).replace(/[uU][rR][lL]\(\s*\'((\\([^0-9a-fA-F]+|[0-9a-fA-F]+\s*)|[^\'\r\n])+)\'/gm, function(match, m1) {
        return "url('" + documentURLTransformer.transformURL(m1, baseUrl)+ "'";
    }).replace(/[uU][rR][lL]\(\s*((\\([^0-9a-fA-F]+|[0-9a-fA-F]+\s*)|[^\"\'\r\n\)\s])+)/gm, function(match, m1) {
        return "url(" + documentURLTransformer.transformURL(m1, baseUrl);
    });
};
