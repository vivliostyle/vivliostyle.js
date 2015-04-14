/**
 * Copyright 2013 Google, Inc.
 * @fileoverview Calculate SHA1 hash of the given content.
 */
goog.provide("adapt.sha1");

goog.require("adapt.base");

/**
 * @param {number} n
 * @return {string} big-endian byte sequence
 */
adapt.sha1.encode32 = function(n) {
	return String.fromCharCode((n >>> 24)&0xFF, (n >>> 16)&0xFF, (n >>> 8)&0xFF, n&0xFF);
};

/**
 * @param {string} bytes big-endian byte sequence
 * @return {number}
 */
adapt.sha1.decode32 = function(bytes) {
	// Important facts: "".charCodeAt(0) == NaN, NaN & 0xFF == 0
	var b0 = bytes.charCodeAt(0) & 0xFF;
	var b1 = bytes.charCodeAt(1) & 0xFF;
	var b2 = bytes.charCodeAt(2) & 0xFF;
	var b3 = bytes.charCodeAt(3) & 0xFF;
	return (b0 << 24) | (b1 << 16) | (b2 << 8) | b3;
};

/**
 * @param {string} bytes chars with codes 0 - 255 that represent message byte values
 * @return {Array.<number>} big-endian uint32 numbers representing sha1 hash
 */
adapt.sha1.bytesToSHA1Int32 = function(bytes) {
	var sb = new adapt.base.StringBuffer();
	sb.append(bytes);
	var appendCount = (55 - bytes.length) & 63;
	sb.append('\u0080');
	while (appendCount > 0) {
		appendCount--;
		sb.append('\0');
	}
	sb.append('\0\0\0\0');
	sb.append(adapt.sha1.encode32(bytes.length*8));
	bytes = sb.toString();
	
	var h = [0x67452301, 0xEFCDAB89, 0x98BADCFE, 0x10325476, 0xC3D2E1F0];
	
	var w = /** @type Array.<number> */ ([]);
	var i;
	
	for (var bi = 0; bi < bytes.length; bi += 64) {	
		for (i = 0; i < 16; i++) {
			w[i] = adapt.sha1.decode32(bytes.substr(bi + 4*i, 4));
		}
	    for ( ; i < 80; i++) {
	    	var q = w[i-3] ^ w[i-8] ^ w[i-14] ^ w[i-16];
	        w[i] = (q << 1) | (q >>> 31);
	    }
	    
	    var a = h[0];
	    var b = h[1];
	    var c = h[2];
	    var d = h[3];
	    var e = h[4];
	    var f;

	    for (i = 0; i < 80; i++) {
	        if (i < 20) {
	            f = ((b & c) | (~b & d)) + 0x5A827999;
	        } else if (i < 40) {
	            f = (b ^ c ^ d) + 0x6ED9EBA1;
	        } else if (i < 60) {
	            f = ((b & c) | (b & d) | (c & d)) + 0x8F1BBCDC;
	        } else {
	            f = (b ^ c ^ d) + 0xCA62C1D6;
	        }
	        
	        f += ((a << 5) | (a >>> 27)) + e + w[i];
	        e = d;
	        d = c;
	        c = (b << 30) | (b >>> 2);
	        b = a;
	        a = f;
	    }
	    
	    h[0] = (h[0] + a) | 0;
	    h[1] = (h[1] + b) | 0;
	    h[2] = (h[2] + c) | 0;
	    h[3] = (h[3] + d) | 0;
	    h[4] = (h[4] + e) | 0;
    }
	
	return h;
};

/**
 * @param {string} bytes chars with codes 0 - 255 that represent message byte values
 * @return {Array.<number>} uint8 numbers representing sha1 hash
 */
adapt.sha1.bytesToSHA1Int8 = function(bytes) {
	var h = adapt.sha1.bytesToSHA1Int32(bytes);	
	var res = [];
	for (var i = 0; i < h.length; i++) {
		var n = h[i];
		res.push((n >>> 24)&0xFF, (n >>> 16)&0xFF, (n >>> 8)&0xFF, n&0xFF);
	}
	return res;
};

/**
 * @param {string} bytes chars with codes 0 - 255 that represent message byte values
 * @return {string} chars with codes 0 - 255 equal to SHA1 hash of the input
 */
adapt.sha1.bytesToSHA1Bytes = function(bytes) {
	var h = adapt.sha1.bytesToSHA1Int32(bytes);	
	var sb = new adapt.base.StringBuffer();
	for (var i = 0; i < h.length; i++) {
		sb.append(adapt.sha1.encode32(h[i]));
	}
	return sb.toString();
};

/**
 * @param {string} bytes chars with codes 0 - 255 that represent message byte values
 * @return {string} hex-encoded SHA1 hash
 */
adapt.sha1.bytesToSHA1Hex = function(bytes) {
	var sha1 = adapt.sha1.bytesToSHA1Bytes(bytes);	
	var sb = new adapt.base.StringBuffer();
	for (var i = 0; i < sha1.length; i++) {
		sb.append((sha1.charCodeAt(i)|0x100).toString(16).substr(1));
	}
	return sb.toString();
};

/**
 * @param {string} bytes chars with codes 0 - 255 that represent message byte values
 * @return {string} base64-encoded SHA1 hash of the input
 */
adapt.sha1.bytesToSHA1Base64 = function(bytes) {
	var sha1 = adapt.sha1.bytesToSHA1Bytes(bytes);
	var sb = new adapt.base.StringBuffer();
	adapt.base.appendBase64(sb, sha1);
	return sb.toString();
};
