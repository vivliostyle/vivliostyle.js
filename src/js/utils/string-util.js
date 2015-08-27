export default {
    escapeUnicodeChar: function(ch) {
        return '\\u' + (0x10000|ch.charCodeAt(0)).toString(16).substring(1);
    },
    escapeUnicodeString: function(str) {
        return str.replace(/[^-a-zA-Z0-9_]/g, this.escapeUnicodeChar);
    }
};
