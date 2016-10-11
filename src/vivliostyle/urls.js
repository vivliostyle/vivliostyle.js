/**
 * Copyright 2015 Vivliostyle Inc.
 * @fileoverview URL Utilities
 */
goog.provide("vivliostyle.urls");

/**
 * transform all urls in attributeValue using documentURLTransformer.
 *
 * @param {String} attributeValue
 * @param {String} baseUrl
 * @param {adapt.base.DocumentURLTransformer} documentURLTransformer
 * @returns {String} transformed attributeValue
 */
vivliostyle.urls.transformURIs = function(attributeValue, baaseUrl, documentURLTransformer) {
    return attributeValue.replace(/[uU][rR][lL]\(\s*\"([^\"]+)\"\s*\)/gm, function(match, m1){
        return 'url("' + documentURLTransformer.transformURL(m1, baaseUrl)+ '")';
    }).replace(/[uU][rR][lL]\(\s*\'([^\']+)\'\s*\)/gm, function(match, m1){
        return "url('" + documentURLTransformer.transformURL(m1, baaseUrl)+ "')";
    }).replace(/[uU][rR][lL]\(\s*([^\"\'\)]+)\s*\)/gm, function(match, m1){
        return "url(" + documentURLTransformer.transformURL(m1, baaseUrl)+ ")";
    });
};
