/*
 * Copyright 2015 Vivliostyle Inc.
 */

window.MathJax = {
    showProcessingMessages: false,
    messageStyle: "none",
    skipStartupTypeset: true,
    CommonHTML: {
        scale: 90,
        linebreaks: {
            automatic: true
        },
        styles: {
            ".MJXc-display": {
                margin: "0"
            }
        }
    },
    "fast-preview": {
        disabled: true
    },
    AuthorInit: function() {
        MathJax.Hub.processSectionDelay = 0;
    }
};
