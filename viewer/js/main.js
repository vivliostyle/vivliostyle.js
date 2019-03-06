(function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){
/*!
 * Knockout JavaScript library v3.5.0
 * (c) The Knockout.js team - http://knockoutjs.com/
 * License: MIT (http://www.opensource.org/licenses/mit-license.php)
 */

(function() {(function(p){var z=this||(0,eval)("this"),w=z.document,R=z.navigator,v=z.jQuery,H=z.JSON;v||"undefined"===typeof jQuery||(v=jQuery);(function(p){"function"===typeof define&&define.amd?define(["exports","require"],p):"object"===typeof exports&&"object"===typeof module?p(module.exports||exports):p(z.ko={})})(function(S,T){function K(a,c){return null===a||typeof a in W?a===c:!1}function X(b,c){var d;return function(){d||(d=a.a.setTimeout(function(){d=p;b()},c))}}function Y(b,c){var d;return function(){clearTimeout(d);
d=a.a.setTimeout(b,c)}}function Z(a,c){c&&"change"!==c?"beforeChange"===c?this.oc(a):this.bb(a,c):this.pc(a)}function aa(a,c){null!==c&&c.s&&c.s()}function ba(a,c){var d=this.pd,e=d[t];e.qa||(this.Pb&&this.kb[c]?(d.tc(c,a,this.kb[c]),this.kb[c]=null,--this.Pb):e.F[c]||d.tc(c,a,e.G?{da:a}:d.Zc(a)),a.Ka&&a.fd())}var a="undefined"!==typeof S?S:{};a.b=function(b,c){for(var d=b.split("."),e=a,f=0;f<d.length-1;f++)e=e[d[f]];e[d[d.length-1]]=c};a.J=function(a,c,d){a[c]=d};a.version="3.5.0";a.b("version",
a.version);a.options={deferUpdates:!1,useOnlyNativeEvents:!1,foreachHidesDestroyed:!1};a.a=function(){function b(a,b){for(var c in a)f.call(a,c)&&b(c,a[c])}function c(a,b){if(b)for(var c in b)f.call(b,c)&&(a[c]=b[c]);return a}function d(a,b){a.__proto__=b;return a}function e(b,c,d,e){var k=b[c].match(n)||[];a.a.C(d.match(n),function(b){a.a.Oa(k,b,e)});b[c]=k.join(" ")}var f=Object.prototype.hasOwnProperty,g={__proto__:[]}instanceof Array,h="function"===typeof Symbol,m={},l={};m[R&&/Firefox\/2/i.test(R.userAgent)?
"KeyboardEvent":"UIEvents"]=["keyup","keydown","keypress"];m.MouseEvents="click dblclick mousedown mouseup mousemove mouseover mouseout mouseenter mouseleave".split(" ");b(m,function(a,b){if(b.length)for(var c=0,d=b.length;c<d;c++)l[b[c]]=a});var k={propertychange:!0},q=w&&function(){for(var a=3,b=w.createElement("div"),c=b.getElementsByTagName("i");b.innerHTML="\x3c!--[if gt IE "+ ++a+"]><i></i><![endif]--\x3e",c[0];);return 4<a?a:p}(),n=/\S+/g,r;return{Ic:["authenticity_token",/^__RequestVerificationToken(_.*)?$/],
C:function(a,b,c){for(var d=0,e=a.length;d<e;d++)b.call(c,a[d],d,a)},A:"function"==typeof Array.prototype.indexOf?function(a,b){return Array.prototype.indexOf.call(a,b)}:function(a,b){for(var c=0,d=a.length;c<d;c++)if(a[c]===b)return c;return-1},Lb:function(a,b,c){for(var d=0,e=a.length;d<e;d++)if(b.call(c,a[d],d,a))return a[d];return p},hb:function(b,c){var d=a.a.A(b,c);0<d?b.splice(d,1):0===d&&b.shift()},vc:function(b){var c=[];b&&a.a.C(b,function(b){0>a.a.A(c,b)&&c.push(b)});return c},Mb:function(a,
b,c){var d=[];if(a)for(var e=0,k=a.length;e<k;e++)d.push(b.call(c,a[e],e));return d},fb:function(a,b,c){var d=[];if(a)for(var e=0,k=a.length;e<k;e++)b.call(c,a[e],e)&&d.push(a[e]);return d},gb:function(a,b){if(b instanceof Array)a.push.apply(a,b);else for(var c=0,d=b.length;c<d;c++)a.push(b[c]);return a},Oa:function(b,c,d){var e=a.a.A(a.a.$b(b),c);0>e?d&&b.push(c):d||b.splice(e,1)},Ba:g,extend:c,setPrototypeOf:d,zb:g?d:c,O:b,Ha:function(a,b,c){if(!a)return a;var d={},e;for(e in a)f.call(a,e)&&(d[e]=
b.call(c,a[e],e,a));return d},Sb:function(b){for(;b.firstChild;)a.removeNode(b.firstChild)},Xb:function(b){b=a.a.la(b);for(var c=(b[0]&&b[0].ownerDocument||w).createElement("div"),d=0,e=b.length;d<e;d++)c.appendChild(a.na(b[d]));return c},Ca:function(b,c){for(var d=0,e=b.length,k=[];d<e;d++){var f=b[d].cloneNode(!0);k.push(c?a.na(f):f)}return k},ua:function(b,c){a.a.Sb(b);if(c)for(var d=0,e=c.length;d<e;d++)b.appendChild(c[d])},Wc:function(b,c){var d=b.nodeType?[b]:b;if(0<d.length){for(var e=d[0],
k=e.parentNode,f=0,l=c.length;f<l;f++)k.insertBefore(c[f],e);f=0;for(l=d.length;f<l;f++)a.removeNode(d[f])}},Ua:function(a,b){if(a.length){for(b=8===b.nodeType&&b.parentNode||b;a.length&&a[0].parentNode!==b;)a.splice(0,1);for(;1<a.length&&a[a.length-1].parentNode!==b;)a.length--;if(1<a.length){var c=a[0],d=a[a.length-1];for(a.length=0;c!==d;)a.push(c),c=c.nextSibling;a.push(d)}}return a},Yc:function(a,b){7>q?a.setAttribute("selected",b):a.selected=b},Cb:function(a){return null===a||a===p?"":a.trim?
a.trim():a.toString().replace(/^[\s\xa0]+|[\s\xa0]+$/g,"")},Td:function(a,b){a=a||"";return b.length>a.length?!1:a.substring(0,b.length)===b},ud:function(a,b){if(a===b)return!0;if(11===a.nodeType)return!1;if(b.contains)return b.contains(1!==a.nodeType?a.parentNode:a);if(b.compareDocumentPosition)return 16==(b.compareDocumentPosition(a)&16);for(;a&&a!=b;)a=a.parentNode;return!!a},Rb:function(b){return a.a.ud(b,b.ownerDocument.documentElement)},jd:function(b){return!!a.a.Lb(b,a.a.Rb)},P:function(a){return a&&
a.tagName&&a.tagName.toLowerCase()},zc:function(b){return a.onError?function(){try{return b.apply(this,arguments)}catch(c){throw a.onError&&a.onError(c),c;}}:b},setTimeout:function(b,c){return setTimeout(a.a.zc(b),c)},Fc:function(b){setTimeout(function(){a.onError&&a.onError(b);throw b;},0)},H:function(b,c,d){var e=a.a.zc(d);d=k[c];if(a.options.useOnlyNativeEvents||d||!v)if(d||"function"!=typeof b.addEventListener)if("undefined"!=typeof b.attachEvent){var f=function(a){e.call(b,a)},l="on"+c;b.attachEvent(l,
f);a.a.I.za(b,function(){b.detachEvent(l,f)})}else throw Error("Browser doesn't support addEventListener or attachEvent");else b.addEventListener(c,e,!1);else r||(r="function"==typeof v(b).on?"on":"bind"),v(b)[r](c,e)},Fb:function(b,c){if(!b||!b.nodeType)throw Error("element must be a DOM node when calling triggerEvent");var d;"input"===a.a.P(b)&&b.type&&"click"==c.toLowerCase()?(d=b.type,d="checkbox"==d||"radio"==d):d=!1;if(a.options.useOnlyNativeEvents||!v||d)if("function"==typeof w.createEvent)if("function"==
typeof b.dispatchEvent)d=w.createEvent(l[c]||"HTMLEvents"),d.initEvent(c,!0,!0,z,0,0,0,0,0,!1,!1,!1,!1,0,b),b.dispatchEvent(d);else throw Error("The supplied element doesn't support dispatchEvent");else if(d&&b.click)b.click();else if("undefined"!=typeof b.fireEvent)b.fireEvent("on"+c);else throw Error("Browser doesn't support triggering events");else v(b).trigger(c)},c:function(b){return a.N(b)?b():b},$b:function(b){return a.N(b)?b.w():b},Eb:function(b,c,d){var k;c&&("object"===typeof b.classList?
(k=b.classList[d?"add":"remove"],a.a.C(c.match(n),function(a){k.call(b.classList,a)})):"string"===typeof b.className.baseVal?e(b.className,"baseVal",c,d):e(b,"className",c,d))},Ab:function(b,c){var d=a.a.c(c);if(null===d||d===p)d="";var e=a.h.firstChild(b);!e||3!=e.nodeType||a.h.nextSibling(e)?a.h.ua(b,[b.ownerDocument.createTextNode(d)]):e.data=d;a.a.zd(b)},Xc:function(a,b){a.name=b;if(7>=q)try{var c=a.name.replace(/[&<>'"]/g,function(a){return"&#"+a.charCodeAt(0)+";"});a.mergeAttributes(w.createElement("<input name='"+
c+"'/>"),!1)}catch(d){}},zd:function(a){9<=q&&(a=1==a.nodeType?a:a.parentNode,a.style&&(a.style.zoom=a.style.zoom))},vd:function(a){if(q){var b=a.style.width;a.style.width=0;a.style.width=b}},Od:function(b,c){b=a.a.c(b);c=a.a.c(c);for(var d=[],e=b;e<=c;e++)d.push(e);return d},la:function(a){for(var b=[],c=0,d=a.length;c<d;c++)b.push(a[c]);return b},Da:function(a){return h?Symbol(a):a},Xd:6===q,Yd:7===q,W:q,Kc:function(b,c){for(var d=a.a.la(b.getElementsByTagName("input")).concat(a.a.la(b.getElementsByTagName("textarea"))),
e="string"==typeof c?function(a){return a.name===c}:function(a){return c.test(a.name)},k=[],f=d.length-1;0<=f;f--)e(d[f])&&k.push(d[f]);return k},Md:function(b){return"string"==typeof b&&(b=a.a.Cb(b))?H&&H.parse?H.parse(b):(new Function("return "+b))():null},fc:function(b,c,d){if(!H||!H.stringify)throw Error("Cannot find JSON.stringify(). Some browsers (e.g., IE < 8) don't support it natively, but you can overcome this by adding a script reference to json2.js, downloadable from http://www.json.org/json2.js");
return H.stringify(a.a.c(b),c,d)},Nd:function(c,d,e){e=e||{};var k=e.params||{},f=e.includeFields||this.Ic,l=c;if("object"==typeof c&&"form"===a.a.P(c))for(var l=c.action,h=f.length-1;0<=h;h--)for(var g=a.a.Kc(c,f[h]),m=g.length-1;0<=m;m--)k[g[m].name]=g[m].value;d=a.a.c(d);var n=w.createElement("form");n.style.display="none";n.action=l;n.method="post";for(var q in d)c=w.createElement("input"),c.type="hidden",c.name=q,c.value=a.a.fc(a.a.c(d[q])),n.appendChild(c);b(k,function(a,b){var c=w.createElement("input");
c.type="hidden";c.name=a;c.value=b;n.appendChild(c)});w.body.appendChild(n);e.submitter?e.submitter(n):n.submit();setTimeout(function(){n.parentNode.removeChild(n)},0)}}}();a.b("utils",a.a);a.b("utils.arrayForEach",a.a.C);a.b("utils.arrayFirst",a.a.Lb);a.b("utils.arrayFilter",a.a.fb);a.b("utils.arrayGetDistinctValues",a.a.vc);a.b("utils.arrayIndexOf",a.a.A);a.b("utils.arrayMap",a.a.Mb);a.b("utils.arrayPushAll",a.a.gb);a.b("utils.arrayRemoveItem",a.a.hb);a.b("utils.cloneNodes",a.a.Ca);a.b("utils.createSymbolOrString",
a.a.Da);a.b("utils.extend",a.a.extend);a.b("utils.fieldsIncludedWithJsonPost",a.a.Ic);a.b("utils.getFormFields",a.a.Kc);a.b("utils.objectMap",a.a.Ha);a.b("utils.peekObservable",a.a.$b);a.b("utils.postJson",a.a.Nd);a.b("utils.parseJson",a.a.Md);a.b("utils.registerEventHandler",a.a.H);a.b("utils.stringifyJson",a.a.fc);a.b("utils.range",a.a.Od);a.b("utils.toggleDomNodeCssClass",a.a.Eb);a.b("utils.triggerEvent",a.a.Fb);a.b("utils.unwrapObservable",a.a.c);a.b("utils.objectForEach",a.a.O);a.b("utils.addOrRemoveItem",
a.a.Oa);a.b("utils.setTextContent",a.a.Ab);a.b("unwrap",a.a.c);Function.prototype.bind||(Function.prototype.bind=function(a){var c=this;if(1===arguments.length)return function(){return c.apply(a,arguments)};var d=Array.prototype.slice.call(arguments,1);return function(){var e=d.slice(0);e.push.apply(e,arguments);return c.apply(a,e)}});a.a.g=new function(){var b=0,c="__ko__"+(new Date).getTime(),d={},e,f;a.a.W?(e=function(a,e){var f=a[c];if(!f||"null"===f||!d[f]){if(!e)return p;f=a[c]="ko"+b++;d[f]=
{}}return d[f]},f=function(a){var b=a[c];return b?(delete d[b],a[c]=null,!0):!1}):(e=function(a,b){var d=a[c];!d&&b&&(d=a[c]={});return d},f=function(a){return a[c]?(delete a[c],!0):!1});return{get:function(a,b){var c=e(a,!1);return c&&c[b]},set:function(a,b,c){(a=e(a,c!==p))&&(a[b]=c)},Tb:function(a,b,c){a=e(a,!0);return a[b]||(a[b]=c)},clear:f,Z:function(){return b++ +c}}};a.b("utils.domData",a.a.g);a.b("utils.domData.clear",a.a.g.clear);a.a.I=new function(){function b(b,c){var d=a.a.g.get(b,e);
d===p&&c&&(d=[],a.a.g.set(b,e,d));return d}function c(c){var e=b(c,!1);if(e)for(var e=e.slice(0),f=0;f<e.length;f++)e[f](c);a.a.g.clear(c);a.a.I.cleanExternalData(c);g[c.nodeType]&&d(c.childNodes,!0)}function d(b,d){for(var e=[],k,f=0;f<b.length;f++)if(!d||8===b[f].nodeType)if(c(e[e.length]=k=b[f]),b[f]!==k)for(;f--&&-1==a.a.A(e,b[f]););}var e=a.a.g.Z(),f={1:!0,8:!0,9:!0},g={1:!0,9:!0};return{za:function(a,c){if("function"!=typeof c)throw Error("Callback must be a function");b(a,!0).push(c)},xb:function(c,
d){var f=b(c,!1);f&&(a.a.hb(f,d),0==f.length&&a.a.g.set(c,e,p))},na:function(a){f[a.nodeType]&&(c(a),g[a.nodeType]&&d(a.getElementsByTagName("*")));return a},removeNode:function(b){a.na(b);b.parentNode&&b.parentNode.removeChild(b)},cleanExternalData:function(a){v&&"function"==typeof v.cleanData&&v.cleanData([a])}}};a.na=a.a.I.na;a.removeNode=a.a.I.removeNode;a.b("cleanNode",a.na);a.b("removeNode",a.removeNode);a.b("utils.domNodeDisposal",a.a.I);a.b("utils.domNodeDisposal.addDisposeCallback",a.a.I.za);
a.b("utils.domNodeDisposal.removeDisposeCallback",a.a.I.xb);(function(){var b=[0,"",""],c=[1,"<table>","</table>"],d=[3,"<table><tbody><tr>","</tr></tbody></table>"],e=[1,"<select multiple='multiple'>","</select>"],f={thead:c,tbody:c,tfoot:c,tr:[2,"<table><tbody>","</tbody></table>"],td:d,th:d,option:e,optgroup:e},g=8>=a.a.W;a.a.ta=function(c,d){var e;if(v)if(v.parseHTML)e=v.parseHTML(c,d)||[];else{if((e=v.clean([c],d))&&e[0]){for(var k=e[0];k.parentNode&&11!==k.parentNode.nodeType;)k=k.parentNode;
k.parentNode&&k.parentNode.removeChild(k)}}else{(e=d)||(e=w);var k=e.parentWindow||e.defaultView||z,q=a.a.Cb(c).toLowerCase(),n=e.createElement("div"),r;r=(q=q.match(/^(?:\x3c!--.*?--\x3e\s*?)*?<([a-z]+)[\s>]/))&&f[q[1]]||b;q=r[0];r="ignored<div>"+r[1]+c+r[2]+"</div>";"function"==typeof k.innerShiv?n.appendChild(k.innerShiv(r)):(g&&e.body.appendChild(n),n.innerHTML=r,g&&n.parentNode.removeChild(n));for(;q--;)n=n.lastChild;e=a.a.la(n.lastChild.childNodes)}return e};a.a.Ld=function(b,c){var d=a.a.ta(b,
c);return d.length&&d[0].parentElement||a.a.Xb(d)};a.a.dc=function(b,c){a.a.Sb(b);c=a.a.c(c);if(null!==c&&c!==p)if("string"!=typeof c&&(c=c.toString()),v)v(b).html(c);else for(var d=a.a.ta(c,b.ownerDocument),e=0;e<d.length;e++)b.appendChild(d[e])}})();a.b("utils.parseHtmlFragment",a.a.ta);a.b("utils.setHtml",a.a.dc);a.aa=function(){function b(c,e){if(c)if(8==c.nodeType){var f=a.aa.Tc(c.nodeValue);null!=f&&e.push({sd:c,Jd:f})}else if(1==c.nodeType)for(var f=0,g=c.childNodes,h=g.length;f<h;f++)b(g[f],
e)}var c={};return{Wb:function(a){if("function"!=typeof a)throw Error("You can only pass a function to ko.memoization.memoize()");var b=(4294967296*(1+Math.random())|0).toString(16).substring(1)+(4294967296*(1+Math.random())|0).toString(16).substring(1);c[b]=a;return"\x3c!--[ko_memo:"+b+"]--\x3e"},ad:function(a,b){var f=c[a];if(f===p)throw Error("Couldn't find any memo with ID "+a+". Perhaps it's already been unmemoized.");try{return f.apply(null,b||[]),!0}finally{delete c[a]}},bd:function(c,e){var f=
[];b(c,f);for(var g=0,h=f.length;g<h;g++){var m=f[g].sd,l=[m];e&&a.a.gb(l,e);a.aa.ad(f[g].Jd,l);m.nodeValue="";m.parentNode&&m.parentNode.removeChild(m)}},Tc:function(a){return(a=a.match(/^\[ko_memo\:(.*?)\]$/))?a[1]:null}}}();a.b("memoization",a.aa);a.b("memoization.memoize",a.aa.Wb);a.b("memoization.unmemoize",a.aa.ad);a.b("memoization.parseMemoText",a.aa.Tc);a.b("memoization.unmemoizeDomNodeAndDescendants",a.aa.bd);a.ma=function(){function b(){if(f)for(var b=f,c=0,d;h<f;)if(d=e[h++]){if(h>b){if(5E3<=
++c){h=f;a.a.Fc(Error("'Too much recursion' after processing "+c+" task groups."));break}b=f}try{d()}catch(g){a.a.Fc(g)}}}function c(){b();h=f=e.length=0}var d,e=[],f=0,g=1,h=0;z.MutationObserver?d=function(a){var b=w.createElement("div");(new MutationObserver(a)).observe(b,{attributes:!0});return function(){b.classList.toggle("foo")}}(c):d=w&&"onreadystatechange"in w.createElement("script")?function(a){var b=w.createElement("script");b.onreadystatechange=function(){b.onreadystatechange=null;w.documentElement.removeChild(b);
b=null;a()};w.documentElement.appendChild(b)}:function(a){setTimeout(a,0)};return{scheduler:d,yb:function(b){f||a.ma.scheduler(c);e[f++]=b;return g++},cancel:function(a){a=a-(g-f);a>=h&&a<f&&(e[a]=null)},resetForTesting:function(){var a=f-h;h=f=e.length=0;return a},Rd:b}}();a.b("tasks",a.ma);a.b("tasks.schedule",a.ma.yb);a.b("tasks.runEarly",a.ma.Rd);a.Ta={throttle:function(b,c){b.throttleEvaluation=c;var d=null;return a.$({read:b,write:function(e){clearTimeout(d);d=a.a.setTimeout(function(){b(e)},
c)}})},rateLimit:function(a,c){var d,e,f;"number"==typeof c?d=c:(d=c.timeout,e=c.method);a.Hb=!1;f="function"==typeof e?e:"notifyWhenChangesStop"==e?Y:X;a.tb(function(a){return f(a,d,c)})},deferred:function(b,c){if(!0!==c)throw Error("The 'deferred' extender only accepts the value 'true', because it is not supported to turn deferral off once enabled.");b.Hb||(b.Hb=!0,b.tb(function(c){var e,f=!1;return function(){if(!f){a.ma.cancel(e);e=a.ma.yb(c);try{f=!0,b.notifySubscribers(p,"dirty")}finally{f=
!1}}}}))},notify:function(a,c){a.equalityComparer="always"==c?null:K}};var W={undefined:1,"boolean":1,number:1,string:1};a.b("extenders",a.Ta);a.gc=function(b,c,d){this.da=b;this.kc=c;this.lc=d;this.Ib=!1;this.ab=this.Jb=null;a.J(this,"dispose",this.s);a.J(this,"disposeWhenNodeIsRemoved",this.l)};a.gc.prototype.s=function(){this.Ib||(this.ab&&a.a.I.xb(this.Jb,this.ab),this.Ib=!0,this.lc(),this.da=this.kc=this.lc=this.Jb=this.ab=null)};a.gc.prototype.l=function(b){this.Jb=b;a.a.I.za(b,this.ab=this.s.bind(this))};
a.R=function(){a.a.zb(this,D);D.ob(this)};var D={ob:function(a){a.S={change:[]};a.rc=1},subscribe:function(b,c,d){var e=this;d=d||"change";var f=new a.gc(e,c?b.bind(c):b,function(){a.a.hb(e.S[d],f);e.cb&&e.cb(d)});e.Qa&&e.Qa(d);e.S[d]||(e.S[d]=[]);e.S[d].push(f);return f},notifySubscribers:function(b,c){c=c||"change";"change"===c&&this.Gb();if(this.Wa(c)){var d="change"===c&&this.dd||this.S[c].slice(0);try{a.v.wc();for(var e=0,f;f=d[e];++e)f.Ib||f.kc(b)}finally{a.v.end()}}},mb:function(){return this.rc},
Cd:function(a){return this.mb()!==a},Gb:function(){++this.rc},tb:function(b){var c=this,d=a.N(c),e,f,g,h,m;c.bb||(c.bb=c.notifySubscribers,c.notifySubscribers=Z);var l=b(function(){c.Ka=!1;d&&h===c&&(h=c.mc?c.mc():c());var a=f||m&&c.qb(g,h);m=f=e=!1;a&&c.bb(g=h)});c.pc=function(a,b){b&&c.Ka||(m=!b);c.dd=c.S.change.slice(0);c.Ka=e=!0;h=a;l()};c.oc=function(a){e||(g=a,c.bb(a,"beforeChange"))};c.qc=function(){m=!0};c.fd=function(){c.qb(g,c.w(!0))&&(f=!0)}},Wa:function(a){return this.S[a]&&this.S[a].length},
Ad:function(b){if(b)return this.S[b]&&this.S[b].length||0;var c=0;a.a.O(this.S,function(a,b){"dirty"!==a&&(c+=b.length)});return c},qb:function(a,c){return!this.equalityComparer||!this.equalityComparer(a,c)},toString:function(){return"[object Object]"},extend:function(b){var c=this;b&&a.a.O(b,function(b,e){var f=a.Ta[b];"function"==typeof f&&(c=f(c,e)||c)});return c}};a.J(D,"init",D.ob);a.J(D,"subscribe",D.subscribe);a.J(D,"extend",D.extend);a.J(D,"getSubscriptionsCount",D.Ad);a.a.Ba&&a.a.setPrototypeOf(D,
Function.prototype);a.R.fn=D;a.Pc=function(a){return null!=a&&"function"==typeof a.subscribe&&"function"==typeof a.notifySubscribers};a.b("subscribable",a.R);a.b("isSubscribable",a.Pc);a.U=a.v=function(){function b(a){d.push(e);e=a}function c(){e=d.pop()}var d=[],e,f=0;return{wc:b,end:c,ac:function(b){if(e){if(!a.Pc(b))throw Error("Only subscribable things can act as dependencies");e.nd.call(e.od,b,b.ed||(b.ed=++f))}},K:function(a,d,e){try{return b(),a.apply(d,e||[])}finally{c()}},pa:function(){if(e)return e.o.pa()},
Va:function(){if(e)return e.o.Va()},rb:function(){if(e)return e.rb},o:function(){if(e)return e.o}}}();a.b("computedContext",a.U);a.b("computedContext.getDependenciesCount",a.U.pa);a.b("computedContext.getDependencies",a.U.Va);a.b("computedContext.isInitial",a.U.rb);a.b("computedContext.registerDependency",a.U.ac);a.b("ignoreDependencies",a.Wd=a.v.K);var I=a.a.Da("_latestValue");a.sa=function(b){function c(){if(0<arguments.length)return c.qb(c[I],arguments[0])&&(c.xa(),c[I]=arguments[0],c.wa()),this;
a.v.ac(c);return c[I]}c[I]=b;a.a.Ba||a.a.extend(c,a.R.fn);a.R.fn.ob(c);a.a.zb(c,F);a.options.deferUpdates&&a.Ta.deferred(c,!0);return c};var F={equalityComparer:K,w:function(){return this[I]},wa:function(){this.notifySubscribers(this[I],"spectate");this.notifySubscribers(this[I])},xa:function(){this.notifySubscribers(this[I],"beforeChange")}};a.a.Ba&&a.a.setPrototypeOf(F,a.R.fn);var G=a.sa.Na="__ko_proto__";F[G]=a.sa;a.N=function(b){if((b="function"==typeof b&&b[G])&&b!==F[G]&&b!==a.o.fn[G])throw Error("Invalid object that looks like an observable; possibly from another Knockout instance");
return!!b};a.Ya=function(b){return"function"==typeof b&&(b[G]===F[G]||b[G]===a.o.fn[G]&&b.Mc)};a.b("observable",a.sa);a.b("isObservable",a.N);a.b("isWriteableObservable",a.Ya);a.b("isWritableObservable",a.Ya);a.b("observable.fn",F);a.J(F,"peek",F.w);a.J(F,"valueHasMutated",F.wa);a.J(F,"valueWillMutate",F.xa);a.Ia=function(b){b=b||[];if("object"!=typeof b||!("length"in b))throw Error("The argument passed when initializing an observable array must be an array, or null, or undefined.");b=a.sa(b);a.a.zb(b,
a.Ia.fn);return b.extend({trackArrayChanges:!0})};a.Ia.fn={remove:function(b){for(var c=this.w(),d=[],e="function"!=typeof b||a.N(b)?function(a){return a===b}:b,f=0;f<c.length;f++){var g=c[f];if(e(g)){0===d.length&&this.xa();if(c[f]!==g)throw Error("Array modified during remove; cannot remove item");d.push(g);c.splice(f,1);f--}}d.length&&this.wa();return d},removeAll:function(b){if(b===p){var c=this.w(),d=c.slice(0);this.xa();c.splice(0,c.length);this.wa();return d}return b?this.remove(function(c){return 0<=
a.a.A(b,c)}):[]},destroy:function(b){var c=this.w(),d="function"!=typeof b||a.N(b)?function(a){return a===b}:b;this.xa();for(var e=c.length-1;0<=e;e--){var f=c[e];d(f)&&(f._destroy=!0)}this.wa()},destroyAll:function(b){return b===p?this.destroy(function(){return!0}):b?this.destroy(function(c){return 0<=a.a.A(b,c)}):[]},indexOf:function(b){var c=this();return a.a.A(c,b)},replace:function(a,c){var d=this.indexOf(a);0<=d&&(this.xa(),this.w()[d]=c,this.wa())},sorted:function(a){var c=this().slice(0);
return a?c.sort(a):c.sort()},reversed:function(){return this().slice(0).reverse()}};a.a.Ba&&a.a.setPrototypeOf(a.Ia.fn,a.sa.fn);a.a.C("pop push reverse shift sort splice unshift".split(" "),function(b){a.Ia.fn[b]=function(){var a=this.w();this.xa();this.yc(a,b,arguments);var d=a[b].apply(a,arguments);this.wa();return d===a?this:d}});a.a.C(["slice"],function(b){a.Ia.fn[b]=function(){var a=this();return a[b].apply(a,arguments)}});a.Oc=function(b){return a.N(b)&&"function"==typeof b.remove&&"function"==
typeof b.push};a.b("observableArray",a.Ia);a.b("isObservableArray",a.Oc);a.Ta.trackArrayChanges=function(b,c){function d(){function c(){if(h){var d=[].concat(b.w()||[]);if(b.Wa("arrayChange")){var e;if(!f||1<h)f=a.a.Ob(m,d,b.Nb);e=f}m=d;f=null;h=0;e&&e.length&&b.notifySubscribers(e,"arrayChange")}}e?c():(e=!0,l=b.notifySubscribers,b.notifySubscribers=function(a,b){b&&"change"!==b||++h;return l.apply(this,arguments)},m=[].concat(b.w()||[]),f=null,g=b.subscribe(c))}b.Nb={};c&&"object"==typeof c&&a.a.extend(b.Nb,
c);b.Nb.sparse=!0;if(!b.yc){var e=!1,f=null,g,h=0,m,l,k=b.Qa,q=b.cb;b.Qa=function(a){k&&k.call(b,a);"arrayChange"===a&&d()};b.cb=function(a){q&&q.call(b,a);"arrayChange"!==a||b.Wa("arrayChange")||(l&&(b.notifySubscribers=l,l=p),g&&g.s(),g=null,e=!1,m=p)};b.yc=function(b,c,d){function k(a,b,c){return l[l.length]={status:a,value:b,index:c}}if(e&&!h){var l=[],g=b.length,q=d.length,m=0;switch(c){case "push":m=g;case "unshift":for(c=0;c<q;c++)k("added",d[c],m+c);break;case "pop":m=g-1;case "shift":g&&
k("deleted",b[m],m);break;case "splice":c=Math.min(Math.max(0,0>d[0]?g+d[0]:d[0]),g);for(var g=1===q?g:Math.min(c+(d[1]||0),g),q=c+q-2,m=Math.max(g,q),U=[],L=[],p=2;c<m;++c,++p)c<g&&L.push(k("deleted",b[c],c)),c<q&&U.push(k("added",d[p],c));a.a.Jc(L,U);break;default:return}f=l}}}};var t=a.a.Da("_state");a.o=a.$=function(b,c,d){function e(){if(0<arguments.length){if("function"===typeof f)f.apply(g.lb,arguments);else throw Error("Cannot write a value to a ko.computed unless you specify a 'write' option. If you wish to read the current value, don't pass any parameters.");
return this}g.qa||a.v.ac(e);(g.ka||g.G&&e.Xa())&&e.ha();return g.X}"object"===typeof b?d=b:(d=d||{},b&&(d.read=b));if("function"!=typeof d.read)throw Error("Pass a function that returns the value of the ko.computed");var f=d.write,g={X:p,ra:!0,ka:!0,pb:!1,hc:!1,qa:!1,vb:!1,G:!1,Vc:d.read,lb:c||d.owner,l:d.disposeWhenNodeIsRemoved||d.l||null,Sa:d.disposeWhen||d.Sa,Qb:null,F:{},V:0,Hc:null};e[t]=g;e.Mc="function"===typeof f;a.a.Ba||a.a.extend(e,a.R.fn);a.R.fn.ob(e);a.a.zb(e,C);d.pure?(g.vb=!0,g.G=!0,
a.a.extend(e,da)):d.deferEvaluation&&a.a.extend(e,ea);a.options.deferUpdates&&a.Ta.deferred(e,!0);g.l&&(g.hc=!0,g.l.nodeType||(g.l=null));g.G||d.deferEvaluation||e.ha();g.l&&e.ja()&&a.a.I.za(g.l,g.Qb=function(){e.s()});return e};var C={equalityComparer:K,pa:function(){return this[t].V},Va:function(){var b=[];a.a.O(this[t].F,function(a,d){b[d.La]=d.da});return b},Ub:function(b){if(!this[t].V)return!1;var c=this.Va();return-1!==a.a.A(c,b)?!0:!!a.a.Lb(c,function(a){return a.Ub&&a.Ub(b)})},tc:function(a,
c,d){if(this[t].vb&&c===this)throw Error("A 'pure' computed must not be called recursively");this[t].F[a]=d;d.La=this[t].V++;d.Ma=c.mb()},Xa:function(){var a,c,d=this[t].F;for(a in d)if(Object.prototype.hasOwnProperty.call(d,a)&&(c=d[a],this.Ja&&c.da.Ka||c.da.Cd(c.Ma)))return!0},Id:function(){this.Ja&&!this[t].pb&&this.Ja(!1)},ja:function(){var a=this[t];return a.ka||0<a.V},Qd:function(){this.Ka?this[t].ka&&(this[t].ra=!0):this.Gc()},Zc:function(a){if(a.Hb){var c=a.subscribe(this.Id,this,"dirty"),
d=a.subscribe(this.Qd,this);return{da:a,s:function(){c.s();d.s()}}}return a.subscribe(this.Gc,this)},Gc:function(){var b=this,c=b.throttleEvaluation;c&&0<=c?(clearTimeout(this[t].Hc),this[t].Hc=a.a.setTimeout(function(){b.ha(!0)},c)):b.Ja?b.Ja(!0):b.ha(!0)},ha:function(b){var c=this[t],d=c.Sa,e=!1;if(!c.pb&&!c.qa){if(c.l&&!a.a.Rb(c.l)||d&&d()){if(!c.hc){this.s();return}}else c.hc=!1;c.pb=!0;try{e=this.yd(b)}finally{c.pb=!1}return e}},yd:function(b){var c=this[t],d=!1,e=c.vb?p:!c.V,d={pd:this,kb:c.F,
Pb:c.V};a.v.wc({od:d,nd:ba,o:this,rb:e});c.F={};c.V=0;var f=this.xd(c,d);c.V?d=this.qb(c.X,f):(this.s(),d=!0);d&&(c.G?this.Gb():this.notifySubscribers(c.X,"beforeChange"),c.X=f,this.notifySubscribers(c.X,"spectate"),!c.G&&b&&this.notifySubscribers(c.X),this.qc&&this.qc());e&&this.notifySubscribers(c.X,"awake");return d},xd:function(b,c){try{var d=b.Vc;return b.lb?d.call(b.lb):d()}finally{a.v.end(),c.Pb&&!b.G&&a.a.O(c.kb,aa),b.ra=b.ka=!1}},w:function(a){var c=this[t];(c.ka&&(a||!c.V)||c.G&&this.Xa())&&
this.ha();return c.X},tb:function(b){a.R.fn.tb.call(this,b);this.mc=function(){this[t].G||(this[t].ra?this.ha():this[t].ka=!1);return this[t].X};this.Ja=function(a){this.oc(this[t].X);this[t].ka=!0;a&&(this[t].ra=!0);this.pc(this,!a)}},s:function(){var b=this[t];!b.G&&b.F&&a.a.O(b.F,function(a,b){b.s&&b.s()});b.l&&b.Qb&&a.a.I.xb(b.l,b.Qb);b.F=p;b.V=0;b.qa=!0;b.ra=!1;b.ka=!1;b.G=!1;b.l=p;b.Sa=p;b.Vc=p;this.Mc||(b.lb=p)}},da={Qa:function(b){var c=this,d=c[t];if(!d.qa&&d.G&&"change"==b){d.G=!1;if(d.ra||
c.Xa())d.F=null,d.V=0,c.ha()&&c.Gb();else{var e=[];a.a.O(d.F,function(a,b){e[b.La]=a});a.a.C(e,function(a,b){var e=d.F[a],m=c.Zc(e.da);m.La=b;m.Ma=e.Ma;d.F[a]=m});c.Xa()&&c.ha()&&c.Gb()}d.qa||c.notifySubscribers(d.X,"awake")}},cb:function(b){var c=this[t];c.qa||"change"!=b||this.Wa("change")||(a.a.O(c.F,function(a,b){b.s&&(c.F[a]={da:b.da,La:b.La,Ma:b.Ma},b.s())}),c.G=!0,this.notifySubscribers(p,"asleep"))},mb:function(){var b=this[t];b.G&&(b.ra||this.Xa())&&this.ha();return a.R.fn.mb.call(this)}},
ea={Qa:function(a){"change"!=a&&"beforeChange"!=a||this.w()}};a.a.Ba&&a.a.setPrototypeOf(C,a.R.fn);var N=a.sa.Na;C[N]=a.o;a.Nc=function(a){return"function"==typeof a&&a[N]===C[N]};a.Ed=function(b){return a.Nc(b)&&b[t]&&b[t].vb};a.b("computed",a.o);a.b("dependentObservable",a.o);a.b("isComputed",a.Nc);a.b("isPureComputed",a.Ed);a.b("computed.fn",C);a.J(C,"peek",C.w);a.J(C,"dispose",C.s);a.J(C,"isActive",C.ja);a.J(C,"getDependenciesCount",C.pa);a.J(C,"getDependencies",C.Va);a.wb=function(b,c){if("function"===
typeof b)return a.o(b,c,{pure:!0});b=a.a.extend({},b);b.pure=!0;return a.o(b,c)};a.b("pureComputed",a.wb);(function(){function b(a,f,g){g=g||new d;a=f(a);if("object"!=typeof a||null===a||a===p||a instanceof RegExp||a instanceof Date||a instanceof String||a instanceof Number||a instanceof Boolean)return a;var h=a instanceof Array?[]:{};g.save(a,h);c(a,function(c){var d=f(a[c]);switch(typeof d){case "boolean":case "number":case "string":case "function":h[c]=d;break;case "object":case "undefined":var k=
g.get(d);h[c]=k!==p?k:b(d,f,g)}});return h}function c(a,b){if(a instanceof Array){for(var c=0;c<a.length;c++)b(c);"function"==typeof a.toJSON&&b("toJSON")}else for(c in a)b(c)}function d(){this.keys=[];this.values=[]}a.$c=function(c){if(0==arguments.length)throw Error("When calling ko.toJS, pass the object you want to convert.");return b(c,function(b){for(var c=0;a.N(b)&&10>c;c++)b=b();return b})};a.toJSON=function(b,c,d){b=a.$c(b);return a.a.fc(b,c,d)};d.prototype={constructor:d,save:function(b,
c){var d=a.a.A(this.keys,b);0<=d?this.values[d]=c:(this.keys.push(b),this.values.push(c))},get:function(b){b=a.a.A(this.keys,b);return 0<=b?this.values[b]:p}}})();a.b("toJS",a.$c);a.b("toJSON",a.toJSON);a.Vd=function(b,c,d){function e(c){var e=a.wb(b,d).extend({Ga:"always"}),h=e.subscribe(function(a){a&&(h.s(),c(a))});e.notifySubscribers(e.w());return h}return"function"!==typeof Promise||c?e(c.bind(d)):new Promise(e)};a.b("when",a.Vd);(function(){a.u={L:function(b){switch(a.a.P(b)){case "option":return!0===
b.__ko__hasDomDataOptionValue__?a.a.g.get(b,a.f.options.Yb):7>=a.a.W?b.getAttributeNode("value")&&b.getAttributeNode("value").specified?b.value:b.text:b.value;case "select":return 0<=b.selectedIndex?a.u.L(b.options[b.selectedIndex]):p;default:return b.value}},ya:function(b,c,d){switch(a.a.P(b)){case "option":"string"===typeof c?(a.a.g.set(b,a.f.options.Yb,p),"__ko__hasDomDataOptionValue__"in b&&delete b.__ko__hasDomDataOptionValue__,b.value=c):(a.a.g.set(b,a.f.options.Yb,c),b.__ko__hasDomDataOptionValue__=
!0,b.value="number"===typeof c?c:"");break;case "select":if(""===c||null===c)c=p;for(var e=-1,f=0,g=b.options.length,h;f<g;++f)if(h=a.u.L(b.options[f]),h==c||""===h&&c===p){e=f;break}if(d||0<=e||c===p&&1<b.size)b.selectedIndex=e,6===a.a.W&&a.a.setTimeout(function(){b.selectedIndex=e},0);break;default:if(null===c||c===p)c="";b.value=c}}}})();a.b("selectExtensions",a.u);a.b("selectExtensions.readValue",a.u.L);a.b("selectExtensions.writeValue",a.u.ya);a.m=function(){function b(b){b=a.a.Cb(b);123===b.charCodeAt(0)&&
(b=b.slice(1,-1));b+="\n,";var c=[],d=b.match(e),q,n=[],h=0;if(1<d.length){for(var y=0,A;A=d[y];++y){var u=A.charCodeAt(0);if(44===u){if(0>=h){c.push(q&&n.length?{key:q,value:n.join("")}:{unknown:q||n.join("")});q=h=0;n=[];continue}}else if(58===u){if(!h&&!q&&1===n.length){q=n.pop();continue}}else if(47===u&&1<A.length&&(47===A.charCodeAt(1)||42===A.charCodeAt(1)))continue;else 47===u&&y&&1<A.length?(u=d[y-1].match(f))&&!g[u[0]]&&(b=b.substr(b.indexOf(A)+1),d=b.match(e),y=-1,A="/"):40===u||123===
u||91===u?++h:41===u||125===u||93===u?--h:q||n.length||34!==u&&39!==u||(A=A.slice(1,-1));n.push(A)}if(0<h)throw Error("Unbalanced parentheses, braces, or brackets");}return c}var c=["true","false","null","undefined"],d=/^(?:[$_a-z][$\w]*|(.+)(\.\s*[$_a-z][$\w]*|\[.+\]))$/i,e=RegExp("\"(?:\\\\.|[^\"])*\"|'(?:\\\\.|[^'])*'|`(?:\\\\.|[^`])*`|/\\*(?:[^*]|\\*+[^*/])*\\*+/|//.*\n|/(?:\\\\.|[^/])+/w*|[^\\s:,/][^,\"'`{}()/:[\\]]*[^\\s,\"'`{}()/:[\\]]|[^\\s]","g"),f=/[\])"'A-Za-z0-9_$]+$/,g={"in":1,"return":1,
"typeof":1},h={};return{Ra:[],va:h,Zb:b,ub:function(e,f){function k(b,e){var f;if(!y){var l=a.getBindingHandler(b);if(l&&l.preprocess&&!(e=l.preprocess(e,b,k)))return;if(l=h[b])f=e,0<=a.a.A(c,f)?f=!1:(l=f.match(d),f=null===l?!1:l[1]?"Object("+l[1]+")"+l[2]:f),l=f;l&&n.push("'"+("string"==typeof h[b]?h[b]:b)+"':function(_z){"+f+"=_z}")}g&&(e="function(){return "+e+" }");q.push("'"+b+"':"+e)}f=f||{};var q=[],n=[],g=f.valueAccessors,y=f.bindingParams,A="string"===typeof e?b(e):e;a.a.C(A,function(a){k(a.key||
a.unknown,a.value)});n.length&&k("_ko_property_writers","{"+n.join(",")+" }");return q.join(",")},Hd:function(a,b){for(var c=0;c<a.length;c++)if(a[c].key==b)return!0;return!1},$a:function(b,c,d,e,f){if(b&&a.N(b))!a.Ya(b)||f&&b.w()===e||b(e);else if((b=c.get("_ko_property_writers"))&&b[d])b[d](e)}}}();a.b("expressionRewriting",a.m);a.b("expressionRewriting.bindingRewriteValidators",a.m.Ra);a.b("expressionRewriting.parseObjectLiteral",a.m.Zb);a.b("expressionRewriting.preProcessBindings",a.m.ub);a.b("expressionRewriting._twoWayBindings",
a.m.va);a.b("jsonExpressionRewriting",a.m);a.b("jsonExpressionRewriting.insertPropertyAccessorsIntoJson",a.m.ub);(function(){function b(a){return 8==a.nodeType&&g.test(f?a.text:a.nodeValue)}function c(a){return 8==a.nodeType&&h.test(f?a.text:a.nodeValue)}function d(d,e){for(var f=d,g=1,h=[];f=f.nextSibling;){if(c(f)&&(a.a.g.set(f,l,!0),g--,0===g))return h;h.push(f);b(f)&&g++}if(!e)throw Error("Cannot find closing comment tag to match: "+d.nodeValue);return null}function e(a,b){var c=d(a,b);return c?
0<c.length?c[c.length-1].nextSibling:a.nextSibling:null}var f=w&&"\x3c!--test--\x3e"===w.createComment("test").text,g=f?/^\x3c!--\s*ko(?:\s+([\s\S]+))?\s*--\x3e$/:/^\s*ko(?:\s+([\s\S]+))?\s*$/,h=f?/^\x3c!--\s*\/ko\s*--\x3e$/:/^\s*\/ko\s*$/,m={ul:!0,ol:!0},l="__ko_matchedEndComment__";a.h={ea:{},childNodes:function(a){return b(a)?d(a):a.childNodes},Ea:function(c){if(b(c)){c=a.h.childNodes(c);for(var d=0,e=c.length;d<e;d++)a.removeNode(c[d])}else a.a.Sb(c)},ua:function(c,d){if(b(c)){a.h.Ea(c);for(var e=
c.nextSibling,f=0,l=d.length;f<l;f++)e.parentNode.insertBefore(d[f],e)}else a.a.ua(c,d)},Uc:function(a,c){b(a)?a.parentNode.insertBefore(c,a.nextSibling):a.firstChild?a.insertBefore(c,a.firstChild):a.appendChild(c)},Vb:function(c,d,e){e?b(c)?c.parentNode.insertBefore(d,e.nextSibling):e.nextSibling?c.insertBefore(d,e.nextSibling):c.appendChild(d):a.h.Uc(c,d)},firstChild:function(a){if(b(a))return!a.nextSibling||c(a.nextSibling)?null:a.nextSibling;if(a.firstChild&&c(a.firstChild))throw Error("Found invalid end comment, as the first child of "+
a);return a.firstChild},nextSibling:function(d){b(d)&&(d=e(d));if(d.nextSibling&&c(d.nextSibling)){var f=d.nextSibling;if(c(f)&&!a.a.g.get(f,l))throw Error("Found end comment without a matching opening comment, as child of "+d);return null}return d.nextSibling},Bd:b,Ud:function(a){return(a=(f?a.text:a.nodeValue).match(g))?a[1]:null},Rc:function(d){if(m[a.a.P(d)]){var f=d.firstChild;if(f){do if(1===f.nodeType){var l;l=f.firstChild;var g=null;if(l){do if(g)g.push(l);else if(b(l)){var h=e(l,!0);h?l=
h:g=[l]}else c(l)&&(g=[l]);while(l=l.nextSibling)}if(l=g)for(g=f.nextSibling,h=0;h<l.length;h++)g?d.insertBefore(l[h],g):d.appendChild(l[h])}while(f=f.nextSibling)}}}}})();a.b("virtualElements",a.h);a.b("virtualElements.allowedBindings",a.h.ea);a.b("virtualElements.emptyNode",a.h.Ea);a.b("virtualElements.insertAfter",a.h.Vb);a.b("virtualElements.prepend",a.h.Uc);a.b("virtualElements.setDomNodeChildren",a.h.ua);(function(){a.ga=function(){this.md={}};a.a.extend(a.ga.prototype,{nodeHasBindings:function(b){switch(b.nodeType){case 1:return null!=
b.getAttribute("data-bind")||a.i.getComponentNameForNode(b);case 8:return a.h.Bd(b);default:return!1}},getBindings:function(b,c){var d=this.getBindingsString(b,c),d=d?this.parseBindingsString(d,c,b):null;return a.i.sc(d,b,c,!1)},getBindingAccessors:function(b,c){var d=this.getBindingsString(b,c),d=d?this.parseBindingsString(d,c,b,{valueAccessors:!0}):null;return a.i.sc(d,b,c,!0)},getBindingsString:function(b){switch(b.nodeType){case 1:return b.getAttribute("data-bind");case 8:return a.h.Ud(b);default:return null}},
parseBindingsString:function(b,c,d,e){try{var f=this.md,g=b+(e&&e.valueAccessors||""),h;if(!(h=f[g])){var m,l="with($context){with($data||{}){return{"+a.m.ub(b,e)+"}}}";m=new Function("$context","$element",l);h=f[g]=m}return h(c,d)}catch(k){throw k.message="Unable to parse bindings.\nBindings value: "+b+"\nMessage: "+k.message,k;}}});a.ga.instance=new a.ga})();a.b("bindingProvider",a.ga);(function(){function b(b){var c=(b=a.a.g.get(b,B))&&b.M;c&&(b.M=null,c.Sc())}function c(c,d,e){this.node=c;this.xc=
d;this.ib=[];this.T=!1;d.M||a.a.I.za(c,b);e&&e.M&&(e.M.ib.push(c),this.Kb=e)}function d(a){return function(){return a}}function e(a){return a()}function f(b){return a.a.Ha(a.v.K(b),function(a,c){return function(){return b()[c]}})}function g(b,c,e){return"function"===typeof b?f(b.bind(null,c,e)):a.a.Ha(b,d)}function h(a,b){return f(this.getBindings.bind(this,a,b))}function m(b,c){var d=a.h.firstChild(c);if(d){var e,f=a.ga.instance,k=f.preprocessNode;if(k){for(;e=d;)d=a.h.nextSibling(e),k.call(f,e);
d=a.h.firstChild(c)}for(;e=d;)d=a.h.nextSibling(e),l(b,e)}a.j.Ga(c,a.j.T)}function l(b,c){var d=b,e=1===c.nodeType;e&&a.h.Rc(c);if(e||a.ga.instance.nodeHasBindings(c))d=q(c,null,b).bindingContextForDescendants;d&&!u[a.a.P(c)]&&m(d,c)}function k(b){var c=[],d={},e=[];a.a.O(b,function ca(f){if(!d[f]){var l=a.getBindingHandler(f);l&&(l.after&&(e.push(f),a.a.C(l.after,function(c){if(b[c]){if(-1!==a.a.A(e,c))throw Error("Cannot combine the following bindings, because they have a cyclic dependency: "+e.join(", "));
ca(c)}}),e.length--),c.push({key:f,Lc:l}));d[f]=!0}});return c}function q(b,c,d){var f=a.a.g.Tb(b,B,{}),l=f.gd;if(!c){if(l)throw Error("You cannot apply bindings multiple times to the same element.");f.gd=!0}l||(f.context=d);var g;if(c&&"function"!==typeof c)g=c;else{var q=a.ga.instance,n=q.getBindingAccessors||h,m=a.$(function(){if(g=c?c(d,b):n.call(q,b,d)){if(d[r])d[r]();if(d[A])d[A]()}return g},null,{l:b});g&&m.ja()||(m=null)}var y=d,u;if(g){var J=function(){return a.a.Ha(m?m():g,e)},t=m?function(a){return function(){return e(m()[a])}}:
function(a){return g[a]};J.get=function(a){return g[a]&&e(t(a))};J.has=function(a){return a in g};a.j.T in g&&a.j.subscribe(b,a.j.T,function(){var c=(0,g[a.j.T])();if(c){var d=a.h.childNodes(b);d.length&&c(d,a.Dc(d[0]))}});a.j.oa in g&&(y=a.j.Bb(b,d),a.j.subscribe(b,a.j.oa,function(){var c=(0,g[a.j.oa])();c&&a.h.firstChild(b)&&c(b)}));f=k(g);a.a.C(f,function(c){var d=c.Lc.init,e=c.Lc.update,f=c.key;if(8===b.nodeType&&!a.h.ea[f])throw Error("The binding '"+f+"' cannot be used with virtual elements");
try{"function"==typeof d&&a.v.K(function(){var a=d(b,t(f),J,y.$data,y);if(a&&a.controlsDescendantBindings){if(u!==p)throw Error("Multiple bindings ("+u+" and "+f+") are trying to control descendant bindings of the same element. You cannot use these bindings together on the same element.");u=f}}),"function"==typeof e&&a.$(function(){e(b,t(f),J,y.$data,y)},null,{l:b})}catch(l){throw l.message='Unable to process binding "'+f+": "+g[f]+'"\nMessage: '+l.message,l;}})}f=u===p;return{shouldBindDescendants:f,
bindingContextForDescendants:f&&y}}function n(b,c){return b&&b instanceof a.fa?b:new a.fa(b,p,p,c)}var r=a.a.Da("_subscribable"),y=a.a.Da("_ancestorBindingInfo"),A=a.a.Da("_dataDependency");a.f={};var u={script:!0,textarea:!0,template:!0};a.getBindingHandler=function(b){return a.f[b]};var J={};a.fa=function(b,c,d,e,f){function l(){var b=q?h():h,f=a.a.c(b);c?(a.a.extend(k,c),y in c&&(k[y]=c[y])):(k.$parents=[],k.$root=f,k.ko=a);k[r]=n;g?f=k.$data:(k.$rawData=b,k.$data=f);d&&(k[d]=f);e&&e(k,c,f);if(c&&
c[r]&&!a.U.o().Ub(c[r]))c[r]();m&&(k[A]=m);return k.$data}var k=this,g=b===J,h=g?p:b,q="function"==typeof h&&!a.N(h),n,m=f&&f.dataDependency;f&&f.exportDependencies?l():(n=a.wb(l),n.w(),n.ja()?n.equalityComparer=null:k[r]=p)};a.fa.prototype.createChildContext=function(b,c,d,e){!e&&c&&"object"==typeof c&&(e=c,c=e.as,d=e.extend);if(c&&e&&e.noChildContext){var f="function"==typeof b&&!a.N(b);return new a.fa(J,this,null,function(a){d&&d(a);a[c]=f?b():b},e)}return new a.fa(b,this,c,function(a,b){a.$parentContext=
b;a.$parent=b.$data;a.$parents=(b.$parents||[]).slice(0);a.$parents.unshift(a.$parent);d&&d(a)},e)};a.fa.prototype.extend=function(b,c){return new a.fa(J,this,null,function(c){a.a.extend(c,"function"==typeof b?b(c):b)},c)};var B=a.a.g.Z();c.prototype.Sc=function(){this.Kb&&this.Kb.M&&this.Kb.M.rd(this.node)};c.prototype.rd=function(b){a.a.hb(this.ib,b);!this.ib.length&&this.T&&this.Bc()};c.prototype.Bc=function(){this.T=!0;this.xc.M&&!this.ib.length&&(this.xc.M=null,a.a.I.xb(this.node,b),a.j.Ga(this.node,
a.j.oa),this.Sc())};a.j={T:"childrenComplete",oa:"descendantsComplete",subscribe:function(b,c,d,e){b=a.a.g.Tb(b,B,{});b.Fa||(b.Fa=new a.R);return b.Fa.subscribe(d,e,c)},Ga:function(b,c){var d=a.a.g.get(b,B);if(d&&(d.Fa&&d.Fa.notifySubscribers(b,c),c==a.j.T))if(d.M)d.M.Bc();else if(d.M===p&&d.Fa&&d.Fa.Wa(a.j.oa))throw Error("descendantsComplete event not supported for bindings on this node");},Bb:function(b,d){var e=a.a.g.Tb(b,B,{});e.M||(e.M=new c(b,e,d[y]));return d[y]==e?d:d.extend(function(a){a[y]=
e})}};a.Sd=function(b){return(b=a.a.g.get(b,B))&&b.context};a.eb=function(b,c,d){1===b.nodeType&&a.h.Rc(b);return q(b,c,n(d))};a.kd=function(b,c,d){d=n(d);return a.eb(b,g(c,d,b),d)};a.Pa=function(a,b){1!==b.nodeType&&8!==b.nodeType||m(n(a),b)};a.uc=function(a,b,c){!v&&z.jQuery&&(v=z.jQuery);if(2>arguments.length){if(b=w.body,!b)throw Error("ko.applyBindings: could not find document.body; has the document been loaded?");}else if(!b||1!==b.nodeType&&8!==b.nodeType)throw Error("ko.applyBindings: first parameter should be your view model; second parameter should be a DOM node");
l(n(a,c),b)};a.Cc=function(b){return!b||1!==b.nodeType&&8!==b.nodeType?p:a.Sd(b)};a.Dc=function(b){return(b=a.Cc(b))?b.$data:p};a.b("bindingHandlers",a.f);a.b("bindingEvent",a.j);a.b("bindingEvent.subscribe",a.j.subscribe);a.b("bindingEvent.startPossiblyAsyncContentBinding",a.j.Bb);a.b("applyBindings",a.uc);a.b("applyBindingsToDescendants",a.Pa);a.b("applyBindingAccessorsToNode",a.eb);a.b("applyBindingsToNode",a.kd);a.b("contextFor",a.Cc);a.b("dataFor",a.Dc)})();(function(b){function c(c,e){var l=
Object.prototype.hasOwnProperty.call(f,c)?f[c]:b,k;l?l.subscribe(e):(l=f[c]=new a.R,l.subscribe(e),d(c,function(b,d){var e=!(!d||!d.synchronous);g[c]={definition:b,Fd:e};delete f[c];k||e?l.notifySubscribers(b):a.ma.yb(function(){l.notifySubscribers(b)})}),k=!0)}function d(a,b){e("getConfig",[a],function(c){c?e("loadComponent",[a,c],function(a){b(a,c)}):b(null,null)})}function e(c,d,f,k){k||(k=a.i.loaders.slice(0));var g=k.shift();if(g){var n=g[c];if(n){var r=!1;if(n.apply(g,d.concat(function(a){r?
f(null):null!==a?f(a):e(c,d,f,k)}))!==b&&(r=!0,!g.suppressLoaderExceptions))throw Error("Component loaders must supply values by invoking the callback, not by returning values synchronously.");}else e(c,d,f,k)}else f(null)}var f={},g={};a.i={get:function(d,e){var f=Object.prototype.hasOwnProperty.call(g,d)?g[d]:b;f?f.Fd?a.v.K(function(){e(f.definition)}):a.ma.yb(function(){e(f.definition)}):c(d,e)},Ac:function(a){delete g[a]},nc:e};a.i.loaders=[];a.b("components",a.i);a.b("components.get",a.i.get);
a.b("components.clearCachedDefinition",a.i.Ac)})();(function(){function b(b,c,d,e){function g(){0===--A&&e(h)}var h={},A=2,u=d.template;d=d.viewModel;u?f(c,u,function(c){a.i.nc("loadTemplate",[b,c],function(a){h.template=a;g()})}):g();d?f(c,d,function(c){a.i.nc("loadViewModel",[b,c],function(a){h[m]=a;g()})}):g()}function c(a,b,d){if("function"===typeof b)d(function(a){return new b(a)});else if("function"===typeof b[m])d(b[m]);else if("instance"in b){var e=b.instance;d(function(){return e})}else"viewModel"in
b?c(a,b.viewModel,d):a("Unknown viewModel value: "+b)}function d(b){switch(a.a.P(b)){case "script":return a.a.ta(b.text);case "textarea":return a.a.ta(b.value);case "template":if(e(b.content))return a.a.Ca(b.content.childNodes)}return a.a.Ca(b.childNodes)}function e(a){return z.DocumentFragment?a instanceof DocumentFragment:a&&11===a.nodeType}function f(a,b,c){"string"===typeof b.require?T||z.require?(T||z.require)([b.require],c):a("Uses require, but no AMD loader is present"):c(b)}function g(a){return function(b){throw Error("Component '"+
a+"': "+b);}}var h={};a.i.register=function(b,c){if(!c)throw Error("Invalid configuration for "+b);if(a.i.sb(b))throw Error("Component "+b+" is already registered");h[b]=c};a.i.sb=function(a){return Object.prototype.hasOwnProperty.call(h,a)};a.i.unregister=function(b){delete h[b];a.i.Ac(b)};a.i.Ec={getConfig:function(b,c){c(a.i.sb(b)?h[b]:null)},loadComponent:function(a,c,d){var e=g(a);f(e,c,function(c){b(a,e,c,d)})},loadTemplate:function(b,c,f){b=g(b);if("string"===typeof c)f(a.a.ta(c));else if(c instanceof
Array)f(c);else if(e(c))f(a.a.la(c.childNodes));else if(c.element)if(c=c.element,z.HTMLElement?c instanceof HTMLElement:c&&c.tagName&&1===c.nodeType)f(d(c));else if("string"===typeof c){var h=w.getElementById(c);h?f(d(h)):b("Cannot find element with ID "+c)}else b("Unknown element type: "+c);else b("Unknown template value: "+c)},loadViewModel:function(a,b,d){c(g(a),b,d)}};var m="createViewModel";a.b("components.register",a.i.register);a.b("components.isRegistered",a.i.sb);a.b("components.unregister",
a.i.unregister);a.b("components.defaultLoader",a.i.Ec);a.i.loaders.push(a.i.Ec);a.i.cd=h})();(function(){function b(b,e){var f=b.getAttribute("params");if(f){var f=c.parseBindingsString(f,e,b,{valueAccessors:!0,bindingParams:!0}),f=a.a.Ha(f,function(c){return a.o(c,null,{l:b})}),g=a.a.Ha(f,function(c){var e=c.w();return c.ja()?a.o({read:function(){return a.a.c(c())},write:a.Ya(e)&&function(a){c()(a)},l:b}):e});Object.prototype.hasOwnProperty.call(g,"$raw")||(g.$raw=f);return g}return{$raw:{}}}a.i.getComponentNameForNode=
function(b){var c=a.a.P(b);if(a.i.sb(c)&&(-1!=c.indexOf("-")||"[object HTMLUnknownElement]"==""+b||8>=a.a.W&&b.tagName===c))return c};a.i.sc=function(c,e,f,g){if(1===e.nodeType){var h=a.i.getComponentNameForNode(e);if(h){c=c||{};if(c.component)throw Error('Cannot use the "component" binding on a custom element matching a component');var m={name:h,params:b(e,f)};c.component=g?function(){return m}:m}}return c};var c=new a.ga;9>a.a.W&&(a.i.register=function(a){return function(b){return a.apply(this,
arguments)}}(a.i.register),w.createDocumentFragment=function(b){return function(){var c=b(),f=a.i.cd,g;for(g in f);return c}}(w.createDocumentFragment))})();(function(){function b(b,c,d){c=c.template;if(!c)throw Error("Component '"+b+"' has no template");b=a.a.Ca(c);a.h.ua(d,b)}function c(a,b,c){var d=a.createViewModel;return d?d.call(a,b,c):b}var d=0;a.f.component={init:function(e,f,g,h,m){function l(){var a=k&&k.dispose;"function"===typeof a&&a.call(k);n&&n.s();q=k=n=null}var k,q,n,r=a.a.la(a.h.childNodes(e));
a.h.Ea(e);a.a.I.za(e,l);a.o(function(){var g=a.a.c(f()),h,u;"string"===typeof g?h=g:(h=a.a.c(g.name),u=a.a.c(g.params));if(!h)throw Error("No component name specified");var p=a.j.Bb(e,m),B=q=++d;a.i.get(h,function(d){if(q===B){l();if(!d)throw Error("Unknown component '"+h+"'");b(h,d,e);var f=c(d,u,{element:e,templateNodes:r});d=p.createChildContext(f,{extend:function(a){a.$component=f;a.$componentTemplateNodes=r}});f&&f.koDescendantsComplete&&(n=a.j.subscribe(e,a.j.oa,f.koDescendantsComplete,f));
k=f;a.Pa(d,e)}})},null,{l:e});return{controlsDescendantBindings:!0}}};a.h.ea.component=!0})();var V={"class":"className","for":"htmlFor"};a.f.attr={update:function(b,c){var d=a.a.c(c())||{};a.a.O(d,function(c,d){d=a.a.c(d);var g=c.indexOf(":"),g="lookupNamespaceURI"in b&&0<g&&b.lookupNamespaceURI(c.substr(0,g)),h=!1===d||null===d||d===p;h?g?b.removeAttributeNS(g,c):b.removeAttribute(c):d=d.toString();8>=a.a.W&&c in V?(c=V[c],h?b.removeAttribute(c):b[c]=d):h||(g?b.setAttributeNS(g,c,d):b.setAttribute(c,
d));"name"===c&&a.a.Xc(b,h?"":d)})}};(function(){a.f.checked={after:["value","attr"],init:function(b,c,d){function e(){var e=b.checked,f=g();if(!a.U.rb()&&(e||!m&&!a.U.pa())){var l=a.v.K(c);if(k){var n=q?l.w():l,B=r;r=f;B!==f?e&&(a.a.Oa(n,f,!0),a.a.Oa(n,B,!1)):a.a.Oa(n,f,e);q&&a.Ya(l)&&l(n)}else h&&(f===p?f=e:e||(f=p)),a.m.$a(l,d,"checked",f,!0)}}function f(){var d=a.a.c(c()),e=g();k?(b.checked=0<=a.a.A(d,e),r=e):b.checked=h&&e===p?!!d:g()===d}var g=a.wb(function(){if(d.has("checkedValue"))return a.a.c(d.get("checkedValue"));
if(n)return d.has("value")?a.a.c(d.get("value")):b.value}),h="checkbox"==b.type,m="radio"==b.type;if(h||m){var l=c(),k=h&&a.a.c(l)instanceof Array,q=!(k&&l.push&&l.splice),n=m||k,r=k?g():p;m&&!b.name&&a.f.uniqueName.init(b,function(){return!0});a.o(e,null,{l:b});a.a.H(b,"click",e);a.o(f,null,{l:b});l=p}}};a.m.va.checked=!0;a.f.checkedValue={update:function(b,c){b.value=a.a.c(c())}}})();a.f["class"]={update:function(b,c){var d=a.a.Cb(a.a.c(c()));a.a.Eb(b,b.__ko__cssValue,!1);b.__ko__cssValue=d;a.a.Eb(b,
d,!0)}};a.f.css={update:function(b,c){var d=a.a.c(c());null!==d&&"object"==typeof d?a.a.O(d,function(c,d){d=a.a.c(d);a.a.Eb(b,c,d)}):a.f["class"].update(b,c)}};a.f.enable={update:function(b,c){var d=a.a.c(c());d&&b.disabled?b.removeAttribute("disabled"):d||b.disabled||(b.disabled=!0)}};a.f.disable={update:function(b,c){a.f.enable.update(b,function(){return!a.a.c(c())})}};a.f.event={init:function(b,c,d,e,f){var g=c()||{};a.a.O(g,function(g){"string"==typeof g&&a.a.H(b,g,function(b){var l,k=c()[g];
if(k){try{var q=a.a.la(arguments);e=f.$data;q.unshift(e);l=k.apply(e,q)}finally{!0!==l&&(b.preventDefault?b.preventDefault():b.returnValue=!1)}!1===d.get(g+"Bubble")&&(b.cancelBubble=!0,b.stopPropagation&&b.stopPropagation())}})})}};a.f.foreach={Qc:function(b){return function(){var c=b(),d=a.a.$b(c);if(!d||"number"==typeof d.length)return{foreach:c,templateEngine:a.ba.Na};a.a.c(c);return{foreach:d.data,as:d.as,noChildContext:d.noChildContext,includeDestroyed:d.includeDestroyed,afterAdd:d.afterAdd,
beforeRemove:d.beforeRemove,afterRender:d.afterRender,beforeMove:d.beforeMove,afterMove:d.afterMove,templateEngine:a.ba.Na}}},init:function(b,c){return a.f.template.init(b,a.f.foreach.Qc(c))},update:function(b,c,d,e,f){return a.f.template.update(b,a.f.foreach.Qc(c),d,e,f)}};a.m.Ra.foreach=!1;a.h.ea.foreach=!0;a.f.hasfocus={init:function(b,c,d){function e(e){b.__ko_hasfocusUpdating=!0;var f=b.ownerDocument;if("activeElement"in f){var g;try{g=f.activeElement}catch(k){g=f.body}e=g===b}f=c();a.m.$a(f,
d,"hasfocus",e,!0);b.__ko_hasfocusLastValue=e;b.__ko_hasfocusUpdating=!1}var f=e.bind(null,!0),g=e.bind(null,!1);a.a.H(b,"focus",f);a.a.H(b,"focusin",f);a.a.H(b,"blur",g);a.a.H(b,"focusout",g);b.__ko_hasfocusLastValue=!1},update:function(b,c){var d=!!a.a.c(c());b.__ko_hasfocusUpdating||b.__ko_hasfocusLastValue===d||(d?b.focus():b.blur(),!d&&b.__ko_hasfocusLastValue&&b.ownerDocument.body.focus(),a.v.K(a.a.Fb,null,[b,d?"focusin":"focusout"]))}};a.m.va.hasfocus=!0;a.f.hasFocus=a.f.hasfocus;a.m.va.hasFocus=
"hasfocus";a.f.html={init:function(){return{controlsDescendantBindings:!0}},update:function(b,c){a.a.dc(b,c())}};(function(){function b(b,d,e){a.f[b]={init:function(b,c,h,m,l){var k,q,n={},r,p,A;if(d){m=h.get("as");var u=h.get("noChildContext");A=!(m&&u);n={as:m,noChildContext:u,exportDependencies:A}}p=(r="render"==h.get("completeOn"))||h.has(a.j.oa);a.o(function(){var h=a.a.c(c()),m=!e!==!h,u=!q,t;if(A||m!==k){p&&(l=a.j.Bb(b,l));if(m){if(!d||A)n.dataDependency=a.U.o();t=d?l.createChildContext("function"==
typeof h?h:c,n):a.U.pa()?l.extend(null,n):l}u&&a.U.pa()&&(q=a.a.Ca(a.h.childNodes(b),!0));m?(u||a.h.ua(b,a.a.Ca(q)),a.Pa(t,b)):(a.h.Ea(b),r||a.j.Ga(b,a.j.T));k=m}},null,{l:b});return{controlsDescendantBindings:!0}}};a.m.Ra[b]=!1;a.h.ea[b]=!0}b("if");b("ifnot",!1,!0);b("with",!0)})();a.f.let={init:function(b,c,d,e,f){c=f.extend(c);a.Pa(c,b);return{controlsDescendantBindings:!0}}};a.h.ea.let=!0;var Q={};a.f.options={init:function(b){if("select"!==a.a.P(b))throw Error("options binding applies only to SELECT elements");
for(;0<b.length;)b.remove(0);return{controlsDescendantBindings:!0}},update:function(b,c,d){function e(){return a.a.fb(b.options,function(a){return a.selected})}function f(a,b,c){var d=typeof b;return"function"==d?b(a):"string"==d?a[b]:c}function g(c,e){if(y&&k)a.u.ya(b,a.a.c(d.get("value")),!0);else if(r.length){var f=0<=a.a.A(r,a.u.L(e[0]));a.a.Yc(e[0],f);y&&!f&&a.v.K(a.a.Fb,null,[b,"change"])}}var h=b.multiple,m=0!=b.length&&h?b.scrollTop:null,l=a.a.c(c()),k=d.get("valueAllowUnset")&&d.has("value"),
q=d.get("optionsIncludeDestroyed");c={};var n,r=[];k||(h?r=a.a.Mb(e(),a.u.L):0<=b.selectedIndex&&r.push(a.u.L(b.options[b.selectedIndex])));l&&("undefined"==typeof l.length&&(l=[l]),n=a.a.fb(l,function(b){return q||b===p||null===b||!a.a.c(b._destroy)}),d.has("optionsCaption")&&(l=a.a.c(d.get("optionsCaption")),null!==l&&l!==p&&n.unshift(Q)));var y=!1;c.beforeRemove=function(a){b.removeChild(a)};l=g;d.has("optionsAfterRender")&&"function"==typeof d.get("optionsAfterRender")&&(l=function(b,c){g(0,c);
a.v.K(d.get("optionsAfterRender"),null,[c[0],b!==Q?b:p])});a.a.cc(b,n,function(c,e,g){g.length&&(r=!k&&g[0].selected?[a.u.L(g[0])]:[],y=!0);e=b.ownerDocument.createElement("option");c===Q?(a.a.Ab(e,d.get("optionsCaption")),a.u.ya(e,p)):(g=f(c,d.get("optionsValue"),c),a.u.ya(e,a.a.c(g)),c=f(c,d.get("optionsText"),g),a.a.Ab(e,c));return[e]},c,l);a.v.K(function(){if(k)a.u.ya(b,a.a.c(d.get("value")),!0);else{var c;h?c=r.length&&e().length<r.length:c=r.length&&0<=b.selectedIndex?a.u.L(b.options[b.selectedIndex])!==
r[0]:r.length||0<=b.selectedIndex;c&&a.a.Fb(b,"change")}});a.a.vd(b);m&&20<Math.abs(m-b.scrollTop)&&(b.scrollTop=m)}};a.f.options.Yb=a.a.g.Z();a.f.selectedOptions={after:["options","foreach"],init:function(b,c,d){a.a.H(b,"change",function(){var e=c(),f=[];a.a.C(b.getElementsByTagName("option"),function(b){b.selected&&f.push(a.u.L(b))});a.m.$a(e,d,"selectedOptions",f)})},update:function(b,c){if("select"!=a.a.P(b))throw Error("values binding applies only to SELECT elements");var d=a.a.c(c()),e=b.scrollTop;
d&&"number"==typeof d.length&&a.a.C(b.getElementsByTagName("option"),function(b){var c=0<=a.a.A(d,a.u.L(b));b.selected!=c&&a.a.Yc(b,c)});b.scrollTop=e}};a.m.va.selectedOptions=!0;a.f.style={update:function(b,c){var d=a.a.c(c()||{});a.a.O(d,function(c,d){d=a.a.c(d);if(null===d||d===p||!1===d)d="";if(v)v(b).css(c,d);else if(/^--/.test(c))b.style.setProperty(c,d);else{c=c.replace(/-(\w)/g,function(a,b){return b.toUpperCase()});var g=b.style[c];b.style[c]=d;d===g||b.style[c]!=g||isNaN(d)||(b.style[c]=
d+"px")}})}};a.f.submit={init:function(b,c,d,e,f){if("function"!=typeof c())throw Error("The value for a submit binding must be a function");a.a.H(b,"submit",function(a){var d,e=c();try{d=e.call(f.$data,b)}finally{!0!==d&&(a.preventDefault?a.preventDefault():a.returnValue=!1)}})}};a.f.text={init:function(){return{controlsDescendantBindings:!0}},update:function(b,c){a.a.Ab(b,c())}};a.h.ea.text=!0;(function(){if(z&&z.navigator){var b=function(a){if(a)return parseFloat(a[1])},c=z.navigator.userAgent,
d,e,f,g,h;(d=z.opera&&z.opera.version&&parseInt(z.opera.version()))||(h=b(c.match(/Edge\/([^ ]+)$/)))||b(c.match(/Chrome\/([^ ]+)/))||(e=b(c.match(/Version\/([^ ]+) Safari/)))||(f=b(c.match(/Firefox\/([^ ]+)/)))||(g=a.a.W||b(c.match(/MSIE ([^ ]+)/)))||(g=b(c.match(/rv:([^ )]+)/)))}if(8<=g&&10>g)var m=a.a.g.Z(),l=a.a.g.Z(),k=function(b){var c=this.activeElement;(c=c&&a.a.g.get(c,l))&&c(b)},q=function(b,c){var d=b.ownerDocument;a.a.g.get(d,m)||(a.a.g.set(d,m,!0),a.a.H(d,"selectionchange",k));a.a.g.set(b,
l,c)};a.f.textInput={init:function(b,c,l){function k(c,d){a.a.H(b,c,d)}function m(){var d=a.a.c(c());if(null===d||d===p)d="";L!==p&&d===L?a.a.setTimeout(m,4):b.value!==d&&(x=!0,b.value=d,x=!1,v=b.value)}function t(){w||(L=b.value,w=a.a.setTimeout(B,4))}function B(){clearTimeout(w);L=w=p;var d=b.value;v!==d&&(v=d,a.m.$a(c(),l,"textInput",d))}var v=b.value,w,L,z=9==a.a.W?t:B,x=!1;g&&k("keypress",B);11>g&&k("propertychange",function(a){x||"value"!==a.propertyName||z(a)});8==g&&(k("keyup",B),k("keydown",
B));q&&(q(b,z),k("dragend",t));(!g||9<=g)&&k("input",z);5>e&&"textarea"===a.a.P(b)?(k("keydown",t),k("paste",t),k("cut",t)):11>d?k("keydown",t):4>f?(k("DOMAutoComplete",B),k("dragdrop",B),k("drop",B)):h&&"number"===b.type&&k("keydown",t);k("change",B);k("blur",B);a.o(m,null,{l:b})}};a.m.va.textInput=!0;a.f.textinput={preprocess:function(a,b,c){c("textInput",a)}}})();a.f.uniqueName={init:function(b,c){if(c()){var d="ko_unique_"+ ++a.f.uniqueName.qd;a.a.Xc(b,d)}}};a.f.uniqueName.qd=0;a.f.using={init:function(b,
c,d,e,f){var g;d.has("as")&&(g={as:d.get("as"),noChildContext:d.get("noChildContext")});c=f.createChildContext(c,g);a.Pa(c,b);return{controlsDescendantBindings:!0}}};a.h.ea.using=!0;a.f.value={after:["options","foreach"],init:function(b,c,d){var e=a.a.P(b),f="input"==e;if(!f||"checkbox"!=b.type&&"radio"!=b.type){var g=["change"],h=d.get("valueUpdate"),m=!1,l=null;h&&("string"==typeof h&&(h=[h]),a.a.gb(g,h),g=a.a.vc(g));var k=function(){l=null;m=!1;var e=c(),f=a.u.L(b);a.m.$a(e,d,"value",f)};!a.a.W||
!f||"text"!=b.type||"off"==b.autocomplete||b.form&&"off"==b.form.autocomplete||-1!=a.a.A(g,"propertychange")||(a.a.H(b,"propertychange",function(){m=!0}),a.a.H(b,"focus",function(){m=!1}),a.a.H(b,"blur",function(){m&&k()}));a.a.C(g,function(c){var d=k;a.a.Td(c,"after")&&(d=function(){l=a.u.L(b);a.a.setTimeout(k,0)},c=c.substring(5));a.a.H(b,c,d)});var q;q=f&&"file"==b.type?function(){var d=a.a.c(c());null===d||d===p||""===d?b.value="":a.v.K(k)}:function(){var f=a.a.c(c()),g=a.u.L(b);if(null!==l&&
f===l)a.a.setTimeout(q,0);else if(f!==g||g===p)"select"===e?(g=d.get("valueAllowUnset"),a.u.ya(b,f,g),g||f===a.u.L(b)||a.v.K(k)):a.u.ya(b,f)};a.o(q,null,{l:b})}else a.eb(b,{checkedValue:c})},update:function(){}};a.m.va.value=!0;a.f.visible={update:function(b,c){var d=a.a.c(c()),e="none"!=b.style.display;d&&!e?b.style.display="":!d&&e&&(b.style.display="none")}};a.f.hidden={update:function(b,c){a.f.visible.update(b,function(){return!a.a.c(c())})}};(function(b){a.f[b]={init:function(c,d,e,f,g){return a.f.event.init.call(this,
c,function(){var a={};a[b]=d();return a},e,f,g)}}})("click");a.ca=function(){};a.ca.prototype.renderTemplateSource=function(){throw Error("Override renderTemplateSource");};a.ca.prototype.createJavaScriptEvaluatorBlock=function(){throw Error("Override createJavaScriptEvaluatorBlock");};a.ca.prototype.makeTemplateSource=function(b,c){if("string"==typeof b){c=c||w;var d=c.getElementById(b);if(!d)throw Error("Cannot find template with ID "+b);return new a.B.D(d)}if(1==b.nodeType||8==b.nodeType)return new a.B.ia(b);
throw Error("Unknown template type: "+b);};a.ca.prototype.renderTemplate=function(a,c,d,e){a=this.makeTemplateSource(a,e);return this.renderTemplateSource(a,c,d,e)};a.ca.prototype.isTemplateRewritten=function(a,c){return!1===this.allowTemplateRewriting?!0:this.makeTemplateSource(a,c).data("isRewritten")};a.ca.prototype.rewriteTemplate=function(a,c,d){a=this.makeTemplateSource(a,d);c=c(a.text());a.text(c);a.data("isRewritten",!0)};a.b("templateEngine",a.ca);a.ic=function(){function b(b,c,d,h){b=a.m.Zb(b);
for(var m=a.m.Ra,l=0;l<b.length;l++){var k=b[l].key;if(Object.prototype.hasOwnProperty.call(m,k)){var q=m[k];if("function"===typeof q){if(k=q(b[l].value))throw Error(k);}else if(!q)throw Error("This template engine does not support the '"+k+"' binding within its templates");}}d="ko.__tr_ambtns(function($context,$element){return(function(){return{ "+a.m.ub(b,{valueAccessors:!0})+" } })()},'"+d.toLowerCase()+"')";return h.createJavaScriptEvaluatorBlock(d)+c}var c=/(<([a-z]+\d*)(?:\s+(?!data-bind\s*=\s*)[a-z0-9\-]+(?:=(?:\"[^\"]*\"|\'[^\']*\'|[^>]*))?)*\s+)data-bind\s*=\s*(["'])([\s\S]*?)\3/gi,
d=/\x3c!--\s*ko\b\s*([\s\S]*?)\s*--\x3e/g;return{wd:function(b,c,d){c.isTemplateRewritten(b,d)||c.rewriteTemplate(b,function(b){return a.ic.Kd(b,c)},d)},Kd:function(a,f){return a.replace(c,function(a,c,d,e,k){return b(k,c,d,f)}).replace(d,function(a,c){return b(c,"\x3c!-- ko --\x3e","#comment",f)})},ld:function(b,c){return a.aa.Wb(function(d,h){var m=d.nextSibling;m&&m.nodeName.toLowerCase()===c&&a.eb(m,b,h)})}}}();a.b("__tr_ambtns",a.ic.ld);(function(){a.B={};a.B.D=function(b){if(this.D=b){var c=
a.a.P(b);this.Db="script"===c?1:"textarea"===c?2:"template"==c&&b.content&&11===b.content.nodeType?3:4}};a.B.D.prototype.text=function(){var b=1===this.Db?"text":2===this.Db?"value":"innerHTML";if(0==arguments.length)return this.D[b];var c=arguments[0];"innerHTML"===b?a.a.dc(this.D,c):this.D[b]=c};var b=a.a.g.Z()+"_";a.B.D.prototype.data=function(c){if(1===arguments.length)return a.a.g.get(this.D,b+c);a.a.g.set(this.D,b+c,arguments[1])};var c=a.a.g.Z();a.B.D.prototype.nodes=function(){var b=this.D;
if(0==arguments.length){var e=a.a.g.get(b,c)||{},f=e.jb||(3===this.Db?b.content:4===this.Db?b:p);if(!f||e.hd)if(e=this.text())f=a.a.Ld(e,b.ownerDocument),this.text(""),a.a.g.set(b,c,{jb:f,hd:!0});return f}a.a.g.set(b,c,{jb:arguments[0]})};a.B.ia=function(a){this.D=a};a.B.ia.prototype=new a.B.D;a.B.ia.prototype.constructor=a.B.ia;a.B.ia.prototype.text=function(){if(0==arguments.length){var b=a.a.g.get(this.D,c)||{};b.jc===p&&b.jb&&(b.jc=b.jb.innerHTML);return b.jc}a.a.g.set(this.D,c,{jc:arguments[0]})};
a.b("templateSources",a.B);a.b("templateSources.domElement",a.B.D);a.b("templateSources.anonymousTemplate",a.B.ia)})();(function(){function b(b,c,d){var e;for(c=a.h.nextSibling(c);b&&(e=b)!==c;)b=a.h.nextSibling(e),d(e,b)}function c(c,d){if(c.length){var e=c[0],f=c[c.length-1],g=e.parentNode,h=a.ga.instance,m=h.preprocessNode;if(m){b(e,f,function(a,b){var c=a.previousSibling,d=m.call(h,a);d&&(a===e&&(e=d[0]||b),a===f&&(f=d[d.length-1]||c))});c.length=0;if(!e)return;e===f?c.push(e):(c.push(e,f),a.a.Ua(c,
g))}b(e,f,function(b){1!==b.nodeType&&8!==b.nodeType||a.uc(d,b)});b(e,f,function(b){1!==b.nodeType&&8!==b.nodeType||a.aa.bd(b,[d])});a.a.Ua(c,g)}}function d(a){return a.nodeType?a:0<a.length?a[0]:null}function e(b,e,f,h,m){m=m||{};var p=(b&&d(b)||f||{}).ownerDocument,A=m.templateEngine||g;a.ic.wd(f,A,p);f=A.renderTemplate(f,h,m,p);if("number"!=typeof f.length||0<f.length&&"number"!=typeof f[0].nodeType)throw Error("Template engine must return an array of DOM nodes");p=!1;switch(e){case "replaceChildren":a.h.ua(b,
f);p=!0;break;case "replaceNode":a.a.Wc(b,f);p=!0;break;case "ignoreTargetNode":break;default:throw Error("Unknown renderMode: "+e);}p&&(c(f,h),m.afterRender&&a.v.K(m.afterRender,null,[f,h[m.as||"$data"]]),"replaceChildren"==e&&a.j.Ga(b,a.j.T));return f}function f(b,c,d){return a.N(b)?b():"function"===typeof b?b(c,d):b}var g;a.ec=function(b){if(b!=p&&!(b instanceof a.ca))throw Error("templateEngine must inherit from ko.templateEngine");g=b};a.bc=function(b,c,h,m,r){h=h||{};if((h.templateEngine||g)==
p)throw Error("Set a template engine before calling renderTemplate");r=r||"replaceChildren";if(m){var y=d(m);return a.$(function(){var g=c&&c instanceof a.fa?c:new a.fa(c,null,null,null,{exportDependencies:!0}),p=f(b,g.$data,g),g=e(m,r,p,g,h);"replaceNode"==r&&(m=g,y=d(m))},null,{Sa:function(){return!y||!a.a.Rb(y)},l:y&&"replaceNode"==r?y.parentNode:y})}return a.aa.Wb(function(d){a.bc(b,c,h,d,"replaceNode")})};a.Pd=function(b,d,g,h,m){function y(b,c){a.v.K(a.a.cc,null,[h,b,u,g,t,c]);a.j.Ga(h,a.j.T)}
function t(a,b){c(b,v);g.afterRender&&g.afterRender(b,a);v=null}function u(a,c){v=m.createChildContext(a,{as:B,noChildContext:g.noChildContext,extend:function(a){a.$index=c;B&&(a[B+"Index"]=c)}});var d=f(b,a,v);return e(h,"ignoreTargetNode",d,v,g)}var v,B=g.as,w=!1===g.includeDestroyed||a.options.foreachHidesDestroyed&&!g.includeDestroyed;if(w||g.beforeRemove||!a.Oc(d))return a.$(function(){var b=a.a.c(d)||[];"undefined"==typeof b.length&&(b=[b]);w&&(b=a.a.fb(b,function(b){return b===p||null===b||
!a.a.c(b._destroy)}));y(b)},null,{l:h});y(d.w());var z=d.subscribe(function(a){y(d(),a)},null,"arrayChange");z.l(h);return z};var h=a.a.g.Z(),m=a.a.g.Z();a.f.template={init:function(b,c){var d=a.a.c(c());if("string"==typeof d||d.name)a.h.Ea(b);else if("nodes"in d){d=d.nodes||[];if(a.N(d))throw Error('The "nodes" option must be a plain, non-observable array.');var e=d[0]&&d[0].parentNode;e&&a.a.g.get(e,m)||(e=a.a.Xb(d),a.a.g.set(e,m,!0));(new a.B.ia(b)).nodes(e)}else if(d=a.h.childNodes(b),0<d.length)e=
a.a.Xb(d),(new a.B.ia(b)).nodes(e);else throw Error("Anonymous template defined, but no template content was provided");return{controlsDescendantBindings:!0}},update:function(b,c,d,e,f){var g=c();c=a.a.c(g);d=!0;e=null;"string"==typeof c?c={}:(g=c.name,"if"in c&&(d=a.a.c(c["if"])),d&&"ifnot"in c&&(d=!a.a.c(c.ifnot)));"foreach"in c?e=a.Pd(g||b,d&&c.foreach||[],c,b,f):d?(d=f,"data"in c&&(d=f.createChildContext(c.data,{as:c.as,noChildContext:c.noChildContext,exportDependencies:!0})),e=a.bc(g||b,d,c,
b)):a.h.Ea(b);f=e;(c=a.a.g.get(b,h))&&"function"==typeof c.s&&c.s();a.a.g.set(b,h,!f||f.ja&&!f.ja()?p:f)}};a.m.Ra.template=function(b){b=a.m.Zb(b);return 1==b.length&&b[0].unknown||a.m.Hd(b,"name")?null:"This template engine does not support anonymous templates nested within its templates"};a.h.ea.template=!0})();a.b("setTemplateEngine",a.ec);a.b("renderTemplate",a.bc);a.a.Jc=function(a,c,d){if(a.length&&c.length){var e,f,g,h,m;for(e=f=0;(!d||e<d)&&(h=a[f]);++f){for(g=0;m=c[g];++g)if(h.value===m.value){h.moved=
m.index;m.moved=h.index;c.splice(g,1);e=g=0;break}e+=g}}};a.a.Ob=function(){function b(b,d,e,f,g){var h=Math.min,m=Math.max,l=[],k,p=b.length,n,r=d.length,t=r-p||1,A=p+r+1,u,v,w;for(k=0;k<=p;k++)for(v=u,l.push(u=[]),w=h(r,k+t),n=m(0,k-1);n<=w;n++)u[n]=n?k?b[k-1]===d[n-1]?v[n-1]:h(v[n]||A,u[n-1]||A)+1:n+1:k+1;h=[];m=[];t=[];k=p;for(n=r;k||n;)r=l[k][n]-1,n&&r===l[k][n-1]?m.push(h[h.length]={status:e,value:d[--n],index:n}):k&&r===l[k-1][n]?t.push(h[h.length]={status:f,value:b[--k],index:k}):(--n,--k,
g.sparse||h.push({status:"retained",value:d[n]}));a.a.Jc(t,m,!g.dontLimitMoves&&10*p);return h.reverse()}return function(a,d,e){e="boolean"===typeof e?{dontLimitMoves:e}:e||{};a=a||[];d=d||[];return a.length<d.length?b(a,d,"added","deleted",e):b(d,a,"deleted","added",e)}}();a.b("utils.compareArrays",a.a.Ob);(function(){function b(b,c,d,h,m){var l=[],k=a.$(function(){var k=c(d,m,a.a.Ua(l,b))||[];0<l.length&&(a.a.Wc(l,k),h&&a.v.K(h,null,[d,k,m]));l.length=0;a.a.gb(l,k)},null,{l:b,Sa:function(){return!a.a.jd(l)}});
return{Y:l,$:k.ja()?k:p}}var c=a.a.g.Z(),d=a.a.g.Z();a.a.cc=function(e,f,g,h,m,l){function k(b){x={Aa:b,nb:a.sa(w++)};v.push(x);t||F.push(x)}function q(b){x=r[b];w!==x.nb.w()&&D.push(x);x.nb(w++);a.a.Ua(x.Y,e);v.push(x)}function n(b,c){if(b)for(var d=0,e=c.length;d<e;d++)a.a.C(c[d].Y,function(a){b(a,d,c[d].Aa)})}f=f||[];"undefined"==typeof f.length&&(f=[f]);h=h||{};var r=a.a.g.get(e,c),t=!r,v=[],u=0,w=0,B=[],z=[],C=[],D=[],F=[],x,I=0;if(t)a.a.C(f,k);else{if(!l||r&&r._countWaitingForRemove){var E=
a.a.Mb(r,function(a){return a.Aa});l=a.a.Ob(E,f,{dontLimitMoves:h.dontLimitMoves,sparse:!0})}for(var E=0,G,H,K;G=l[E];E++)switch(H=G.moved,K=G.index,G.status){case "deleted":for(;u<K;)q(u++);H===p&&(x=r[u],x.$&&(x.$.s(),x.$=p),a.a.Ua(x.Y,e).length&&(h.beforeRemove&&(v.push(x),I++,x.Aa===d?x=null:C.push(x)),x&&B.push.apply(B,x.Y)));u++;break;case "added":for(;w<K;)q(u++);H!==p?(z.push(v.length),q(H)):k(G.value)}for(;w<f.length;)q(u++);v._countWaitingForRemove=I}a.a.g.set(e,c,v);n(h.beforeMove,D);a.a.C(B,
h.beforeRemove?a.na:a.removeNode);var M,O,P;try{P=e.ownerDocument.activeElement}catch(N){}if(z.length)for(;(E=z.shift())!=p;){x=v[E];for(M=p;E;)if((O=v[--E].Y)&&O.length){M=O[O.length-1];break}for(f=0;u=x.Y[f];M=u,f++)a.h.Vb(e,u,M)}E=0;for(z=a.h.firstChild(e);x=v[E];E++){x.Y||a.a.extend(x,b(e,g,x.Aa,m,x.nb));for(f=0;u=x.Y[f];z=u.nextSibling,M=u,f++)u!==z&&a.h.Vb(e,u,M);!x.Dd&&m&&(m(x.Aa,x.Y,x.nb),x.Dd=!0,M=x.Y[x.Y.length-1])}P&&e.ownerDocument.activeElement!=P&&P.focus();n(h.beforeRemove,C);for(E=
0;E<C.length;++E)C[E].Aa=d;n(h.afterMove,D);n(h.afterAdd,F)}})();a.b("utils.setDomNodeChildrenFromArrayMapping",a.a.cc);a.ba=function(){this.allowTemplateRewriting=!1};a.ba.prototype=new a.ca;a.ba.prototype.constructor=a.ba;a.ba.prototype.renderTemplateSource=function(b,c,d,e){if(c=(9>a.a.W?0:b.nodes)?b.nodes():null)return a.a.la(c.cloneNode(!0).childNodes);b=b.text();return a.a.ta(b,e)};a.ba.Na=new a.ba;a.ec(a.ba.Na);a.b("nativeTemplateEngine",a.ba);(function(){a.Za=function(){var a=this.Gd=function(){if(!v||
!v.tmpl)return 0;try{if(0<=v.tmpl.tag.tmpl.open.toString().indexOf("__"))return 2}catch(a){}return 1}();this.renderTemplateSource=function(b,e,f,g){g=g||w;f=f||{};if(2>a)throw Error("Your version of jQuery.tmpl is too old. Please upgrade to jQuery.tmpl 1.0.0pre or later.");var h=b.data("precompiled");h||(h=b.text()||"",h=v.template(null,"{{ko_with $item.koBindingContext}}"+h+"{{/ko_with}}"),b.data("precompiled",h));b=[e.$data];e=v.extend({koBindingContext:e},f.templateOptions);e=v.tmpl(h,b,e);e.appendTo(g.createElement("div"));
v.fragments={};return e};this.createJavaScriptEvaluatorBlock=function(a){return"{{ko_code ((function() { return "+a+" })()) }}"};this.addTemplate=function(a,b){w.write("<script type='text/html' id='"+a+"'>"+b+"\x3c/script>")};0<a&&(v.tmpl.tag.ko_code={open:"__.push($1 || '');"},v.tmpl.tag.ko_with={open:"with($1) {",close:"} "})};a.Za.prototype=new a.ca;a.Za.prototype.constructor=a.Za;var b=new a.Za;0<b.Gd&&a.ec(b);a.b("jqueryTmplTemplateEngine",a.Za)})()})})();})();

},{}],2:[function(require,module,exports){
/*
 * Copyright 2015 Trim-marks Inc.
 * Copyright 2019 Vivliostyle Foundation
 *
 * This file is part of Vivliostyle UI.
 *
 * Vivliostyle UI is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * Vivliostyle UI is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with Vivliostyle UI.  If not, see <http://www.gnu.org/licenses/>.
 */

"use strict";

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

var _knockout = require("knockout");

var _knockout2 = _interopRequireDefault(_knockout);

var supportTouchEvents = ("ontouchstart" in window);

_knockout2["default"].bindingHandlers.menuButton = {
    init: function init(element, valueAccessor) {
        if (_knockout2["default"].unwrap(valueAccessor())) {
            if (supportTouchEvents) {
                element.addEventListener("touchstart", function () {
                    _knockout2["default"].utils.toggleDomNodeCssClass(element, "hover active", true);
                });
                element.addEventListener("touchend", function () {
                    _knockout2["default"].utils.toggleDomNodeCssClass(element, "hover active", false);
                });
            } else {
                element.addEventListener("mouseover", function () {
                    _knockout2["default"].utils.toggleDomNodeCssClass(element, "hover", true);
                });
                element.addEventListener("mousedown", function () {
                    _knockout2["default"].utils.toggleDomNodeCssClass(element, "active", true);
                });
                element.addEventListener("mouseup", function () {
                    _knockout2["default"].utils.toggleDomNodeCssClass(element, "active", false);
                });
                element.addEventListener("mouseout", function () {
                    _knockout2["default"].utils.toggleDomNodeCssClass(element, "hover", false);
                    _knockout2["default"].utils.toggleDomNodeCssClass(element, "active", false);
                    window.getSelection().removeAllRanges(); // prevent unwanted text selection
                });
            }
        }
    }
};

},{"knockout":1}],3:[function(require,module,exports){
/*
 * Copyright 2018 Vivliostyle Foundation
 *
 * This file is part of Vivliostyle UI.
 *
 * Vivliostyle UI is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * Vivliostyle UI is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with Vivliostyle UI.  If not, see <http://www.gnu.org/licenses/>.
 */

"use strict";

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

var _knockout = require("knockout");

var _knockout2 = _interopRequireDefault(_knockout);

var supportTouchEvents = ("ontouchstart" in window);

var xStart = null;
var yStart = null;
var arrowButton = null;

_knockout2["default"].bindingHandlers.swipePages = {
    init: function init(element, valueAccessor) {
        if (supportTouchEvents && _knockout2["default"].unwrap(valueAccessor())) {
            element.addEventListener("touchstart", function (event) {
                if (event.touches.length > 1) {
                    return; // multi-touch is not for page swipe
                }
                if (window.visualViewport && window.visualViewport.scale > 1) {
                    return; // disable page swipe when pinch-zoomed
                }
                var viewportElement = document.getElementById("vivliostyle-viewer-viewport");
                if (viewportElement && viewportElement.scrollWidth > viewportElement.clientWidth) {
                    return; // disable page swipe when horizontal scrollable
                }
                xStart = event.touches[0].clientX;
                yStart = event.touches[0].clientY;
            });
            element.addEventListener("touchmove", function (event) {
                if (event.touches.length > 1) {
                    return;
                }
                if (xStart !== null && yStart !== null) {
                    var xDiff = event.touches[0].clientX - xStart;
                    var yDiff = event.touches[0].clientY - yStart;
                    if (Math.abs(xDiff) > Math.abs(yDiff)) {
                        if (xDiff < 0) {
                            // swipe to left = go to right
                            arrowButton = document.getElementById("vivliostyle-page-navigation-right");
                        } else {
                            // swipe to right = go to left
                            arrowButton = document.getElementById("vivliostyle-page-navigation-left");
                        }
                    }
                    if (Math.abs(xDiff) + Math.abs(yDiff) >= 16) {
                        if (arrowButton) {
                            arrowButton.click();
                            _knockout2["default"].utils.toggleDomNodeCssClass(arrowButton, "active", true);
                        }
                        xStart = null;
                        yStart = null;
                    }
                }
            });
            element.addEventListener("touchend", function (event) {
                if (arrowButton) {
                    _knockout2["default"].utils.toggleDomNodeCssClass(arrowButton, "active", false);
                }
                arrowButton = null;
                xStart = null;
                yStart = null;
            });
        }
    }
};

},{"knockout":1}],4:[function(require,module,exports){
/*
 * Copyright 2015 Trim-marks Inc.
 *
 * This file is part of Vivliostyle UI.
 *
 * Vivliostyle UI is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * Vivliostyle UI is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with Vivliostyle UI.  If not, see <http://www.gnu.org/licenses/>.
 */

"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var _modelsMessageQueue = require("../models/message-queue");

var _modelsMessageQueue2 = _interopRequireDefault(_modelsMessageQueue);

var LogLevel = {
    DEBUG: "debug",
    INFO: "info",
    WARN: "warn",
    ERROR: "error"
};

var Logger = (function () {
    function Logger() {
        _classCallCheck(this, Logger);

        this.logLevel = LogLevel.ERROR;
    }

    _createClass(Logger, [{
        key: "setLogLevel",
        value: function setLogLevel(logLevel) {
            this.logLevel = logLevel;
        }
    }, {
        key: "debug",
        value: function debug(content) {
            if (this.logLevel === LogLevel.DEBUG) {
                _modelsMessageQueue2["default"].push({
                    type: "debug",
                    content: content
                });
            }
        }
    }, {
        key: "info",
        value: function info(content) {
            if (this.logLevel === LogLevel.DEBUG || this.logLevel === LogLevel.INFO) {
                _modelsMessageQueue2["default"].push({
                    type: "info",
                    content: content
                });
            }
        }
    }, {
        key: "warn",
        value: function warn(content) {
            if (this.logLevel === LogLevel.DEBUG || this.logLevel === LogLevel.INFO || this.logLevel === LogLevel.WARN) {
                _modelsMessageQueue2["default"].push({
                    type: "warn",
                    content: content
                });
            }
        }
    }, {
        key: "error",
        value: function error(content) {
            if (this.logLevel === LogLevel.DEBUG || this.logLevel === LogLevel.INFO || this.logLevel === LogLevel.WARN || this.logLevel === LogLevel.ERROR) {
                _modelsMessageQueue2["default"].push({
                    type: "error",
                    content: content
                });
            }
        }
    }]);

    return Logger;
})();

Logger.LogLevel = LogLevel;

var instance = new Logger();

Logger.getLogger = function () {
    return instance;
};

exports["default"] = Logger;
module.exports = exports["default"];

},{"../models/message-queue":7}],5:[function(require,module,exports){
/*
 * Copyright 2015 Trim-marks Inc.
 *
 * This file is part of Vivliostyle UI.
 *
 * Vivliostyle UI is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * Vivliostyle UI is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with Vivliostyle UI.  If not, see <http://www.gnu.org/licenses/>.
 */

"use strict";

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

var _vivliostyle = require("vivliostyle");

var _vivliostyle2 = _interopRequireDefault(_vivliostyle);

var _modelsVivliostyle = require("./models/vivliostyle");

var _modelsVivliostyle2 = _interopRequireDefault(_modelsVivliostyle);

var _vivliostyleViewer = require("./vivliostyle-viewer");

var _vivliostyleViewer2 = _interopRequireDefault(_vivliostyleViewer);

_modelsVivliostyle2["default"].setInstance(_vivliostyle2["default"]);
_vivliostyleViewer2["default"].start();

},{"./models/vivliostyle":11,"./vivliostyle-viewer":22,"vivliostyle":23}],6:[function(require,module,exports){
/*
 * Copyright 2015 Trim-marks Inc.
 * Copyright 2019 Vivliostyle Foundation
 *
 * This file is part of Vivliostyle UI.
 *
 * Vivliostyle UI is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * Vivliostyle UI is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with Vivliostyle UI.  If not, see <http://www.gnu.org/licenses/>.
 */

"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var _knockout = require("knockout");

var _knockout2 = _interopRequireDefault(_knockout);

var _storesUrlParameters = require("../stores/url-parameters");

var _storesUrlParameters2 = _interopRequireDefault(_storesUrlParameters);

var _pageStyle = require("./page-style");

var _pageStyle2 = _interopRequireDefault(_pageStyle);

function getDocumentOptionsFromURL() {
    var bookUrl = _storesUrlParameters2["default"].getParameter("b", true);
    var xUrl = _storesUrlParameters2["default"].getParameter("x", true);
    var fragment = _storesUrlParameters2["default"].getParameter("f", true);
    var style = _storesUrlParameters2["default"].getParameter("style", true);
    var userStyle = _storesUrlParameters2["default"].getParameter("userStyle", true);
    return {
        bookUrl: bookUrl[0] || null, // bookUrl and xUrl are exclusive
        xUrl: !bookUrl[0] && xUrl.length && xUrl[0] ? xUrl : null,
        fragment: fragment[0] || null,
        authorStyleSheet: style.length ? style : [],
        userStyleSheet: userStyle.length ? userStyle : []
    };
}

var DocumentOptions = (function () {
    function DocumentOptions() {
        var _this = this;

        _classCallCheck(this, DocumentOptions);

        var urlOptions = getDocumentOptionsFromURL();
        this.bookUrl = _knockout2["default"].observable(urlOptions.bookUrl || "");
        this.xUrl = _knockout2["default"].observable(urlOptions.xUrl || null);
        this.fragment = _knockout2["default"].observable(urlOptions.fragment || "");
        this.authorStyleSheet = _knockout2["default"].observable(urlOptions.authorStyleSheet);
        this.userStyleSheet = _knockout2["default"].observable(urlOptions.userStyleSheet);
        this.pageStyle = new _pageStyle2["default"]();
        this.dataUserStyleIndex = -1;

        // write fragment back to URL when updated
        this.fragment.subscribe(function (fragment) {
            if (/^epubcfi\(\/([246]\/)?2!\)/.test(fragment)) {
                _storesUrlParameters2["default"].removeParameter("f");
            } else {
                var encoded = fragment.replace(/[\s+&?=#\u007F-\uFFFF]+/g, encodeURIComponent);
                _storesUrlParameters2["default"].setParameter("f", encoded, true);
            }
        });

        // read userStyle=data:.<cssText> URL parameter
        urlOptions.userStyleSheet.find(function (userStyle, index) {
            // Find userStyle parameter that starts with "data:" and contains "/*<viewer>*/".
            if (/^data:,.*?\/\*(?:<|%3C)viewer(?:>|%3E)\*\//.test(userStyle)) {
                _this.dataUserStyleIndex = index;
                var data = userStyle.replace(/^data:,/, "")
                // Escape unescaped "%" that causes error in decodeURI()
                .replace(/%(?![0-9A-Fa-f]{2})/g, "%25");
                var cssText = decodeURI(data);
                _this.pageStyle.cssText(cssText);
                return true;
            } else {
                return false;
            }
        });

        // write cssText back to URL parameter userStyle= when updated
        this.pageStyle.cssText.subscribe(function (cssText) {
            _this.updateUserStyleSheetFromCSSText(cssText);
        });
    }

    _createClass(DocumentOptions, [{
        key: "toObject",
        value: function toObject() {
            function convertStyleSheetArray(arr) {
                return arr.map(function (url) {
                    return {
                        url: url
                    };
                });
            }
            // Do not include url
            // (url is a required argument to Viewer.loadDocument, separated from other options)
            return {
                fragment: this.fragment(),
                authorStyleSheet: convertStyleSheetArray(this.authorStyleSheet()),
                userStyleSheet: convertStyleSheetArray(this.userStyleSheet())
            };
        }
    }, {
        key: "updateUserStyleSheetFromCSSText",
        value: function updateUserStyleSheetFromCSSText(cssText) {
            if (cssText == undefined) {
                cssText = this.pageStyle.toCSSText();
            }
            var userStyleSheet = this.userStyleSheet();
            if (!cssText || /^\s*(\/\*.*?\*\/\s*)*$/.test(cssText)) {
                if (userStyleSheet.length <= (this.dataUserStyleIndex == -1 ? 0 : 1)) {
                    userStyleSheet.pop();
                    this.dataUserStyleIndex = -1;
                    this.userStyleSheet(userStyleSheet);
                    _storesUrlParameters2["default"].removeParameter("userStyle");
                    return;
                }
            }
            var dataUserStyle = "data:," + encodeURI(cssText.trim());
            if (this.dataUserStyleIndex == -1) {
                userStyleSheet.push(dataUserStyle);
                this.dataUserStyleIndex = userStyleSheet.length - 1;
            } else {
                userStyleSheet[this.dataUserStyleIndex] = dataUserStyle;
            }
            this.userStyleSheet(userStyleSheet);
            _storesUrlParameters2["default"].setParameter("userStyle", dataUserStyle, true, this.dataUserStyleIndex);
        }
    }]);

    return DocumentOptions;
})();

exports["default"] = DocumentOptions;
module.exports = exports["default"];

},{"../stores/url-parameters":13,"./page-style":8,"knockout":1}],7:[function(require,module,exports){
/*
 * Copyright 2015 Trim-marks Inc.
 *
 * This file is part of Vivliostyle UI.
 *
 * Vivliostyle UI is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * Vivliostyle UI is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with Vivliostyle UI.  If not, see <http://www.gnu.org/licenses/>.
 */

"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

var _knockout = require("knockout");

var _knockout2 = _interopRequireDefault(_knockout);

function MessageQueue() {
  return _knockout2["default"].observableArray();
}

exports["default"] = new MessageQueue();
module.exports = exports["default"];

},{"knockout":1}],8:[function(require,module,exports){
/*
 * Copyright 2015 Trim-marks Inc.
 * Copyright 2019 Vivliostyle Foundation
 *
 * This file is part of Vivliostyle UI.
 *
 * Vivliostyle UI is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * Vivliostyle UI is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with Vivliostyle UI.  If not, see <http://www.gnu.org/licenses/>.
 */

"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _slicedToArray = (function () { function sliceIterator(arr, i) { var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i["return"]) _i["return"](); } finally { if (_d) throw _e; } } return _arr; } return function (arr, i) { if (Array.isArray(arr)) { return arr; } else if (Symbol.iterator in Object(arr)) { return sliceIterator(arr, i); } else { throw new TypeError("Invalid attempt to destructure non-iterable instance"); } }; })();

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var _knockout = require("knockout");

var _knockout2 = _interopRequireDefault(_knockout);

var Mode = {
    DEFAULT: "",
    AUTO: "auto",
    PRESET: "preset",
    CUSTOM: "custom",
    ZERO: "0"
};

var PresetSize = [{ name: "A5", description: "A5" }, { name: "A4", description: "A4" }, { name: "A3", description: "A3" }, { name: "B5", description: "B5 (ISO)" }, { name: "B4", description: "B4 (ISO)" }, { name: "JIS-B5", description: "B5 (JIS)" }, { name: "JIS-B4", description: "B4 (JIS)" }, { name: "letter", description: "letter" }, { name: "legal", description: "legal" }, { name: "ledger", description: "ledger" }];

var Constants = {
    customWidth: "210mm",
    customHeight: "297mm",
    customMargin: "10%",
    baseFontSize: "12pt",
    baseLineHeight: "1.2",
    baseFontFamily: "serif",
    viewerFontSize: 16
};

var PageStyle = (function () {
    function PageStyle(pageStyle) {
        var _this = this;

        _classCallCheck(this, PageStyle);

        this.pageSizeMode = _knockout2["default"].observable(Mode.DEFAULT);
        this.presetSize = _knockout2["default"].observable(PresetSize[1]);
        this.isLandscape = _knockout2["default"].observable(false);
        this.customWidth = _knockout2["default"].observable(Constants.customWidth);
        this.customHeight = _knockout2["default"].observable(Constants.customHeight);
        this.pageSizeImportant = _knockout2["default"].observable(false);
        this.pageMarginMode = _knockout2["default"].observable(Mode.DEFAULT);
        this.customMargin = _knockout2["default"].observable(Constants.customMargin);
        this.pageMarginImportant = _knockout2["default"].observable(false);
        this.firstPageMarginZero = _knockout2["default"].observable(false);
        this.firstPageMarginZeroImportant = _knockout2["default"].observable(false);
        this.forceHtmlBodyMarginZero = _knockout2["default"].observable(false);
        this.widowsOrphans = _knockout2["default"].observable("");
        this.widowsOrphansImportant = _knockout2["default"].observable(false);
        this.imageMaxSizeToFitPage = _knockout2["default"].observable(false);
        this.imageMaxSizeToFitPageImportant = _knockout2["default"].observable(false);
        this.imageKeepAspectRatio = _knockout2["default"].observable(false);
        this.imageKeepAspectRatioImportant = _knockout2["default"].observable(false);
        this.baseFontSize = _knockout2["default"].observable(Constants.baseFontSize);
        this.baseFontSizeSpecified = _knockout2["default"].observable(false);
        this.baseFontSizeImportant = _knockout2["default"].observable(false);
        this.baseLineHeight = _knockout2["default"].observable(Constants.baseLineHeight);
        this.baseLineHeightSpecified = _knockout2["default"].observable(false);
        this.baseLineHeightImportant = _knockout2["default"].observable(false);
        this.baseFontFamily = _knockout2["default"].observable(Constants.baseFontFamily);
        this.baseFontFamilySpecified = _knockout2["default"].observable(false);
        this.baseFontFamilyImportant = _knockout2["default"].observable(false);
        this.allImportant = _knockout2["default"].observable(false);
        this.pageOtherStyle = _knockout2["default"].observable("");
        this.firstPageOtherStyle = _knockout2["default"].observable("");
        this.rootOtherStyle = _knockout2["default"].observable("");
        this.beforeOtherStyle = _knockout2["default"].observable("");
        this.afterOtherStyle = _knockout2["default"].observable("");

        this.viewerFontSize = null;
        this.setViewerFontSizeObservable = function (viewerFontSizeObservable) {
            _this.viewerFontSize = viewerFontSizeObservable;
            var elem = document.getElementsByName("vivliostyle-settings_viewer-font-size")[0];
            if (elem) {
                elem.value = _this.fontSizePxToPercent(viewerFontSizeObservable(), 100, 5);
            }
        };

        this.viewerFontSizePercent = _knockout2["default"].pureComputed({
            read: function read() {
                if (!this.viewerFontSize) {
                    return 100;
                }
                var percent = this.fontSizePxToPercent(this.viewerFontSize(), 100, 5);
                return percent;
            },
            write: function write(viewerFontSizePercent) {
                if (!this.viewerFontSize) {
                    return;
                }
                var percent = parseFloat(viewerFontSizePercent);
                var fontSize = percent && this.fontSizePercentToPx(percent);
                if (!fontSize || fontSize < 5 || fontSize > 72) {
                    var elem = document.getElementsByName("vivliostyle-settings_viewer-font-size")[0];
                    if (elem) {
                        elem.value = "100";
                    }
                    fontSize = Constants.viewerFontSize;
                }
                this.viewerFontSize(fontSize);
            },
            owner: this
        });

        this.cssText = _knockout2["default"].pureComputed({
            read: this.toCSSText,
            write: this.fromCSSText,
            owner: this
        });

        this.allImportant.subscribe(function (allImportant) {
            _this.pageSizeImportant(allImportant);
            _this.pageMarginImportant(allImportant);
            _this.firstPageMarginZeroImportant(allImportant);
            _this.widowsOrphansImportant(allImportant);
            _this.imageMaxSizeToFitPageImportant(allImportant);
            _this.imageKeepAspectRatioImportant(allImportant);
            _this.baseFontSizeImportant(allImportant);
            _this.baseLineHeightImportant(allImportant);
            _this.baseFontFamilyImportant(allImportant);
        });

        this.pageStyleRegExp = new RegExp(

        // 1. beforeOtherStyle,
        "^(.*?)\\/\\*<viewer>\\*\\/\\s*(?:@page\\s*\\{\\s*" +

        // 2. sizeW, sizeH, sizeImportant,
        "(?:size:\\s*([^\\s!;{}]+)(?:\\s+([^\\s!;{}]+))?\\s*(!important)?(?:;|(?=[\\s{}]))\\s*)?" +

        // 5. pageMargin, pageMarginImportant,
        "(?:margin:\\s*([^\\s!;{}]+(?:\\s+[^\\s!;{}]+)?(?:\\s+[^\\s!;{}]+)?(?:\\s+[^\\s!;{}]+)?)\\s*(!important)?(?:;|(?=[\\s{}]))\\s*)?" +

        // 7. pageOtherStyle,
        "((?:[^{}]+|\\{[^{}]*\\})*)\\}\\s*)?" +

        // 8. firstPageMarginZero, firstPageMarginZeroImportant, firstPageOtherStyle,
        "(?:@page\\s*:first\\s*\\{\\s*(margin:\\s*0(?:\\w+|%)?\\s*(!important)?(?:;|(?=[\\s{}]))\\s*)?((?:[^{}]+|\\{[^{}]*\\})*)\\}\\s*)?" +

        // 11. forceHtmlBodyMarginZero,
        "((?:html|:root),\\s*body\\s*\\{\\s*margin:\\s*0(?:\\w+|%)?\\s*!important(?:;|(?=[\\s{}]))\\s*\\}\\s*)?" +

        // 12. baseFontSize, baseFontSizeImportant, baseLineHeight, baseLineHeightImportant, baseFontFamily, baseFontFamilyImportant, rootOtherStyle,
        "(?:(?:html|:root)\\s*\\{\\s*(?:font-size:\\s*(calc\\([^()]+\\)|[^\\s!;{}]+)\\s*(!important)?(?:;|(?=[\\s{}]))\\s*)?(?:line-height:\\s*([^\\s!;{}]+)\\s*(!important)?(?:;|(?=[\\s{}]))\\s*)?(?:font-family:\\s*([^\\s!;{}]+)\\s*(!important)?(?:;|(?=[\\s{}]))\\s*)?([^{}]*)\\}\\s*)?" +

        // body {font-size: inherit !important;} etc.
        "(?:body\\s*\\{\\s*(?:[-\\w]+:\\s*inherit\\s*!important(?:;|(?=[\\s{}]))\\s*)+\\}\\s*)?" +

        // 19. widowsOrphans, widowsOrphansImportant,
        "(?:\\*\\s*\\{\\s*widows:\\s*(1|999)\\s*(!important)?(?:;|(?=[\\s{}]))\\s*orphans:\\s*\\19\\s*\\20(?:;|(?=[\\s{}]))\\s*\\}\\s*)?" +

        // 21. imageMaxSizeToFitPage, imageMaxSizeToFitPageImportant, imageKeepAspectRatio, imageKeepAspectRatioImportant,
        "(?:img,\\s*svg\\s*\\{\\s*(max-inline-size:\\s*100%\\s*(!important)?(?:;|(?=[\\s{}]))\\s*max-block-size:\\s*100vb\\s*\\22(?:;|(?=[\\s{}]))\\s*)?(object-fit:\\s*contain\\s*(!important)?(?:;|(?=[\\s{}]))\\s*)?\\}\\s*)?" +

        // 25. afterOtherStyle
        "((?:\n|.)*)$");

        if (pageStyle) {
            this.copyFrom(pageStyle);
        }
    }

    /**
     * @param {number} px Font size in px unit
     * @param {number=} opt_cent When _N_ (e.g. 1) is specified, get "per _N_" value instead of percent
     * @param {number=} opt_precision When specified, converts result number to string with max _precision_ digits
     * @returns {number|string} converted percent (or per _N_) value. Returns string when opt_precision is specified.
     */

    _createClass(PageStyle, [{
        key: "fontSizePxToPercent",
        value: function fontSizePxToPercent(px, opt_cent, opt_precision) {
            var percent = px / Constants.viewerFontSize * (opt_cent || 100);
            if (opt_precision) {
                percent = percent.toPrecision(opt_precision).replace(/(?:\.0*|(\.\d*?)0+)$/, "$1");
            }
            return percent;
        }

        /**
         * @param {number} percent Font size in percent (or per _N_) unit
         * @param {number=} opt_cent When _N_ (e.g. 1) is specified, converts fromg "per _N_" value instead of percent
         * @param {number=} opt_precision When specified, converts result number to string with max _precision_ digits
         * @returns {number|string} converted font size in px unit. Returns string when opt_precision is specified.
         */
    }, {
        key: "fontSizePercentToPx",
        value: function fontSizePercentToPx(percent, opt_cent, opt_precision) {
            var px = percent / (opt_cent || 100) * Constants.viewerFontSize;
            if (opt_precision) {
                px = px.toPrecision(opt_precision).replace(/(?:\.0*|(\.\d*?)0+)$/, "$1");
            }
            return px;
        }
    }, {
        key: "fromCSSText",
        value: function fromCSSText(cssText) {
            var _this2 = this;

            var r = this.pageStyleRegExp.exec(cssText);
            if (r) {
                (function () {
                    var _r = _slicedToArray(r, 26);

                    var beforeOtherStyle = _r[1];
                    var sizeW = _r[2];
                    var sizeH = _r[3];
                    var sizeImportant = _r[4];
                    var pageMargin = _r[5];
                    var pageMarginImportant = _r[6];
                    var pageOtherStyle = _r[7];
                    var firstPageMarginZero = _r[8];
                    var firstPageMarginZeroImportant = _r[9];
                    var firstPageOtherStyle = _r[10];
                    var forceHtmlBodyMarginZero = _r[11];
                    var baseFontSize = _r[12];
                    var baseFontSizeImportant = _r[13];
                    var baseLineHeight = _r[14];
                    var baseLineHeightImportant = _r[15];
                    var baseFontFamily = _r[16];
                    var baseFontFamilyImportant = _r[17];
                    var rootOtherStyle = _r[18];
                    var widowsOrphans = _r[19];
                    var widowsOrphansImportant = _r[20];
                    var imageMaxSizeToFitPage = _r[21];
                    var imageMaxSizeToFitPageImportant = _r[22];
                    var imageKeepAspectRatio = _r[23];
                    var imageKeepAspectRatioImportant = _r[24];
                    var afterOtherStyle = _r[25];

                    var countImportant = 0;
                    var countNotImportant = 0;

                    _this2.beforeOtherStyle(beforeOtherStyle);

                    if (sizeW == "landscape" || sizeW == "portrait") {
                        _this2.isLandscape(sizeW == "landscape");
                        sizeW = sizeH;
                        sizeH = null;
                    } else if (sizeH == "landscape" || sizeH == "portrait") {
                        _this2.isLandscape(sizeH == "landscape");
                        sizeH = null;
                    }
                    if (sizeW != null) {
                        if (sizeH == null) {
                            if (sizeW == "auto") {
                                _this2.pageSizeMode(Mode.AUTO);
                            } else {
                                var presetSize = PresetSize.find(function (presetSize) {
                                    return presetSize.name.toLowerCase() == sizeW.toLowerCase();
                                });
                                if (presetSize) {
                                    _this2.pageSizeMode(Mode.PRESET);
                                    _this2.presetSize(presetSize);
                                } else {
                                    _this2.pageSizeMode(Mode.CUSTOM);
                                    _this2.customWidth(sizeW);
                                    _this2.customHeight(sizeW);
                                }
                            }
                        } else {
                            _this2.pageSizeMode(Mode.CUSTOM);
                            _this2.customWidth(sizeW);
                            _this2.customHeight(sizeH);
                        }
                        _this2.pageSizeImportant(!!sizeImportant);
                        if (sizeImportant) countImportant++;else countNotImportant++;
                    } else {
                        _this2.pageSizeMode(Mode.DEFAULT);
                    }
                    if (pageMargin != null) {
                        _this2.pageMarginMode(pageMargin == "0" ? Mode.ZERO : Mode.CUSTOM);
                        if (pageMargin == "0") {
                            _this2.pageMarginMode(Mode.ZERO);
                        } else {
                            _this2.pageMarginMode(Mode.CUSTOM);
                            _this2.customMargin(pageMargin);
                        }
                        _this2.pageMarginImportant(!!pageMarginImportant);
                        if (pageMarginImportant) countImportant++;else countNotImportant++;
                    } else {
                        _this2.pageMarginMode(Mode.DEFAULT);
                    }
                    pageOtherStyle = pageOtherStyle || "";
                    _this2.pageOtherStyle(pageOtherStyle);

                    if (firstPageMarginZero) {
                        _this2.firstPageMarginZero(true);
                        _this2.firstPageMarginZeroImportant(!!firstPageMarginZeroImportant);
                        if (firstPageMarginZeroImportant) countImportant++;else countNotImportant++;
                    } else {
                        _this2.firstPageMarginZero(false);
                    }
                    firstPageOtherStyle = firstPageOtherStyle || "";
                    _this2.firstPageOtherStyle(firstPageOtherStyle);

                    if (forceHtmlBodyMarginZero) {
                        _this2.forceHtmlBodyMarginZero(true);
                    } else {
                        _this2.forceHtmlBodyMarginZero(false);
                    }

                    if (baseFontSize != null) {
                        // This may be calc() e.g. "calc(1.25 * 12pt)" when viewer font size is 125%.
                        baseFontSize = baseFontSize.replace(/^\s*calc\([.\d]+\s*\*\s*([.\d]+\w+)\)\s*$/, "$1");
                        _this2.baseFontSizeSpecified(true);
                        _this2.baseFontSize(baseFontSize);
                        _this2.baseFontSizeImportant(!!baseFontSizeImportant);
                        if (baseFontSizeImportant) countImportant++;else countNotImportant++;
                    } else {
                        _this2.baseFontSizeSpecified(false);
                    }
                    if (baseLineHeight != null) {
                        _this2.baseLineHeightSpecified(true);
                        _this2.baseLineHeight(baseLineHeight);
                        _this2.baseLineHeightImportant(!!baseLineHeightImportant);
                        if (baseLineHeightImportant) countImportant++;else countNotImportant++;
                    } else {
                        _this2.baseLineHeightSpecified(false);
                    }
                    if (baseFontFamily != null) {
                        _this2.baseFontFamilySpecified(true);
                        _this2.baseFontFamily(baseFontFamily);
                        _this2.baseFontFamilyImportant(!!baseFontFamilyImportant);
                        if (baseFontFamilyImportant) countImportant++;else countNotImportant++;
                    } else {
                        _this2.baseFontFamilySpecified(false);
                    }
                    rootOtherStyle = rootOtherStyle || "";
                    _this2.rootOtherStyle(rootOtherStyle);

                    if (widowsOrphans != null) {
                        _this2.widowsOrphans(widowsOrphans);
                        _this2.widowsOrphansImportant(!!widowsOrphansImportant);
                        if (widowsOrphansImportant) countImportant++;else countNotImportant++;
                    } else {
                        _this2.widowsOrphans(Mode.DEFAULT);
                    }

                    if (imageMaxSizeToFitPage) {
                        _this2.imageMaxSizeToFitPage(true);
                        _this2.imageMaxSizeToFitPageImportant(!!imageMaxSizeToFitPageImportant);
                        if (imageMaxSizeToFitPageImportant) countImportant++;else countNotImportant++;
                    } else {
                        _this2.imageMaxSizeToFitPage(false);
                    }

                    if (imageKeepAspectRatio) {
                        _this2.imageKeepAspectRatio(true);
                        _this2.imageKeepAspectRatioImportant(!!imageKeepAspectRatioImportant);
                        if (imageKeepAspectRatioImportant) countImportant++;else countNotImportant++;
                    } else {
                        _this2.imageKeepAspectRatio(false);
                    }

                    afterOtherStyle = afterOtherStyle.replace(/\/\*<\/?viewer>\*\/\n?/g, "") || "";
                    _this2.afterOtherStyle(afterOtherStyle);

                    _this2.allImportant(countImportant > 0 && countNotImportant == 0);
                })();
            } else {
                // When not match
                var afterOtherStyle = cssText.replace(/\/\*<\/?viewer>\*\/\n?/g, "") || "";
                this.afterOtherStyle(afterOtherStyle);
            }
        }
    }, {
        key: "toCSSText",
        value: function toCSSText() {
            function imp(important) {
                return important ? " !important" : "";
            }

            var cssText = this.beforeOtherStyle();
            cssText += "/*<viewer>*/\n";
            if (this.pageSizeMode() != Mode.DEFAULT || this.pageMarginMode() != Mode.DEFAULT || this.pageOtherStyle()) {
                cssText += "@page { ";
                if (this.pageSizeMode() != Mode.DEFAULT) {
                    cssText += "size: ";

                    switch (this.pageSizeMode()) {
                        case Mode.AUTO:
                            cssText += "auto";
                            break;
                        case Mode.PRESET:
                            cssText += this.presetSize().name;
                            if (this.isLandscape()) {
                                cssText += " landscape";
                            }
                            break;
                        case Mode.CUSTOM:
                            cssText += this.customWidth() + " " + this.customHeight();
                            break;
                        default:
                            throw new Error("Unknown pageSizeMode " + this.pageSizeMode());
                    }
                    cssText += imp(this.pageSizeImportant()) + "; ";
                }
                if (this.pageMarginMode() != Mode.DEFAULT) {
                    cssText += "margin: ";

                    switch (this.pageMarginMode()) {
                        case Mode.AUTO:
                            cssText += "auto";
                            break;
                        case Mode.ZERO:
                            cssText += "0";
                            break;
                        case Mode.CUSTOM:
                            cssText += "" + this.customMargin();
                            break;
                        default:
                            throw new Error("Unknown pageMarginMode " + this.pageMarginMode());
                    }
                    cssText += imp(this.pageMarginImportant()) + "; ";
                }
                cssText += this.pageOtherStyle();
                cssText += "}\n";
            }

            if (this.firstPageMarginZero() || this.firstPageOtherStyle()) {
                cssText += "@page :first { ";
                if (this.firstPageMarginZero()) {
                    cssText += "margin: 0" + imp(this.firstPageMarginZeroImportant()) + "; ";
                }
                cssText += this.firstPageOtherStyle();
                cssText += "}\n";
            }

            if (this.forceHtmlBodyMarginZero()) {
                cssText += ":root, body { margin: 0 !important; }\n";
            }

            if (this.baseFontSizeSpecified() || this.baseLineHeightSpecified() || this.baseFontFamilySpecified() || this.rootOtherStyle()) {
                cssText += ":root { ";
                var baseFontSize = this.baseFontSize();
                if (this.baseFontSizeSpecified()) {
                    if (this.viewerFontSize && this.viewerFontSize() != Constants.viewerFontSize && !baseFontSize.endsWith("%")) {
                        var perOne = this.fontSizePxToPercent(this.viewerFontSize(), 1, 5);
                        cssText += "font-size: calc(" + perOne + " * " + baseFontSize + ")" + imp(this.baseFontSizeImportant()) + "; ";
                    } else {
                        cssText += "font-size: " + this.baseFontSize() + imp(this.baseFontSizeImportant()) + "; ";
                    }
                }
                if (this.baseLineHeightSpecified()) {
                    cssText += "line-height: " + this.baseLineHeight() + imp(this.baseLineHeightImportant()) + "; ";
                }
                if (this.baseFontFamilySpecified()) {
                    cssText += "font-family: " + this.baseFontFamily() + imp(this.baseFontFamilyImportant()) + "; ";
                }
                cssText += this.rootOtherStyle();
                cssText += "}\n";
            }
            if (this.baseFontSizeSpecified() && this.baseFontSizeImportant() || this.baseLineHeightSpecified() && this.baseLineHeightImportant() || this.baseFontFamilySpecified() && this.baseFontFamilyImportant()) {
                cssText += "body { ";
                if (this.baseFontSizeSpecified() && this.baseFontSizeImportant()) {
                    cssText += "font-size: inherit !important; ";
                }
                if (this.baseLineHeightSpecified() && this.baseLineHeightImportant()) {
                    cssText += "line-height: inherit !important; ";
                }
                if (this.baseFontFamilySpecified() && this.baseFontFamilyImportant()) {
                    cssText += "font-family: inherit !important; ";
                }
                cssText += "}\n";
            }

            if (this.widowsOrphans()) {
                cssText += "* { ";
                cssText += "widows: " + this.widowsOrphans() + imp(this.widowsOrphansImportant()) + "; ";
                cssText += "orphans: " + this.widowsOrphans() + imp(this.widowsOrphansImportant()) + "; ";
                cssText += "}\n";
            }

            if (this.imageMaxSizeToFitPage() || this.imageKeepAspectRatio()) {
                cssText += "img, svg { ";
                if (this.imageMaxSizeToFitPage()) {
                    cssText += "max-inline-size: 100%" + imp(this.imageMaxSizeToFitPageImportant()) + "; ";
                    cssText += "max-block-size: 100vb" + imp(this.imageMaxSizeToFitPageImportant()) + "; ";
                }
                if (this.imageKeepAspectRatio()) {
                    cssText += "object-fit: contain" + imp(this.imageKeepAspectRatioImportant()) + "; ";
                }
                cssText += "}\n";
            }

            cssText += "/*</viewer>*/\n";
            cssText += this.afterOtherStyle();

            return cssText;
        }
    }, {
        key: "copyFrom",
        value: function copyFrom(other) {
            this.pageSizeMode(other.pageSizeMode());
            this.presetSize(other.presetSize());
            this.isLandscape(other.isLandscape());
            this.customWidth(other.customWidth());
            this.customHeight(other.customHeight());
            this.pageSizeImportant(other.pageSizeImportant());
            this.pageMarginMode(other.pageMarginMode());
            this.customMargin(other.customMargin());
            this.pageMarginImportant(other.pageMarginImportant());
            this.firstPageMarginZero(other.firstPageMarginZero());
            this.firstPageMarginZeroImportant(other.firstPageMarginZeroImportant());
            this.forceHtmlBodyMarginZero(other.forceHtmlBodyMarginZero());
            this.widowsOrphans(other.widowsOrphans());
            this.widowsOrphansImportant(other.widowsOrphansImportant());
            this.imageMaxSizeToFitPage(other.imageMaxSizeToFitPage());
            this.imageMaxSizeToFitPageImportant(other.imageMaxSizeToFitPageImportant());
            this.imageKeepAspectRatio(other.imageKeepAspectRatio());
            this.imageKeepAspectRatioImportant(other.imageKeepAspectRatioImportant());
            this.baseFontSize(other.baseFontSize());
            this.baseFontSizeSpecified(other.baseFontSizeSpecified());
            this.baseFontSizeImportant(other.baseFontSizeImportant());
            this.baseLineHeight(other.baseLineHeight());
            this.baseLineHeightSpecified(other.baseLineHeightSpecified());
            this.baseLineHeightImportant(other.baseLineHeightImportant());
            this.baseFontFamily(other.baseFontFamily());
            this.baseFontFamilySpecified(other.baseFontFamilySpecified());
            this.baseFontFamilyImportant(other.baseFontFamilyImportant());
            this.allImportant(other.allImportant());
            this.pageOtherStyle(other.pageOtherStyle());
            this.firstPageOtherStyle(other.firstPageOtherStyle());
            this.rootOtherStyle(other.rootOtherStyle());
            this.beforeOtherStyle(other.beforeOtherStyle());
            this.afterOtherStyle(other.afterOtherStyle());

            if (this.viewerFontSize && other.viewerFontSize) {
                this.viewerFontSize(other.viewerFontSize());
            }
        }
    }, {
        key: "equivalentTo",
        value: function equivalentTo(other) {
            if (this.pageSizeMode() !== other.pageSizeMode()) return false;
            if (this.pageSizeMode() === Mode.PRESET && this.presetSize() !== other.presetSize()) return false;
            if (this.pageSizeMode() === Mode.PRESET && this.isLandscape() !== other.isLandscape()) return false;
            if (this.pageSizeMode() === Mode.CUSTOM && this.customWidth() !== other.customWidth()) return false;
            if (this.pageSizeMode() === Mode.CUSTOM && this.customHeight() !== other.customHeight()) return false;
            if (this.pageSizeImportant() !== other.pageSizeImportant()) return false;

            if (this.pageMarginMode() !== other.pageMarginMode()) return false;
            if (this.pageMarginMode() === Mode.CUSTOM && this.customMargin() !== other.customMargin()) return false;
            if (this.pageMarginImportant() !== other.pageMarginImportant()) return false;
            if (this.firstPageMarginZero() !== other.firstPageMarginZero()) return false;
            if (this.firstPageMarginZeroImportant() !== other.firstPageMarginZeroImportant()) return false;
            if (this.forceHtmlBodyMarginZero() !== other.forceHtmlBodyMarginZero()) return false;

            if (this.widowsOrphans() !== other.widowsOrphans()) return false;
            if (this.widowsOrphansImportant() !== other.widowsOrphansImportant()) return false;

            if (this.imageMaxSizeToFitPage() !== other.imageMaxSizeToFitPage()) return false;
            if (this.imageMaxSizeToFitPageImportant() !== other.imageMaxSizeToFitPageImportant()) return false;
            if (this.imageKeepAspectRatio() !== other.imageKeepAspectRatio()) return false;
            if (this.imageKeepAspectRatioImportant() !== other.imageKeepAspectRatioImportant()) return false;

            if (this.baseFontSizeSpecified() !== other.baseFontSizeSpecified()) return false;
            if (this.baseFontSizeSpecified() && this.baseFontSize() !== other.baseFontSize()) return false;
            if (this.baseFontSizeImportant() !== other.baseFontSizeImportant()) return false;
            if (this.baseLineHeightSpecified() !== other.baseLineHeightSpecified()) return false;
            if (this.baseLineHeightSpecified() && this.baseLineHeight() !== other.baseLineHeight()) return false;
            if (this.baseLineHeightImportant() !== other.baseLineHeightImportant()) return false;
            if (this.baseFontFamilySpecified() !== other.baseFontFamilySpecified()) return false;
            if (this.baseFontFamilySpecified() && this.baseFontFamily() !== other.baseFontFamily()) return false;
            if (this.baseFontFamilyImportant() !== other.baseFontFamilyImportant()) return false;

            if (this.allImportant() !== other.allImportant()) return false;
            if (this.pageOtherStyle() !== other.pageOtherStyle()) return false;
            if (this.firstPageOtherStyle() !== other.firstPageOtherStyle()) return false;
            if (this.rootOtherStyle() !== other.rootOtherStyle()) return false;
            if (this.beforeOtherStyle() !== other.beforeOtherStyle()) return false;
            if (this.afterOtherStyle() !== other.afterOtherStyle()) return false;

            if (!this.viewerFontSize !== !other.viewerFontSize || this.viewerFontSize && this.viewerFontSize() !== other.viewerFontSize()) return false;

            return true;
        }
    }]);

    return PageStyle;
})();

PageStyle.Mode = Mode;
PageStyle.Constants = Constants;
PageStyle.PresetSize = PageStyle.prototype.PresetSize = PresetSize;

exports["default"] = PageStyle;
module.exports = exports["default"];

},{"knockout":1}],9:[function(require,module,exports){
/*
 * Copyright 2016 Trim-marks Inc.
 *
 * This file is part of Vivliostyle UI.
 *
 * Vivliostyle UI is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * Vivliostyle UI is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with Vivliostyle UI.  If not, see <http://www.gnu.org/licenses/>.
 */

"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var _modelsVivliostyle = require("../models/vivliostyle");

var _modelsVivliostyle2 = _interopRequireDefault(_modelsVivliostyle);

var PageViewModeInstance = (function () {
    function PageViewModeInstance() {
        _classCallCheck(this, PageViewModeInstance);
    }

    _createClass(PageViewModeInstance, [{
        key: "toSpreadViewString",
        value: function toSpreadViewString() {
            switch (this) {
                case PageViewMode.SPREAD:
                    return "true";
                case PageViewMode.SINGLE_PAGE:
                    return "false";
                case PageViewMode.AUTO_SPREAD:
                    return "auto";
                default:
                    throw new Error("Invalid PageViewMode");
            }
        }
    }, {
        key: "toString",
        value: function toString() {
            switch (this) {
                case PageViewMode.SPREAD:
                    return "spread"; // vivliostyle.viewer.PageViewMode.SPREAD;
                case PageViewMode.SINGLE_PAGE:
                    return "singlePage"; // vivliostyle.viewer.PageViewMode.SINGLE_PAGE;
                case PageViewMode.AUTO_SPREAD:
                    return "autoSpread"; // vivliostyle.viewer.PageViewMode.AUTO_SPREAD;
                default:
                    throw new Error("Invalid PageViewMode");
            }
        }
    }]);

    return PageViewModeInstance;
})();

var PageViewMode = {
    AUTO_SPREAD: new PageViewModeInstance(),
    SINGLE_PAGE: new PageViewModeInstance(),
    SPREAD: new PageViewModeInstance(),
    defaultMode: function defaultMode() {
        return this.AUTO_SPREAD;
    },
    fromSpreadViewString: function fromSpreadViewString(str) {
        switch (str) {
            case "true":
                return this.SPREAD;
            case "false":
                return this.SINGLE_PAGE;
            case "auto":
            default:
                return this.AUTO_SPREAD;
        }
    },
    of: function of(name) {
        switch (name) {
            case _modelsVivliostyle2["default"].viewer.PageViewMode.SPREAD:
                return this.SPREAD;
            case _modelsVivliostyle2["default"].viewer.PageViewMode.SINGLE_PAGE:
                return this.SINGLE_PAGE;
            case _modelsVivliostyle2["default"].viewer.PageViewMode.AUTO_SPREAD:
                return this.AUTO_SPREAD;
            default:
                throw new Error("Invalid PageViewMode name: " + name);
        }
    }
};

exports["default"] = PageViewMode;
module.exports = exports["default"];

},{"../models/vivliostyle":11}],10:[function(require,module,exports){
/*
 * Copyright 2015 Trim-marks Inc.
 * Copyright 2019 Vivliostyle Foundation
 *
 * This file is part of Vivliostyle UI.
 *
 * Vivliostyle UI is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * Vivliostyle UI is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with Vivliostyle UI.  If not, see <http://www.gnu.org/licenses/>.
 */

"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var _knockout = require("knockout");

var _knockout2 = _interopRequireDefault(_knockout);

var _storesUrlParameters = require("../stores/url-parameters");

var _storesUrlParameters2 = _interopRequireDefault(_storesUrlParameters);

var _pageViewMode = require("./page-view-mode");

var _pageViewMode2 = _interopRequireDefault(_pageViewMode);

var _zoomOptions = require("./zoom-options");

var _zoomOptions2 = _interopRequireDefault(_zoomOptions);

function getViewerOptionsFromURL() {
    var renderAllPages = _storesUrlParameters2["default"].getParameter("renderAllPages")[0];
    var fontSize = _storesUrlParameters2["default"].getParameter("fontSize")[0];
    return {
        renderAllPages: renderAllPages === "true" ? true : renderAllPages === "false" ? false : null,
        fontSize: fontSize ? parseFloat(fontSize) : null,
        profile: _storesUrlParameters2["default"].getParameter("profile")[0] === "true",
        pageViewMode: _pageViewMode2["default"].fromSpreadViewString(_storesUrlParameters2["default"].getParameter("spread")[0])
    };
}

function getDefaultValues() {
    var isNotBook = _storesUrlParameters2["default"].hasParameter("x");
    return {
        renderAllPages: isNotBook,
        fontSize: 16,
        profile: false,
        pageViewMode: _pageViewMode2["default"].defaultMode(),
        zoom: _zoomOptions2["default"].createDefaultOptions()
    };
}

var ViewerOptions = (function () {
    function ViewerOptions(options) {
        var _this = this;

        _classCallCheck(this, ViewerOptions);

        this.renderAllPages = _knockout2["default"].observable();
        this.fontSize = _knockout2["default"].observable();
        this.profile = _knockout2["default"].observable();
        this.pageViewMode = _knockout2["default"].observable();
        this.zoom = _knockout2["default"].observable();
        if (options) {
            this.copyFrom(options);
        } else {
            (function () {
                var defaultValues = getDefaultValues();
                var urlOptions = getViewerOptionsFromURL();
                _this.renderAllPages(urlOptions.renderAllPages !== null ? urlOptions.renderAllPages : defaultValues.renderAllPages);
                _this.fontSize(urlOptions.fontSize || defaultValues.fontSize);
                _this.profile(urlOptions.profile || defaultValues.profile);
                _this.pageViewMode(urlOptions.pageViewMode || defaultValues.pageViewMode);
                _this.zoom(defaultValues.zoom);

                // write spread parameter back to URL when updated
                _this.pageViewMode.subscribe(function (pageViewMode) {
                    if (pageViewMode === defaultValues.pageViewMode) {
                        _storesUrlParameters2["default"].removeParameter("spread");
                    } else {
                        _storesUrlParameters2["default"].setParameter("spread", pageViewMode.toSpreadViewString());
                    }
                });
                _this.renderAllPages.subscribe(function (renderAllPages) {
                    if (renderAllPages === defaultValues.renderAllPages) {
                        _storesUrlParameters2["default"].removeParameter("renderAllPages");
                    } else {
                        _storesUrlParameters2["default"].setParameter("renderAllPages", renderAllPages.toString());
                    }
                });
                _this.fontSize.subscribe(function (fontSize) {
                    if (typeof fontSize == "number") {
                        fontSize = fontSize.toPrecision(10).replace(/(?:\.0*|(\.\d*?)0+)$/, "$1");
                    }
                    if (fontSize == defaultValues.fontSize) {
                        _storesUrlParameters2["default"].removeParameter("fontSize");
                    } else {
                        _storesUrlParameters2["default"].setParameter("fontSize", fontSize + "/" + defaultValues.fontSize);
                    }
                });
            })();
        }
    }

    _createClass(ViewerOptions, [{
        key: "copyFrom",
        value: function copyFrom(other) {
            this.renderAllPages(other.renderAllPages());
            this.fontSize(other.fontSize());
            this.profile(other.profile());
            this.pageViewMode(other.pageViewMode());
            this.zoom(other.zoom());
        }
    }, {
        key: "toObject",
        value: function toObject() {
            return {
                renderAllPages: this.renderAllPages(),
                fontSize: this.fontSize(),
                pageViewMode: this.pageViewMode().toString(),
                zoom: this.zoom().zoom,
                fitToScreen: this.zoom().fitToScreen
            };
        }
    }]);

    return ViewerOptions;
})();

ViewerOptions.getDefaultValues = getDefaultValues;

exports["default"] = ViewerOptions;
module.exports = exports["default"];

},{"../stores/url-parameters":13,"./page-view-mode":9,"./zoom-options":12,"knockout":1}],11:[function(require,module,exports){
/*
 * Copyright 2015 Trim-marks Inc.
 *
 * This file is part of Vivliostyle UI.
 *
 * Vivliostyle UI is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * Vivliostyle UI is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with Vivliostyle UI.  If not, see <http://www.gnu.org/licenses/>.
 */

"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var Vivliostyle = (function () {
    function Vivliostyle() {
        _classCallCheck(this, Vivliostyle);

        this.viewer = null;
        this.constants = null;
        this.profile = null;
    }

    _createClass(Vivliostyle, [{
        key: "setInstance",
        value: function setInstance(vivliostyle) {
            this.viewer = vivliostyle.viewer;
            this.constants = vivliostyle.constants;
            this.profile = vivliostyle.profile;
        }
    }]);

    return Vivliostyle;
})();

exports["default"] = new Vivliostyle();
module.exports = exports["default"];

},{}],12:[function(require,module,exports){
/*
 * Copyright 2016 Trim-marks Inc.
 *
 * This file is part of Vivliostyle UI.
 *
 * Vivliostyle UI is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * Vivliostyle UI is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with Vivliostyle UI.  If not, see <http://www.gnu.org/licenses/>.
 */

"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _get = function get(_x, _x2, _x3) { var _again = true; _function: while (_again) { var object = _x, property = _x2, receiver = _x3; _again = false; if (object === null) object = Function.prototype; var desc = Object.getOwnPropertyDescriptor(object, property); if (desc === undefined) { var parent = Object.getPrototypeOf(object); if (parent === null) { return undefined; } else { _x = parent; _x2 = property; _x3 = receiver; _again = true; desc = parent = undefined; continue _function; } } else if ("value" in desc) { return desc.value; } else { var getter = desc.get; if (getter === undefined) { return undefined; } return getter.call(receiver); } } };

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var _modelsVivliostyle = require("../models/vivliostyle");

var _modelsVivliostyle2 = _interopRequireDefault(_modelsVivliostyle);

var ZoomOptions = (function () {
    function ZoomOptions(zoom) {
        _classCallCheck(this, ZoomOptions);

        this.zoom = zoom;
    }

    _createClass(ZoomOptions, [{
        key: "zoomIn",
        value: function zoomIn(viewer) {
            return new FixedZoomFactor(this.getCurrentZoomFactor(viewer) * 1.25);
        }
    }, {
        key: "zoomOut",
        value: function zoomOut(viewer) {
            return new FixedZoomFactor(this.getCurrentZoomFactor(viewer) * 0.8);
        }
    }, {
        key: "zoomToActualSize",
        value: function zoomToActualSize() {
            return new FixedZoomFactor(1);
        }
    }], [{
        key: "createDefaultOptions",
        value: function createDefaultOptions() {
            return new FitToScreen();
        }
    }, {
        key: "createFromZoomFactor",
        value: function createFromZoomFactor(zoom) {
            return new FixedZoomFactor(zoom);
        }
    }]);

    return ZoomOptions;
})();

var FitToScreen = (function (_ZoomOptions) {
    _inherits(FitToScreen, _ZoomOptions);

    function FitToScreen() {
        _classCallCheck(this, FitToScreen);

        _get(Object.getPrototypeOf(FitToScreen.prototype), "constructor", this).call(this, 1);
    }

    _createClass(FitToScreen, [{
        key: "toggleFitToScreen",
        value: function toggleFitToScreen() {
            return new FixedZoomFactor(1);
        }
    }, {
        key: "getCurrentZoomFactor",
        value: function getCurrentZoomFactor(viewer) {
            return viewer.queryZoomFactor(_modelsVivliostyle2["default"].viewer.ZoomType.FIT_INSIDE_VIEWPORT);
        }
    }, {
        key: "fitToScreen",
        get: function get() {
            return true;
        }
    }]);

    return FitToScreen;
})(ZoomOptions);

var FixedZoomFactor = (function (_ZoomOptions2) {
    _inherits(FixedZoomFactor, _ZoomOptions2);

    function FixedZoomFactor() {
        _classCallCheck(this, FixedZoomFactor);

        _get(Object.getPrototypeOf(FixedZoomFactor.prototype), "constructor", this).apply(this, arguments);
    }

    _createClass(FixedZoomFactor, [{
        key: "toggleFitToScreen",
        value: function toggleFitToScreen() {
            return new FitToScreen();
        }
    }, {
        key: "getCurrentZoomFactor",
        value: function getCurrentZoomFactor(viewer) {
            return this.zoom;
        }
    }, {
        key: "fitToScreen",
        get: function get() {
            return false;
        }
    }]);

    return FixedZoomFactor;
})(ZoomOptions);

exports["default"] = ZoomOptions;
module.exports = exports["default"];

},{"../models/vivliostyle":11}],13:[function(require,module,exports){
/*
 * Copyright 2015 Trim-marks Inc.
 * Copyright 2019 Vivliostyle Foundation
 *
 * This file is part of Vivliostyle UI.
 *
 * Vivliostyle UI is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * Vivliostyle UI is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with Vivliostyle UI.  If not, see <http://www.gnu.org/licenses/>.
 */

"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var _utilsStringUtil = require("../utils/string-util");

var _utilsStringUtil2 = _interopRequireDefault(_utilsStringUtil);

function getRegExpForParameter(name) {
    return new RegExp("[#&]" + _utilsStringUtil2["default"].escapeUnicodeString(name) + "=([^&]*)", "g");
}

var URLParameterStore = (function () {
    function URLParameterStore() {
        _classCallCheck(this, URLParameterStore);

        this.history = window ? window.history : {};
        this.location = window ? window.location : { href: "" };
        this.storedUrl = this.location.href;
    }

    _createClass(URLParameterStore, [{
        key: "getBaseURL",
        value: function getBaseURL() {
            var url = this.location.href;
            url = url.replace(/#.*$/, "");
            return url.replace(/\/[^/]*$/, "/");
        }
    }, {
        key: "hasParameter",
        value: function hasParameter(name) {
            var url = this.location.href;
            var regexp = getRegExpForParameter(name);
            return regexp.test(url);
        }
    }, {
        key: "getParameter",
        value: function getParameter(name, dontPercentDecode) {
            var url = this.location.href;
            var regexp = getRegExpForParameter(name);
            var results = [];
            var r = undefined;
            while (r = regexp.exec(url)) {
                var value = r[1];
                if (!dontPercentDecode) {
                    // It was
                    //   value = stringUtil.percentDecodeAmpersandAndPercent(value);
                    // but why only Ampersand and Percent?
                    value = decodeURI(value);
                }
                results.push(value);
            }
            return results;
        }

        /**
         * @param {string} name 
         * @param {string} value 
         * @param {boolean=} dontPercentEncode 
         * @param {number=} opt_index specifies index in multiple parameters with same name.
         */
    }, {
        key: "setParameter",
        value: function setParameter(name, value, dontPercentEncode, opt_index) {
            var url = this.location.href;
            if (!dontPercentEncode) value = _utilsStringUtil2["default"].percentEncodeAmpersandAndPercent(value);
            var updated = undefined;
            var regexp = getRegExpForParameter(name);
            var r = regexp.exec(url);
            if (r && opt_index) {
                while (opt_index-- >= 1) {
                    r = regexp.exec(url);
                }
            }
            if (r) {
                var l = r[1].length;
                var start = r.index + r[0].length - l;
                updated = url.substring(0, start) + value + url.substring(start + l);
            } else {
                updated = url + (url.match(/[#&]$/) ? "" : url.match(/#/) ? "&" : "#") + name + "=" + value;
            }
            if (this.history.replaceState) {
                this.history.replaceState(null, "", updated);
            } else {
                this.location.href = updated;
            }
            this.storedUrl = updated;
        }

        /**
         * @param {string} name 
         * @param {boolean=} opt_keepFirst If true, not remove the first one in multiple parameters with same name.
         */
    }, {
        key: "removeParameter",
        value: function removeParameter(name, opt_keepFirst) {
            var url = this.location.href;
            var updated = undefined;
            var regexp = getRegExpForParameter(name);
            var r = regexp.exec(url);
            if (r && opt_keepFirst) {
                r = regexp.exec(url);
            }
            if (r) {
                updated = url;
                for (; r; r = regexp.exec(updated)) {
                    var end = r.index + r[0].length;
                    if (r[0].charAt(0) == '#') {
                        updated = updated.substring(0, r.index + 1) + updated.substring(end + 1);
                    } else {
                        updated = updated.substring(0, r.index) + updated.substring(end);
                    }
                    regexp.lastIndex -= r[0].length;
                }
                updated = updated.replace(/^(.*?)[#&]$/, "$1");
                if (this.history.replaceState) {
                    this.history.replaceState(null, "", updated);
                } else {
                    this.location.href = updated;
                }
            }
            this.storedUrl = updated;
        }
    }]);

    return URLParameterStore;
})();

exports["default"] = new URLParameterStore();
module.exports = exports["default"];

},{"../utils/string-util":16}],14:[function(require,module,exports){
/*
 * Copyright 2015 Trim-marks Inc.
 *
 * This file is part of Vivliostyle UI.
 *
 * Vivliostyle UI is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * Vivliostyle UI is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with Vivliostyle UI.  If not, see <http://www.gnu.org/licenses/>.
 */

// cf. http://www.w3.org/TR/DOM-Level-3-Events-key/
"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});
var Keys = {
    Unidentified: "Unidentified",
    ArrowDown: "ArrowDown",
    ArrowLeft: "ArrowLeft",
    ArrowRight: "ArrowRight",
    ArrowUp: "ArrowUp",
    Home: "Home",
    End: "End",
    PageDown: "PageDown",
    PageUp: "PageUp",
    Escape: "Escape",
    Enter: "Enter",
    Space: " "
};

// CAUTION: This function covers only part of common keys on a keyboard. Keys not covered by the implementation are identified as KeyboardEvent.key, KeyboardEvent.keyIdentifier, or "Unidentified".
function identifyKeyFromEvent(event) {
    var key = event.key;
    var keyIdentifier = event.keyIdentifier;
    var location = event.location;
    if (key === Keys.ArrowDown || key === "Down" || keyIdentifier === "Down") {
        if (event.metaKey) {
            // Mac Cmd+Down -> End
            return Keys.End;
        }
        return Keys.ArrowDown;
    } else if (key === Keys.ArrowLeft || key === "Left" || keyIdentifier === "Left") {
        return Keys.ArrowLeft;
    } else if (key === Keys.ArrowRight || key === "Right" || keyIdentifier === "Right") {
        return Keys.ArrowRight;
    } else if (key === Keys.ArrowUp || key === "Up" || keyIdentifier === "Up") {
        if (event.metaKey) {
            // Mac Cmd+Up -> Home
            return Keys.Home;
        }
        return Keys.ArrowUp;
    } else if (key === Keys.Escape || key === "Esc" || keyIdentifier === "U+001B") {
        return Keys.Escape;
    } else if (key === Keys.Enter || keyIdentifier === "Enter") {
        return Keys.Enter;
    } else if (key === Keys.Space || keyIdentifier === "U+0020") {
        return Keys.Space;
    } else if (key === "0" || keyIdentifier === "U+0030") {
        return "0";
    } else if (key === "+" || key === "Add" || keyIdentifier === "U+002B" || keyIdentifier === "U+00BB" || keyIdentifier === "U+004B" && location === KeyboardEvent.DOM_KEY_LOCATION_NUMPAD /* workaround for Chrome for Windows */) {
            return "+";
        } else if (key === "-" || key === "Subtract" || keyIdentifier === "U+002D" || keyIdentifier === "U+00BD" || keyIdentifier === "U+004D" && location === KeyboardEvent.DOM_KEY_LOCATION_NUMPAD /* workaround for Chrome for Windows */) {
            return "-";
        } else {
        return key || keyIdentifier || Keys.Unidentified;
    }
}

exports["default"] = {
    Keys: Keys,
    identifyKeyFromEvent: identifyKeyFromEvent
};
module.exports = exports["default"];

},{}],15:[function(require,module,exports){
/*
 * Copyright 2015 Trim-marks Inc.
 *
 * This file is part of Vivliostyle UI.
 *
 * Vivliostyle UI is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * Vivliostyle UI is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with Vivliostyle UI.  If not, see <http://www.gnu.org/licenses/>.
 */

"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

var _knockout = require("knockout");

var _knockout2 = _interopRequireDefault(_knockout);

var util = {
    readonlyObservable: function readonlyObservable(value) {
        var obs = _knockout2["default"].observable(value);
        return {
            getter: _knockout2["default"].pureComputed(function () {
                return obs();
            }),
            value: obs
        };
    }
};

exports["default"] = util;
module.exports = exports["default"];

},{"knockout":1}],16:[function(require,module,exports){
/*
 * Copyright 2015 Trim-marks Inc.
 *
 * This file is part of Vivliostyle UI.
 *
 * Vivliostyle UI is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * Vivliostyle UI is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with Vivliostyle UI.  If not, see <http://www.gnu.org/licenses/>.
 */

"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports["default"] = {
    escapeUnicodeChar: function escapeUnicodeChar(ch) {
        return "\\u" + (0x10000 | ch.charCodeAt(0)).toString(16).substring(1);
    },
    escapeUnicodeString: function escapeUnicodeString(str) {
        return str.replace(/[^-a-zA-Z0-9_]/g, this.escapeUnicodeChar);
    },
    percentEncodeAmpersandAndUnencodedPercent: function percentEncodeAmpersandAndUnencodedPercent(str) {
        return str.replace(/%(?![0-9A-Fa-f]{2})/g, "%25").replace(/&/g, "%26");
    },
    percentEncodeAmpersandAndPercent: function percentEncodeAmpersandAndPercent(str) {
        return str.replace(/%/g, "%25").replace(/&/g, "%26");
    },
    percentDecodeAmpersandAndPercent: function percentDecodeAmpersandAndPercent(str) {
        return str.replace(/%26/g, "&").replace(/%25/g, "%");
    }
};
module.exports = exports["default"];

},{}],17:[function(require,module,exports){
/*
 * Copyright 2015 Trim-marks Inc.
 *
 * This file is part of Vivliostyle UI.
 *
 * Vivliostyle UI is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * Vivliostyle UI is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with Vivliostyle UI.  If not, see <http://www.gnu.org/licenses/>.
 */

"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var _knockout = require("knockout");

var _knockout2 = _interopRequireDefault(_knockout);

var MessageDialog = (function () {
    function MessageDialog(queue) {
        _classCallCheck(this, MessageDialog);

        this.list = queue;
        this.visible = _knockout2["default"].pureComputed(function () {
            return queue().length > 0;
        });
    }

    _createClass(MessageDialog, [{
        key: "getDisplayMessage",
        value: function getDisplayMessage(errorInfo) {
            var e = errorInfo.error;
            var msg = e && (e.toString() || e.frameTrace || e.stack);
            if (msg) {
                msg = msg.split("\n", 1)[0];
            }
            if (!msg) {
                msg = errorInfo.messages.join("\n");
            }
            return msg;
        }
    }]);

    return MessageDialog;
})();

exports["default"] = MessageDialog;
module.exports = exports["default"];

},{"knockout":1}],18:[function(require,module,exports){
/*
 * Copyright 2015 Trim-marks Inc.
 * Copyright 2018 Vivliostyle Foundation
 *
 * This file is part of Vivliostyle UI.
 *
 * Vivliostyle UI is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * Vivliostyle UI is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with Vivliostyle UI.  If not, see <http://www.gnu.org/licenses/>.
 */

"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var _knockout = require("knockout");

var _knockout2 = _interopRequireDefault(_knockout);

var _modelsViewerOptions = require("../models/viewer-options");

var _modelsViewerOptions2 = _interopRequireDefault(_modelsViewerOptions);

var _utilsKeyUtil = require("../utils/key-util");

var _modelsVivliostyle = require("../models/vivliostyle");

var _modelsVivliostyle2 = _interopRequireDefault(_modelsVivliostyle);

var Navigation = (function () {
    function Navigation(viewerOptions, viewer, settingsPanel, navigationOptions) {
        var _this = this;

        _classCallCheck(this, Navigation);

        this.viewerOptions_ = viewerOptions;
        this.viewer_ = viewer;
        this.settingsPanel_ = settingsPanel;
        this.justClicked = false; // double click check

        this.isDisabled = _knockout2["default"].pureComputed(function () {
            return _this.settingsPanel_.opened() && !_this.settingsPanel_.pinned() || !_this.viewer_.state.navigatable();
        });

        var navigationDisabled = _knockout2["default"].pureComputed(function () {
            return navigationOptions.disablePageNavigation || _this.isDisabled();
        });

        navigationDisabled.subscribe(function (disabled) {
            var pageNumberElem = document.getElementById("vivliostyle-page-number");
            if (pageNumberElem) {
                pageNumberElem.disabled = disabled;
            }
        });

        this.isPageNumberDisabled = _knockout2["default"].pureComputed(function () {
            return navigationDisabled();
        });

        this.isNavigateToPreviousDisabled = _knockout2["default"].pureComputed(function () {
            if (navigationDisabled()) {
                return true;
            }
            if (_this.viewer_.state.status === undefined) {
                return false; // needed for test/spec/viewmodels/navigation-spec.js
            }
            return _this.viewer_.firstPage();
        });

        this.isNavigateToNextDisabled = _knockout2["default"].pureComputed(function () {
            if (navigationDisabled()) {
                return true;
            }
            if (_this.viewer_.state.status === undefined) {
                return false; // needed for test/spec/viewmodels/navigation-spec.js
            }
            if (_this.viewerOptions_.renderAllPages() && _this.viewer_.state.status() != _modelsVivliostyle2["default"].constants.ReadyState.COMPLETE) {
                return false;
            }
            return _this.viewer_.lastPage();
        });

        this.isNavigateToLeftDisabled = _knockout2["default"].pureComputed(function () {
            if (navigationDisabled()) {
                return true;
            }
            if (_this.viewer_.state.pageProgression === undefined) {
                return false; // needed for test/spec/viewmodels/navigation-spec.js
            }
            if (_this.viewer_.state.pageProgression() === _modelsVivliostyle2["default"].constants.PageProgression.LTR) {
                return _this.isNavigateToPreviousDisabled();
            } else {
                return _this.isNavigateToNextDisabled();
            }
        });

        this.isNavigateToRightDisabled = _knockout2["default"].pureComputed(function () {
            if (navigationDisabled()) {
                return true;
            }
            if (_this.viewer_.state.pageProgression === undefined) {
                return false; // needed for test/spec/viewmodels/navigation-spec.js
            }
            if (_this.viewer_.state.pageProgression() === _modelsVivliostyle2["default"].constants.PageProgression.LTR) {
                return _this.isNavigateToNextDisabled();
            } else {
                return _this.isNavigateToPreviousDisabled();
            }
        });

        this.isNavigateToFirstDisabled = this.isNavigateToPreviousDisabled;

        this.isNavigateToLastDisabled = _knockout2["default"].pureComputed(function () {
            if (navigationDisabled()) {
                return true;
            }
            if (_this.viewer_.state.status === undefined) {
                return false; // needed for test/spec/viewmodels/navigation-spec.js
            }
            if (_this.viewerOptions_.renderAllPages() && _this.viewer_.state.status() != _modelsVivliostyle2["default"].constants.ReadyState.COMPLETE) {
                return true;
            }
            return _this.viewer_.lastPage();
        });

        this.hidePageNavigation = !!navigationOptions.disablePageNavigation;

        var zoomDisabled = _knockout2["default"].pureComputed(function () {
            return navigationOptions.disableZoom || _this.isDisabled();
        });

        this.isZoomOutDisabled = zoomDisabled;
        this.isZoomInDisabled = zoomDisabled;
        this.isZoomToActualSizeDisabled = zoomDisabled;
        this.isToggleFitToScreenDisabled = zoomDisabled;
        this.hideZoom = !!navigationOptions.disableZoom;

        this.fitToScreen = _knockout2["default"].pureComputed(function () {
            return viewerOptions.zoom().fitToScreen;
        });

        var fontSizeChangeDisabled = _knockout2["default"].pureComputed(function () {
            return navigationOptions.disableFontSizeChange || _this.isDisabled();
        });

        // Font size limit (max:72, min:5) is hard coded in vivliostyle.js/src/adapt/viewer.js.
        this.isIncreaseFontSizeDisabled = _knockout2["default"].pureComputed(function () {
            if (fontSizeChangeDisabled()) {
                return true;
            }
            if (_this.viewerOptions_.fontSize() >= 72) {
                return true;
            }
            return false;
        });
        this.isDecreaseFontSizeDisabled = _knockout2["default"].pureComputed(function () {
            if (fontSizeChangeDisabled()) {
                return true;
            }
            if (_this.viewerOptions_.fontSize() <= 5) {
                return true;
            }
            return false;
        });
        this.isDefaultFontSizeDisabled = fontSizeChangeDisabled;
        this.hideFontSizeChange = !!navigationOptions.disableFontSizeChange;

        this.isTOCToggleDisabled = _knockout2["default"].pureComputed(function () {
            return navigationOptions.disableTOCNavigation || _this.isDisabled() || _this.viewer_.tocVisible() == null;
        });
        this.hideTOCNavigation = !!navigationOptions.disableTOCNavigation;

        this.pageNumber = _knockout2["default"].pureComputed({
            read: function read() {
                return this.viewer_.epageToPageNumber(this.viewer_.epage());
            },
            write: function write(pageNumberText) {
                var _this2 = this;

                var epageOld = this.viewer_.epage();
                var pageNumberOld = this.viewer_.epageToPageNumber(epageOld);

                // Accept non-integer, convert fullwidth to ascii
                var pageNumber = parseFloat(pageNumberText.replace(/[０-９]/g, function (s) {
                    return String.fromCharCode(s.charCodeAt(0) - 0xFEE0);
                })) || 0;
                if (/^[-+]/.test(pageNumberText)) {
                    // "+number" and "-number" to relative move.
                    pageNumber = pageNumberOld + pageNumber;
                }
                if (pageNumber < 1) {
                    pageNumber = 1;
                } else {
                    var epageCount = this.viewer_.epageCount();
                    if (this.viewerOptions_.renderAllPages()) {
                        if (pageNumber > epageCount) {
                            pageNumber = epageCount;
                        }
                    } else if (pageNumber > epageCount + 1) {
                        // Accept "epageCount + 1" because the last epage may equal epageCount.
                        pageNumber = epageCount + 1;
                    }
                }
                var epageNav = this.viewer_.epageFromPageNumber(pageNumber);
                var pageNumberElem = document.getElementById("vivliostyle-page-number");
                pageNumberElem.value = pageNumber;
                this.viewer_.navigateToEPage(epageNav);

                setTimeout(function () {
                    if (_this2.viewer_.state.status() != _modelsVivliostyle2["default"].constants.ReadyState.LOADING && _this2.viewer_.epage() === epageOld) {
                        pageNumberElem.value = pageNumberOld;
                    }
                    document.getElementById("vivliostyle-viewer-viewport").focus();
                }, 10);
            },
            owner: this
        });

        this.totalPages = _knockout2["default"].pureComputed(function () {
            var totalPages = _this.viewer_.epageCount();
            if (!totalPages) {
                return totalPages;
            }
            var pageNumber = _this.pageNumber();
            if (_this.viewer_.lastPage()) {
                totalPages = pageNumber;
            } else if (pageNumber >= totalPages) {
                totalPages++;
            }
            return totalPages;
        });

        ["navigateToPrevious", "navigateToNext", "navigateToLeft", "navigateToRight", "navigateToFirst", "navigateToLast", "zoomIn", "zoomOut", "zoomToActualSize", "toggleFitToScreen", "increaseFontSize", "decreaseFontSize", "defaultFontSize", "onclickViewport", "toggleTOC"].forEach(function (methodName) {
            _this[methodName] = _this[methodName].bind(_this);
        });
    }

    _createClass(Navigation, [{
        key: "navigateToPrevious",
        value: function navigateToPrevious() {
            if (!this.isNavigateToPreviousDisabled()) {
                this.viewer_.navigateToPrevious();
                return true;
            } else {
                return false;
            }
        }
    }, {
        key: "navigateToNext",
        value: function navigateToNext() {
            if (!this.isNavigateToNextDisabled()) {
                this.viewer_.navigateToNext();
                return true;
            } else {
                return false;
            }
        }
    }, {
        key: "navigateToLeft",
        value: function navigateToLeft() {
            if (!this.isNavigateToLeftDisabled()) {
                this.viewer_.navigateToLeft();
                return true;
            } else {
                return false;
            }
        }
    }, {
        key: "navigateToRight",
        value: function navigateToRight() {
            if (!this.isNavigateToRightDisabled()) {
                this.viewer_.navigateToRight();
                return true;
            } else {
                return false;
            }
        }
    }, {
        key: "navigateToFirst",
        value: function navigateToFirst() {
            if (!this.isNavigateToFirstDisabled()) {
                this.viewer_.navigateToFirst();
                return true;
            } else {
                return false;
            }
        }
    }, {
        key: "navigateToLast",
        value: function navigateToLast() {
            if (!this.isNavigateToLastDisabled()) {
                this.viewer_.navigateToLast();
                return true;
            } else {
                return false;
            }
        }
    }, {
        key: "zoomIn",
        value: function zoomIn() {
            if (!this.isZoomInDisabled()) {
                var zoom = this.viewerOptions_.zoom();
                this.viewerOptions_.zoom(zoom.zoomIn(this.viewer_));
                return true;
            } else {
                return false;
            }
        }
    }, {
        key: "zoomOut",
        value: function zoomOut() {
            if (!this.isZoomOutDisabled()) {
                var zoom = this.viewerOptions_.zoom();
                this.viewerOptions_.zoom(zoom.zoomOut(this.viewer_));
                return true;
            } else {
                return false;
            }
        }
    }, {
        key: "zoomToActualSize",
        value: function zoomToActualSize() {
            if (!this.isZoomToActualSizeDisabled()) {
                var zoom = this.viewerOptions_.zoom();
                this.viewerOptions_.zoom(zoom.zoomToActualSize());
                return true;
            } else {
                return false;
            }
        }
    }, {
        key: "toggleFitToScreen",
        value: function toggleFitToScreen() {
            if (!this.isToggleFitToScreenDisabled()) {
                var zoom = this.viewerOptions_.zoom();
                this.viewerOptions_.zoom(zoom.toggleFitToScreen());
                return true;
            } else {
                return false;
            }
        }
    }, {
        key: "increaseFontSize",
        value: function increaseFontSize() {
            if (!this.isIncreaseFontSizeDisabled()) {
                var fontSize = this.viewerOptions_.fontSize();
                fontSize *= 1.25;
                this.viewerOptions_.fontSize(fontSize);
                this.updateFontSizeSettings();
                return true;
            } else {
                return false;
            }
        }
    }, {
        key: "decreaseFontSize",
        value: function decreaseFontSize() {
            if (!this.isDecreaseFontSizeDisabled()) {
                var fontSize = this.viewerOptions_.fontSize();
                fontSize *= 0.8;
                this.viewerOptions_.fontSize(fontSize);
                this.updateFontSizeSettings();
                return true;
            } else {
                return false;
            }
        }
    }, {
        key: "defaultFontSize",
        value: function defaultFontSize() {
            if (!this.isDefaultFontSizeDisabled()) {
                var fontSize = _modelsViewerOptions2["default"].getDefaultValues().fontSize;
                this.viewerOptions_.fontSize(fontSize);
                this.updateFontSizeSettings();
                return true;
            } else {
                return false;
            }
        }
    }, {
        key: "updateFontSizeSettings",
        value: function updateFontSizeSettings() {
            // Update setting panel "Font Size".
            this.settingsPanel_.state.viewerOptions.fontSize(this.viewerOptions_.fontSize());

            if (this.viewer_.documentOptions_.pageStyle.baseFontSizeSpecified()) {
                // Update userStylesheet when base font-size is specified
                this.viewer_.documentOptions_.updateUserStyleSheetFromCSSText();
                this.viewer_.loadDocument(this.viewer_.documentOptions_, this.viewerOptions_);
            }
        }
    }, {
        key: "onclickViewport",
        value: function onclickViewport() {
            if (this.settingsPanel_.justClicked) {
                return true;
            }
            if (this.viewer_.tocVisible() && !this.viewer_.tocPinned()) {
                var tocBox = document.querySelector("[data-vivliostyle-toc-box]");
                if (tocBox && !tocBox.contains(document.activeElement)) {
                    this.toggleTOC();
                }
            }
            if (this.settingsPanel_.opened() && !this.settingsPanel_.pinned()) {
                this.settingsPanel_.close();
            }
            return true;
        }
    }, {
        key: "toggleTOC",
        value: function toggleTOC() {
            var _this3 = this;

            if (!this.isTOCToggleDisabled()) {
                var _ret = (function () {
                    var intervalID = 0;
                    var tocToggle = document.getElementById("vivliostyle-menu-item_toc-toggle");

                    if (!_this3.viewer_.tocVisible()) {
                        if (_this3.justClicked) {
                            _this3.viewer_.showTOC(true, false); // autohide=false
                            _this3.justClicked = false;
                        } else {
                            _this3.viewer_.showTOC(true, true); // autohide=true
                            _this3.justClicked = true;
                        }
                        // Here use timer for two purposes:
                        // - Check double click to make TOC box pinned.
                        // - Move focus to TOC box when TOC box becomes visible.
                        intervalID = setInterval(function () {
                            var tocBox = document.querySelector("[data-vivliostyle-toc-box]");
                            if (tocBox && tocBox.style.visibility === "visible") {
                                tocBox.tabIndex = 0;
                                tocBox.focus();

                                clearInterval(intervalID);
                                intervalID = 0;
                            }
                            _this3.justClicked = false;
                        }, 300);
                    } else if (_this3.justClicked) {
                        // Double click to keep TOC box visible during TOC navigation
                        _this3.viewer_.showTOC(true, false); // autohide=false
                        _this3.justClicked = false;
                    } else {
                        if (intervalID) {
                            clearInterval(intervalID);
                            intervalID = 0;
                        }
                        _this3.viewer_.showTOC(false);

                        _this3.justClicked = true;
                        setTimeout(function () {
                            if (_this3.justClicked) {
                                document.getElementById("vivliostyle-viewer-viewport").focus();
                                _this3.justClicked = false;
                            }
                        }, 300);
                    }
                    return {
                        v: true
                    };
                })();

                if (typeof _ret === "object") return _ret.v;
            } else {
                return false;
            }
        }
    }, {
        key: "navigateTOC",
        value: function navigateTOC(key) {
            var selecter = "[data-vivliostyle-toc-box]>*>*>*>*>*:not([hidden]) [tabindex='0']," + "[data-vivliostyle-toc-box]>*>*>*>*>*:not([hidden]) a[href]:not([tabindex='-1'])";
            var nodes = Array.from(document.querySelectorAll(selecter));
            var index = nodes.indexOf(document.activeElement);

            var isButton = function isButton(index) {
                return nodes[index] && nodes[index].getAttribute("role") === "button";
            };
            var isExpanded = function isExpanded(index) {
                return nodes[index] && nodes[index].getAttribute("aria-expanded") === "true";
            };

            switch (key) {
                case _utilsKeyUtil.Keys.ArrowLeft:
                    if (index == -1) {
                        index = nodes.length - 1;
                        break;
                    }
                    if (!isButton(index) && isButton(index - 1)) {
                        index--;
                    }
                    if (isButton(index) && isExpanded(index)) {
                        nodes[index].click();
                    } else {
                        for (var i = index - 1; i >= 0; i--) {
                            if (isButton(i) && nodes[i].parentElement.contains(nodes[index])) {
                                index = i;
                                break;
                            }
                        }
                    }
                    break;
                case _utilsKeyUtil.Keys.ArrowRight:
                    if (index == -1) {
                        index = 0;
                        break;
                    }
                    if (!isButton(index) && isButton(index - 1)) {
                        index--;
                    }
                    if (isButton(index)) {
                        if (isExpanded(index)) {
                            index += 2;
                        } else {
                            nodes[index].click();
                        }
                    }
                    break;
                case _utilsKeyUtil.Keys.ArrowDown:
                    index++;
                    break;
                case _utilsKeyUtil.Keys.ArrowUp:
                    if (index == -1) {
                        index = nodes.length - 1;
                        break;
                    }
                    if (index > 0) {
                        if (isButton(--index)) {
                            index--;
                        }
                    }
                    break;
                case _utilsKeyUtil.Keys.Home:
                    index = 0;
                    break;
                case _utilsKeyUtil.Keys.End:
                    index = nodes.length - 1;
                    break;
                case _utilsKeyUtil.Keys.Space:
                    if (!isButton(index) && isButton(index - 1)) {
                        index--;
                    }
                    if (isButton(index)) {
                        nodes[index].click();
                    }
                    break;
            }

            if (isButton(index)) {
                index++;
            }

            if (nodes[index]) {
                nodes[index].focus();
            }

            return true;
        }
    }, {
        key: "handleKey",
        value: function handleKey(key) {
            var isSettingsActive = this.settingsPanel_.opened() && this.settingsPanel_.settingsToggle.contains(document.activeElement);

            if (isSettingsActive) {
                return true;
            }

            var pageNumberElem = document.getElementById("vivliostyle-page-number");
            var viewportElement = document.getElementById("vivliostyle-viewer-viewport");
            var horizontalScrollable = viewportElement.scrollWidth > viewportElement.clientWidth;
            var verticalScrollable = viewportElement.scrollHeight > viewportElement.clientHeight;
            var isPageNumberInput = pageNumberElem === document.activeElement;
            var isTOCActive = this.viewer_.tocVisible() && !isPageNumberInput && viewportElement != document.activeElement;

            switch (key) {
                case "+":
                    return isPageNumberInput || !this.increaseFontSize();
                case "-":
                    return isPageNumberInput || !this.decreaseFontSize();
                case "0":
                    return isPageNumberInput || !this.defaultFontSize();
                case "1":
                    return isPageNumberInput || !this.zoomToActualSize();
                case _utilsKeyUtil.Keys.ArrowLeft:
                    if (isTOCActive) return !this.navigateTOC(key);
                    return isPageNumberInput || horizontalScrollable || !this.navigateToLeft();
                case _utilsKeyUtil.Keys.ArrowRight:
                    if (isTOCActive) return !this.navigateTOC(key);
                    return isPageNumberInput || horizontalScrollable || !this.navigateToRight();
                case _utilsKeyUtil.Keys.ArrowDown:
                    if (isTOCActive) return !this.navigateTOC(key);
                    viewportElement.focus();
                    return verticalScrollable || !this.navigateToNext();
                case _utilsKeyUtil.Keys.ArrowUp:
                    if (isTOCActive) return !this.navigateTOC(key);
                    viewportElement.focus();
                    return verticalScrollable || !this.navigateToPrevious();
                case _utilsKeyUtil.Keys.PageDown:
                    if (isTOCActive) return true;
                    viewportElement.focus();
                    return !this.navigateToNext();
                case _utilsKeyUtil.Keys.PageUp:
                    if (isTOCActive) return true;
                    viewportElement.focus();
                    return !this.navigateToPrevious();
                case _utilsKeyUtil.Keys.Home:
                    if (isTOCActive) return !this.navigateTOC(key);
                    viewportElement.focus();
                    return !this.navigateToFirst();
                case _utilsKeyUtil.Keys.End:
                    if (isTOCActive) return !this.navigateTOC(key);
                    viewportElement.focus();
                    return !this.navigateToLast();
                case "o":
                case "O":
                    viewportElement.focus();
                    return !this.zoomOut();
                case "i":
                case "I":
                    viewportElement.focus();
                    return !this.zoomIn();
                case "f":
                case "F":
                    viewportElement.focus();
                    return !this.toggleFitToScreen();
                case "g":
                case "G":
                    pageNumberElem.focus();
                    return false;
                case "t":
                case "T":
                    viewportElement.focus();
                    return !this.toggleTOC();
                case _utilsKeyUtil.Keys.Escape:
                    if (this.viewer_.tocVisible()) {
                        return !this.toggleTOC();
                    }
                    viewportElement.focus();
                    return true;
                case _utilsKeyUtil.Keys.Space:
                    if (isTOCActive) return !this.navigateTOC(key);
                    if (document.activeElement.getAttribute("role") === "button") {
                        document.activeElement.click();
                        return false;
                    }
                    return true;
                default:
                    return true;
            }
        }
    }]);

    return Navigation;
})();

exports["default"] = Navigation;
module.exports = exports["default"];

},{"../models/viewer-options":10,"../models/vivliostyle":11,"../utils/key-util":14,"knockout":1}],19:[function(require,module,exports){
/*
 * Copyright 2015 Trim-marks Inc.
 * Copyright 2019 Vivliostyle Foundation
 *
 * This file is part of Vivliostyle UI.
 *
 * Vivliostyle UI is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * Vivliostyle UI is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with Vivliostyle UI.  If not, see <http://www.gnu.org/licenses/>.
 */

"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var _knockout = require("knockout");

var _knockout2 = _interopRequireDefault(_knockout);

var _modelsViewerOptions = require("../models/viewer-options");

var _modelsViewerOptions2 = _interopRequireDefault(_modelsViewerOptions);

var _modelsPageStyle = require("../models/page-style");

var _modelsPageStyle2 = _interopRequireDefault(_modelsPageStyle);

var _modelsPageViewMode = require("../models/page-view-mode");

var _modelsPageViewMode2 = _interopRequireDefault(_modelsPageViewMode);

var _utilsKeyUtil = require("../utils/key-util");

var SettingsPanel = (function () {
    function SettingsPanel(viewerOptions, documentOptions, viewer, messageDialog, settingsPanelOptions) {
        var _this = this;

        _classCallCheck(this, SettingsPanel);

        this.viewerOptions_ = viewerOptions;
        this.documentOptions_ = documentOptions;
        this.viewer_ = viewer;

        this.isPageStyleChangeDisabled = !!settingsPanelOptions.disablePageStyleChange;
        this.isOverrideDocumentStyleSheetDisabled = this.isPageStyleChangeDisabled;
        this.isPageViewModeChangeDisabled = !!settingsPanelOptions.disablePageViewModeChange;
        this.isRenderAllPagesChangeDisabled = !!settingsPanelOptions.disableRenderAllPagesChange;

        this.justClicked = false; // double click check
        this.settingsToggle = document.getElementById("vivliostyle-menu-item_settings-toggle");

        this.opened = _knockout2["default"].observable(false);
        this.pinned = _knockout2["default"].observable(false);

        this.state = {
            viewerOptions: new _modelsViewerOptions2["default"](viewerOptions),
            pageStyle: new _modelsPageStyle2["default"](documentOptions.pageStyle),
            pageViewMode: _knockout2["default"].pureComputed({
                read: function read() {
                    return _this.state.viewerOptions.pageViewMode().toString();
                },
                write: function write(value) {
                    _this.state.viewerOptions.pageViewMode(_modelsPageViewMode2["default"].of(value));
                }
            }),
            renderAllPages: _knockout2["default"].pureComputed({
                read: function read() {
                    return _this.state.viewerOptions.renderAllPages();
                },
                write: function write(value) {
                    _this.state.viewerOptions.renderAllPages(value);
                }
            })
        };

        this.state.pageStyle.setViewerFontSizeObservable(this.state.viewerOptions.fontSize);

        this.defaultPageStyle = new _modelsPageStyle2["default"]();

        ["close", "toggle", "apply", "cancel", "resetUserStyle"].forEach(function (methodName) {
            this[methodName] = this[methodName].bind(this);
        }, this);

        messageDialog.visible.subscribe(function (visible) {
            if (visible) this.close();
        }, this);
    }

    _createClass(SettingsPanel, [{
        key: "close",
        value: function close() {
            this.opened(false);
            this.pinned(false);
            var viewportElement = document.getElementById("vivliostyle-viewer-viewport");
            if (viewportElement) viewportElement.focus();
            return true;
        }
    }, {
        key: "toggle",
        value: function toggle() {
            var _this2 = this;

            if (!this.opened()) {
                if (!this.viewer_.tocPinned()) {
                    this.viewer_.showTOC(false); // Hide TOC box
                }
                this.opened(true);

                if (this.justClicked) {
                    this.justClicked = false;
                    this.pinned(true);
                } else {
                    this.pinned(false);
                    this.justClicked = true;
                    this.focusToFirstItem();
                    setTimeout(function () {
                        _this2.justClicked = false;
                    }, 300);
                }
            } else if (this.justClicked) {
                // Double click to keep Settings panel open when Apply is clicked.
                this.justClicked = false;
                this.pinned(true);
            } else {
                this.close();

                this.justClicked = true;
                setTimeout(function () {
                    _this2.justClicked = false;
                }, 300);
            }
        }
    }, {
        key: "apply",
        value: function apply() {
            if (this.state.renderAllPages() === this.viewerOptions_.renderAllPages() && this.state.pageStyle.equivalentTo(this.documentOptions_.pageStyle)) {
                this.viewerOptions_.copyFrom(this.state.viewerOptions);
            } else {
                this.documentOptions_.pageStyle.copyFrom(this.state.pageStyle);
                if (this.documentOptions_.pageStyle.baseFontSizeSpecified()) {
                    // Update userStylesheet when base font-size is specified
                    this.documentOptions_.updateUserStyleSheetFromCSSText();
                }
                this.viewer_.loadDocument(this.documentOptions_, this.state.viewerOptions);
            }
            if (this.pinned()) {
                this.focusToFirstItem();
            } else {
                this.close();
            }
        }
    }, {
        key: "cancel",
        value: function cancel() {
            this.state.viewerOptions.copyFrom(this.viewerOptions_);
            this.state.pageStyle.copyFrom(this.documentOptions_.pageStyle);
            this.close();
        }
    }, {
        key: "resetUserStyle",
        value: function resetUserStyle() {
            this.state.pageStyle.copyFrom(this.defaultPageStyle);
            this.state.viewerOptions.fontSize(_modelsViewerOptions2["default"].getDefaultValues().fontSize);
            setTimeout(function () {
                var elem = document.getElementsByName("vivliostyle-settings_reset-user-style")[0];
                elem.checked = false;
            }, 200);
            return true;
        }
    }, {
        key: "focusToFirstItem",
        value: function focusToFirstItem(opt_outerElem) {
            var outerElem = opt_outerElem || this.settingsToggle;
            var inputElem = ["input", "textarea", "summary"].includes(outerElem.localName) ? outerElem : Array.from(outerElem.getElementsByTagName("input")).find(function (e) {
                return !e.disabled && (e.type != "radio" || e.checked);
            });
            if (inputElem) {
                for (var e = inputElem.parentElement; e && e != this.settingsToggle; e = e.parentElement) {
                    if (e.localName == "details") {
                        e.open = true;
                    }
                }
                inputElem.focus();
            }
        }
    }, {
        key: "handleKey",
        value: function handleKey(key) {
            var isSettingsActive = this.opened() && this.settingsToggle.contains(document.activeElement);
            var isInInput = isSettingsActive && (document.activeElement.type == "text" || document.activeElement.localName == "select");
            var isInTextArea = isSettingsActive && document.activeElement.localName == "textarea";
            var isHotKeyEnabled = isSettingsActive && !isInInput && !isInTextArea;

            switch (key) {
                case _utilsKeyUtil.Keys.Escape:
                    if (this.opened()) {
                        this.cancel();
                        this.close();
                    }
                    return true;
                case "s":
                case "S":
                    if (!this.opened() || isHotKeyEnabled || !isSettingsActive) {
                        this.toggle();
                        return false;
                    }
                    return true;
                case "p":
                case "P":
                    if (isHotKeyEnabled) {
                        this.focusToFirstItem(document.getElementById("vivliostyle-settings_page-view-and-rendering").firstElementChild);
                        return false;
                    }
                    return true;
                case "v":
                case "V":
                    if (isHotKeyEnabled) {
                        this.focusToFirstItem(document.getElementById("vivliostyle-settings_page-view-mode"));
                        return false;
                    }
                    return true;
                case "a":
                case "A":
                    if (isHotKeyEnabled) {
                        this.focusToFirstItem(document.getElementsByName("vivliostyle-settings_render-all-pages")[0]);
                        return false;
                    }
                    return true;
                case "u":
                case "U":
                    if (isHotKeyEnabled) {
                        this.focusToFirstItem(document.getElementById("vivliostyle-settings_user-style").firstElementChild);
                        return false;
                    }
                    return true;
                case "z":
                case "Z":
                    if (isHotKeyEnabled) {
                        this.focusToFirstItem(document.getElementById("vivliostyle-settings_page-size"));
                        return false;
                    }
                    return true;
                case "m":
                case "M":
                    if (isHotKeyEnabled) {
                        this.focusToFirstItem(document.getElementById("vivliostyle-settings_page-margin"));
                        return false;
                    }
                    return true;
                case "b":
                case "B":
                    if (isHotKeyEnabled) {
                        this.focusToFirstItem(document.getElementById("vivliostyle-settings_page-breaks"));
                        return false;
                    }
                    return true;
                case "i":
                case "I":
                    if (isHotKeyEnabled) {
                        this.focusToFirstItem(document.getElementById("vivliostyle-settings_images"));
                        return false;
                    }
                    return true;
                case "t":
                case "T":
                    if (isHotKeyEnabled) {
                        this.focusToFirstItem(document.getElementById("vivliostyle-settings_text"));
                        return false;
                    }
                    return true;
                case "o":
                case "O":
                    if (isHotKeyEnabled) {
                        this.focusToFirstItem(document.getElementsByName("vivliostyle-settings_override-document-stylesheets")[0]);
                        return false;
                    }
                    return true;
                case "c":
                case "C":
                    if (isHotKeyEnabled) {
                        this.focusToFirstItem(document.getElementsByName("vivliostyle-settings_css-details")[0]);
                        return false;
                    }
                    return true;
                case "r":
                case "R":
                    if (isHotKeyEnabled) {
                        this.focusToFirstItem(document.getElementsByName("vivliostyle-settings_reset-user-style")[0]);
                        return false;
                    }
                    return true;
                case _utilsKeyUtil.Keys.Enter:
                    if (isInInput || isHotKeyEnabled && document.activeElement.id !== "vivliostyle-menu-button_apply" && document.activeElement.id !== "vivliostyle-menu-button_reset") {
                        document.getElementById("vivliostyle-menu-button_apply").focus();
                        return false;
                    }
                    return true;
                default:
                    return true;
            }
        }
    }]);

    return SettingsPanel;
})();

exports["default"] = SettingsPanel;
module.exports = exports["default"];

},{"../models/page-style":8,"../models/page-view-mode":9,"../models/viewer-options":10,"../utils/key-util":14,"knockout":1}],20:[function(require,module,exports){
/*
 * Copyright 2015 Trim-marks Inc.
 * Copyright 2019 Vivliostyle Foundation
 *
 * This file is part of Vivliostyle UI.
 *
 * Vivliostyle UI is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * Vivliostyle UI is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with Vivliostyle UI.  If not, see <http://www.gnu.org/licenses/>.
 */

"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

var _modelsVivliostyle = require("../models/vivliostyle");

var _modelsVivliostyle2 = _interopRequireDefault(_modelsVivliostyle);

var _modelsDocumentOptions = require("../models/document-options");

var _modelsDocumentOptions2 = _interopRequireDefault(_modelsDocumentOptions);

var _modelsViewerOptions = require("../models/viewer-options");

var _modelsViewerOptions2 = _interopRequireDefault(_modelsViewerOptions);

var _modelsMessageQueue = require("../models/message-queue");

var _modelsMessageQueue2 = _interopRequireDefault(_modelsMessageQueue);

var _viewer = require("./viewer");

var _viewer2 = _interopRequireDefault(_viewer);

var _navigation = require("./navigation");

var _navigation2 = _interopRequireDefault(_navigation);

var _settingsPanel = require("./settings-panel");

var _settingsPanel2 = _interopRequireDefault(_settingsPanel);

var _messageDialog = require("./message-dialog");

var _messageDialog2 = _interopRequireDefault(_messageDialog);

var _utilsKeyUtil = require("../utils/key-util");

var _utilsKeyUtil2 = _interopRequireDefault(_utilsKeyUtil);

var _utilsStringUtil = require("../utils/string-util");

var _utilsStringUtil2 = _interopRequireDefault(_utilsStringUtil);

var _storesUrlParameters = require("../stores/url-parameters");

var _storesUrlParameters2 = _interopRequireDefault(_storesUrlParameters);

function ViewerApp() {
    var _this = this;

    this.documentOptions = new _modelsDocumentOptions2["default"]();
    this.viewerOptions = new _modelsViewerOptions2["default"]();

    this.documentOptions.pageStyle.setViewerFontSizeObservable(this.viewerOptions.fontSize);

    if (this.viewerOptions.profile()) {
        _modelsVivliostyle2["default"].profile.profiler.enable();
    }
    this.isDebug = _storesUrlParameters2["default"].getParameter("debug")[0] === "true";
    this.viewerSettings = {
        userAgentRootURL: _storesUrlParameters2["default"].getBaseURL() + "resources/",
        viewportElement: document.getElementById("vivliostyle-viewer-viewport"),
        debug: this.isDebug
    };

    // Remove redundant or ineffective URL parameters
    if (_storesUrlParameters2["default"].getParameter("b")[0]) {
        _storesUrlParameters2["default"].removeParameter("b", true); // only first one is effective
        _storesUrlParameters2["default"].removeParameter("x"); // x= is ineffective when b= is given
    }
    _storesUrlParameters2["default"].removeParameter("f", true); // only first one is effective
    _storesUrlParameters2["default"].removeParameter("spread", true);
    _storesUrlParameters2["default"].removeParameter("renderAllPages", true);
    _storesUrlParameters2["default"].removeParameter("fontSize", true);
    _storesUrlParameters2["default"].removeParameter("profile", true);
    _storesUrlParameters2["default"].removeParameter("debug", true);

    this.viewer = new _viewer2["default"](this.viewerSettings, this.viewerOptions);

    this.viewer.inputUrl.subscribe(function (inputUrl) {
        if (inputUrl != "") {
            if (!_storesUrlParameters2["default"].hasParameter("b")) {
                // Push current URL to browser history to enable to go back here when browser Back button is clicked.
                if (_storesUrlParameters2["default"].history.pushState) _storesUrlParameters2["default"].history.pushState(null, "");
            }
            if (inputUrl.startsWith("<")) {
                // seems start tag, so convert to data url
                inputUrl = "data:," + encodeURI(inputUrl);
            } else {
                inputUrl = _utilsStringUtil2["default"].percentEncodeAmpersandAndUnencodedPercent(inputUrl);
            }
            _storesUrlParameters2["default"].setParameter("b", inputUrl, true);
        } else {
            _storesUrlParameters2["default"].removeParameter("b");
        }
    });

    this.messageDialog = new _messageDialog2["default"](_modelsMessageQueue2["default"]);

    var settingsPanelOptions = {
        disablePageStyleChange: false,
        disablePageViewModeChange: false,
        disableRenderAllPagesChange: false
    };

    this.settingsPanel = new _settingsPanel2["default"](this.viewerOptions, this.documentOptions, this.viewer, this.messageDialog, settingsPanelOptions);

    var navigationOptions = {
        disableTOCNavigation: false,
        disablePageNavigation: false,
        disableZoom: false,
        disableFontSizeChange: false
    };

    this.navigation = new _navigation2["default"](this.viewerOptions, this.viewer, this.settingsPanel, navigationOptions);

    this.handleKey = function (data, event) {
        var key = _utilsKeyUtil2["default"].identifyKeyFromEvent(event);
        if (document.activeElement.id === "vivliostyle-input-url") {
            if (key === "Enter" && event.keyCode === 13) {
                _this.documentOptions.bookUrl(_storesUrlParameters2["default"].getParameter("b", true)[0]);
                _this.viewer.loadDocument(_this.documentOptions);
                return false;
            }
            return true;
        }
        if (!(key === "Home" || key === "End") && (event.ctrlKey || event.metaKey) || event.altKey || event.shiftKey) {
            return true;
        }
        var ret = _this.settingsPanel.handleKey(key);
        if (ret) {
            ret = _this.navigation.handleKey(key);
        }
        return ret;
    };

    this.viewer.loadDocument(this.documentOptions);

    window.onhashchange = function () {
        if (window.location.href != _storesUrlParameters2["default"].storedUrl) {
            // Reload when address bar change is detected
            window.location.reload();
        }
    };
}

exports["default"] = ViewerApp;
module.exports = exports["default"];

},{"../models/document-options":6,"../models/message-queue":7,"../models/viewer-options":10,"../models/vivliostyle":11,"../stores/url-parameters":13,"../utils/key-util":14,"../utils/string-util":16,"./message-dialog":17,"./navigation":18,"./settings-panel":19,"./viewer":21}],21:[function(require,module,exports){
/*
 * Copyright 2015 Trim-marks Inc.
 * Copyright 2018 Vivliostyle Foundation
 *
 * This file is part of Vivliostyle UI.
 *
 * Vivliostyle UI is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * Vivliostyle UI is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with Vivliostyle UI.  If not, see <http://www.gnu.org/licenses/>.
 */

"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var _knockout = require("knockout");

var _knockout2 = _interopRequireDefault(_knockout);

var _utilsObservableUtil = require("../utils/observable-util");

var _utilsObservableUtil2 = _interopRequireDefault(_utilsObservableUtil);

var _loggingLogger = require("../logging/logger");

var _loggingLogger2 = _interopRequireDefault(_loggingLogger);

var _modelsVivliostyle = require("../models/vivliostyle");

var _modelsVivliostyle2 = _interopRequireDefault(_modelsVivliostyle);

var Viewer = (function () {
    function Viewer(viewerSettings, viewerOptions) {
        _classCallCheck(this, Viewer);

        this.viewerOptions_ = viewerOptions;
        this.documentOptions_ = null;
        this.viewer_ = new _modelsVivliostyle2["default"].viewer.Viewer(viewerSettings, viewerOptions.toObject());
        var state_ = this.state_ = {
            status: _utilsObservableUtil2["default"].readonlyObservable(_modelsVivliostyle2["default"].constants.ReadyState.LOADING),
            pageProgression: _utilsObservableUtil2["default"].readonlyObservable(_modelsVivliostyle2["default"].constants.PageProgression.LTR)
        };
        this.state = {
            status: state_.status.getter.extend({
                rateLimit: { timeout: 100, method: "notifyWhenChangesStop" },
                notify: 'always'
            }),
            navigatable: _knockout2["default"].pureComputed(function () {
                return state_.status.value() && state_.status.value() !== _modelsVivliostyle2["default"].constants.ReadyState.LOADING;
            }),
            pageProgression: state_.pageProgression.getter
        };

        this.epage = _knockout2["default"].observable();
        this.epageCount = _knockout2["default"].observable();
        this.firstPage = _knockout2["default"].observable();
        this.lastPage = _knockout2["default"].observable();
        this.tocVisible = _knockout2["default"].observable();
        this.tocPinned = _knockout2["default"].observable();

        this.inputUrl = _knockout2["default"].observable("");

        this.setupViewerEventHandler();
        this.setupViewerOptionSubscriptions();
    }

    _createClass(Viewer, [{
        key: "setupViewerEventHandler",
        value: function setupViewerEventHandler() {
            var _this = this;

            var logger = _loggingLogger2["default"].getLogger();
            var intervalID = 0;
            this.viewer_.addListener("debug", function (payload) {
                logger.debug(payload.content);
            });
            this.viewer_.addListener("info", function (payload) {
                logger.info(payload.content);
            });
            this.viewer_.addListener("warn", function (payload) {
                logger.warn(payload.content);
            });
            this.viewer_.addListener("error", function (payload) {
                logger.error(payload.content);
            });
            this.viewer_.addListener("readystatechange", function () {
                var readyState = _this.viewer_.readyState;
                if (readyState === _modelsVivliostyle2["default"].constants.ReadyState.INTERACTIVE || readyState === _modelsVivliostyle2["default"].constants.ReadyState.COMPLETE) {
                    _this.state_.pageProgression.value(_this.viewer_.getCurrentPageProgression());
                }
                _this.state_.status.value(readyState);
            });
            this.viewer_.addListener("loaded", function () {
                if (_this.viewerOptions_.profile()) {
                    _modelsVivliostyle2["default"].profile.profiler.printTimings();
                }
            });
            this.viewer_.addListener("nav", function (payload) {
                var cfi = payload.cfi;
                var first = payload.first;
                var last = payload.last;
                var epage = payload.epage;
                var epageCount = payload.epageCount;
                var metadata = payload.metadata;
                var docTitle = payload.docTitle;

                if (cfi) {
                    _this.documentOptions_.fragment(cfi);
                }
                if (first !== undefined) {
                    _this.firstPage(first);
                }
                if (last !== undefined) {
                    _this.lastPage(last);
                }
                if (epage !== undefined) {
                    _this.epage(epage);
                }
                if (epageCount !== undefined) {
                    _this.epageCount(epageCount);
                }
                if (metadata || docTitle) {
                    var pubTitles = metadata && metadata["http://purl.org/dc/terms/title"];
                    var pubTitle = pubTitles && pubTitles[0] && pubTitles[0]["v"];
                    if (!pubTitle) {
                        document.title = docTitle ? docTitle : "Vivliostyle Viewer";
                    } else if (!docTitle || docTitle === pubTitle || _this.firstPage() || /\.xhtml$/.test(docTitle)) {
                        // ignore ugly titles copied from *.xhtml file name
                        document.title = pubTitle;
                    } else {
                        document.title = docTitle + " | " + pubTitle;
                    }
                }

                var tocVisibleOld = _this.tocVisible();
                var tocVisibleNew = _this.viewer_.isTOCVisible();
                if (tocVisibleOld && !tocVisibleNew) {
                    // When resize, TOC box will be regenerated and hidden temporarily.
                    // So keep TOC toggle button status on.
                } else {
                        _this.tocVisible(tocVisibleNew);
                    }
            });
            this.viewer_.addListener("hyperlink", function (payload) {
                if (payload.internal) {
                    _this.navigateToInternalUrl(payload.href);

                    // When navigate from TOC, TOC box may or may not become hidden by autohide.
                    // Here set tocVisible false and it may become true again in "nav" event.
                    if (_this.tocVisible()) {
                        _this.tocVisible(false);
                    }

                    document.getElementById("vivliostyle-viewer-viewport").focus();
                } else {
                    window.location.href = payload.href;
                }
            });
        }
    }, {
        key: "setupViewerOptionSubscriptions",
        value: function setupViewerOptionSubscriptions() {
            _knockout2["default"].computed(function () {
                var viewerOptions = this.viewerOptions_.toObject();
                this.viewer_.setOptions(viewerOptions);
            }, this).extend({ rateLimit: 0 });
        }
    }, {
        key: "loadDocument",
        value: function loadDocument(documentOptions, viewerOptions) {
            this.state_.status.value(_modelsVivliostyle2["default"].constants.ReadyState.LOADING);
            if (viewerOptions) {
                this.viewerOptions_.copyFrom(viewerOptions);
            }
            this.documentOptions_ = documentOptions;

            if (documentOptions.xUrl()) {
                this.viewer_.loadDocument(documentOptions.xUrl(), documentOptions.toObject(), this.viewerOptions_.toObject());
            } else if (documentOptions.bookUrl()) {
                if (this.viewer_.loadPublication) // new name
                    this.viewer_.loadPublication(documentOptions.bookUrl(), documentOptions.toObject(), this.viewerOptions_.toObject());else // old name
                    this.viewer_.loadEPUB(documentOptions.bookUrl(), documentOptions.toObject(), this.viewerOptions_.toObject());
            } else {
                // No document specified, show welcome page
                this.state_.status.value("");
            }
        }
    }, {
        key: "navigateToPrevious",
        value: function navigateToPrevious() {
            this.viewer_.navigateToPage("previous");
        }
    }, {
        key: "navigateToNext",
        value: function navigateToNext() {
            this.viewer_.navigateToPage("next");
        }
    }, {
        key: "navigateToLeft",
        value: function navigateToLeft() {
            this.viewer_.navigateToPage("left");
        }
    }, {
        key: "navigateToRight",
        value: function navigateToRight() {
            this.viewer_.navigateToPage("right");
        }
    }, {
        key: "navigateToFirst",
        value: function navigateToFirst() {
            this.viewer_.navigateToPage("first");
        }
    }, {
        key: "navigateToLast",
        value: function navigateToLast() {
            this.viewer_.navigateToPage("last");
        }
    }, {
        key: "navigateToEPage",
        value: function navigateToEPage(epage) {
            this.viewer_.navigateToPage("epage", epage);
        }
    }, {
        key: "navigateToInternalUrl",
        value: function navigateToInternalUrl(href) {
            this.viewer_.navigateToInternalUrl(href);
        }
    }, {
        key: "queryZoomFactor",
        value: function queryZoomFactor(type) {
            return this.viewer_.queryZoomFactor(type);
        }
    }, {
        key: "epageToPageNumber",
        value: function epageToPageNumber(epage) {
            if (!epage && epage != 0) {
                return undefined;
            }
            var pageNumber = Math.round(epage + 1);
            return pageNumber;
        }
    }, {
        key: "epageFromPageNumber",
        value: function epageFromPageNumber(pageNumber) {
            if (!pageNumber && pageNumber != 0) {
                return undefined;
            }
            var epage = pageNumber - 1;
            return epage;
        }
    }, {
        key: "showTOC",
        value: function showTOC(opt_show, opt_autohide) {
            if (this.viewer_.isTOCVisible() == null) {
                // TOC is unavailable
                return;
            }
            var show = opt_show == null ? !this.tocVisible() : opt_show;
            this.tocVisible(show);
            this.tocPinned(show ? !opt_autohide : false);
            this.viewer_.showTOC(show, opt_autohide);
        }
    }]);

    return Viewer;
})();

exports["default"] = Viewer;
module.exports = exports["default"];

},{"../logging/logger":4,"../models/vivliostyle":11,"../utils/observable-util":15,"knockout":1}],22:[function(require,module,exports){
/*
 * Copyright 2015 Trim-marks Inc.
 *
 * This file is part of Vivliostyle UI.
 *
 * Vivliostyle UI is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * Vivliostyle UI is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with Vivliostyle UI.  If not, see <http://www.gnu.org/licenses/>.
 */

"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

var _knockout = require("knockout");

var _knockout2 = _interopRequireDefault(_knockout);

var _bindingsMenuButtonJs = require("./bindings/menuButton.js");

var _bindingsMenuButtonJs2 = _interopRequireDefault(_bindingsMenuButtonJs);

var _bindingsSwipePagesJs = require("./bindings/swipePages.js");

var _bindingsSwipePagesJs2 = _interopRequireDefault(_bindingsSwipePagesJs);

var _viewmodelsViewerApp = require("./viewmodels/viewer-app");

var _viewmodelsViewerApp2 = _interopRequireDefault(_viewmodelsViewerApp);

exports["default"] = {
    start: function start() {
        function startViewer() {
            _knockout2["default"].applyBindings(new _viewmodelsViewerApp2["default"]());
        }

        if (window["__loaded"]) startViewer();else window.onload = startViewer;
    }
};
module.exports = exports["default"];

},{"./bindings/menuButton.js":2,"./bindings/swipePages.js":3,"./viewmodels/viewer-app":20,"knockout":1}],23:[function(require,module,exports){
(function (global){
/*
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
 * Vivliostyle core 2019.1.103-pre.20190306144520
 */
(function(factory) {
    if (typeof define === "function" && define.amd) {
        // AMD
        define([], factory);
    } else if (typeof module === "object") {
        // Node.js
        var enclosingObject = {};
        module.exports = factory(enclosingObject);
    } else if (typeof exports === "object") {
        // CommonJS
        var enclosingObject = {};
        exports = factory(enclosingObject);
    } else {
        // Attach to the window object
        factory(window);
    }
})(function(enclosingObject) {
    enclosingObject = enclosingObject || {};
    var n,aa="function"==typeof Object.defineProperties?Object.defineProperty:function(a,b,c){if(c.get||c.set)throw new TypeError("ES3 does not support getters and setters.");a!=Array.prototype&&a!=Object.prototype&&(a[b]=c.value)},ba="undefined"!=typeof window&&window===this?this:"undefined"!=typeof global?global:this;function ca(){ca=function(){};ba.Symbol||(ba.Symbol=da)}var ea=0;function da(a){return"jscomp_symbol_"+(a||"")+ea++}
function fa(){ca();var a=ba.Symbol.iterator;a||(a=ba.Symbol.iterator=ba.Symbol("iterator"));"function"!=typeof Array.prototype[a]&&aa(Array.prototype,a,{configurable:!0,writable:!0,value:function(){return ga(this)}});fa=function(){}}function ga(a){var b=0;return ha(function(){return b<a.length?{done:!1,value:a[b++]}:{done:!0}})}function ha(a){fa();a={next:a};a[ba.Symbol.iterator]=function(){return this};return a}function t(a){fa();var b=a[Symbol.iterator];return b?b.call(a):ga(a)}
function ia(a){if(!(a instanceof Array)){a=t(a);for(var b,c=[];!(b=a.next()).done;)c.push(b.value);a=c}return a}function ja(a,b){if(b){for(var c=ba,d=a.split("."),e=0;e<d.length-1;e++){var f=d[e];f in c||(c[f]={});c=c[f]}d=d[d.length-1];e=c[d];f=b(e);f!=e&&null!=f&&aa(c,d,{configurable:!0,writable:!0,value:f})}}
ja("Array.from",function(a){return a?a:function(a,c,d){fa();c=c?c:function(a){return a};var b=[],f=a[Symbol.iterator];if("function"==typeof f)for(a=f.call(a);!(f=a.next()).done;)b.push(c.call(d,f.value));else for(var f=a.length,g=0;g<f;g++)b.push(c.call(d,a[g]));return b}});
function ka(a,b,c){if(null==a)throw new TypeError("The 'this' value for String.prototype."+c+" must not be null or undefined");if(b instanceof RegExp)throw new TypeError("First argument to String.prototype."+c+" must not be a regular expression");return a+""}ja("String.prototype.startsWith",function(a){return a?a:function(a,c){var b=ka(this,a,"startsWith");a+="";for(var e=b.length,f=a.length,g=Math.max(0,Math.min(c|0,b.length)),h=0;h<f&&g<e;)if(b[g++]!=a[h++])return!1;return h>=f}});
ja("Object.assign",function(a){return a?a:function(a,c){for(var b=1;b<arguments.length;b++){var e=arguments[b];if(e)for(var f in e)Object.prototype.hasOwnProperty.call(e,f)&&(a[f]=e[f])}return a}});function la(a,b){fa();a instanceof String&&(a+="");var c=0,d={next:function(){if(c<a.length){var e=c++;return{value:b(e,a[e]),done:!1}}d.next=function(){return{done:!0,value:void 0}};return d.next()}};d[Symbol.iterator]=function(){return d};return d}
ja("Array.prototype.values",function(a){return a?a:function(){return la(this,function(a,c){return c})}});ja("String.prototype.includes",function(a){return a?a:function(a,c){return-1!==ka(this,a,"includes").indexOf(a,c||0)}});ja("Array.prototype.findIndex",function(a){return a?a:function(a,c){var b;a:{b=this;b instanceof String&&(b=String(b));for(var e=b.length,f=0;f<e;f++)if(a.call(c,b[f],f,b)){b=f;break a}b=-1}return b}});
ja("String.prototype.endsWith",function(a){return a?a:function(a,c){var b=ka(this,a,"endsWith");a+="";void 0===c&&(c=b.length);for(var e=Math.max(0,Math.min(c|0,b.length)),f=a.length;0<f&&0<e;)if(b[--e]!=a[--f])return!1;return 0>=f}});var na=this;
function oa(a,b){var c="undefined"!==typeof enclosingObject&&enclosingObject?enclosingObject:window,d=a.split("."),c=c||na;d[0]in c||!c.execScript||c.execScript("var "+d[0]);for(var e;d.length&&(e=d.shift());)d.length||void 0===b?c[e]?c=c[e]:c=c[e]={}:c[e]=b}
function v(a,b){function c(){}c.prototype=b.prototype;a.ng=b.prototype;a.prototype=new c;a.prototype.constructor=a;a.nh=function(a,c,f){for(var d=Array(arguments.length-2),e=2;e<arguments.length;e++)d[e-2]=arguments[e];return b.prototype[c].apply(a,d)}};function pa(a){if(Error.captureStackTrace)Error.captureStackTrace(this,pa);else{var b=Error().stack;b&&(this.stack=b)}a&&(this.message=String(a))}v(pa,Error);pa.prototype.name="CustomError";function qa(a,b){for(var c=a.split("%s"),d="",e=Array.prototype.slice.call(arguments,1);e.length&&1<c.length;)d+=c.shift()+e.shift();return d+c.join("%s")};function ra(a,b){b.unshift(a);pa.call(this,qa.apply(null,b));b.shift()}v(ra,pa);ra.prototype.name="AssertionError";function sa(a,b){throw new ra("Failure"+(a?": "+a:""),Array.prototype.slice.call(arguments,1));};function ta(a){var b=a.error,c=b&&(b.frameTrace||b.stack);a=[].concat(a.messages);b&&(0<a.length&&(a=a.concat(["\n"])),a=a.concat([b.toString()]),c&&(a=a.concat(["\n"]).concat(c)));return a}function ua(a){a=Array.from(a);var b=null;a[0]instanceof Error&&(b=a.shift());return{error:b,messages:a}}function va(a){this.f=a;this.Pb={}}function wa(a,b,c){(a=a.Pb[b])&&a.forEach(function(a){a(c)})}function xa(a,b){var c=w,d=c.Pb[a];d||(d=c.Pb[a]=[]);d.push(b)}
va.prototype.debug=function(a){var b=ua(arguments),c=ta(b);this.f?this.f.debug?this.f.debug.apply(this.f,[].concat(ia(c))):this.f.log.apply(this.f,[].concat(ia(c))):console.debug.apply(console,[].concat(ia(c)));wa(this,1,b)};va.prototype.g=function(a){var b=ua(arguments),c=ta(b);this.f?this.f.info?this.f.info.apply(this.f,[].concat(ia(c))):this.f.log.apply(this.f,[].concat(ia(c))):console.info.apply(console,[].concat(ia(c)));wa(this,2,b)};
va.prototype.b=function(a){var b=ua(arguments),c=ta(b);this.f?this.f.warn?this.f.warn.apply(this.f,[].concat(ia(c))):this.f.log.apply(this.f,[].concat(ia(c))):console.warn.apply(console,[].concat(ia(c)));wa(this,3,b)};va.prototype.error=function(a){var b=ua(arguments),c=ta(b);this.f?this.f.error?this.f.error.apply(this.f,[].concat(ia(c))):this.f.log.apply(this.f,[].concat(ia(c))):console.error.apply(console,[].concat(ia(c)));wa(this,4,b)};var w=new va;function ya(a){var b=a.match(/^([^#]*)/);return b?b[1]:a}var za=window.location.href,Aa=window.location.href;
function Ba(a,b){if(b.startsWith("data:"))return a||b;if(!b||a.match(/^\w{2,}:/)){if(a.toLowerCase().match("^javascript:"))return"#";a.match(/^\w{2,}:\/\/[^\/]+$/)&&(a+="/");return a}b.match(/^\w{2,}:\/\/[^\/]+$/)&&(b+="/");var c;if(a.match(/^\/\//))return(c=b.match(/^(\w{2,}:)\/\//))?c[1]+a:a;if(a.match(/^\//))return(c=b.match(/^(\w{2,}:\/\/[^\/]+)\//))?c[1]+a:a;a.match(/^\.(\/|$)/)&&(a=a.substr(2));c=b;var d=c.match(/^([^#?]*)/);b=d?d[1]:c;if(a.match(/^\#/))return b+a;c=b.lastIndexOf("/");if(0>
c)return a;if(c<b.length-1&&b.lastIndexOf(".")<c){if(""==a)return b;b+="/";c=b.length-1}for(d=b.substr(0,c+1)+a;;){c=d.indexOf("/../");if(0>=c)break;var e=d.lastIndexOf("/",c-1);if(0>=e)break;d=d.substr(0,e)+d.substr(c+3)}return d.replace(/\/(\.\/)+/g,"/")}
function Ea(a){var b;if(b=/^(https?:)\/\/github\.com\/([^/]+\/[^/]+)\/(blob\/|tree\/|raw\/)?(.*)$/.exec(a))a=b[1]+"//raw.githubusercontent.com/"+b[2]+"/"+(b[3]?"":"master/")+b[4];else if(b=/^(https?:)\/\/www\.aozora\.gr\.jp\/(cards\/[^/]+\/files\/[^/.]+\.html)$/.exec(a))a=b[1]+"//raw.githubusercontent.com/aozorabunko/aozorabunko/master/"+b[2];else if(b=/^(https?:)\/\/gist\.github\.com\/([^/]+\/\w+)(\/|$)(raw(\/|$))?(.*)$/.exec(a))a=b[1]+"//gist.githubusercontent.com/"+b[2]+"/raw/"+b[6];else if(b=
/^(https?:)\/\/(?:[^/.]+\.)?jsbin\.com\/(?!(?:blog|help)\b)(\w+)((\/\d+)?).*$/.exec(a))a=b[1]+"//output.jsbin.com/"+b[2]+b[3]+"/";return a}function Fa(a){a=new RegExp("#(.*&)?"+Ga(a)+"=([^#&]*)");return(a=window.location.href.match(a))?a[2]:null}function Ha(a,b){var c=new RegExp("#(.*&)?"+Ga("f")+"=([^#&]*)"),d=a.match(c);return d?(c=d[2].length,d=d.index+d[0].length-c,a.substr(0,d)+b+a.substr(d+c)):a.match(/#/)?a+"&f="+b:a+"#f="+b}function Ia(a){return null==a?a:a.toString()}
function Ja(){this.b=[null]}Ja.prototype.length=function(){return this.b.length-1};function Ka(a,b){a&&(b="-"+b,a=a.replace(/-/g,""),"moz"===a&&(a="Moz"));return a+b.replace(/-[a-z]/g,function(a){return a.substr(1).toUpperCase()})}var La=" -webkit- -moz- -ms- -o- -epub-".split(" "),Ma={};
function Na(a,b){if("writing-mode"===b){var c=document.createElement("span");if("-ms-"===a)return c.style.setProperty(a+b,"tb-rl"),"tb-rl"===c.style["writing-mode"];c.style.setProperty(a+b,"vertical-rl");return"vertical-rl"===c.style[a+b]}return"string"===typeof document.documentElement.style[Ka(a,b)]}
function Oa(a){var b=Ma[a];if(b||null===b)return b;switch(a){case "writing-mode":if(Na("-ms-","writing-mode"))return Ma[a]=["-ms-writing-mode"],["-ms-writing-mode"];break;case "filter":if(Na("-webkit-","filter"))return Ma[a]=["-webkit-filter"],["-webkit-filter"];break;case "clip-path":if(Na("-webkit-","clip-path"))return Ma[a]=["-webkit-clip-path","clip-path"];break;case "margin-inline-start":if(Na("-webkit-","margin-start"))return Ma[a]=["-webkit-margin-start"],["-webkit-margin-start"];break;case "margin-inline-end":if(Na("-webkit-",
"margin-end"))return Ma[a]=["-webkit-margin-end"],["-webkit-margin-end"];case "padding-inline-start":if(Na("-webkit-","padding-start"))return Ma[a]=["-webkit-padding-start"],["-webkit-padding-start"];break;case "padding-inline-end":if(Na("-webkit-","padding-end"))return Ma[a]=["-webkit-padding-end"],["-webkit-padding-end"]}for(var b=t(La),c=b.next();!c.done;c=b.next())if(c=c.value,Na(c,a))return b=c+a,Ma[a]=[b],[b];w.b("Property not supported by the browser: ",a);return Ma[a]=null}
function x(a,b,c){try{var d=Oa(b);d&&d.forEach(function(b){if("-ms-writing-mode"===b)switch(c){case "horizontal-tb":c="lr-tb";break;case "vertical-rl":c="tb-rl";break;case "vertical-lr":c="tb-lr"}a&&a.style&&a.style.setProperty(b,c)})}catch(e){w.b(e)}}function Pa(a,b,c){try{var d=Ma[b];return a.style.getPropertyValue(d?d[0]:b)}catch(e){}return c||""}
function Qa(a){var b=a.getAttributeNS("http://www.w3.org/XML/1998/namespace","lang");b||"http://www.w3.org/1999/xhtml"!=a.namespaceURI||(b=a.getAttribute("lang"));return b}function Ra(){this.b=[]}Ra.prototype.append=function(a){this.b.push(a);return this};Ra.prototype.toString=function(){var a=this.b.join("");this.b=[a];return a};function Sa(a){return"\\"+a.charCodeAt(0).toString(16)+" "}function Ta(a){return a.replace(/[^-_a-zA-Z0-9\u0080-\uFFFF]/g,Sa)}
function Ua(a){return a.replace(/[\u0000-\u001F"\\]/g,Sa)}function Va(a){return a.replace(/[\s+&?=#\u007F-\uFFFF]+/g,encodeURIComponent)}function Wa(a){return!!a.match(/^[a-zA-Z\u009E\u009F\u00C0-\u00D6\u00D8-\u00F6\u00F8-\u024F\u037B-\u037D\u0386\u0388-\u0482\u048A-\u0527]$/)}function Ga(a,b){return a.replace(/[^-a-zA-Z0-9_]/g,function(a){return("string"===typeof b?b:"\\u")+(65536|a.charCodeAt(0)).toString(16).substr(1)})}
function Xa(a){var b=":",b="string"===typeof b?b:"\\u",c=new RegExp(Ga(b)+"[0-9a-fA-F]{4}","g");return a.replace(c,function(a){var c=b,c="string"===typeof c?c:"\\u";return a.indexOf(c)?a:String.fromCharCode(parseInt(a.substring(c.length),16))})}function Ya(a){if(!a)throw"Assert failed";}function Za(a,b){for(var c=0,d=a;;){Ya(c<=d);Ya(!c||!b(c-1));Ya(d==a||b(d));if(c==d)return c;var e=c+d>>1;b(e)?d=e:c=e+1}}function $a(a,b){return a-b}
function ab(a,b){for(var c={},d=t(a),e=d.next();!e.done;e=d.next()){var e=e.value,f=b(e);f&&!c[f]&&(c[f]=e)}return c}var bb={};function cb(a,b){for(var c={},d=t(a),e=d.next();!e.done;e=d.next()){var e=e.value,f=b(e);f&&(c[f]?c[f].push(e):c[f]=[e])}return c}function db(a,b){for(var c=Array(a.length),d=0;d<a.length;d++)c[d]=b(a[d],d);return c}function eb(a,b){var c={},d;for(d in a)c[d]=b(a[d],d);return c}function fb(){this.Pb={}}
function gb(a,b){var c=a.Pb[b.type];if(c){b.target=a;b.currentTarget=a;for(var d=0;d<c.length;d++)c[d](b)}}fb.prototype.addEventListener=function(a,b,c){c||((c=this.Pb[a])?c.push(b):this.Pb[a]=[b])};fb.prototype.removeEventListener=function(a,b,c){!c&&(a=this.Pb[a])&&(b=a.indexOf(b),0<=b&&a.splice(b,1))};var hb=null,ib=null,jb=null,kb=null;function lb(a){return 1==a.nodeType&&(a=a.getAttribute("id"))&&a.match(/^[-a-zA-Z_0-9.\u007F-\uFFFF]+$/)?a:null}function mb(a){return"^"+a}function nb(a){return a.substr(1)}function ob(a){return a?a.replace(/\^[\[\]\(\),=;^]/g,nb):a}
function pb(a){for(var b={};a;){var c=a.match(/^;([^;=]+)=(([^;]|\^;)*)/);if(!c)break;var d=c[1],e;a:{e=c[2];var f=[];do{var g=e.match(/^(\^,|[^,])*/),h=ob(g[0]);e=e.substr(g[0].length+1);if(!e&&!f.length){e=h;break a}f.push(h)}while(e);e=f}b[d]=e;a=a.substr(c[0].length)}return b}function qb(){}qb.prototype.g=function(a){a.append("!")};qb.prototype.h=function(){return!1};function rb(a,b,c){this.index=a;this.id=b;this.Hb=c}
rb.prototype.g=function(a){a.append("/");a.append(this.index.toString());if(this.id||this.Hb)a.append("["),this.id&&a.append(this.id),this.Hb&&(a.append(";s="),a.append(this.Hb)),a.append("]")};
rb.prototype.h=function(a){if(1!=a.node.nodeType)throw Error("E_CFI_NOT_ELEMENT");var b=a.node,c=b.children,d=c.length,e=Math.floor(this.index/2)-1;0>e||!d?(c=b.firstChild,a.node=c||b):(c=c[Math.min(e,d-1)],this.index&1&&((b=c.nextSibling)&&1!=b.nodeType?c=b:a.K=!0),a.node=c);if(this.id&&(a.K||this.id!=lb(a.node)))throw Error("E_CFI_ID_MISMATCH");a.Hb=this.Hb;return!0};function tb(a,b,c,d){this.offset=a;this.f=b;this.b=c;this.Hb=d}
tb.prototype.h=function(a){if(0<this.offset&&!a.K){for(var b=this.offset,c=a.node;;){var d=c.nodeType;if(1==d)break;var e=c.nextSibling;if(3<=d&&5>=d){d=c.textContent.length;if(b<=d)break;if(!e){b=d;break}b-=d}if(!e){b=0;break}c=e}a.node=c;a.offset=b}a.Hb=this.Hb;return!0};
tb.prototype.g=function(a){a.append(":");a.append(this.offset.toString());if(this.f||this.b||this.Hb){a.append("[");if(this.f||this.b)this.f&&a.append(this.f.replace(/[\[\]\(\),=;^]/g,mb)),a.append(","),this.b&&a.append(this.b.replace(/[\[\]\(\),=;^]/g,mb));this.Hb&&(a.append(";s="),a.append(this.Hb));a.append("]")}};function ub(){this.pa=null}
function vb(a,b){var c=b.match(/^#?epubcfi\((.*)\)$/);if(!c)throw Error("E_CFI_NOT_CFI");for(var d=c[1],e=0,f=[];;)switch(d.charAt(e)){case "/":e++;c=d.substr(e).match(/^(0|[1-9][0-9]*)(\[([-a-zA-Z_0-9.\u007F-\uFFFF]+)(;([^\]]|\^\])*)?\])?/);if(!c)throw Error("E_CFI_NUMBER_EXPECTED");var e=e+c[0].length,g=parseInt(c[1],10),h=c[3],c=pb(c[4]);f.push(new rb(g,h,Ia(c.s)));break;case ":":e++;c=d.substr(e).match(/^(0|[1-9][0-9]*)(\[((([^\];,]|\^[\];,])*)(,(([^\];,]|\^[\];,])*))?)(;([^]]|\^\])*)?\])?/);
if(!c)throw Error("E_CFI_NUMBER_EXPECTED");e+=c[0].length;g=parseInt(c[1],10);(h=c[4])&&(h=ob(h));var l=c[7];l&&(l=ob(l));c=pb(c[10]);f.push(new tb(g,h,l,Ia(c.s)));break;case "!":e++;f.push(new qb);break;case "~":case "@":case "":a.pa=f;return;default:throw Error("E_CFI_PARSE_ERROR");}}function wb(a,b){for(var c={node:b.documentElement,offset:0,K:!1,Hb:null,sd:null},d=0;d<a.pa.length;d++)if(!a.pa[d].h(c)){c.sd=new ub;c.sd.pa=a.pa.slice(d+1);break}return c}
ub.prototype.trim=function(a,b){return a.replace(/\s+/g," ").match(b?/^[ -\uD7FF\uE000-\uFFFF]{0,8}/:/[ -\uD7FF\uE000-\uFFFF]{0,8}$/)[0].replace(/^\s/,"").replace(/\s$/,"")};
function xb(a,b,c){for(var d=!1,e=null,f=[],g=b.parentNode,h="",l="";b;){switch(b.nodeType){case 3:case 4:case 5:var k=b.textContent,m=k.length;d?(c+=m,h||(h=k)):(c>m&&(c=m),d=!0,h=k.substr(0,c),l=k.substr(c));b=b.previousSibling;continue;case 8:b=b.previousSibling;continue}break}if(0<c||h||l)h=a.trim(h,!1),l=a.trim(l,!0),f.push(new tb(c,h,l,e)),e=null;for(;g&&g&&9!=g.nodeType;){c=d?null:lb(b);for(d=d?1:0;b;)1==b.nodeType&&(d+=2),b=b.previousSibling;f.push(new rb(d,c,e));e=null;b=g;g=g.parentNode;
d=!1}f.reverse();a.pa?(f.push(new qb),a.pa=f.concat(a.pa)):a.pa=f}ub.prototype.toString=function(){if(!this.pa)return"";var a=new Ra;a.append("epubcfi(");for(var b=0;b<this.pa.length;b++)this.pa[b].g(a);a.append(")");return a.toString()};function yb(){return{fontFamily:"serif",lineHeight:1.25,margin:8,xe:!1,pe:25,we:!1,Ie:!1,ub:!1,Dc:1,af:{vivliostyle:!0,print:!0},vc:void 0}}function zb(a){return{fontFamily:a.fontFamily,lineHeight:a.lineHeight,margin:a.margin,xe:a.xe,pe:a.pe,we:a.we,Ie:a.Ie,ub:a.ub,Dc:a.Dc,af:Object.assign({},a.af),vc:a.vc?Object.assign({},a.vc):void 0}}var Ab=yb(),Bb={};function Cb(a,b,c,d){a=Math.min((a-0)/c,(b-0)/d);return"matrix("+a+",0,0,"+a+",0,0)"}function Db(a){return'"'+Ua(""+a)+'"'}
function Eb(a){return Ta(""+a)}function Fb(a,b){return a?Ta(a)+"."+Ta(b):Ta(b)}var Gb=0;
function Hb(a,b){this.parent=a;this.u="S"+Gb++;this.children=[];this.b=new Ib(this,0);this.f=new Ib(this,1);this.j=new Ib(this,!0);this.h=new Ib(this,!1);a&&a.children.push(this);this.values={};this.D={};this.A={};this.l=b;if(!a){var c=this.A;c.floor=Math.floor;c.ceil=Math.ceil;c.round=Math.round;c.sqrt=Math.sqrt;c.min=Math.min;c.max=Math.max;c.letterbox=Cb;c["css-string"]=Db;c["css-name"]=Eb;c["typeof"]=function(a){return typeof a};Jb(this,"page-width",function(){return this.jc()});Jb(this,"page-height",
function(){return this.ic()});Jb(this,"pref-font-family",function(){return this.$.fontFamily});Jb(this,"pref-night-mode",function(){return this.$.Ie});Jb(this,"pref-hyphenate",function(){return this.$.xe});Jb(this,"pref-margin",function(){return this.$.margin});Jb(this,"pref-line-height",function(){return this.$.lineHeight});Jb(this,"pref-column-width",function(){return this.$.pe*this.fontSize});Jb(this,"pref-horizontal",function(){return this.$.we});Jb(this,"pref-spread-view",function(){return this.$.ub});
Jb(this,"pub-title",function(){return Db(this.yb?this.yb:"")});Jb(this,"doc-title",function(){return Db(this.fb?this.fb:"")})}}function Jb(a,b,c){a.values[b]=new Kb(a,c,b)}function Lb(a,b){a.values["page-number"]=b}function Mb(a,b){a.A["has-content"]=b}function Nb(a){switch(a.toLowerCase()){case "vw":case "vh":case "vi":case "vb":case "vmin":case "vmax":case "pvw":case "pvh":case "pvi":case "pvb":case "pvmin":case "pvmax":return!0;default:return!1}}
var Ob={px:1,"in":96,pt:4/3,pc:16,cm:96/2.54,mm:96/25.4,q:96/2.54/40,em:16,rem:16,ex:8,dppx:1,dpi:1/96,dpcm:2.54/96};function Pb(a){switch(a){case "q":case "rem":return!0;default:return!1}}function Qb(a,b,c,d){this.Cb=b;this.Lc=c;this.Y=null;this.jc=function(){return this.Y?this.Y:this.$.ub?Math.floor(b/2)-this.$.Dc:b};this.S=null;this.ic=function(){return this.S?this.S:c};this.u=d;this.Za=null;this.fontSize=function(){return this.Za?this.Za:d};this.$=Ab;this.J={};this.G=this.Z=this.ca=null}
function Rb(a,b){a.J[b.u]={};for(var c=0;c<b.children.length;c++)Rb(a,b.children[c])}
function Sb(a,b,c){if(Nb(b)){var d=a.jc()/100,e=a.ic()/100,f=null!=a.ca?a.ca/100:d,g=null!=a.Z?a.Z/100:e;switch(b){case "vw":return f;case "vh":return g;case "vi":return a.G?g:f;case "vb":return a.G?f:g;case "vmin":return f<g?f:g;case "vmax":return f>g?f:g;case "pvw":return d;case "pvh":return e;case "pvi":return a.G?e:d;case "pvb":return a.G?d:e;case "pvmin":return d<e?d:e;case "pvmax":return d>e?d:e}}return"em"==b||"rem"==b?c?a.u:a.fontSize():"ex"==b?Ob.ex*(c?a.u:a.fontSize())/Ob.em:Ob[b]}
function Tb(a,b,c){do{var d=b.values[c];if(d||b.l&&(d=b.l.call(a,c,!1)))return d;b=b.parent}while(b);throw Error("Name '"+c+"' is undefined");}function Ub(a,b,c,d,e){do{var f=b.D[c];if(f||b.l&&(f=b.l.call(a,c,!0)))return f;if(f=b.A[c]){if(e)return b.b;c=Array(d.length);for(e=0;e<d.length;e++)c[e]=d[e].evaluate(a);return new Ib(b,f.apply(a,c))}b=b.parent}while(b);throw Error("Function '"+c+"' is undefined");}
function Vb(a,b,c){var d="",e=b.match(/^(min|max)-(.*)$/);e&&(d=e[1],b=e[2]);var f=e=null;switch(b){case "width":case "height":case "device-width":case "device-height":case "color":c&&(e=c.evaluate(a))}switch(b){case "width":f=a.jc();break;case "height":f=a.ic();break;case "device-width":f=window.screen.availWidth;break;case "device-height":f=window.screen.availHeight;break;case "color":f=window.screen.pixelDepth}if(null!=f&&null!=e)switch(d){case "min":return f>=e;case "max":return f<=e;default:return f==
e}else if(null!=f&&!c)return!!f;return!1}function Wb(a){this.b=a;this.g="_"+Gb++}n=Wb.prototype;n.toString=function(){var a=new Ra;this.Ha(a,0);return a.toString()};n.Ha=function(){throw Error("F_ABSTRACT");};n.zb=function(){throw Error("F_ABSTRACT");};n.lb=function(){return this};n.wc=function(a){return a===this};function Xb(a,b,c,d){var e=d[a.g];if(null!=e)return e===Bb?!1:e;d[a.g]=Bb;b=a.wc(b,c,d);return d[a.g]=b}
n.evaluate=function(a){var b;b=(b=a.J[this.b.u])?b[this.g]:void 0;if("undefined"!=typeof b)return b;b=this.zb(a);var c=this.g,d=this.b,e=a.J[d.u];e||(e={},a.J[d.u]=e);return e[c]=b};n.gf=function(){return!1};function Yb(a,b){Wb.call(this,a);this.f=b}v(Yb,Wb);n=Yb.prototype;n.Ve=function(){throw Error("F_ABSTRACT");};n.bf=function(){throw Error("F_ABSTRACT");};n.zb=function(a){a=this.f.evaluate(a);return this.bf(a)};n.wc=function(a,b,c){return a===this||Xb(this.f,a,b,c)};
n.Ha=function(a,b){10<b&&a.append("(");a.append(this.Ve());this.f.Ha(a,10);10<b&&a.append(")")};n.lb=function(a,b){var c=this.f.lb(a,b);return c===this.f?this:new this.constructor(this.b,c)};function Zb(a,b,c){Wb.call(this,a);this.f=b;this.h=c}v(Zb,Wb);n=Zb.prototype;n.Ed=function(){throw Error("F_ABSTRACT");};n.hb=function(){throw Error("F_ABSTRACT");};n.Gb=function(){throw Error("F_ABSTRACT");};n.zb=function(a){var b=this.f.evaluate(a);a=this.h.evaluate(a);return this.Gb(b,a)};
n.wc=function(a,b,c){return a===this||Xb(this.f,a,b,c)||Xb(this.h,a,b,c)};n.Ha=function(a,b){var c=this.Ed();c<=b&&a.append("(");this.f.Ha(a,c);a.append(this.hb());this.h.Ha(a,c);c<=b&&a.append(")")};n.lb=function(a,b){var c=this.f.lb(a,b),d=this.h.lb(a,b);return c===this.f&&d===this.h?this:new this.constructor(this.b,c,d)};function $b(a,b,c){Zb.call(this,a,b,c)}v($b,Zb);$b.prototype.Ed=function(){return 1};function ac(a,b,c){Zb.call(this,a,b,c)}v(ac,Zb);ac.prototype.Ed=function(){return 2};
function bc(a,b,c){Zb.call(this,a,b,c)}v(bc,Zb);bc.prototype.Ed=function(){return 3};function cc(a,b,c){Zb.call(this,a,b,c)}v(cc,Zb);cc.prototype.Ed=function(){return 4};function dc(a,b){Yb.call(this,a,b)}v(dc,Yb);dc.prototype.Ve=function(){return"!"};dc.prototype.bf=function(a){return!a};function ec(a,b){Yb.call(this,a,b)}v(ec,Yb);ec.prototype.Ve=function(){return"-"};ec.prototype.bf=function(a){return-a};function fc(a,b,c){Zb.call(this,a,b,c)}v(fc,$b);fc.prototype.hb=function(){return"&&"};
fc.prototype.zb=function(a){return this.f.evaluate(a)&&this.h.evaluate(a)};function gc(a,b,c){Zb.call(this,a,b,c)}v(gc,fc);gc.prototype.hb=function(){return" and "};function hc(a,b,c){Zb.call(this,a,b,c)}v(hc,$b);hc.prototype.hb=function(){return"||"};hc.prototype.zb=function(a){return this.f.evaluate(a)||this.h.evaluate(a)};function ic(a,b,c){Zb.call(this,a,b,c)}v(ic,hc);ic.prototype.hb=function(){return", "};function jc(a,b,c){Zb.call(this,a,b,c)}v(jc,ac);jc.prototype.hb=function(){return"<"};
jc.prototype.Gb=function(a,b){return a<b};function kc(a,b,c){Zb.call(this,a,b,c)}v(kc,ac);kc.prototype.hb=function(){return"<="};kc.prototype.Gb=function(a,b){return a<=b};function lc(a,b,c){Zb.call(this,a,b,c)}v(lc,ac);lc.prototype.hb=function(){return">"};lc.prototype.Gb=function(a,b){return a>b};function mc(a,b,c){Zb.call(this,a,b,c)}v(mc,ac);mc.prototype.hb=function(){return">="};mc.prototype.Gb=function(a,b){return a>=b};function nc(a,b,c){Zb.call(this,a,b,c)}v(nc,ac);nc.prototype.hb=function(){return"=="};
nc.prototype.Gb=function(a,b){return a==b};function oc(a,b,c){Zb.call(this,a,b,c)}v(oc,ac);oc.prototype.hb=function(){return"!="};oc.prototype.Gb=function(a,b){return a!=b};function pc(a,b,c){Zb.call(this,a,b,c)}v(pc,bc);pc.prototype.hb=function(){return"+"};pc.prototype.Gb=function(a,b){return a+b};function qc(a,b,c){Zb.call(this,a,b,c)}v(qc,bc);qc.prototype.hb=function(){return" - "};qc.prototype.Gb=function(a,b){return a-b};function rc(a,b,c){Zb.call(this,a,b,c)}v(rc,cc);rc.prototype.hb=function(){return"*"};
rc.prototype.Gb=function(a,b){return a*b};function sc(a,b,c){Zb.call(this,a,b,c)}v(sc,cc);sc.prototype.hb=function(){return"/"};sc.prototype.Gb=function(a,b){return a/b};function tc(a,b,c){Zb.call(this,a,b,c)}v(tc,cc);tc.prototype.hb=function(){return"%"};tc.prototype.Gb=function(a,b){return a%b};function uc(a,b,c){Wb.call(this,a);this.L=b;this.ka=c.toLowerCase()}v(uc,Wb);uc.prototype.Ha=function(a){a.append(this.L.toString());a.append(Ta(this.ka))};
uc.prototype.zb=function(a){return this.L*Sb(a,this.ka,!1)};function vc(a,b){Wb.call(this,a);this.f=b}v(vc,Wb);vc.prototype.Ha=function(a){a.append(this.f)};vc.prototype.zb=function(a){return Tb(a,this.b,this.f).evaluate(a)};vc.prototype.wc=function(a,b,c){return a===this||Xb(Tb(b,this.b,this.f),a,b,c)};function wc(a,b,c){Wb.call(this,a);this.f=b;this.name=c}v(wc,Wb);wc.prototype.Ha=function(a){this.f&&a.append("not ");a.append(Ta(this.name))};
wc.prototype.zb=function(a){var b=this.name;a="all"===b||!!a.$.af[b];return this.f?!a:a};wc.prototype.wc=function(a,b,c){return a===this||Xb(this.value,a,b,c)};wc.prototype.gf=function(){return!0};function Kb(a,b,c){Wb.call(this,a);this.Pc=b;this.Xc=c}v(Kb,Wb);Kb.prototype.Ha=function(a){a.append(this.Xc)};Kb.prototype.zb=function(a){return this.Pc.call(a)};function xc(a,b,c){Wb.call(this,a);this.h=b;this.f=c}v(xc,Wb);
xc.prototype.Ha=function(a){a.append(this.h);var b=this.f;a.append("(");for(var c=0;c<b.length;c++)c&&a.append(","),b[c].Ha(a,0);a.append(")")};xc.prototype.zb=function(a){return Ub(a,this.b,this.h,this.f,!1).lb(a,this.f).evaluate(a)};xc.prototype.wc=function(a,b,c){if(a===this)return!0;for(var d=0;d<this.f.length;d++)if(Xb(this.f[d],a,b,c))return!0;return Xb(Ub(b,this.b,this.h,this.f,!0),a,b,c)};
xc.prototype.lb=function(a,b){for(var c=this.f,d=c,e=0;e<c.length;e++){var f=c[e].lb(a,b);if(c!==d)d[e]=f;else if(f!==c[e]){for(var d=Array(c.length),g=0;g<e;g++)d[g]=c[g];d[e]=f}}c=d;return c===this.f?this:new xc(this.b,this.h,c)};function yc(a,b,c,d){Wb.call(this,a);this.f=b;this.j=c;this.h=d}v(yc,Wb);yc.prototype.Ha=function(a,b){0<b&&a.append("(");this.f.Ha(a,0);a.append("?");this.j.Ha(a,0);a.append(":");this.h.Ha(a,0);0<b&&a.append(")")};
yc.prototype.zb=function(a){return this.f.evaluate(a)?this.j.evaluate(a):this.h.evaluate(a)};yc.prototype.wc=function(a,b,c){return a===this||Xb(this.f,a,b,c)||Xb(this.j,a,b,c)||Xb(this.h,a,b,c)};yc.prototype.lb=function(a,b){var c=this.f.lb(a,b),d=this.j.lb(a,b),e=this.h.lb(a,b);return c===this.f&&d===this.j&&e===this.h?this:new yc(this.b,c,d,e)};function Ib(a,b){Wb.call(this,a);this.f=b}v(Ib,Wb);
Ib.prototype.Ha=function(a){switch(typeof this.f){case "number":case "boolean":a.append(this.f.toString());break;case "string":a.append('"');a.append(Ua(this.f));a.append('"');break;default:throw Error("F_UNEXPECTED_STATE");}};Ib.prototype.zb=function(){return this.f};function zc(a,b,c){Wb.call(this,a);this.name=b;this.value=c}v(zc,Wb);zc.prototype.Ha=function(a){a.append("(");a.append(Ua(this.name.name));a.append(":");this.value.Ha(a,0);a.append(")")};
zc.prototype.zb=function(a){return Vb(a,this.name.name,this.value)};zc.prototype.wc=function(a,b,c){return a===this||Xb(this.value,a,b,c)};zc.prototype.lb=function(a,b){var c=this.value.lb(a,b);return c===this.value?this:new zc(this.b,this.name,c)};function Ac(a,b){Wb.call(this,a);this.index=b}v(Ac,Wb);Ac.prototype.Ha=function(a){a.append("$");a.append(this.index.toString())};Ac.prototype.lb=function(a,b){var c=b[this.index];if(!c)throw Error("Parameter missing: "+this.index);return c};
function Bc(a,b,c){return b===a.h||b===a.b||c==a.h||c==a.b?a.h:b===a.j||b===a.f?c:c===a.j||c===a.f?b:new fc(a,b,c)}function y(a,b,c){return b===a.b?c:c===a.b?b:new pc(a,b,c)}function B(a,b,c){return b===a.b?new ec(a,c):c===a.b?b:new qc(a,b,c)}function Cc(a,b,c){return b===a.b||c===a.b?a.b:b===a.f?c:c===a.f?b:new rc(a,b,c)}function Dc(a,b,c){return b===a.b?a.b:c===a.f?b:new sc(a,b,c)};var Ec={};function Fc(){}n=Fc.prototype;n.sc=function(a){for(var b=0;b<a.length;b++)a[b].fa(this)};n.Se=function(){throw Error("E_CSS_EMPTY_NOT_ALLOWED");};n.Te=function(){throw Error("E_CSS_SLASH_NOT_ALLOWED");};n.Bd=function(){throw Error("E_CSS_STR_NOT_ALLOWED");};n.rc=function(){throw Error("E_CSS_IDENT_NOT_ALLOWED");};n.ad=function(){throw Error("E_CSS_NUMERIC_NOT_ALLOWED");};n.$c=function(){throw Error("E_CSS_NUM_NOT_ALLOWED");};n.Zc=function(a){return this.$c(a)};
n.he=function(){throw Error("E_CSS_COLOR_NOT_ALLOWED");};n.bd=function(){throw Error("E_CSS_URL_NOT_ALLOWED");};n.Ub=function(){throw Error("E_CSS_LIST_NOT_ALLOWED");};n.qc=function(){throw Error("E_CSS_COMMA_NOT_ALLOWED");};n.Xb=function(){throw Error("E_CSS_FUNC_NOT_ALLOWED");};n.Yc=function(){throw Error("E_CSS_EXPR_NOT_ALLOWED");};function Gc(){}v(Gc,Fc);n=Gc.prototype;
n.sc=function(a){for(var b=null,c=0;c<a.length;c++){var d=a[c],e=d.fa(this);if(b)b[c]=e;else if(d!==e){b=Array(a.length);for(d=0;d<c;d++)b[d]=a[d];b[c]=e}}return b||a};n.Bd=function(a){return a};n.rc=function(a){return a};n.Te=function(a){return a};n.ad=function(a){return a};n.$c=function(a){return a};n.Zc=function(a){return a};n.he=function(a){return a};n.bd=function(a){return a};n.Ub=function(a){var b=this.sc(a.values);return b===a.values?a:new Hc(b)};
n.qc=function(a){var b=this.sc(a.values);return b===a.values?a:new Ic(b)};n.Xb=function(a){var b=this.sc(a.values);return b===a.values?a:new Jc(a.name,b)};n.Yc=function(a){return a};function Kc(){}n=Kc.prototype;n.toString=function(){var a=new Ra;this.$a(a,!0);return a.toString()};n.stringValue=function(){var a=new Ra;this.$a(a,!1);return a.toString()};n.Aa=function(){throw Error("F_ABSTRACT");};n.$a=function(a){a.append("[error]")};n.ef=function(){return!1};n.Ac=function(){return!1};n.hf=function(){return!1};
n.Vf=function(){return!1};n.Ud=function(){return!1};function Lc(){if(C)throw Error("E_INVALID_CALL");}v(Lc,Kc);Lc.prototype.Aa=function(a){return new Ib(a,"")};Lc.prototype.$a=function(){};Lc.prototype.fa=function(a){return a.Se(this)};var C=new Lc;function Mc(){if(Nc)throw Error("E_INVALID_CALL");}v(Mc,Kc);Mc.prototype.Aa=function(a){return new Ib(a,"/")};Mc.prototype.$a=function(a){a.append("/")};Mc.prototype.fa=function(a){return a.Te(this)};var Nc=new Mc;function Oc(a){this.Xc=a}v(Oc,Kc);
Oc.prototype.Aa=function(a){return new Ib(a,this.Xc)};Oc.prototype.$a=function(a,b){b?(a.append('"'),a.append(Ua(this.Xc)),a.append('"')):a.append(this.Xc)};Oc.prototype.fa=function(a){return a.Bd(this)};function Pc(a){this.name=a;if(Ec[a])throw Error("E_INVALID_CALL");Ec[a]=this}v(Pc,Kc);Pc.prototype.Aa=function(a){return new Ib(a,this.name)};Pc.prototype.$a=function(a,b){b?a.append(Ta(this.name)):a.append(this.name)};Pc.prototype.fa=function(a){return a.rc(this)};Pc.prototype.Vf=function(){return!0};
function E(a){var b=Ec[a];b||(b=new Pc(a));return b}function F(a,b){this.L=a;this.ka=b.toLowerCase()}v(F,Kc);F.prototype.Aa=function(a,b){return this.L?b&&"%"==this.ka?100==this.L?b:new rc(a,b,new Ib(a,this.L/100)):new uc(a,this.L,this.ka):a.b};F.prototype.$a=function(a){a.append(this.L.toString());a.append(this.ka)};F.prototype.fa=function(a){return a.ad(this)};F.prototype.Ac=function(){return!0};function Qc(a){this.L=a}v(Qc,Kc);
Qc.prototype.Aa=function(a){return this.L?1==this.L?a.f:new Ib(a,this.L):a.b};Qc.prototype.$a=function(a){a.append(this.L.toString())};Qc.prototype.fa=function(a){return a.$c(this)};Qc.prototype.hf=function(){return!0};function Rc(a){this.L=a}v(Rc,Qc);Rc.prototype.fa=function(a){return a.Zc(this)};function Sc(a){this.b=a}v(Sc,Kc);Sc.prototype.$a=function(a){a.append("#");var b=this.b.toString(16);a.append("000000".substr(b.length));a.append(b)};Sc.prototype.fa=function(a){return a.he(this)};
function Tc(a){this.url=a}v(Tc,Kc);Tc.prototype.$a=function(a){a.append('url("');a.append(Ua(this.url));a.append('")')};Tc.prototype.fa=function(a){return a.bd(this)};function Uc(a,b,c,d){var e=b.length;b[0].$a(a,d);for(var f=1;f<e;f++)a.append(c),b[f].$a(a,d)}function Hc(a){this.values=a}v(Hc,Kc);Hc.prototype.$a=function(a,b){Uc(a,this.values," ",b)};Hc.prototype.fa=function(a){return a.Ub(this)};Hc.prototype.Ud=function(){return!0};function Ic(a){this.values=a}v(Ic,Kc);
Ic.prototype.$a=function(a,b){Uc(a,this.values,",",b)};Ic.prototype.fa=function(a){return a.qc(this)};function Jc(a,b){this.name=a;this.values=b}v(Jc,Kc);Jc.prototype.$a=function(a,b){a.append(Ta(this.name));a.append("(");Uc(a,this.values,",",b);a.append(")")};Jc.prototype.fa=function(a){return a.Xb(this)};function G(a){this.Mc=a}v(G,Kc);G.prototype.Aa=function(){return this.Mc};G.prototype.$a=function(a){a.append("-epubx-expr(");this.Mc.Ha(a,0);a.append(")")};G.prototype.fa=function(a){return a.Yc(this)};
G.prototype.ef=function(){return!0};function Vc(a,b){if(a){if(a.Ac())return Sb(b,a.ka,!1)*a.L;if(a.hf())return a.L}return 0}var Wc=E("absolute"),Xc=E("all"),Yc=E("always"),Zc=E("auto");E("avoid");var $c=E("balance"),ad=E("balance-all"),bd=E("block"),cd=E("block-end"),dd=E("block-start"),ed=E("both"),fd=E("bottom"),gd=E("border-box"),hd=E("break-all"),id=E("break-word"),jd=E("crop"),kd=E("cross");E("column");
var ld=E("exclusive"),md=E("false"),nd=E("fixed"),od=E("flex"),pd=E("footnote"),qd=E("footer"),rd=E("header");E("hidden");var sd=E("horizontal-tb"),td=E("inherit"),ud=E("inline"),vd=E("inline-block"),wd=E("inline-end"),xd=E("inline-start"),yd=E("landscape"),zd=E("left"),Ad=E("line"),Bd=E("list-item"),Cd=E("ltr");E("manual");var J=E("none"),Dd=E("normal"),Ed=E("oeb-page-foot"),Fd=E("oeb-page-head"),Gd=E("page"),Hd=E("relative"),Id=E("right"),Jd=E("same"),Kd=E("scale"),Ld=E("snap-block");E("spread");
var Md=E("static"),Nd=E("rtl"),Od=E("table"),Pd=E("table-caption"),Qd=E("table-cell"),Rd=E("table-footer-group"),Sd=E("table-header-group");E("table-row");var Td=E("top"),Ud=E("transparent"),Vd=E("vertical-lr"),Wd=E("vertical-rl"),Xd=E("visible"),Yd=E("true"),Zd=new F(100,"%"),$d=new F(100,"pvw"),ae=new F(100,"pvh"),be=new F(0,"px"),ce={"font-size":1,color:2};function de(a,b){return(ce[a]||Number.MAX_VALUE)-(ce[b]||Number.MAX_VALUE)};var ee={SIMPLE_PROPERTY:"SIMPLE_PROPERTY",PREPROCESS_SINGLE_DOCUMENT:"PREPROCESS_SINGLE_DOCUMENT",PREPROCESS_TEXT_CONTENT:"PREPROCESS_TEXT_CONTENT",PREPROCESS_ELEMENT_STYLE:"PREPROCESS_ELEMENT_STYLE",POLYFILLED_INHERITED_PROPS:"POLYFILLED_INHERITED_PROPS",CONFIGURATION:"CONFIGURATION",RESOLVE_TEXT_NODE_BREAKER:"RESOLVE_TEXT_NODE_BREAKER",RESOLVE_FORMATTING_CONTEXT:"RESOLVE_FORMATTING_CONTEXT",RESOLVE_LAYOUT_PROCESSOR:"RESOLVE_LAYOUT_PROCESSOR",POST_LAYOUT_BLOCK:"POST_LAYOUT_BLOCK"},fe={};
function ge(a,b){if(ee[a]){var c=fe[a];c||(c=fe[a]=[]);c.push(b)}else w.b(Error("Skipping unknown plugin hook '"+a+"'."))}function he(a){return fe[a]||[]}oa("vivliostyle.plugin.registerHook",ge);oa("vivliostyle.plugin.removeHook",function(a,b){if(ee[a]){var c=fe[a];if(c){var d=c.indexOf(b);0<=d&&c.splice(d,1)}}else w.b(Error("Ignoring unknown plugin hook '"+a+"'."))});var ie=null,je=null;function L(a){if(!ie)throw Error("E_TASK_NO_CONTEXT");ie.name||(ie.name=a);var b=ie;a=new ke(b,b.top,a);b.top=a;a.b=le;return a}function M(a){return new me(a)}function ne(a,b,c){a=L(a);a.j=c;try{b(a)}catch(d){oe(a.f,d,a)}return a.result()}function pe(a){var b=qe,c;ie?c=ie.f:(c=je)||(c=new re(new se));b(c,a,void 0)}var le=1;function se(){}se.prototype.currentTime=function(){return(new Date).valueOf()};function te(a,b){return setTimeout(a,b)}
function re(a){this.g=a;this.h=1;this.slice=25;this.l=0;this.f=new Ja;this.b=this.u=null;this.j=!1;this.order=0;je||(je=this)}
function ue(a){if(!a.j){var b=a.f.b[1].b,c=a.g.currentTime();if(null!=a.b){if(c+a.h>a.u)return;clearTimeout(a.b)}b-=c;b<=a.h&&(b=a.h);a.u=c+b;a.b=te(function(){a.b=null;null!=a.b&&(clearTimeout(a.b),a.b=null);a.j=!0;try{var b=a.g.currentTime();for(a.l=b+a.slice;a.f.length();){var c=a.f.b[1];if(c.b>b)break;var f=a.f,g=f.b.pop(),h=f.b.length;if(1<h){for(var l=1;;){var k=2*l;if(k>=h)break;if(0<ve(f.b[k],g))k+1<h&&0<ve(f.b[k+1],f.b[k])&&k++;else if(k+1<h&&0<ve(f.b[k+1],g))k++;else break;f.b[l]=f.b[k];
l=k}f.b[l]=g}if(!c.g){var m=c.f;c.f=null;m&&m.b==c&&(m.b=null,l=ie,ie=m,O(m.top,c.result),ie=l)}b=a.g.currentTime();if(b>=a.l)break}}catch(p){w.error(p)}a.j=!1;a.f.length()&&ue(a)},b)}}re.prototype.tb=function(a,b){var c=this.g.currentTime();a.order=this.order++;a.b=c+(b||0);a:{for(var c=this.f,d=c.b.length;1<d;){var e=Math.floor(d/2),f=c.b[e];if(0<ve(f,a)){c.b[d]=a;break a}c.b[d]=f;d=e}c.b[1]=a}ue(this)};
function qe(a,b,c){var d=new we(a,c||"");d.top=new ke(d,null,"bootstrap");d.top.b=le;d.top.then(function(){function a(){d.j=!1;for(var a=t(d.h),b=a.next();!b.done;b=a.next()){b=b.value;try{b()}catch(h){w.error(h)}}}try{b().then(function(b){d.result=b;a()})}catch(f){oe(d,f),a()}});c=ie;ie=d;a.tb(xe(d.top,"bootstrap"));ie=c;return d}function ye(a){this.f=a;this.order=this.b=0;this.result=null;this.g=!1}function ve(a,b){return b.b-a.b||b.order-a.order}
ye.prototype.tb=function(a,b){this.result=a;this.f.f.tb(this,b)};function we(a,b){this.f=a;this.name=b;this.h=[];this.g=null;this.j=!0;this.b=this.top=this.l=this.result=null}function ze(a,b){a.h.push(b)}we.prototype.join=function(){var a=L("Task.join");if(this.j){var b=xe(a,this),c=this;ze(this,function(){b.tb(c.result)})}else O(a,this.result);return a.result()};
function oe(a,b,c){var d=b.frameTrace;if(!d){for(var d=b.stack?b.stack+"\n\t---- async ---\n":"",e=a.top;e;e=e.parent)d+="\t",d+=e.name,d+="\n";b.frameTrace=d}if(c){for(d=a.top;d&&d!=c;)d=d.parent;d==c&&(a.top=d)}for(a.g=b;a.top&&!a.top.j;)a.top=a.top.parent;a.top?(b=a.g,a.g=null,a.top.j(a.top,b)):a.g&&w.error(a.g,"Unhandled exception in task",a.name)}function me(a){this.value=a}n=me.prototype;n.then=function(a){a(this.value)};n.ea=function(a){return a(this.value)};n.Hc=function(a){return new me(a)};
n.Ea=function(a){O(a,this.value)};n.Xa=function(){return!1};n.get=function(){return this.value};function Ae(a){this.b=a}n=Ae.prototype;n.then=function(a){this.b.then(a)};n.ea=function(a){if(this.Xa()){var b=new ke(this.b.f,this.b.parent,"AsyncResult.thenAsync");b.b=le;this.b.parent=b;this.b.then(function(c){a(c).then(function(a){O(b,a)})});return b.result()}return a(this.b.g)};n.Hc=function(a){return this.Xa()?this.ea(function(){return new me(a)}):new me(a)};
n.Ea=function(a){this.Xa()?this.then(function(b){O(a,b)}):O(a,this.b.g)};n.Xa=function(){return this.b.b==le};n.get=function(){if(this.Xa())throw Error("Result is pending");return this.b.g};function ke(a,b,c){this.f=a;this.parent=b;this.name=c;this.g=null;this.b=0;this.j=this.h=null}function Be(a){if(!ie)throw Error("F_TASK_NO_CONTEXT");if(a!==ie.top)throw Error("F_TASK_NOT_TOP_FRAME");}ke.prototype.result=function(){return new Ae(this)};
function O(a,b){Be(a);ie.g||(a.g=b);a.b=2;var c=a.parent;ie.top=c;if(a.h){try{a.h(b)}catch(d){oe(a.f,d,c)}a.b=3}}ke.prototype.then=function(a){switch(this.b){case le:if(this.h)throw Error("F_TASK_FRAME_ALREADY_HAS_CALLBACK");this.h=a;break;case 2:var b=this.f,c=this.parent;try{a(this.g),this.b=3}catch(d){this.b=3,oe(b,d,c)}break;case 3:throw Error("F_TASK_DEAD_FRAME");default:throw Error("F_TASK_UNEXPECTED_FRAME_STATE "+this.b);}};
function Ce(){var a=L("Frame.timeSlice"),b=a.f.f;b.g.currentTime()>=b.l?(w.debug("-- time slice --"),xe(a).tb(!0)):O(a,!0);return a.result()}function De(a){var b=L("Frame.sleep");xe(b).tb(!0,a);return b.result()}function Ee(a){function b(d){try{for(;d;){var e=a();if(e.Xa()){e.then(b);return}e.then(function(a){d=a})}O(c,!0)}catch(f){oe(c.f,f,c)}}var c=L("Frame.loop");b(!0);return c.result()}
function Fe(a){var b=ie;if(!b)throw Error("E_TASK_NO_CONTEXT");return Ee(function(){var c;do c=new Ge(b,b.top),b.top=c,c.b=le,a(c),c=c.result();while(!c.Xa()&&c.get());return c})}function xe(a,b){Be(a);if(a.f.b)throw Error("E_TASK_ALREADY_SUSPENDED");var c=new ye(a.f);a.f.b=c;ie=null;a.f.l=b||null;return c}function Ge(a,b){ke.call(this,a,b,"loop")}v(Ge,ke);function P(a){O(a,!0)}function Q(a){O(a,!1)};function He(a,b){this.fetch=a;this.name=b;this.f=!1;this.b=this.h=null;this.g=[]}He.prototype.start=function(){if(!this.b){var a=this;this.b=qe(ie.f,function(){var b=L("Fetcher.run");a.fetch().then(function(c){var d=a.g;a.f=!0;a.h=c;a.b=null;a.g=[];if(d)for(var e=0;e<d.length;e++)try{d[e](c)}catch(f){w.error(f,"Error:")}O(b,c)});return b.result()},this.name)}};function Ie(a,b){a.f?b(a.h):a.g.push(b)}He.prototype.get=function(){if(this.f)return M(this.h);this.start();return this.b.join()};
function Je(a){if(!a.length)return M(!0);if(1==a.length)return a[0].get().Hc(!0);var b=L("waitForFetches"),c=0;Ee(function(){for(;c<a.length;){var b=a[c++];if(!b.f)return b.get().Hc(!0)}return M(!1)}).then(function(){O(b,!0)});return b.result()}
function Ke(a,b){var c=null,d=null;"img"==a.localName&&(c=a.getAttribute("width"),d=a.getAttribute("height"));var e=new He(function(){function e(b){l||(l=!0,"img"==a.localName&&(c||a.removeAttribute("width"),d||a.removeAttribute("height")),h.tb(b?b.type:"timeout"))}var g=L("loadImage"),h=xe(g,a),l=!1;a.addEventListener("load",e,!1);a.addEventListener("error",e,!1);a.addEventListener("abort",e,!1);"http://www.w3.org/2000/svg"==a.namespaceURI?(a.setAttributeNS("http://www.w3.org/1999/xlink","xlink:href",
b),setTimeout(e,300)):a.src=b;return g.result()},"loadElement "+b);e.start();return e};function Le(a){a=a.substr(1);if(a.match(/^[^0-9a-fA-F\n\r]$/))return a;a=parseInt(a,16);return isNaN(a)?"":65535>=a?String.fromCharCode(a):1114111>=a?String.fromCharCode(55296|a>>10&1023,56320|a&1023):"\ufffd"}function Me(a){return a.replace(/\\([0-9a-fA-F]{0,6}(\r\n|[ \n\r\t\f])?|[^0-9a-fA-F\n\r])/g,Le)}function Ne(){this.type=0;this.b=!1;this.L=0;this.text="";this.position=0}
function Oe(a,b){var c=Array(128),d;for(d=0;128>d;d++)c[d]=a;c[NaN]=35==a?35:72;for(d=0;d<b.length;d+=2)c[b[d]]=b[d+1];return c}var Pe=[72,72,72,72,72,72,72,72,72,1,1,72,1,1,72,72,72,72,72,72,72,72,72,72,72,72,72,72,72,72,72,72,1,4,34,6,7,8,9,33,10,11,12,13,14,15,16,17,2,2,2,2,2,2,2,2,2,2,18,19,20,21,22,23,24,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,25,29,26,30,3,72,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,27,31,28,32,72];Pe[NaN]=80;
var Qe=[43,43,43,43,43,43,43,43,43,43,43,43,43,43,43,43,43,43,43,43,43,43,43,43,43,43,43,43,43,43,43,43,43,43,43,43,43,43,43,43,52,43,43,43,43,39,43,43,39,39,39,39,39,39,39,39,39,39,43,43,43,43,43,43,43,39,39,39,39,39,39,39,39,39,39,39,39,39,39,39,39,39,39,39,39,39,39,39,39,39,39,43,44,43,43,39,43,39,39,39,39,39,39,39,39,39,39,39,39,39,39,39,39,39,39,39,39,39,39,39,39,39,39,43,43,43,43,43];Qe[NaN]=43;
var Re=[72,72,72,72,72,72,72,72,72,72,72,72,72,72,72,72,72,72,72,72,72,72,72,72,72,72,72,72,72,72,72,72,72,72,72,72,72,72,72,72,72,72,72,72,72,78,59,72,59,59,59,59,59,59,59,59,59,59,72,72,72,72,72,72,72,78,78,78,78,78,78,78,78,78,78,78,78,78,78,78,78,78,78,78,78,78,78,78,78,78,78,72,61,72,72,78,72,78,78,78,78,78,78,78,78,78,78,78,78,78,78,78,78,78,78,78,78,78,78,78,78,78,78,72,72,72,72,72];Qe[NaN]=43;
var Se=[35,35,35,35,35,35,35,35,35,35,35,35,35,35,35,35,35,35,35,35,35,35,35,35,35,35,35,35,35,35,35,35,35,35,35,35,35,35,35,35,35,35,35,35,35,57,59,35,58,58,58,58,58,58,58,58,58,58,35,35,35,35,35,35,35,60,60,60,60,60,60,60,60,60,60,60,60,60,60,60,60,60,60,60,60,60,60,60,60,60,60,35,61,35,35,60,35,60,60,60,60,60,60,60,60,60,60,60,60,60,60,60,60,60,60,60,60,60,60,60,60,60,60,35,35,35,35,35];Se[NaN]=35;
var Te=[45,45,45,45,45,45,45,45,45,73,45,45,45,45,45,45,45,45,45,45,45,45,45,45,45,45,45,45,45,45,45,45,73,45,45,45,45,45,45,45,53,45,45,45,45,45,45,45,39,39,39,39,39,39,39,39,39,39,45,45,45,45,45,45,45,39,39,39,39,39,39,39,39,39,39,39,39,39,39,39,39,39,39,39,39,39,39,39,39,39,39,45,44,45,45,39,45,39,39,39,39,39,39,39,39,39,39,39,39,39,39,39,39,39,39,39,39,39,39,39,39,39,39,45,45,45,45,45];Te[NaN]=45;
var Ue=[37,37,37,37,37,37,37,37,37,37,37,37,37,37,37,37,37,37,37,37,37,37,37,37,37,37,37,37,37,37,37,37,37,37,37,37,37,41,37,37,37,37,37,37,37,37,42,37,39,39,39,39,39,39,39,39,39,39,37,37,37,37,37,37,37,40,40,40,40,40,40,40,40,40,40,40,40,40,40,40,40,40,40,40,40,40,40,40,40,40,40,37,37,37,37,40,37,40,40,40,40,40,40,40,40,40,40,40,40,40,40,40,40,40,40,40,40,40,40,40,40,40,40,37,37,37,37,37];Ue[NaN]=37;
var Ve=[38,38,38,38,38,38,38,38,38,38,38,38,38,38,38,38,38,38,38,38,38,38,38,38,38,38,38,38,38,38,38,38,38,38,38,38,38,41,38,38,38,38,38,38,38,38,38,38,39,39,39,39,39,39,39,39,39,39,38,38,38,38,38,38,38,40,40,40,40,40,40,40,40,40,40,40,40,40,40,40,40,40,40,40,40,40,40,40,40,40,40,38,38,38,38,40,38,40,40,40,40,40,40,40,40,40,40,40,40,40,40,40,40,40,40,40,40,40,40,40,40,40,40,38,38,38,38,38];Ve[NaN]=38;
var We=Oe(35,[61,36]),Xe=Oe(35,[58,77]),Ye=Oe(35,[61,36,124,50]),Ze=Oe(35,[38,51]),$e=Oe(35,[42,54]),af=Oe(39,[42,55]),bf=Oe(54,[42,55,47,56]),cf=Oe(62,[62,56]),df=Oe(35,[61,36,33,70]),ef=Oe(62,[45,71]),ff=Oe(63,[45,56]),gf=Oe(76,[9,72,10,72,13,72,32,72]),hf=Oe(39,[39,46,10,72,13,72,92,48]),jf=Oe(39,[34,46,10,72,13,72,92,49]),kf=Oe(39,[39,47,10,74,13,74,92,48]),lf=Oe(39,[34,47,10,74,13,74,92,49]),mf=Oe(64,[9,39,32,39,34,66,39,65,41,72,10,39,13,39]),nf=Oe(39,[41,67,9,79,10,79,13,79,32,79,92,75,40,
72,91,72,93,72,123,72,125,72,NaN,67]),of=Oe(39,[39,68,10,74,13,74,92,75,NaN,67]),pf=Oe(39,[34,68,10,74,13,74,92,75,NaN,67]),qf=Oe(72,[9,39,10,39,13,39,32,39,41,69]);function rf(a,b){this.l=b;this.g=15;this.u=a;this.j=Array(this.g+1);this.b=-1;for(var c=this.position=this.f=this.h=0;c<=this.g;c++)this.j[c]=new Ne}function R(a){a.h==a.f&&sf(a);return a.j[a.f]}function tf(a,b){(a.h-a.f&a.g)<=b&&sf(a);return a.j[a.f+b&a.g]}function S(a){a.f=a.f+1&a.g}
function uf(a){if(0>a.b)throw Error("F_CSSTOK_BAD_CALL reset");a.f=a.b;a.b=-1}rf.prototype.error=function(a,b,c){this.l&&this.l.error(c,b)};
function sf(a){var b=a.h,c=0<=a.b?a.b:a.f,d=a.g;b>=c?c+=d:c--;if(c==b){if(0>a.b)throw Error("F_CSSTOK_INTERNAL");for(var b=2*(a.g+1)-1,c=Array(b+1),d=a.b,e=0;d!=a.h;)c[e]=a.j[d],d==a.f&&(a.f=e),d=d+1&a.g,e++;a.b=0;a.h=e;a.g=b;for(a.j=c;e<=b;)c[e++]=new Ne;b=a.h;c=d=a.g}for(var e=Pe,f=a.u,g=a.position,h=a.j,l=0,k=0,m="",p=0,q=!1,r=h[b],z=-9;;){var u=f.charCodeAt(g);switch(e[u]||e[65]){case 72:l=51;m=isNaN(u)?"E_CSS_UNEXPECTED_EOF":"E_CSS_UNEXPECTED_CHAR";g++;break;case 1:g++;q=!0;continue;case 2:k=
g++;e=Ue;continue;case 3:l=1;k=g++;e=Qe;continue;case 4:k=g++;l=31;e=We;continue;case 33:l=2;k=++g;e=hf;continue;case 34:l=2;k=++g;e=jf;continue;case 6:k=++g;l=7;e=Qe;continue;case 7:k=g++;l=32;e=We;continue;case 8:k=g++;l=21;break;case 9:k=g++;l=32;e=Ze;continue;case 10:k=g++;l=10;break;case 11:k=g++;l=11;break;case 12:k=g++;l=36;e=We;continue;case 13:k=g++;l=23;break;case 14:k=g++;l=16;break;case 15:l=24;k=g++;e=Se;continue;case 16:k=g++;e=Re;continue;case 78:k=g++;l=9;e=Qe;continue;case 17:k=g++;
l=19;e=$e;continue;case 18:k=g++;l=18;e=Xe;continue;case 77:g++;l=50;break;case 19:k=g++;l=17;break;case 20:k=g++;l=38;e=df;continue;case 21:k=g++;l=39;e=We;continue;case 22:k=g++;l=37;e=We;continue;case 23:k=g++;l=22;break;case 24:k=++g;l=20;e=Qe;continue;case 25:k=g++;l=14;break;case 26:k=g++;l=15;break;case 27:k=g++;l=12;break;case 28:k=g++;l=13;break;case 29:z=k=g++;l=1;e=gf;continue;case 30:k=g++;l=33;e=We;continue;case 31:k=g++;l=34;e=Ye;continue;case 32:k=g++;l=35;e=We;continue;case 35:break;
case 36:g++;l=l+41-31;break;case 37:l=5;p=parseInt(f.substring(k,g),10);break;case 38:l=4;p=parseFloat(f.substring(k,g));break;case 39:g++;continue;case 40:l=3;p=parseFloat(f.substring(k,g));k=g++;e=Qe;continue;case 41:l=3;p=parseFloat(f.substring(k,g));m="%";k=g++;break;case 42:g++;e=Ve;continue;case 43:m=f.substring(k,g);break;case 44:z=g++;e=gf;continue;case 45:m=Me(f.substring(k,g));break;case 46:m=f.substring(k,g);g++;break;case 47:m=Me(f.substring(k,g));g++;break;case 48:z=g;g+=2;e=kf;continue;
case 49:z=g;g+=2;e=lf;continue;case 50:g++;l=25;break;case 51:g++;l=26;break;case 52:m=f.substring(k,g);if(1==l){g++;if("url"==m.toLowerCase()){e=mf;continue}l=6}break;case 53:m=Me(f.substring(k,g));if(1==l){g++;if("url"==m.toLowerCase()){e=mf;continue}l=6}break;case 54:e=af;g++;continue;case 55:e=bf;g++;continue;case 56:e=Pe;g++;continue;case 57:e=cf;g++;continue;case 58:l=5;e=Ue;g++;continue;case 59:l=4;e=Ve;g++;continue;case 60:l=1;e=Qe;g++;continue;case 61:l=1;e=gf;z=g++;continue;case 62:g--;
break;case 63:g-=2;break;case 64:k=g++;e=nf;continue;case 65:k=++g;e=of;continue;case 66:k=++g;e=pf;continue;case 67:l=8;m=Me(f.substring(k,g));g++;break;case 69:g++;break;case 70:e=ef;g++;continue;case 71:e=ff;g++;continue;case 79:if(8>g-z&&f.substring(z+1,g+1).match(/^[0-9a-fA-F]{0,6}(\r\n|[\n\r])|[ \t]$/)){g++;continue}case 68:l=8;m=Me(f.substring(k,g));g++;e=qf;continue;case 74:g++;if(9>g-z&&f.substring(z+1,g).match(/^[0-9a-fA-F]{0,6}(\r\n|[\n\r])$/))continue;l=51;m="E_CSS_UNEXPECTED_NEWLINE";
break;case 73:if(9>g-z&&f.substring(z+1,g+1).match(/^[0-9a-fA-F]{0,6}[ \t]$/)){g++;continue}m=Me(f.substring(k,g));break;case 75:z=g++;continue;case 76:g++;e=Te;continue;default:e!==Pe?(l=51,m="E_CSS_UNEXPECTED_STATE"):(k=g,l=0)}r.type=l;r.b=q;r.L=p;r.text=m;r.position=k;b++;if(b>=c)break;e=Pe;q=!1;r=h[b&d]}a.position=g;a.h=b&d};function vf(a,b,c,d,e){var f=L("ajax"),g=new XMLHttpRequest,h=xe(f,g),l={status:0,statusText:"",url:a,contentType:null,responseText:null,responseXML:null,vd:null};g.open(c||"GET",a,!0);b&&(g.responseType=b);g.onreadystatechange=function(){if(4===g.readyState){l.status=g.status;l.statusText=g.statusText||404==g.status&&"Not Found"||"";if(200==l.status||!l.status)if(b&&"document"!==b||!g.responseXML||"parsererror"==g.responseXML.documentElement.localName)if((!b||"document"===b)&&g.response instanceof
HTMLDocument)l.responseXML=g.response,l.contentType=g.response.contentType;else{var c=g.response;b&&"text"!==b||"string"!=typeof c?c?"string"==typeof c?l.vd=wf([c]):l.vd=c:w.b("Unexpected empty success response for",a):l.responseText=c;if(c=g.getResponseHeader("Content-Type"))l.contentType=c.replace(/(.*);.*$/,"$1")}else l.responseXML=g.responseXML,l.contentType=g.responseXML.contentType;h.tb(l)}};try{d?(g.setRequestHeader("Content-Type",e||"text/plain; charset=UTF-8"),g.send(d)):(/^file:|^https?:\/\/[^/]+\.githubusercontent\.com/.test(a)?
/\/aozorabunko\/[^/]+\/cards\/[^/]+\/files\/[^/.]+\.html$/.test(a)?g.overrideMimeType("text/html; charset=Shift_JIS"):/\.(html|htm)$/.test(a)?g.overrideMimeType("text/html; charset=UTF-8"):/\.(xhtml|xht|xml|opf)$/.test(a)?g.overrideMimeType("application/xml; charset=UTF-8"):/\.(txt|css)$/.test(a)?g.overrideMimeType("text/plain; charset=UTF-8"):g.overrideMimeType("text/html; charset=UTF-8"):/^data:,(<|%3C|%3c)/.test(a)&&g.overrideMimeType("text/html; charset=UTF-8"),g.send(null))}catch(k){w.b(k,"Error fetching "+
a),h.tb(l)}return f.result()}function wf(a){var b=window.WebKitBlobBuilder||window.MSBlobBuilder;if(b){for(var b=new b,c=0;c<a.length;c++)b.append(a[c]);return b.getBlob("application/octet-stream")}return new Blob(a,{type:"application/octet-stream"})}function xf(a){var b=L("readBlob"),c=new FileReader,d=xe(b,c);c.addEventListener("load",function(){d.tb(c.result)},!1);c.readAsArrayBuffer(a);return b.result()}function yf(a,b){this.ca=a;this.type=b;this.g={};this.h={}}
yf.prototype.load=function(a,b,c){a=ya(a);var d=this.g[a];return"undefined"!=typeof d?M(d):this.fetch(a,b,c).get()};function zf(a,b,c,d){var e=L("fetch");vf(b,a.type).then(function(f){if(400<=f.status&&c)throw Error((d||"Failed to fetch required resource: "+b)+(" ("+f.status+(f.statusText?" "+f.statusText:"")+")"));a.ca(f,a).then(function(c){delete a.h[b];a.g[b]=c;O(e,c)})});return e.result()}
yf.prototype.fetch=function(a,b,c){a=ya(a);if(this.g[a])return null;var d=this.h[a];if(!d){var e=this,d=new He(function(){return zf(e,a,b,c)},"Fetch "+a);e.h[a]=d;d.start()}return d};yf.prototype.get=function(a){return this.g[ya(a)]};function Af(a){a=a.responseText;return M(a?JSON.parse(a):null)};function Bf(a){var b=parseInt(a,16);if(isNaN(b))throw Error("E_CSS_COLOR");if(6==a.length)return new Sc(b);if(3==a.length)return new Sc(b&15|(b&15)<<4|(b&240)<<4|(b&240)<<8|(b&3840)<<8|(b&3840)<<12);throw Error("E_CSS_COLOR");}function Cf(a){this.f=a;this.qb="Author"}n=Cf.prototype;n.jd=function(){return null};n.ma=function(){return this.f};n.error=function(){};n.Wc=function(a){this.qb=a};n.Wb=function(){};n.oe=function(){};n.qd=function(){};n.rd=function(){};n.ze=function(){};n.Hd=function(){};
n.cc=function(){};n.ne=function(){};n.me=function(){};n.te=function(){};n.Sc=function(){};n.Tb=function(){};n.ae=function(){};n.wd=function(){};n.ee=function(){};n.Zd=function(){};n.de=function(){};n.Vc=function(){};n.Qe=function(){};n.Fc=function(){};n.$d=function(){};n.ce=function(){};n.be=function(){};n.zd=function(){};n.yd=function(){};n.La=function(){};n.Qb=function(){};n.dc=function(){};n.xd=function(){};n.Nd=function(){};
function Df(a){switch(a.qb){case "UA":return 0;case "User":return 100663296;default:return 83886080}}function Ef(a){switch(a.qb){case "UA":return 0;case "User":return 16777216;default:return 33554432}}function Ff(){Cf.call(this,null);this.g=[];this.b=null}v(Ff,Cf);function Gf(a,b){a.g.push(a.b);a.b=b}n=Ff.prototype;n.jd=function(){return null};n.ma=function(){return this.b.ma()};n.error=function(a,b){this.b.error(a,b)};
n.Wc=function(a){Cf.prototype.Wc.call(this,a);0<this.g.length&&(this.b=this.g[0],this.g=[]);this.b.Wc(a)};n.Wb=function(a,b){this.b.Wb(a,b)};n.oe=function(a){this.b.oe(a)};n.qd=function(a,b){this.b.qd(a,b)};n.rd=function(a,b){this.b.rd(a,b)};n.ze=function(a){this.b.ze(a)};n.Hd=function(a,b,c,d){this.b.Hd(a,b,c,d)};n.cc=function(){this.b.cc()};n.ne=function(){this.b.ne()};n.me=function(){this.b.me()};n.te=function(){this.b.te()};n.Sc=function(){this.b.Sc()};n.Tb=function(){this.b.Tb()};n.ae=function(){this.b.ae()};
n.wd=function(a){this.b.wd(a)};n.ee=function(){this.b.ee()};n.Zd=function(){this.b.Zd()};n.de=function(){this.b.de()};n.Vc=function(){this.b.Vc()};n.Qe=function(a){this.b.Qe(a)};n.Fc=function(a){this.b.Fc(a)};n.$d=function(a){this.b.$d(a)};n.ce=function(){this.b.ce()};n.be=function(a,b,c){this.b.be(a,b,c)};n.zd=function(a,b,c){this.b.zd(a,b,c)};n.yd=function(a,b,c){this.b.yd(a,b,c)};n.La=function(){this.b.La()};n.Qb=function(a,b,c){this.b.Qb(a,b,c)};n.dc=function(){this.b.dc()};n.xd=function(a){this.b.xd(a)};
n.Nd=function(){this.b.Nd()};function Hf(a,b,c){Cf.call(this,a);this.N=c;this.J=0;if(this.oa=b)this.qb=b.qb}v(Hf,Cf);Hf.prototype.jd=function(){return this.oa.jd()};Hf.prototype.error=function(a){w.b(a)};Hf.prototype.La=function(){this.J++};Hf.prototype.dc=function(){if(!--this.J&&!this.N){var a=this.oa;a.b=a.g.pop()}};function If(a,b,c){Hf.call(this,a,b,c)}v(If,Hf);function Jf(a,b){a.error(b,a.jd())}function Kf(a,b){Jf(a,b);Gf(a.oa,new Hf(a.f,a.oa,!1))}n=If.prototype;n.Tb=function(){Kf(this,"E_CSS_UNEXPECTED_SELECTOR")};
n.ae=function(){Kf(this,"E_CSS_UNEXPECTED_FONT_FACE")};n.wd=function(){Kf(this,"E_CSS_UNEXPECTED_FOOTNOTE")};n.ee=function(){Kf(this,"E_CSS_UNEXPECTED_VIEWPORT")};n.Zd=function(){Kf(this,"E_CSS_UNEXPECTED_DEFINE")};n.de=function(){Kf(this,"E_CSS_UNEXPECTED_REGION")};n.Vc=function(){Kf(this,"E_CSS_UNEXPECTED_PAGE")};n.Fc=function(){Kf(this,"E_CSS_UNEXPECTED_WHEN")};n.$d=function(){Kf(this,"E_CSS_UNEXPECTED_FLOW")};n.ce=function(){Kf(this,"E_CSS_UNEXPECTED_PAGE_TEMPLATE")};n.be=function(){Kf(this,"E_CSS_UNEXPECTED_PAGE_MASTER")};
n.zd=function(){Kf(this,"E_CSS_UNEXPECTED_PARTITION")};n.yd=function(){Kf(this,"E_CSS_UNEXPECTED_PARTITION_GROUP")};n.xd=function(){Kf(this,"E_CSS_UNEXPECTED_SELECTOR_FUNC")};n.Nd=function(){Kf(this,"E_CSS_UNEXPECTED_END_SELECTOR_FUNC")};n.Qb=function(){this.error("E_CSS_UNEXPECTED_PROPERTY",this.jd())};var Lf=[],Mf=[],T=[],Nf=[],Of=[],Pf=[],Qf=[],Rf=[],Sf=[],Tf=[],Uf=[],Vf=[],Wf=[];Lf[1]=28;Lf[36]=29;Lf[7]=29;Lf[9]=29;Lf[14]=29;Lf[18]=29;Lf[20]=30;Lf[13]=27;Lf[0]=200;Mf[1]=46;Mf[0]=200;Pf[1]=2;
Pf[36]=4;Pf[7]=6;Pf[9]=8;Pf[14]=10;Pf[18]=14;T[37]=11;T[23]=12;T[35]=56;T[1]=1;T[36]=3;T[7]=5;T[9]=7;T[14]=9;T[12]=13;T[18]=55;T[50]=42;T[16]=41;Nf[1]=1;Nf[36]=3;Nf[7]=5;Nf[9]=7;Nf[14]=9;Nf[11]=200;Nf[18]=55;Of[1]=2;Of[36]=4;Of[7]=6;Of[9]=8;Of[18]=14;Of[50]=42;Of[14]=10;Of[12]=13;Qf[1]=15;Qf[7]=16;Qf[4]=17;Qf[5]=18;Qf[3]=19;Qf[2]=20;Qf[8]=21;Qf[16]=22;Qf[19]=23;Qf[6]=24;Qf[11]=25;Qf[17]=26;Qf[13]=48;Qf[31]=47;Qf[23]=54;Qf[0]=44;Rf[1]=31;Rf[4]=32;Rf[5]=32;Rf[3]=33;Rf[2]=34;Rf[10]=40;Rf[6]=38;
Rf[31]=36;Rf[24]=36;Rf[32]=35;Sf[1]=45;Sf[16]=37;Sf[37]=37;Sf[38]=37;Sf[47]=37;Sf[48]=37;Sf[39]=37;Sf[49]=37;Sf[26]=37;Sf[25]=37;Sf[23]=37;Sf[24]=37;Sf[19]=37;Sf[21]=37;Sf[36]=37;Sf[18]=37;Sf[22]=37;Sf[11]=39;Sf[12]=43;Sf[17]=49;Tf[0]=200;Tf[12]=50;Tf[13]=51;Tf[14]=50;Tf[15]=51;Tf[10]=50;Tf[11]=51;Tf[17]=53;Uf[0]=200;Uf[12]=50;Uf[13]=52;Uf[14]=50;Uf[15]=51;Uf[10]=50;Uf[11]=51;Uf[17]=53;Vf[0]=200;Vf[12]=50;Vf[13]=51;Vf[14]=50;Vf[15]=51;Vf[10]=50;Vf[11]=51;Wf[11]=0;Wf[16]=0;Wf[22]=1;Wf[18]=1;
Wf[26]=2;Wf[25]=2;Wf[38]=3;Wf[37]=3;Wf[48]=3;Wf[47]=3;Wf[39]=3;Wf[49]=3;Wf[41]=3;Wf[23]=4;Wf[24]=4;Wf[36]=5;Wf[19]=5;Wf[21]=5;Wf[0]=6;Wf[52]=2;function Xf(a,b,c,d){this.b=a;this.f=b;this.u=c;this.Z=d;this.F=[];this.N={};this.g=this.H=null;this.D=!1;this.j=2;this.result=null;this.G=!1;this.A=this.J=null;this.l=[];this.h=[];this.S=this.Y=!1}function Yf(a,b){for(var c=[],d=a.F;;){c.push(d[b++]);if(b==d.length)break;if(","!=d[b++])throw Error("Unexpected state");}return c}
function Zf(a,b,c){var d=a.F,e=d.length,f;do f=d[--e];while("undefined"!=typeof f&&"string"!=typeof f);var g=d.length-(e+1);1<g&&d.splice(e+1,g,new Hc(d.slice(e+1,d.length)));if(","==b)return null;e++;do f=d[--e];while("undefined"!=typeof f&&("string"!=typeof f||","==f));g=d.length-(e+1);if("("==f){if(")"!=b)return a.u.error("E_CSS_MISMATCHED_C_PAR",c),a.b=Uf,null;a=new Jc(d[e-1],Yf(a,e+1));d.splice(e-1,g+2,a);return null}return";"!=b||0<=e?(a.u.error("E_CSS_UNEXPECTED_VAL_END",c),a.b=Uf,null):1<
g?new Ic(Yf(a,e+1)):d[0]}function $f(a,b,c){a.b=a.g?Uf:Tf;a.u.error(b,c)}
function ag(a,b,c){for(var d=a.F,e=a.u,f=d.pop(),g;;){var h=d.pop();if(11==b){for(g=[f];16==h;)g.unshift(d.pop()),h=d.pop();if("string"==typeof h){if("{"==h){for(;2<=g.length;)a=g.shift(),c=g.shift(),a=new ic(e.ma(),a,c),g.unshift(a);d.push(new G(g[0]));return!0}if("("==h){b=d.pop();f=d.pop();f=new xc(e.ma(),Fb(f,b),g);b=0;continue}}if(10==h){f.gf()&&(f=new zc(e.ma(),f,null));b=0;continue}}else if("string"==typeof h){d.push(h);break}if(0>h)if(-31==h)f=new dc(e.ma(),f);else if(-24==h)f=new ec(e.ma(),
f);else return $f(a,"F_UNEXPECTED_STATE",c),!1;else{if(Wf[b]>Wf[h]){d.push(h);break}g=d.pop();switch(h){case 26:f=new fc(e.ma(),g,f);break;case 52:f=new gc(e.ma(),g,f);break;case 25:f=new hc(e.ma(),g,f);break;case 38:f=new jc(e.ma(),g,f);break;case 37:f=new lc(e.ma(),g,f);break;case 48:f=new kc(e.ma(),g,f);break;case 47:f=new mc(e.ma(),g,f);break;case 39:case 49:f=new nc(e.ma(),g,f);break;case 41:f=new oc(e.ma(),g,f);break;case 23:f=new pc(e.ma(),g,f);break;case 24:f=new qc(e.ma(),g,f);break;case 36:f=
new rc(e.ma(),g,f);break;case 19:f=new sc(e.ma(),g,f);break;case 21:f=new tc(e.ma(),g,f);break;case 18:if(1<d.length)switch(d[d.length-1]){case 22:d.pop();f=new yc(e.ma(),d.pop(),g,f);break;case 10:if(g.gf())f=new zc(e.ma(),g,f);else return $f(a,"E_CSS_MEDIA_TEST",c),!1}else return $f(a,"E_CSS_EXPR_COND",c),!1;break;case 22:if(18!=b)return $f(a,"E_CSS_EXPR_COND",c),!1;case 10:return d.push(g),d.push(h),d.push(f),!1;default:return $f(a,"F_UNEXPECTED_STATE",c),!1}}}d.push(f);return!1}
function bg(a){for(var b=[];;){var c=R(a.f);switch(c.type){case 1:b.push(c.text);break;case 23:b.push("+");break;case 4:case 5:b.push(c.L);break;default:return b}S(a.f)}}
function cg(a){var b=!1,c=R(a.f);if(23===c.type)b=!0,S(a.f),c=R(a.f);else if(1===c.type&&("even"===c.text||"odd"===c.text))return S(a.f),[2,"odd"===c.text?1:0];switch(c.type){case 3:if(b&&0>c.L)break;case 1:if(b&&"-"===c.text.charAt(0))break;if("n"===c.text||"-n"===c.text){if(b&&c.b)break;b="-n"===c.text?-1:1;3===c.type&&(b=c.L);var d=0;S(a.f);var c=R(a.f),e=24===c.type,f=23===c.type||e;f&&(S(a.f),c=R(a.f));if(5===c.type){d=c.L;if(1/d===1/-0){if(d=0,f)break}else if(0>d){if(f)break}else if(0<=d&&!f)break;
S(a.f)}else if(f)break;return[b,e&&0<d?-d:d]}if("n-"===c.text||"-n-"===c.text){if(!b||!c.b)if(b="-n-"===c.text?-1:1,3===c.type&&(b=c.L),S(a.f),c=R(a.f),5===c.type&&!(0>c.L||1/c.L===1/-0))return S(a.f),[b,c.L]}else{if(d=c.text.match(/^n(-[0-9]+)$/)){if(b&&c.b)break;S(a.f);return[3===c.type?c.L:1,parseInt(d[1],10)]}if(d=c.text.match(/^-n(-[0-9]+)$/))return S(a.f),[-1,parseInt(d[1],10)]}break;case 5:if(!b||!(c.b||0>c.L))return S(a.f),[0,c.L]}return null}
function dg(a,b,c){a=a.u.ma();if(!a)return null;c=c||a.j;if(b){b=b.split(/\s+/);b=t(b);for(var d=b.next();!d.done;d=b.next())switch(d.value){case "vertical":c=Bc(a,c,new dc(a,new vc(a,"pref-horizontal")));break;case "horizontal":c=Bc(a,c,new vc(a,"pref-horizontal"));break;case "day":c=Bc(a,c,new dc(a,new vc(a,"pref-night-mode")));break;case "night":c=Bc(a,c,new vc(a,"pref-night-mode"));break;default:c=a.h}}return c===a.j?null:new G(c)}
function eg(a){switch(a.h[a.h.length-1]){case "[selector]":case "font-face":case "-epubx-flow":case "-epubx-viewport":case "-epubx-define":case "-adapt-footnote-area":return!0}return!1}
function fg(a,b,c,d,e,f){var g=a.u,h=a.f,l=a.F,k,m,p,q;e&&(a.j=2,a.F.push("{"));a:for(;0<b;--b)switch(k=R(h),a.b[k.type]){case 28:if(18!=tf(h,1).type){eg(a)?(g.error("E_CSS_COLON_EXPECTED",tf(h,1)),a.b=Uf):(a.b=Pf,g.Tb());continue}m=tf(h,2);if(!(m.b||1!=m.type&&6!=m.type)){if(0<=h.b)throw Error("F_CSSTOK_BAD_CALL mark");h.b=h.f}a.g=k.text;a.D=!1;S(h);S(h);a.b=Qf;l.splice(0,l.length);continue;case 46:if(18!=tf(h,1).type){a.b=Uf;g.error("E_CSS_COLON_EXPECTED",tf(h,1));continue}a.g=k.text;a.D=!1;S(h);
S(h);a.b=Qf;l.splice(0,l.length);continue;case 29:a.b=Pf;g.Tb();continue;case 1:if(!k.b){a.b=Vf;g.error("E_CSS_SPACE_EXPECTED",k);continue}g.cc();case 2:if(34==tf(h,1).type)if(S(h),S(h),p=a.N[k.text],null!=p)switch(k=R(h),k.type){case 1:g.Wb(p,k.text);a.b=f?Nf:T;S(h);break;case 36:g.Wb(p,null);a.b=f?Nf:T;S(h);break;default:a.b=Tf,g.error("E_CSS_NAMESPACE",k)}else a.b=Tf,g.error("E_CSS_UNDECLARED_PREFIX",k);else g.Wb(a.H,k.text),a.b=f?Nf:T,S(h);continue;case 3:if(!k.b){a.b=Vf;g.error("E_CSS_SPACE_EXPECTED",
k);continue}g.cc();case 4:if(34==tf(h,1).type)switch(S(h),S(h),k=R(h),k.type){case 1:g.Wb(null,k.text);a.b=f?Nf:T;S(h);break;case 36:g.Wb(null,null);a.b=f?Nf:T;S(h);break;default:a.b=Tf,g.error("E_CSS_NAMESPACE",k)}else g.Wb(a.H,null),a.b=f?Nf:T,S(h);continue;case 5:k.b&&g.cc();case 6:g.ze(k.text);a.b=f?Nf:T;S(h);continue;case 7:k.b&&g.cc();case 8:g.oe(k.text);a.b=f?Nf:T;S(h);continue;case 55:k.b&&g.cc();case 14:S(h);k=R(h);b:switch(k.type){case 1:g.qd(k.text,null);S(h);a.b=f?Nf:T;continue;case 6:m=
k.text;S(h);switch(m){case "not":a.b=Pf;g.xd("not");fg(a,Number.POSITIVE_INFINITY,!1,!1,!1,!0)?a.b=T:a.b=Vf;break a;case "lang":case "href-epub-type":if(k=R(h),1===k.type){p=[k.text];S(h);break}else break b;case "nth-child":case "nth-of-type":case "nth-last-child":case "nth-last-of-type":if(p=cg(a))break;else break b;default:p=bg(a)}k=R(h);if(11==k.type){g.qd(m,p);S(h);a.b=f?Nf:T;continue}}g.error("E_CSS_PSEUDOCLASS_SYNTAX",k);a.b=Tf;continue;case 42:S(h);k=R(h);switch(k.type){case 1:g.rd(k.text,
null);a.b=f?Nf:T;S(h);continue;case 6:m=k.text;S(h);if("nth-fragment"==m){if(p=cg(a),!p)break}else p=bg(a);k=R(h);if(11==k.type){g.rd(m,p);a.b=f?Nf:T;S(h);continue}}g.error("E_CSS_PSEUDOELEM_SYNTAX",k);a.b=Tf;continue;case 9:k.b&&g.cc();case 10:S(h);k=R(h);if(1==k.type)m=k.text,S(h);else if(36==k.type)m=null,S(h);else if(34==k.type)m="";else{a.b=Vf;g.error("E_CSS_ATTR",k);S(h);continue}k=R(h);if(34==k.type){p=m?a.N[m]:m;if(null==p){a.b=Vf;g.error("E_CSS_UNDECLARED_PREFIX",k);S(h);continue}S(h);k=
R(h);if(1!=k.type){a.b=Vf;g.error("E_CSS_ATTR_NAME_EXPECTED",k);continue}m=k.text;S(h);k=R(h)}else p="";switch(k.type){case 39:case 45:case 44:case 43:case 42:case 46:case 50:q=k.type;S(h);k=R(h);break;case 15:g.Hd(p,m,0,null);a.b=f?Nf:T;S(h);continue;default:a.b=Vf;g.error("E_CSS_ATTR_OP_EXPECTED",k);continue}switch(k.type){case 1:case 2:g.Hd(p,m,q,k.text);S(h);k=R(h);break;default:a.b=Vf;g.error("E_CSS_ATTR_VAL_EXPECTED",k);continue}if(15!=k.type){a.b=Vf;g.error("E_CSS_ATTR",k);continue}a.b=f?Nf:
T;S(h);continue;case 11:g.ne();a.b=Of;S(h);continue;case 12:g.me();a.b=Of;S(h);continue;case 56:g.te();a.b=Of;S(h);continue;case 13:a.Y?(a.h.push("-epubx-region"),a.Y=!1):a.S?(a.h.push("page"),a.S=!1):a.h.push("[selector]");g.La();a.b=Lf;S(h);continue;case 41:g.Sc();a.b=Pf;S(h);continue;case 15:l.push(E(k.text));S(h);continue;case 16:try{l.push(Bf(k.text))}catch(z){g.error("E_CSS_COLOR",k),a.b=Tf}S(h);continue;case 17:l.push(new Qc(k.L));S(h);continue;case 18:l.push(new Rc(k.L));S(h);continue;case 19:Nb(k.text)?
l.push(new G(new uc(g.ma(),k.L,k.text))):l.push(new F(k.L,k.text));S(h);continue;case 20:l.push(new Oc(k.text));S(h);continue;case 21:l.push(new Tc(Ba(k.text,a.Z)));S(h);continue;case 22:Zf(a,",",k);l.push(",");S(h);continue;case 23:l.push(Nc);S(h);continue;case 24:m=k.text.toLowerCase();"-epubx-expr"==m||"calc"==m||"env"==m?(a.b=Rf,a.j=0,l.push("{")):(l.push(m),l.push("("));S(h);continue;case 25:Zf(a,")",k);S(h);continue;case 47:S(h);k=R(h);m=tf(h,1);if(1==k.type&&"important"==k.text.toLowerCase()&&
(17==m.type||0==m.type||13==m.type)){S(h);a.D=!0;continue}$f(a,"E_CSS_SYNTAX",k);continue;case 54:m=tf(h,1);switch(m.type){case 4:case 3:case 5:if(!m.b){S(h);continue}}a.b===Qf&&0<=h.b?(uf(h),a.b=Pf,g.Tb()):$f(a,"E_CSS_UNEXPECTED_PLUS",k);continue;case 26:S(h);case 48:h.b=-1;(m=Zf(a,";",k))&&a.g&&g.Qb(a.g,m,a.D);a.b=d?Mf:Lf;continue;case 44:S(h);h.b=-1;m=Zf(a,";",k);if(c)return a.result=m,!0;a.g&&m&&g.Qb(a.g,m,a.D);if(d)return!0;$f(a,"E_CSS_SYNTAX",k);continue;case 31:m=tf(h,1);9==m.type?(10!=tf(h,
2).type||tf(h,2).b?(l.push(new vc(g.ma(),Fb(k.text,m.text))),a.b=Sf):(l.push(k.text,m.text,"("),S(h)),S(h)):(2==a.j||3==a.j?"not"==k.text.toLowerCase()?(S(h),l.push(new wc(g.ma(),!0,m.text))):("only"==k.text.toLowerCase()&&(S(h),k=m),l.push(new wc(g.ma(),!1,k.text))):l.push(new vc(g.ma(),k.text)),a.b=Sf);S(h);continue;case 38:l.push(null,k.text,"(");S(h);continue;case 32:l.push(new Ib(g.ma(),k.L));S(h);a.b=Sf;continue;case 33:m=k.text;"%"==m&&(m=a.g&&a.g.match(/height|^(top|bottom)$/)?"vh":"vw");
l.push(new uc(g.ma(),k.L,m));S(h);a.b=Sf;continue;case 34:l.push(new Ib(g.ma(),k.text));S(h);a.b=Sf;continue;case 35:S(h);k=R(h);5!=k.type||k.b?$f(a,"E_CSS_SYNTAX",k):(l.push(new Ac(g.ma(),k.L)),S(h),a.b=Sf);continue;case 36:l.push(-k.type);S(h);continue;case 37:a.b=Rf;ag(a,k.type,k);l.push(k.type);S(h);continue;case 45:"and"==k.text.toLowerCase()?(a.b=Rf,ag(a,52,k),l.push(52),S(h)):$f(a,"E_CSS_SYNTAX",k);continue;case 39:ag(a,k.type,k)&&(a.g?a.b=Qf:$f(a,"E_CSS_UNBALANCED_PAR",k));S(h);continue;case 43:ag(a,
11,k)&&(a.g||3==a.j?$f(a,"E_CSS_UNEXPECTED_BRC",k):(1==a.j?g.Fc(l.pop()):(k=l.pop(),g.Fc(k)),a.h.push("media"),g.La(),a.b=Lf));S(h);continue;case 49:if(ag(a,11,k))if(a.g||3!=a.j)$f(a,"E_CSS_UNEXPECTED_SEMICOL",k);else return a.A=l.pop(),a.G=!0,a.b=Lf,S(h),!1;S(h);continue;case 40:l.push(k.type);S(h);continue;case 27:a.b=Lf;S(h);g.dc();a.h.length&&a.h.pop();continue;case 30:m=k.text.toLowerCase();switch(m){case "import":S(h);k=R(h);if(2==k.type||8==k.type){a.J=k.text;S(h);k=R(h);if(17==k.type||0==
k.type)return a.G=!0,S(h),!1;a.g=null;a.j=3;a.b=Rf;l.push("{");continue}g.error("E_CSS_IMPORT_SYNTAX",k);a.b=Tf;continue;case "namespace":S(h);k=R(h);switch(k.type){case 1:m=k.text;S(h);k=R(h);if((2==k.type||8==k.type)&&17==tf(h,1).type){a.N[m]=k.text;S(h);S(h);continue}break;case 2:case 8:if(17==tf(h,1).type){a.H=k.text;S(h);S(h);continue}}g.error("E_CSS_NAMESPACE_SYNTAX",k);a.b=Tf;continue;case "charset":S(h);k=R(h);if(2==k.type&&17==tf(h,1).type){m=k.text.toLowerCase();"utf-8"!=m&&"utf-16"!=m&&
g.error("E_CSS_UNEXPECTED_CHARSET "+m,k);S(h);S(h);continue}g.error("E_CSS_CHARSET_SYNTAX",k);a.b=Tf;continue;case "font-face":case "-epubx-page-template":case "-epubx-define":case "-epubx-viewport":if(12==tf(h,1).type){S(h);S(h);switch(m){case "font-face":g.ae();break;case "-epubx-page-template":g.ce();break;case "-epubx-define":g.Zd();break;case "-epubx-viewport":g.ee()}a.h.push(m);g.La();continue}break;case "-adapt-footnote-area":S(h);k=R(h);switch(k.type){case 12:S(h);g.wd(null);a.h.push(m);g.La();
continue;case 50:if(S(h),k=R(h),1==k.type&&12==tf(h,1).type){m=k.text;S(h);S(h);g.wd(m);a.h.push("-adapt-footnote-area");g.La();continue}}break;case "-epubx-region":S(h);g.de();a.Y=!0;a.b=Pf;continue;case "page":S(h);g.Vc();a.S=!0;a.b=Of;continue;case "top-left-corner":case "top-left":case "top-center":case "top-right":case "top-right-corner":case "right-top":case "right-middle":case "right-bottom":case "bottom-right-corner":case "bottom-right":case "bottom-center":case "bottom-left":case "bottom-left-corner":case "left-bottom":case "left-middle":case "left-top":S(h);
k=R(h);if(12==k.type){S(h);g.Qe(m);a.h.push(m);g.La();continue}break;case "-epubx-when":S(h);a.g=null;a.j=1;a.b=Rf;l.push("{");continue;case "media":S(h);a.g=null;a.j=2;a.b=Rf;l.push("{");continue;case "-epubx-flow":if(1==tf(h,1).type&&12==tf(h,2).type){g.$d(tf(h,1).text);S(h);S(h);S(h);a.h.push(m);g.La();continue}break;case "-epubx-page-master":case "-epubx-partition":case "-epubx-partition-group":S(h);k=R(h);q=p=null;var r=[];1==k.type&&(p=k.text,S(h),k=R(h));18==k.type&&1==tf(h,1).type&&(q=tf(h,
1).text,S(h),S(h),k=R(h));for(;6==k.type&&"class"==k.text.toLowerCase()&&1==tf(h,1).type&&11==tf(h,2).type;)r.push(tf(h,1).text),S(h),S(h),S(h),k=R(h);if(12==k.type){S(h);switch(m){case "-epubx-page-master":g.be(p,q,r);break;case "-epubx-partition":g.zd(p,q,r);break;case "-epubx-partition-group":g.yd(p,q,r)}a.h.push(m);g.La();continue}break;case "":g.error("E_CSS_UNEXPECTED_AT"+m,k);a.b=Vf;continue;default:g.error("E_CSS_AT_UNKNOWN "+m,k);a.b=Tf;continue}g.error("E_CSS_AT_SYNTAX "+m,k);a.b=Tf;continue;
case 50:if(c||d)return!0;a.l.push(k.type+1);S(h);continue;case 52:if(c||d)return!0;if(!a.l.length){a.b=Lf;continue}case 51:0<a.l.length&&a.l[a.l.length-1]==k.type&&a.l.pop();a.l.length||13!=k.type||(a.b=Lf);S(h);continue;case 53:if(c||d)return!0;a.l.length||(a.b=Lf);S(h);continue;case 200:return f&&(S(h),g.Nd()),!0;default:if(c||d)return!0;if(e)return ag(a,11,k)?(a.result=l.pop(),!0):!1;if(f)return 51==k.type?g.error(k.text,k):g.error("E_CSS_SYNTAX",k),!1;a.b===Qf&&0<=h.b?(uf(h),a.b=Pf,g.Tb()):a.b!==
Tf&&a.b!==Vf&&a.b!==Uf?(51==k.type?g.error(k.text,k):g.error("E_CSS_SYNTAX",k),a.b=eg(a)?Uf:Vf):S(h)}return!1}function gg(a){Cf.call(this,null);this.f=a}v(gg,Cf);gg.prototype.error=function(a){throw Error(a);};gg.prototype.ma=function(){return this.f};
function hg(a,b,c,d,e){var f=L("parseStylesheet"),g=new Xf(Lf,a,b,c),h=null;e&&(h=ig(new rf(e,b),b,c));if(h=dg(g,d,h&&h.Aa()))b.Fc(h),b.La();Ee(function(){for(var a={};!fg(g,100,!1,!1,!1,!1);){if(g.G){var d=Ba(g.J,c);g.A&&(b.Fc(g.A),b.La());a.Ce=L("parseStylesheet.import");jg(d,b,null,null).then(function(a){return function(){g.A&&b.dc();g.G=!1;g.J=null;g.A=null;O(a.Ce,!0)}}(a));return a.Ce.result()}d=Ce();if(d.Xa)return d;a={Ce:a.Ce}}return M(!1)}).then(function(){h&&b.dc();O(f,!0)});return f.result()}
function kg(a,b,c,d,e){return ne("parseStylesheetFromText",function(f){var g=new rf(a,b);hg(g,b,c,d,e).Ea(f)},function(b,c){w.b(c,"Failed to parse stylesheet text: "+a);O(b,!1)})}function jg(a,b,c,d){return ne("parseStylesheetFromURL",function(e){vf(a).then(function(f){f.responseText?kg(f.responseText,b,a,c,d).then(function(b){b||w.b("Failed to parse stylesheet from "+a);O(e,!0)}):O(e,!0)})},function(b,c){w.b(c,"Exception while fetching and parsing:",a);O(b,!0)})}
function lg(a,b){var c=new Xf(Qf,b,new gg(a),"");fg(c,Number.POSITIVE_INFINITY,!0,!1,!1,!1);return c.result}function ig(a,b,c){a=new Xf(Rf,a,b,c);fg(a,Number.POSITIVE_INFINITY,!1,!1,!0,!1);return a.result}var mg={"z-index":!0,"column-count":!0,"flow-linger":!0,opacity:!0,page:!0,"flow-priority":!0,utilization:!0};
function ng(a,b,c){if(b.ef())a:{b=b.Mc;a=b.evaluate(a);switch(typeof a){case "number":c=mg[c]?a==Math.round(a)?new Rc(a):new Qc(a):new F(a,"px");break a;case "string":c=a?lg(b.b,new rf(a,null)):C;break a;case "boolean":c=a?Yd:md;break a;case "undefined":c=C;break a}throw Error("E_UNEXPECTED");}else c=b;return c};function og(a,b,c,d){this.V=a;this.T=b;this.U=c;this.R=d}function pg(a,b){this.f=a;this.b=b}function qg(){this.bottom=this.right=this.top=this.left=0}function rg(a,b,c,d){this.b=a;this.f=b;this.h=c;this.g=d}function sg(a,b,c,d){this.T=a;this.R=b;this.V=c;this.U=d;this.right=this.left=null}function tg(a,b){return a.b.b-b.b.b||a.b.f-b.b.f}function ug(a){this.b=a}function vg(a,b,c){a=a.b;for(var d=a.length,e=a[d-1],f=0;f<d;f++){var g=a[f];b.push(e.b<g.b?new rg(e,g,1,c):new rg(g,e,-1,c));e=g}}
function wg(a,b,c,d){for(var e=[],f=0;20>f;f++){var g=2*f*Math.PI/20;e.push(new pg(a+c*Math.sin(g),b+d*Math.cos(g)))}return new ug(e)}function xg(a,b,c,d){return new ug([new pg(a,b),new pg(c,b),new pg(c,d),new pg(a,d)])}function yg(a,b,c,d){this.f=a;this.h=b;this.b=c;this.g=d}function zg(a,b){var c=a.b.f+(a.f.f-a.b.f)*(b-a.b.b)/(a.f.b-a.b.b);if(isNaN(c))throw Error("Bad intersection");return c}
function Ag(a,b,c,d){var e,f;b.f.b<c&&w.b("Error: inconsistent segment (1)");b.b.b<=c?(c=zg(b,c),e=b.h):(c=b.b.f,e=0);b.f.b>=d?(d=zg(b,d),f=b.h):(d=b.f.f,f=0);c<d?(a.push(new yg(c,e,b.g,-1)),a.push(new yg(d,f,b.g,1))):(a.push(new yg(d,f,b.g,-1)),a.push(new yg(c,e,b.g,1)))}
function Bg(a,b,c){c=b+c;for(var d=Array(c),e=Array(c),f=0;f<=c;f++)d[f]=0,e[f]=0;for(var g=[],h=!1,l=a.length,k=0;k<l;k++){var m=a[k];d[m.b]+=m.h;e[m.b]+=m.g;for(var p=!1,f=0;f<b;f++)if(d[f]&&!e[f]){p=!0;break}if(p)for(f=b;f<=c;f++)if(d[f]||e[f]){p=!1;break}h!=p&&(g.push(m.f),h=p)}return g}function Cg(a,b){return b?Math.ceil(a/b)*b:a}function Dg(a,b){return b?Math.floor(a/b)*b:a}function Eg(a){return new pg(a.b,-a.f)}function Fg(a){return new og(a.T,-a.U,a.R,-a.V)}
function Gg(a){return new ug(db(a.b,Eg))}
function Hg(a,b,c,d,e){e&&(a=Fg(a),b=db(b,Gg),c=db(c,Gg));e=b.length;var f=c?c.length:0,g=[],h=[],l,k,m;for(l=0;l<e;l++)vg(b[l],h,l);for(l=0;l<f;l++)vg(c[l],h,l+e);b=h.length;h.sort(tg);for(c=0;h[c].g>=e;)c++;c=h[c].b.b;c>a.T&&g.push(new sg(a.T,c,a.U,a.U));l=0;for(var p=[];l<b&&(m=h[l]).b.b<c;)m.f.b>c&&p.push(m),l++;for(;l<b||0<p.length;){var q=a.R,r=Math.min(Cg(Math.ceil(c+8),d),a.R);for(k=0;k<p.length&&q>r;k++)m=p[k],m.b.f==m.f.f?m.f.b<q&&(q=Math.max(Dg(m.f.b,d),r)):m.b.f!=m.f.f&&(q=r);q>a.R&&(q=
a.R);for(;l<b&&(m=h[l]).b.b<q;)if(m.f.b<c)l++;else if(m.b.b<r){if(m.b.b!=m.f.b||m.b.b!=c)p.push(m),q=r;l++}else{k=Dg(m.b.b,d);k<q&&(q=k);break}r=[];for(k=0;k<p.length;k++)Ag(r,p[k],c,q);r.sort(function(a,b){return a.f-b.f||a.g-b.g});r=Bg(r,e,f);if(r.length){var z=0,u=a.V;for(k=0;k<r.length;k+=2){var A=Math.max(a.V,r[k]),D=Math.min(a.U,r[k+1])-A;D>z&&(z=D,u=A)}z?g.push(new sg(c,q,Math.max(u,a.V),Math.min(u+z,a.U))):g.push(new sg(c,q,a.U,a.U))}else g.push(new sg(c,q,a.U,a.U));if(q==a.R)break;c=q;for(k=
p.length-1;0<=k;k--)p[k].f.b<=q&&p.splice(k,1)}Ig(a,g);return g}function Ig(a,b){for(var c=b.length-1,d=new sg(a.R,a.R,a.V,a.U);0<=c;){var e=d,d=b[c];if(1>d.R-d.T||d.V==e.V&&d.U==e.U)e.T=d.T,b.splice(c,1),d=e;c--}}function Jg(a,b){for(var c=0,d=a.length;c<d;){var e=Math.floor((c+d)/2);b>=a[e].R?c=e+1:d=e}return c}
function Kg(a,b){if(!a.length)return b;for(var c=b.T,d,e=0;e<a.length&&!(d=a[e],d.R>b.T&&d.V-.1<=b.V&&d.U+.1>=b.U);e++)c=Math.max(c,d.R);for(var f=c;e<a.length&&!(d=a[e],d.T>=b.R||d.V-.1>b.V||d.U+.1<b.U);e++)f=d.R;f=e===a.length?b.R:Math.min(f,b.R);return f<=c?null:new og(b.V,c,b.U,f)}
function Lg(a,b){if(!a.length)return b;for(var c=b.R,d,e=a.length-1;0<=e&&!(d=a[e],e===a.length-1&&d.R<b.R)&&!(d.T<b.R&&d.V-.1<=b.V&&d.U+.1>=b.U);e--)c=Math.min(c,d.T);for(var f=Math.min(c,d.R);0<=e&&!(d=a[e],d.R<=b.T||d.V-.1>b.V||d.U+.1<b.U);e--)f=d.T;f=Math.max(f,b.T);return c<=f?null:new og(b.V,f,b.U,c)};function Mg(){this.b={}}v(Mg,Fc);Mg.prototype.rc=function(a){this.b[a.name]=!0;return a};Mg.prototype.Ub=function(a){this.sc(a.values);return a};function Ng(a){this.value=a}v(Ng,Fc);Ng.prototype.Zc=function(a){this.value=a.L;return a};function Og(a,b){if(a){var c=new Ng(b);try{return a.fa(c),c.value}catch(d){w.b(d,"toInt: ")}}return b}function Pg(){this.b=!1;this.f=[];this.name=null}v(Pg,Fc);Pg.prototype.ad=function(a){this.b&&this.f.push(a);return null};
Pg.prototype.$c=function(a){this.b&&!a.L&&this.f.push(new F(0,"px"));return null};Pg.prototype.Ub=function(a){this.sc(a.values);return null};Pg.prototype.Xb=function(a){this.b||(this.b=!0,this.sc(a.values),this.b=!1,this.name=a.name.toLowerCase());return null};
function Qg(a,b,c,d,e,f){if(0<a.f.length){var g=[];a.f.forEach(function(b,c){if("%"==b.ka){var h=c%2?e:d;3==c&&"circle"==a.name&&(h=Math.sqrt((d*d+e*e)/2));g.push(b.L*h/100)}else g.push(b.L*Sb(f,b.ka,!1))});switch(a.name){case "polygon":if(!(g.length%2)){for(var h=[],l=0;l<g.length;l+=2)h.push(new pg(b+g[l],c+g[l+1]));return new ug(h)}break;case "rectangle":if(4==g.length)return xg(b+g[0],c+g[1],b+g[0]+g[2],c+g[1]+g[3]);break;case "ellipse":if(4==g.length)return wg(b+g[0],c+g[1],g[2],g[3]);break;
case "circle":if(3==g.length)return wg(b+g[0],c+g[1],g[2],g[2])}}return null}function Rg(a,b,c,d,e,f){if(a){var g=new Pg;try{return a.fa(g),Qg(g,b,c,d,e,f)}catch(h){w.b(h,"toShape:")}}return xg(b,c,b+d,c+e)}function Sg(a){this.f=a;this.b={};this.name=null}v(Sg,Fc);Sg.prototype.rc=function(a){this.name=a.toString();this.b[this.name]=this.f?0:(this.b[this.name]||0)+1;return a};Sg.prototype.Zc=function(a){this.name&&(this.b[this.name]+=a.L-(this.f?0:1));return a};
Sg.prototype.Ub=function(a){this.sc(a.values);return a};function Tg(a,b){var c=new Sg(b);try{a.fa(c)}catch(d){w.b(d,"toCounters:")}return c.b}function Ug(a,b){this.b=a;this.f=b}v(Ug,Gc);Ug.prototype.bd=function(a){return new Tc(this.f.oc(a.url,this.b))};function Vg(a){this.f=this.g=null;this.b=0;this.eb=a}function Wg(a,b){this.b=-1;this.f=a;this.g=b}function Xg(){this.X=[];this.b=[];this.match=[];this.f=[];this.error=[];this.g=!0}Xg.prototype.connect=function(a,b){for(var c=0;c<a.length;c++)this.b[a[c]].b=b;a.splice(0,a.length)};
Xg.prototype.clone=function(){for(var a=new Xg,b=0;b<this.X.length;b++){var c=this.X[b],d=new Vg(c.eb);d.b=c.b;a.X.push(d)}for(b=0;b<this.b.length;b++)c=this.b[b],d=new Wg(c.f,c.g),d.b=c.b,a.b.push(d);a.match.push.apply(a.match,[].concat(ia(this.match)));a.f.push.apply(a.f,[].concat(ia(this.f)));a.error.push.apply(a.error,[].concat(ia(this.error)));return a};
function Yg(a,b,c,d){var e=a.X.length,f=new Vg(Zg);f.b=0<=d?c?2*d+1:2*d+2:c?-1:-2;a.X.push(f);a.connect(b,e);c=new Wg(e,!0);e=new Wg(e,!1);b.push(a.b.length);a.b.push(e);b.push(a.b.length);a.b.push(c)}function $g(a){return 1==a.X.length&&!a.X[0].b&&a.X[0].eb instanceof ah}
function bh(a,b,c){if(b.X.length){var d=a.X.length;if(4==c&&1==d&&$g(b)&&$g(a)){c=a.X[0].eb;b=b.X[0].eb;var d={},e={},f;for(f in c.f)d[f]=c.f[f];for(f in b.f)d[f]=b.f[f];for(var g in c.g)e[g]=c.g[g];for(g in b.g)e[g]=b.g[g];a.X[0].eb=new ah(c.b|b.b,d,e)}else{for(f=0;f<b.X.length;f++)a.X.push(b.X[f]);4==c?(a.g=!0,a.connect(a.f,d)):a.connect(a.match,d);g=a.b.length;for(f=0;f<b.b.length;f++)e=b.b[f],e.f+=d,0<=e.b&&(e.b+=d),a.b.push(e);for(f=0;f<b.match.length;f++)a.match.push(b.match[f]+g);3==c&&a.connect(a.match,
d);if(2==c||3==c)for(f=0;f<b.f.length;f++)a.match.push(b.f[f]+g);else if(a.g){for(f=0;f<b.f.length;f++)a.f.push(b.f[f]+g);a.g=b.g}else for(f=0;f<b.f.length;f++)a.error.push(b.f[f]+g);for(f=0;f<b.error.length;f++)a.error.push(b.error[f]+g);b.X=null;b.b=null}}}var U={};function ch(){}v(ch,Fc);ch.prototype.h=function(a,b){var c=a[b].fa(this);return c?[c]:null};function ah(a,b,c){this.b=a;this.f=b;this.g=c}v(ah,ch);n=ah.prototype;n.Se=function(a){return this.b&1?a:null};
n.Te=function(a){return this.b&2048?a:null};n.Bd=function(a){return this.b&2?a:null};n.rc=function(a){var b=this.f[a.name.toLowerCase()];return b?b:this.b&4?a:null};n.ad=function(a){return a.L||this.b&512?0>a.L&&!(this.b&256)?null:this.g[a.ka]?a:null:"%"==a.ka&&this.b&1024?a:null};n.$c=function(a){return a.L?0>=a.L&&!(this.b&256)?null:this.b&16?a:null:this.b&512?a:null};n.Zc=function(a){return a.L?0>=a.L&&!(this.b&256)?null:this.b&48?a:(a=this.f[""+a.L])?a:null:this.b&512?a:null};
n.he=function(a){return this.b&64?a:null};n.bd=function(a){return this.b&128?a:null};n.Ub=function(){return null};n.qc=function(){return null};n.Xb=function(){return null};n.Yc=function(){return null};var Zg=new ah(0,U,U);
function dh(a){this.b=new Vg(null);var b=this.g=new Vg(null),c=a.X.length;a.X.push(this.b);a.X.push(b);a.connect(a.match,c);a.connect(a.f,c+1);a.connect(a.error,c+1);for(var b=t(a.b),d=b.next();!d.done;d=b.next())d=d.value,d.g?a.X[d.f].g=a.X[d.b]:a.X[d.f].f=a.X[d.b];for(b=0;b<c;b++)if(!a.X[b].f||!a.X[b].g)throw Error("Invalid validator state");this.f=a.X[0]}v(dh,ch);
function eh(a,b,c,d){for(var e=c?[]:b,f=a.f,g=d,h=null,l=null;f!==a.b&&f!==a.g;)if(g>=b.length)f=f.f;else{var k=b[g],m;if(f.b)m=!0,-1==f.b?(h?h.push(l):h=[l],l=[]):-2==f.b?0<h.length?l=h.pop():l=null:0<f.b&&!(f.b%2)?l[Math.floor((f.b-1)/2)]="taken":m=null==l[Math.floor((f.b-1)/2)],f=m?f.g:f.f;else{if(!g&&!c&&f.eb instanceof fh&&a instanceof fh){if(m=(new Hc(b)).fa(f.eb)){g=b.length;f=f.g;continue}}else if(!g&&!c&&f.eb instanceof gh&&a instanceof fh){if(m=(new Ic(b)).fa(f.eb)){g=b.length;f=f.g;continue}}else m=
k.fa(f.eb);if(m){if(m!==k&&b===e)for(e=[],k=0;k<g;k++)e[k]=b[k];b!==e&&(e[g-d]=m);g++;f=f.g}else f=f.f}}return f===a.b&&(c?0<e.length:g==b.length)?e:null}n=dh.prototype;n.Db=function(a){for(var b=null,c=this.f;c!==this.b&&c!==this.g;)a?c.b?c=c.g:(b=a.fa(c.eb))?(a=null,c=c.g):c=c.f:c=c.f;return c===this.b?b:null};n.Se=function(a){return this.Db(a)};n.Te=function(a){return this.Db(a)};n.Bd=function(a){return this.Db(a)};n.rc=function(a){return this.Db(a)};n.ad=function(a){return this.Db(a)};n.$c=function(a){return this.Db(a)};
n.Zc=function(a){return this.Db(a)};n.he=function(a){return this.Db(a)};n.bd=function(a){return this.Db(a)};n.Ub=function(){return null};n.qc=function(){return null};n.Xb=function(a){return this.Db(a)};n.Yc=function(){return null};function fh(a){dh.call(this,a)}v(fh,dh);fh.prototype.Ub=function(a){var b=eh(this,a.values,!1,0);return b===a.values?a:b?new Hc(b):null};
fh.prototype.qc=function(a){for(var b=this.f,c=!1;b;){if(b.eb instanceof gh){c=!0;break}b=b.f}return c?(b=eh(this,a.values,!1,0),b===a.values?a:b?new Ic(b):null):null};fh.prototype.h=function(a,b){return eh(this,a,!0,b)};function gh(a){dh.call(this,a)}v(gh,dh);gh.prototype.Ub=function(a){return this.Db(a)};gh.prototype.qc=function(a){var b=eh(this,a.values,!1,0);return b===a.values?a:b?new Ic(b):null};gh.prototype.h=function(a,b){for(var c=this.f,d;c!==this.g;){if(d=c.eb.h(a,b))return d;c=c.f}return null};
function hh(a,b){dh.call(this,b);this.name=a}v(hh,dh);hh.prototype.Db=function(){return null};hh.prototype.Xb=function(a){if(a.name.toLowerCase()!=this.name)return null;var b=eh(this,a.values,!1,0);return b===a.values?a:b?new Jc(a.name,b):null};function ih(){}ih.prototype.b=function(a,b){return b};ih.prototype.f=function(){};function jh(a,b){this.name=b;this.eb=a.g[this.name]}v(jh,ih);
jh.prototype.b=function(a,b,c){if(c.values[this.name])return b;if(a=this.eb.h(a,b)){var d=a.length;this.f(1<d?new Hc(a):a[0],c);return b+d}return b};jh.prototype.f=function(a,b){b.values[this.name]=a};function kh(a,b){jh.call(this,a,b[0]);this.g=b}v(kh,jh);kh.prototype.f=function(a,b){for(var c=0;c<this.g.length;c++)b.values[this.g[c]]=a};function lh(a,b){this.X=a;this.sf=b}v(lh,ih);
lh.prototype.b=function(a,b,c){var d=b;if(this.sf)if(a[b]==Nc){if(++b==a.length)return d}else return d;var e=this.X[0].b(a,b,c);if(e==b)return d;b=e;for(d=1;d<this.X.length&&b<a.length;d++){e=this.X[d].b(a,b,c);if(e==b)break;b=e}return b};function mh(){this.f=this.Ab=null;this.error=!1;this.values={};this.b=null}n=mh.prototype;n.clone=function(){var a=new this.constructor;a.Ab=this.Ab;a.f=this.f;a.b=this.b;return a};n.Ue=function(a,b){this.Ab=a;this.f=b};n.Ic=function(){this.error=!0;return 0};
function nh(a,b){a.Ic([b]);return null}n.Se=function(a){return nh(this,a)};n.Bd=function(a){return nh(this,a)};n.rc=function(a){return nh(this,a)};n.ad=function(a){return nh(this,a)};n.$c=function(a){return nh(this,a)};n.Zc=function(a){return nh(this,a)};n.he=function(a){return nh(this,a)};n.bd=function(a){return nh(this,a)};n.Ub=function(a){this.Ic(a.values);return null};n.qc=function(){this.error=!0;return null};n.Xb=function(a){return nh(this,a)};n.Yc=function(){this.error=!0;return null};
function oh(){mh.call(this)}v(oh,mh);oh.prototype.Ic=function(a){for(var b=0,c=0;b<a.length;){var d=this.Ab[c].b(a,b,this);if(d>b)b=d,c=0;else if(++c==this.Ab.length){this.error=!0;break}}return b};function ph(){mh.call(this)}v(ph,mh);ph.prototype.Ic=function(a){if(a.length>this.Ab.length||!a.length)return this.error=!0,0;for(var b=0;b<this.Ab.length;b++){for(var c=b;c>=a.length;)c=1==c?0:c-2;if(this.Ab[b].b(a,c,this)!=c+1)return this.error=!0,0}return a.length};function qh(){mh.call(this)}v(qh,mh);
qh.prototype.Ic=function(a){for(var b=a.length,c=0;c<a.length;c++)if(a[c]===Nc){b=c;break}if(b>this.Ab.length||!a.length)return this.error=!0,0;for(c=0;c<this.Ab.length;c++){for(var d=c;d>=b;)d=1==d?0:d-2;var e;if(b+1<a.length)for(e=b+c+1;e>=a.length;)e-=e==b+2?1:2;else e=d;if(2!=this.Ab[c].b([a[d],a[e]],0,this))return this.error=!0,0}return a.length};function rh(){mh.call(this)}v(rh,oh);
rh.prototype.qc=function(a){for(var b={},c=0;c<a.values.length;c++){this.values={};if(a.values[c]instanceof Ic)this.error=!0;else{a.values[c].fa(this);for(var d=this.values,e=t(this.f),f=e.next();!f.done;f=e.next()){var f=f.value,g=d[f]||this.b.l[f],h=b[f];h||(h=[],b[f]=h);h.push(g)}this.values["background-color"]&&c!=a.values.length-1&&(this.error=!0)}if(this.error)return null}this.values={};for(var l in b)this.values[l]="background-color"==l?b[l].pop():new Ic(b[l]);return null};
function sh(){mh.call(this)}v(sh,oh);sh.prototype.Ue=function(a,b){oh.prototype.Ue.call(this,a,b);this.f.push("font-family","line-height","font-size")};
sh.prototype.Ic=function(a){var b=oh.prototype.Ic.call(this,a);if(b+2>a.length)return this.error=!0,b;this.error=!1;var c=this.b.g;if(!a[b].fa(c["font-size"]))return this.error=!0,b;this.values["font-size"]=a[b++];if(a[b]===Nc){b++;if(b+2>a.length||!a[b].fa(c["line-height"]))return this.error=!0,b;this.values["line-height"]=a[b++]}var d=b==a.length-1?a[b]:new Hc(a.slice(b,a.length));if(!d.fa(c["font-family"]))return this.error=!0,b;this.values["font-family"]=d;return a.length};
sh.prototype.qc=function(a){a.values[0].fa(this);if(this.error)return null;for(var b=[this.values["font-family"]],c=1;c<a.values.length;c++)b.push(a.values[c]);a=new Ic(b);a.fa(this.b.g["font-family"])?this.values["font-family"]=a:this.error=!0;return null};sh.prototype.rc=function(a){if(a=this.b.f[a.name])for(var b in a)this.values[b]=a[b];else this.error=!0;return null};var th={SIMPLE:oh,INSETS:ph,INSETS_SLASH:qh,COMMA:rh,FONT:sh};
function uh(){this.g={};this.A={};this.l={};this.b={};this.f={};this.h={};this.u=[];this.j=[]}function vh(a,b){var c;if(3==b.type)c=new F(b.L,b.text);else if(7==b.type)c=Bf(b.text);else if(1==b.type)c=E(b.text);else throw Error("unexpected replacement");if($g(a)){var d=a.X[0].eb.f,e;for(e in d)d[e]=c;return a}throw Error("unexpected replacement");}
function wh(a,b,c){for(var d=new Xg,e=0;e<b;e++)bh(d,a.clone(),1);if(c==Number.POSITIVE_INFINITY)bh(d,a,3);else for(e=b;e<c;e++)bh(d,a.clone(),2);return d}function xh(a){var b=new Xg,c=b.X.length;b.X.push(new Vg(a));a=new Wg(c,!0);var d=new Wg(c,!1);b.connect(b.match,c);b.g?(b.f.push(b.b.length),b.g=!1):b.error.push(b.b.length);b.b.push(d);b.match.push(b.b.length);b.b.push(a);return b}
function yh(a,b){var c;switch(a){case "COMMA":c=new gh(b);break;case "SPACE":c=new fh(b);break;default:c=new hh(a.toLowerCase(),b)}return xh(c)}
function zh(a){a.b.HASHCOLOR=xh(new ah(64,U,U));a.b.POS_INT=xh(new ah(32,U,U));a.b.POS_NUM=xh(new ah(16,U,U));a.b.POS_PERCENTAGE=xh(new ah(8,U,{"%":C}));a.b.NEGATIVE=xh(new ah(256,U,U));a.b.ZERO=xh(new ah(512,U,U));a.b.ZERO_PERCENTAGE=xh(new ah(1024,U,U));a.b.POS_LENGTH=xh(new ah(8,U,{em:C,ex:C,ch:C,rem:C,vw:C,vh:C,vi:C,vb:C,vmin:C,vmax:C,pvw:C,pvh:C,pvi:C,pvb:C,pvmin:C,pvmax:C,cm:C,mm:C,"in":C,px:C,pt:C,pc:C,q:C}));a.b.POS_ANGLE=xh(new ah(8,U,{deg:C,grad:C,rad:C,turn:C}));a.b.POS_TIME=xh(new ah(8,
U,{s:C,ms:C}));a.b.FREQUENCY=xh(new ah(8,U,{Hz:C,kHz:C}));a.b.RESOLUTION=xh(new ah(8,U,{dpi:C,dpcm:C,dppx:C}));a.b.URI=xh(new ah(128,U,U));a.b.IDENT=xh(new ah(4,U,U));a.b.STRING=xh(new ah(2,U,U));a.b.SLASH=xh(new ah(2048,U,U));var b={"font-family":E("sans-serif")};a.f.caption=b;a.f.icon=b;a.f.menu=b;a.f["message-box"]=b;a.f["small-caption"]=b;a.f["status-bar"]=b}function Ah(a){return!!a.match(/^[A-Z_0-9]+$/)}
function Bh(a,b,c){var d=R(b);if(0==d.type)return null;var e={"":!0};if(14==d.type){do{S(b);d=R(b);if(1!=d.type)throw Error("Prefix name expected");e[d.text]=!0;S(b);d=R(b)}while(16==d.type);if(15!=d.type)throw Error("']' expected");S(b);d=R(b)}if(1!=d.type)throw Error("Property name expected");if(2==c?"SHORTHANDS"==d.text:"DEFAULTS"==d.text)return S(b),null;d=d.text;S(b);if(2!=c){if(39!=R(b).type)throw Error("'=' expected");Ah(d)||(a.A[d]=e)}else if(18!=R(b).type)throw Error("':' expected");return d}
function Ch(a,b){for(var c={};;){var d=Bh(a,b,1);if(!d)break;c.ra=[];var e=[];c.bb="";var f=void 0;c.ab=!0;c.ig=a;for(var g=function(a){return function(){if(!a.ra.length)throw Error("No values");var b;if(1==a.ra.length)b=a.ra[0];else{var c=a.bb,d=a.ra;b=new Xg;if("||"==c){for(c=0;c<d.length;c++){var e=new Xg;if(e.X.length)throw Error("invalid call");var f=new Vg(Zg);f.b=2*c+1;e.X.push(f);var f=new Wg(0,!0),g=new Wg(0,!1);e.f.push(e.b.length);e.b.push(g);e.match.push(e.b.length);e.b.push(f);bh(e,d[c],
1);Yg(e,e.match,!1,c);bh(b,e,c?4:1)}d=new Xg;if(d.X.length)throw Error("invalid call");Yg(d,d.match,!0,-1);bh(d,b,3);b=[d.match,d.f,d.error];for(c=0;c<b.length;c++)Yg(d,b[c],!1,-1);b=d}else{switch(c){case " ":e=1;break;case "|":case "||":e=4;break;default:throw Error("unexpected op");}for(c=0;c<d.length;c++)bh(b,d[c],c?e:1)}}return b}}(c),h=function(a){return function(b){if(a.ab)throw Error("'"+b+"': unexpected");if(a.bb&&a.bb!=b)throw Error("mixed operators: '"+b+"' and '"+a.bb+"'");a.bb=b;a.ab=
!0}}(c),l=null;!l;)switch(S(b),f=R(b),f.type){case 1:c.ab||h(" ");if(Ah(f.text)){var k=a.b[f.text];if(!k)throw Error("'"+f.text+"' unexpected");c.ra.push(k.clone())}else k={},k[f.text.toLowerCase()]=E(f.text),c.ra.push(xh(new ah(0,k,U)));c.ab=!1;break;case 5:k={};k[""+f.L]=new Rc(f.L);c.ra.push(xh(new ah(0,k,U)));c.ab=!1;break;case 34:h("|");break;case 25:h("||");break;case 14:c.ab||h(" ");e.push({ra:c.ra,bb:c.bb,Nb:"["});c.bb="";c.ra=[];c.ab=!0;break;case 6:c.ab||h(" ");e.push({ra:c.ra,bb:c.bb,Nb:"(",
Pc:f.text});c.bb="";c.ra=[];c.ab=!0;break;case 15:f=g();k=e.pop();if("["!=k.Nb)throw Error("']' unexpected");c.ra=k.ra;c.ra.push(f);c.bb=k.bb;c.ab=!1;break;case 11:f=g();k=e.pop();if("("!=k.Nb)throw Error("')' unexpected");c.ra=k.ra;c.ra.push(yh(k.Pc,f));c.bb=k.bb;c.ab=!1;break;case 18:if(c.ab)throw Error("':' unexpected");S(b);c.ra.push(vh(c.ra.pop(),R(b)));break;case 22:if(c.ab)throw Error("'?' unexpected");c.ra.push(wh(c.ra.pop(),0,1));break;case 36:if(c.ab)throw Error("'*' unexpected");c.ra.push(wh(c.ra.pop(),
0,Number.POSITIVE_INFINITY));break;case 23:if(c.ab)throw Error("'+' unexpected");c.ra.push(wh(c.ra.pop(),1,Number.POSITIVE_INFINITY));break;case 12:S(b);f=R(b);if(5!=f.type)throw Error("<int> expected");var m=k=f.L;S(b);f=R(b);if(16==f.type){S(b);f=R(b);if(5!=f.type)throw Error("<int> expected");m=f.L;S(b);f=R(b)}if(13!=f.type)throw Error("'}' expected");c.ra.push(wh(c.ra.pop(),k,m));break;case 17:l=g();if(0<e.length)throw Error("unclosed '"+e.pop().Nb+"'");break;default:throw Error("unexpected token");
}S(b);Ah(d)?a.b[d]=l:a.g[d]=1!=l.X.length||l.X[0].b?new fh(l):l.X[0].eb;c={ra:c.ra,ig:c.ig,bb:c.bb,ab:c.ab}}}function Dh(a,b){for(var c={},d=t(b),e=d.next();!e.done;e=d.next())for(var e=e.value,f=a.h[e],e=t(f?f.f:[e]),f=e.next();!f.done;f=e.next()){var f=f.value,g=a.l[f];g?c[f]=g:w.b("Unknown property in makePropSet:",f)}return c}
function Eh(a,b,c,d,e){var f="",g=b;b=b.toLowerCase();var h=b.match(/^-([a-z]+)-([-a-z0-9]+)$/);h&&(f=h[1],b=h[2]);if((h=a.A[b])&&h[f])if(f=a.g[b])(a=c===td||c.ef()?c:c.fa(f))?e.Sb(b,a,d):e.kd(g,c);else if(b=a.h[b].clone(),c===td)for(c=t(b.f),g=c.next();!g.done;g=c.next())e.Sb(g.value,td,d);else{c.fa(b);if(b.error)d=!1;else{a=t(b.f);for(f=a.next();!f.done;f=a.next())f=f.value,e.Sb(f,b.values[f]||b.b.l[f],d);d=!0}d||e.kd(g,c)}else e.fe(g,c)}
var Fh=new He(function(){var a=L("loadValidatorSet.load"),b=Ba("validation.txt",Aa),c=vf(b),d=new uh;zh(d);c.then(function(c){try{if(c.responseText){var e=new rf(c.responseText,null);for(Ch(d,e);;){var g=Bh(d,e,2);if(!g)break;for(c=[];;){S(e);var h=R(e);if(17==h.type){S(e);break}switch(h.type){case 1:c.push(E(h.text));break;case 4:c.push(new Qc(h.L));break;case 5:c.push(new Rc(h.L));break;case 3:c.push(new F(h.L,h.text));break;default:throw Error("unexpected token");}}d.l[g]=1<c.length?new Hc(c):
c[0]}for(;;){var l=Bh(d,e,3);if(!l)break;var k=tf(e,1),m;1==k.type&&th[k.text]?(m=new th[k.text],S(e)):m=new oh;m.b=d;g=!1;h=[];c=!1;for(var p=[],q=[];!g;)switch(S(e),k=R(e),k.type){case 1:if(d.g[k.text])h.push(new jh(m.b,k.text)),q.push(k.text);else if(d.h[k.text]instanceof ph){var r=d.h[k.text];h.push(new kh(r.b,r.f));q.push.apply(q,[].concat(ia(r.f)))}else throw Error("'"+k.text+"' is neither a simple property nor an inset shorthand");break;case 19:if(0<h.length||c)throw Error("unexpected slash");
c=!0;break;case 14:p.push({sf:c,Ab:h});h=[];c=!1;break;case 15:var z=new lh(h,c),u=p.pop(),h=u.Ab;c=u.sf;h.push(z);break;case 17:g=!0;S(e);break;default:throw Error("unexpected token");}m.Ue(h,q);d.h[l]=m}d.j=Dh(d,["background"]);d.u=Dh(d,"margin border padding columns column-gap column-rule column-fill".split(" "))}else w.error("Error: missing",b)}catch(A){w.error(A,"Error:")}O(a,d)});return a.result()},"validatorFetcher");var Gh={azimuth:!0,"border-collapse":!0,"border-spacing":!0,"caption-side":!0,"clip-rule":!0,color:!0,"color-interpolation":!0,"color-rendering":!0,cursor:!0,direction:!0,elevation:!0,"empty-cells":!0,fill:!0,"fill-opacity":!0,"fill-rule":!0,"font-kerning":!0,"font-size":!0,"font-size-adjust":!0,"font-family":!0,"font-feature-settings":!0,"font-style":!0,"font-stretch":!0,"font-variant":!0,"font-weight":!0,"glyph-orientation-vertical":!0,hyphens:!0,"hyphenate-character":!0,"hyphenate-limit-chars":!0,
"hyphenate-limit-last":!0,"image-rendering":!0,"image-resolution":!0,"letter-spacing":!0,"line-break":!0,"line-height":!0,"list-style-image":!0,"list-style-position":!0,"list-style-type":!0,marker:!0,"marker-end":!0,"marker-mid":!0,"marker-start":!0,orphans:!0,"overflow-wrap":!0,"paint-order":!0,"pointer-events":!0,"pitch-range":!0,quotes:!0,richness:!0,"ruby-align":!0,"ruby-position":!0,"speak-header":!0,"speak-numeral":!0,"speak-punctuation":!0,"speech-rate":!0,"shape-rendering":!0,stress:!0,stroke:!0,
"stroke-dasharray":!0,"stroke-dashoffset":!0,"stroke-linecap":!0,"stroke-linejoin":!0,"stroke-miterlimit":!0,"stroke-opacity":!0,"stroke-width":!0,"tab-size":!0,"text-align":!0,"text-align-last":!0,"text-anchor":!0,"text-decoration-skip":!0,"text-emphasis-color":!0,"text-emphasis-position":!0,"text-emphasis-style":!0,"text-combine-upright":!0,"text-indent":!0,"text-justify":!0,"text-rendering":!0,"text-size-adjust":!0,"text-transform":!0,"text-underline-position":!0,visibility:!0,"voice-family":!0,
volume:!0,"white-space":!0,widows:!0,"word-break":!0,"word-spacing":!0,"word-wrap":!0,"writing-mode":!0},Hh=["box-decoration-break","image-resolution","orphans","widows"];function Ih(){return he("POLYFILLED_INHERITED_PROPS").reduce(function(a,b){return a.concat(b())},[].concat(Hh))}
for(var Jh={"http://www.idpf.org/2007/ops":!0,"http://www.w3.org/1999/xhtml":!0,"http://www.w3.org/2000/svg":!0},Kh="margin-% padding-% border-%-width border-%-style border-%-color %".split(" "),Lh=["max-%","min-%","%"],Mh=["left","right","top","bottom"],Nh={width:!0,height:!0,"max-width":!0,"max-height":!0,"min-width":!0,"min-height":!0},Oh=0;Oh<Kh.length;Oh++)for(var Ph=0;Ph<Mh.length;Ph++){var Qh=Kh[Oh].replace("%",Mh[Ph]);Nh[Qh]=!0}
function Rh(a,b){for(var c={},d=t(Kh),e=d.next();!e.done;e=d.next()){var e=e.value,f;for(f in a){var g=e.replace("%",f),h=e.replace("%",a[f]);c[g]=h;c[h]=g}}d=t(Lh);for(f=d.next();!f.done;f=d.next()){f=f.value;for(var l in b)e=f.replace("%",l),g=f.replace("%",b[l]),c[e]=g,c[g]=e}return c}
var Sh=Rh({"block-start":"right","block-end":"left","inline-start":"top","inline-end":"bottom"},{"block-size":"width","inline-size":"height"}),Th=Rh({"block-start":"top","block-end":"bottom","inline-start":"left","inline-end":"right"},{"block-size":"height","inline-size":"width"}),Uh=Rh({"block-start":"right","block-end":"left","inline-start":"bottom","inline-end":"top"},{"block-size":"width","inline-size":"height"}),Vh=Rh({"block-start":"top","block-end":"bottom","inline-start":"right","inline-end":"left"},
{"block-size":"height","inline-size":"width"});function V(a,b){this.value=a;this.cb=b}n=V.prototype;n.Qf=function(){return this};n.Pd=function(a){a=this.value.fa(a);return a===this.value?this:new V(a,this.cb)};n.Sf=function(a){return a?new V(this.value,this.cb+a):this};n.evaluate=function(a,b){return ng(a,this.value,b)};n.zf=function(){return!0};function Wh(a,b,c){V.call(this,a,b);this.ia=c}v(Wh,V);Wh.prototype.Qf=function(){return new V(this.value,this.cb)};
Wh.prototype.Pd=function(a){a=this.value.fa(a);return a===this.value?this:new Wh(a,this.cb,this.ia)};Wh.prototype.Sf=function(a){return a?new Wh(this.value,this.cb+a,this.ia):this};Wh.prototype.zf=function(a){return!!this.ia.evaluate(a)};function Xh(a,b,c){return(!b||c.cb>b.cb)&&c.zf(a)?c.Qf():b}var Yh={"region-id":!0,"fragment-selector-id":!0};function Zh(a){return"_"!=a.charAt(0)&&!Yh[a]}function $h(a,b,c){c?a[b]=c:delete a[b]}function ai(a,b){var c=a[b];c||(c={},a[b]=c);return c}
function bi(a){var b=a._viewConditionalStyles;b||(b=[],a._viewConditionalStyles=b);return b}function ci(a,b){var c=a[b];c||(c=[],a[b]=c);return c}function di(a,b,c,d,e,f,g){[{id:e,mg:"_pseudos"},{id:f,mg:"_regions"}].forEach(function(a){if(a.id){var c=ai(b,a.mg);b=c[a.id];b||(b={},c[a.id]=b)}});g&&(e=bi(b),b={},e.push({Mg:b,Cg:g}));for(var h in c)"_"!=h.charAt(0)&&(Yh[h]?(g=c[h],e=ci(b,h),Array.prototype.push.apply(e,g)):$h(b,h,Xh(a,b[h],c[h].Sf(d))))}
function ei(a,b){if(0<a.length){a.sort(function(a,b){return b.f()-a.f()});for(var c=null,d=a.length-1;0<=d;d--)c=a[d],c.b=b,b=c;return c}return b}function fi(a,b){this.g=a;this.f=b;this.b=""}v(fi,Gc);function gi(a){a=a.g["font-size"].value;var b;a:switch(a.ka.toLowerCase()){case "px":case "in":case "pt":case "pc":case "cm":case "mm":case "q":b=!0;break a;default:b=!1}if(!b)throw Error("Unexpected state");return a.L*Ob[a.ka]}
fi.prototype.ad=function(a){if("font-size"===this.b){var b=gi(this),c=this.f;a=hi(a,b,c);var d=a.ka,e=a.L;return"px"===d?a:"%"===d?new F(e/100*b,"px"):new F(e*Sb(c,d,!1),"px")}if("em"==a.ka||"ex"==a.ka||"rem"==a.ka)return hi(a,gi(this),this.f);if("%"==a.ka){if("line-height"===this.b)return a;b=this.b.match(/height|^(top|bottom)$/)?"vh":"vw";return new F(a.L,b)}return a};fi.prototype.Yc=function(a){return"font-size"==this.b?ng(this.f,a,this.b).fa(this):a};
function hi(a,b,c){var d=a.ka,e=a.L;return"em"===d||"ex"===d?new F(Ob[d]/Ob.em*e*b,"px"):"rem"===d?new F(e*c.fontSize(),"px"):a}function ii(){}ii.prototype.apply=function(){};ii.prototype.l=function(a){return new ji([this,a])};ii.prototype.clone=function(){return this};function ki(a){this.b=a}v(ki,ii);ki.prototype.apply=function(a){var b=this.b.g(a);a.h[a.h.length-1].push(b)};function ji(a){this.b=a}v(ji,ii);ji.prototype.apply=function(a){for(var b=0;b<this.b.length;b++)this.b[b].apply(a)};
ji.prototype.l=function(a){this.b.push(a);return this};ji.prototype.clone=function(){return new ji([].concat(this.b))};function li(a,b,c,d,e){this.style=a;this.ba=b;this.b=c;this.h=d;this.j=e}v(li,ii);li.prototype.apply=function(a){di(a.l,a.F,this.style,this.ba,this.b,this.h,mi(a,this.j))};function W(){this.b=null}v(W,ii);W.prototype.apply=function(a){this.b.apply(a)};W.prototype.f=function(){return 0};W.prototype.g=function(){return!1};function ni(a){this.b=null;this.h=a}v(ni,W);
ni.prototype.apply=function(a){a.G.includes(this.h)&&this.b.apply(a)};ni.prototype.f=function(){return 10};ni.prototype.g=function(a){this.b&&oi(a.Pa,this.h,this.b);return!0};function pi(a){this.b=null;this.id=a}v(pi,W);pi.prototype.apply=function(a){a.Y!=this.id&&a.la!=this.id||this.b.apply(a)};pi.prototype.f=function(){return 11};pi.prototype.g=function(a){this.b&&oi(a.g,this.id,this.b);return!0};function qi(a){this.b=null;this.localName=a}v(qi,W);
qi.prototype.apply=function(a){a.f==this.localName&&this.b.apply(a)};qi.prototype.f=function(){return 8};qi.prototype.g=function(a){this.b&&oi(a.Ad,this.localName,this.b);return!0};function ri(a,b){this.b=null;this.h=a;this.localName=b}v(ri,W);ri.prototype.apply=function(a){a.f==this.localName&&a.j==this.h&&this.b.apply(a)};ri.prototype.f=function(){return 8};ri.prototype.g=function(a){if(this.b){var b=a.b[this.h];b||(b="ns"+a.j++ +":",a.b[this.h]=b);oi(a.h,b+this.localName,this.b)}return!0};
function si(a){this.b=null;this.h=a}v(si,W);si.prototype.apply=function(a){var b=a.b;if(b&&"a"==a.f){var c=b.getAttribute("href");c&&c.match(/^#/)&&(b=b.ownerDocument.getElementById(c.substring(1)))&&(b=b.getAttributeNS("http://www.idpf.org/2007/ops","type"))&&b.match(this.h)&&this.b.apply(a)}};function ti(a){this.b=null;this.h=a}v(ti,W);ti.prototype.apply=function(a){a.j==this.h&&this.b.apply(a)};function ui(a,b){this.b=null;this.h=a;this.name=b}v(ui,W);
ui.prototype.apply=function(a){a.b&&a.b.hasAttributeNS(this.h,this.name)&&this.b.apply(a)};function vi(a,b,c){this.b=null;this.h=a;this.name=b;this.value=c}v(vi,W);vi.prototype.apply=function(a){a.b&&a.b.getAttributeNS(this.h,this.name)==this.value&&this.b.apply(a)};vi.prototype.f=function(){return"type"==this.name&&"http://www.idpf.org/2007/ops"==this.h?9:0};vi.prototype.g=function(a){return"type"==this.name&&"http://www.idpf.org/2007/ops"==this.h?(this.b&&oi(a.f,this.value,this.b),!0):!1};
function wi(a,b){this.b=null;this.h=a;this.name=b}v(wi,W);wi.prototype.apply=function(a){if(a.b){var b=a.b.getAttributeNS(this.h,this.name);b&&Jh[b]&&this.b.apply(a)}};wi.prototype.f=function(){return 0};wi.prototype.g=function(){return!1};function xi(a,b,c){this.b=null;this.j=a;this.name=b;this.h=c}v(xi,W);xi.prototype.apply=function(a){if(a.b){var b=a.b.getAttributeNS(this.j,this.name);b&&b.match(this.h)&&this.b.apply(a)}};function yi(a){this.b=null;this.h=a}v(yi,W);
yi.prototype.apply=function(a){a.lang.match(this.h)&&this.b.apply(a)};function zi(){this.b=null}v(zi,W);zi.prototype.apply=function(a){a.ob&&this.b.apply(a)};zi.prototype.f=function(){return 6};function Ai(){this.b=null}v(Ai,W);Ai.prototype.apply=function(a){a.ta&&this.b.apply(a)};Ai.prototype.f=function(){return 12};function Bi(a,b){this.b=null;this.h=a;this.Nb=b}v(Bi,W);function Ci(a,b,c){a-=c;return b?!(a%b)&&0<=a/b:!a}function Di(a,b){Bi.call(this,a,b)}v(Di,Bi);
Di.prototype.apply=function(a){Ci(a.Za,this.h,this.Nb)&&this.b.apply(a)};Di.prototype.f=function(){return 5};function Ei(a,b){Bi.call(this,a,b)}v(Ei,Bi);Ei.prototype.apply=function(a){Ci(a.Cb[a.j][a.f],this.h,this.Nb)&&this.b.apply(a)};Ei.prototype.f=function(){return 5};function Fi(a,b){Bi.call(this,a,b)}v(Fi,Bi);Fi.prototype.apply=function(a){var b=a.S;null===b&&(b=a.S=a.b.parentNode.childElementCount-a.Za+1);Ci(b,this.h,this.Nb)&&this.b.apply(a)};Fi.prototype.f=function(){return 4};
function Gi(a,b){Bi.call(this,a,b)}v(Gi,Bi);Gi.prototype.apply=function(a){var b=a.yb;if(!b[a.j]){var c=a.b;do{var d=c.namespaceURI,e=c.localName,f=b[d];f||(f=b[d]={});f[e]=(f[e]||0)+1}while(c=c.nextElementSibling)}Ci(b[a.j][a.f],this.h,this.Nb)&&this.b.apply(a)};Gi.prototype.f=function(){return 4};function Hi(){this.b=null}v(Hi,W);Hi.prototype.apply=function(a){for(var b=a.b.firstChild;b;){switch(b.nodeType){case Node.ELEMENT_NODE:return;case Node.TEXT_NODE:if(0<b.length)return}b=b.nextSibling}this.b.apply(a)};
Hi.prototype.f=function(){return 4};function Ii(){this.b=null}v(Ii,W);Ii.prototype.apply=function(a){!1===a.b.disabled&&this.b.apply(a)};Ii.prototype.f=function(){return 5};function Ji(){this.b=null}v(Ji,W);Ji.prototype.apply=function(a){!0===a.b.disabled&&this.b.apply(a)};Ji.prototype.f=function(){return 5};function Ki(){this.b=null}v(Ki,W);Ki.prototype.apply=function(a){var b=a.b;!0!==b.selected&&!0!==b.checked||this.b.apply(a)};Ki.prototype.f=function(){return 5};
function Li(a){this.b=null;this.ia=a}v(Li,W);Li.prototype.apply=function(a){if(a.ca[this.ia])try{a.fb.push(this.ia),this.b.apply(a)}finally{a.fb.pop()}};Li.prototype.f=function(){return 5};function Mi(){this.b=!1}v(Mi,ii);Mi.prototype.apply=function(){this.b=!0};Mi.prototype.clone=function(){var a=new Mi;a.b=this.b;return a};function Ni(a){this.b=null;this.h=new Mi;this.j=ei(a,this.h)}v(Ni,W);Ni.prototype.apply=function(a){this.j.apply(a);this.h.b||this.b.apply(a);this.h.b=!1};Ni.prototype.f=function(){return this.j.f()};
function Oi(a,b,c){this.ia=a;this.b=b;this.j=c}function Pi(a,b){var c=a.ia,d=a.j;b.ca[c]=(b.ca[c]||0)+1;d&&(b.A[c]?b.A[c].push(d):b.A[c]=[d])}function Qi(a,b){Ri(b,a.ia,a.j)}function Si(a,b,c){Oi.call(this,a,b,c)}v(Si,Oi);Si.prototype.g=function(a){return new Si(this.ia,this.b,mi(a,this.b))};Si.prototype.push=function(a,b){b||Pi(this,a);return!1};Si.prototype.f=function(a,b){return b?!1:(Qi(this,a),!0)};function Ti(a,b,c){Oi.call(this,a,b,c)}v(Ti,Oi);
Ti.prototype.g=function(a){return new Ti(this.ia,this.b,mi(a,this.b))};Ti.prototype.push=function(a,b){b?1==b&&Qi(this,a):Pi(this,a);return!1};Ti.prototype.f=function(a,b){if(b)1==b&&Pi(this,a);else return Qi(this,a),!0;return!1};function Ui(a,b,c){Oi.call(this,a,b,c);this.h=!1}v(Ui,Oi);Ui.prototype.g=function(a){return new Ui(this.ia,this.b,mi(a,this.b))};Ui.prototype.push=function(a){return this.h?(Qi(this,a),!0):!1};
Ui.prototype.f=function(a,b){if(this.h)return Qi(this,a),!0;b||(this.h=!0,Pi(this,a));return!1};function Vi(a,b,c){Oi.call(this,a,b,c);this.h=!1}v(Vi,Oi);Vi.prototype.g=function(a){return new Vi(this.ia,this.b,mi(a,this.b))};Vi.prototype.push=function(a,b){this.h&&(-1==b?Pi(this,a):b||Qi(this,a));return!1};Vi.prototype.f=function(a,b){if(this.h){if(-1==b)return Qi(this,a),!0;b||Pi(this,a)}else b||(this.h=!0,Pi(this,a));return!1};function Wi(a,b){this.b=a;this.element=b}Wi.prototype.g=function(){return this};
Wi.prototype.push=function(){return!1};Wi.prototype.f=function(a,b){return b?!1:(Xi(a,this.b,this.element),!0)};function Yi(a){this.lang=a}Yi.prototype.g=function(){return this};Yi.prototype.push=function(){return!1};Yi.prototype.f=function(a,b){return b?!1:(a.lang=this.lang,!0)};function Zi(a){this.b=a}Zi.prototype.g=function(){return this};Zi.prototype.push=function(){return!1};Zi.prototype.f=function(a,b){return b?!1:(a.J=this.b,!0)};function $i(a){this.element=a}v($i,Gc);
function aj(a,b){switch(b){case "url":return a?new Tc(a):new Tc("about:invalid");default:return a?new Oc(a):new Oc("")}}
$i.prototype.Xb=function(a){if("attr"!==a.name)return Gc.prototype.Xb.call(this,a);var b="string",c;a.values[0]instanceof Hc?(2<=a.values[0].values.length&&(b=a.values[0].values[1].stringValue()),c=a.values[0].values[0].stringValue()):c=a.values[0].stringValue();a=1<a.values.length?aj(a.values[1].stringValue(),b):aj(null,b);return this.element&&this.element.hasAttribute(c)?aj(this.element.getAttribute(c),b):a};function bj(a,b,c){this.f=a;this.element=b;this.b=c}v(bj,Gc);
bj.prototype.rc=function(a){var b=this.f,c=b.J,d=Math.floor(c.length/2)-1;switch(a.name){case "open-quote":a=c[2*Math.min(d,b.D)];b.D++;break;case "close-quote":return 0<b.D&&b.D--,c[2*Math.min(d,b.D)+1];case "no-open-quote":return b.D++,new Oc("");case "no-close-quote":return 0<b.D&&b.D--,new Oc("")}return a};
var cj={roman:[4999,1E3,"M",900,"CM",500,"D",400,"CD",100,"C",90,"XC",50,"L",40,"XL",10,"X",9,"IX",5,"V",4,"IV",1,"I"],armenian:[9999,9E3,"\u0584",8E3,"\u0583",7E3,"\u0582",6E3,"\u0581",5E3,"\u0580",4E3,"\u057f",3E3,"\u057e",2E3,"\u057d",1E3,"\u057c",900,"\u057b",800,"\u057a",700,"\u0579",600,"\u0578",500,"\u0577",400,"\u0576",300,"\u0575",200,"\u0574",100,"\u0573",90,"\u0572",80,"\u0571",70,"\u0570",60,"\u056f",50,"\u056e",40,"\u056d",30,"\u056c",20,"\u056b",10,"\u056a",9,"\u0569",8,"\u0568",7,"\u0567",
6,"\u0566",5,"\u0565",4,"\u0564",3,"\u0563",2,"\u0562",1,"\u0561"],georgian:[19999,1E4,"\u10f5",9E3,"\u10f0",8E3,"\u10ef",7E3,"\u10f4",6E3,"\u10ee",5E3,"\u10ed",4E3,"\u10ec",3E3,"\u10eb",2E3,"\u10ea",1E3,"\u10e9",900,"\u10e8",800,"\u10e7",700,"\u10e6",600,"\u10e5",500,"\u10e4",400,"\u10f3",300,"\u10e2",200,"\u10e1",100,"\u10e0",90,"\u10df",80,"\u10de",70,"\u10dd",60,"\u10f2",50,"\u10dc",40,"\u10db",30,"\u10da",20,"\u10d9",10,"\u10d8",9,"\u10d7",8,"\u10f1",7,"\u10d6",6,"\u10d5",5,"\u10d4",4,"\u10d3",
3,"\u10d2",2,"\u10d1",1,"\u10d0"],hebrew:[999,400,"\u05ea",300,"\u05e9",200,"\u05e8",100,"\u05e7",90,"\u05e6",80,"\u05e4",70,"\u05e2",60,"\u05e1",50,"\u05e0",40,"\u05de",30,"\u05dc",20,"\u05db",19,"\u05d9\u05d8",18,"\u05d9\u05d7",17,"\u05d9\u05d6",16,"\u05d8\u05d6",15,"\u05d8\u05d5",10,"\u05d9",9,"\u05d8",8,"\u05d7",7,"\u05d6",6,"\u05d5",5,"\u05d4",4,"\u05d3",3,"\u05d2",2,"\u05d1",1,"\u05d0"]},dj={latin:"a-z",alpha:"a-z",greek:"\u03b1-\u03c1\u03c3-\u03c9",russian:"\u0430-\u0438\u043a-\u0449\u044d-\u044f"},
ej={square:"\u25a0",disc:"\u2022",circle:"\u25e6",none:""},fj={ph:!1,fd:"\u96f6\u4e00\u4e8c\u4e09\u56db\u4e94\u516d\u4e03\u516b\u4e5d",Vd:"\u5341\u767e\u5343",Fg:"\u8ca0"};
function gj(a){if(9999<a||-9999>a)return""+a;if(!a)return fj.fd.charAt(0);var b=new Ra;0>a&&(b.append(fj.Fg),a=-a);if(10>a)b.append(fj.fd.charAt(a));else if(fj.qh&&19>=a)b.append(fj.Vd.charAt(0)),a&&b.append(fj.Vd.charAt(a-10));else{var c=Math.floor(a/1E3);c&&(b.append(fj.fd.charAt(c)),b.append(fj.Vd.charAt(2)));if(c=Math.floor(a/100)%10)b.append(fj.fd.charAt(c)),b.append(fj.Vd.charAt(1));if(c=Math.floor(a/10)%10)b.append(fj.fd.charAt(c)),b.append(fj.Vd.charAt(0));(a%=10)&&b.append(fj.fd.charAt(a))}return b.toString()}
bj.prototype.format=function(a,b){var c=!1,d=!1,e;if(e=b.match(/^upper-(.*)/))c=!0,b=e[1];else if(e=b.match(/^lower-(.*)/))d=!0,b=e[1];e="";if(cj[b])a:{e=cj[b];var f=a;if(f>e[0]||0>=f||f!=Math.round(f))e="";else{for(var g="",h=1;h<e.length;h+=2){var l=e[h],k=Math.floor(f/l);if(20<k){e="";break a}for(f-=k*l;0<k;)g+=e[h+1],k--}e=g}}else if(dj[b])if(e=a,0>=e||e!=Math.round(e))e="";else{g=dj[b];f=[];for(h=0;h<g.length;)if("-"==g.substr(h+1,1))for(k=g.charCodeAt(h),l=g.charCodeAt(h+2),h+=3;k<=l;k++)f.push(String.fromCharCode(k));
else f.push(g.substr(h++,1));g="";do e--,h=e%f.length,g=f[h]+g,e=(e-h)/f.length;while(0<e);e=g}else null!=ej[b]?e=ej[b]:"decimal-leading-zero"==b?(e=""+a,1==e.length&&(e="0"+e)):"cjk-ideographic"==b||"trad-chinese-informal"==b?e=gj(a):e=""+a;return c?e.toUpperCase():d?e.toLowerCase():e};
function hj(a,b){var c=b[0].toString(),d=1<b.length?b[1].stringValue():"decimal",e=a.f.g[c];if(e&&e.length)return new Oc(a.format(e&&e.length&&e[e.length-1]||0,d));c=new G(ij(a.b,c,function(b){return a.format(b||0,d)}));return new Hc([c])}
function jj(a,b){var c=b[0].toString(),d=b[1].stringValue(),e=2<b.length?b[2].stringValue():"decimal",f=a.f.g[c],g=new Ra;if(f&&f.length)for(var h=0;h<f.length;h++)0<h&&g.append(d),g.append(a.format(f[h],e));c=new G(kj(a.b,c,function(b){var c=[];if(b.length)for(var f=0;f<b.length;f++)c.push(a.format(b[f],e));b=g.toString();b.length&&c.push(b);return c.length?c.join(d):a.format(0,e)}));return new Hc([c])}
function lj(a,b){var c=b[0],c=c instanceof Tc?c.url:c.stringValue(),d=b[1].toString(),e=2<b.length?b[2].stringValue():"decimal",c=new G(mj(a.b,c,d,function(b){return a.format(b||0,e)}));return new Hc([c])}function nj(a,b){var c=b[0],c=c instanceof Tc?c.url:c.stringValue(),d=b[1].toString(),e=b[2].stringValue(),f=3<b.length?b[3].stringValue():"decimal",c=new G(oj(a.b,c,d,function(b){b=b.map(function(b){return a.format(b,f)});return b.length?b.join(e):a.format(0,f)}));return new Hc([c])}
bj.prototype.Xb=function(a){switch(a.name){case "counter":if(2>=a.values.length)return hj(this,a.values);break;case "counters":if(3>=a.values.length)return jj(this,a.values);break;case "target-counter":if(3>=a.values.length)return lj(this,a.values);break;case "target-counters":if(4>=a.values.length)return nj(this,a.values)}w.b("E_CSS_CONTENT_PROP:",a.toString());return new Oc("")};var pj=1/1048576;function qj(a,b){for(var c in a)b[c]=a[c].clone()}
function rj(){this.j=0;this.b={};this.Ad={};this.h={};this.f={};this.Pa={};this.g={};this.od={};this.order=0}rj.prototype.clone=function(){var a=new rj;a.j=this.j;for(var b in this.b)a.b[b]=this.b[b];qj(this.Ad,a.Ad);qj(this.h,a.h);qj(this.f,a.f);qj(this.Pa,a.Pa);qj(this.g,a.g);qj(this.od,a.od);a.order=this.order;return a};function oi(a,b,c){var d=a[b];d&&(c=d.l(c));a[b]=c}rj.prototype.nf=function(){return this.order+=pj};
function sj(a,b,c,d){this.u=a;this.l=b;this.Zb=c;this.xb=d;this.h=[[],[]];this.ca={};this.G=this.F=this.ua=this.b=null;this.Ba=this.la=this.Y=this.j=this.f="";this.Z=this.N=null;this.ta=this.ob=!0;this.g={};this.H=[{}];this.J=[new Oc("\u201c"),new Oc("\u201d"),new Oc("\u2018"),new Oc("\u2019")];this.D=0;this.lang="";this.Mb=[0];this.Za=0;this.sa=[{}];this.Cb=this.sa[0];this.S=null;this.Lb=[this.S];this.Jb=[{}];this.yb=this.sa[0];this.A={};this.fb=[];this.Kb=[]}
function Ri(a,b,c){a.ca[b]--;a.A[b]&&(a.A[b]=a.A[b].filter(function(a){return a!==c}),a.A[b].length||delete a.A[b])}function mi(a,b){var c=null;b&&(c=tj(a.ua,b));var d=a.fb.map(function(b){return(b=a.A[b])&&0<b.length?1===b.length?b[0]:new uj([].concat(b)):null}).filter(function(a){return a});return 0>=d.length?c:c?new vj([c].concat(d)):1===d.length?d[0]:new vj(d)}function wj(a,b,c){(b=b[c])&&b.apply(a)}var xj=[];
function yj(a,b,c,d){a.b=null;a.ua=null;a.F=d;a.j="";a.f="";a.Y="";a.la="";a.G=b;a.Ba="";a.N=xj;a.Z=c;zj(a)}function Aj(a,b,c){a.g[b]?a.g[b].push(c):a.g[b]=[c];c=a.H[a.H.length-1];c||(c={},a.H[a.H.length-1]=c);c[b]=!0}
function Bj(a,b){var c=ud,d=b.display;d&&(c=d.evaluate(a.l));var e=null,f=d=null,g=b["counter-reset"];g&&(g=g.evaluate(a.l))&&(e=Tg(g,!0));(g=b["counter-set"])&&(g=g.evaluate(a.l))&&(f=Tg(g,!1));(g=b["counter-increment"])&&(g=g.evaluate(a.l))&&(d=Tg(g,!1));"ol"!=a.f&&"ul"!=a.f||"http://www.w3.org/1999/xhtml"!=a.j||(e||(e={}),e["ua-list-item"]=0);c===Bd&&(d||(d={}),d["ua-list-item"]=1);if(e)for(var h in e)Aj(a,h,e[h]);if(f)for(var l in f)a.g[l]?(h=a.g[l],h[h.length-1]=f[l]):Aj(a,l,f[l]);if(d)for(var k in d)a.g[k]||
Aj(a,k,0),h=a.g[k],h[h.length-1]+=d[k];c===Bd&&(c=a.g["ua-list-item"],b["ua-list-item-count"]=new V(new Qc(c[c.length-1]),0));a.H.push(null)}function Cj(a){var b=a.H.pop();if(b)for(var c in b)(b=a.g[c])&&(1==b.length?delete a.g[c]:b.pop())}function Xi(a,b,c){Bj(a,b);b.content&&(b.content=b.content.Pd(new bj(a,c,a.xb)));Cj(a)}var Dj="before transclusion-before footnote-call footnote-marker inner first-letter first-line  transclusion-after after".split(" ");
function Ej(a,b,c,d){a.Kb.push(b);a.Z=null;a.b=b;a.ua=d;a.F=c;a.j=b.namespaceURI;a.f=b.localName;d=a.u.b[a.j];a.Ba=d?d+a.f:"";a.Y=b.getAttribute("id");a.la=b.getAttributeNS("http://www.w3.org/XML/1998/namespace","id");(d=b.getAttribute("class"))?a.G=d.split(/\s+/):a.G=xj;(d=b.getAttributeNS("http://www.idpf.org/2007/ops","type"))?a.N=d.split(/\s+/):a.N=xj;"style"==a.f&&"http://www.gribuser.ru/xml/fictionbook/2.0"==a.j&&(a.G=[b.getAttribute("name")||""]);if(d=Qa(b))a.h[a.h.length-1].push(new Yi(a.lang)),
a.lang=d.toLowerCase();d=a.ta;var e=a.Mb;a.Za=++e[e.length-1];e.push(0);var e=a.sa,f=a.Cb=e[e.length-1],g=f[a.j];g||(g=f[a.j]={});g[a.f]=(g[a.f]||0)+1;e.push({});e=a.Lb;null!==e[e.length-1]?a.S=--e[e.length-1]:a.S=null;e.push(null);e=a.Jb;(f=a.yb=e[e.length-1])&&f[a.j]&&f[a.j][a.f]--;e.push({});zj(a);Fj(a,b);e=c.quotes;c=null;e&&(e=e.evaluate(a.l))&&(c=new Zi(a.J),e===J?a.J=[new Oc(""),new Oc("")]:e instanceof Hc&&(a.J=e.values));Bj(a,a.F);e=a.Y||a.la||b.getAttribute("name")||"";if(d||e){var h={};
Object.keys(a.g).forEach(function(a){h[a]=Array.from(this.g[a])},a);Gj(a.Zb,e,h)}if(d=a.F._pseudos)for(e=!0,f=t(Dj),g=f.next();!g.done;g=f.next())(g=g.value)||(e=!1),(g=d[g])&&(e?Xi(a,g,b):a.h[a.h.length-2].push(new Wi(g,b)));c&&a.h[a.h.length-2].push(c)}function Hj(a,b){for(var c in b)Zh(c)&&(b[c]=b[c].Pd(a))}function Fj(a,b){var c=new $i(b),d=a.F,e=d._pseudos,f;for(f in e)Hj(c,e[f]);Hj(c,d)}
function zj(a){var b;for(b=0;b<a.G.length;b++)wj(a,a.u.Pa,a.G[b]);for(b=0;b<a.N.length;b++)wj(a,a.u.f,a.N[b]);wj(a,a.u.g,a.Y);wj(a,a.u.Ad,a.f);""!=a.f&&wj(a,a.u.Ad,"*");wj(a,a.u.h,a.Ba);null!==a.Z&&(wj(a,a.u.od,a.Z),wj(a,a.u.od,"*"));a.b=null;a.h.push([]);for(var c=1;-1<=c;--c){var d=a.h[a.h.length-c-2];for(b=0;b<d.length;)d[b].push(a,c)?d.splice(b,1):b++}a.ob=!0;a.ta=!1}
function Ij(a){for(var b=1;-1<=b;--b)for(var c=a.h[a.h.length-b-2],d=0;d<c.length;)c[d].f(a,b)?c.splice(d,1):d++;a.h.pop();a.ob=!1}var Jj=null;function Kj(a,b,c,d,e,f,g){Hf.call(this,a,b,g);this.b=null;this.ba=0;this.h=this.mb=null;this.D=!1;this.ia=c;this.l=d?d.l:Jj?Jj.clone():new rj;this.G=e;this.A=f;this.u=0;this.j=null}v(Kj,If);Kj.prototype.Uf=function(a){oi(this.l.Ad,"*",a)};function Lj(a,b){var c=ei(a.b,b);c!==b&&c.g(a.l)||a.Uf(c)}
Kj.prototype.Wb=function(a,b){if(b||a)this.ba+=1,b&&a?this.b.push(new ri(a,b.toLowerCase())):b?this.b.push(new qi(b.toLowerCase())):this.b.push(new ti(a))};Kj.prototype.oe=function(a){this.h?(w.b("::"+this.h,"followed by ."+a),this.b.push(new Li(""))):(this.ba+=256,this.b.push(new ni(a)))};var Mj={"nth-child":Di,"nth-of-type":Ei,"nth-last-child":Fi,"nth-last-of-type":Gi};
Kj.prototype.qd=function(a,b){if(this.h)w.b("::"+this.h,"followed by :"+a),this.b.push(new Li(""));else{switch(a.toLowerCase()){case "enabled":this.b.push(new Ii);break;case "disabled":this.b.push(new Ji);break;case "checked":this.b.push(new Ki);break;case "root":this.b.push(new Ai);break;case "link":this.b.push(new qi("a"));this.b.push(new ui("","href"));break;case "-adapt-href-epub-type":case "href-epub-type":if(b&&1==b.length&&"string"==typeof b[0]){var c=new RegExp("(^|s)"+Ga(b[0])+"($|s)");this.b.push(new si(c))}else this.b.push(new Li(""));
break;case "-adapt-footnote-content":case "footnote-content":this.D=!0;break;case "visited":case "active":case "hover":case "focus":this.b.push(new Li(""));break;case "lang":b&&1==b.length&&"string"==typeof b[0]?this.b.push(new yi(new RegExp("^"+Ga(b[0].toLowerCase())+"($|-)"))):this.b.push(new Li(""));break;case "nth-child":case "nth-last-child":case "nth-of-type":case "nth-last-of-type":c=Mj[a.toLowerCase()];b&&2==b.length?this.b.push(new c(b[0],b[1])):this.b.push(new Li(""));break;case "first-child":this.b.push(new zi);
break;case "last-child":this.b.push(new Fi(0,1));break;case "first-of-type":this.b.push(new Ei(0,1));break;case "last-of-type":this.b.push(new Gi(0,1));break;case "only-child":this.b.push(new zi);this.b.push(new Fi(0,1));break;case "only-of-type":this.b.push(new Ei(0,1));this.b.push(new Gi(0,1));break;case "empty":this.b.push(new Hi);break;case "before":case "after":case "first-line":case "first-letter":this.rd(a,b);return;default:w.b("unknown pseudo-class selector: "+a),this.b.push(new Li(""))}this.ba+=
256}};
Kj.prototype.rd=function(a,b){switch(a){case "before":case "after":case "first-line":case "first-letter":case "footnote-call":case "footnote-marker":case "inner":case "after-if-continues":this.h?(w.b("Double pseudoelement ::"+this.h+"::"+a),this.b.push(new Li(""))):this.h=a;break;case "first-n-lines":if(b&&1==b.length&&"number"==typeof b[0]){var c=Math.round(b[0]);if(0<c&&c==b[0]){this.h?(w.b("Double pseudoelement ::"+this.h+"::"+a),this.b.push(new Li(""))):this.h="first-"+c+"-lines";break}}case "nth-fragment":b&&2==
b.length?this.j="NFS_"+b[0]+"_"+b[1]:this.b.push(new Li(""));break;default:w.b("Unrecognized pseudoelement: ::"+a),this.b.push(new Li(""))}this.ba+=1};Kj.prototype.ze=function(a){this.ba+=65536;this.b.push(new pi(a))};
Kj.prototype.Hd=function(a,b,c,d){this.ba+=256;b=b.toLowerCase();d=d||"";var e;switch(c){case 0:e=new ui(a,b);break;case 39:e=new vi(a,b,d);break;case 45:!d||d.match(/\s/)?e=new Li(""):e=new xi(a,b,new RegExp("(^|\\s)"+Ga(d)+"($|\\s)"));break;case 44:e=new xi(a,b,new RegExp("^"+Ga(d)+"($|-)"));break;case 43:d?e=new xi(a,b,new RegExp("^"+Ga(d))):e=new Li("");break;case 42:d?e=new xi(a,b,new RegExp(Ga(d)+"$")):e=new Li("");break;case 46:d?e=new xi(a,b,new RegExp(Ga(d))):e=new Li("");break;case 50:"supported"==
d?e=new wi(a,b):(w.b("Unsupported :: attr selector op:",d),e=new Li(""));break;default:w.b("Unsupported attr selector:",c),e=new Li("")}this.b.push(e)};var Nj=0;n=Kj.prototype;n.cc=function(){var a="d"+Nj++;Lj(this,new ki(new Si(a,this.j,null)));this.b=[new Li(a)];this.j=null};n.ne=function(){var a="c"+Nj++;Lj(this,new ki(new Ti(a,this.j,null)));this.b=[new Li(a)];this.j=null};n.me=function(){var a="a"+Nj++;Lj(this,new ki(new Ui(a,this.j,null)));this.b=[new Li(a)];this.j=null};
n.te=function(){var a="f"+Nj++;Lj(this,new ki(new Vi(a,this.j,null)));this.b=[new Li(a)];this.j=null};n.Sc=function(){Oj(this);this.h=null;this.D=!1;this.ba=0;this.b=[]};n.Tb=function(){var a;0!=this.u?(Kf(this,"E_CSS_UNEXPECTED_SELECTOR"),a=!0):a=!1;a||(this.u=1,this.mb={},this.h=null,this.ba=0,this.D=!1,this.b=[])};n.error=function(a,b){If.prototype.error.call(this,a,b);1==this.u&&(this.u=0)};n.Wc=function(a){If.prototype.Wc.call(this,a);this.u=0};
n.La=function(){Oj(this);If.prototype.La.call(this);1==this.u&&(this.u=0)};n.dc=function(){If.prototype.dc.call(this)};function Oj(a){if(a.b){var b=a.ba+a.l.nf();Lj(a,a.Xf(b));a.b=null;a.h=null;a.j=null;a.D=!1;a.ba=0}}n.Xf=function(a){var b=this.G;this.D&&(b=b?"xxx-bogus-xxx":"footnote");return new li(this.mb,a,this.h,b,this.j)};n.Qb=function(a,b,c){Eh(this.A,a,b,c,this)};n.kd=function(a,b){Jf(this,"E_INVALID_PROPERTY_VALUE "+a+": "+b.toString())};
n.fe=function(a,b){Jf(this,"E_INVALID_PROPERTY "+a+": "+b.toString())};n.Sb=function(a,b,c){"display"!=a||b!==Fd&&b!==Ed||(this.Sb("flow-options",new Hc([ld,Md]),c),this.Sb("flow-into",b,c),b=bd);he("SIMPLE_PROPERTY").forEach(function(d){d=d({name:a,value:b,important:c});a=d.name;b=d.value;c=d.important});var d=c?Df(this):Ef(this);$h(this.mb,a,this.ia?new Wh(b,d,this.ia):new V(b,d))};n.xd=function(a){switch(a){case "not":a=new Pj(this),a.Tb(),Gf(this.oa,a)}};
function Pj(a){Kj.call(this,a.f,a.oa,a.ia,a,a.G,a.A,!1);this.parent=a;this.g=a.b}v(Pj,Kj);n=Pj.prototype;n.xd=function(a){"not"==a&&Kf(this,"E_CSS_UNEXPECTED_NOT")};n.La=function(){Kf(this,"E_CSS_UNEXPECTED_RULE_BODY")};n.Sc=function(){Kf(this,"E_CSS_UNEXPECTED_NEXT_SELECTOR")};n.Nd=function(){this.b&&0<this.b.length&&this.g.push(new Ni(this.b));this.parent.ba+=this.ba;var a=this.oa;a.b=a.g.pop()};n.error=function(a,b){Kj.prototype.error.call(this,a,b);var c=this.oa;c.b=c.g.pop()};
function Qj(a,b){Hf.call(this,a,b,!1)}v(Qj,If);Qj.prototype.Qb=function(a,b){if(this.f.values[a])this.error("E_CSS_NAME_REDEFINED "+a,this.jd());else{var c=a.match(/height|^(top|bottom)$/)?"vh":"vw",c=new uc(this.f,100,c),c=b.Aa(this.f,c);this.f.values[a]=c}};function Rj(a,b,c,d,e){Hf.call(this,a,b,!1);this.mb=d;this.ia=c;this.b=e}v(Rj,If);Rj.prototype.Qb=function(a,b,c){c?w.b("E_IMPORTANT_NOT_ALLOWED"):Eh(this.b,a,b,c,this)};Rj.prototype.kd=function(a,b){w.b("E_INVALID_PROPERTY_VALUE",a+":",b.toString())};
Rj.prototype.fe=function(a,b){w.b("E_INVALID_PROPERTY",a+":",b.toString())};Rj.prototype.Sb=function(a,b,c){c=c?Df(this):Ef(this);c+=this.order;this.order+=pj;$h(this.mb,a,this.ia?new Wh(b,c,this.ia):new V(b,c))};function Sj(a,b){gg.call(this,a);this.mb={};this.b=b;this.order=0}v(Sj,gg);Sj.prototype.Qb=function(a,b,c){Eh(this.b,a,b,c,this)};Sj.prototype.kd=function(a,b){w.b("E_INVALID_PROPERTY_VALUE",a+":",b.toString())};Sj.prototype.fe=function(a,b){w.b("E_INVALID_PROPERTY",a+":",b.toString())};
Sj.prototype.Sb=function(a,b,c){c=(c?67108864:50331648)+this.order;this.order+=pj;$h(this.mb,a,new V(b,c))};function Tj(a,b,c){return(a=a["writing-mode"])&&(b=a.evaluate(b,"writing-mode"))&&b!==td?b===Wd:c}function Uj(a,b,c){return(a=a.direction)&&(b=a.evaluate(b,"direction"))&&b!==td?b===Nd:c}function Vj(a,b,c,d){var e={},f;for(f in a)Zh(f)&&(e[f]=a[f]);Wj(e,b,a);Xj(a,c,d,function(a,c){Yj(e,c,b);Wj(e,b,c)});return e}
function Xj(a,b,c,d){a=a._regions;if((b||c)&&a)for(c&&(c=["footnote"],b=b?b.concat(c):c),b=t(b),c=b.next();!c.done;c=b.next()){c=c.value;var e=a[c];e&&d(c,e)}}function Yj(a,b,c){for(var d in b)Zh(d)&&(a[d]=Xh(c,a[d],b[d]))}function Zj(a,b,c,d,e){c=c?d?Uh:Sh:d?Vh:Th;for(var f in a)if(a.hasOwnProperty(f)&&(d=a[f])){var g=c[f];if(g){var h=a[g];if(h&&h.cb>d.cb)continue;g=Nh[g]?g:f}else g=f;b[g]=e(f,d)}};var ak=!1,bk={dh:"ltr",eh:"rtl"};oa("vivliostyle.constants.PageProgression",bk);bk.LTR="ltr";bk.RTL="rtl";var ck={pg:"left",qg:"right"};oa("vivliostyle.constants.PageSide",ck);ck.LEFT="left";ck.RIGHT="right";var dk={LOADING:"loading",bh:"interactive",Zg:"complete"};oa("vivliostyle.constants.ReadyState",dk);dk.LOADING="loading";dk.INTERACTIVE="interactive";dk.COMPLETE="complete";function ek(a,b,c){this.u=a;this.url=b;this.b=c;this.lang=null;this.h=-1;this.root=c.documentElement;b=a=null;if("http://www.w3.org/1999/xhtml"==this.root.namespaceURI){for(var d=this.root.firstChild;d;d=d.nextSibling)if(1==d.nodeType&&(c=d,"http://www.w3.org/1999/xhtml"==c.namespaceURI))switch(c.localName){case "head":b=c;break;case "body":a=c}this.lang=this.root.getAttribute("lang")}else if("http://www.gribuser.ru/xml/fictionbook/2.0"==this.root.namespaceURI){b=this.root;for(d=this.root.firstChild;d;d=
d.nextSibling)1==d.nodeType&&(c=d,"http://www.gribuser.ru/xml/fictionbook/2.0"==c.namespaceURI&&"body"==c.localName&&(a=c));c=fk(fk(fk(fk(new gk([this.b]),"FictionBook"),"description"),"title-info"),"lang").textContent();0<c.length&&(this.lang=c[0])}else if("http://example.com/sse"==this.root.namespaceURI)for(c=this.root.firstElementChild;c;c=c.nextElementSibling)d=c.localName,"meta"===d?b=c:"body"===d&&(a=c);this.body=a;this.l=b;this.g=this.root;this.j=1;this.g.setAttribute("data-adapt-eloff","0")}
function hk(a,b){var c=b.getAttribute("data-adapt-eloff");if(c)return parseInt(c,10);for(var c=a.j,d=a.g;d!=b;){var e=d.firstChild;if(!e)for(;!(e=d.nextSibling);)if(d=d.parentNode,!d)throw Error("Internal error");d=e;1==e.nodeType?(e.setAttribute("data-adapt-eloff",c.toString()),++c):c+=e.textContent.length}a.j=c;a.g=b;return c-1}
function ik(a,b,c,d){var e=0;if(1==b.nodeType){if(!d)return hk(a,b)}else{e=c;c=b.previousSibling;if(!c)return b=b.parentNode,e+=1,hk(a,b)+e;b=c}for(;;){for(;b.lastChild;)b=b.lastChild;if(1==b.nodeType)break;e+=b.textContent.length;c=b.previousSibling;if(!c){b=b.parentNode;break}b=c}e+=1;return hk(a,b)+e}function jk(a){0>a.h&&(a.h=ik(a,a.root,0,!0));return a.h}
function kk(a,b){for(var c,d=a.root,e={};;){c=hk(a,d);if(c>=b)return d;e.children=d.children;if(!e.children)break;var f=Za(e.children.length,function(c){return function(d){return hk(a,c.children[d])>b}}(e));if(!f)break;if(f<e.children.length&&hk(a,e.children[f])<=b)throw Error("Consistency check failed!");d=e.children[f-1];e={children:e.children}}c+=1;for(var e=d,f=e.firstChild||e.nextSibling,g=null;;){if(f){if(1==f.nodeType)break;g=e=f;c+=f.textContent.length;if(c>b)break}else if(e=e.parentNode,
!e)break;f=e.nextSibling}return g||d}function lk(a,b){var c=b.getAttribute("id");c&&!a.f[c]&&(a.f[c]=b);(c=b.getAttributeNS("http://www.w3.org/XML/1998/namespace","id"))&&!a.f[c]&&(a.f[c]=b);for(c=b.firstElementChild;c;c=c.nextElementSibling)lk(a,c)}function mk(a,b){var c=b.match(/([^#]*)\#(.+)$/);if(!c||c[1]&&c[1]!=a.url)return null;var c=c[2],d=a.b.getElementById(c);!d&&a.b.getElementsByName&&(d=a.b.getElementsByName(c)[0]);d||(a.f||(a.f={},lk(a,a.b.documentElement)),d=a.f[c]);return d}
var nk={hh:"text/html",ih:"text/xml",Ug:"application/xml",Tg:"application/xhtml_xml",ah:"image/svg+xml"};function ok(a,b,c){c=c||new DOMParser;var d;try{d=c.parseFromString(a,b)}catch(e){}if(d){a=d.documentElement;if("parsererror"===a.localName)return null;for(a=a.firstChild;a;a=a.nextSibling)if("parsererror"===a.localName)return null}else return null;return d}
function pk(a){var b=a.contentType;if(b){for(var c=Object.keys(nk),d=0;d<c.length;d++)if(nk[c[d]]===b)return b;if(b.match(/\+xml$/))return"application/xml"}if(a=a.url.match(/\.([^./]+)$/))switch(a[1]){case "html":case "htm":return"text/html";case "xhtml":case "xht":return"application/xhtml_xml";case "svg":case "svgz":return"image/svg+xml";case "opf":case "xml":return"application/xml"}return null}
function qk(a,b){var c=a.responseXML;if(!c){var d=new DOMParser,e=a.responseText;if(e){var f=pk(a);(c=ok(e,f||"application/xml",d))&&!f&&(f=c.documentElement,"html"!==f.localName.toLowerCase()||f.namespaceURI?"svg"===f.localName.toLowerCase()&&"image/svg+xml"!==c.contentType&&(c=ok(e,"image/svg+xml",d)):c=ok(e,"text/html",d));c||(c=ok(e,"text/html",d))}}c=c?new ek(b,a.url,c):null;return M(c)}function rk(a){this.Pc=a}
function sk(){var a=tk;return new rk(function(b){return a.Pc(b)&&1==b.nodeType&&"http://www.idpf.org/2008/embedding"==b.getAttribute("Algorithm")})}function uk(){var a=sk(),b=tk;return new rk(function(c){if(!b.Pc(c))return!1;c=new gk([c]);c=fk(c,"EncryptionMethod");a&&(c=vk(c,a));return 0<c.size()})}var tk=new rk(function(){return!0});function gk(a){this.X=a}gk.prototype.size=function(){return this.X.length};
function vk(a,b){for(var c=[],d=t(a.X),e=d.next();!e.done;e=d.next())e=e.value,b.Pc(e)&&c.push(e);return new gk(c)}function wk(a,b){function c(a){d.push(a)}for(var d=[],e=0;e<a.X.length;e++)b(a.X[e],c);return new gk(d)}gk.prototype.forEach=function(a){for(var b=[],c=0;c<this.X.length;c++)b.push(a(this.X[c]));return b};function xk(a,b){for(var c=[],d=0;d<a.X.length;d++){var e=b(a.X[d]);null!=e&&c.push(e)}return c}
function fk(a,b){return wk(a,function(a,d){for(var c=a.firstChild;c;c=c.nextSibling)c.localName==b&&d(c)})}function yk(a){return wk(a,function(a,c){for(var b=a.firstChild;b;b=b.nextSibling)1==b.nodeType&&c(b)})}function zk(a,b){return xk(a,function(a){return 1==a.nodeType?a.getAttribute(b):null})}gk.prototype.textContent=function(){return this.forEach(function(a){return a.textContent})};var Ak={transform:!0,"transform-origin":!0},Bk={top:!0,bottom:!0,left:!0,right:!0};function Ck(a,b,c){this.target=a;this.name=b;this.value=c}var Dk={show:function(a){a.style.visibility="visible"},hide:function(a){a.style.visibility="hidden"},play:function(a){a.currentTime=0;a.play()},pause:function(a){a.pause()},resume:function(a){a.play()},mute:function(a){a.muted=!0},unmute:function(a){a.muted=!1}};
function Ek(a,b){var c=Dk[b];return c?function(){for(var b=0;b<a.length;b++)try{c(a[b])}catch(e){}}:null}
function Fk(a,b){this.Pb={};this.I=a;this.h=b;this.D=null;this.l=[];var c=this;this.J=function(a){var b=a.currentTarget,d=b.getAttribute("href")||b.getAttributeNS("http://www.w3.org/1999/xlink","href");d&&gb(c,{type:"hyperlink",target:null,currentTarget:null,mh:b,href:d,preventDefault:function(){a.preventDefault()}})};this.f={};this.g={width:0,height:0};this.A=this.u=!1;this.F=this.G=!0;this.P=0;this.position=null;this.offset=-1;this.b=null;this.j=[];this.H={top:{},bottom:{},left:{},right:{}}}
v(Fk,fb);function Gk(a,b){(a.G=b)?a.I.setAttribute("data-vivliostyle-auto-page-width",!0):a.I.removeAttribute("data-vivliostyle-auto-page-width")}function Hk(a,b){(a.F=b)?a.I.setAttribute("data-vivliostyle-auto-page-height",!0):a.I.removeAttribute("data-vivliostyle-auto-page-height")}function Ik(a,b,c){var d=a.f[c];d?d.push(b):a.f[c]=[b]}
function Jk(a,b,c){Object.keys(a.f).forEach(function(a){for(var b=this.f[a],c=0;c<b.length;)this.I.contains(b[c])?c++:b.splice(c,1);b.length||delete this.f[a]},a);for(var d=a.l,e=0;e<d.length;e++){var f=d[e];x(f.target,f.name,f.value.toString())}e=Kk(c,a.I);a.g.width=e.width;a.g.height=e.height;for(e=0;e<b.length;e++)if(c=b[e],f=a.f[c.sd],d=a.f[c.Hg],f&&d&&(f=Ek(f,c.action)))for(var g=0;g<d.length;g++)d[g].addEventListener(c.event,f,!1)}
Fk.prototype.zoom=function(a){x(this.I,"transform","scale("+a+")")};function Lk(a){switch(a){case "normal":case "nowrap":return 0;case "pre-line":return 1;case "pre":case "pre-wrap":return 2;default:return null}}function Mk(a,b){if(1==a.nodeType)return!1;var c=a.textContent;switch(b){case 0:return!!c.match(/^\s*$/);case 1:return!!c.match(/^[ \t\f]*$/);case 2:return!c.length}throw Error("Unexpected whitespace: "+b);}function Nk(a){this.f=a;this.b=[];this.C=null}
function Ok(a,b,c,d,e,f,g,h,l){this.b=a;this.element=b;this.f=c;this.cb=d;this.l=e;this.h=f;this.u=g;this.j=h;this.wb=-1;this.g=l}function Pk(a,b){return a.h?!b.h||a.cb>b.cb?!0:a.j:!1}function Qk(a,b){return a.top-b.top}function Rk(a,b){return b.right-a.right}function Sk(a,b){return a===b?!0:a&&b?a.node===b.node&&a.kb===b.kb&&Tk(a.wa,b.wa)&&Tk(a.Ja,b.Ja)&&Sk(a.Ga,b.Ga):!1}
function Uk(a,b){if(a===b)return!0;if(!a||!b||a.na!==b.na||a.K!==b.K||a.pa.length!==b.pa.length)return!1;for(var c=0;c<a.pa.length;c++)if(!Sk(a.pa[c],b.pa[c]))return!1;return!0}function Vk(a){return{pa:[{node:a.M,kb:Wk,wa:a.wa,Ja:null,Ga:null,Sa:0}],na:0,K:!1,Qa:a.Qa}}function Xk(a,b){var c=new Yk(a.node,b,0);c.kb=a.kb;c.wa=a.wa;c.Ja=a.Ja;c.Ga=a.Ga?Xk(a.Ga,Zk(b)):null;c.C=a.C;c.Sa=a.Sa+1;return c}var Wk=0;
function $k(a,b,c,d,e,f,g){this.oa=a;this.pd=d;this.vf=null;this.root=b;this.da=c;this.type=f;e&&(e.vf=this);this.b=g}function Tk(a,b){return a===b||!!a&&!!b&&(b?a.oa===b.oa&&a.da===b.da&&a.type===b.type&&Tk(a.pd,b.pd):!1)}function al(a,b){this.Ig=a;this.count=b}
function Yk(a,b,c){this.M=a;this.parent=b;this.Ma=c;this.na=0;this.K=!1;this.kb=Wk;this.wa=b?b.wa:null;this.Ga=this.Ja=null;this.Ba=!1;this.ya=!0;this.xa=!1;this.j=b?b.j:0;this.display=null;this.W=bl;this.ca=this.N=this.l=this.Ca=null;this.Z="baseline";this.la="top";this.ta=this.sa=0;this.H=!1;this.uc=b?b.uc:0;this.F=b?b.F:null;this.A=b?b.A:!1;this.S=this.hd=!1;this.D=this.B=this.G=this.g=null;this.h=b?b.h:{};this.b=b?b.b:!1;this.direction=b?b.direction:"ltr";this.f=b?b.f:null;this.Qa=this.lang=null;
this.C=b?b.C:null;this.u=null;this.ua={};this.Sa=1;this.Y=this.J=null}function cl(a){a.ya=!0;a.j=a.parent?a.parent.j:0;a.B=null;a.D=null;a.na=0;a.K=!1;a.display=null;a.W=bl;a.Ca=null;a.l=null;a.N=null;a.ca=null;a.Z="baseline";a.H=!1;a.uc=a.parent?a.parent.uc:0;a.F=a.parent?a.parent.F:null;a.A=a.parent?a.parent.A:!1;a.g=null;a.G=null;a.Ja=null;a.hd=!1;a.S=!1;a.b=a.parent?a.parent.b:!1;a.Ja=null;a.Qa=null;a.C=a.parent?a.parent.C:null;a.u=null;a.ua={};a.Sa=1;a.J=null;a.Y=null}
function dl(a){var b=new Yk(a.M,a.parent,a.Ma);b.na=a.na;b.K=a.K;b.Ja=a.Ja;b.kb=a.kb;b.wa=a.wa;b.Ga=a.Ga;b.ya=a.ya;b.j=a.j;b.display=a.display;b.W=a.W;b.Ca=a.Ca;b.l=a.l;b.N=a.N;b.ca=a.ca;b.Z=a.Z;b.la=a.la;b.sa=a.sa;b.ta=a.ta;b.hd=a.hd;b.S=a.S;b.H=a.H;b.uc=a.uc;b.F=a.F;b.A=a.A;b.g=a.g;b.G=a.G;b.B=a.B;b.D=a.D;b.f=a.f;b.b=a.b;b.xa=a.xa;b.Qa=a.Qa;b.C=a.C;b.u=a.u;b.ua=Object.create(a.ua);b.Sa=a.Sa;b.J=a.J;b.Y=a.Y;return b}Yk.prototype.modify=function(){return this.Ba?dl(this):this};
function Zk(a){var b=a;do{if(b.Ba)break;b.Ba=!0;b=b.parent}while(b);return a}Yk.prototype.clone=function(){for(var a=dl(this),b=a,c;c=b.parent;)c=dl(c),b=b.parent=c;return a};function el(a){return{node:a.M,kb:a.kb,wa:a.wa,Ja:a.Ja,Ga:a.Ga?el(a.Ga):null,C:a.C,Sa:a.Sa}}function fl(a){var b=a,c=[];do b.f&&b.parent&&b.parent.f!==b.f||c.push(el(b)),b=b.parent;while(b);b=a.Qa?gl(a.Qa,a.na,-1):a.na;return{pa:c,na:b,K:a.K,Qa:a.Qa}}function hl(a){for(a=a.parent;a;){if(a.hd)return!0;a=a.parent}return!1}
function il(a,b){for(var c=a;c;)c.ya||b(c),c=c.parent}function jl(a,b){return a.C===b&&!!a.parent&&a.parent.C===b}function kl(a){this.f=a;this.b=null}kl.prototype.clone=function(){var a=new kl(this.f);if(this.b){a.b=[];for(var b=0;b<this.b.length;++b)a.b[b]=this.b[b]}return a};function ll(a,b){if(!b)return!1;if(a===b)return!0;if(!Uk(a.f,b.f))return!1;if(a.b){if(!b.b||a.b.length!==b.b.length)return!1;for(var c=0;c<a.b.length;c++)if(!Uk(a.b[c],b.b[c]))return!1}else if(b.b)return!1;return!0}
function ml(a,b){this.b=a;this.qa=b}ml.prototype.clone=function(){return new ml(this.b.clone(),this.qa)};function nl(){this.b=[];this.g="any";this.f=null}nl.prototype.clone=function(){for(var a=new nl,b=this.b,c=a.b,d=0;d<b.length;d++)c[d]=b[d].clone();a.g=this.g;a.f=this.f;return a};function ol(a,b){if(a===b)return!0;if(!b||a.b.length!==b.b.length)return!1;for(var c=0;c<a.b.length;c++){var d=a.b[c],e=b.b[c];if(!e||d!==e&&!ll(d.b,e.b))return!1}return!0}
function pl(){this.page=0;this.f={};this.b={};this.g=0}pl.prototype.clone=function(){var a=new pl;a.page=this.page;a.h=this.h;a.g=this.g;a.j=this.j;a.f=this.f;for(var b in this.b)a.b[b]=this.b[b].clone();return a};function ql(a,b){if(a===b)return!0;if(!b||a.page!==b.page||a.g!==b.g)return!1;var c=Object.keys(a.b),d=Object.keys(b.b);if(c.length!==d.length)return!1;c=t(c);for(d=c.next();!d.done;d=c.next())if(d=d.value,!ol(a.b[d],b.b[d]))return!1;return!0}
function rl(a){this.element=a;this.G=this.F=this.height=this.width=this.S=this.J=this.Y=this.H=this.Ba=this.ca=this.Za=this.Z=this.marginBottom=this.marginTop=this.marginRight=this.marginLeft=this.top=this.left=0;this.Lb=this.ob=null;this.yb=this.Od=this.Mb=this.Rd=this.h=0;this.b=!1}function sl(a){return a.marginTop+a.ca+a.J}function tl(a){return a.marginBottom+a.Ba+a.S}function ul(a){return a.marginLeft+a.Z+a.H}function vl(a){return a.marginRight+a.Za+a.Y}function wl(a){return a.b?-1:1}
function xl(a,b){a.element=b.element;a.left=b.left;a.top=b.top;a.marginLeft=b.marginLeft;a.marginRight=b.marginRight;a.marginTop=b.marginTop;a.marginBottom=b.marginBottom;a.Z=b.Z;a.Za=b.Za;a.ca=b.ca;a.Ba=b.Ba;a.H=b.H;a.Y=b.Y;a.J=b.J;a.S=b.S;a.width=b.width;a.height=b.height;a.F=b.F;a.G=b.G;a.Lb=b.Lb;a.ob=b.ob;a.h=b.h;a.Rd=b.Rd;a.Mb=b.Mb;a.b=b.b}function yl(a,b,c){a.top=b;a.height=c;x(a.element,"top",b+"px");x(a.element,"height",c+"px")}
function zl(a,b,c){a.left=b;a.width=c;x(a.element,"left",b+"px");x(a.element,"width",c+"px")}function Al(a,b,c){a.b?zl(a,b+c*wl(a),c):yl(a,b,c)}function Bl(a,b,c){a.b?yl(a,b,c):zl(a,b,c)}function Cl(a){a=a.element;for(var b;b=a.lastChild;)a.removeChild(b)}function Dl(a){var b=a.F+a.left+a.marginLeft+a.Z,c=a.G+a.top+a.marginTop+a.ca;return new og(b,c,b+(a.H+a.width+a.Y),c+(a.J+a.height+a.S))}function El(a,b,c){a=Fl(a);return Rg(b,a.V,a.T,a.U-a.V,a.R-a.T,c)}
function Fl(a){var b=a.F+a.left,c=a.G+a.top;return new og(b,c,b+(ul(a)+a.width+vl(a)),c+(sl(a)+a.height+tl(a)))}function Gl(a,b,c,d){this.b=a;this.f=b;this.h=c;this.g=d}v(Gl,Fc);Gl.prototype.Bd=function(a){this.b.appendChild(this.b.ownerDocument.createTextNode(a.Xc));return null};Gl.prototype.bd=function(a){if(this.h.url)this.b.setAttribute("src",a.url);else{var b=this.b.ownerDocument.createElementNS("http://www.w3.org/1999/xhtml","img");b.setAttribute("src",a.url);this.b.appendChild(b)}return null};
Gl.prototype.Ub=function(a){this.sc(a.values);return null};Gl.prototype.Yc=function(a){var b=a.Aa();a=b.evaluate(this.f);"string"===typeof a&&((b=this.g(b,a,this.b.ownerDocument))||(b=this.b.ownerDocument.createTextNode(a)),this.b.appendChild(b));return null};function Hl(a){return!!a&&a!==Dd&&a!==J&&a!==td};function Il(a,b,c){this.g=a;this.f=b;this.b=c}function Jl(){this.map=[]}function Kl(a){return a.map.length?a.map[a.map.length-1].b:0}function Ll(a,b){if(a.map.length){var c=a.map[a.map.length-1],d=c.b+b-c.f;c.f==c.g?(c.f=b,c.g=b,c.b=d):a.map.push(new Il(b,b,d))}else a.map.push(new Il(b,b,b))}function Ml(a,b){a.map.length?a.map[a.map.length-1].f=b:a.map.push(new Il(b,0,0))}function Nl(a,b){var c=Za(a.map.length,function(c){return b<=a.map[c].f}),c=a.map[c];return c.b-Math.max(0,c.g-b)}
function Ol(a,b){var c=Za(a.map.length,function(c){return b<=a.map[c].b}),c=a.map[c];return c.g-(c.b-b)}function Pl(a,b,c,d,e,f,g,h){this.A=a;this.style=b;this.offset=c;this.D=d;this.qa=e;this.b=e.b;this.ib=f;this.pb=g;this.F=h;this.j=this.l=null;this.u={};this.g=this.f=this.h=null;Ql(this)&&(b=b._pseudos)&&b.before&&(a=new Pl(a,b.before,c,!1,e,Rl(this),g,!0),c=Sl(a,"content"),Hl(c)&&(this.h=a,this.g=a.g));this.g=Tl(Ul(this,"before"),this.g);this.pb&&Vl[this.g]&&(e.g=Tl(e.g,this.g))}
function Sl(a,b,c){if(!(b in a.u)){var d=a.style[b];a.u[b]=d?d.evaluate(a.A,b):c||null}return a.u[b]}function Wl(a){return Sl(a,"display",ud)}function Rl(a){if(null===a.l){var b=Wl(a),c=Sl(a,"position"),d=Sl(a,"float");a.l=Xl(b,c,d,a.D).display===bd}return a.l}function Ql(a){null===a.j&&(a.j=a.F&&Wl(a)!==J);return a.j}function Ul(a,b){var c=null;if(Rl(a)){var d=Sl(a,"break-"+b);d&&(c=d.toString())}return c}function Yl(a){this.g=a;this.b=[];this.pb=this.ib=!0;this.f=[]}
function Zl(a){return a.b[a.b.length-1]}function $l(a){return a.b.every(function(a){return Wl(a)!==J})}Yl.prototype.push=function(a,b,c,d){var e=Zl(this);d&&e&&d.b!==e.b&&this.f.push({ib:this.ib,pb:this.pb});e=d||e.qa;d=this.pb||!!d;var f=$l(this);a=new Pl(this.g,a,b,c,e,d||this.ib,d,f);this.b.push(a);this.ib=Ql(a)?!a.h&&Rl(a):this.ib;this.pb=Ql(a)?!a.h&&d:this.pb;return a};
function am(a,b){if(!b.ib)return b.offset;var c=a.b.length-1,d=a.b[c];d===b&&(c--,d=a.b[c]);for(;0<=c;){if(d.b!==b.b)return b.offset;if(!d.ib||d.D)return d.offset;b=d;d=a.b[--c]}throw Error("No block start offset found!");}
function bm(a,b,c,d,e,f,g,h){this.da=a;this.root=a.root;this.fb=c;this.h=d;this.A=f;this.f=this.root;this.F={};this.Y={};this.G={};this.J=[];this.D=this.S=this.N=null;this.Ba=g;this.Z=new sj(b,d,g,h);this.g=new Jl;this.u=!0;this.la=[];this.Za=e;this.ua=this.ta=!1;this.b=a=hk(a,this.root);this.ca={};this.j=new Yl(d);Ll(this.g,a);d=cm(this,this.root);Ej(this.Z,this.root,d,a);dm(this,d,!1);this.H=!0;switch(this.root.namespaceURI){case "http://www.w3.org/1999/xhtml":case "http://www.gribuser.ru/xml/fictionbook/2.0":this.H=
!1}this.la.push(!0);this.Y={};this.Y["e"+a]=d;this.b++;em(this,-1)}function fm(a,b,c,d){return(b=b[d])&&b.evaluate(a.h)!==c[d]}function gm(a,b,c){for(var d in c){var e=b[d];e?(a.F[d]=e,delete b[d]):(e=c[d])&&(a.F[d]=new V(e,33554432))}}var hm=["column-count","column-width","column-fill"];
function dm(a,b,c){["writing-mode","direction"].forEach(function(d){!b[d]||c&&a.F[d]||(a.F[d]=b[d])});if(!a.ta){var d=fm(a,b,a.A.j,"background-color")?b["background-color"].evaluate(a.h):null,e=fm(a,b,a.A.j,"background-image")?b["background-image"].evaluate(a.h):null;if(d&&d!==td||e&&e!==td)gm(a,b,a.A.j),a.ta=!0}if(!a.ua)for(d=0;d<hm.length;d++)if(fm(a,b,a.A.u,hm[d])){gm(a,b,a.A.u);a.ua=!0;break}if(!c&&(d=b["font-size"])){e=d.evaluate(a.h);d=e.L;switch(e.ka){case "em":case "rem":d*=a.h.u;break;case "ex":d*=
a.h.u*Ob.ex/Ob.em;break;case "%":d*=a.h.u/100;break;default:(e=Ob[e.ka])&&(d*=e)}a.h.Za=d}}function im(a){for(var b=0;!a.H&&(b+=5E3,jm(a,b,0)!=Number.POSITIVE_INFINITY););return a.F}function cm(a,b){if(b.style instanceof CSSStyleDeclaration){var c=b.getAttribute("style");if(c){var d=a.da.url,e=new Sj(a.fb,a.A),c=new rf(c,e);try{fg(new Xf(Mf,c,e,d),Number.POSITIVE_INFINITY,!1,!0,!1,!1)}catch(f){w.b(f,"Style attribute parse error:")}return e.mb}}return{}}
function em(a,b){if(!(b>=a.b)){var c=a.h,d=hk(a.da,a.root);if(b<d){var e=a.l(a.root,!1),f=e["flow-into"],f=f?f.evaluate(c,"flow-into").toString():"body",f=km(a,f,e,a.root,d);!a.j.b.length&&a.j.push(e,d,!0,f)}d=kk(a.da,b);e=ik(a.da,d,0,!1);if(!(e>=a.b))for(;;){if(1!=d.nodeType)e+=d.textContent.length;else{var g=d;if(e!=hk(a.da,g))throw Error("Inconsistent offset");var h=a.l(g,!1);if(f=h["flow-into"])f=f.evaluate(c,"flow-into").toString(),km(a,f,h,g,e);e++}if(e>=a.b)break;f=d.firstChild;if(!f)for(;!(f=
d.nextSibling);)if(d=d.parentNode,d===a.root)return;d=f}}}function lm(a,b){a.N=b;for(var c=0;c<a.J.length;c++)mm(a.N,a.J[c],a.G[a.J[c].b])}
function km(a,b,c,d,e){var f=0,g=Number.POSITIVE_INFINITY,h=!1,l=!1,k=!1,m=c["flow-options"];if(m){var p;a:{if(h=m.evaluate(a.h,"flow-options")){l=new Mg;try{h.fa(l);p=l.b;break a}catch(q){w.b(q,"toSet:")}}p={}}k=p;h=!!k.exclusive;l=!!k["static"];k=!!k.last}(p=c["flow-linger"])&&(g=Og(p.evaluate(a.h,"flow-linger"),Number.POSITIVE_INFINITY));(c=c["flow-priority"])&&(f=Og(c.evaluate(a.h,"flow-priority"),0));c=a.ca[e]||null;p=a.G[b];p||(p=Zl(a.j),p=a.G[b]=new Nk(p?p.qa.b:null));d=new Ok(b,d,e,f,g,h,
l,k,c);a.J.push(d);a.S==b&&(a.S=null);a.N&&mm(a.N,d,p);return d}function nm(a,b,c,d){Vl[b]&&(d=a.G[d].b,(!d.length||d[d.length-1]<c)&&d.push(c));a.ca[c]=Tl(a.ca[c],b)}
function jm(a,b,c){var d=-1;if(b<=a.b&&(d=Nl(a.g,b),d+=c,d<Kl(a.g)))return Ol(a.g,d);if(!a.f)return Number.POSITIVE_INFINITY;for(var e=a.h;;){var f=a.f.firstChild;if(!f)for(;;){if(1==a.f.nodeType){var f=a.Z,g=a.f;if(f.Kb.pop()!==g)throw Error("Invalid call to popElement");f.Mb.pop();f.sa.pop();f.Lb.pop();f.Jb.pop();Ij(f);Cj(f);a.u=a.la.pop();var f=a.j,h=a.b,l=g=f.b.pop(),k=f.ib,m=f.pb;if(Ql(l)){var p=l.style._pseudos;p&&p.after&&(h=new Pl(l.A,p.after,h,!1,l.qa,k,m,!0),k=Sl(h,"content"),Hl(k)&&(l.f=
h))}f.pb&&g.f&&(l=Ul(g.f,"before"),g.qa.g=Tl(g.qa.g,l));if(l=Zl(f))l.b===g.b?Ql(g)&&(f.ib=f.pb=!1):(l=f.f.pop(),f.ib=l.ib,f.pb=l.pb);f=null;g.f&&(f=Ul(g.f,"before"),nm(a,f,g.f.ib?am(a.j,g):g.f.offset,g.b),f=Ul(g.f,"after"));f=Tl(f,Ul(g,"after"));nm(a,f,a.b,g.b)}if(f=a.f.nextSibling)break;a.f=a.f.parentNode;if(a.f===a.root)return a.f=null,b<a.b&&(0>d&&(d=Nl(a.g,b),d+=c),d<=Kl(a.g))?Ol(a.g,d):Number.POSITIVE_INFINITY}a.f=f;if(1!=a.f.nodeType)a.b+=a.f.textContent.length,f=a.j,g=a.f,l=Zl(f),(f.ib||f.pb)&&
Ql(l)&&(l=Sl(l,"white-space",Dd).toString(),Mk(g,Lk(l))||(f.ib=!1,f.pb=!1)),a.u?Ll(a.g,a.b):Ml(a.g,a.b);else{g=a.f;f=cm(a,g);a.la.push(a.u);Ej(a.Z,g,f,a.b);(l=g.getAttribute("id")||g.getAttributeNS("http://www.w3.org/XML/1998/namespace","id"))&&l===a.D&&(a.D=null);a.H||"body"!=g.localName||g.parentNode!=a.root||(dm(a,f,!0),a.H=!0);(l=f["flow-into"])?(l=l.evaluate(e,"flow-into").toString(),h=km(a,l,f,g,a.b),a.u=!!a.Za[l],g=a.j.push(f,a.b,g===a.root,h)):g=a.j.push(f,a.b,g===a.root);l=am(a.j,g);nm(a,
g.g,l,g.b);g.h&&(h=Ul(g.h,"after"),nm(a,h,g.h.ib?l:g.offset,g.b));a.u&&Wl(g)===J&&(a.u=!1);if(hk(a.da,a.f)!=a.b)throw Error("Inconsistent offset");a.Y["e"+a.b]=f;a.b++;a.u?Ll(a.g,a.b):Ml(a.g,a.b);if(b<a.b&&(0>d&&(d=Nl(a.g,b),d+=c),d<=Kl(a.g)))return Ol(a.g,d)}}}bm.prototype.l=function(a,b){var c=hk(this.da,a),d="e"+c;b&&(c=ik(this.da,a,0,!0));this.b<=c&&jm(this,c,0);return this.Y[d]};bm.prototype.sa=function(){};var om={"font-style":Dd,"font-variant":Dd,"font-weight":Dd},pm="OTTO"+(new Date).valueOf(),qm=1;function rm(a,b){var c={},d;for(d in a)c[d]=a[d].evaluate(b,d);for(var e in om)c[e]||(c[e]=om[e]);return c}function sm(a){a=this.Ec=a;var b=new Ra,c;for(c in om)b.append(" "),b.append(a[c].toString());this.f=b.toString();this.src=this.Ec.src?this.Ec.src.toString():null;this.g=[];this.h=[];this.b=(c=this.Ec["font-family"])?c.stringValue():null}
function tm(a,b,c){var d=new Ra;d.append("@font-face {\n  font-family: ");d.append(a.b);d.append(";\n  ");for(var e in om)d.append(e),d.append(": "),a.Ec[e].$a(d,!0),d.append(";\n  ");c?(d.append('src: url("'),b=(window.URL||window.webkitURL).createObjectURL(c),d.append(b),a.g.push(b),a.h.push(c),d.append('")')):(d.append("src: "),d.append(b));d.append(";\n}\n");return d.toString()}function um(a){this.f=a;this.b={}}
function vm(a,b){if(b instanceof Ic){for(var c=[],d=t(b.values),e=d.next();!e.done;e=d.next()){var e=e.value,f=a.b[e.stringValue()];f&&c.push(E(f));c.push(e)}return new Ic(c)}return(c=a.b[b.stringValue()])?new Ic([E(c),b]):b}function wm(a,b){this.b=a;this.body=b;this.f={};this.g=0}function xm(a,b,c){b=b.b;var d=c.b[b];if(d)return d;d="Fnt_"+ ++a.g;return c.b[b]=d}
function ym(a,b,c,d){var e=L("initFont"),f=b.src,g={},h;for(h in om)g[h]=b.Ec[h];d=xm(a,b,d);g["font-family"]=E(d);var l=new sm(g),k=a.body.ownerDocument.createElement("span");k.textContent="M";var m=(new Date).valueOf()+1E3;b=a.b.ownerDocument.createElement("style");h=pm+qm++;b.textContent=tm(l,"",wf([h]));a.b.appendChild(b);a.body.appendChild(k);k.style.visibility="hidden";k.style.fontFamily=d;for(var p in om)x(k,p,g[p].toString());var g=k.getBoundingClientRect(),q=g.right-g.left,r=g.bottom-g.top;
b.textContent=tm(l,f,c);w.g("Starting to load font:",f);var z=!1;Ee(function(){var a=k.getBoundingClientRect(),b=a.bottom-a.top;return q!=a.right-a.left||r!=b?(z=!0,M(!1)):(new Date).valueOf()>m?M(!1):De(10)}).then(function(){z?w.g("Loaded font:",f):w.b("Failed to load font:",f);a.body.removeChild(k);O(e,l)});return e.result()}
function zm(a,b,c){var d=b.src,e=a.f[d];e?Ie(e,function(a){if(a.f==b.f){var e=b.b,f=c.b[e];a=a.b;if(f){if(f!=a)throw Error("E_FONT_FAMILY_INCONSISTENT "+b.b);}else c.b[e]=a;w.b("Found already-loaded font:",d)}else w.b("E_FONT_FACE_INCOMPATIBLE",b.src)}):(e=new He(function(){var e=L("loadFont"),g=c.f?c.f(d):null;g?vf(d,"blob").then(function(d){d.vd?g(d.vd).then(function(d){ym(a,b,d,c).Ea(e)}):O(e,null)}):ym(a,b,null,c).Ea(e);return e.result()},"loadFont "+d),a.f[d]=e,e.start());return e}
function Am(a,b,c){var d=[];b=t(b);for(var e=b.next();!e.done;e=b.next())e=e.value,e.src&&e.b?d.push(zm(a,e,c)):w.b("E_FONT_FACE_INVALID");return Je(d)};ge("SIMPLE_PROPERTY",function(a){var b=a.name,c=a.value;switch(b){case "page-break-before":case "page-break-after":case "page-break-inside":return{name:b.replace(/^page-/,""),value:c===Yc?Gd:c,important:a.important};default:return a}});var Vl={page:!0,left:!0,right:!0,recto:!0,verso:!0,column:!0,region:!0},Bm={avoid:!0,"avoid-page":!0,"avoid-column":!0,"avoid-region":!0};
function Tl(a,b){if(a)if(b){var c=!!Vl[a],d=!!Vl[b];if(c&&d)switch(b){case "column":return a;case "region":return"column"===a?b:a;default:return b}else return d?b:c?a:Bm[b]?b:Bm[a]?a:b}else return a;else return b}function Cm(a){switch(a){case "left":case "right":case "recto":case "verso":return a;default:return"any"}};function Dm(){}n=Dm.prototype;n.Tf=function(a){return{w:a,Gd:!1,Vb:!1}};n.uf=function(){};n.Df=function(){};n.kg=function(){};n.Cf=function(){};n.Cd=function(){};n.tc=function(){};function Em(a,b){this.b=a;this.f=b}
function Fm(a,b){var c=a.b,d=c.Tf(b),e=L("LayoutIterator");Fe(function(b){for(var e;d.w;){e=d.w.B?1!==d.w.B.nodeType?Mk(d.w.B,d.w.uc)?void 0:d.w.K?c.Df(d):c.uf(d):d.w.ya?d.w.K?c.Cf(d):c.kg(d):d.w.K?c.tc(d):c.Cd(d):void 0;e=(e&&e.Xa()?e:M(!0)).ea(function(){return d.Vb?M(null):Gm(a.f,d.w,d.Gd)});if(e.Xa()){e.then(function(a){d.Vb?Q(b):(d.w=a,P(b))});return}if(d.Vb){Q(b);return}d.w=e.get()}Q(b)}).then(function(){O(e,d.w)});return e.result()}function Hm(a){this.gc=a}v(Hm,Dm);n=Hm.prototype;n.lg=function(){};
n.Nf=function(){};n.Tf=function(a){return{w:a,Gd:!!this.gc&&a.K,Vb:!1,gc:this.gc,dd:null,Je:!1,Wf:[],ld:null}};n.uf=function(a){a.Je=!1};n.Cd=function(a){a.Wf.push(Zk(a.w));a.dd=Tl(a.dd,a.w.g);a.Je=!0;return this.lg(a)};n.tc=function(a){var b;a.Je?(b=(b=void 0,M(!0)),b=b.ea(function(){a.Vb||(a.Wf=[],a.gc=!1,a.Gd=!1,a.dd=null);return M(!0)})):b=(b=this.Nf(a))&&b.Xa()?b:M(!0);return b.ea(function(){a.Vb||(a.Je=!1,a.ld=Zk(a.w),a.dd=Tl(a.dd,a.w.G));return M(!0)})};
function Im(a,b,c){this.tf=[];this.za=Object.create(a);this.za.element=b;this.za.j=a.j.clone();this.za.u=!1;this.za.kf=c.C;this.za.Md=a;a=Jm(this.za,c);this.za.la-=a;var d=this;this.za.Lc=function(a){return Km.prototype.Lc.call(this,a).ea(function(a){d.tf.push(Zk(a));return M(a)})}}function Lm(a,b){return Mm(a.za,b,!0)}Im.prototype.ec=function(a){var b=this.za.ec();if(a){a=Zk(this.tf[0]);var c=new Nm(a,null,a.xa,0);c.f(this.za,0);if(!b.w)return{Eb:c,w:a}}return b};
Im.prototype.Na=function(a,b,c){return this.za.Na(a,b,c)};function Om(){this.u=this.h=null}function Pm(a,b,c){a.eg(b,c);return Qm(a,b,c)}function Qm(a,b,c){var d=L("vivliostyle.layoututil.AbstractLayoutRetryer.tryLayout");a.yf(b,c);var e=a.qf(b);e.b(b,c).then(function(a){var f=e.f(a,c);(f=e.g(a,this.f,c,f))?O(d,a):(this.Jd(this.f),this.ie(b,c),Qm(this,this.f,c).Ea(d))}.bind(a));return d.result()}Om.prototype.eg=function(){};
Om.prototype.Jd=function(a){a=a.B||a.parent.B;for(var b;b=a.lastChild;)a.removeChild(b);for(;b=a.nextSibling;)b.parentNode.removeChild(b)};Om.prototype.yf=function(a,b){this.f=Zk(a);this.h=[].concat(b.N);this.D=[].concat(b.A);a.C&&(this.u=a.C.Ye())};Om.prototype.ie=function(a,b){b.N=this.h;b.A=this.D;a.C&&a.C.Xe(this.u)};function Rm(a,b,c,d){d=d[b];if(!d)throw Error("unknown writing-mode: "+b);b=d[c||"ltr"];if(!b)throw Error("unknown direction: "+c);c=t(b);for(b=c.next();!b.done;b=c.next())if(b=b.value,b=a.replace(b.h,b.b),b!==a)return b;return a}function Sm(a){var b=Tm,c={};Object.keys(b).forEach(function(d){var e=c[d]={},f=b[d];Object.keys(f).forEach(function(b){e[b]=f[b].map(function(b){return{h:new RegExp("(-?)"+(a?b.ga:b.ha)+"(-?)"),b:"$1"+(a?b.ha:b.ga)+"$2"}})})});return c}
var Tm={"horizontal-tb":{ltr:[{ga:"inline-start",ha:"left"},{ga:"inline-end",ha:"right"},{ga:"block-start",ha:"top"},{ga:"block-end",ha:"bottom"},{ga:"inline-size",ha:"width"},{ga:"block-size",ha:"height"}],rtl:[{ga:"inline-start",ha:"right"},{ga:"inline-end",ha:"left"},{ga:"block-start",ha:"top"},{ga:"block-end",ha:"bottom"},{ga:"inline-size",ha:"width"},{ga:"block-size",ha:"height"}]},"vertical-rl":{ltr:[{ga:"inline-start",ha:"top"},{ga:"inline-end",ha:"bottom"},{ga:"block-start",ha:"right"},{ga:"block-end",
ha:"left"},{ga:"inline-size",ha:"height"},{ga:"block-size",ha:"width"}],rtl:[{ga:"inline-start",ha:"bottom"},{ga:"inline-end",ha:"top"},{ga:"block-start",ha:"right"},{ga:"block-end",ha:"left"},{ga:"inline-size",ha:"height"},{ga:"block-size",ha:"width"}]},"vertical-lr":{ltr:[{ga:"inline-start",ha:"top"},{ga:"inline-end",ha:"bottom"},{ga:"block-start",ha:"left"},{ga:"block-end",ha:"right"},{ga:"inline-size",ha:"height"},{ga:"block-size",ha:"width"}],rtl:[{ga:"inline-start",ha:"bottom"},{ga:"inline-end",
ha:"top"},{ga:"block-start",ha:"left"},{ga:"block-end",ha:"right"},{ga:"inline-size",ha:"height"},{ga:"block-size",ha:"width"}]}},Um=Sm(!0),Vm=Sm(!1);var bl="inline";function Wm(a){switch(a){case "inline":return bl;case "column":return"column";case "region":return"region";case "page":return"page";default:throw Error("Unknown float-reference: "+a);}}function Xm(a){switch(a){case bl:return!1;case "column":case "region":case "page":return!0;default:throw Error("Unknown float-reference: "+a);}}function Ym(a,b,c,d,e,f){this.b=a;this.W=b;this.Ca=c;this.h=d;this.f=e;this.j=f;this.id=this.order=null}
Ym.prototype.Ia=function(){if(null===this.order)throw Error("The page float is not yet added");return this.order};function Zm(a){if(!a.id)throw Error("The page float is not yet added");return a.id}Ym.prototype.df=function(){return!1};function $m(){this.b=[];this.f=0}$m.prototype.nf=function(){return this.f++};
$m.prototype.le=function(a){if(0<=this.b.findIndex(function(b){return Uk(b.b,a.b)}))throw Error("A page float with the same source node is already registered");var b=a.order=this.nf();a.id="pf"+b;this.b.push(a)};$m.prototype.cf=function(a){var b=this.b.findIndex(function(b){return Uk(b.b,a)});return 0<=b?this.b[b]:null};function an(a,b,c,d,e){this.W=a;this.Ca=b;this.Ob=c;this.b=d;this.g=e}function bn(a,b){return a.Ob.some(function(a){return a.ja===b})}
an.prototype.Ia=function(){var a=this.Ob.map(function(a){return a.ja});return Math.min.apply(null,a.map(function(a){return a.Ia()}))};an.prototype.f=function(a){return this.Ia()<a.Ia()};function cn(a,b){this.ja=a;this.b=b}
function dn(a,b,c,d,e,f,g){(this.parent=a)&&a.children.push(this);this.children=[];this.W=b;this.I=c;this.h=d;this.H=e;this.F=f||a&&a.F||sd;this.direction=g||a&&a.direction||Cd;this.Qc=!1;this.u=a?a.u:new $m;this.A=[];this.b=[];this.j=[];this.l={};this.f=[];a:{b=this;for(a=this.parent;a;){if(b=en(a,b,this.W,this.h,this.H)){a=b;break a}b=a;a=a.parent}a=null}this.G=a?[].concat(a.f):[];this.D=[];this.g=!1}function fn(a,b){if(!a.parent)throw Error("No PageFloatLayoutContext for "+b);return a.parent}
function en(a,b,c,d,e){b=a.children.indexOf(b);0>b&&(b=a.children.length);for(--b;0<=b;b--){var f=a.children[b];if(f.W===c&&f.h===d&&Uk(f.H,e)||(f=en(f,null,c,d,e)))return f}return null}function gn(a,b){return b&&b!==a.W?gn(fn(a,b),b):a.I}function hn(a,b){a.I=b;jn(a)}dn.prototype.le=function(a){this.u.le(a)};function kn(a,b){return b===a.W?a:kn(fn(a,b),b)}dn.prototype.cf=function(a){return this.u.cf(a)};
function ln(a,b){var c=Zm(b),d=b.W;d===a.W?a.A.includes(c)||(a.A.push(c),mn(b).og(b,a)):ln(fn(a,d),b)}function nn(a,b){var c=Zm(b),d=b.W;return d===a.W?a.A.includes(c):nn(fn(a,d),b)}function on(a,b,c){var d=b.W;d!==a.W?on(fn(a,d),b,c):a.b.includes(b)||(a.b.push(b),a.b.sort(function(a,b){return a.Ia()-b.Ia()}));c||pn(a)}function qn(a,b,c){var d=b.W;d!==a.W?qn(fn(a,d),b,c):(b=a.b.indexOf(b),0<=b&&(b=a.b.splice(b,1)[0],(b=b.b&&b.b.element)&&b.parentNode&&b.parentNode.removeChild(b),c||pn(a)))}
function rn(a,b){if(b.W!==a.W)return rn(fn(a,b.W),b);var c=a.b.findIndex(function(a){return bn(a,b)});return 0<=c?a.b[c]:null}function sn(a,b){return 0<a.b.length&&(!b||a.b.some(b))?!0:a.parent?sn(a.parent,b):!1}function tn(a,b){return sn(a,function(a){return a.g&&a.Ob[0].ja.f===b})}function un(a,b,c){a.l[Zm(b)]=c}function vn(a){var b=Object.assign({},a.l);return a.children.reduce(function(a,b){return Object.assign(a,vn(b))},b)}
function wn(a,b){if(xn(a).some(function(a){return Zm(a.ja)===b}))return!0;var c=vn(a)[b];return c?a.I&&a.I.element?a.I.element.contains(c):!1:!1}function yn(a,b){var c=b.ja;if(c.W===a.W){var d=a.f.findIndex(function(a){return a.ja===c});0<=d?a.f.splice(d,1,b):a.f.push(b)}else yn(fn(a,c.W),b)}function zn(a,b,c){if(!c&&b.W!==a.W)return zn(fn(a,b.W),b,!1);var d=b.Ia();return a.f.some(function(a){return a.ja.Ia()<d&&!b.df(a.ja)})?!0:a.parent?zn(a.parent,b,!0):!1}
function xn(a,b){b=b||a.h;var c=a.G.filter(function(a){return!b||a.ja.f===b});a.parent&&(c=xn(a.parent,b).concat(c));return c.sort(function(a,b){return a.ja.Ia()-b.ja.Ia()})}function An(a,b){b=b||a.h;var c=a.f.filter(function(a){return!b||a.ja.f===b});return a.parent?An(a.parent,b).concat(c):c}function Bn(a){for(var b=[],c=[],d=a.children.length-1;0<=d;d--){var e=a.children[d];c.includes(e.h)||(c.push(e.h),b=b.concat(e.f.map(function(a){return a.ja})),b=b.concat(Bn(e)))}return b}
function Cn(a){if(Dn(a))return!0;for(var b=a.b.length-1;0<=b;b--){var c=a.b[b],d;a:{d=a;for(var e=c.Ob.length-1;0<=e;e--){var f=c.Ob[e].ja;if(!wn(d,Zm(f))){d=f;break a}}d=null}if(d){if(a.g)pn(a);else if(qn(a,c),ln(a,d),c=En(a,c.Ca),"block-end"===c||"inline-end"===c)for(b=0;b<a.b.length;)d=a.b[b],En(a,d.Ca)===c?qn(a,d):b++;return!0}}return"region"===a.W&&a.parent.g?Cn(a.parent):!1}
function Dn(a){var b=Bn(a),c=a.b.reduce(function(a,b){return a.concat(b.Ob.map(function(a){return a.ja}))},[]);c.sort(function(a,b){return b.Ia()-a.Ia()});for(var d={},c=t(c),e=c.next();!e.done;d={ja:d.ja,order:d.order},e=c.next())if(d.ja=e.value,d.order=d.ja.Ia(),b.some(function(a){return function(b){return!a.ja.df(b)&&a.order>b.Ia()}}(d)))return a.g?pn(a):(ln(a,d.ja),b=rn(a,d.ja),qn(a,b)),!0;return!1}
function Fn(a){if(!Cn(a)){for(var b=a.f.length-1;0<=b;b--)if(!wn(a,Zm(a.f[b].ja))){if(a.g){pn(a);return}a.f.splice(b,1)}a.G.forEach(function(a){0<=this.f.findIndex(function(b){return b?a===b?!0:a.ja===b.ja&&Uk(a.b,b.b):!1})||this.b.some(function(b){return bn(b,a.ja)})||this.f.push(a)},a)}}function Gn(a,b){return!!a.I&&!!b.I&&a.I.element===b.I.element}
function pn(a){a.Qc=!0;a.g||(a.I&&(a.children.forEach(function(a){Gn(this,a)&&a.b.forEach(function(a){(a=a.b.element)&&a.parentNode&&a.parentNode.removeChild(a)})},a),Cl(a.I)),a.children.forEach(function(a){a.D.splice(0)}),a.children.splice(0),Object.keys(a.l).forEach(function(a){delete this.l[a]},a))}function Hn(a){a=a.children.splice(0);a.forEach(function(a){a.b.forEach(function(a){(a=a.b.element)&&a.parentNode&&a.parentNode.removeChild(a)})});return a}
function In(a,b){b.forEach(function(a){this.children.push(a);jn(a)},a)}function Jn(a){return a.Qc||!!a.parent&&Jn(a.parent)}function En(a,b){return Rm(b,a.F.toString(),a.direction.toString()||null,Vm)}function Kn(a,b){var c=b.W;if(c!==a.W)Kn(fn(a,c),b);else if(c=En(a,b.Ca),"block-end"===c||"snap-block"===c||"inline-end"===c)for(var d=0;d<a.b.length;){var e=a.b[d],f=En(a,e.Ca);(f===c||"snap-block"===c&&"block-end"===f)&&e.f(b)?(a.j.push(e),a.b.splice(d,1)):d++}}
function Ln(a,b){b!==a.W?Ln(fn(a,b),b):(a.j.forEach(function(a){on(this,a,!0)},a),a.j.splice(0))}function Mn(a,b){b!==a.W?Mn(fn(a,b),b):a.j.splice(0)}function Nn(a,b){return b===a.W?a.j.concat().sort(function(a,b){return b.Ia()-a.Ia()}):Nn(fn(a,b),b)}
function On(a,b,c,d,e){var f=En(a,b);b=Rm(b,a.F.toString(),a.direction.toString()||null,Um);a:{var g=Pn(a,c,d,e);switch(f){case "block-start":f=a.I.b?g.right:g.top;break a;case "block-end":f=a.I.b?g.left:g.bottom;break a;case "inline-start":f=a.I.b?g.top:g.left;break a;case "inline-end":f=a.I.b?g.bottom:g.right;break a;default:throw Error("Unknown logical side: "+f);}}if(a.parent&&a.parent.I)switch(a=On(a.parent,b,c,d,e),b){case "top":return Math.max(f,a);case "left":return Math.max(f,a);case "bottom":return Math.min(f,
a);case "right":return Math.min(f,a);default:sa("Should be unreachable")}return f}
function Pn(a,b,c,d){function e(a,d,e){if("%"===a.ka)a=e*a.L/100;else{e=a.L;var f=a.ka,g;b:switch(f.toLowerCase()){case "em":case "ex":case "rem":g=!0;break b;default:g=!1}if(g){for(;d&&1!==d.nodeType;)d=d.parentNode;d=parseFloat(Qn(c,d)["font-size"]);a=hi(a,d,b.b).L}else a=(d=Sb(b.b,f,!1))?e*d:a}return a}var f=a.I.F,g=a.I.G,h=Dl(a.I),l={top:h.T-g,left:h.V-f,bottom:h.R-g,right:h.U-f,Oc:0,Nc:0},k=a.b;0<k.length&&(l=k.reduce(function(b,c){if(d&&!d(c,a))return b;var f=En(a,c.Ca),g=c.b,k=c.Ob[0].ja.j,
l=b.top,m=b.left,p=b.bottom,I=b.right,K=b.Oc,H=b.Nc;switch(f){case "inline-start":g.b?l=Math.max(l,g.top+g.height):m=Math.max(m,g.left+g.width);break;case "block-start":g.b?(k&&g.left<I&&(K=e(k,g.Jb[0],h.U-h.V)),I=Math.min(I,g.left)):(k&&g.top+g.height>l&&(K=e(k,g.Jb[0],h.R-h.T)),l=Math.max(l,g.top+g.height));break;case "inline-end":g.b?p=Math.min(p,g.top):I=Math.min(I,g.left);break;case "block-end":g.b?(k&&g.left+g.width>m&&(H=e(k,g.Jb[0],h.U-h.V)),m=Math.max(m,g.left+g.width)):(k&&g.top<p&&(H=e(k,
g.Jb[0],h.R-h.T)),p=Math.min(p,g.top));break;default:throw Error("Unknown logical float side: "+f);}return{top:l,left:m,bottom:p,right:I,Oc:K,Nc:H}},l));l.left+=f;l.right+=f;l.top+=g;l.bottom+=g;return l}
function Rn(a,b,c,d,e,f,g,h){function l(a,c){var d=a(b.Cb,c);return d?(b.b&&(d=new og(-d.R,d.V,-d.T,d.U)),m=b.b?Math.min(m,d.U):Math.max(m,d.T),p=b.b?Math.max(p,d.V):Math.min(p,d.R),!0):g}if(c!==a.W)return Rn(fn(a,c),b,c,d,e,f,g,h);var k=En(a,d);if("snap-block"===k){if(!h["block-start"]&&!h["block-end"])return null}else if(!h[k])return null;var m=On(a,"block-start",b.j,b.f),p=On(a,"block-end",b.j,b.f);c=On(a,"inline-start",b.j,b.f);var q=On(a,"inline-end",b.j,b.f),r=b.b?b.F:b.G,z=b.b?b.G:b.F,m=b.b?
Math.min(m,b.left+ul(b)+b.width+vl(b)+r):Math.max(m,b.top+r),p=b.b?Math.max(p,b.left+r):Math.min(p,b.top+sl(b)+b.height+tl(b)+r),u;if(f){a=b.b?Fg(new og(p,c,m,q)):new og(c,m,q,p);if(("block-start"===k||"snap-block"===k||"inline-start"===k)&&!l(Kg,a)||("block-end"===k||"snap-block"===k||"inline-end"===k)&&!l(Lg,a))return null;u=(p-m)*wl(b);f=u-(b.b?vl(b):sl(b))-(b.b?ul(b):tl(b));e=q-c;a=e-(b.b?sl(b):ul(b))-(b.b?tl(b):vl(b));if(!g&&(0>=f||0>=a))return null}else{f=b.h;u=f+(b.b?vl(b):sl(b))+(b.b?ul(b):
tl(b));var A=(p-m)*wl(b);if("snap-block"===k&&(null===e?k="block-start":(k=Dl(a.I),k=wl(a.I)*(e-(a.I.b?k.U:k.T))<=wl(a.I)*((a.I.b?k.V:k.R)-e-u)?"block-start":"block-end"),!h[k]))if(h["block-end"])k="block-end";else return null;if(!g&&A<u)return null;a="inline-start"===k||"inline-end"===k?Sn(b.f,b.element,[Tn])[Tn]:b.ve?Un(b):b.b?b.height:b.width;e=a+(b.b?sl(b):ul(b))+(b.b?tl(b):vl(b));if(!g&&q-c<e)return null}m-=r;p-=r;c-=z;q-=z;switch(k){case "inline-start":case "block-start":case "snap-block":Bl(b,
c,a);Al(b,m,f);break;case "inline-end":case "block-end":Bl(b,q-e,a);Al(b,p-u*wl(b),f);break;default:throw Error("unknown float direction: "+d);}return k}function Vn(a){var b=a.b.map(function(a){return El(a.b,null,null)});return a.parent?Vn(a.parent).concat(b):b}function jn(a){var b=a.I.element&&a.I.element.parentNode;b&&a.b.forEach(function(a){b.appendChild(a.b.element)})}
function Wn(a){var b=gn(a).b;return a.b.reduce(function(a,d){var c=Fl(d.b);return b?Math.min(a,c.V):Math.max(a,c.R)},b?Infinity:0)}function Xn(a){var b=gn(a).b;return a.b.filter(function(a){return"block-end"===a.Ca}).reduce(function(a,d){var c=Fl(d.b);return b?Math.max(a,c.U):Math.min(a,c.T)},b?0:Infinity)}
function Yn(a,b){function c(a){return function(b){return wn(a,Zm(b.ja))}}function d(a,b){return a.Ob.some(c(b))}for(var e=Dl(b),e=b.b?e.V:e.R,f=a;f;){if(f.f.some(c(f)))return e;f=f.parent}f=On(a,"block-start",b.j,b.f,d);return On(a,"block-end",b.j,b.f,d)*wl(b)<e*wl(b)?e:f}
function Zn(a,b,c,d){function e(a){return function(b){return b.Ca===a&&b.Ia()<l}}function f(a,b){return a.children.some(function(a){return a.b.some(e(b))||f(a,b)})}function g(a,b){var c=a.parent;return!!c&&(c.b.some(e(b))||g(c,b))}if(b.W!==a.W)return Zn(fn(a,b.W),b,c,d);var h={"block-start":!0,"block-end":!0,"inline-start":!0,"inline-end":!0};if(!d)return h;c=En(a,c);d=En(a,d);d="all"===d?["block-start","block-end","inline-start","inline-end"]:"both"===d?["inline-start","inline-end"]:"same"===d?"snap-block"===
c?["block-start","block-end"]:[c]:[d];var l=b.Ia();d.forEach(function(a){switch(a){case "block-start":case "inline-start":h[a]=!f(this,a);break;case "block-end":case "inline-end":h[a]=!g(this,a);break;default:throw Error("Unexpected side: "+a);}},a);return h}function $n(a){return(a.parent?$n(a.parent):[]).concat(a.D)}function ao(a,b,c){c===a.W?a.D.push(b):ao(fn(a,c),b,c)}
function bo(a,b){for(var c=b.j,d=b.f,e=a,f=null;e&&e.I;){var g=Pn(e,c,d);f?b.b?(g.right<f.right&&(f.right=g.right,f.Oc=g.Oc),g.left>f.left&&(f.left=g.left,f.Nc=g.Nc)):(g.top>f.top&&(f.top=g.top,f.Oc=g.Oc),g.bottom<f.bottom&&(f.bottom=g.bottom,f.Nc=g.Nc)):f=g;e=e.parent}return(b.b?f.right-f.left:f.bottom-f.top)<=Math.max(f.Oc,f.Nc)}function co(a){var b=gn(a).b;return a.b.length?Math.max.apply(null,a.b.map(function(a){a=a.b;return b?a.width:a.height})):0}var eo=[];
function fo(a){for(var b=eo.length-1;0<=b;b--){var c=eo[b];if(c.Ff(a))return c}throw Error("No PageFloatLayoutStrategy found for "+a);}function mn(a){for(var b=eo.length-1;0<=b;b--){var c=eo[b];if(c.Ef(a))return c}throw Error("No PageFloatLayoutStrategy found for "+a);}function go(){}n=go.prototype;n.Ff=function(a){return Xm(a.W)};n.Ef=function(){return!0};n.Lf=function(a,b,c){var d=a.W,e=a.Ca,f=fl(a);return ho(c,d,a.ca,a).ea(function(c){d=c;c=new Ym(f,d,e,a.l,b.h,a.N);b.le(c);return M(c)})};
n.Mf=function(a,b,c,d){return new an(a[0].ja.W,b,a,c,d)};n.xf=function(a,b){return rn(b,a)};n.Bf=function(){};n.og=function(){};eo.push(new go);var io={img:!0,svg:!0,audio:!0,video:!0};
function jo(a,b,c,d){var e=a.B;if(!e)return NaN;if(1==e.nodeType){if(a.K||!a.ya){var f=Kk(b,e);if(f.right>=f.left&&f.bottom>=f.top)return a.K?d?f.left:f.bottom:d?f.right:f.top}return NaN}var f=NaN,g=e.ownerDocument.createRange(),h=e.textContent.length;if(!h)return NaN;a.K&&(c+=h);c>=h&&(c=h-1);g.setStart(e,c);g.setEnd(e,c+1);a=ko(b,g);if(c=d){c=document.body;if(null==hb){var l=c.ownerDocument,g=l.createElement("div");g.style.position="absolute";g.style.top="0px";g.style.left="0px";g.style.width="100px";
g.style.height="100px";g.style.overflow="hidden";g.style.lineHeight="16px";g.style.fontSize="16px";x(g,"writing-mode","vertical-rl");c.appendChild(g);h=l.createTextNode("a a a a a a a a a a a a a a a a");g.appendChild(h);l=l.createRange();l.setStart(h,0);l.setEnd(h,1);h=l.getBoundingClientRect();hb=10>h.right-h.left;c.removeChild(g)}c=hb}if(c){c=e.ownerDocument.createRange();c.setStart(e,0);c.setEnd(e,e.textContent.length);b=ko(b,c);e=[];a=t(a);for(c=a.next();!c.done;c=a.next()){c=c.value;for(g=0;g<
b.length;g++)if(h=b[g],c.top>=h.top&&c.bottom<=h.bottom&&1>Math.abs(c.left-h.left)){e.push({top:c.top,left:h.left,bottom:c.bottom,right:h.right});break}g==b.length&&(w.b("Could not fix character box"),e.push(c))}a=e}b=0;e=t(a);for(a=e.next();!a.done;a=e.next())a=a.value,c=d?a.bottom-a.top:a.right-a.left,a.right>a.left&&a.bottom>a.top&&(isNaN(f)||c>b)&&(f=d?a.left:a.bottom,b=c);return f}
function lo(a){for(var b=he("RESOLVE_LAYOUT_PROCESSOR"),c=0;c<b.length;c++){var d=b[c](a);if(d)return d}throw Error("No processor found for a formatting context: "+a.We());}function mo(a){this.Kd=a}mo.prototype.b=function(a){return this.Kd.every(function(b){return b.b(a)})};function no(){}no.prototype.u=function(){};no.prototype.g=function(){return null};function oo(a,b){return{current:b.reduce(function(b,d){return b+d.b(a)},0),He:b.reduce(function(b,d){return b+d.F(a)},0)}}
function po(a,b){this.h=a;this.Tc=b;this.j=!1;this.l=null}v(po,no);po.prototype.f=function(a,b){if(b<this.b())return null;this.j||(this.l=qo(a,this,0<b),this.j=!0);return this.l};po.prototype.b=function(){return this.Tc};po.prototype.g=function(){return this.j?this.l:this.h[this.h.length-1]};function Nm(a,b,c,d){this.position=a;this.F=b;this.A=this.j=c;this.D=d;this.h=!1;this.xc=0}v(Nm,no);
Nm.prototype.f=function(a,b){if(!this.h){var c=Jm(a,this.position);this.xc=jo(this.position,a.f,0,a.b)+c;this.h=!0}var c=this.xc,d=oo(this.g(),ro(a));this.A=so(a,c+(a.b?-1:1)*d.He);this.j=this.position.xa=so(a,c+(a.b?-1:1)*d.current);b<this.b()?c=null:(a.h=this.D+to(a,this),c=this.position);return c};
Nm.prototype.b=function(){if(!this.h)throw Error("EdgeBreakPosition.prototype.updateEdge not called");var a;if((a=this.g())&&a.parent){var b=uo(a.parent);a=b?(b=b.b)?a&&b.g===a.M:!1:!1}else a=!1;a=a&&!this.A;return(Bm[this.F]?1:0)+(this.j&&!a?3:0)+(this.position.parent?this.position.parent.j:0)};Nm.prototype.g=function(){return this.position};
function vo(a){for(var b=1;b<a.length;b++){var c=a[b-1],d=a[b];c===d?w.b("validateCheckPoints: duplicate entry"):c.Ma>=d.Ma?w.b("validateCheckPoints: incorrect boxOffset"):c.M==d.M&&(d.K?c.K&&w.b("validateCheckPoints: duplicate after points"):c.K||d.Ma-c.Ma!=d.na-c.na&&w.b("validateCheckPoints: boxOffset inconsistent with offsetInNode"))}}function wo(a){this.parent=a}wo.prototype.We=function(){return"Block formatting context (adapt.layout.BlockFormattingContext)"};wo.prototype.ff=function(a,b){return b};
wo.prototype.Ye=function(){};wo.prototype.Xe=function(){};function Km(a,b,c,d,e){rl.call(this,a);this.j=b;this.f=c;this.Zb=d;this.Ng=a.ownerDocument;this.l=e;hn(e,this);this.kf=null;this.$f=this.gg=!1;this.la=this.sa=this.D=this.fb=this.ua=0;this.Cb=this.dg=this.cg=null;this.Ld=!1;this.g=this.N=null;this.Kb=!0;this.ye=this.Fe=this.Ee=0;this.u=!0;this.xb=null;this.A=[];this.ta=this.Md=null;this.jf=NaN}v(Km,rl);function xo(a,b){return!!b.Ca&&(!a.gg||!!b.parent)}
function so(a,b){return a.b?b<a.la:b>a.la}function yo(a,b){if(a)for(var c;(c=a.lastChild)!=b;)a.removeChild(c)}Km.prototype.Lc=function(a){var b=this,c=L("openAllViews"),d=a.pa;zo(b.j,b.element,b.$f);var e=d.length-1,f=null;Ee(function(){for(;0<=e;){f=Xk(d[e],f);e!==d.length-1||f.C||(f.C=b.kf);if(!e){var c=f,h;h=a;h=h.Qa?gl(h.Qa,h.na,1):h.na;c.na=h;f.K=a.K;f.Qa=a.Qa;if(f.K)break}c=Ao(b.j,f,!e&&!f.na);e--;if(c.Xa())return c}return M(!1)}).then(function(){O(c,f)});return c.result()};var Bo=/^[^A-Za-z0-9_\u009E\u009F\u00C0-\u00D6\u00D8-\u00F6\u00F8-\u02AF\u037B-\u037D\u0386\u0388-\u0482\u048A-\u0527]*([A-Za-z0-9_\u00C0-\u00D6\u00D8-\u00F6\u00F8-\u02AF\u037B-\u037D\u0386\u0388-\u0482\u048A-\u0527][^A-Za-z0-9_\u009E\u009F\u00C0-\u00D6\u00D8-\u00F6\u00F8-\u02AF\u037B-\u037D\u0386\u0388-\u0482\u048A-\u0527]*)?/;
function Co(a,b){if(b.f&&b.ya&&!b.K&&!b.f.count&&1!=b.B.nodeType){var c=b.B.textContent.match(Bo);return Do(a.j,b,c[0].length)}return M(b)}
function Eo(a,b,c){var d=!1,e=L("buildViewToNextBlockEdge");Fe(function(e){b.B&&!Fo(b)&&c.push(Zk(b));Co(a,b).then(function(f){f!==b&&(b=f,Fo(b)||c.push(Zk(b)));Go(a,b).then(function(c){if(b=c){if(d||!a.Zb.b(b))d=!0,b=b.modify(),b.xa=!0;xo(a,b)&&!a.b?Ho(a,b).then(function(c){b=c;Jn(a.l)&&(b=null);b?P(e):Q(e)}):b.ya?P(e):Q(e)}else Q(e)})})}).then(function(){O(e,b)});return e.result()}function Go(a,b,c){b=Gm(a.j,b,c);return Io(b,a)}
function Jo(a,b){if(!b.B)return M(b);var c=[],d=b.M,e=L("buildDeepElementView");Fe(function(e){b.B&&b.ya&&!Fo(b)?c.push(Zk(b)):(0<c.length&&Ko(a,b,c),c=[]);Co(a,b).then(function(f){if(f!==b){for(var g=f;g&&g.M!=d;)g=g.parent;if(!g){b=f;Q(e);return}Fo(f)||c.push(Zk(f))}Go(a,f).then(function(c){(b=c)&&b.M!=d?a.Zb.b(b)?P(e):(b=b.modify(),b.xa=!0,a.u?Q(e):P(e)):Q(e)})})}).then(function(){0<c.length&&Ko(a,b,c);O(e,b)});return e.result()}
function Lo(a,b,c,d,e){var f=a.Ng.createElement("div");a.b?(e>=a.height&&(e-=.1),x(f,"height",d+"px"),x(f,"width",e+"px")):(d>=a.width&&(d-=.1),x(f,"width",d+"px"),x(f,"height",e+"px"));x(f,"float",c);x(f,"clear",c);a.element.insertBefore(f,b);return f}function Mo(a){for(var b=a.element.firstChild;b;){var c=b.nextSibling;if(1==b.nodeType){var d=b.style.cssFloat;if("left"==d||"right"==d)a.element.removeChild(b);else break}b=c}}
function No(a){for(var b=a.element.firstChild,c=a.b?a.b?a.ua:a.D:a.b?a.sa:a.ua,d=a.b?a.b?a.fb:a.sa:a.b?a.D:a.fb,e=t(a.Cb),f=e.next();!f.done;f=e.next()){var f=f.value,g=f.R-f.T;f.left=Lo(a,b,"left",f.V-c,g);f.right=Lo(a,b,"right",d-f.U,g)}}
function Oo(a,b,c,d,e){var f;if(b&&Po(b.B))return NaN;if(b&&b.K&&!b.ya&&(f=jo(b,a.f,0,a.b),!isNaN(f)))return f;b=c[d];for(e-=b.Ma;;){f=jo(b,a.f,e,a.b);if(!isNaN(f))return f;if(0<e)e--;else{d--;if(0>d)return a.D;b=c[d];1!=b.B.nodeType&&(e=b.B.textContent.length)}}}function X(a){return"number"==typeof a?a:(a=a.match(/^(-?[0-9]*(\.[0-9]*)?)px$/))?parseFloat(a[0]):0}
function Qo(a,b){var c=Qn(a.f,b),d=new qg;c&&(d.left=X(c.marginLeft),d.top=X(c.marginTop),d.right=X(c.marginRight),d.bottom=X(c.marginBottom));return d}function Ro(a,b){var c=Qn(a.f,b),d=new qg;c&&(d.left=X(c.borderLeftWidth)+X(c.paddingLeft),d.top=X(c.borderTopWidth)+X(c.paddingTop),d.right=X(c.borderRightWidth)+X(c.paddingRight),d.bottom=X(c.borderBottomWidth)+X(c.paddingBottom));return d}
function So(a,b){var c=L("layoutFloat"),d=b.B,e=b.Ca;x(d,"float","none");x(d,"display","inline-block");x(d,"vertical-align","top");Jo(a,b).then(function(f){for(var g=Kk(a.f,d),h=Qo(a,d),g=new og(g.left-h.left,g.top-h.top,g.right+h.right,g.bottom+h.bottom),h=a.ua,l=a.fb,k=b.parent;k&&k.ya;)k=k.parent;if(k){var m=k.B.ownerDocument.createElement("div");m.style.left="0px";m.style.top="0px";a.b?(m.style.bottom="0px",m.style.width="1px"):(m.style.right="0px",m.style.height="1px");k.B.appendChild(m);var p=
Kk(a.f,m),h=Math.max(a.b?p.top:p.left,h),l=Math.min(a.b?p.bottom:p.right,l);k.B.removeChild(m);m=a.b?g.R-g.T:g.U-g.V;"left"==e?l=Math.max(l,h+m):h=Math.min(h,l-m);k.B.appendChild(b.B)}m=new og(h,wl(a)*a.D,l,wl(a)*a.sa);h=g;a.b&&(h=Fg(g));l=wl(a);h.T<a.ye*l&&(p=h.R-h.T,h.T=a.ye*l,h.R=h.T+p);a:for(var l=a.Cb,p=h,q=p.T,r=p.U-p.V,z=p.R-p.T,u=Jg(l,q);;){var A=q+z;if(A>m.R)break a;for(var D=m.V,I=m.U,K=u;K<l.length&&l[K].T<A;K++){var H=l[K];H.V>D&&(D=H.V);H.U<I&&(I=H.U)}if(D+r<=I||u>=l.length){"left"==
e?(p.V=D,p.U=D+r):(p.V=I-r,p.U=I);p.R+=q-p.T;p.T=q;break a}q=l[u].R;u++}a.b&&(g=new og(-h.R,h.V,-h.T,h.U));a:{m=Qn(a.f,d);l=new qg;if(m){if("border-box"==m.boxSizing){m=Qo(a,d);break a}l.left=X(m.marginLeft)+X(m.borderLeftWidth)+X(m.paddingLeft);l.top=X(m.marginTop)+X(m.borderTopWidth)+X(m.paddingTop);l.right=X(m.marginRight)+X(m.borderRightWidth)+X(m.paddingRight);l.bottom=X(m.marginBottom)+X(m.borderBottomWidth)+X(m.paddingBottom)}m=l}x(d,"width",g.U-g.V-m.left-m.right+"px");x(d,"height",g.R-g.T-
m.top-m.bottom+"px");x(d,"position","absolute");x(d,"display",b.display);l=null;if(k)if(k.S)l=k;else a:{for(k=k.parent;k;){if(k.S){l=k;break a}k=k.parent}l=null}l?(m=l.B.ownerDocument.createElement("div"),m.style.position="absolute",l.b?m.style.right="0":m.style.left="0",m.style.top="0",l.B.appendChild(m),k=Kk(a.f,m),l.B.removeChild(m)):k={left:(a.b?a.sa:a.ua)-a.H,right:(a.b?a.D:a.fb)+a.Y,top:(a.b?a.ua:a.D)-a.J};(l?l.b:a.b)?x(d,"right",k.right-g.U+"px"):x(d,"left",g.V-k.left+"px");x(d,"top",g.T-k.top+
"px");b.D&&(b.D.parentNode.removeChild(b.D),b.D=null);k=a.b?g.V:g.R;g=a.b?g.U:g.T;if(so(a,k)&&a.N.length)b=b.modify(),b.xa=!0,O(c,b);else{Mo(a);m=new og(a.b?a.sa:a.ua,a.b?a.ua:a.D,a.b?a.D:a.fb,a.b?a.fb:a.sa);a.b&&(m=Fg(m));l=a.Cb;for(p=[new sg(h.T,h.R,h.V,h.U)];0<p.length&&p[0].R<=m.T;)p.shift();if(p.length){p[0].T<m.T&&(p[0].T=m.T);h=l.length?l[l.length-1].R:m.T;h<m.R&&l.push(new sg(h,m.R,m.V,m.U));h=Jg(l,p[0].T);p=t(p);for(q=p.next();!q.done;q=p.next()){r=q.value;if(h==l.length)break;l[h].T<r.T&&
(q=l[h],h++,l.splice(h,0,new sg(r.T,q.R,q.V,q.U)),q.R=r.T);for(;h<l.length&&(q=l[h++],q.R>r.R&&(l.splice(h,0,new sg(r.R,q.R,q.V,q.U)),q.R=r.R),r.V!=r.U&&("left"==e?q.V=Math.min(r.U,m.U):q.U=Math.max(r.V,m.V)),q.R!=r.R););}Ig(m,l)}No(a);"left"==e?a.Ee=k:a.Fe=k;a.ye=g;To(a,k);O(c,f)}});return c.result()}
function Uo(a,b,c,d,e,f){var g=a.element.ownerDocument.createElement("div");x(g,"position","absolute");var h=kn(a.l,b.W),l=new dn(null,"column",null,a.l.h,b.b,null,null),h=gn(h),g=new Vo(c,g,a.j.clone(),a.f,a.Zb,l,h);hn(l,g);var h=b.W,k=a.l;b=gn(k,h);l=g.element;b.element.parentNode.appendChild(l);g.gg=!0;g.F=b.F;g.G=b.G;g.b=b.b;g.marginLeft=g.marginRight=g.marginTop=g.marginBottom=0;g.Z=g.Za=g.ca=g.Ba=0;g.H=g.Y=g.J=g.S=0;g.ob=(b.ob||[]).concat();g.Kb=!sn(k);g.Lb=null;var m=Dl(b);zl(g,m.V-b.F,m.U-
m.V);yl(g,m.T-b.G,m.R-m.T);e.Bf(g,b,a);Wo(g);(a=!!Rn(k,g,h,c,d,!0,!sn(k),f))?(Mo(g),Wo(g)):b.element.parentNode.removeChild(l);return a?g:null}
function Xo(a,b,c,d,e,f,g,h){var l=a.l;b=(h?h.Ob:[]).concat(b);var k=b[0].ja,m=Zn(l,k,c,d),p=Uo(a,k,c,g,f,m),q={Pf:p,pf:null,mf:null};if(!p)return M(q);var r=L("layoutSinglePageFloatFragment"),z=!1,u=0;Fe(function(a){u>=b.length?Q(a):Mm(p,new kl(b[u].b),!0).then(function(b){q.mf=b;!b||e?(u++,P(a)):(z=!0,Q(a))})}).then(function(){if(!z){var a=Rn(l,p,k.W,c,g,!1,e,m);a?(a=f.Mf(b,a,p,!!q.mf),on(l,a,!0),q.pf=a):z=!0}O(r,q)});return r.result()}
function Yo(a,b,c,d,e){function f(a,c){c?qn(g,c,!0):a&&a.element.parentNode.removeChild(a.element);Ln(g,h.W);yn(g,b)}var g=a.l,h=b.ja;Kn(g,h);var l=L("layoutPageFloatInner");Xo(a,[b],h.Ca,h.h,!sn(g),c,d,e).then(function(b){var c=b.Pf,d=b.pf,k=b.mf;d?Zo(a,h.W,[e]).then(function(a){a?(on(g,d),Mn(g,h.W),k&&yn(g,new cn(h,k.f)),O(l,!0)):(f(c,d),O(l,!1))}):(f(c,d),O(l,!1))});return l.result()}
function Zo(a,b,c){var d=a.l,e=Nn(d,b),f=[],g=[],h=!1,l=L("layoutStashedPageFloats"),k=0;Fe(function(b){if(k>=e.length)Q(b);else{var d=e[k];if(c.includes(d))k++,P(b);else{var l=mn(d.Ob[0].ja);Xo(a,d.Ob,d.Ca,null,!1,l,null).then(function(a){var c=a.Pf;c&&f.push(c);(a=a.pf)?(g.push(a),k++,P(b)):(h=!0,Q(b))})}}}).then(function(){h?(g.forEach(function(a){qn(d,a,!0)}),f.forEach(function(a){(a=a.element)&&a.parentNode&&a.parentNode.removeChild(a)})):e.forEach(function(a){(a=a.b.element)&&a.parentNode&&
a.parentNode.removeChild(a)});O(l,!h)});return l.result()}function $o(a,b){var c=b.B.parentNode,d=c.ownerDocument.createElement("span");d.setAttribute("data-adapt-spec","1");"footnote"===b.Ca&&ap(a.j,b,"footnote-call",d);c.appendChild(d);c.removeChild(b.B);c=b.modify();c.K=!0;c.B=d;return c}
function ho(a,b,c,d){var e=L("resolveFloatReferenceFromColumnSpan"),f=a.l,g=kn(f,"region");gn(f).width<gn(g).width&&"column"===b?c===Zc?Jo(a,Zk(d)).then(function(c){var d=c.B;c=Sn(a.f,d,[bp])[bp];d=Qo(a,d);c=a.b?c+(d.top+d.bottom):c+(d.left+d.right);c>a.width?O(e,"region"):O(e,b)}):c===Xc?O(e,"region"):O(e,b):O(e,b);return e.result()}
function cp(a,b){var c=a.l,d=fo(b),e=c.cf(fl(b));return(e?M(e):d.Lf(b,c,a)).ea(function(e){var f=Vk(b),h=$o(a,b),l=d.xf(e,c),f=new cn(e,f);if(l&&bn(l,e))return un(c,e,h.B),M(h);if(nn(c,e)||zn(c,e))return yn(c,f),un(c,e,h.B),M(h);if(a.ta)return M(null);var k=jo(h,a.f,0,a.b);return so(a,k)?M(h):Yo(a,f,d,k,l).ea(function(a){if(a)return M(null);un(c,e,h.B);return M(h)})})}
function dp(a,b,c){if(!b.K||b.ya){if(c){for(var d="",e=b.parent;e&&!d;e=e.parent)!e.ya&&e.B&&(d=e.B.style.textAlign);if("justify"!==d)return}var f=b.B,g=f.ownerDocument,h=c&&(b.K||1!=f.nodeType);(d=h?f.nextSibling:f)&&!d.parentNode&&(d=null);if(e=f.parentNode||b.parent&&b.parent.B){var l=d,k=document.body;if(null===jb){var m=k.ownerDocument,p=m.createElement("div");p.style.position="absolute";p.style.top="0px";p.style.left="0px";p.style.width="40px";p.style.height="100px";p.style.lineHeight="16px";
p.style.fontSize="16px";p.style.textAlign="justify";k.appendChild(p);var q=m.createTextNode("a a-");p.appendChild(q);var r=m.createElement("span");r.style.display="inline-block";r.style.width="40px";p.appendChild(r);m=m.createRange();m.setStart(q,2);m.setEnd(q,4);jb=37>m.getBoundingClientRect().right;k.removeChild(p)}jb&&(h=(h=h?f:f.previousSibling)?h.textContent:"",h.charAt(h.length-1)===ep(b)&&(h=f.ownerDocument,f=f.parentNode,k=document.body,null===kb&&(m=k.ownerDocument,p=m.createElement("div"),
p.style.position="absolute",p.style.top="0px",p.style.left="0px",p.style.width="40px",p.style.height="100px",p.style.lineHeight="16px",p.style.fontSize="16px",p.style.textAlign="justify",k.appendChild(p),q=m.createTextNode("a a-"),p.appendChild(q),p.appendChild(m.createElement("wbr")),r=m.createElement("span"),r.style.display="inline-block",r.style.width="40px",p.appendChild(r),m=m.createRange(),m.setStart(q,2),m.setEnd(q,4),kb=37>m.getBoundingClientRect().right,k.removeChild(p)),kb?f.insertBefore(h.createTextNode(" "),
l):f.insertBefore(h.createElement("wbr"),l)));h=b.b;f=g.createElement("span");f.style.visibility="hidden";f.style.verticalAlign="top";f.setAttribute("data-adapt-spec","1");k=g.createElement("span");k.style.fontSize="0";k.style.lineHeight="0";k.textContent=" #";f.appendChild(k);f.style.display="block";f.style.textIndent="0";f.style.textAlign="left";e.insertBefore(f,l);l=Kk(a.f,k);f.style.textAlign="right";k=Kk(a.f,k);f.style.textAlign="";p=document.body;if(null===ib){r=p.ownerDocument;q=r.createElement("div");
q.style.position="absolute";q.style.top="0px";q.style.left="0px";q.style.width="30px";q.style.height="100px";q.style.lineHeight="16px";q.style.fontSize="16px";q.style.textAlign="justify";p.appendChild(q);m=r.createTextNode("a | ");q.appendChild(m);var z=r.createElement("span");z.style.display="inline-block";z.style.width="30px";q.appendChild(z);r=r.createRange();r.setStart(m,0);r.setEnd(m,3);ib=27>r.getBoundingClientRect().right;p.removeChild(q)}ib?f.style.display="inline":f.style.display="inline-block";
l=h?k.top-l.top:k.left-l.left;l=1<=l?l-1+"px":"100%";h?f.style.paddingTop=l:f.style.paddingLeft=l;c||(c=g.createElement("div"),e.insertBefore(c,d),d=Kk(a.f,f),a=Kk(a.f,c),b.b?(c.style.marginRight=a.right-d.right+"px",c.style.width="0px"):(c.style.marginTop=d.top-a.top+"px",c.style.height="0px"),c.setAttribute("data-adapt-spec","1"))}}}
function fp(a,b,c,d){var e=L("processLineStyling");vo(d);var f=d.concat([]);d.splice(0,d.length);var g=0,h=b.f;0==h.count&&(h=h.Ig);Fe(function(d){if(h){var e=gp(a,f),l=h.count-g;if(e.length<=l)Q(d);else{var p=hp(a,f,e[l-1]);p?a.Na(p,!1,!1).then(function(){g+=l;Do(a.j,p,0).then(function(e){b=e;dp(a,b,!1);h=b.f;f=[];Eo(a,b,f).then(function(a){c=a;P(d)})})}):Q(d)}}else Q(d)}).then(function(){Array.prototype.push.apply(d,f);vo(d);O(e,c)});return e.result()}
function ip(a,b){for(var c=0,d=0,e=b.length-1;0<=e;e--){var f=b[e];if(!f.K||!f.B||1!=f.B.nodeType)break;f=Qo(a,f.B);f=a.b?-f.left:f.bottom;0<f?c=Math.max(c,f):d=Math.min(d,f)}return c-d}
function jp(a,b){var c=L("layoutBreakableBlock"),d=[];Eo(a,b,d).then(function(e){var f=d.length-1;if(0>f)O(c,e);else{var f=Oo(a,e,d,f,d[f].Ma),g=!1;if(!e||!Po(e.B)){var h=oo(e,ro(a)),g=so(a,f+(a.b?-1:1)*h.He);so(a,f+(a.b?-1:1)*h.current)&&!a.ta&&(a.ta=e)}e||(f+=ip(a,d));To(a,f);var l;b.f?l=fp(a,b,e,d):l=M(e);l.then(function(b){Ko(a,b,d);0<d.length&&(a.N.push(new po(d,d[0].j)),g&&(2!=d.length&&0<a.N.length||d[0].M!=d[1].M||!io[d[0].M.localName])&&b&&(b=b.modify(),b.xa=!0));O(c,b)})}});return c.result()}
function Ko(a,b,c){he("POST_LAYOUT_BLOCK").forEach(function(d){d(b,c,a)})}
function hp(a,b,c){vo(b);var d=a.b?c-1:c+1,e=0,f=b[0].Ma;c=e;for(var g=b.length-1,h=b[g].Ma,l;f<h;){l=f+Math.ceil((h-f)/2);c=e;for(var k=g;c<k;){var m=c+Math.ceil((k-c)/2);b[m].Ma>l?k=m-1:c=m}k=Oo(a,null,b,c,l);if(a.b?k<=d:k>=d){for(h=l-1;b[c].Ma==l;)c--;g=c}else To(a,k),f=l,e=c}d=f;b=b[c];c=b.B;1!=c.nodeType&&(kp(b),b.K?b.na=c.length:(e=d-b.Ma,d=c.data,173==d.charCodeAt(e)?(c.replaceData(e,d.length-e,b.A?"":ep(b)),c=e+1):(f=d.charAt(e),e++,g=d.charAt(e),c.replaceData(e,d.length-e,!b.A&&Wa(f)&&Wa(g)?
ep(b):""),c=e),e=c,0<e&&(c=e,b=b.modify(),b.na+=c,b.g=null)));lp(a,b,!1);return b}function kp(a){he("RESOLVE_TEXT_NODE_BREAKER").reduce(function(b,c){return c(a)||b},mp)}var mp=new function(){};function ep(a){return a.F||a.parent&&a.parent.F||"-"}function Fo(a){return a?(a=a.B)&&1===a.nodeType?!!a.getAttribute("data-adapt-spec"):!1:!1}
function gp(a,b){for(var c=[],d=b[0].B,e=b[b.length-1].B,f=[],g=d.ownerDocument.createRange(),h=!1,l=null,k=!1,m=!0;m;){var p=!0;do{var q=null;d==e&&(m=1===e.nodeType?!(!e.firstChild||h):!1);if(1!=d.nodeType)k||(g.setStartBefore(d),k=!0),l=d;else if(h)h=!1;else if(d.getAttribute("data-adapt-spec"))p=!k;else{var r;if(!(r="ruby"==d.localName))a:{switch(Qn(a.f,d).display){case "ruby":case "inline-block":case "inline-flex":case "inline-grid":case "inline-list-item":case "inline-table":r=!0;break a}r=
!1}if(r){if(p=!k)g.setStartBefore(d),k=!0,l=d;d.contains(e)&&(m=!1)}else q=d.firstChild}q||(q=d.nextSibling,q||(h=!0,q=d.parentNode));d=q}while(p&&m);if(k){g.setEndAfter(l);k=ko(a.f,g);for(p=0;p<k.length;p++)f.push(k[p]);k=!1}}f.sort(a.b?Rk:Qk);l=d=h=g=e=0;for(m=wl(a);;){if(l<f.length&&(k=f[l],p=1,0<d&&(p=Math.max(a.b?k.right-k.left:k.bottom-k.top,1),p=m*(a.b?k.right:k.top)<m*e?m*((a.b?k.left:k.bottom)-e)/p:m*(a.b?k.left:k.bottom)>m*g?m*(g-(a.b?k.right:k.top))/p:1),!d||.6<=p||.2<=p&&(a.b?k.top:k.left)>=
h-1)){h=a.b?k.bottom:k.right;a.b?(e=d?Math.max(e,k.right):k.right,g=d?Math.min(g,k.left):k.left):(e=d?Math.min(e,k.top):k.top,g=d?Math.max(g,k.bottom):k.bottom);d++;l++;continue}0<d&&(c.push(g),d=0);if(l>=f.length)break}c.sort($a);a.b&&c.reverse();return c}function Jm(a,b){var c=0;il(b,function(b){if("clone"===b.h["box-decoration-break"]){var d=Ro(a,b.B);c+=b.b?-d.left:d.bottom;"table"===b.display&&(c+=b.ta)}});return c}function to(a,b){return(b?oo(b.g(),ro(a)):oo(null,ro(a))).current}
function qo(a,b,c){for(var d=b.h,e=d[0];e.parent&&e.ya;)e=e.parent;var f;c?f=c=1:(c=Math.max((e.h.widows||2)-0,1),f=Math.max((e.h.orphans||2)-0,1));var e=Jm(a,e),g=gp(a,d),h=a.la-e,e=wl(a),l=to(a,b),h=h-e*l,k=np(a,d);isNaN(k.xc)&&(k.xc=Infinity*e);var d=Za(g.length,function(b){b=g[b];return a.b?b<h||b<=k.xc:b>h||b>=k.xc}),m=0>=d;m&&(d=Za(g.length,function(b){return a.b?g[b]<h:g[b]>h}));d=Math.min(g.length-c,d);if(d<f)return null;h=g[d-1];if(b=m?k.If:hp(a,b.h,h))c=op(a,b),!isNaN(c)&&c<h&&(h=c),a.h=
e*(h-a.D)+l;return b}function op(a,b){var c=b;do c=c.parent;while(c&&c.ya);return c?(c=Zk(c).modify(),c.K=!0,jo(c,a.f,0,a.b)):NaN}function np(a,b){var c=b.findIndex(function(a){return a.xa});if(0>c)return{xc:NaN,If:null};var d=b[c];return{xc:Oo(a,null,b,c,d.Ma),If:d}}Km.prototype.Na=function(a,b,c){var d=lo(a.C).Na(this,a,b,c);d||(d=pp.Na(this,a,b,c));return d};
Km.prototype.ec=function(){var a=null,b=null,c,d=0;do{c=d;for(var d=Number.MAX_VALUE,e=this.N.length-1;0<=e&&!b;--e){var a=this.N[e],b=a.f(this,c),f=a.b();f>c&&(d=Math.min(d,f))}}while(d>c&&!b&&this.Kb);return{Eb:b?a:null,w:b}};
function qp(a,b,c,d,e){if(Jn(a.l)||a.g||!c)return M(b);var f=L("doFinishBreak"),g=!1;if(!b){if(a.Kb)return w.b("Could not find any page breaks?!!"),rp(a,c).then(function(b){b?(b=b.modify(),b.xa=!1,a.Na(b,g,!0).then(function(){O(f,b)})):O(f,b)}),f.result();b=d;g=!0;a.h=e}a.Na(b,g,!0).then(function(){O(f,b)});return f.result()}function sp(a){a=a.toString();return""==a||"auto"==a||!!a.match(/^0+(.0*)?[^0-9]/)}
function tp(a,b,c){if(!b||Po(b.B))return!1;var d=jo(b,a.f,0,a.b),e=oo(b,ro(a)),f=so(a,d+(a.b?-1:1)*e.He);so(a,d+(a.b?-1:1)*e.current)&&!a.ta?a.ta=b:c&&(b=d+ip(a,c),e=a.la-wl(a)*e.current,d=a.b?Math.min(d,Math.max(b,e)):Math.max(d,Math.min(b,e)));To(a,d);return f}function up(a,b,c,d,e){if(!b||Po(b.B))return!1;c=tp(a,b,c);!d&&c||vp(a,b,e,c);return c}
function wp(a,b){if(!b.B.parentNode)return!1;var c=Qo(a,b.B),d=b.B.ownerDocument.createElement("div");a.b?(d.style.bottom="0px",d.style.width="1px",d.style.marginRight=c.right+"px"):(d.style.right="0px",d.style.height="1px",d.style.marginTop=c.top+"px");b.B.parentNode.insertBefore(d,b.B);var e=Kk(a.f,d),e=a.b?e.right:e.top,f=wl(a),g=b.l,h=Infinity*-wl(a);"all"===g&&(h=Yn(a.l,a));switch(g){case "left":h=f*Math.max(h*f,a.Ee*f);break;case "right":h=f*Math.max(h*f,a.Fe*f);break;default:h=f*Math.max(h*
f,Math.max(a.Fe*f,a.Ee*f))}if(e*f>=h*f)return b.B.parentNode.removeChild(d),!1;e=Math.max(1,(h-e)*f);a.b?d.style.width=e+"px":d.style.height=e+"px";e=Kk(a.f,d);e=a.b?e.left:e.bottom;a.b?(h=e+c.right-h,0<h==0<=c.right&&(h+=c.right),d.style.marginLeft=h+"px"):(h-=e+c.top,0<h==0<=c.top&&(h+=c.top),d.style.marginBottom=h+"px");b.D=d;return!0}function xp(a){return a instanceof wo?!0:a instanceof yp?!1:a instanceof zp?!0:!1}
function Ap(a,b,c,d){function e(){return!!d||!c&&!!Vl[m]}function f(){b=q[0]||b;b.B.parentNode.removeChild(b.B);h.g=m}var g=b.K?b.parent&&b.parent.C:b.C;if(g&&!xp(g))return M(b);var h=a,l=L("skipEdges"),k=!d&&c&&b&&b.K,m=d,p=null,q=[],r=[],z=!1;Fe(function(a){for(;b;){var d=lo(b.C);do if(b.B){if(b.ya&&1!=b.B.nodeType){if(Mk(b.B,b.uc))break;if(!b.K){e()?f():up(h,p,null,!0,m)?(b=(h.u?p||b:b).modify(),b.xa=!0):(b=b.modify(),b.g=m);Q(a);return}}if(!b.K){if(d&&d.Ze(b))break;b.l&&wp(h,b)&&c&&!h.N.length&&
vp(h,Zk(b),m,!1);if(!xp(b.C)||b.C instanceof zp||xo(h,b)||b.H){q.push(Zk(b));m=Tl(m,b.g);if(e())f();else if(up(h,p,null,!0,m)||!h.Zb.b(b))b=(h.u?p||b:b).modify(),b.xa=!0;Q(a);return}}if(1==b.B.nodeType){var g=b.B.style;if(b.K){if(!(b.ya||d&&d.Af(b,h.u))){if(z){if(e()){f();Q(a);return}q=[];k=c=!1;m=null}z=!1;p=Zk(b);r.push(p);m=Tl(m,b.G);!g||sp(g.paddingBottom)&&sp(g.borderBottomWidth)||(r=[p])}}else{q.push(Zk(b));m=Tl(m,b.g);if(!h.Zb.b(b)&&(up(h,p,null,!h.u,m),b=b.modify(),b.xa=!0,h.u)){Q(a);return}if(io[b.B.localName]){e()?
f():up(h,p,null,!0,m)&&(b=(h.u?p||b:b).modify(),b.xa=!0);Q(a);return}!g||sp(g.paddingTop)&&sp(g.borderTopWidth)||(k=!1,r=[]);z=!0}}}while(0);d=Go(h,b,k);if(d.Xa()){d.then(function(c){b=c;P(a)});return}b=d.get()}up(h,p,r,!h.u,m)?p&&h.u&&(b=p.modify(),b.xa=!0):Vl[m]&&(h.g=m);Q(a)}).then(function(){p&&(h.xb=fl(p));O(l,b)});return l.result()}
function rp(a,b){var c=Zk(b),d=L("skipEdges"),e=null,f=!1;Fe(function(d){for(;b;){do if(b.B){if(b.ya&&1!=b.B.nodeType){if(Mk(b.B,b.uc))break;if(!b.K){Vl[e]&&(a.g=e);Q(d);return}}if(!b.K&&(xo(a,b)||b.H)){e=Tl(e,b.g);Vl[e]&&(a.g=e);Q(d);return}if(1==b.B.nodeType){var g=b.B.style;if(b.K){if(f){if(Vl[e]){a.g=e;Q(d);return}e=null}f=!1;e=Tl(e,b.G)}else{e=Tl(e,b.g);if(io[b.B.localName]){Vl[e]&&(a.g=e);Q(d);return}if(g&&(!sp(g.paddingTop)||!sp(g.borderTopWidth))){Q(d);return}}f=!0}}while(0);g=Gm(a.j,b);if(g.Xa()){g.then(function(a){b=
a;P(d)});return}b=g.get()}c=null;Q(d)}).then(function(){O(d,c)});return d.result()}function Ho(a,b){return Xm(b.W)||"footnote"===b.Ca?cp(a,b):So(a,b)}function Bp(a,b,c,d){var e=L("layoutNext");Ap(a,b,c,d||null).then(function(d){b=d;!b||a.g||a.u&&b&&b.xa?O(e,b):lo(b.C).je(b,a,c).Ea(e)});return e.result()}function lp(a,b,c){if(b)for(var d=b.parent;b;b=d,d=d?d.parent:null)lo((d||b).C).Fd(a,d,b,c),c=!1}
function Wo(a){a.dg=[];x(a.element,"width",a.width+"px");x(a.element,"height",a.height+"px");var b=a.element.ownerDocument.createElement("div");b.style.position="absolute";b.style.top=a.J+"px";b.style.right=a.Y+"px";b.style.bottom=a.S+"px";b.style.left=a.H+"px";a.element.appendChild(b);var c=Kk(a.f,b);a.element.removeChild(b);var b=a.F+a.left+ul(a),d=a.G+a.top+sl(a);a.cg=new og(b,d,b+a.width,d+a.height);a.ua=c?a.b?c.top:c.left:0;a.fb=c?a.b?c.bottom:c.right:0;a.D=c?a.b?c.right:c.top:0;a.sa=c?a.b?c.left:
c.bottom:0;a.Ee=a.D;a.Fe=a.D;a.ye=a.D;a.la=a.sa;c=a.cg;b=a.F+a.left+ul(a);d=a.G+a.top+sl(a);d=new og(b,d,b+a.width,d+a.height);if(a.Lb){for(var b=d.V,d=d.T,e=[],f=t(a.Lb.b),g=f.next();!g.done;g=f.next())g=g.value,e.push(new pg(g.f+b,g.b+d));b=new ug(e)}else b=xg(d.V,d.T,d.U,d.R);b=[b];d=Vn(a.l);a.Cb=Hg(c,b,a.ob.concat(d),a.Mb,a.b);No(a);a.h=0;a.Ld=!1;a.g=null;a.xb=null}function vp(a,b,c,d){var e=Zk(b);b=lo(b.C);var f=Jm(a,e);c=b.Kf(e,c,d,a.h+f);a.N.push(c)}
function To(a,b){isNaN(b)||(a.h=Math.max(wl(a)*(b-a.D),a.h))}
function Mm(a,b,c,d){a.dg.push(b);b.f.K&&(a.xb=b.f);if(a.u&&a.Ld)return M(b);if(bo(a.l,a))return b.f.K&&1===b.f.pa.length?M(null):M(b);var e=L("layout");a.Lc(b.f).then(function(b){var f=null;if(b.B)f=Zk(b);else{var h=function(b){b.w.B&&(f=b.w,a.j.removeEventListener("nextInTree",h))};a.j.addEventListener("nextInTree",h)}var l=new Cp(c,d);Pm(l,b,a).then(function(b){qp(a,b,l.g.Wd,f,l.b).then(function(b){var c=null;a.Md?c=M(null):c=Dp(a,b);c.then(function(){if(Jn(a.l))O(e,null);else if(b){a.Ld=!0;var c=
new kl(fl(b));O(e,c)}else O(e,null)})})})});return e.result()}function Dp(a,b){var c=L("doFinishBreakOfFragmentLayoutConstraints"),d=[].concat(a.A);d.sort(function(a,b){return a.ue()-b.ue()});var e=0;Ee(function(){return e<d.length?d[e++].Na(b,a).Hc(!0):M(!1)}).then(function(){O(c,!0)});return c.result()}
function Ep(a,b,c,d){var e=L("doLayout"),f=null;a.N=[];a.ta=null;Fe(function(e){for(var g={};b;){g.Oa=!0;Bp(a,b,c,d||null).then(function(g){return function(h){c=!1;d=null;a.ta&&a.u?(a.g=null,b=a.ta,b.xa=!0):b=h;Jn(a.l)?Q(e):a.g?Q(e):b&&a.u&&b&&b.xa?(f=b,h=a.ec(),b=h.w,h.Eb&&h.Eb.u(a),Q(e)):g.Oa?g.Oa=!1:P(e)}}(g));if(g.Oa){g.Oa=!1;return}g={Oa:g.Oa}}a.h+=to(a);Q(e)}).then(function(){O(e,{w:b,Wd:f})});return e.result()}function Fp(a){var b=Xn(a.l);0<b&&isFinite(b)&&(a.jf=wl(a)*(b-a.D-a.h))}
function Po(a){for(;a;){if(a.parentNode===a.ownerDocument)return!1;a=a.parentNode}return!0}function Cp(a,b){Om.call(this);this.gc=a;this.A=b||null;this.l=null;this.b=0;this.j=!1;this.g={Wd:null}}v(Cp,Om);n=Cp.prototype;n.qf=function(){return new Gp(this.gc,this.A,this.g)};n.eg=function(a,b){b.A=[];b.Md||(Hp=[])};n.Jd=function(a){for(Om.prototype.Jd.call(this,a);a;){var b=a.B;b&&yo(b.parentNode,b);a=a.parent}};n.yf=function(a,b){Om.prototype.yf.call(this,a,b);this.l=b.g;this.b=b.h;this.j=b.Ld};
n.ie=function(a,b){Om.prototype.ie.call(this,a,b);b.g=this.l;b.h=this.b;b.Ld=this.j};function Gp(a,b,c){this.gc=a;this.j=b;this.h=c}Gp.prototype.b=function(a,b){var c=this,d=L("adapt.layout.DefaultLayoutMode.doLayout");Ip(a,b).then(function(){Ep(b,a,c.gc,c.j).then(function(a){c.h.Wd=a.Wd;O(d,a.w)})});return d.result()};Gp.prototype.f=function(a,b){var c=this;return Jn(b.l)||b.g||0>=b.A.length?!0:b.A.every(function(d){return d.ke(a,c.h.Wd,b)})};
Gp.prototype.g=function(a,b,c,d){d||(d=!c.A.some(function(b){return b.nd(a)}));c.A.forEach(function(e){e.cd(d,a,b,c)});return d};function Lp(){}n=Lp.prototype;n.je=function(a,b){var c;if(xo(b,a))c=Ho(b,a);else{a:if(a.K)c=!0;else{switch(a.M.namespaceURI){case "http://www.w3.org/2000/svg":c=!1;break a}c=!a.H}c=c?jp(b,a):Jo(b,a)}return c};n.Kf=function(a,b,c,d){return new Nm(Zk(a),b,c,d)};n.Ze=function(){return!1};n.Af=function(){return!1};
n.Fd=function(a,b,c,d){c.B&&c.B.parentNode&&(a=c.B.parentNode,yo(a,c.B),d&&a.removeChild(c.B))};n.Na=function(a,b,c,d){c=c||!!b.B&&1==b.B.nodeType&&!b.K;lp(a,b,c);d&&(dp(a,b,!0),Mp(c?b:b.parent));return M(!0)};var pp=new Lp;ge("RESOLVE_FORMATTING_CONTEXT",function(a,b,c,d,e,f){b=a.parent;return!b&&a.C?null:b&&a.C!==b.C?null:a.hd||!a.C&&Xl(c,d,e,f).display===bd?new wo(b?b.C:null):null});ge("RESOLVE_LAYOUT_PROCESSOR",function(a){return a instanceof wo?pp:null});
function Vo(a,b,c,d,e,f,g){Km.call(this,b,c,d,e,f);this.Ca=a;this.hg=g;this.Jb=[];this.fg=[];this.ve=!0}v(Vo,Km);
Vo.prototype.Lc=function(a){var b=this;return Km.prototype.Lc.call(this,a).ea(function(a){if(a){for(var c=a;c.parent;)c=c.parent;c=c.B;b.Jb.push(c);b.ve&&Np(b,c);b.fg.push(Qo(b,c));if(b.ve){var e=b.Ca;if(b.hg.b){if("block-end"===e||"left"===e)e=Pa(c,"height"),""!==e&&"auto"!==e&&x(c,"margin-top","auto")}else if("block-end"===e||"bottom"===e)e=Pa(c,"width"),""!==e&&"auto"!==e&&x(c,"margin-left","auto")}}return M(a)})};
function Np(a,b){function c(a,c){a.forEach(function(a){var d=Pa(b,a);d&&"%"===d.charAt(d.length-1)&&x(b,a,c*parseFloat(d)/100+"px")})}var d=Dl(a.hg),e=d.U-d.V,d=d.R-d.T;c(["width","max-width","min-width"],e);c(["height","max-height","min-height"],d);c("margin-top margin-right margin-bottom margin-left padding-top padding-right padding-bottom padding-left".split(" "),a.b?d:e);["margin-top","margin-right","margin-bottom","margin-left"].forEach(function(a){"auto"===Pa(b,a)&&x(b,a,"0")})}
function Un(a){return Math.max.apply(null,a.Jb.map(function(a,c){var b=Kk(this.f,a),e=this.fg[c];return this.b?e.top+b.height+e.bottom:e.left+b.width+e.right},a))}function Op(a,b,c){var d=Kk(b.f,a);a=Qo(b,a);return c?d.width+a.left+a.right:d.height+a.top+a.bottom};function Pp(a){var b={};Object.keys(a).forEach(function(c){b[c]=Array.from(a[c])});return b}function Qp(a,b){this.Gc=a;this.ud=b;this.Le=null;this.aa=this.P=-1}function Rp(a,b){this.b=a;this.f=b}function Gj(a,b,c){b=a.b.J.Re(b,a.f);a.b.l[b]=c}function Sp(a,b,c,d){this.b=a;this.g=b;this.j=c;this.f=d;this.h=null}function Tp(a){return(a=a.match(/^[^#]*#(.*)$/))?a[1]:null}function Up(a,b){var c=a.b.J.oc(Ba(b,a.g),a.g);"#"===c.charAt(0)&&(c=c.substring(1));return c}
function ij(a,b,c){var d=new Kb(a.f,function(){var d=a.b.b[b];return c(d&&d.length?d[d.length-1]:null)},"page-counter-"+b);Vp(a.b,b,function(a){return c(a[0])},d);return d}function kj(a,b,c){var d=new Kb(a.f,function(){return c(a.b.b[b]||[])},"page-counters-"+b);Vp(a.b,b,c,d);return d}function Wp(a,b,c,d){var e=a.b.l[c];if(!e&&d&&b){d=a.h;if(b){d.D=b;for(b=0;d.D&&(b+=5E3,jm(d,b,0)!==Number.POSITIVE_INFINITY););d.D=null}e=a.b.l[c]}return e||null}
function mj(a,b,c,d){var e=Tp(b),f=Up(a,b),g=Wp(a,e,f,!1);return g&&g[c]?(b=g[c],new Ib(a.j,d(b[b.length-1]||null))):new Kb(a.f,function(){if(g=Wp(a,e,f,!0)){if(g[c]){var b=g[c];return d(b[b.length-1]||null)}if(b=a.b.j.f[f]?a.b.b:a.b.A[f]||null)return Xp(a.b,f),b[c]?(b=b[c],d(b[b.length-1]||null)):d(0);Yp(a.b,f,!1);return"??"}Yp(a.b,f,!1);return"??"},"target-counter-"+c+"-of-"+b)}
function oj(a,b,c,d){var e=Tp(b),f=Up(a,b);return new Kb(a.f,function(){var b=a.b.j.f[f]?a.b.b:a.b.A[f]||null;if(b){Xp(a.b,f);var b=b[c]||[],h=Wp(a,e,f,!0)[c]||[];return d(b.concat(h))}Yp(a.b,f,!1);return"??"},"target-counters-"+c+"-of-"+b)}function Zp(a){this.J=a;this.l={};this.A={};this.b={};this.b.page=[0];this.G={};this.F=[];this.D={};this.j=null;this.u=[];this.g=[];this.H=[];this.f={};this.h={};this.Ne=[]}function $p(a,b){var c=a.b.page;c&&c.length?c[c.length-1]=b:a.b.page=[b]}
function aq(a,b,c){a.G=Pp(a.b);var d,e=b["counter-reset"];e&&(e=e.evaluate(c))&&(d=Tg(e,!0));if(d)for(var f in d){var e=a,g=f,h=d[f];e.b[g]?e.b[g].push(h):e.b[g]=[h]}var l;(b=b["counter-increment"])&&(c=b.evaluate(c))&&(l=Tg(c,!1));l?"page"in l||(l.page=1):l={page:1};for(var k in l)a.b[k]||(c=a,b=k,c.b[b]?c.b[b].push(0):c.b[b]=[0]),c=a.b[k],c[c.length-1]+=l[k]}function bq(a,b){a.F.push(a.b);a.b=Pp(b)}
function Xp(a,b){var c=a.f[b],d=a.h[b];d||(d=a.h[b]=[]);for(var e=!1,f=0;f<a.g.length;){var g=a.g[f];g.Gc===b?(g.ud=!0,a.g.splice(f,1),c&&(e=c.indexOf(g),0<=e&&c.splice(e,1)),d.push(g),e=!0):f++}e||Yp(a,b,!0)}function Yp(a,b,c){a.u.some(function(a){return a.Gc===b})||a.u.push(new Qp(b,c))}
function cq(a,b,c){var d=Object.keys(a.j.f);if(0<d.length){var e=Pp(a.b);d.forEach(function(a){this.A[a]=e;var d=this.D[a];if(d&&d.aa<c&&(d=this.h[a])){var f=this.f[a];f||(f=this.f[a]=[]);for(var g;g=d.shift();)g.ud=!1,f.push(g)}this.D[a]={P:b,aa:c}},a)}for(var d=a.G,f;f=a.u.shift();){f.Le=d;f.P=b;f.aa=c;var g=void 0;f.ud?(g=a.h[f.Gc])||(g=a.h[f.Gc]=[]):(g=a.f[f.Gc])||(g=a.f[f.Gc]=[]);g.every(function(a){return!(f===a||a&&f.Gc===a.Gc&&f.ud===a.ud&&f.P===a.P&&f.aa===a.aa)})&&g.push(f)}a.j=null}
function dq(a,b){var c=[];Object.keys(b.f).forEach(function(a){(a=this.f[a])&&(c=c.concat(a))},a);c.sort(function(a,b){return a.P-b.P||a.aa-b.aa});var d=[],e=null;c.forEach(function(a){e&&e.P===a.P&&e.aa===a.aa?e.Yd.push(a):(e={P:a.P,aa:a.aa,Le:a.Le,Yd:[a]},d.push(e))});return d}function eq(a,b){a.H.push(a.g);a.g=b}function Vp(a,b,c,d){"pages"===b&&a.Ne.push({Mc:d,format:c})}function fq(a){return a.N.bind(a)}
Zp.prototype.N=function(a,b,c){return 0<=this.Ne.findIndex(function(b){return b.Mc===a})?(c=c.createElement("span"),c.textContent=b,c.setAttribute("data-vivliostyle-pages-counter",a.g),c):null};function gq(a,b){var c=a.b.page[0];Array.from(b.root.querySelectorAll("[data-vivliostyle-pages-counter]")).forEach(function(a){var b=a.getAttribute("data-vivliostyle-pages-counter"),d=this.Ne.findIndex(function(a){return a.Mc.g===b});a.textContent=this.Ne[d].format([c])},a)}
function hq(a,b){this.f=a;this.aa=b}hq.prototype.b=function(a){if(!a||a.K)return!0;a=a.B;if(!a||1!==a.nodeType)return!0;a=a.getAttribute("id")||a.getAttribute("name");return a&&(this.f.h[a]||this.f.f[a])?(a=this.f.D[a])?this.aa>=a.aa:!0:!0};var iq=1;function jq(a,b,c,d,e){this.b={};this.children=[];this.g=null;this.index=0;this.f=a;this.name=b;this.mc=c;this.Pa=d;this.parent=e;this.j="p"+iq++;e&&(this.index=e.children.length,e.children.push(this))}jq.prototype.h=function(){throw Error("E_UNEXPECTED_CALL");};jq.prototype.clone=function(){throw Error("E_UNEXPECTED_CALL");};function kq(a,b){var c=a.b,d=b.b,e;for(e in c)Object.prototype.hasOwnProperty.call(c,e)&&(d[e]=c[e])}
function lq(a,b){for(var c=0;c<a.children.length;c++)a.children[c].clone({parent:b})}function mq(a){jq.call(this,a,null,null,[],null);this.b.width=new V($d,0);this.b.height=new V(ae,0)}v(mq,jq);
function nq(a,b){this.g=b;var c=this;Hb.call(this,a,function(a,b){var d=a.match(/^([^.]+)\.([^.]+)$/);if(d){var e=c.g.l[d[1]];if(e&&(e=this.ob[e])){if(b){var d=d[2],h=e.la[d];if(h)e=h;else{switch(d){case "columns":var h=e.f.f,l=new Ac(h,0),k=oq(e,"column-count"),m=oq(e,"column-width"),p=oq(e,"column-gap"),h=B(h,Cc(h,new xc(h,"min",[l,k]),y(h,m,p)),p)}h&&(e.la[d]=h);e=h}}else e=oq(e,d[2]);return e}}return null})}v(nq,Hb);
function pq(a,b,c,d,e,f,g){a=a instanceof nq?a:new nq(a,this);jq.call(this,a,b,c,d,e);this.g=this;this.ia=f;this.ba=g;this.b.width=new V($d,0);this.b.height=new V(ae,0);this.b["wrap-flow"]=new V(Zc,0);this.b.position=new V(Hd,0);this.b.overflow=new V(Xd,0);this.b.top=new V(new F(-1,"px"),0);this.l={}}v(pq,jq);pq.prototype.h=function(a){return new qq(a,this)};pq.prototype.clone=function(a){a=new pq(this.f,this.name,a.mc||this.mc,this.Pa,this.parent,this.ia,this.ba);kq(this,a);lq(this,a);return a};
function rq(a,b,c,d,e){jq.call(this,a,b,c,d,e);this.g=e.g;b&&(this.g.l[b]=this.j);this.b["wrap-flow"]=new V(Zc,0)}v(rq,jq);rq.prototype.h=function(a){return new sq(a,this)};rq.prototype.clone=function(a){a=new rq(a.parent.f,this.name,this.mc,this.Pa,a.parent);kq(this,a);lq(this,a);return a};function tq(a,b,c,d,e){jq.call(this,a,b,c,d,e);this.g=e.g;b&&(this.g.l[b]=this.j)}v(tq,jq);tq.prototype.h=function(a){return new uq(a,this)};
tq.prototype.clone=function(a){a=new tq(a.parent.f,this.name,this.mc,this.Pa,a.parent);kq(this,a);lq(this,a);return a};function Y(a,b,c){return b&&b!==Zc?b.Aa(a,c):null}function vq(a,b,c){return b&&b!==Zc?b.Aa(a,c):a.b}function wq(a,b,c){return b?b===Zc?null:b.Aa(a,c):a.b}function xq(a,b,c,d){return b&&c!==J?b.Aa(a,d):a.b}function yq(a,b,c){return b?b===Yd?a.j:b===md?a.h:b.Aa(a,a.b):c}
function zq(a,b){this.g=a;this.f=b;this.J={};this.style={};this.A=this.D=null;this.children=[];this.N=this.S=this.h=this.j=!1;this.G=this.H=0;this.F=null;this.sa={};this.la={};this.ua=this.Z=this.b=!1;a&&a.children.push(this)}function Aq(a){a.H=0;a.G=0}function Bq(a,b,c){b=oq(a,b);c=oq(a,c);if(!b||!c)throw Error("E_INTERNAL");return y(a.f.f,b,c)}
function oq(a,b){var c=a.sa[b];if(c)return c;var d=a.style[b];d&&(c=d.Aa(a.f.f,a.f.f.b));switch(b){case "margin-left-edge":c=oq(a,"left");break;case "margin-top-edge":c=oq(a,"top");break;case "margin-right-edge":c=Bq(a,"border-right-edge","margin-right");break;case "margin-bottom-edge":c=Bq(a,"border-bottom-edge","margin-bottom");break;case "border-left-edge":c=Bq(a,"margin-left-edge","margin-left");break;case "border-top-edge":c=Bq(a,"margin-top-edge","margin-top");break;case "border-right-edge":c=
Bq(a,"padding-right-edge","border-right-width");break;case "border-bottom-edge":c=Bq(a,"padding-bottom-edge","border-bottom-width");break;case "padding-left-edge":c=Bq(a,"border-left-edge","border-left-width");break;case "padding-top-edge":c=Bq(a,"border-top-edge","border-top-width");break;case "padding-right-edge":c=Bq(a,"right-edge","padding-right");break;case "padding-bottom-edge":c=Bq(a,"bottom-edge","padding-bottom");break;case "left-edge":c=Bq(a,"padding-left-edge","padding-left");break;case "top-edge":c=
Bq(a,"padding-top-edge","padding-top");break;case "right-edge":c=Bq(a,"left-edge","width");break;case "bottom-edge":c=Bq(a,"top-edge","height")}if(!c){if("extent"==b)d=a.b?"width":"height";else if("measure"==b)d=a.b?"height":"width";else{var e=a.b?Sh:Th,d=b,f;for(f in e)d=d.replace(f,e[f])}d!=b&&(c=oq(a,d))}c&&(a.sa[b]=c);return c}
function Cq(a){var b=a.f.f,c=a.style,d=yq(b,c.enabled,b.j),e=Y(b,c.page,b.b);if(e)var f=new vc(b,"page-number"),d=Bc(b,d,new nc(b,e,f));(e=Y(b,c["min-page-width"],b.b))&&(d=Bc(b,d,new mc(b,new vc(b,"page-width"),e)));(e=Y(b,c["min-page-height"],b.b))&&(d=Bc(b,d,new mc(b,new vc(b,"page-height"),e)));d=a.Y(d);c.enabled=new G(d)}zq.prototype.Y=function(a){return a};
zq.prototype.Ae=function(){var a=this.f.f,b=this.style,c=this.g?this.g.style.width.Aa(a,null):null,d=Y(a,b.left,c),e=Y(a,b["margin-left"],c),f=xq(a,b["border-left-width"],b["border-left-style"],c),g=vq(a,b["padding-left"],c),h=Y(a,b.width,c),l=Y(a,b["max-width"],c),k=vq(a,b["padding-right"],c),m=xq(a,b["border-right-width"],b["border-right-style"],c),p=Y(a,b["margin-right"],c),q=Y(a,b.right,c),r=y(a,f,g),z=y(a,f,k);d&&q&&h?(r=B(a,c,y(a,h,y(a,y(a,d,r),z))),e?p?q=B(a,r,p):p=B(a,r,y(a,q,e)):(r=B(a,r,
q),p?e=B(a,r,p):p=e=Cc(a,r,new Ib(a,.5)))):(e||(e=a.b),p||(p=a.b),d||q||h||(d=a.b),d||h?d||q?h||q||(h=this.D,this.j=!0):d=a.b:(h=this.D,this.j=!0),r=B(a,c,y(a,y(a,e,r),y(a,p,z))),this.j&&(l||(l=B(a,r,d?d:q)),this.b||!Y(a,b["column-width"],null)&&!Y(a,b["column-count"],null)||(h=l,this.j=!1)),d?h?q||(q=B(a,r,y(a,d,h))):h=B(a,r,y(a,d,q)):d=B(a,r,y(a,q,h)));a=vq(a,b["snap-width"]||(this.g?this.g.style["snap-width"]:null),c);b.left=new G(d);b["margin-left"]=new G(e);b["border-left-width"]=new G(f);b["padding-left"]=
new G(g);b.width=new G(h);b["max-width"]=new G(l?l:h);b["padding-right"]=new G(k);b["border-right-width"]=new G(m);b["margin-right"]=new G(p);b.right=new G(q);b["snap-width"]=new G(a)};
zq.prototype.Be=function(){var a=this.f.f,b=this.style,c=this.g?this.g.style.width.Aa(a,null):null,d=this.g?this.g.style.height.Aa(a,null):null,e=Y(a,b.top,d),f=Y(a,b["margin-top"],c),g=xq(a,b["border-top-width"],b["border-top-style"],c),h=vq(a,b["padding-top"],c),l=Y(a,b.height,d),k=Y(a,b["max-height"],d),m=vq(a,b["padding-bottom"],c),p=xq(a,b["border-bottom-width"],b["border-bottom-style"],c),q=Y(a,b["margin-bottom"],c),r=Y(a,b.bottom,d),z=y(a,g,h),u=y(a,p,m);e&&r&&l?(d=B(a,d,y(a,l,y(a,y(a,e,z),
u))),f?q?r=B(a,d,f):q=B(a,d,y(a,r,f)):(d=B(a,d,r),q?f=B(a,d,q):q=f=Cc(a,d,new Ib(a,.5)))):(f||(f=a.b),q||(q=a.b),e||r||l||(e=a.b),e||l?e||r?l||r||(l=this.A,this.h=!0):e=a.b:(l=this.A,this.h=!0),d=B(a,d,y(a,y(a,f,z),y(a,q,u))),this.h&&(k||(k=B(a,d,e?e:r)),this.b&&(Y(a,b["column-width"],null)||Y(a,b["column-count"],null))&&(l=k,this.h=!1)),e?l?r||(r=B(a,d,y(a,e,l))):l=B(a,d,y(a,r,e)):e=B(a,d,y(a,r,l)));a=vq(a,b["snap-height"]||(this.g?this.g.style["snap-height"]:null),c);b.top=new G(e);b["margin-top"]=
new G(f);b["border-top-width"]=new G(g);b["padding-top"]=new G(h);b.height=new G(l);b["max-height"]=new G(k?k:l);b["padding-bottom"]=new G(m);b["border-bottom-width"]=new G(p);b["margin-bottom"]=new G(q);b.bottom=new G(r);b["snap-height"]=new G(a)};
function Dq(a){var b=a.f.f,c=a.style;a=Y(b,c[a.b?"height":"width"],null);var d=Y(b,c["column-width"],a),e=Y(b,c["column-count"],null),f;(f=(f=c["column-gap"])&&f!==Dd?f.Aa(b,null):null)||(f=new uc(b,1,"em"));d&&!e&&(e=new xc(b,"floor",[Dc(b,y(b,a,f),y(b,d,f))]),e=new xc(b,"max",[b.f,e]));e||(e=b.f);d=B(b,Dc(b,y(b,a,f),e),f);c["column-width"]=new G(d);c["column-count"]=new G(e);c["column-gap"]=new G(f)}function Eq(a,b,c,d){a=a.style[b].Aa(a.f.f,null);return Xb(a,c,d,{})}
function Fq(a,b){b.ob[a.f.j]=a;var c=a.f.f,d=a.style,e=a.g?Gq(a.g,b):null,e=Vj(a.J,b,e,!1);a.b=Tj(e,b,a.g?a.g.b:!1);a.Z=Uj(e,b,a.g?a.g.Z:!1);Zj(e,d,a.b,a.Z,function(a,b){return b.value});a.D=new Kb(c,function(){return a.H},"autoWidth");a.A=new Kb(c,function(){return a.G},"autoHeight");a.Ae();a.Be();Dq(a);Cq(a)}function Hq(a,b,c){(a=a.style[c])&&(a=ng(b,a,c));return a}function Z(a,b,c){(a=a.style[c])&&(a=ng(b,a,c));return Vc(a,b)}
function Gq(a,b){var c;a:{if(c=a.J["region-id"]){for(var d=[],e=0;e<c.length;e++){var f=c[e].evaluate(b,"");f&&f!==C&&d.push(f)}if(d.length){c=d;break a}}c=null}if(c){d=[];for(e=0;e<c.length;e++)d[e]=c[e].toString();return d}return null}function Iq(a,b,c,d,e){if(a=Hq(a,b,d))a.Ac()&&Pb(a.ka)&&(a=new F(Vc(a,b),"px")),"font-family"===d&&(a=vm(e,a)),x(c,d,a.toString())}
function Jq(a,b,c){var d=Z(a,b,"left"),e=Z(a,b,"margin-left"),f=Z(a,b,"padding-left"),g=Z(a,b,"border-left-width");a=Z(a,b,"width");zl(c,d,a);x(c.element,"margin-left",e+"px");x(c.element,"padding-left",f+"px");x(c.element,"border-left-width",g+"px");c.marginLeft=e;c.Z=g;c.H=f}
function Kq(a,b,c){var d=Z(a,b,"right"),e=Z(a,b,"snap-height"),f=Z(a,b,"margin-right"),g=Z(a,b,"padding-right");b=Z(a,b,"border-right-width");x(c.element,"margin-right",f+"px");x(c.element,"padding-right",g+"px");x(c.element,"border-right-width",b+"px");c.marginRight=f;c.Za=b;a.b&&0<e&&(a=d+vl(c),a-=Math.floor(a/e)*e,0<a&&(c.Od=e-a,g+=c.Od));c.Y=g;c.Rd=e}
function Lq(a,b,c){var d=Z(a,b,"snap-height"),e=Z(a,b,"top"),f=Z(a,b,"margin-top"),g=Z(a,b,"padding-top");b=Z(a,b,"border-top-width");c.top=e;c.marginTop=f;c.ca=b;c.Mb=d;!a.b&&0<d&&(a=e+sl(c),a-=Math.floor(a/d)*d,0<a&&(c.yb=d-a,g+=c.yb));c.J=g;x(c.element,"top",e+"px");x(c.element,"margin-top",f+"px");x(c.element,"padding-top",g+"px");x(c.element,"border-top-width",b+"px")}
function Mq(a,b,c){var d=Z(a,b,"margin-bottom"),e=Z(a,b,"padding-bottom"),f=Z(a,b,"border-bottom-width");a=Z(a,b,"height")-c.yb;x(c.element,"height",a+"px");x(c.element,"margin-bottom",d+"px");x(c.element,"padding-bottom",e+"px");x(c.element,"border-bottom-width",f+"px");c.height=a-c.yb;c.marginBottom=d;c.Ba=f;c.S=e}function Nq(a,b,c){a.b?(Lq(a,b,c),Mq(a,b,c)):(Kq(a,b,c),Jq(a,b,c))}
function Oq(a,b,c){x(c.element,"border-top-width","0px");var d=Z(a,b,"max-height");a.S?yl(c,0,d):(Lq(a,b,c),d-=c.yb,c.height=d,x(c.element,"height",d+"px"))}function Pq(a,b,c){x(c.element,"border-left-width","0px");var d=Z(a,b,"max-width");a.N?zl(c,0,d):(Kq(a,b,c),d-=c.Od,c.width=d,a=Z(a,b,"right"),x(c.element,"right",a+"px"),x(c.element,"width",d+"px"))}
var Qq="border-left-style border-right-style border-top-style border-bottom-style border-left-color border-right-color border-top-color border-bottom-color outline-style outline-color outline-width overflow visibility".split(" "),Rq="border-top-left-radius border-top-right-radius border-bottom-right-radius border-bottom-left-radius border-image-source border-image-slice border-image-width border-image-outset border-image-repeat background-attachment background-color background-image background-repeat background-position background-clip background-origin background-size opacity z-index".split(" "),
Sq="color font-family font-size font-style font-weight font-variant line-height letter-spacing text-align text-decoration text-indent text-transform white-space word-spacing".split(" "),Tq=["width","height"],Uq=["transform","transform-origin"];
zq.prototype.kc=function(a,b,c,d){this.g&&this.b==this.g.b||x(b.element,"writing-mode",this.b?"vertical-rl":"horizontal-tb");(this.b?this.j:this.h)?this.b?Pq(this,a,b):Oq(this,a,b):(this.b?Kq(this,a,b):Lq(this,a,b),this.b?Jq(this,a,b):Mq(this,a,b));(this.b?this.h:this.j)?this.b?Oq(this,a,b):Pq(this,a,b):Nq(this,a,b);for(c=0;c<Qq.length;c++)Iq(this,a,b.element,Qq[c],d)};function Vq(a,b,c,d){for(var e=0;e<Sq.length;e++)Iq(a,b,c.element,Sq[e],d)}
function Wq(a,b,c,d){for(var e=0;e<Tq.length;e++)Iq(a,b,c,Tq[e],d)}
zq.prototype.Qd=function(a,b,c,d,e,f,g){this.b?this.H=b.h+b.Od:this.G=b.h+b.yb;var h=(this.b||!d)&&this.h,l=(!this.b||!d)&&this.j;if(l||h)l&&x(b.element,"width","auto"),h&&x(b.element,"height","auto"),d=Kk(f,d?d.element:b.element),l&&(this.H=Math.ceil(d.right-d.left-b.H-b.Z-b.Y-b.Za),this.b&&(this.H+=b.Od)),h&&(this.G=d.bottom-d.top-b.J-b.ca-b.S-b.Ba,this.b||(this.G+=b.yb));(this.b?this.h:this.j)&&Nq(this,a,b);if(this.b?this.j:this.h){if(this.b?this.N:this.S)this.b?Kq(this,a,b):Lq(this,a,b);this.b?
Jq(this,a,b):Mq(this,a,b)}if(1<e&&(l=Z(this,a,"column-rule-width"),d=Hq(this,a,"column-rule-style"),f=Hq(this,a,"column-rule-color"),0<l&&d&&d!=J&&f!=Ud))for(var k=Z(this,a,"column-gap"),m=this.b?b.height:b.width,p=this.b?"border-top":"border-left",h=1;h<e;h++){var q=(m+k)*h/e-k/2+b.H-l/2,r=b.height+b.J+b.S,z=b.element.ownerDocument.createElement("div");x(z,"position","absolute");x(z,this.b?"left":"top","0px");x(z,this.b?"top":"left",q+"px");x(z,this.b?"height":"width","0px");x(z,this.b?"width":"height",
r+"px");x(z,p,l+"px "+d.toString()+(f?" "+f.toString():""));b.element.insertBefore(z,b.element.firstChild)}for(h=0;h<Rq.length;h++)Iq(this,a,b.element,Rq[h],g);for(h=0;h<Uq.length;h++)e=b,g=Uq[h],l=c.l,(d=Hq(this,a,g))&&l.push(new Ck(e.element,g,d))};
zq.prototype.l=function(a,b){var c=this.J,d=this.f.b,e;for(e in d)Zh(e)&&$h(c,e,d[e]);if("background-host"==this.f.mc)for(e in b)if(e.match(/^background-/)||"writing-mode"==e)c[e]=b[e];if("layout-host"==this.f.mc)for(e in b)e.match(/^background-/)||"writing-mode"==e||(c[e]=b[e]);yj(a,this.f.Pa,null,c);c.content&&(c.content=c.content.Pd(new bj(a,null,a.xb)));Fq(this,a.l);c=t(this.f.children);for(d=c.next();!d.done;d=c.next())d.value.h(this).l(a,b);Ij(a)};
function Xq(a,b){a.j&&(a.N=Eq(a,"right",a.D,b)||Eq(a,"margin-right",a.D,b)||Eq(a,"border-right-width",a.D,b)||Eq(a,"padding-right",a.D,b));a.h&&(a.S=Eq(a,"top",a.A,b)||Eq(a,"margin-top",a.A,b)||Eq(a,"border-top-width",a.A,b)||Eq(a,"padding-top",a.A,b));for(var c=t(a.children),d=c.next();!d.done;d=c.next())Xq(d.value,b)}function Yq(a){zq.call(this,null,a)}v(Yq,zq);Yq.prototype.l=function(a,b){zq.prototype.l.call(this,a,b);this.children.sort(function(a,b){return b.f.ba-a.f.ba||a.f.index-b.f.index})};
function qq(a,b){zq.call(this,a,b);this.F=this}v(qq,zq);qq.prototype.Y=function(a){var b=this.f.g;b.ia&&(a=Bc(b.f,a,b.ia));return a};qq.prototype.ca=function(){};function sq(a,b){zq.call(this,a,b);this.F=a.F}v(sq,zq);function uq(a,b){zq.call(this,a,b);this.F=a.F}v(uq,zq);
function Zq(a,b,c,d){var e=null;c instanceof Pc&&(e=[c]);c instanceof Ic&&(e=c.values);if(e)for(a=a.f.f,c=0;c<e.length;c++)if(e[c]instanceof Pc){var f=Fb(e[c].name,"enabled"),f=new vc(a,f);d&&(f=new dc(a,f));b=Bc(a,b,f)}return b}
uq.prototype.Y=function(a){var b=this.f.f,c=this.style,d=yq(b,c.required,b.h)!==b.h;if(d||this.h){var e=c["flow-from"],e=e?e.Aa(b,b.b):new Ib(b,"body"),e=new xc(b,"has-content",[e]);a=Bc(b,a,e)}a=Zq(this,a,c["required-partitions"],!1);a=Zq(this,a,c["conflicting-partitions"],!0);d&&(c=(c=this.F.style.enabled)?c.Aa(b,null):b.j,c=Bc(b,c,a),this.F.style.enabled=new G(c));return a};uq.prototype.kc=function(a,b,c,d,e){x(b.element,"overflow","hidden");zq.prototype.kc.call(this,a,b,c,d,e)};
function $q(a,b,c,d){Hf.call(this,a,b,!1);this.target=c;this.b=d}v($q,If);$q.prototype.Qb=function(a,b,c){Eh(this.b,a,b,c,this)};$q.prototype.fe=function(a,b){Jf(this,"E_INVALID_PROPERTY "+a+": "+b.toString())};$q.prototype.kd=function(a,b){Jf(this,"E_INVALID_PROPERTY_VALUE "+a+": "+b.toString())};$q.prototype.Sb=function(a,b,c){this.target.b[a]=new V(b,c?50331648:67108864)};function ar(a,b,c,d){$q.call(this,a,b,c,d)}v(ar,$q);
function br(a,b,c,d){$q.call(this,a,b,c,d);c.b.width=new V(Zd,0);c.b.height=new V(Zd,0)}v(br,$q);br.prototype.zd=function(a,b,c){a=new tq(this.f,a,b,c,this.target);Gf(this.oa,new ar(this.f,this.oa,a,this.b))};br.prototype.yd=function(a,b,c){a=new rq(this.f,a,b,c,this.target);a=new br(this.f,this.oa,a,this.b);Gf(this.oa,a)};function cr(a,b,c,d){$q.call(this,a,b,c,d)}v(cr,$q);cr.prototype.zd=function(a,b,c){a=new tq(this.f,a,b,c,this.target);Gf(this.oa,new ar(this.f,this.oa,a,this.b))};
cr.prototype.yd=function(a,b,c){a=new rq(this.f,a,b,c,this.target);a=new br(this.f,this.oa,a,this.b);Gf(this.oa,a)};function dr(a){a=a.toString();switch(a){case "inline-flex":a="flex";break;case "inline-grid":a="grid";break;case "inline-table":a="table";break;case "inline":case "table-row-group":case "table-column":case "table-column-group":case "table-header-group":case "table-footer-group":case "table-row":case "table-cell":case "table-caption":case "inline-block":a="block"}return E(a)}function Xl(a,b,c,d){if(a!==J)if(b===Wc||b===nd)c=J,a=dr(a);else if(c&&c!==J||d)a=dr(a);return{display:a,position:b,ja:c}}
function er(a){switch(a.toString()){case "inline":case "inline-block":case "inline-list-item":case "inline-flex":case "inline-grid":case "ruby":case "inline-table":return!0;default:return!1}}function fr(a,b,c,d,e,f,g){e=e||f||sd;return!!g||!!c&&c!==J||b===Wc||b===nd||a===vd||a===Qd||a===Pd||a==od||(a===bd||a===Bd)&&!!d&&d!==Xd||!!f&&e!==f};function gr(a,b,c){return a.replace(/[uU][rR][lL]\(\s*\"((\\([^0-9a-fA-F]+|[0-9a-fA-F]+\s*)|[^\"\r\n])+)\"/gm,function(a,e){return'url("'+c.oc(e,b)+'"'}).replace(/[uU][rR][lL]\(\s*\'((\\([^0-9a-fA-F]+|[0-9a-fA-F]+\s*)|[^\'\r\n])+)\'/gm,function(a,e){return"url('"+c.oc(e,b)+"'"}).replace(/[uU][rR][lL]\(\s*((\\([^0-9a-fA-F]+|[0-9a-fA-F]+\s*)|[^\"\'\r\n\)\s])+)/gm,function(a,e){return"url("+c.oc(e,b)})}
gr=function(a,b,c){return a.replace(/[uU][rR][lL]\(\s*\"((\\([^0-9a-fA-F]+|[0-9a-fA-F]+\s*)|[^\"\r\n])+)\"/gm,function(a,e){return'url("'+c.oc(e,b)+'"'}).replace(/[uU][rR][lL]\(\s*\'((\\([^0-9a-fA-F]+|[0-9a-fA-F]+\s*)|[^\'\r\n])+)\'/gm,function(a,e){return"url('"+c.oc(e,b)+"'"}).replace(/[uU][rR][lL]\(\s*((\\([^0-9a-fA-F]+|[0-9a-fA-F]+\s*)|[^\"\'\r\n\)\s])+)/gm,function(a,e){return"url("+c.oc(e,b)})};var hr={"text-indent":"0px","margin-top":"0px","padding-top":"0px","border-top-width":"0px","border-top-style":"none","border-top-color":"transparent","border-top-left-radius":"0px","border-top-right-radius":"0px"},ir={"text-indent":"0px","margin-right":"0px","padding-right":"0px","border-right-width":"0px","border-right-style":"none","border-right-color":"transparent","border-top-right-radius":"0px","border-bottom-right-radius":"0px"},jr={"margin-top":"0px"},kr={"margin-right":"0px"},lr={};
function mr(a){a.addEventListener("load",function(){a.contentWindow.navigator.epubReadingSystem={name:"adapt",version:"0.1",layoutStyle:"paginated",hasFeature:function(a){switch(a){case "mouse-events":return!0}return!1}}},!1)}var nr=(new DOMParser).parseFromString('<root xmlns="http://www.pyroxy.com/ns/shadow"/>',"text/xml"),or="footnote-marker first-5-lines first-4-lines first-3-lines first-2-lines first-line first-letter before  after".split(" ");
function pr(a,b){a.setAttribute("data-adapt-pseudo",b)}function qr(a,b,c,d,e){this.style=b;this.element=a;this.b=c;this.g=d;this.h=e;this.f={}}qr.prototype.l=function(a){var b=a.getAttribute("data-adapt-pseudo")||"";this.b&&b&&b.match(/after$/)&&(this.style=this.b.l(this.element,!0),this.b=null);a=this.style._pseudos[b]||{};if(b.match(/^first-/)&&!a["x-first-pseudo"]){var c=1;if("first-letter"==b)c=0;else if(b=b.match(/^first-([0-9]+)-lines$/))c=b[1]-0;a["x-first-pseudo"]=new V(new Rc(c),0)}return a};
qr.prototype.sa=function(a,b){var c=a.getAttribute("data-adapt-pseudo")||"";this.f[c]||(this.f[c]=!0,(c=b.content)&&Hl(c)&&c.fa(new Gl(a,this.g,c,this.h)))};function rr(a,b,c,d,e,f,g,h,l,k,m,p,q){this.Pb={};this.G=a;this.b=b;this.viewport=c;this.D=c.b;this.j=d;this.u=fq(d.Ba.b);this.l=e;this.da=f;this.H=g;this.A=h;this.J=l;this.page=k;this.g=m;this.F=p;this.h=q;this.N=this.w=null;this.f=!1;this.M=null;this.na=0;this.B=null}v(rr,fb);
rr.prototype.clone=function(){return new rr(this.G,this.b,this.viewport,this.j,this.l,this.da,this.H,this.A,this.J,this.page,this.g,this.F,this.h)};function sr(a,b,c,d){a=a._pseudos;if(!a)return null;var e={},f={},g;for(g in a)f.ed=e[g]={},Yj(f.ed,a[g],d),Wj(f.ed,d,a[g]),Xj(a[g],b,c,function(a){return function(b,c){Yj(a.ed,c,d);tr(c,function(b){Yj(a.ed,b,d)})}}(f)),f={ed:f.ed};return e}
function ur(a,b,c,d,e,f){var g=L("createRefShadow");a.da.u.load(b).then(function(h){if(h){var l=mk(h,b);if(l){var k=a.J,m=k.N[h.url];if(!m){var m=k.style.j.f[h.url],p=new Qb(0,k.jc(),k.ic(),k.u),m=new bm(h,m.g,m.f,p,k.l,m.l,new Rp(k.h,h.url),new Sp(k.h,h.url,m.f,m.b));k.N[h.url]=m}f=new $k(d,l,h,e,f,c,m)}}O(g,f)});return g.result()}
function vr(a,b,c,d,e,f,g,h){var l=L("createShadows"),k=e.template,m;k instanceof Tc?m=ur(a,k.url,2,b,h,null):m=M(null);m.then(function(k){var m=null;if("http://www.pyroxy.com/ns/shadow"==b.namespaceURI&&"include"==b.localName){var p=b.getAttribute("href"),z=null;p?z=h?h.da:a.da:h&&(p="http://www.w3.org/1999/xhtml"==h.oa.namespaceURI?h.oa.getAttribute("href"):h.oa.getAttributeNS("http://www.w3.org/1999/xlink","href"),z=h.pd?h.pd.da:a.da);p&&(p=Ba(p,z.url),m=ur(a,p,3,b,h,k))}m||(m=M(k));var u=null;
m.then(function(c){e.display===Qd?u=ur(a,Ba("user-agent.xml#table-cell",Aa),2,b,h,c):u=M(c)});u.then(function(k){var m=sr(d,a.l,a.f,g);if(m){for(var p=[],q=nr.createElementNS("http://www.pyroxy.com/ns/shadow","root"),r=q,u=t(or),z=u.next();!z.done;z=u.next()){var z=z.value,A;if(z){if(!m[z])continue;if(!("footnote-marker"!=z||c&&a.f))continue;if(z.match(/^first-/)&&(A=e.display,!A||A===ud))continue;if("before"===z||"after"===z)if(A=m[z].content,!A||A===Dd||A===J)continue;p.push(z);A=nr.createElementNS("http://www.w3.org/1999/xhtml",
"span");pr(A,z)}else A=nr.createElementNS("http://www.pyroxy.com/ns/shadow","content");r.appendChild(A);z.match(/^first-/)&&(r=A)}k=p.length?new $k(b,q,null,h,k,2,new qr(b,d,f,g,a.u)):k}O(l,k)})});return l.result()}function zo(a,b,c){a.N=b;a.f=c}
function wr(a,b,c,d,e){var f=a.b;d=Vj(d,f,a.l,a.f);b=Tj(d,f,b);c=Uj(d,f,c);Zj(d,e,b,c,function(b,c){var d=c.evaluate(f,b);"font-family"==b&&(d=vm(a.H,d));return d});var g=Xl(e.display||ud,e.position,e["float"],a.M===a.da.root);["display","position","float"].forEach(function(a){g[a]&&(e[a]=g[a])});return b}
function xr(a,b){for(var c=a.w.M,d=[],e=null,f=a.w.wa,g=-1;c&&1==c.nodeType;){var h=f&&f.root==c;if(!h||2==f.type){var l=(f?f.b:a.j).l(c,!1);d.push(l);e=e||Qa(c)}h?(c=f.oa,f=f.pd):(c=c.parentNode,g++)}c=Sb(a.b,"em",!g);c={"font-size":new V(new F(c,"px"),0)};f=new fi(c,a.b);for(g=d.length-1;0<=g;--g){var h=d[g],l=[],k;for(k in h)Gh[k]&&l.push(k);l.sort(de);for(var l=t(l),m=l.next();!m.done;m=l.next()){m=m.value;f.b=m;var p=h[m];p.value!==td&&(c[m]=p.Pd(f))}}for(var q in b)Gh[q]||(c[q]=b[q]);return{lang:e,
mb:c}}var yr={a:"a",sub:"sub",sup:"sup",table:"table",tr:"tr",td:"td",th:"th",code:"code",body:"div",p:"p",v:"p",date:"p",emphasis:"em",strong:"strong",style:"span",strikethrough:"del"};function zr(a,b){b=Ba(b,a.da.url);return a.F[b]||b}function Ar(a){a.w.lang=Qa(a.w.M)||a.w.parent&&a.w.parent.lang||a.w.lang}
function Br(a,b){var c=Ih().filter(function(a){return b[a]});if(c.length){var d=a.w.h;if(a.w.parent){var d=a.w.h={},e;for(e in a.w.parent.h)d[e]=a.w.parent.h[e]}c.forEach(function(a){var c=b[a];if(c){if(c instanceof Rc)d[a]=c.L;else if(c instanceof Pc)d[a]=c.name;else if(c instanceof F)switch(c.ka){case "dpi":case "dpcm":case "dppx":d[a]=c.L*Ob[c.ka]}else d[a]=c;delete b[a]}})}}
function Cr(a,b,c,d,e,f){for(var g=he("RESOLVE_FORMATTING_CONTEXT"),h=0;h<g.length;h++){var l=g[h](a,b,c,d,e,f);if(l){a.C=l;break}}}
function Dr(a,b,c){var d=!0,e=L("createElementView"),f=a.M,g=a.w.wa?a.w.wa.b:a.j,h=g.l(f,!1);if(!a.w.wa){var l=hk(a.da,f);Er(l,a.w.Sa,0)}var k={};a.w.parent||(l=xr(a,h),h=l.mb,a.w.lang=l.lang);var m=h["float-reference"]&&Wm(h["float-reference"].value.toString());a.w.parent&&m&&Xm(m)&&(l=xr(a,h),h=l.mb,a.w.lang=l.lang);a.w.b=wr(a,a.w.b,"rtl"===a.w.direction,h,k);g.sa(f,k);Br(a,k);Ar(a);k.direction&&(a.w.direction=k.direction.toString());if((l=k["flow-into"])&&l.toString()!=a.G)return O(e,!1),e.result();
var p=k.display;if(p===J)return O(e,!1),e.result();var q=!a.w.parent;a.w.H=p===od;vr(a,f,q,h,k,g,a.b,a.w.wa).then(function(l){a.w.Ja=l;l=k.position;var r=k["float"],u=k.clear,A=a.w.b?Wd:sd,D=a.w.parent?a.w.parent.b?Wd:sd:A,I="true"===f.getAttribute("data-vivliostyle-flow-root");a.w.hd=fr(p,l,r,k.overflow,A,D,I);a.w.S=l===Hd||l===Wc||l===nd;!hl(a.w)||r===pd||m&&Xm(m)||(u=r=null);A=r===zd||r===Id||r===Td||r===fd||r===xd||r===wd||r===dd||r===cd||r===Ld||r===pd;r&&(delete k["float"],r===pd&&(a.f?(A=!1,
k.display=bd):k.display=ud));u&&(u===td&&a.w.parent&&a.w.parent.l&&(u=E(a.w.parent.l)),u===zd||u===Id||u===Td||u===fd||u===ed||u===Xc||u===Jd)&&(delete k.clear,k.display&&k.display!=ud&&(a.w.l=u.toString()));var K=p===Bd&&k["ua-list-item-count"];(A||k["break-inside"]&&k["break-inside"]!==Zc)&&a.w.j++;p&&p!==ud&&er(p)&&a.w.j++;if(!(u=!A&&!p||er(p)))a:switch(p.toString()){case "ruby-base":case "ruby-text":case "ruby-base-container":case "ruby-text-container":u=!0;break a;default:u=!1}a.w.ya=u;a.w.display=
p?p.toString():"inline";a.w.Ca=A?r.toString():null;a.w.W=m||bl;a.w.N=k["float-min-wrap-block"]||null;a.w.ca=k["column-span"];if(!a.w.ya){if(u=k["break-after"])a.w.G=u.toString();if(u=k["break-before"])a.w.g=u.toString()}a.w.Z=k["vertical-align"]&&k["vertical-align"].toString()||"baseline";a.w.la=k["caption-side"]&&k["caption-side"].toString()||"top";u=k["border-collapse"];if(!u||u===E("separate"))if(A=k["border-spacing"])A.Ud()?(u=A.values[0],A=A.values[1]):u=A,u.Ac()&&(a.w.sa=Vc(u,a.b)),A.Ac()&&
(a.w.ta=Vc(A,a.b));a.w.Y=k["footnote-policy"];if(u=k["x-first-pseudo"])a.w.f=new al(a.w.parent?a.w.parent.f:null,u.L);a.w.ya||Fr(a,f,h,g,a.b);if(u=k["white-space"])u=Lk(u.toString()),null!==u&&(a.w.uc=u);(u=k["hyphenate-character"])&&u!==Zc&&(a.w.F=u.Xc);u=k["overflow-wrap"]||["word-wrap"];a.w.A=k["word-break"]===hd||u===id;Cr(a.w,b,p,l,r,q);a.w.parent&&a.w.parent.C&&(b=a.w.parent.C.ff(a.w,b));a.w.ya||(a.w.u=Gr(k),Hr(a,f,g));var H=!1,ma=null,Ca=[],Da=f.namespaceURI,N=f.localName;if("http://www.w3.org/1999/xhtml"==
Da)"html"==N||"body"==N||"script"==N||"link"==N||"meta"==N?N="div":"vide_"==N?N="video":"audi_"==N?N="audio":"object"==N&&(H=!!a.g),f.getAttribute("data-adapt-pseudo")&&h.content&&h.content.value&&h.content.value.url&&(N="img");else if("http://www.idpf.org/2007/ops"==Da)N="span",Da="http://www.w3.org/1999/xhtml";else if("http://www.gribuser.ru/xml/fictionbook/2.0"==Da){Da="http://www.w3.org/1999/xhtml";if("image"==N){if(N="div",(l=f.getAttributeNS("http://www.w3.org/1999/xlink","href"))&&"#"==l.charAt(0)&&
(l=mk(a.da,l)))ma=Ir(a,Da,"img"),l="data:"+(l.getAttribute("content-type")||"image/jpeg")+";base64,"+l.textContent.replace(/[ \t\n\t]/g,""),Ca.push(Ke(ma,l))}else N=yr[N];N||(N=a.w.ya?"span":"div")}else if("http://www.daisy.org/z3986/2005/ncx/"==Da)if(Da="http://www.w3.org/1999/xhtml","ncx"==N||"navPoint"==N)N="div";else if("navLabel"==N){if(N="span",r=f.parentNode){l=null;for(r=r.firstChild;r;r=r.nextSibling)if(1==r.nodeType&&(u=r,"http://www.daisy.org/z3986/2005/ncx/"==u.namespaceURI&&"content"==
u.localName)){l=u.getAttribute("src");break}l&&(N="a",f=f.ownerDocument.createElementNS(Da,"a"),f.setAttribute("href",l))}}else N="span";else"http://www.pyroxy.com/ns/shadow"==Da?(Da="http://www.w3.org/1999/xhtml",N=a.w.ya?"span":"div"):H=!!a.g;K?b?N="li":(N="div",p=bd,k.display=p):"body"==N||"li"==N?N="div":"q"==N?N="span":"a"==N&&(l=k["hyperlink-processing"])&&"normal"!=l.toString()&&(N="span");k.behavior&&"none"!=k.behavior.toString()&&a.g&&(H=!0);f.dataset&&"true"===f.getAttribute("data-math-typeset")&&
(H=!0);var sb;H?sb=a.g(f,a.w.parent?a.w.parent.B:null,k):sb=M(null);sb.then(function(g){g?H&&(d="true"==g.getAttribute("data-adapt-process-children")):g=Ir(a,Da,N);"a"==N&&g.addEventListener("click",a.page.J,!1);ma&&(ap(a,a.w,"inner",ma),g.appendChild(ma));"iframe"==g.localName&&"http://www.w3.org/1999/xhtml"==g.namespaceURI&&mr(g);var h=a.w.h["image-resolution"],l=[],m=k.width,p=k.height,q=f.getAttribute("width"),r=f.getAttribute("height"),m=m===Zc||!m&&!q,p=p===Zc||!p&&!r;if("http://www.gribuser.ru/xml/fictionbook/2.0"!=
f.namespaceURI||"td"==N){for(var q=f.attributes,u=q.length,r=null,z=0;z<u;z++){var A=q[z],I=A.namespaceURI,D=A.localName,A=A.nodeValue;if(I)if("http://www.w3.org/2000/xmlns/"==I)continue;else"http://www.w3.org/1999/xlink"==I&&"href"==D&&(A=zr(a,A));else{if(D.match(/^on/))continue;if("style"==D)continue;if(("id"==D||"name"==D)&&b){A=a.h.Re(A,a.da.url);g.setAttribute(D,A);Ik(a.page,g,A);continue}"src"==D||"href"==D||"poster"==D?(A=zr(a,A),"href"===D&&(A=a.h.oc(A,a.da.url))):"srcset"==D&&(A=A.split(",").map(function(b){return zr(a,
b.trim())}).join(","));if("poster"===D&&"video"===N&&"http://www.w3.org/1999/xhtml"===Da&&m&&p){var sb=new Image,Jp=Ke(sb,A);Ca.push(Jp);l.push({Rf:sb,element:g,Of:Jp})}}"http://www.w3.org/2000/svg"==Da&&/^[A-Z\-]+$/.test(D)&&(D=D.toLowerCase());Jr.includes(D.toLowerCase())&&(A=gr(A,a.da.url,a.h));I&&(sb=lr[I])&&(D=sb+":"+D);"src"!=D||I||"img"!=N&&"input"!=N||"http://www.w3.org/1999/xhtml"!=Da?"href"==D&&"image"==N&&"http://www.w3.org/2000/svg"==Da&&"http://www.w3.org/1999/xlink"==I?a.page.j.push(Ke(g,
A)):I?g.setAttributeNS(I,D,A):g.setAttribute(D,A):r=A}r&&(sb="input"===N?new Image:g,q=Ke(sb,r),sb!==g&&(g.src=r),m||p?(m&&p&&h&&1!==h&&l.push({Rf:sb,element:g,Of:q}),Ca.push(q)):a.page.j.push(q))}delete k.content;(m=k["list-style-image"])&&m instanceof Tc&&(m=m.url,Ca.push(Ke(new Image,m)));Kr(a,k);Lr(a,g,k);if(!a.w.ya&&(m=null,b?c&&(m=a.w.b?kr:jr):m="clone"!==a.w.h["box-decoration-break"]?a.w.b?ir:hr:a.w.b?kr:jr,m))for(var Kp in m)x(g,Kp,m[Kp]);K&&g.setAttribute("value",k["ua-list-item-count"].stringValue());
a.B=g;Ca.length?Je(Ca).then(function(){0<h&&Mr(a,l,h,k,a.w.b);O(e,d)}):Ce().then(function(){O(e,d)})})});return e.result()}function Fr(a,b,c,d,e){var f=sr(c,a.l,a.f,e);f&&f["after-if-continues"]&&f["after-if-continues"].content&&(a.w.J=new Nr(b,new qr(b,c,d,e,a.u)))}var Jr="color-profile clip-path cursor filter marker marker-start marker-end marker-mid fill stroke mask".split(" ");
function Mr(a,b,c,d,e){b.forEach(function(b){if("load"===b.Of.get().get()){var f=b.Rf,h=f.width/c,f=f.height/c;b=b.element;if(0<h&&0<f)if(d["box-sizing"]===gd&&(d["border-left-style"]!==J&&(h+=Vc(d["border-left-width"],a.b)),d["border-right-style"]!==J&&(h+=Vc(d["border-right-width"],a.b)),d["border-top-style"]!==J&&(f+=Vc(d["border-top-width"],a.b)),d["border-bottom-style"]!==J&&(f+=Vc(d["border-bottom-width"],a.b))),1<c){var l=d["max-width"]||J,k=d["max-height"]||J;l===J&&k===J?x(b,"max-width",
h+"px"):l!==J&&k===J?x(b,"width",h+"px"):l===J&&k!==J?x(b,"height",f+"px"):"%"!==l.ka?x(b,"max-width",Math.min(h,Vc(l,a.b))+"px"):"%"!==k.ka?x(b,"max-height",Math.min(f,Vc(k,a.b))+"px"):e?x(b,"height",f+"px"):x(b,"width",h+"px")}else 1>c&&(l=d["min-width"]||be,k=d["min-height"]||be,l.L||k.L?l.L&&!k.L?x(b,"width",h+"px"):!l.L&&k.L?x(b,"height",f+"px"):"%"!==l.ka?x(b,"min-width",Math.max(h,Vc(l,a.b))+"px"):"%"!==k.ka?x(b,"min-height",Math.max(f,Vc(k,a.b))+"px"):e?x(b,"height",f+"px"):x(b,"width",h+
"px"):x(b,"min-width",h+"px"))}})}function Kr(a,b){he("PREPROCESS_ELEMENT_STYLE").forEach(function(c){c(a.w,b)})}function Hr(a,b,c){for(b=b.firstChild;b;b=b.nextSibling)if(1===b.nodeType){var d={},e=c.l(b,!1);wr(a,a.w.b,"rtl"===a.w.direction,e,d);if(Gr(d)){if(a.w.C instanceof zp&&!jl(a.w,a.w.C))break;c=a.w.parent;a.w.C=new zp(c&&c.C,a.w.M);Or(a.w.C,a.w.b);break}}}
function Gr(a){var b=a["repeat-on-break"];return b!==J&&(b===Zc&&(b=a.display===Sd?rd:a.display===Rd?qd:J),b&&b!==J)?b.toString():null}function Pr(a){var b=L("createTextNodeView");Qr(a).then(function(){var c=a.na||0,c=Rr(a.w.Qa).substr(c);a.B=document.createTextNode(c);O(b,!0)});return b.result()}
function Qr(a){if(a.w.Qa)return M(!0);var b,c=b=a.M.textContent,d=L("preprocessTextContent"),e=he("PREPROCESS_TEXT_CONTENT"),f=0;Ee(function(){return f>=e.length?M(!1):e[f++](a.w,c).ea(function(a){c=a;return M(!0)})}).then(function(){a.w.Qa=Sr(b,c,0);O(d,!0)});return d.result()}
function Tr(a,b,c){var d=L("createNodeView"),e=!0;1==a.M.nodeType?b=Dr(a,b,c):8==a.M.nodeType?(a.B=null,b=M(!0)):b=Pr(a);b.then(function(b){e=b;(a.w.B=a.B)&&(b=a.w.parent?a.w.parent.B:a.N)&&b.appendChild(a.B);O(d,e)});return d.result()}function Ao(a,b,c,d){(a.w=b)?(a.M=b.M,a.na=b.na):(a.M=null,a.na=-1);a.B=null;return a.w?Tr(a,c,!!d):M(!0)}
function Ur(a){if(null==a.wa||"content"!=a.M.localName||"http://www.pyroxy.com/ns/shadow"!=a.M.namespaceURI)return a;var b=a.Ma,c=a.wa,d=a.parent,e,f;c.vf?(f=c.vf,e=c.root,c=c.type,2==c&&(e=e.firstChild)):(f=c.pd,e=c.oa.firstChild,c=2);var g=a.M.nextSibling;g?(a.M=g,cl(a)):a.Ga?a=a.Ga:e?a=null:(a=a.parent.modify(),a.K=!0);if(e)return b=new Yk(e,d,b),b.wa=f,b.kb=c,b.Ga=a,b;a.Ma=b;return a}
function Vr(a){var b=a.Ma+1;if(a.K){if(!a.parent)return null;if(3!=a.kb){var c=a.M.nextSibling;if(c)return a=a.modify(),a.Ma=b,a.M=c,cl(a),Ur(a)}if(a.Ga)return a=a.Ga.modify(),a.Ma=b,a;a=a.parent.modify()}else{if(a.Ja&&(c=a.Ja.root,2==a.Ja.type&&(c=c.firstChild),c))return b=new Yk(c,a,b),b.wa=a.Ja,b.kb=a.Ja.type,Ur(b);if(c=a.M.firstChild)return Ur(new Yk(c,a,b));1!=a.M.nodeType&&(c=Rr(a.Qa),b+=c.length-1-a.na);a=a.modify()}a.Ma=b;a.K=!0;return a}
function Gm(a,b,c){b=Vr(b);if(!b||b.K)return M(b);var d=L("nextInTree");Ao(a,b,!0,c).then(function(c){b.B&&c||(b=b.modify(),b.K=!0,b.B||(b.ya=!0));gb(a,{type:"nextInTree",w:b});O(d,b)});return d.result()}function Wr(a,b){if(b instanceof Ic)for(var c=b.values,d=0;d<c.length;d++)Wr(a,c[d]);else b instanceof Tc&&(c=b.url,a.page.j.push(Ke(new Image,c)))}
var Xr={"box-decoration-break":!0,"float-min-wrap-block":!0,"float-reference":!0,"flow-into":!0,"flow-linger":!0,"flow-options":!0,"flow-priority":!0,"footnote-policy":!0,page:!0};function Lr(a,b,c){var d=c["background-image"];d&&Wr(a,d);var d=c.position===Hd,e;for(e in c)if(!Xr[e]){var f=c[e],f=f.fa(new Ug(a.da.url,a.h));f.Ac()&&Pb(f.ka)&&(f=new F(Vc(f,a.b),"px"));Ak[e]||d&&Bk[e]?a.page.l.push(new Ck(b,e,f)):x(b,e,f.toString())}}
function ap(a,b,c,d){if(!b.K){var e=(b.wa?b.wa.b:a.j).l(a.M,!1);if(e=e._pseudos)if(e=e[c])c={},b.b=wr(a,b.b,"rtl"===b.direction,e,c),b=c.content,Hl(b)&&(b.fa(new Gl(d,a.b,b,a.u)),delete c.content),Lr(a,d,c)}}
function Do(a,b,c){var d=L("peelOff"),e=b.f,f=b.na,g=b.K;if(0<c)b.B.textContent=b.B.textContent.substr(0,c),f+=c;else if(!g&&b.B&&!f){var h=b.B.parentNode;h&&h.removeChild(b.B)}for(var l=b.Ma+c,k=[];b.f===e;)k.push(b),b=b.parent;var m=k.pop(),p=m.Ga;Ee(function(){for(;0<k.length;){m=k.pop();b=new Yk(m.M,b,l);k.length||(b.na=f,b.K=g);b.kb=m.kb;b.wa=m.wa;b.Ja=m.Ja;b.Ga=m.Ga?m.Ga:p;p=null;var c=Ao(a,b,!1);if(c.Xa())return c}return M(!1)}).then(function(){O(d,b)});return d.result()}
function Ir(a,b,c){return"http://www.w3.org/1999/xhtml"==b?a.D.createElement(c):a.D.createElementNS(b,c)}function Mp(a){a&&il(a,function(a){var b=a.h["box-decoration-break"];b&&"slice"!==b||(b=a.B,a.b?(x(b,"padding-left","0"),x(b,"border-left","none"),x(b,"border-top-left-radius","0"),x(b,"border-bottom-left-radius","0")):(x(b,"padding-bottom","0"),x(b,"border-bottom","none"),x(b,"border-bottom-left-radius","0"),x(b,"border-bottom-right-radius","0")))})}
function Yr(a){this.b=a.h;this.window=a.window}function Zr(a,b){var c=b.left,d=b.top;return{left:a.left-c,top:a.top-d,right:a.right-c,bottom:a.bottom-d,width:a.width,height:a.height}}function ko(a,b){var c=b.getClientRects(),d=a.b.getBoundingClientRect();return Array.from(c).map(function(a){return Zr(a,d)},a)}function Kk(a,b){var c=b.getBoundingClientRect(),d=a.b.getBoundingClientRect();return Zr(c,d)}function Qn(a,b){return a.window.getComputedStyle(b,null)}
function $r(a,b,c,d,e){this.window=a;this.fontSize=b;this.b=a.document;this.root=c||this.b.body;b=this.root.firstElementChild;b||(b=this.b.createElement("div"),b.setAttribute("data-vivliostyle-outer-zoom-box",!0),this.root.appendChild(b));c=b.firstElementChild;c||(c=this.b.createElement("div"),c.setAttribute("data-vivliostyle-spread-container",!0),b.appendChild(c));var f=b.nextElementSibling;f||(f=this.b.createElement("div"),f.setAttribute("data-vivliostyle-layout-box",!0),this.root.appendChild(f));
this.g=b;this.f=c;this.h=f;b=Qn(new Yr(this),this.root);this.width=d||parseFloat(b.width)||a.innerWidth;this.height=e||parseFloat(b.height)||a.innerHeight}$r.prototype.zoom=function(a,b,c){x(this.g,"width",a*c+"px");x(this.g,"height",b*c+"px");x(this.f,"width",a+"px");x(this.f,"height",b+"px");x(this.f,"transform","scale("+c+")")};var bp="min-content inline size",Tn="fit-content inline size";
function Sn(a,b,c){function d(c){return Qn(a,b).getPropertyValue(c)}function e(){x(b,"display","block");x(b,"position","static");return d(ma)}function f(){x(b,"display","inline-block");x(I,ma,"99999999px");var a=d(ma);x(I,ma,"");return a}function g(){x(b,"display","inline-block");x(I,ma,"0");var a=d(ma);x(I,ma,"");return a}function h(){var a=e(),b=g(),c=parseFloat(a);if(c<=parseFloat(b))return b;b=f();return c<=parseFloat(b)?a:b}function l(){throw Error("Getting fill-available block size is not implemented");}
var k=b.style.display,m=b.style.position,p=b.style.width,q=b.style.maxWidth,r=b.style.minWidth,z=b.style.height,u=b.style.maxHeight,A=b.style.minHeight,D=b.parentNode,I=b.ownerDocument.createElement("div");x(I,"position",m);D.insertBefore(I,b);I.appendChild(b);x(b,"width","auto");x(b,"max-width","none");x(b,"min-width","0");x(b,"height","auto");x(b,"max-height","none");x(b,"min-height","0");var K=Oa("writing-mode"),K=(K?d(K[0]):null)||d("writing-mode"),H="vertical-rl"===K||"tb-rl"===K||"vertical-lr"===
K||"tb-lr"===K,ma=H?"height":"width",Ca=H?"width":"height",Da={};c.forEach(function(a){var c;switch(a){case "fill-available inline size":c=e();break;case "max-content inline size":c=f();break;case bp:c=g();break;case Tn:c=h();break;case "fill-available block size":c=l();break;case "max-content block size":case "min-content block size":case "fit-content block size":c=d(Ca);break;case "fill-available width":c=H?l():e();break;case "fill-available height":c=H?e():l();break;case "max-content width":c=
H?d(Ca):f();break;case "max-content height":c=H?f():d(Ca);break;case "min-content width":c=H?d(Ca):g();break;case "min-content height":c=H?g():d(Ca);break;case "fit-content width":c=H?d(Ca):h();break;case "fit-content height":c=H?h():d(Ca)}Da[a]=parseFloat(c);x(b,"position",m);x(b,"display",k)});x(b,"width",p);x(b,"max-width",q);x(b,"min-width",r);x(b,"height",z);x(b,"max-height",u);x(b,"min-height",A);D.insertBefore(b,I);D.removeChild(I);return Da};function as(a){var b=a["writing-mode"],b=b&&b.value;a=(a=a.direction)&&a.value;return b===Vd||b!==Wd&&a!==Nd?"ltr":"rtl"}
var bs={a5:{width:new F(148,"mm"),height:new F(210,"mm")},a4:{width:new F(210,"mm"),height:new F(297,"mm")},a3:{width:new F(297,"mm"),height:new F(420,"mm")},b5:{width:new F(176,"mm"),height:new F(250,"mm")},b4:{width:new F(250,"mm"),height:new F(353,"mm")},"jis-b5":{width:new F(182,"mm"),height:new F(257,"mm")},"jis-b4":{width:new F(257,"mm"),height:new F(364,"mm")},letter:{width:new F(8.5,"in"),height:new F(11,"in")},legal:{width:new F(8.5,"in"),height:new F(14,"in")},ledger:{width:new F(11,"in"),
height:new F(17,"in")}},cs=new F(.24,"pt"),ds=new F(3,"mm"),es=new F(10,"mm"),fs=new F(13,"mm");
function gs(a){var b={width:$d,height:ae,$b:be,ac:be},c=a.size;if(c&&c.value!==Zc){var d=c.value;d.Ud()?(c=d.values[0],d=d.values[1]):(c=d,d=null);if(c.Ac())b.width=c,b.height=d||c;else if(c=bs[c.name.toLowerCase()])d&&d===yd?(b.width=c.height,b.height=c.width):(b.width=c.width,b.height=c.height)}(c=a.marks)&&c.value!==J&&(b.ac=fs);a=a.bleed;a&&a.value!==Zc?a.value&&a.value.Ac()&&(b.$b=a.value):c&&(a=!1,c.value.Ud()?a=c.value.values.some(function(a){return a===jd}):a=c.value===jd,a&&(b.$b=new F(6,
"pt")));return b}function hs(a,b){var c={},d=a.$b.L*Sb(b,a.$b.ka,!1),e=a.ac.L*Sb(b,a.ac.ka,!1),f=d+e,g=a.width;c.jc=g===$d?b.$.vc?b.$.vc.width*Sb(b,"px",!1):(b.$.ub?Math.floor(b.Cb/2)-b.$.Dc:b.Cb)-2*f:g.L*Sb(b,g.ka,!1);g=a.height;c.ic=g===ae?b.$.vc?b.$.vc.height*Sb(b,"px",!1):b.Lc-2*f:g.L*Sb(b,g.ka,!1);c.$b=d;c.ac=e;c.qe=f;return c}function is(a,b,c){a=a.createElementNS("http://www.w3.org/2000/svg","svg");a.setAttribute("width",b);a.setAttribute("height",c);a.style.position="absolute";return a}
function js(a,b,c){a=a.createElementNS("http://www.w3.org/2000/svg",c||"polyline");a.setAttribute("stroke","black");a.setAttribute("stroke-width",b);a.setAttribute("fill","none");return a}var ks={kh:"top left",lh:"top right",Xg:"bottom left",Yg:"bottom right"};
function ls(a,b,c,d,e,f){var g=d;g<=e+2*Ob.mm&&(g=e+d/2);var h=Math.max(d,g),l=e+h+c/2,k=is(a,l,l),g=[[0,e+d],[d,e+d],[d,e+d-g]];d=g.map(function(a){return[a[1],a[0]]});if("top right"===b||"bottom right"===b)g=g.map(function(a){return[e+h-a[0],a[1]]}),d=d.map(function(a){return[e+h-a[0],a[1]]});if("bottom left"===b||"bottom right"===b)g=g.map(function(a){return[a[0],e+h-a[1]]}),d=d.map(function(a){return[a[0],e+h-a[1]]});l=js(a,c);l.setAttribute("points",g.map(function(a){return a.join(",")}).join(" "));
k.appendChild(l);a=js(a,c);a.setAttribute("points",d.map(function(a){return a.join(",")}).join(" "));k.appendChild(a);b.split(" ").forEach(function(a){k.style[a]=f+"px"});return k}var ms={jh:"top",Wg:"bottom",pg:"left",qg:"right"};
function ns(a,b,c,d,e){var f=2*d,g;"top"===b||"bottom"===b?(g=f,f=d):g=d;var h=is(a,g,f),l=js(a,c);l.setAttribute("points","0,"+f/2+" "+g+","+f/2);h.appendChild(l);l=js(a,c);l.setAttribute("points",g/2+",0 "+g/2+","+f);h.appendChild(l);a=js(a,c,"circle");a.setAttribute("cx",g/2);a.setAttribute("cy",f/2);a.setAttribute("r",d/4);h.appendChild(a);var k;switch(b){case "top":k="bottom";break;case "bottom":k="top";break;case "left":k="right";break;case "right":k="left"}Object.keys(ms).forEach(function(a){a=
ms[a];a===b?h.style[a]=e+"px":a!==k&&(h.style[a]="0",h.style["margin-"+a]="auto")});return h}function os(a,b,c,d){var e=!1,f=!1;if(a=a.marks)a=a.value,a.Ud()?a.values.forEach(function(a){a===jd?e=!0:a===kd&&(f=!0)}):a===jd?e=!0:a===kd&&(f=!0);if(e||f){var g=c.I,h=g.ownerDocument,l=b.$b,k=Vc(cs,d),m=Vc(ds,d),p=Vc(es,d);e&&Object.keys(ks).forEach(function(a){a=ls(h,ks[a],k,p,l,m);g.appendChild(a)});f&&Object.keys(ms).forEach(function(a){a=ns(h,ms[a],k,p,m);g.appendChild(a)})}}
var ps=function(){var a={width:!0,height:!0,"block-size":!0,"inline-size":!0,margin:!0,padding:!0,border:!0,outline:!0,"outline-width":!0,"outline-style":!0,"outline-color":!0};"left right top bottom before after start end block-start block-end inline-start inline-end".split(" ").forEach(function(b){a["margin-"+b]=!0;a["padding-"+b]=!0;a["border-"+b+"-width"]=!0;a["border-"+b+"-style"]=!0;a["border-"+b+"-color"]=!0});return a}(),qs={"top-left-corner":{order:1,Wa:!0,Ta:!1,Ua:!0,Va:!0,Da:null},"top-left":{order:2,
Wa:!0,Ta:!1,Ua:!1,Va:!1,Da:"start"},"top-center":{order:3,Wa:!0,Ta:!1,Ua:!1,Va:!1,Da:"center"},"top-right":{order:4,Wa:!0,Ta:!1,Ua:!1,Va:!1,Da:"end"},"top-right-corner":{order:5,Wa:!0,Ta:!1,Ua:!1,Va:!0,Da:null},"right-top":{order:6,Wa:!1,Ta:!1,Ua:!1,Va:!0,Da:"start"},"right-middle":{order:7,Wa:!1,Ta:!1,Ua:!1,Va:!0,Da:"center"},"right-bottom":{order:8,Wa:!1,Ta:!1,Ua:!1,Va:!0,Da:"end"},"bottom-right-corner":{order:9,Wa:!1,Ta:!0,Ua:!1,Va:!0,Da:null},"bottom-right":{order:10,Wa:!1,Ta:!0,Ua:!1,Va:!1,Da:"end"},
"bottom-center":{order:11,Wa:!1,Ta:!0,Ua:!1,Va:!1,Da:"center"},"bottom-left":{order:12,Wa:!1,Ta:!0,Ua:!1,Va:!1,Da:"start"},"bottom-left-corner":{order:13,Wa:!1,Ta:!0,Ua:!0,Va:!1,Da:null},"left-bottom":{order:14,Wa:!1,Ta:!1,Ua:!0,Va:!1,Da:"end"},"left-middle":{order:15,Wa:!1,Ta:!1,Ua:!0,Va:!1,Da:"center"},"left-top":{order:16,Wa:!1,Ta:!1,Ua:!0,Va:!1,Da:"start"}},rs=Object.keys(qs).sort(function(a,b){return qs[a].order-qs[b].order});
function ss(a,b,c){pq.call(this,a,null,"vivliostyle-page-rule-master",[],b,null,0);a=gs(c);new ts(this.f,this,c,a);this.A={};us(this,c);this.b.position=new V(Hd,0);this.b.width=new V(a.width,0);this.b.height=new V(a.height,0);for(var d in c)ps[d]||"background-clip"===d||(this.b[d]=c[d])}v(ss,pq);function us(a,b){var c=b._marginBoxes;c&&rs.forEach(function(d){c[d]&&(a.A[d]=new vs(a.f,a,d,b))})}ss.prototype.h=function(a){return new ws(a,this)};
function ts(a,b,c,d){tq.call(this,a,null,null,[],b);this.D=d;this.b["z-index"]=new V(new Rc(0),0);this.b["flow-from"]=new V(E("body"),0);this.b.position=new V(Wc,0);this.b.overflow=new V(Xd,0);for(var e in ps)ps.hasOwnProperty(e)&&(this.b[e]=c[e])}v(ts,tq);ts.prototype.h=function(a){return new xs(a,this)};
function vs(a,b,c,d){tq.call(this,a,null,null,[],b);this.u=c;a=d._marginBoxes[this.u];for(var e in d)if(b=d[e],c=a[e],Gh[e]||c&&c.value===td)this.b[e]=b;for(e in a)Object.prototype.hasOwnProperty.call(a,e)&&(b=a[e])&&b.value!==td&&(this.b[e]=b)}v(vs,tq);vs.prototype.h=function(a){return new ys(a,this)};function ws(a,b){qq.call(this,a,b);this.u=null;this.ta={}}v(ws,qq);
ws.prototype.l=function(a,b){var c=this.J,d;for(d in b)if(Object.prototype.hasOwnProperty.call(b,d))switch(d){case "writing-mode":case "direction":c[d]=b[d]}qq.prototype.l.call(this,a,b)};ws.prototype.Ae=function(){var a=this.style;a.left=be;a["margin-left"]=be;a["border-left-width"]=be;a["padding-left"]=be;a["padding-right"]=be;a["border-right-width"]=be;a["margin-right"]=be;a.right=be};
ws.prototype.Be=function(){var a=this.style;a.top=new F(-1,"px");a["margin-top"]=be;a["border-top-width"]=be;a["padding-top"]=be;a["padding-bottom"]=be;a["border-bottom-width"]=be;a["margin-bottom"]=be;a.bottom=be};ws.prototype.ca=function(a,b,c){b=b.H;var d={start:this.u.marginLeft,end:this.u.marginRight,va:this.u.Kc},e={start:this.u.marginTop,end:this.u.marginBottom,va:this.u.Jc};zs(this,b.top,!0,d,a,c);zs(this,b.bottom,!0,d,a,c);zs(this,b.left,!1,e,a,c);zs(this,b.right,!1,e,a,c)};
function As(a,b,c,d,e){this.I=a;this.A=e;this.j=c;this.u=!Y(d,b[c?"width":"height"],new uc(d,0,"px"));this.size=null}As.prototype.b=function(){return this.u};function Bs(a){a.size||(a.size=Sn(a.A,a.I.element,a.j?["max-content width","min-content width"]:["max-content height","min-content height"]));return a.size}As.prototype.g=function(){var a=Bs(this);return this.j?ul(this.I)+a["max-content width"]+vl(this.I):sl(this.I)+a["max-content height"]+tl(this.I)};
As.prototype.h=function(){var a=Bs(this);return this.j?ul(this.I)+a["min-content width"]+vl(this.I):sl(this.I)+a["min-content height"]+tl(this.I)};As.prototype.f=function(){return this.j?ul(this.I)+this.I.width+vl(this.I):sl(this.I)+this.I.height+tl(this.I)};function Cs(a){this.j=a}Cs.prototype.b=function(){return this.j.some(function(a){return a.b()})};Cs.prototype.g=function(){var a=this.j.map(function(a){return a.g()});return Math.max.apply(null,a)*a.length};
Cs.prototype.h=function(){var a=this.j.map(function(a){return a.h()});return Math.max.apply(null,a)*a.length};Cs.prototype.f=function(){var a=this.j.map(function(a){return a.f()});return Math.max.apply(null,a)*a.length};function Ds(a,b,c,d,e,f){As.call(this,a,b,c,d,e);this.l=f}v(Ds,As);Ds.prototype.b=function(){return!1};Ds.prototype.g=function(){return this.f()};Ds.prototype.h=function(){return this.f()};Ds.prototype.f=function(){return this.j?ul(this.I)+this.l+vl(this.I):sl(this.I)+this.l+tl(this.I)};
function zs(a,b,c,d,e,f){var g=a.f.f,h={},l={},k={},m;for(m in b){var p=qs[m];if(p){var q=b[m],r=a.ta[m],z=new As(q,r.style,c,g,f);h[p.Da]=q;l[p.Da]=r;k[p.Da]=z}}a=d.start.evaluate(e);d.end.evaluate(e);b=d.va.evaluate(e);var u=Es(k,b),A=!1,D={};Object.keys(h).forEach(function(a){var b=Y(g,l[a].style[c?"max-width":"max-height"],d.va);b&&(b=b.evaluate(e),u[a]>b&&(b=k[a]=new Ds(h[a],l[a].style,c,g,f,b),D[a]=b.f(),A=!0))});A&&(u=Es(k,b),A=!1,["start","center","end"].forEach(function(a){u[a]=D[a]||u[a]}));
var I={};Object.keys(h).forEach(function(a){var b=Y(g,l[a].style[c?"min-width":"min-height"],d.va);b&&(b=b.evaluate(e),u[a]<b&&(b=k[a]=new Ds(h[a],l[a].style,c,g,f,b),I[a]=b.f(),A=!0))});A&&(u=Es(k,b),["start","center","end"].forEach(function(a){u[a]=I[a]||u[a]}));var K=a+b,H=a+(a+b);["start","center","end"].forEach(function(a){var b=u[a];if(b){var d=h[a],e=0;switch(a){case "start":e=c?d.left:d.top;break;case "center":e=(H-b)/2;break;case "end":e=K-b}c?zl(d,e,b-ul(d)-vl(d)):yl(d,e,b-sl(d)-tl(d))}})}
function Es(a,b){var c=a.start,d=a.center,e=a.end,f={};if(d){var g=[c,e].filter(function(a){return a}),g=Fs(d,g.length?new Cs(g):null,b);g.Bb&&(f.center=g.Bb);d=g.Bb||d.f();d=(b-d)/2;c&&c.b()&&(f.start=d);e&&e.b()&&(f.end=d)}else c=Fs(c,e,b),c.Bb&&(f.start=c.Bb),c.Dd&&(f.end=c.Dd);return f}
function Fs(a,b,c){var d={Bb:null,Dd:null};if(a&&b)if(a.b()&&b.b()){var e=a.g(),f=b.g();0<e&&0<f?(f=e+f,f<c?d.Bb=c*e/f:(a=a.h(),b=b.h(),b=a+b,b<c?d.Bb=a+(c-b)*(e-a)/(f-b):0<b&&(d.Bb=c*a/b)),0<d.Bb&&(d.Dd=c-d.Bb)):0<e?d.Bb=c:0<f&&(d.Dd=c)}else a.b()?d.Bb=Math.max(c-b.f(),0):b.b()&&(d.Dd=Math.max(c-a.f(),0));else a?a.b()&&(d.Bb=c):b&&b.b()&&(d.Dd=c);return d}ws.prototype.kc=function(a,b,c,d,e){ws.ng.kc.call(this,a,b,c,d,e);b.element.setAttribute("data-vivliostyle-page-box",!0)};
function xs(a,b){uq.call(this,a,b);this.marginLeft=this.marginBottom=this.marginRight=this.marginTop=this.Jc=this.Kc=null}v(xs,uq);
xs.prototype.l=function(a,b){var c=this.J,d;for(d in b)Object.prototype.hasOwnProperty.call(b,d)&&(d.match(/^column.*$/)||d.match(/^background-/))&&(c[d]=b[d]);uq.prototype.l.call(this,a,b);d=this.g;c={Kc:this.Kc,Jc:this.Jc,marginTop:this.marginTop,marginRight:this.marginRight,marginBottom:this.marginBottom,marginLeft:this.marginLeft};d.u=c;d=d.style;d.width=new G(c.Kc);d.height=new G(c.Jc);d["padding-left"]=new G(c.marginLeft);d["padding-right"]=new G(c.marginRight);d["padding-top"]=new G(c.marginTop);
d["padding-bottom"]=new G(c.marginBottom)};xs.prototype.Ae=function(){var a=Gs(this,{start:"left",end:"right",va:"width"});this.Kc=a.Gf;this.marginLeft=a.Zf;this.marginRight=a.Yf};xs.prototype.Be=function(){var a=Gs(this,{start:"top",end:"bottom",va:"height"});this.Jc=a.Gf;this.marginTop=a.Zf;this.marginBottom=a.Yf};
function Gs(a,b){var c=a.style,d=a.f.f,e=b.start,f=b.end,g=b.va,h=a.f.D[g].Aa(d,null),l=Y(d,c[g],h),k=Y(d,c["margin-"+e],h),m=Y(d,c["margin-"+f],h),p=vq(d,c["padding-"+e],h),q=vq(d,c["padding-"+f],h),r=xq(d,c["border-"+e+"-width"],c["border-"+e+"-style"],h),z=xq(d,c["border-"+f+"-width"],c["border-"+f+"-style"],h),u=B(d,h,y(d,y(d,r,p),y(d,z,q)));l?(u=B(d,u,l),k||m?k?m=B(d,u,k):k=B(d,u,m):m=k=Cc(d,u,new Ib(d,.5))):(k||(k=d.b),m||(m=d.b),l=B(d,u,y(d,k,m)));c[e]=new G(k);c[f]=new G(m);c["margin-"+e]=
be;c["margin-"+f]=be;c["padding-"+e]=new G(p);c["padding-"+f]=new G(q);c["border-"+e+"-width"]=new G(r);c["border-"+f+"-width"]=new G(z);c[g]=new G(l);c["max-"+g]=new G(l);return{Gf:B(d,h,y(d,k,m)),Zf:k,Yf:m}}xs.prototype.kc=function(a,b,c,d,e){uq.prototype.kc.call(this,a,b,c,d,e);c.D=b.element;a.ca=parseFloat(c.D.style.width);a.Z=parseFloat(c.D.style.height)};function ys(a,b){uq.call(this,a,b);var c=b.u;this.u=qs[c];a.ta[c]=this;this.ua=!0}v(ys,uq);n=ys.prototype;
n.kc=function(a,b,c,d,e){var f=b.element;x(f,"display","flex");var g=Hq(this,a,"vertical-align"),h=null;g===E("middle")?h="center":g===E("top")?h="flex-start":g===E("bottom")&&(h="flex-end");h&&(x(f,"flex-flow",this.b?"row":"column"),x(f,"justify-content",h));uq.prototype.kc.call(this,a,b,c,d,e)};
n.Da=function(a,b){var c=this.style,d=this.f.f,e=a.start,f=a.end,g="left"===e,h=g?b.Kc:b.Jc,l=Y(d,c[a.va],h),g=g?b.marginLeft:b.marginTop;if("start"===this.u.Da)c[e]=new G(g);else if(l){var k=vq(d,c["margin-"+e],h),m=vq(d,c["margin-"+f],h),p=vq(d,c["padding-"+e],h),q=vq(d,c["padding-"+f],h),r=xq(d,c["border-"+e+"-width"],c["border-"+e+"-style"],h),f=xq(d,c["border-"+f+"-width"],c["border-"+f+"-style"],h),l=y(d,l,y(d,y(d,p,q),y(d,y(d,r,f),y(d,k,m))));switch(this.u.Da){case "center":c[e]=new G(y(d,
g,Dc(d,B(d,h,l),new Ib(d,2))));break;case "end":c[e]=new G(B(d,y(d,g,h),l))}}};
function Hs(a,b,c){function d(a){if(u)return u;u={va:z?z.evaluate(a):null,rb:l?l.evaluate(a):null,sb:k?k.evaluate(a):null};var b=h.evaluate(a),c=0;[q,m,p,r].forEach(function(b){b&&(c+=b.evaluate(a))});(null===u.rb||null===u.sb)&&c+u.va+u.rb+u.sb>b&&(null===u.rb&&(u.rb=0),null===u.sb&&(u.rh=0));null!==u.va&&null!==u.rb&&null!==u.sb&&(u.sb=null);null===u.va&&null!==u.rb&&null!==u.sb?u.va=b-c-u.rb-u.sb:null!==u.va&&null===u.rb&&null!==u.sb?u.rb=b-c-u.va-u.sb:null!==u.va&&null!==u.rb&&null===u.sb?u.sb=
b-c-u.va-u.rb:null===u.va?(u.rb=u.sb=0,u.va=b-c):u.rb=u.sb=(b-c-u.va)/2;return u}var e=a.style;a=a.f.f;var f=b.De,g=b.Ke;b=b.va;var h=c["margin"+g.charAt(0).toUpperCase()+g.substring(1)],l=wq(a,e["margin-"+f],h),k=wq(a,e["margin-"+g],h),m=vq(a,e["padding-"+f],h),p=vq(a,e["padding-"+g],h),q=xq(a,e["border-"+f+"-width"],e["border-"+f+"-style"],h),r=xq(a,e["border-"+g+"-width"],e["border-"+g+"-style"],h),z=Y(a,e[b],h),u=null;e[b]=new G(new Kb(a,function(){var a=d(this).va;return null===a?0:a},b));e["margin-"+
f]=new G(new Kb(a,function(){var a=d(this).rb;return null===a?0:a},"margin-"+f));e["margin-"+g]=new G(new Kb(a,function(){var a=d(this).sb;return null===a?0:a},"margin-"+g));"left"===f?e.left=new G(y(a,c.marginLeft,c.Kc)):"top"===f&&(e.top=new G(y(a,c.marginTop,c.Jc)))}n.Ae=function(){var a=this.g.u;this.u.Ua?Hs(this,{De:"right",Ke:"left",va:"width"},a):this.u.Va?Hs(this,{De:"left",Ke:"right",va:"width"},a):this.Da({start:"left",end:"right",va:"width"},a)};
n.Be=function(){var a=this.g.u;this.u.Wa?Hs(this,{De:"bottom",Ke:"top",va:"height"},a):this.u.Ta?Hs(this,{De:"top",Ke:"bottom",va:"height"},a):this.Da({start:"top",end:"bottom",va:"height"},a)};n.Qd=function(a,b,c,d,e,f,g){uq.prototype.Qd.call(this,a,b,c,d,e,f,g);a=c.H;c=this.f.u;d=this.u;d.Ua||d.Va?d.Wa||d.Ta||(d.Ua?a.left[c]=b:d.Va&&(a.right[c]=b)):d.Wa?a.top[c]=b:d.Ta&&(a.bottom[c]=b)};
function Is(a,b,c,d,e){this.f=a;this.l=b;this.h=c;this.b=d;this.g=e;this.j={};a=this.l;b=new vc(a,"page-number");b=new nc(a,new tc(a,b,new Ib(a,2)),a.b);c=new dc(a,b);a.values["recto-page"]=c;a.values["verso-page"]=b;"ltr"===(this.b.H||as(this.g))?(a.values["left-page"]=b,b=new dc(a,b),a.values["right-page"]=b):(c=new dc(a,b),a.values["left-page"]=c,a.values["right-page"]=b)}function Js(a){var b={};yj(a.f,[],"",b);Ij(a.f);return b}
function Ks(a,b){var c=[],d;for(d in b)if(Object.prototype.hasOwnProperty.call(b,d)){var e=b[d],f;f=e instanceof V?""+e.value:Ks(a,e);c.push(d+f+(e.cb||""))}return c.sort().join("^")}function Ls(a,b,c){c=c.clone({mc:"vivliostyle-page-rule-master"});var d=c.b,e=b.size;if(e){var f=gs(b),e=e.cb;d.width=Xh(a.b,d.width,new V(f.width,e));d.height=Xh(a.b,d.height,new V(f.height,e))}["counter-reset","counter-increment"].forEach(function(a){d[a]&&(b[a]=d[a])});c=c.h(a.h);c.l(a.f,a.g);Xq(c,a.b);return c}
function Ms(a){this.b=null;this.h=a}v(Ms,W);Ms.prototype.apply=function(a){a.Z===this.h&&this.b.apply(a)};Ms.prototype.f=function(){return 3};Ms.prototype.g=function(a){this.b&&oi(a.od,this.h,this.b);return!0};function Ns(a){this.b=null;this.h=a}v(Ns,W);Ns.prototype.apply=function(a){1===(new vc(this.h,"page-number")).evaluate(a.l)&&this.b.apply(a)};Ns.prototype.f=function(){return 2};function Os(a){this.b=null;this.h=a}v(Os,W);
Os.prototype.apply=function(a){(new vc(this.h,"left-page")).evaluate(a.l)&&this.b.apply(a)};Os.prototype.f=function(){return 1};function Ps(a){this.b=null;this.h=a}v(Ps,W);Ps.prototype.apply=function(a){(new vc(this.h,"right-page")).evaluate(a.l)&&this.b.apply(a)};Ps.prototype.f=function(){return 1};function Qs(a){this.b=null;this.h=a}v(Qs,W);Qs.prototype.apply=function(a){(new vc(this.h,"recto-page")).evaluate(a.l)&&this.b.apply(a)};Qs.prototype.f=function(){return 1};
function Rs(a){this.b=null;this.h=a}v(Rs,W);Rs.prototype.apply=function(a){(new vc(this.h,"verso-page")).evaluate(a.l)&&this.b.apply(a)};Rs.prototype.f=function(){return 1};function Ss(a,b){li.call(this,a,b,null,null,null)}v(Ss,li);Ss.prototype.apply=function(a){var b=a.l,c=a.F,d=this.style;a=this.ba;di(b,c,d,a,null,null,null);if(d=d._marginBoxes){var c=ai(c,"_marginBoxes"),e;for(e in d)if(d.hasOwnProperty(e)){var f=c[e];f||(f={},c[e]=f);di(b,f,d[e],a,null,null,null)}}};
function Ts(a,b,c,d,e){Kj.call(this,a,b,null,c,null,d,!1);this.S=e;this.H=[];this.g="";this.F=[]}v(Ts,Kj);n=Ts.prototype;n.Vc=function(){this.Tb()};n.Wb=function(a,b){if(this.g=b)this.b.push(new Ms(b)),this.ba+=65536};
n.qd=function(a,b){b&&Kf(this,"E_INVALID_PAGE_SELECTOR :"+a+"("+b.join("")+")");this.F.push(":"+a);switch(a.toLowerCase()){case "first":this.b.push(new Ns(this.f));this.ba+=256;break;case "left":this.b.push(new Os(this.f));this.ba+=1;break;case "right":this.b.push(new Ps(this.f));this.ba+=1;break;case "recto":this.b.push(new Qs(this.f));this.ba+=1;break;case "verso":this.b.push(new Rs(this.f));this.ba+=1;break;default:Kf(this,"E_INVALID_PAGE_SELECTOR :"+a)}};
function Us(a){var b;a.g||a.F.length?b=[a.g].concat(a.F.sort()):b=null;a.H.push({rf:b,ba:a.ba});a.g="";a.F=[]}n.Sc=function(){Us(this);Kj.prototype.Sc.call(this)};n.La=function(){Us(this);Kj.prototype.La.call(this)};
n.Sb=function(a,b,c){if("bleed"!==a&&"marks"!==a||this.H.some(function(a){return!a.rf})){Kj.prototype.Sb.call(this,a,b,c);var d=this.mb[a],e=this.S;if("bleed"===a||"marks"===a)e[""]||(e[""]={}),Object.keys(e).forEach(function(b){$h(e[b],a,d)});else if("size"===a){var f=e[""];this.H.forEach(function(b){var c=new V(d.value,d.cb+b.ba);b=b.rf?b.rf.join(""):"";var g=e[b];g?(c=(b=g[a])?Xh(null,c,b):c,$h(g,a,c)):(g=e[b]={},$h(g,a,c),f&&["bleed","marks"].forEach(function(a){f[a]&&$h(g,a,f[a])},this))},this)}}};
n.Uf=function(a){oi(this.l.od,"*",a)};n.Xf=function(a){return new Ss(this.mb,a)};n.Qe=function(a){var b=ai(this.mb,"_marginBoxes"),c=b[a];c||(c={},b[a]=c);Gf(this.oa,new Vs(this.f,this.oa,this.A,c))};function Vs(a,b,c,d){Hf.call(this,a,b,!1);this.g=c;this.b=d}v(Vs,If);Vs.prototype.Qb=function(a,b,c){Eh(this.g,a,b,c,this)};Vs.prototype.kd=function(a,b){Jf(this,"E_INVALID_PROPERTY_VALUE "+a+": "+b.toString())};Vs.prototype.fe=function(a,b){Jf(this,"E_INVALID_PROPERTY "+a+": "+b.toString())};
Vs.prototype.Sb=function(a,b,c){$h(this.b,a,new V(b,c?Df(this):Ef(this)))};function Ws(a){if(1>=a.length)return!1;var b=a[a.length-1].h;return a.slice(0,a.length-1).every(function(a){return b>a.h})}function Xs(a,b){a.b?a.width=b:a.height=b}function Ys(a){return a.b?a.width:a.height}function Zs(a,b){this.md=a;this.Tc=b}function $s(a,b,c){this.b=a;this.F=b;this.A=c;this.f=Ys(a)}
function at(a,b){var c=L("ColumnBalancer#balanceColumns");a.u(b);bt(a,b);Cl(a.b);var d=[ct(a,b)];Fe(function(b){a.l(d)?(a.D(d),a.F().then(function(c){bt(a,c);Cl(a.b);c?(d.push(ct(a,c)),P(b)):Q(b)})):Q(b)}).then(function(){var b=d.reduce(function(a,b){return b.Tc<a.Tc?b:a},d[0]);dt(a,b.md);Xs(a.b,a.f);O(c,b.md)});return c.result()}function ct(a,b){var c=a.j(b);return new Zs(b,c)}$s.prototype.u=function(){};function bt(a,b){var c=Hn(a.A);b&&(b.ug=c)}
function dt(a,b){var c=a.b.element;b.Fb.forEach(function(a){c.appendChild(a.element)});In(a.A,b.ug)}function et(a){var b=a[a.length-1];if(!b.Tc||(a=a[a.length-2])&&b.Tc>=a.Tc)return!1;a=b.md.Fb;b=Math.max.apply(null,a.map(function(a){return a.h}));a=Math.max.apply(null,a.map(function(a){return co(a.l)}));return b>a+1}function ft(a,b){var c=Math.max.apply(null,a[a.length-1].md.Fb.map(function(a){return isNaN(a.jf)?a.h:a.h-a.jf+1}))-1;c<Ys(b)?Xs(b,c):Xs(b,Ys(b)-1)}
function gt(a,b,c,d){$s.call(this,c,a,b);this.G=d;this.h=null;this.g=!1}v(gt,$s);gt.prototype.u=function(a){var b=a.Fb.reduce(function(a,b){return a+b.h},0);Xs(this.b,b/this.G);this.h=a.position};function ht(a,b){return a.h?ql(a.h,b):!b}gt.prototype.j=function(a){if(!ht(this,a.position))return Infinity;a=a.Fb;return Ws(a)?Infinity:Math.max.apply(null,a.map(function(a){return a.h}))};
gt.prototype.l=function(a){if(1===a.length)return!0;if(this.g)return et(a);a=a[a.length-1];return ht(this,a.md.position)&&!Ws(a.md.Fb)?this.g=!0:Ys(this.b)<this.f};gt.prototype.D=function(a){this.g?ft(a,this.b):Xs(this.b,Math.min(this.f,Ys(this.b)+.1*this.f))};function it(a,b,c){$s.call(this,c,a,b)}v(it,$s);it.prototype.j=function(a){if(a.Fb.every(function(a){return!a.h}))return Infinity;a=a.Fb.filter(function(a){return!a.g}).map(function(a){return a.h});return jt(a)};it.prototype.l=function(a){return et(a)};
it.prototype.D=function(a){ft(a,this.b)};function kt(a,b,c,d,e,f,g){if(b===Zc)return null;f=f[f.length-1];f=!(!f||!f.g);return!g.b.length||f?new gt(c,d,e,a):b===ad?new it(c,d,e):null};var lt=new He(function(){var a=L("uaStylesheetBase");Fh.get().then(function(b){var c=Ba("user-agent-base.css",Aa);b=new Kj(null,null,null,null,null,b,!0);b.Wc("UA");Jj=b.l;jg(c,b,null,null).Ea(a)});return a.result()},"uaStylesheetBaseFetcher");
function mt(a,b,c,d,e,f,g,h,l,k){this.j=a;this.f=b;this.b=c;this.g=d;this.H=e;this.D=f;this.A=a.S;this.F=g;this.h=h;this.u=l;this.G=k;this.l=a.j;Mb(this.b,function(a){var b=this.b,c;c=(c=b.b[a])?(c=c.b[0])?c.qa:null:null;var d;d=b.b[a];if(d=nt(this,d?d.g:"any"))d=(a=b.b[a])?0<a.b.length&&a.b[0].qa.f<=this.D:!1;return d&&!!c&&!ot(this,c)});Lb(this.b,new Kb(this.b,function(){return this.ta+this.b.page},"page-number"))}
function pt(a,b,c,d,e){if(a.u.length){var f=new Qb(0,b,c,d);a=a.u;for(var g={},h=0;h<a.length;h++)di(f,g,a[h],0,null,null,null);h=g.width;a=g.height;var l=g["text-zoom"];if(h&&a||l)if(g=Ob.em,(l?l.evaluate(f,"text-zoom"):null)===Kd&&(l=g/d,d=g,b*=l,c*=l),h&&a&&(h=Vc(h.evaluate(f,"width"),f),f=Vc(a.evaluate(f,"height"),f),0<h&&0<f))return{width:e&&e.ub?2*(h+e.Dc):h,height:f,fontSize:d}}return{width:b,height:c,fontSize:d}}
function qt(a,b,c,d,e,f,g,h,l,k,m,p){Qb.call(this,0,d.width,d.height,d.fontSize);this.style=a;this.da=b;this.lang=b.lang||c;this.viewport=d;this.l={body:!0};this.g=e;this.A=this.b=this.N=this.f=this.F=null;this.D=0;this.Mb=f;this.j=new um(this.style.A);this.ob={};this.sa=null;this.h=m;this.Zb=new dn(null,null,null,null,null,null,null);this.la={};this.H=p||null;this.Kb=g;this.Jb=h;this.ta=l;this.Lb=k;for(var q in a.h)(b=a.h[q]["flow-consume"])&&(b.evaluate(this,"flow-consume")==Xc?this.l[q]=!0:delete this.l[q]);
this.xb={};this.Ba=this.ua=0}v(qt,Qb);
function rt(a){var b=L("StyleInstance.init"),c=new Rp(a.h,a.da.url),d=new Sp(a.h,a.da.url,a.style.f,a.style.b);a.f=new bm(a.da,a.style.g,a.style.f,a,a.l,a.style.l,c,d);d.h=a.f;lm(a.f,a);a.N={};a.N[a.da.url]=a.f;var e=im(a.f);a.H||(a.H=as(e));a.F=new Yq(a.style.H);c=new sj(a.style.g,a,c,d);a.F.l(c,e);Xq(a.F,a);a.sa=new Is(c,a.style.b,a.F,a,e);e=[];c=t(a.style.D);for(d=c.next();!d.done;d=c.next())if(d=d.value,!d.ia||d.ia.evaluate(a))d=rm(d.Ec,a),d=new sm(d),e.push(d);Am(a.Mb,e,a.j).Ea(b);var f=a.style.G;
Object.keys(f).forEach(function(a){var b=hs(gs(f[a]),this);this.xb[a]={width:b.jc+2*b.qe,height:b.ic+2*b.qe}},a);return b.result()}function mm(a,b,c){if(a=a.b)a.f[b.b]||(a.f[b.b]=c),c=a.b[b.b],c||(c=new nl,a.b[b.b]=c),c.b.push(new ml(new kl({pa:[{node:b.element,kb:Wk,wa:null,Ja:null,Ga:null,Sa:0}],na:0,K:!1,Qa:null}),b))}
function st(a,b){for(var c=Number.POSITIVE_INFINITY,d=0;d<b.b.length;d++){for(var e=b.b[d].b.f,f=e.pa[0].node,g=e.na,h=e.K,l=0;f.ownerDocument!=a.da.b;)l++,f=e.pa[l].node,h=!1,g=0;e=ik(a.da,f,g,h);e<c&&(c=e)}return c}
function tt(a,b,c){if(!b)return 0;var d=Number.POSITIVE_INFINITY,e;for(e in a.l){var f=b.b[e];if(!(c||f&&f.b.length)&&a.b){f=a.f;f.S=e;for(var g=0;null!=f.S&&(g+=5E3,jm(f,g,0)!=Number.POSITIVE_INFINITY););f=a.b.b[e];b!=a.b&&f&&(f=f.clone(),b.b[e]=f)}f&&(f=st(a,f),f<d&&(d=f))}return d}function nt(a,b){switch(b){case "left":case "right":case "recto":case "verso":return(new vc(a.style.b,b+"-page")).evaluate(a);default:return!0}}
function ut(a,b){var c=a.b,d=tt(a,c);if(d==Number.POSITIVE_INFINITY)return null;for(var e=a.F.children,f,g=0;g<e.length;g++)if(f=e[g],"vivliostyle-page-rule-master"!==f.f.mc){var h=1,l=Hq(f,a,"utilization");l&&l.hf()&&(h=l.L);var l=Sb(a,"em",!1),k=a.jc()*a.ic();a.D=jm(a.f,d,Math.ceil(h*k/(l*l)));h=a;l=void 0;for(l in c.b)if((k=c.b[l])&&0<k.b.length){var m=k.b[0].qa;if(st(h,k)===m.f){a:switch(m=k.g,m){case "left":case "right":case "recto":case "verso":break a;default:m=null}k.g=Cm(Tl(m,k.b[0].qa.g))}}a.A=
c.clone();h=a;l=h.b.page;k=void 0;for(k in h.b.b)for(var m=h.b.b[k],p=m.b.length-1;0<=p;p--){var q=m.b[p];0>q.qa.wb&&q.qa.f<h.D&&(q.qa.wb=l)}Rb(a,a.style.b);h=Hq(f,a,"enabled");if(!h||h===Yd){c=a;w.debug("Location - page",c.b.page);w.debug("  current:",d);w.debug("  lookup:",c.D);d=void 0;for(d in c.b.b)for(e=t(c.b.b[d].b),g=e.next();!g.done;g=e.next())w.debug("  Chunk",d+":",g.value.qa.f);d=a.sa;e=f;f=b;c=e.f;Object.keys(f).length?(e=c,g=Ks(d,f),e=e.j+"^"+g,g=d.j[e],g||("background-host"===c.mc?
(c=d,f=(new ss(c.l,c.h.f,f)).h(c.h),f.l(c.f,c.g),Xq(f,c.b),g=f):g=Ls(d,f,c),d.j[e]=g),f=g.f,f.f.g=f,f=g):(c.f.g=c,f=e);return f}}throw Error("No enabled page masters");}function ot(a,b){var c=a.A.f,d=c[b.b].f;if(d){var e=b.f,f=c[d].b;if(!f.length||e<f[0])return!1;var c=Za(f.length,function(a){return f[a]>e})-1,c=f[c],d=a.A.b[d],g=st(a,d);return c<g?!1:g<c?!0:!nt(a,d.g)}return!1}function vt(a,b,c){a=a.b.f[c];a.C||(a.C=new wo(null));b.kf=a.C}
function wt(a){var b=a.l,c=xn(b),d=L("layoutDeferredPageFloats"),e=!1,f=0;Fe(function(d){if(f===c.length)Q(d);else{var g=c[f++],l=g.ja,k=mn(l),m=k.xf(l,b);m&&bn(m,l)?P(d):nn(b,l)||zn(b,l)?(yn(b,g),Q(d)):Yo(a,g,k,null,m).then(function(a){a?(a=Jn(b.parent))?Q(d):(Jn(b)&&!a&&(e=!0,b.Qc=!1),P(d)):Q(d)})}}).then(function(){e&&pn(b);O(d,!0)});return d.result()}
function xt(a,b,c){var d=a.b.b[c];if(!d||!nt(a,d.g))return M(!0);d.g="any";vt(a,b,c);Wo(b);a.l[c]&&0<b.Cb.length&&(b.Kb=!1);var e=L("layoutColumn");wt(b).then(function(){if(Jn(b.l))O(e,!0);else{var f=[],g=[],h=!0;Fe(function(e){if(!tn(b.l,c))for(var k={};0<d.b.length-g.length;){for(k.index=0;g.includes(k.index);)k.index++;k.selected=d.b[k.index];if(k.selected.qa.f>a.D||ot(a,k.selected.qa))break;for(var l=k.index+1;l<d.b.length;l++)if(!g.includes(l)){var p=d.b[l];if(p.qa.f>a.D||ot(a,p.qa))break;Pk(p.qa,
k.selected.qa)&&(k.selected=p,k.index=l)}k.qa=k.selected.qa;k.Oa=!0;Mm(b,k.selected.b,h,d.f).then(function(a){return function(c){if(Jn(b.l))Q(e);else if(h=!1,a.selected.qa.u&&(null===c||a.qa.h)&&f.push(a.index),a.qa.h)g.push(a.index),Q(e);else{var k=!!c||!!b.g,l;0<An(b.l).length&&b.xb?c?(l=c.clone(),l.f=b.xb):l=new kl(b.xb):l=null;if(b.g&&l)a.selected.b=l,d.f=b.g,b.g=null;else{g.push(a.index);if(c||l)a.selected.b=c||l,f.push(a.index);b.g&&(d.g=Cm(b.g))}k?Q(e):(b.Kb=!1,a.Oa?a.Oa=!1:P(e))}}}(k));if(k.Oa){k.Oa=
!1;return}k={selected:k.selected,qa:k.qa,index:k.index,Oa:k.Oa}}Q(e)}).then(function(){if(!Jn(b.l)){d.b=d.b.filter(function(a,b){return f.includes(b)||!g.includes(b)});"column"===d.f&&(d.f=null);Fp(b);var a=Wn(b.l);To(b,a)}O(e,!0)})}});return e.result()}
function yt(a,b,c,d,e,f,g,h,l,k,m,p,q,r,z){var u=b.b?b.j&&b.N:b.h&&b.S,A=f.element,D=new dn(l,"column",null,h,null,null,null),I=a.b.clone(),K=L("createAndLayoutColumn"),H;Fe(function(b){var K=new mo([new hq(a.h,a.b.page-1)].concat($n(D)));if(1<k){var ma=a.viewport.b.createElement("div");x(ma,"position","absolute");A.appendChild(ma);H=new Km(ma,r,a.g,K,D);H.Kb=z;H.b=f.b;H.Mb=f.Mb;H.Rd=f.Rd;f.b?(K=g*(p+m)+f.J,zl(H,f.H,f.width),yl(H,K,p)):(K=g*(p+m)+f.H,yl(H,f.J,f.height),zl(H,K,p));H.F=c;H.G=d}else H=
new Km(A,r,a.g,K,D),xl(H,f);H.ob=u?[]:e.concat();H.Lb=q;hn(D,H);0<=H.width?xt(a,H,h).then(function(){Jn(D)||Fn(D);Jn(H.l)&&!Jn(l)?(H.l.Qc=!1,a.b=I.clone(),H.element!==A&&A.removeChild(H.element),P(b)):Q(b)}):(Fn(D),Q(b))}).then(function(){O(K,H)});return K.result()}function zt(a,b,c,d,e){var f=Hq(c,a,"writing-mode")||null;a=Hq(c,a,"direction")||null;return new dn(b,"region",d,e,null,f,a)}
function At(a,b,c,d,e,f,g,h,l,k){function m(){p.b=q.clone();return Bt(p,b,c,d,e,f,g,r,h,l,k,z).ea(function(a){return a?M({Fb:a,position:p.b}):M(null)})}var p=a,q=p.b.clone(),r=zt(p,g,c,h,l),z=!0;return m().ea(function(a){if(!a)return M(null);if(1>=k)return M(a.Fb);var b=Hq(c,p,"column-fill")||$c,b=kt(k,b,m,r,h,a.Fb,p.b.b[l]);if(!b)return M(a.Fb);z=!1;g.g=!0;r.g=!0;return at(b,a).ea(function(a){g.g=!1;g.Qc=!1;r.g=!1;p.b=a.position;return M(a.Fb)})})}
function Bt(a,b,c,d,e,f,g,h,l,k,m,p){var q=L("layoutFlowColumns"),r=a.b.clone(),z=Z(c,a,"column-gap"),u=1<m?Z(c,a,"column-width"):l.width,A=Gq(c,a),D=Hq(c,a,"shape-inside"),I=Rg(D,0,0,l.width,l.height,a),K=new rr(k,a,a.viewport,a.f,A,a.da,a.j,a.style.F,a,b,a.Kb,a.Jb,a.Lb),H=0,ma=null,Ca=[];Fe(function(b){yt(a,c,d,e,f,l,H++,k,h,m,z,u,I,K,p).then(function(c){Jn(g)?(Ca=null,Q(b)):((c.g&&"column"!==c.g||H===m)&&!Jn(h)&&Fn(h),Jn(h)?(H=0,a.b=r.clone(),h.Qc=!1,h.g?(Ca=null,Q(b)):P(b)):(ma=c,Ca[H-1]=ma,ma.g&&
"column"!=ma.g&&(H=m,"region"!=ma.g&&(a.la[k]=!0)),H<m?P(b):Q(b)))})}).then(function(){O(q,Ca)});return q.result()}
function Ct(a,b,c,d,e,f,g,h){Aq(c);var l=Hq(c,a,"enabled");if(l&&l!==Yd)return M(!0);var k=L("layoutContainer"),m=Hq(c,a,"wrap-flow")===Zc,l=Hq(c,a,"flow-from"),p=a.viewport.b.createElement("div"),q=Hq(c,a,"position");x(p,"position",q?q.name:"absolute");d.insertBefore(p,d.firstChild);var r=new rl(p);r.b=c.b;r.ob=g;c.kc(a,r,b,a.j,a.g);r.F=e;r.G=f;e+=r.left+r.marginLeft+r.Z;f+=r.top+r.marginTop+r.ca;(c instanceof xs||c instanceof qq&&!(c instanceof ws))&&hn(h,r);var z=!1;if(l&&l.Vf())if(a.la[l.toString()])Jn(h)||
c.Qd(a,r,b,null,1,a.g,a.j),l=M(!0);else{var u=L("layoutContainer.inner"),A=l.toString(),D=Z(c,a,"column-count");At(a,b,c,e,f,g,h,r,A,D).then(function(d){if(!Jn(h)){var e=d[0];e.element===p&&(r=e);r.h=Math.max.apply(null,d.map(function(a){return a.h}));c.Qd(a,r,b,e,D,a.g,a.j);(d=a.b.b[A])&&"region"===d.f&&(d.f=null)}O(u,!0)});l=u.result()}else{if((l=Hq(c,a,"content"))&&Hl(l)){q="span";l.url&&(q="img");var I=a.viewport.b.createElement(q);l.fa(new Gl(I,a,l,fq(a.h)));p.appendChild(I);"img"==q&&Wq(c,a,
I,a.j);Vq(c,a,r,a.j)}else c.ua&&(d.removeChild(p),z=!0);z||c.Qd(a,r,b,null,1,a.g,a.j);l=M(!0)}l.then(function(){if(Jn(h))O(k,!0);else{if(!c.h||0<Math.floor(r.h)){if(!z&&!m){var l=Hq(c,a,"shape-outside"),l=El(r,l,a);g.push(l)}}else if(!c.children.length){d.removeChild(p);O(k,!0);return}var q=c.children.length-1;Ee(function(){for(;0<=q;){var d=c.children[q--],d=Ct(a,b,d,p,e,f,g,h);if(d.Xa())return d.ea(function(){return M(!Jn(h))});if(Jn(h))break}return M(!1)}).then(function(){O(k,!0)})}});return k.result()}
function Dt(a){var b=a.b.page,c;for(c in a.b.b)for(var d=a.b.b[c],e=d.b.length-1;0<=e;e--){var f=d.b[e];0<=f.qa.wb&&f.qa.wb+f.qa.l-1<=b&&d.b.splice(e,1)}}function Et(a,b){for(var c in a.l){var d=b.b[c];if(d&&0<d.b.length)return!1}return!0}
function Ft(a,b,c){var d=b.I===b.h;a.la={};c?(a.b=c.clone(),em(a.f,c.g)):(a.b=new pl,em(a.f,-1));a.lang&&b.h.setAttribute("lang",a.lang);c=a.b;c.page++;Rb(a,a.style.b);a.A=c.clone();var e=d?{}:Js(a.sa),f=ut(a,e);if(!f)return M(null);var g=0;if(!d){Gk(b,f.f.b.width.value===$d);Hk(b,f.f.b.height.value===ae);a.h.j=b;aq(a.h,e,a);var h=hs(gs(e),a);Gt(a,h,b);os(e,h,b,a);g=h.ac+h.$b}e=!d&&Hq(f,a,"writing-mode")||sd;a.G=e!=sd;var h=Hq(f,a,"direction")||Cd,l=new dn(a.Zb,"page",null,null,null,e,h),k=L("layoutNextPage");
Fe(function(c){Ct(a,b,f,b.h,g,g+1,[],l).then(function(){Jn(l)||Fn(l);Jn(l)?(a.b=a.A.clone(),l.Qc=!1,P(c)):Q(c)})}).then(function(){f.ca(a,b,a.g);if(!d){var e=new vc(f.f.f,"left-page");b.b=e.evaluate(a)?"left":"right";Dt(a);c=a.b;Object.keys(c.b).forEach(function(b){b=c.b[b];var d=b.f;!d||"page"!==d&&nt(a,d)||(b.f=null)})}a.b=a.A=null;c.g=a.f.b;Jk(b,a.style.j.N[a.da.url],a.g);Et(a,c)&&(c=null);O(k,c)});return k.result()}
function Gt(a,b,c){a.Y=b.jc;a.S=b.ic;a.Ba=b.jc+2*b.qe;a.ua=b.ic+2*b.qe;c.I.style.width=a.Ba+"px";c.I.style.height=a.ua+"px";c.h.style.left=b.ac+"px";c.h.style.right=b.ac+"px";c.h.style.top=b.ac+"px";c.h.style.bottom=b.ac+"px";c.h.style.padding=b.$b+"px";c.h.style.paddingTop=b.$b+1+"px"}function Ht(a,b,c,d){Kj.call(this,a.j,a,b,c,d,a.h,!c);this.g=a;this.F=!1}v(Ht,Kj);n=Ht.prototype;n.ce=function(){};
n.be=function(a,b,c){a=new pq(this.g.u,a,b,c,this.g.G,this.ia,Ef(this.oa));Gf(this.g,new cr(a.f,this.g,a,this.A))};n.Fc=function(a){a=a.Mc;this.ia&&(a=Bc(this.f,this.ia,a));Gf(this.g,new Ht(this.g,a,this,this.G))};n.Zd=function(){Gf(this.g,new Qj(this.f,this.oa))};n.ae=function(){var a={};this.g.A.push({Ec:a,ia:this.ia});Gf(this.g,new Rj(this.f,this.oa,null,a,this.g.h))};n.$d=function(a){var b=this.g.l[a];b||(b={},this.g.l[a]=b);Gf(this.g,new Rj(this.f,this.oa,null,b,this.g.h))};
n.ee=function(){var a={};this.g.H.push(a);Gf(this.g,new Rj(this.f,this.oa,this.ia,a,this.g.h))};n.wd=function(a){var b=this.g.D;if(a){var c=ai(b,"_pseudos"),b=c[a];b||(b={},c[a]=b)}Gf(this.g,new Rj(this.f,this.oa,null,b,this.g.h))};n.de=function(){this.F=!0;this.Tb()};n.Vc=function(){var a=new Ts(this.g.u,this.g,this,this.A,this.g.F);Gf(this.g,a);a.Vc()};
n.La=function(){Kj.prototype.La.call(this);if(this.F){this.F=!1;var a="R"+this.g.N++,b=E(a),c;this.ia?c=new Wh(b,0,this.ia):c=new V(b,0);ci(this.mb,"region-id").push(c);this.dc();a=new Ht(this.g,this.ia,this,a);Gf(this.g,a);a.La()}};
function It(a){var b=a.getAttribute("content");if(!b)return"";a={};for(var c;c=b.match(/^,?\s*([-A-Za-z_.][-A-Za-z_0-9.]*)\s*=\s*([-+A-Za-z_0-9.]*)\s*/);)b=b.substr(c[0].length),a[c[1]]=c[2];b=a.width-0;a=a.height-0;return b&&a?"@-epubx-viewport{width:"+b+"px;height:"+a+"px;}":""}function Jt(a){Ff.call(this);this.h=a;this.j=new Hb(null);this.u=new Hb(this.j);this.G=new mq(this.j);this.J=new Ht(this,null,null,null);this.N=0;this.A=[];this.D={};this.l={};this.H=[];this.F={};this.b=this.J}v(Jt,Ff);
Jt.prototype.error=function(a){w.b("CSS parser:",a)};function Kt(a,b){return Lt(b,a)}function Mt(a){yf.call(this,Kt,"document");this.S=a;this.H={};this.A={};this.f={};this.N={};this.j=null;this.b=[];this.J=!1}v(Mt,yf);function Nt(a,b,c){Ot(a,b,c);var d=Ba("user-agent.xml",Aa),e=L("OPSDocStore.init");Fh.get().then(function(b){a.j=b;lt.get().then(function(){a.load(d).then(function(){a.J=!0;O(e,!0)})})});return e.result()}function Ot(a,b,c){a.b.splice(0);b&&b.forEach(a.Y,a);c&&c.forEach(a.Z,a)}
Mt.prototype.Y=function(a){var b=a.url;b&&(b=Ba(Ea(b),za));this.b.push({url:b,text:a.text,qb:"Author",Pa:null,media:null})};Mt.prototype.Z=function(a){var b=a.url;b&&(b=Ba(Ea(b),za));this.b.push({url:b,text:a.text,qb:"User",Pa:null,media:null})};
function Lt(a,b){var c=L("OPSDocStore.load"),d=b.url,e=d.endsWith("?viv-toc-box");qk(b,a).then(function(b){if(b){if(a.J)for(var f=he("PREPROCESS_SINGLE_DOCUMENT"),h=0;h<f.length;h++)try{f[h](b.b)}catch(A){w.b("Error during single document preprocessing:",A)}for(var f=[],l=b.b.getElementsByTagNameNS("http://www.idpf.org/2007/ops","trigger"),h=0;h<l.length;h++){var k=l[h],m=k.getAttributeNS("http://www.w3.org/2001/xml-events","observer"),p=k.getAttributeNS("http://www.w3.org/2001/xml-events","event"),
q=k.getAttribute("action"),k=k.getAttribute("ref");m&&p&&q&&k&&f.push({Hg:m,event:p,action:q,sd:k})}a.N[d]=f;var r=[];r.push({url:Ba("user-agent-page.css",Aa),text:null,qb:"UA",Pa:null,media:null});h=b.l;if(!e&&h)for(h=h.firstChild;h;h=h.nextSibling)if(1==h.nodeType)if(f=h,l=f.namespaceURI,m=f.localName,"http://www.w3.org/1999/xhtml"==l)if("style"==m)l=f.getAttribute("class"),m=f.getAttribute("media"),p=f.getAttribute("title"),r.push({url:d,text:f.textContent,qb:"Author",Pa:p?l:null,media:m});else if("link"==
m){if(p=f.getAttribute("rel"),l=f.getAttribute("class"),m=f.getAttribute("media"),"stylesheet"==p||"alternate stylesheet"==p&&l)p=f.getAttribute("href"),p=Ba(p,d),f=f.getAttribute("title"),r.push({url:p,text:null,Pa:f?l:null,media:m,qb:"Author"})}else"meta"==m&&"viewport"==f.getAttribute("name")&&r.push({url:d,text:It(f),qb:"Author",Pa:null,media:null});else"http://www.gribuser.ru/xml/fictionbook/2.0"==l?"stylesheet"==m&&"text/css"==f.getAttribute("type")&&r.push({url:d,text:f.textContent,qb:"Author",
Pa:null,media:null}):"http://example.com/sse"==l&&"property"===m&&(l=f.getElementsByTagName("name")[0])&&"stylesheet"===l.textContent&&(f=f.getElementsByTagName("value")[0])&&(p=Ba(f.textContent,d),r.push({url:p,text:null,Pa:null,media:null,qb:"Author"}));if(!e)for(h=0;h<a.b.length;h++)r.push(a.b[h]);for(var z="",h=0;h<r.length;h++)z+=r[h].url,z+="^",r[h].text&&(z+=r[h].text),z+="^";var u=a.H[z];u?(a.f[d]=u,O(c,b)):(h=a.A[z],h||(h=new He(function(){var b=L("fetchStylesheet"),c=0,d=new Jt(a.j);Ee(function(){if(c<
r.length){var a=r[c++];d.Wc(a.qb);return null!==a.text?kg(a.text,d,a.url,a.Pa,a.media).Hc(!0):jg(a.url,d,a.Pa,a.media)}return M(!1)}).then(function(){u=new mt(a,d.j,d.u,d.J.l,d.G,d.A,d.D,d.l,d.H,d.F);a.H[z]=u;delete a.A[z];O(b,u)});return b.result()},"FetchStylesheet "+d),a.A[z]=h,h.start()),h.get().then(function(e){a.f[d]=e;O(c,b)}))}else O(c,null)});return c.result()};function Pt(a){return String.fromCharCode(a>>>24&255,a>>>16&255,a>>>8&255,a&255)}
function Qt(a){var b=new Ra;b.append(a);var c=55-a.length&63;for(b.append("\u0080");0<c;)c--,b.append("\x00");b.append("\x00\x00\x00\x00");b.append(Pt(8*a.length));a=b.toString();for(var b=[1732584193,4023233417,2562383102,271733878,3285377520],c=[],d,e=0;e<a.length;e+=64){for(d=0;16>d;d++){var f=a.substr(e+4*d,4);c[d]=(f.charCodeAt(0)&255)<<24|(f.charCodeAt(1)&255)<<16|(f.charCodeAt(2)&255)<<8|f.charCodeAt(3)&255}for(;80>d;d++)f=c[d-3]^c[d-8]^c[d-14]^c[d-16],c[d]=f<<1|f>>>31;var f=b[0],g=b[1],h=
b[2],l=b[3],k=b[4],m;for(d=0;80>d;d++)m=20>d?(g&h|~g&l)+1518500249:40>d?(g^h^l)+1859775393:60>d?(g&h|g&l|h&l)+2400959708:(g^h^l)+3395469782,m+=(f<<5|f>>>27)+k+c[d],k=l,l=h,h=g<<30|g>>>2,g=f,f=m;b[0]=b[0]+f|0;b[1]=b[1]+g|0;b[2]=b[2]+h|0;b[3]=b[3]+l|0;b[4]=b[4]+k|0}return b}function Rt(a){var b=Qt(a);a=[];for(var b=t(b),c=b.next();!c.done;c=b.next())c=c.value,a.push(c>>>24&255,c>>>16&255,c>>>8&255,c&255);return a}
function St(a){a=Qt(a);for(var b=new Ra,c=0;c<a.length;c++)b.append(Pt(a[c]));a=b.toString();b=new Ra;for(c=0;c<a.length;c++)b.append((a.charCodeAt(c)|256).toString(16).substr(1));return b.toString()};function Tt(a,b,c,d,e,f,g,h,l,k){this.b=a;this.url=b;this.lang=c;this.f=d;this.l=e;this.$=zb(f);this.$.ub=!1;this.u=g;this.j=h;this.h=l;this.g=k;this.nb=this.page=null}function Ut(a,b,c){if(c--)for(b=b.firstChild;b;b=b.nextSibling)if(1==b.nodeType){var d=b;"auto"!=Pa(d,"height","auto")&&(x(d,"height","auto"),Ut(a,d,c));"absolute"==Pa(d,"position","static")&&(x(d,"position","relative"),Ut(a,d,c))}}
function Vt(a){var b=a.target,c="\u25b8"==b.textContent;b.textContent=c?"\u25be":"\u25b8";var d=b.parentNode;b.setAttribute("aria-expanded",c?"true":"false");d.setAttribute("aria-expanded",c?"true":"false");for(b=d.firstChild;b;){if(1===b.nodeType){var e=b,f=e.getAttribute("data-adapt-class");if("toc-container"===f){if(e.setAttribute("aria-hidden",c?"false":"true"),e.firstChild){b=e.firstChild;continue}}else"toc-node"===f&&(e.style.height=c?"auto":"0px",3<=e.children.length&&(e.children[0].tabIndex=
c?0:-1),2<=e.children.length&&(e.children[1].tabIndex=c?0:-1))}for(;!b.nextSibling&&b.parentNode!==d;)b=b.parentNode;b=b.nextSibling}a.stopPropagation()}
Tt.prototype.Ge=function(a){var b=this.u.Ge(a);return function(a,d,e){var c=e.behavior;if(c)switch(c.toString()){case "body-child":a.parentElement.getAttribute("data-vivliostyle-primary-entry")&&(a.querySelector("[role=doc-toc], [role=directory], nav li a, .toc, #toc")||(e.display=J));break;case "toc-node-anchor":e.color=td;e["text-decoration"]=J;break;case "toc-node":e.display=bd;e.margin=be;e.padding=be;e["padding-inline-start"]=new F(1.25,"em");break;case "toc-node-first-child":e.display=vd,e.margin=
new F(.2,"em"),e["vertical-align"]=Td,e.color=td,e["text-decoration"]=J}if(!c||"toc-node"!=c.toString()&&"toc-container"!=c.toString())return b(a,d,e);(e=a.firstChild)&&1!==e.nodeType&&""===e.textContent.trim()&&a.replaceChild(a.ownerDocument.createComment(e.textContent),e);var g=d.getAttribute("data-adapt-class");if("toc-node"==g){var h=d.firstChild;"\u25b8"!=h.textContent&&(h.textContent="\u25b8",x(h,"cursor","pointer"),h.addEventListener("click",Vt,!1),h.setAttribute("role","button"),h.setAttribute("aria-expanded",
"false"),d.setAttribute("aria-expanded","false"),"0px"!==d.style.height&&(h.tabIndex=0))}e=d.ownerDocument.createElement("div");e.setAttribute("data-adapt-process-children","true");"toc-node"==c.toString()?(h=d.ownerDocument.createElement("div"),h.textContent="\u25b9",x(h,"margin","0.2em 0 0 -1em"),x(h,"margin-inline-start","-1em"),x(h,"margin-inline-end","0"),x(h,"display","inline-block"),x(h,"width","1em"),x(h,"text-align","center"),x(h,"vertical-align","top"),x(h,"cursor","default"),x(h,"font-family",
"Menlo,sans-serif"),e.appendChild(h),x(e,"overflow","hidden"),e.setAttribute("data-adapt-class","toc-node"),e.setAttribute("role","treeitem"),"toc-node"==g||"toc-container"==g?(x(e,"height","0px"),(a=a.firstElementChild)&&"a"===a.localName&&(a.tabIndex=-1)):d.setAttribute("role","tree")):"toc-node"==g&&(e.setAttribute("data-adapt-class","toc-container"),e.setAttribute("role","group"),e.setAttribute("aria-hidden","true"));return M(e)}};
Tt.prototype.Uc=function(a,b,c,d,e){if(this.page)return M(this.page);var f=this,g=L("showTOC"),h=new Fk(a,a);this.page=h;this.b.load(this.url+"?viv-toc-box").then(function(d){var k=f.b.f[d.url],l=pt(k,c,1E5,e);b=new $r(b.window,l.fontSize,b.root,l.width,l.height);var p=new qt(k,d,f.lang,b,f.f,f.l,f.Ge(d),f.j,0,f.h,f.g);f.nb=p;p.$=f.$;rt(p).then(function(){Ft(p,h,null).then(function(){Array.from(h.I.querySelectorAll("[data-vivliostyle-toc-box]>*>*>*>*>*[style*='display: none']")).forEach(function(a){a.setAttribute("aria-hidden",
"true");a.setAttribute("hidden","hidden")});Ut(f,a,2);O(g,h)})})});return g.result()};Tt.prototype.Td=function(){this.page&&(this.page.I.style.visibility="hidden",this.page.I.setAttribute("aria-hidden","true"))};Tt.prototype.Rc=function(){return!!this.page&&"visible"===this.page.I.style.visibility};function Wt(){Mt.call(this,Xt(this));this.u=new yf(qk,"document");this.l=new yf(Af,"text");this.G={};this.la={};this.D={};this.F={}}v(Wt,Mt);function Xt(a){return function(b){return a.D[b]}}
function Yt(a,b,c){var d=L("loadPUBDoc"),e=b;e.endsWith("/")||(e+="/");a.u.load(e+"META-INF/container.xml",void 0,void 0).then(function(f){if(f){f=zk(fk(fk(fk(new gk([f.b]),"container"),"rootfiles"),"rootfile"),"full-path");f=t(f);for(var g=f.next();!g.done;g=f.next())if(g=g.value){Zt(a,e,g,c).Ea(d);return}}vf(b,null,"HEAD").then(function(e){if(400<=e.status)w.error("Failed to fetch a source document from "+b+" ("+e.status+(e.statusText?" "+e.statusText:"")+")"),O(d,null);else if(e.status||e.responseXML||
e.responseText||e.vd||e.contentType||!/\/[^/.]+(?:[#?]|$)/.test(b)||(b=b.replace(/([#?]|$)/,"/$1")),"application/oebps-package+xml"==e.contentType||/\.opf(?:[#?]|$)/.test(b)){var f=t(b.match(/^((?:.*\/)?)([^/]*)$/));f.next();e=f.next().value;f=f.next().value;Zt(a,e,f,c).Ea(d)}else"application/ld+json"==e.contentType||"application/webpub+json"==e.contentType||"application/audiobook+json"==e.contentType||"application/json"==e.contentType||/\.json(?:ld)?(?:[#?]|$)/.test(b)?a.l.load(b,!0,void 0).then(function(c){if(c){var e=
new $t(a,b);au(e,c).then(function(){O(d,e)})}else w.error("Received an empty response for "+b+". This may be caused by the server not allowing cross-origin resource sharing (CORS)."),O(d,null)}):bu(a,b).Ea(d)})});return d.result()}
function Zt(a,b,c,d){var e=b+c,f=a.G[e];if(f)return M(f);var g=L("loadOPF");a.u.load(e,!0,"Failed to fetch EPUB OPF "+e).then(function(c){c?a.u.load(b+"META-INF/encryption.xml",void 0,void 0).then(function(h){(d?a.l.load(b+"?r=list",void 0,void 0):M(null)).then(function(d){f=new $t(a,b);cu(f,c,h,d,b+"?r=manifest").then(function(){a.G[e]=f;a.la[b]=f;O(g,f)})})}):w.error("Received an empty response for EPUB OPF "+e+". This may be caused by the server not allowing cross-origin resource sharing (CORS).")});
return g.result()}
function bu(a,b){var c=L("loadWebPub");a.load(b).then(function(d){if(d){var e=d.b,f=new $t(a,b);e.body&&e.body.setAttribute("data-vivliostyle-primary-entry",!0);var g=e.querySelector("link[rel='publication'],link[rel='manifest'][type='application/webpub+json']");if(g){var h=g.getAttribute("href");/^#/.test(h)?(g=JSON.parse(e.getElementById(h.substr(1)).textContent),au(f,g,e).then(function(){O(c,f)})):a.l.load(g.href,void 0,void 0).then(function(a){au(f,a,e).then(function(){O(c,f)})})}else au(f,{},
e).then(function(){f.Yb&&f.Yb.src===d.url&&!e.querySelector("[role=doc-toc], [role=directory], nav, .toc, #toc")&&(f.Yb=null);O(c,f)})}else w.error("Received an empty response for "+b+". This may be caused by the server not allowing cross-origin resource sharing (CORS).")});return c.result()}function du(a,b,c){var d=L("EPUBDocStore.load");b=ya(b);(a.F[b]=Lt(a,{status:200,statusText:"",url:b,contentType:c.contentType,responseText:null,responseXML:c,vd:null})).Ea(d);return d.result()}
Wt.prototype.load=function(a){var b=ya(a);if(a=this.F[b])return a.Xa()?a:M(a.get());var c=L("EPUBDocStore.load");a=Wt.ng.load.call(this,b,!0,"Failed to fetch a source document from "+b);a.then(function(a){a?O(c,a):b.startsWith("data:")?w.error("Failed to load "+b+". Invalid data."):b.startsWith("http:")&&za.startsWith("https:")?w.error("Failed to load "+b+'. Mixed Content ("http:" content on "https:" context) is not allowed.'):w.error("Received an empty response for "+b+". This may be caused by the server not allowing cross-origin resource sharing (CORS).")});
return c.result()};function eu(){this.id=null;this.src="";this.j=this.h=this.g=null;this.P=-1;this.u=0;this.A=null;this.f=this.b=0;this.nc=this.wb=null;this.l=bb}function fu(a){return a.id}
function gu(a){var b=Rt(a);return function(a){var c=L("deobfuscator"),e,f;a.slice?(e=a.slice(0,1040),f=a.slice(1040,a.size)):(e=a.webkitSlice(0,1040),f=a.webkitSlice(1040,a.size-1040));xf(e).then(function(a){a=new DataView(a);for(var d=0;d<a.byteLength;d++){var e=a.getUint8(d),e=e^b[d%20];a.setUint8(d,e)}O(c,wf([a,f]))});return c.result()}}
var hu={dcterms:"http://purl.org/dc/terms/",marc:"http://id.loc.gov/vocabulary/",media:"http://www.idpf.org/epub/vocab/overlays/#",rendition:"http://www.idpf.org/vocab/rendition/#",onix:"http://www.editeur.org/ONIX/book/codelists/current.html#",xsd:"http://www.w3.org/2001/XMLSchema#"},iu=hu.dcterms+"language",ju=hu.dcterms+"title",ku=hu.rendition+"layout";
function lu(a,b){var c={};return function(d,e){var f,g,h=d.r||c,l=e.r||c;if(a==ju&&(f="main"==h["http://idpf.org/epub/vocab/package/#title-type"],g="main"==l["http://idpf.org/epub/vocab/package/#title-type"],f!=g))return f?-1:1;f=parseInt(h["http://idpf.org/epub/vocab/package/#display-seq"],10);isNaN(f)&&(f=Number.MAX_VALUE);g=parseInt(l["http://idpf.org/epub/vocab/package/#display-seq"],10);isNaN(g)&&(g=Number.MAX_VALUE);return f!=g?f-g:a!=iu&&b&&(f=(h[iu]||h["http://idpf.org/epub/vocab/package/#alternate-script"])==
b,g=(l[iu]||l["http://idpf.org/epub/vocab/package/#alternate-script"])==b,f!=g)?f?-1:1:d.o-e.o}}
function mu(a,b){function c(a){for(var b in a){var d=a[b];d.sort(lu(b,k));for(var e=0;e<d.length;e++){var f=d[e].r;f&&c(f)}}}function d(a){return eb(a,function(a){return db(a,function(a){var b={v:a.value,o:a.order};a.sh&&(b.s=a.scheme);if(a.id||a.lang){var c=l[a.id];if(c||a.lang)a.lang&&(a={name:iu,value:a.lang,lang:null,id:null,Pe:a.id,scheme:null,order:a.order},c?c.push(a):c=[a]),c=cb(c,function(a){return a.name}),b.r=d(c)}return b})})}function e(a){if(a&&(a=a.match(/^\s*(([^:]*):)?(\S+)\s*$/))){var b=
a[2]?f[a[2]]:"http://idpf.org/epub/vocab/package/#";if(b)return b+a[3]}return null}var f;if(b){f={};for(var g in hu)f[g]=hu[g];for(;g=b.match(/^\s*([A-Z_a-z\u007F-\uFFFF][-.A-Z_a-z0-9\u007F-\uFFFF]*):\s*(\S+)/);)b=b.substr(g[0].length),f[g[1]]=g[2]}else f=hu;var h=1;g=xk(yk(a),function(a){if("meta"==a.localName){var b=e(a.getAttribute("property"));if(b)return{name:b,value:a.textContent,id:a.getAttribute("id"),order:h++,Pe:a.getAttribute("refines"),lang:null,scheme:e(a.getAttribute("scheme"))}}else if("http://purl.org/dc/elements/1.1/"==
a.namespaceURI)return{name:hu.dcterms+a.localName,order:h++,lang:a.getAttribute("xml:lang"),value:a.textContent,id:a.getAttribute("id"),Pe:null,scheme:null};return null});var l=cb(g,function(a){return a.Pe});g=d(cb(g,function(a){return a.Pe?null:a.name}));var k=null;g[iu]&&(k=g[iu][0].v);c(g);return g}function nu(){var a=window.MathJax;return a?a.Hub:null}var ou={"application/xhtml+xml":!0,"image/jpeg":!0,"image/png":!0,"image/svg+xml":!0,"image/gif":!0,"audio/mp3":!0};
function $t(a,b){this.h=a;this.D=this.g=this.b=this.u=this.j=null;this.G=b;this.N=null;this.Z={};this.lang=null;this.l=0;this.F=!1;this.S=!0;this.A=null;this.f={};this.ca=this.Yb=this.lf=null;this.Y={};this.J=null;this.H=pu(this);nu()&&(Jh["http://www.w3.org/1998/Math/MathML"]=!0)}
function pu(a){function b(){}b.prototype.Re=function(a,b){return"viv-id-"+Ga(b+(a?"#"+a:""),":")};b.prototype.oc=function(b,d){var c=b.match(/^([^#]*)#?(.*)$/);if(c){var f=c[1]||d,c=c[2];if(f&&a.u.some(function(a){return a.src===f}))return"#"+this.Re(c,f)}return b};b.prototype.Kg=function(a){"#"===a.charAt(0)&&(a=a.substring(1));a.indexOf("viv-id-")||(a=a.substring(7));return(a=Xa(a).match(/^([^#]*)#?(.*)$/))?[a[1],a[2]]:[]};return new b}
function qu(a,b){if(b.startsWith("data:"))return b===a.G?"":b;if(a.G){var c=Ba("",a.G);if(b===c||b+"/"===c)return"";"/"!=c.charAt(c.length-1)&&(c+="/");return b.substr(0,c.length)==c?decodeURI(b.substr(c.length)):null}return b}
function cu(a,b,c,d,e){a.j=b;var f=fk(new gk([b.b]),"package"),g=zk(f,"unique-identifier")[0];g&&(g=mk(b,b.url+"#"+g))&&(a.N=g.textContent.replace(/[ \n\r\t]/g,""));var h={};a.u=db(fk(fk(f,"manifest"),"item").X,function(c){var d=new eu,e=b.url;d.id=c.getAttribute("id");d.src=Ba(c.getAttribute("href"),e);d.g=c.getAttribute("media-type");if(e=c.getAttribute("properties")){for(var e=e.split(/\s+/),f={},g=0;g<e.length;g++)f[e[g]]=!0;d.l=f}(c=c.getAttribute("fallback"))&&!ou[d.g]&&(h[d.src]=c);!a.Yb&&
d.l.nav&&(a.Yb=d);!a.ca&&d.l["cover-image"]&&(a.ca=d);return d});a.g=ab(a.u,fu);a.D=ab(a.u,function(b){return qu(a,b.src)});for(var l in h)for(g=l;;){g=a.g[h[g]];if(!g)break;if(ou[g.g]){a.Y[l]=g.src;break}g=g.src}a.b=db(fk(fk(f,"spine"),"itemref").X,function(b,c){var d=b.getAttribute("idref");if(d=a.g[d])d.j=b,d.P=c;return d});if(l=zk(fk(f,"spine"),"toc")[0])a.lf=a.g[l];if(l=zk(fk(f,"spine"),"page-progression-direction")[0]){a:switch(l){case "ltr":l="ltr";break a;case "rtl":l="rtl";break a;default:throw Error("unknown PageProgression: "+
l);}a.J=l}var g=c?zk(fk(fk(vk(fk(fk(new gk([c.b]),"encryption"),"EncryptedData"),uk()),"CipherData"),"CipherReference"),"URI"):[],k=fk(fk(f,"bindings"),"mediaType").X;for(c=0;c<k.length;c++){var m=k[c].getAttribute("handler");(l=k[c].getAttribute("media-type"))&&m&&a.g[m]&&(a.Z[l]=a.g[m].src)}a.f=mu(fk(f,"metadata"),zk(f,"prefix")[0]);a.f[iu]&&(a.lang=a.f[iu][0].v);a.f[ku]&&(a.F="pre-paginated"===a.f[ku][0].v);if(!d){if(0<g.length&&a.N)for(d=gu(a.N),c=0;c<g.length;c++)a.h.D[a.G+g[c]]=d;a.F&&ru(a);
return M(!0)}f=new Ra;k={};if(0<g.length&&a.N)for(l="1040:"+St(a.N),c=0;c<g.length;c++)k[g[c]]=l;for(c=0;c<d.length;c++){var p=d[c];if(m=p.n){var q=decodeURI(m),g=a.D[q];l=null;g&&(g.A=0!=p.m,g.u=p.c,g.g&&(l=g.g.replace(/\s+/g,"")));g=k[q];if(l||g)f.append(m),f.append(" "),f.append(l||"application/octet-stream"),g&&(f.append(" "),f.append(g)),f.append("\n")}}ru(a);return vf(e,"","POST",f.toString(),"text/plain")}
function ru(a){for(var b=0,c=t(a.b),d=c.next();!d.done;d=c.next()){var d=d.value,e=a.F?1:Math.ceil(d.u/1024);d.b=b;d.f=e;b+=e}a.l=b;a.A&&a.A(a.l)}function su(a,b){a.S=b||a.F}
function tu(a,b){a.A=b;if(a.S)return a.F&&!a.l&&ru(a),M(!0);var c=0,d=0,e=L("countEPages");Fe(function(b){if(d===a.b.length)Q(b);else{var e=a.b[d++];e.b=c;a.h.load(e.src).then(function(d){var f=1800,g=d.lang||a.lang;g&&g.match(/^(ja|ko|zh)/)&&(f/=3);e.f=Math.ceil(jk(d)/f);c+=e.f;a.l=c;a.A&&a.A(a.l);P(b)})}}).Ea(e);return e.result()}
function uu(a,b,c){a.g={};a.D={};a.u=[];a.b=a.u;var d=a.j=new ek(null,"",(new DOMParser).parseFromString("<spine></spine>","text/xml"));b.forEach(function(a){var b=new eu;b.P=a.index;b.id="item"+(a.index+1);b.src=a.url;b.wb=a.wb;b.nc=a.nc;var c=d.b.createElement("itemref");c.setAttribute("idref",b.id);d.root.appendChild(c);b.j=c;this.g[b.id]=b;c=qu(this,a.url);null==c&&(c=a.url);this.D[c]=b;this.u.push(b)},a);return c?du(a.h,b[0].url,c):M(null)}
function au(a,b,c){b.readingProgression&&(a.J=b.readingProgression);void 0===a.f&&(a.f={});var d=c&&c.title||b.name||b.metadata&&b.metadata.title;d&&(a.f[ju]=[{v:d}]);var e=qu(a,a.G);!b.readingOrder&&c&&null!==e&&(b.readingOrder=[encodeURI(e)],Array.from(c.querySelectorAll("[role=doc-toc] a[href],[role=directory] a[href],nav li a[href],.toc a[href],#toc a[href]")).forEach(function(c){c=ya(c.href);var d=qu(a,c);c=null!==d?encodeURI(d):c;-1==b.readingOrder.indexOf(c)&&b.readingOrder.push(c)}));var f=
[],g=0,h=-1;[b.readingOrder,b.resources].forEach(function(c){c instanceof Array&&c.forEach(function(c){var d=b.readingOrder.includes(c),e="string"===typeof c?c:c.url||c.href,k="string"===typeof c?"":c.oh||c.href&&c.type||"";if(d||"text/html"===k||"application/xhtml+xml"===k||/(^|\/)([^/]+\.(x?html|htm|xht)|[^/.]*)([#?]|$)/.test(e))d={url:Ba(Ea(e),a.G),index:g++,wb:null,nc:null},"contents"===c.rel&&-1===h&&(h=d.index),f.push(d)})});var l=L("initWithWebPubManifest");uu(a,f).then(function(){-1!==h&&
(a.Yb=a.u[h]);a.Yb||(a.Yb=a.D[e]);O(l,!0)});return l.result()}function vu(a,b,c){var d=a.b[b],e=L("getCFI");a.h.load(d.src).then(function(a){var b=kk(a,c),f=null;b&&(a=ik(a,b,0,!1),f=new ub,xb(f,b,c-a),d.j&&xb(f,d.j,0),f=f.toString());O(e,f)});return e.result()}
function wu(a,b){return ne("resolveFragment",function(c){if(b){var d=new ub;vb(d,b);var e;if(a.j){var f=wb(d,a.j.b);if(1!=f.node.nodeType||f.K||!f.sd){O(c,null);return}var g=f.node,h=g.getAttribute("idref");if("itemref"!=g.localName||!h||!a.g[h]){O(c,null);return}e=a.g[h];d=f.sd}else e=a.b[0];a.h.load(e.src).then(function(a){var b=wb(d,a.b);a=ik(a,b.node,b.offset,b.K);O(c,{P:e.P,Fa:a,aa:-1})})}else O(c,null)},function(a,d){w.b(d,"Cannot resolve fragment:",b);O(a,null)})}
function xu(a,b){return ne("resolveEPage",function(c){if(0>=b)O(c,{P:0,Fa:0,aa:-1});else if(a.S){var d=a.b.findIndex(function(a){return!a.b&&!a.f||a.b<=b&&a.b+a.f>b});-1==d&&(d=a.b.length-1);var e=a.b[d];e&&e.f||(e=a.b[--d]);O(c,{P:d,Fa:-1,aa:Math.floor(b-e.b)})}else{var f=Za(a.b.length,function(c){c=a.b[c];return c.b+c.f>b});f==a.b.length&&f--;var g=a.b[f];a.h.load(g.src).then(function(a){b-=g.b;b>g.f&&(b=g.f);var d=0;0<b&&(a=jk(a),d=Math.round(a*b/g.f),d==a&&d--);O(c,{P:f,Fa:d,aa:-1})})}},function(a,
d){w.b(d,"Cannot resolve epage:",b);O(a,null)})}function yu(a,b){var c=a.b[b.P];if(a.S)return M(c.b+b.aa);if(0>=b.Fa)return M(c.b);var d=L("getEPage");a.h.load(c.src).then(function(a){a=jk(a);O(d,c.b+Math.min(a,b.Fa)*c.f/a)});return d.result()}function zu(a,b){return{page:a,position:{P:a.P,aa:b,Fa:a.offset}}}function Au(a,b,c,d,e){this.O=a;this.viewport=b;this.j=c;this.l=e;this.Ib=[];this.g=[];this.$=zb(d);this.h=new Yr(b);this.f=new Zp(a.H);this.wf=!1}
function Bu(a,b){var c=a.Ib[b.P];return c?c.Ka[b.aa]:null}n=Au.prototype;n.fc=function(a){return this.O.J?this.O.J:(a=this.Ib[a?a.P:0])?a.nb.H:null};
function Cu(a,b,c,d){c.I.style.display="none";c.I.style.visibility="visible";c.I.style.position="";c.I.style.top="";c.I.style.left="";c.I.setAttribute("data-vivliostyle-page-side",c.b);var e=b.Ka[d];c.u=!b.item.P&&!d;b.Ka[d]=c;if(a.O.S){if(!d&&0<b.item.P){var f=a.O.b[b.item.P-1];b.item.b=f.b+f.f}b.item.f=b.Ka.length;a.O.l=a.O.b.reduce(function(a,b){return a+b.f},0);a.O.A&&a.O.A(a.O.l)}if(e)b.nb.viewport.f.replaceChild(c.I,e.I),gb(e,{type:"replaced",target:null,currentTarget:null,ag:c});else{e=null;
if(0<d)e=b.Ka[d-1].I.nextElementSibling;else for(f=b.item.P+1;f<a.Ib.length;f++){var g=a.Ib[f];if(g&&g.Ka[0]){e=g.Ka[0].I;break}}b.nb.viewport.f.insertBefore(c.I,e)}a.l({width:b.nb.Ba,height:b.nb.ua},b.nb.xb,b.item.P,b.nb.ta+d)}
function Du(a,b,c){var d=L("renderSinglePage"),e=Eu(a,b,c);Ft(b.nb,e,c).then(function(f){var g=(c=f)?c.page-1:b.jb.length-1;Cu(a,b,e,g);cq(a.f,e.P,g);f=null;if(c){var h=b.jb[c.page];b.jb[c.page]=c;h&&b.Ka[c.page]&&(ql(c,h)||(f=Du(a,b,c)))}f||(f=M(!0));f.then(function(){var f=dq(a.f,e),h=0;Fe(function(b){h++;if(h>f.length)Q(b);else{var c=f[h-1];c.Yd=c.Yd.filter(function(a){return!a.ud});c.Yd.length?Fu(a,c.P).then(function(d){d?(bq(a.f,c.Le),eq(a.f,c.Yd),Du(a,d,d.jb[c.aa]).then(function(c){var d=a.f;
d.b=d.F.pop();d=a.f;d.g=d.H.pop();d=c.Xd.position;d.P===e.P&&d.aa===g&&(e=c.Xd.page);P(b)})):P(b)}):P(b)}}).then(function(){e.I.parentElement||(e=b.Ka[g]);e.A=!c&&b.item.P===a.O.b.length-1;e.A&&gq(a.f,a.viewport);O(d,{Xd:zu(e,g),bg:c})})})});return d.result()}
function Gu(a,b){var c=a.aa,d=-1;0>c?(d=a.Fa,c=Za(b.jb.length,function(a){return tt(b.nb,b.jb[a],!0)>d}),c=c===b.jb.length?b.complete?b.jb.length-1:Number.POSITIVE_INFINITY:c-1):c===Number.POSITIVE_INFINITY&&-1!==a.Fa&&(d=a.Fa);return{P:a.P,aa:c,Fa:d}}
function Hu(a,b,c){var d=L("findPage");Fu(a,b.P).then(function(e){if(e){var f=null,g;Fe(function(d){var h=Gu(b,e);g=h.aa;(f=e.Ka[g])?Q(d):e.complete?(g=e.jb.length-1,f=e.Ka[g],Q(d)):c?Iu(a,h).then(function(a){a&&(f=a.page,g=a.position.aa);Q(d)}):De(100).then(function(){P(d)})}).then(function(){O(d,zu(f,g))})}else O(d,null)});return d.result()}
function Iu(a,b){var c=L("renderPage");Fu(a,b.P).then(function(d){if(d){var e=Gu(b,d),f=e.aa,g=e.Fa,h=d.Ka[f];h?O(c,zu(h,f)):Fe(function(b){if(f<d.jb.length)Q(b);else if(d.complete)f=d.jb.length-1,Q(b);else{var c=d.jb[d.jb.length-1];Du(a,d,c).then(function(a){var e=a.Xd.page;(c=a.bg)?0<=g&&tt(d.nb,c)>g?(h=e,f=d.jb.length-2,Q(b)):P(b):(h=e,f=a.Xd.position.aa,d.complete=!0,Q(b))})}}).then(function(){h=h||d.Ka[f];var b=d.jb[f];h?O(c,zu(h,f)):Du(a,d,b).then(function(a){a.bg||(d.complete=!0);O(c,a.Xd)})})}else O(c,
null)});return c.result()}n.Rb=function(){return Ju(this,{P:this.O.b.length-1,aa:Number.POSITIVE_INFINITY,Fa:-1},!1)};function Ju(a,b,c){var d=L("renderPagesUpto");b||(b={P:0,aa:0,Fa:0});var e=b.P,f=b.aa,g=0;c&&(g=e);var h;Fe(function(c){Iu(a,{P:g,aa:g===e?f:Number.POSITIVE_INFINITY,Fa:g===e?b.Fa:-1}).then(function(a){h=a;++g>e?Q(c):P(c)})}).then(function(){O(d,h)});return d.result()}n.xg=function(a,b){return Hu(this,{P:0,aa:0,Fa:-1},b)};
n.Ag=function(a,b){return Hu(this,{P:this.O.b.length-1,aa:Number.POSITIVE_INFINITY,Fa:-1},b)};n.nextPage=function(a,b){var c=this,d=this,e=a.P,f=a.aa,g=L("nextPage");Fu(d,e).then(function(a){if(a){if(a.complete&&f==a.jb.length-1){if(e>=d.O.b.length-1){O(g,null);return}e++;f=0;var h=c.Ib[e],k=h&&h.Ka[0];a=a.Ka[a.Ka.length-1];k&&a&&k.b==a.b&&(h.Ka.forEach(function(a){a.I&&a.I.remove()}),c.Ib[e]=null,c.g[e]=null)}else f++;Hu(d,{P:e,aa:f,Fa:-1},b).Ea(g)}else O(g,null)});return g.result()};
n.Oe=function(a,b){var c=a.P,d=a.aa;if(d)d--;else{if(!c)return M(null);c--;d=Number.POSITIVE_INFINITY}return Hu(this,{P:c,aa:d,Fa:-1},b)};function Ku(a,b,c){b="left"===b.b;a="ltr"===a.fc(c);return!b&&a||b&&!a}function Lu(a,b,c){var d=L("getCurrentSpread"),e=Bu(a,b);if(!e)return M({left:null,right:null});var f="left"===e.b;(Ku(a,e,b)?a.Oe(b,c):a.nextPage(b,c)).then(function(c){var e=Bu(a,b);(c=c&&c.page)&&c.b===e.b&&(c=null);f?O(d,{left:e,right:c}):O(d,{left:c,right:e})});return d.result()}
n.Gg=function(a,b){var c=Bu(this,a);if(!c)return M(null);var d=Ku(this,c,a),e=this.nextPage(a,b);if(d)return e;var f=this;return e.ea(function(a){if(a){if(a.page.b===c.b)return e;var d=f.nextPage(a.position,b);return d.ea(function(a){return a?d:e})}return M(null)})};n.Jg=function(a,b){var c=Bu(this,a);if(!c)return M(null);var d=Ku(this,c,a),e=this.Oe(a,b),f=c.I.previousElementSibling;if(d){var g=this;return e.ea(function(a){return a?a.page.b===c.b||a.page.I!==f?e:g.Oe(a.position,b):M(null)})}return e};
function Mu(a,b,c){var d=L("navigateToEPage");xu(a.O,b).then(function(b){b?Hu(a,b,c).Ea(d):O(d,null)});return d.result()}function Nu(a,b,c){var d=L("navigateToCFI");wu(a.O,b).then(function(b){b?Hu(a,b,c).Ea(d):O(d,null)});return d.result()}
function Ou(a,b,c,d){w.debug("Navigate to",b);var e=qu(a.O,ya(b));if(!e){if(a.O.j&&b.match(/^#epubcfi\(/))e=qu(a.O,a.O.j.url);else if("#"===b.charAt(0)){var f=a.O.H.Kg(b);a.O.j?(e=qu(a.O,f[0]),null==e&&(e=f[0])):e=f[0];b=f[0]+(f[1]?"#"+f[1]:"")}if(null==e)return M(null)}var g=a.O.D[e];if(!g)return a.O.j&&e==qu(a.O,a.O.j.url)&&(e=b.indexOf("#"),0<=e)?Nu(a,b.substr(e+1),d):M(null);var h=L("navigateTo");Fu(a,g.P).then(function(e){if(e){var f=mk(e.da,b);f?Hu(a,{P:g.P,aa:-1,Fa:hk(e.da,f)},d).Ea(h):c.P!==
g.P?Hu(a,{P:g.P,aa:0,Fa:-1},d).Ea(h):O(h,null)}else O(h,null)});return h.result()}
function Eu(a,b,c){var d=b.nb.viewport,e=d.b.createElement("div");e.setAttribute("data-vivliostyle-page-container",!0);e.setAttribute("role","region");e.style.position="absolute";e.style.top="0";e.style.left="0";ak||(e.style.visibility="hidden",e.setAttribute("aria-hidden","true"));d.h.appendChild(e);var f=d.b.createElement("div");f.setAttribute("data-vivliostyle-bleed-box",!0);e.appendChild(f);var g=new Fk(e,f);g.P=b.item.P;g.position=c;g.offset=tt(b.nb,c);g.offset||(b=a.O.H.Re("",b.item.src),f.setAttribute("id",
b),Ik(g,f,b));d!==a.viewport&&(a=lg(null,new rf(Cb(a.viewport.width,a.viewport.height,d.width,d.height),null)),g.l.push(new Ck(e,"transform",a)));return g}function Pu(a,b,c,d){var e=nu();if(e){var f=d.ownerDocument,g=f.createElement("span");d.appendChild(g);c=f.importNode(c,!0);Qu(a,c,b);g.appendChild(c);a=e.queue;a.Push(["Typeset",e,g]);var e=L("makeMathJaxView"),h=xe(e);a.Push(function(){h.tb(g)});return e.result()}return M(null)}
function Qu(a,b,c){if(b){if(1===b.nodeType&&"mglyph"===b.tagName)for(var d=t(b.attributes),e=d.next();!e.done;e=d.next())if(e=e.value,"src"===e.name){var f=Ba(e.nodeValue,c.url);e.namespaceURI?b.setAttributeNS(e.namespaceURI,e.name,f):b.setAttribute(e.name,f)}b.firstChild&&Qu(a,b.firstChild,c);b.nextSibling&&Qu(a,b.nextSibling,c)}}
n.Ge=function(a){var b=this;return function(c,d){var e;if("object"==c.localName&&"http://www.w3.org/1999/xhtml"==c.namespaceURI){var f=c.getAttribute("data");e=null;if(f){var f=Ba(f,a.url),g=c.getAttribute("media-type");if(!g){var h=qu(b.O,f);h&&(h=b.O.D[h])&&(g=h.g)}if(g&&(h=b.O.Z[g])){e=b.viewport.b.createElement("iframe");e.style.border="none";var f=Va(f),l=Va(g),g=new Ra;g.append(h);g.append("?src=");g.append(f);g.append("&type=");g.append(l);for(h=c.firstChild;h;h=h.nextSibling)1==h.nodeType&&
(l=h,"param"==l.localName&&"http://www.w3.org/1999/xhtml"==l.namespaceURI&&(f=l.getAttribute("name"),l=l.getAttribute("value"),f&&l&&(g.append("&"),g.append(encodeURIComponent(f)),g.append("="),g.append(encodeURIComponent(l)))));e.setAttribute("src",g.toString());(g=c.getAttribute("width"))&&e.setAttribute("width",g);(g=c.getAttribute("height"))&&e.setAttribute("height",g)}}e||(e=b.viewport.b.createElement("span"),e.setAttribute("data-adapt-process-children","true"));e=M(e)}else if("http://www.w3.org/1998/Math/MathML"==
c.namespaceURI)e=Pu(b,a,c,d);else if("http://example.com/sse"==c.namespaceURI){e=d?d.ownerDocument:b.viewport.b;g=c.localName;switch(g){case "t":case "tab":case "ec":case "nt":case "fraction":case "comment":case "mark":g="span";break;case "ruby":case "rp":case "rt":break;default:g="div"}e=e.createElement(g);e.setAttribute("data-adapt-process-children","true");e=M(e)}else e=c.dataset&&"true"==c.dataset.mathTypeset?Pu(b,a,c,d):M(null);return e}};
function Fu(a,b){if(-1===b||b>=a.O.b.length)return M(null);var c=a.Ib[b];if(c)return M(c);var d=L("getPageViewItem"),e=a.g[b];if(e){var f=xe(d);e.push(f);return d.result()}var e=a.g[b]=[],g=a.O.b[b],h=a.O.h;h.load(g.src).then(function(f){g.h=f.b.title;var k=h.f[f.url],l=a.Ge(f),p=a.viewport,q=pt(k,p.width,p.height,p.fontSize,a.$);if(q.width!=p.width||q.height!=p.height||q.fontSize!=p.fontSize)p=new $r(p.window,q.fontSize,p.root,q.width,q.height);q=a.Ib[b-1];null!==g.wb?q=g.wb-1:(!(0<b)||q&&q.complete?
q=q?q.nb.ta+q.Ka.length:0:(q=g.b||b,a.O.F||q%2||q++),null!==g.nc&&(q+=g.nc));$p(a.f,q);var r=new qt(k,f,a.O.lang,p,a.h,a.j,l,a.O.Y,q,a.O.H,a.f,a.O.J);r.$=a.$;k=a.O.f&&a.O.f[ju];r.yb=k&&k[0]&&k[0].v||"";r.fb=g.h||"";rt(r).then(function(){c={item:g,da:f,nb:r,jb:[null],Ka:[],complete:!1};a.Ib[b]=c;O(d,c);e.forEach(function(a){a.tb(c)})})});return d.result()}function Ru(a){return a.Ib.some(function(a){return a&&0<a.Ka.length})}
n.Uc=function(a){var b=this.O,c=b.Yb||b.lf;this.wf=a;if(!c)return M(null);if(this.b&&this.b.page)return this.b.page.I.style.visibility="visible",this.b.page.I.setAttribute("aria-hidden","false"),M(this.b.page);var d=L("showTOC");this.b||(this.b=new Tt(b.h,c.src,b.lang,this.h,this.j,this.$,this,b.Y,b.H,this.f));a=this.viewport;var b=Math.min(350,Math.round(.67*a.width)-16),c=a.height-6,e=a.b.createElement("div");a.root.appendChild(e);e.style.visibility="hidden";e.style.width=b+10+"px";e.style.maxHeight=
c+"px";e.setAttribute("data-vivliostyle-toc-box","true");e.setAttribute("role","navigation");this.b.Uc(e,a,b,c,this.viewport.fontSize).then(function(a){e.style.visibility="visible";e.setAttribute("aria-hidden","false");O(d,a)});return d.result()};n.Td=function(){this.b&&this.b.Td()};n.Rc=function(){return!!this.b&&this.b.Rc()};var Su={fh:"singlePage",gh:"spread",Vg:"autoSpread"};
function Tu(a,b,c,d){var e=this;this.window=a;this.ge=b;b.setAttribute("data-vivliostyle-viewer-viewport",!0);ak&&b.setAttribute("data-vivliostyle-debug",!0);b.setAttribute("data-vivliostyle-viewer-status","loading");this.Ba=c;this.ua=d;a=a.document;this.sa=new wm(a.head,b);this.u="loading";this.J=[];this.O=null;this.hc=this.Ya=!1;this.f=this.j=this.g=this.A=null;this.fontSize=16;this.zoom=1;this.D=!1;this.S="singlePage";this.ca=!1;this.Rb=!0;this.$=yb();this.Z=[];this.H=function(){};this.h=function(){};
this.Y=function(){e.Ya=!0;e.H()};this.Me=this.Me.bind(this);this.F=function(){};this.G=a.getElementById("vivliostyle-page-rules");this.N=!1;this.l=null;this.la={loadPublication:this.rg,loadXML:this.sg,configure:this.$e,moveTo:this.ta,toc:this.Uc};Uu(this)}function Uu(a){xa(1,function(b){Vu(a,{t:"debug",content:b})});xa(2,function(b){Vu(a,{t:"info",content:b})});xa(3,function(b){Vu(a,{t:"warn",content:b})});xa(4,function(b){Vu(a,{t:"error",content:b})})}function Vu(a,b){b.i=a.Ba;a.ua(b)}
function Wu(a,b){a.u!==b&&(a.u=b,a.ge.setAttribute("data-vivliostyle-viewer-status",b),Vu(a,{t:"readystatechange"}))}n=Tu.prototype;
n.rg=function(a){Xu.f("beforeRender");Wu(this,"loading");var b=a.url,c=a.fragment,d=!!a.zipmeta,e=a.authorStyleSheet,f=a.userStyleSheet;this.viewport=null;var g=L("loadPublication"),h=this;h.$e(a).then(function(){var a=new Wt;Nt(a,e,f).then(function(){var e=Ba(Ea(b),h.window.location.href);h.J=[e];Yt(a,e,d).then(function(a){a?(h.O=a,Yu(h,c).then(function(){O(g,!0)})):O(g,!1)})})});return g.result()};
n.sg=function(a){Xu.f("beforeRender");Wu(this,"loading");var b=a.url,c=a.document,d=a.fragment,e=a.authorStyleSheet,f=a.userStyleSheet;this.viewport=null;var g=L("loadXML"),h=this;h.$e(a).then(function(){var a=new Wt;Nt(a,e,f).then(function(){var e=b.map(function(a,b){return{url:Ba(Ea(a.url),h.window.location.href),index:b,wb:a.wb,nc:a.nc}});h.J=e.map(function(a){return a.url});h.O=new $t(a,"");uu(h.O,e,c).then(function(){Yu(h,d).then(function(){O(g,!0)})})})});return g.result()};
function Yu(a,b){Zu(a);var c;b?c=wu(a.O,b).ea(function(b){a.f=b;return M(!0)}):c=M(!0);return c.ea(function(){Xu.b("beforeRender");return $u(a)})}function av(a,b){var c=parseFloat(b),d=/[a-z]+$/,e;if("string"===typeof b&&(e=b.match(d))){d=e[0];if("em"===d||"rem"===d)return c*a.fontSize;if("ex"===d)return c*Ob.ex*a.fontSize/Ob.em;if(d=Ob[d])return c*d}return c}
n.$e=function(a){"boolean"==typeof a.autoresize&&(a.autoresize?(this.A=null,this.window.addEventListener("resize",this.Y,!1),this.Ya=!0):this.window.removeEventListener("resize",this.Y,!1));if("number"==typeof a.fontSize){var b=a.fontSize;5<=b&&72>=b&&this.fontSize!=b&&(this.fontSize=b,this.Ya=!0)}"object"==typeof a.viewport&&a.viewport&&(b=a.viewport,b={marginLeft:av(this,b["margin-left"])||0,marginRight:av(this,b["margin-right"])||0,marginTop:av(this,b["margin-top"])||0,marginBottom:av(this,b["margin-bottom"])||
0,width:av(this,b.width)||0,height:av(this,b.height)||0},200<=b.width||200<=b.height)&&(this.window.removeEventListener("resize",this.Y,!1),this.A=b,this.Ya=!0);"boolean"==typeof a.hyphenate&&(this.$.xe=a.hyphenate,this.Ya=!0);"boolean"==typeof a.horizontal&&(this.$.we=a.horizontal,this.Ya=!0);"boolean"==typeof a.nightMode&&(this.$.Ie=a.nightMode,this.Ya=!0);"number"==typeof a.lineHeight&&(this.$.lineHeight=a.lineHeight,this.Ya=!0);"number"==typeof a.columnWidth&&(this.$.pe=a.columnWidth,this.Ya=
!0);"string"==typeof a.fontFamily&&(this.$.fontFamily=a.fontFamily,this.Ya=!0);"boolean"==typeof a.load&&(this.ca=a.load);"boolean"==typeof a.renderAllPages&&(this.Rb=a.renderAllPages);"string"==typeof a.userAgentRootURL&&(za=a.userAgentRootURL.replace(/resources\/?$/,""),Aa=a.userAgentRootURL);"string"==typeof a.rootURL&&(za=a.rootURL,Aa=za+"resources/");"string"==typeof a.pageViewMode&&a.pageViewMode!==this.S&&(this.S=a.pageViewMode,this.Ya=!0);"number"==typeof a.pageBorder&&a.pageBorder!==this.$.Dc&&
(this.viewport=null,this.$.Dc=a.pageBorder,this.Ya=!0);"number"==typeof a.zoom&&a.zoom!==this.zoom&&(this.zoom=a.zoom,this.hc=!0);"boolean"==typeof a.fitToScreen&&a.fitToScreen!==this.D&&(this.D=a.fitToScreen,this.hc=!0);"object"==typeof a.defaultPaperSize&&"number"==typeof a.defaultPaperSize.width&&"number"==typeof a.defaultPaperSize.height&&(this.viewport=null,this.$.vc=a.defaultPaperSize,this.Ya=!0);bv(this,a);return M(!0)};
function bv(a,b){he("CONFIGURATION").forEach(function(c){c=c(b);a.Ya=c.Ya||a.Ya;a.hc=c.hc||a.hc})}n.Me=function(a){var b=this.g,c=this.j,d=a.target;c?c.left!==d&&c.right!==d||cv(this,a.ag):b===a.target&&cv(this,a.ag)};function dv(a,b){var c=[];a.g&&c.push(a.g);a.j&&(c.push(a.j.left),c.push(a.j.right));c.forEach(function(a){a&&b(a)})}function ev(a){dv(a,function(b){b.removeEventListener("hyperlink",a.F,!1);b.removeEventListener("replaced",a.Me,!1)})}
function fv(a){ev(a);dv(a,function(a){x(a.I,"display","none");a.I.setAttribute("aria-hidden","true")});a.g=null;a.j=null}function gv(a,b){b.addEventListener("hyperlink",a.F,!1);b.addEventListener("replaced",a.Me,!1);x(b.I,"visibility","visible");x(b.I,"display","block");b.I.setAttribute("aria-hidden","false")}function hv(a,b){fv(a);a.g=b;gv(a,b)}
function iv(a){var b=L("reportPosition");vu(a.O,a.f.P,a.f.Fa).then(function(c){var d=a.g;(a.ca&&0<d.j.length?Je(d.j):M(!0)).then(function(){jv(a,d,c).Ea(b)})});return b.result()}function kv(a){var b=a.ge;if(a.A){var c=a.A;b.style.marginLeft=c.marginLeft+"px";b.style.marginRight=c.marginRight+"px";b.style.marginTop=c.marginTop+"px";b.style.marginBottom=c.marginBottom+"px";return new $r(a.window,a.fontSize,b,c.width,c.height)}return new $r(a.window,a.fontSize,b)}
function lv(a){var b=kv(a),c;a:switch(a.S){case "singlePage":c=!1;break a;case "spread":c=!0;break a;default:c=1.45<=b.width/b.height&&800<b.width}var d=a.$.ub!==c;a.$.ub=c;a.ge.setAttribute("data-vivliostyle-spread-view",c);if(a.A||!a.viewport||a.viewport.fontSize!=a.fontSize)return!1;if(!d&&b.width==a.viewport.width&&b.height==a.viewport.height||!d&&b.width==a.viewport.width&&b.height!=a.viewport.height&&/Android|iPhone|iPad|iPod/.test(navigator.userAgent))return!0;if(c=a.b&&Ru(a.b)){a:{c=t(a.b.Ib);
for(d=c.next();!d.done;d=c.next())if(d=d.value)for(var d=t(d.Ka),e=d.next();!e.done;e=d.next())if(e=e.value,e.G&&e.F){c=!0;break a}c=!1}c=!c}return c?(a.viewport.width=b.width,a.viewport.height=b.height,a.hc=!0):!1}n.Lg=function(a,b,c,d){this.Z[d]=a;mv(this,b)};function mv(a,b){if(!a.N&&a.G){var c="";Object.keys(b).forEach(function(a){c+="@page "+a+"{margin:0;size:";a=b[a];c+=a.width+"px "+a.height+"px;}"});a.G.textContent=c;a.N=!0}}
function nv(a){var b=!1,c=!1;if(a.b){b=a.b.Rc();c=a.b.wf;a.b.Td();for(var d=a.b,e=t(d.Ib),f=e.next();!f.done;f=e.next())(f=f.value)&&f.Ka.splice(0);for(d=d.viewport.root;d.lastChild;)d.removeChild(d.lastChild)}a.G&&(a.G.textContent="",a.N=!1);a.viewport=kv(a);d=a.viewport;x(d.g,"width","");x(d.g,"height","");x(d.f,"width","");x(d.f,"height","");x(d.f,"transform","");a.b=new Au(a.O,a.viewport,a.sa,a.$,a.Lg.bind(a));b&&a.h({a:"toc",v:"show",autohide:c})}
function cv(a,b,c){a.hc=!1;ev(a);if(a.$.ub)return Lu(a.b,a.f,c).ea(function(c){fv(a);a.j=c;c.left&&(gv(a,c.left),c.right?c.left.I.removeAttribute("data-vivliostyle-unpaired-page"):c.left.I.setAttribute("data-vivliostyle-unpaired-page",!0));c.right&&(gv(a,c.right),c.left?c.right.I.removeAttribute("data-vivliostyle-unpaired-page"):c.right.I.setAttribute("data-vivliostyle-unpaired-page",!0));c=ov(a,c);a.viewport.zoom(c.width,c.height,a.D?pv(a,c):a.zoom);a.g=b;return M(null)});hv(a,b);a.viewport.zoom(b.g.width,
b.g.height,a.D?pv(a,b.g):a.zoom);a.g=b;return M(null)}function ov(a,b){var c=0,d=0;b.left&&(c+=b.left.g.width,d=b.left.g.height);b.right&&(c+=b.right.g.width,d=Math.max(d,b.right.g.height));b.left&&b.right&&(c+=2*a.$.Dc);return{width:c,height:d}}var qv={$g:"fit inside viewport"};function pv(a,b){return Math.min(a.viewport.width/b.width,a.viewport.height/b.height)}function rv(){this.name="RenderingCanceledError";this.message="Page rendering has been canceled";this.stack=Error().stack}v(rv,Error);
function Zu(a){if(a.l){var b=a.l;oe(b,new rv);if(b!==ie&&b.b){b.b.g=!0;var c=new ye(b);b.l="interrupt";b.b=c;b.f.tb(c)}}a.l=null}
function $u(a){a.Ya=!1;a.hc=!1;if(lv(a))return M(!0);Wu(a,"loading");Zu(a);var b=qe(ie.f,function(){return ne("resize",function(c){a.O?(a.l=b,Xu.f("render (resize)"),nv(a),a.f&&(a.f.aa=-1),su(a.O,a.Rb),Ju(a.b,a.f,!a.Rb).then(function(d){d?(a.f=d.position,cv(a,d.page,!0).then(function(){Wu(a,"interactive");tu(a.O,function(b){b={t:"nav",epageCount:b,first:a.g.u,last:a.g.A,metadata:a.O.f,docTitle:a.O.b[a.f.P].h};if(a.g.u||!a.f.aa&&a.O.b[a.f.P].b)b.epage=a.O.b[a.f.P].b;Vu(a,b)}).then(function(){iv(a).then(function(d){(a.Rb?
a.b.Rb():M(null)).then(function(){a.l===b&&(a.l=null);Xu.b("render (resize)");a.Rb&&Wu(a,"complete");Vu(a,{t:"loaded"});O(c,d)})})})})):O(c,!1)})):O(c,!1)},function(a,b){if(b instanceof rv)Xu.b("render (resize)"),w.debug(b.message);else throw b;})});return M(!0)}function jv(a,b,c){var d=L("sendLocationNotification"),e={t:"nav",first:b.u,last:b.A,metadata:a.O.f,docTitle:a.O.b[b.P].h};yu(a.O,a.f).then(function(b){e.epage=b;e.epageCount=a.O.l;c&&(e.cfi=c);Vu(a,e);O(d,!0)});return d.result()}
Tu.prototype.fc=function(){return this.b?this.b.fc(this.f):null};
Tu.prototype.ta=function(a){var b=this;"complete"!==this.u&&"next"!==a.where&&Wu(this,"loading");if("string"==typeof a.where){switch(a.where){case "next":a=this.$.ub?this.b.Gg:this.b.nextPage;break;case "previous":a=this.$.ub?this.b.Jg:this.b.Oe;break;case "last":a=this.b.Ag;break;case "first":a=this.b.xg;break;default:return M(!0)}if(a){var c=a;a=function(){return c.call(b.b,b.f,!b.Rb)}}}else if("number"==typeof a.epage){var d=a.epage;a=function(){return Mu(b.b,d,!b.Rb)}}else if("string"==typeof a.url){var e=
a.url;a=function(){return Ou(b.b,e,b.f,!b.Rb)}}else return M(!0);var f=L("moveTo");a.call(b.b).then(function(a){var c;if(a){b.f=a.position;var d=L("moveTo.showCurrent");c=d.result();cv(b,a.page,!b.Rb).then(function(){iv(b).Ea(d)})}else c=M(!0);c.then(function(a){"loading"===b.u&&Wu(b,"interactive");O(f,a)})});return f.result()};
Tu.prototype.Uc=function(a){var b=!!a.autohide;a=a.v;var c=this.b.Rc(),d=b!=this.b.wf&&"hide"!=a;if(c){if("show"==a&&!d)return M(!0)}else if("hide"==a)return M(!0);if(c&&"show"!=a)return this.b.Td(),M(!0);var e=this,f=L("showTOC");this.b.Uc(b).then(function(a){a&&(d&&(a.Pb={}),b&&a.addEventListener("hyperlink",function(){e.b.Td()},!1),a.addEventListener("hyperlink",e.F,!1));O(f,!0)});return f.result()};
function sv(a,b){var c=b.a||"";return ne("runCommand",function(d){var e=a.la[c];e?e.call(a,b).then(function(){Vu(a,{t:"done",a:c});O(d,!0)}):(w.error("No such action:",c),O(d,!0))},function(a,b){w.error(b,"Error during action:",c);O(a,!0)})}function tv(a){return"string"==typeof a?JSON.parse(a):a}
function uv(a,b){var c=tv(b),d=null;pe(function(){var b=L("commandLoop"),f=ie.f;a.F=function(b){var c="#"===b.href.charAt(0)||a.J.some(function(a){return b.href.substr(0,a.length)==a});if(c){b.preventDefault();var d={t:"hyperlink",href:b.href,internal:c};qe(f,function(){Vu(a,d);return M(!0)})}};Fe(function(b){if(a.Ya)$u(a).then(function(){P(b)});else if(a.hc)a.g&&cv(a,a.g).then(function(){P(b)});else if(c){var e=c;c=null;sv(a,e).then(function(){P(b)})}else e=L("waitForCommand"),d=xe(e,self),e.result().then(function(){P(b)})}).Ea(b);
return b.result()});a.H=function(){var a=d;a&&(d=null,a.tb())};a.h=function(b){if(c)return!1;c=tv(b);a.H();return!0};a.window.adapt_command=a.h};function Sr(a,b,c){if(a==b)return a?[[0,a]]:[];if(0>c||a.length<c)c=null;var d=vv(a,b),e=a.substring(0,d);a=a.substring(d);b=b.substring(d);var d=wv(a,b),f=a.substring(a.length-d);a=a.substring(0,a.length-d);b=b.substring(0,b.length-d);a=xv(a,b);e&&a.unshift([0,e]);f&&a.push([0,f]);yv(a);null!=c&&(a=zv(a,c));return a=Av(a)}
function xv(a,b){var c;if(!a)return[[1,b]];if(!b)return[[-1,a]];c=a.length>b.length?a:b;var d=a.length>b.length?b:a,e=c.indexOf(d);if(-1!=e)return c=[[1,c.substring(0,e)],[0,d],[1,c.substring(e+d.length)]],a.length>b.length&&(c[0][0]=c[2][0]=-1),c;if(1==d.length)return[[-1,a],[1,b]];var f=Bv(a,b);if(f)return d=f[1],e=f[3],c=f[4],f=Sr(f[0],f[2]),d=Sr(d,e),f.concat([[0,c]],d);a:{c=a.length;for(var d=b.length,e=Math.ceil((c+d)/2),f=2*e,g=Array(f),h=Array(f),l=0;l<f;l++)g[l]=-1,h[l]=-1;g[e+1]=0;h[e+1]=
0;for(var l=c-d,k=!!(l%2),m=0,p=0,q=0,r=0,z=0;z<e;z++){for(var u=-z+m;u<=z-p;u+=2){var A=e+u,D;D=u==-z||u!=z&&g[A-1]<g[A+1]?g[A+1]:g[A-1]+1;for(var I=D-u;D<c&&I<d&&a.charAt(D)==b.charAt(I);)D++,I++;g[A]=D;if(D>c)p+=2;else if(I>d)m+=2;else if(k&&(A=e+l-u,0<=A&&A<f&&-1!=h[A])){var K=c-h[A];if(D>=K){c=Cv(a,b,D,I);break a}}}for(u=-z+q;u<=z-r;u+=2){A=e+u;K=u==-z||u!=z&&h[A-1]<h[A+1]?h[A+1]:h[A-1]+1;for(D=K-u;K<c&&D<d&&a.charAt(c-K-1)==b.charAt(d-D-1);)K++,D++;h[A]=K;if(K>c)r+=2;else if(D>d)q+=2;else if(!k&&
(A=e+l-u,0<=A&&A<f&&-1!=g[A]&&(D=g[A],I=e+D-A,K=c-K,D>=K))){c=Cv(a,b,D,I);break a}}}c=[[-1,a],[1,b]]}return c}function Cv(a,b,c,d){var e=a.substring(c),f=b.substring(d);a=Sr(a.substring(0,c),b.substring(0,d));e=Sr(e,f);return a.concat(e)}function vv(a,b){if(!a||!b||a.charAt(0)!=b.charAt(0))return 0;for(var c=0,d=Math.min(a.length,b.length),e=d,f=0;c<e;)a.substring(f,e)==b.substring(f,e)?f=c=e:d=e,e=Math.floor((d-c)/2+c);return e}
function wv(a,b){if(!a||!b||a.charAt(a.length-1)!=b.charAt(b.length-1))return 0;for(var c=0,d=Math.min(a.length,b.length),e=d,f=0;c<e;)a.substring(a.length-e,a.length-f)==b.substring(b.length-e,b.length-f)?f=c=e:d=e,e=Math.floor((d-c)/2+c);return e}
function Bv(a,b){function c(a,b,c){for(var d=a.substring(c,c+Math.floor(a.length/4)),e=-1,f="",g,h,k,l;-1!=(e=b.indexOf(d,e+1));){var m=vv(a.substring(c),b.substring(e)),K=wv(a.substring(0,c),b.substring(0,e));f.length<K+m&&(f=b.substring(e-K,e)+b.substring(e,e+m),g=a.substring(0,c-K),h=a.substring(c+m),k=b.substring(0,e-K),l=b.substring(e+m))}return 2*f.length>=a.length?[g,h,k,l,f]:null}var d=a.length>b.length?a:b,e=a.length>b.length?b:a;if(4>d.length||2*e.length<d.length)return null;var f=c(d,e,
Math.ceil(d.length/4)),d=c(d,e,Math.ceil(d.length/2)),g;if(f||d)d?g=f?f[4].length>d[4].length?f:d:d:g=f;else return null;var h;a.length>b.length?(f=g[0],d=g[1],e=g[2],h=g[3]):(e=g[0],h=g[1],f=g[2],d=g[3]);return[f,d,e,h,g[4]]}
function yv(a){a.push([0,""]);for(var b=0,c=0,d=0,e="",f="",g;b<a.length;)switch(a[b][0]){case 1:d++;f+=a[b][1];b++;break;case -1:c++;e+=a[b][1];b++;break;case 0:if(1<c+d){if(c&&d){if(g=vv(f,e))0<b-c-d&&0==a[b-c-d-1][0]?a[b-c-d-1][1]+=f.substring(0,g):(a.splice(0,0,[0,f.substring(0,g)]),b++),f=f.substring(g),e=e.substring(g);if(g=wv(f,e))a[b][1]=f.substring(f.length-g)+a[b][1],f=f.substring(0,f.length-g),e=e.substring(0,e.length-g)}c?d?a.splice(b-c-d,c+d,[-1,e],[1,f]):a.splice(b-c,c+d,[-1,e]):a.splice(b-
d,c+d,[1,f]);b=b-c-d+(c?1:0)+(d?1:0)+1}else b&&0==a[b-1][0]?(a[b-1][1]+=a[b][1],a.splice(b,1)):b++;c=d=0;f=e=""}""===a[a.length-1][1]&&a.pop();c=!1;for(b=1;b<a.length-1;)0==a[b-1][0]&&0==a[b+1][0]&&(a[b][1].substring(a[b][1].length-a[b-1][1].length)==a[b-1][1]?(a[b][1]=a[b-1][1]+a[b][1].substring(0,a[b][1].length-a[b-1][1].length),a[b+1][1]=a[b-1][1]+a[b+1][1],a.splice(b-1,1),c=!0):a[b][1].substring(0,a[b+1][1].length)==a[b+1][1]&&(a[b-1][1]+=a[b+1][1],a[b][1]=a[b][1].substring(a[b+1][1].length)+
a[b+1][1],a.splice(b+1,1),c=!0)),b++;c&&yv(a)}Sr.f=1;Sr.b=-1;Sr.g=0;
function zv(a,b){var c;a:{var d=a;if(0===b)c=[0,d];else{var e=0;for(c=0;c<d.length;c++){var f=d[c];if(-1===f[0]||0===f[0]){var g=e+f[1].length;if(b===g){c=[c+1,d];break a}if(b<g){d=d.slice();g=b-e;e=[f[0],f[1].slice(0,g)];f=[f[0],f[1].slice(g)];d.splice(c,1,e,f);c=[c+1,d];break a}e=g}}throw Error("cursor_pos is out of bounds!");}}d=c[1];c=c[0];e=d[c];f=d[c+1];return null==e||0!==e[0]?a:null!=f&&e[1]+f[1]===f[1]+e[1]?(d.splice(c,2,f,e),Dv(d,c,2)):null!=f&&0===f[1].indexOf(e[1])?(d.splice(c,2,[f[0],
e[1]],[0,e[1]]),e=f[1].slice(e[1].length),0<e.length&&d.splice(c+2,0,[f[0],e]),Dv(d,c,3)):a}
function Av(a){function b(a){return 55296<=a.charCodeAt(a.length-1)&&56319>=a.charCodeAt(a.length-1)}function c(a){return 56320<=a.charCodeAt(0)&&57343>=a.charCodeAt(0)}for(var d=!1,e=2;e<a.length;e+=1)0===a[e-2][0]&&b(a[e-2][1])&&-1===a[e-1][0]&&c(a[e-1][1])&&1===a[e][0]&&c(a[e][1])&&(d=!0,a[e-1][1]=a[e-2][1].slice(-1)+a[e-1][1],a[e][1]=a[e-2][1].slice(-1)+a[e][1],a[e-2][1]=a[e-2][1].slice(0,-1));if(!d)return a;d=[];for(e=0;e<a.length;e+=1)0<a[e][1].length&&d.push(a[e]);return d}
function Dv(a,b,c){for(c=b+c-1;0<=c&&c>=b-1;c--)if(c+1<a.length){var d=a[c],e=a[c+1];d[0]===e[1]&&a.splice(c,2,[d[0],d[1]+e[1]])}return a};function Rr(a){return a.reduce(function(a,c){return c[0]===Sr.b?a:a+c[1]},"")}function gl(a,b,c){var d=0,e=0;a.some(function(a){for(var f=0;f<a[1].length;f++){switch(a[0]*c){case Sr.f:d++;break;case Sr.b:d--;e++;break;case Sr.g:e++}if(e>b)return!0}return!1});return Math.max(Math.min(b,e-1)+d,0)};function Ev(a,b,c,d,e){Ym.call(this,a,b,"block-end",null,c,e);this.g=d}v(Ev,Ym);Ev.prototype.df=function(a){return!(a instanceof Ev)};function Fv(a,b,c,d){an.call(this,a,"block-end",b,c,d)}v(Fv,an);Fv.prototype.Ia=function(){return Infinity};Fv.prototype.f=function(a){return a instanceof Ev?!0:this.Ia()<a.Ia()};function Gv(a){this.f=a}Gv.prototype.b=function(a){a=fl(a);return!Uk(a,this.f.b)};function Hv(){}n=Hv.prototype;n.Ff=function(a){return"footnote"===a.Ca};
n.Ef=function(a){return a instanceof Ev};n.Lf=function(a,b){var c="region",d=kn(b,c);Gn(kn(b,"page"),d)&&(c="page");d=fl(a);c=new Ev(d,c,b.h,a.Y,a.N);b.le(c);return M(c)};n.Mf=function(a,b,c,d){return new Fv(a[0].ja.W,a,c,d)};n.xf=function(a,b){return kn(b,a.W).b.filter(function(a){return a instanceof Fv})[0]||null};
n.Bf=function(a,b,c){a.$f=!0;a.ve=!1;var d=a.element,e=c.j;b=b.b;var f=c.j.w&&"rtl"===c.j.w.direction,g={},h=e.A._pseudos;b=wr(e,b,f,e.A,g);if(h&&h.before){var l={},k=Ir(e,"http://www.w3.org/1999/xhtml","span");pr(k,"before");d.appendChild(k);wr(e,b,f,h.before,l);delete l.content;Lr(e,k,l)}delete g.content;Lr(e,d,g);a.b=b;Np(a,d);if(e=Qn(c.f,d))a.marginLeft=X(e.marginLeft),a.Z=X(e.borderLeftWidth),a.H=X(e.paddingLeft),a.marginTop=X(e.marginTop),a.ca=X(e.borderTopWidth),a.J=X(e.paddingTop),a.marginRight=
X(e.marginRight),a.Za=X(e.borderRightWidth),a.Y=X(e.paddingRight),a.marginBottom=X(e.marginBottom),a.Ba=X(e.borderBottomWidth),a.S=X(e.paddingBottom);if(c=Qn(c.f,d))a.width=X(c.width),a.height=X(c.height)};n.og=function(a,b){switch(a.g){case Ad:ao(b,new Gv(a),a.W)}};eo.push(new Hv);function Iv(a){return a.reduce(function(a,c){return a+c},0)/a.length}function jt(a){var b=Iv(a);return Iv(a.map(function(a){a-=b;return a*a}))};function Jv(a,b){this.g(a,"end",b)}function Kv(a,b){this.g(a,"start",b)}function Lv(a,b,c){c||(c=this.j.now());var d=this.h[a];d||(d=this.h[a]=[]);var e;for(a=d.length-1;0<=a&&(!(e=d[a])||e[b]);a--)e=null;e||(e={},d.push(e));e[b]=c}function Mv(){}function Nv(a){this.j=a;this.h={};this.registerEndTiming=this.b=this.registerStartTiming=this.f=this.g=Mv}
Nv.prototype.l=function(){var a=this.h,b="";Object.keys(a).forEach(function(c){for(var d=a[c],e=d.length,f=0;f<e;f++){var g=d[f];b+=c;1<e&&(b+="("+f+")");b+=" => start: "+g.start+", end: "+g.end+", duration: "+(g.end-g.start)+"\n"}});w.g(b)};Nv.prototype.u=function(){this.registerEndTiming=this.b=this.registerStartTiming=this.f=this.g=Mv};Nv.prototype.A=function(){this.g=Lv;this.registerStartTiming=this.f=Kv;this.registerEndTiming=this.b=Jv};
var Ov={now:Date.now},Xu,Pv=Xu=new Nv(window&&window.performance||Ov);Lv.call(Pv,"load_vivliostyle","start",void 0);oa("vivliostyle.profile.profiler",Pv);Nv.prototype.printTimings=Nv.prototype.l;Nv.prototype.disable=Nv.prototype.u;Nv.prototype.enable=Nv.prototype.A;function uo(a){return(a=a.C)&&a instanceof zp?a:null}function Qv(a,b,c){var d=a.b;return d&&!d.Bc&&(a=Rv(a,b),a.B)?!d.yc||d.Bc?M(!0):Sv(d,d.yc,a,null,c):M(!0)}function Tv(a,b,c){var d=a.b;return d&&(a=Rv(a,b),a.B)?!d.zc||d.Cc?M(!0):Sv(d,d.zc,a,a.B.firstChild,c):M(!0)}function Uv(a,b){a&&Vv(a.K?a.parent:a,function(a,d){a instanceof yp||b.A.push(new Wv(d))})}function Vv(a,b){for(var c=a;c;c=c.parent){var d=c.C;d&&d instanceof zp&&!jl(c,d)&&b(d,c)}}
function zp(a,b){this.parent=a;this.j=b;this.b=null}zp.prototype.We=function(){return"Repetitive elements owner formatting context (vivliostyle.repetitiveelements.RepetitiveElementsOwnerFormattingContext)"};zp.prototype.ff=function(a,b){return b};function Xv(a,b){var c=Rv(a,b);return c?c.B:null}function Rv(a,b){do if(!jl(b,a)&&b.M===a.j)return b;while(b=b.parent);return null}
function Or(a,b){a.b||Hp.some(function(b){return b.root===a.j?(a.b=b.elements,!0):!1})||(a.b=new Yv(b,a.j),Hp.push({root:a.j,elements:a.b}))}zp.prototype.Ye=function(){};zp.prototype.Xe=function(){};var Hp=[];function Yv(a,b){this.N=a;this.yc=this.zc=this.u=this.D=this.l=this.A=null;this.G=this.H=0;this.Bc=this.Cc=!1;this.gd=this.re=!0;this.j=!1;this.Z=b;this.J=this.g=null;this.S=[];this.Y=[]}function Zv(a,b){a.zc||(a.zc=Vk(b),a.A=b.M,a.D=b.B)}function $v(a,b){a.yc||(a.yc=Vk(b),a.l=b.M,a.u=b.B)}
function Sv(a,b,c,d,e){var f=c.B,g=c.B.ownerDocument.createElement("div");f.appendChild(g);var h=new Im(e,g,c),l=h.za.g;h.za.g=null;a.h=!0;return Lm(h,new kl(b)).ea(function(){a.h=!1;f.removeChild(g);if(f)for(;g.firstChild;){var b=g.firstChild;g.removeChild(b);b.setAttribute("data-adapt-spec","1");d?f.insertBefore(b,d):f.appendChild(b)}h.za.g=l;return M(!0)})}Yv.prototype.b=function(a){var b=0;if(a&&!this.f(a))return b;if(!this.Bc||a&&aw(this,a))b+=this.G;this.Cc||(b+=this.H);return b};
Yv.prototype.F=function(a){var b=0;if(a&&!this.f(a))return b;a&&aw(this,a)&&(b+=this.G);this.gd||(b+=this.H);return b};function aw(a,b){return bw(b,a.Y,function(){return cw(a.J,b,!1)})}Yv.prototype.f=function(a){var b=this;return bw(a,this.S,function(){return cw(b.Z,a,!0)})};function bw(a,b,c){var d=b.filter(function(b){return b.w.M===a.M&&b.w.K===a.K});if(0<d.length)return d[0].result;c=c(a);b.push({w:a,result:c});return c}
function cw(a,b,c){for(var d=[];a;a=a.parentNode){if(b.M===a)return b.K;d.push(a)}for(a=b.M;a;a=a.parentNode){var e=d.indexOf(a);if(0<=e)return c?!e:!1;for(e=a;e;e=e.previousElementSibling)if(d.includes(e))return!0}return b.K}function dw(a){return!a.Bc&&a.re&&a.yc||!a.Cc&&a.gd&&a.zc?!0:!1}function ew(a){this.C=a}ew.prototype.b=function(){};ew.prototype.f=function(a){return!!a};
ew.prototype.g=function(a,b,c,d){(a=this.C.b)&&!a.j&&(a.D&&(a.H=Op(a.D,c,a.N),a.D=null),a.u&&(a.G=Op(a.u,c,a.N),a.u=null),a.j=!0);return d};function fw(a){this.C=a}fw.prototype.b=function(){};fw.prototype.f=function(){return!0};fw.prototype.g=function(a,b,c,d){return d};function gw(a){this.C=a}v(gw,ew);gw.prototype.b=function(a,b){ew.prototype.b.call(this,a,b);var c=L("BlockLayoutProcessor.doInitialLayout");Fm(new Em(new hw(a.C),b.j),a).Ea(c);return c.result()};gw.prototype.f=function(){return!1};
function iw(a){this.C=a}v(iw,fw);iw.prototype.b=function(a,b){jl(a,this.C)||a.K||b.A.unshift(new Wv(a));return jw(a,b)};function Wv(a){this.w=Rv(a.C,a)}n=Wv.prototype;n.ke=function(a,b){var c=this.w.C.b;return c&&!Po(this.w.B)&&dw(c)?b&&!a||a&&a.xa?!1:!0:!0};n.nd=function(){var a=this.w.C.b;return a&&dw(a)?(!a.Bc&&a.re&&a.yc?a.Bc=!0:!a.Cc&&a.gd&&a.zc&&(a.Cc=!0),!0):!1};n.cd=function(a,b,c,d){(c=this.w.C.b)&&a&&d.u&&(!b||aw(c,b))&&(c.Bc=!1,c.re=!1)};
n.Na=function(a,b){var c=this.w.C,d=this.w.C.b;if(!d)return M(!0);var e=this.w;return Tv(c,e,b).ea(function(){return Qv(c,e,b).ea(function(){d.Cc=d.Bc=!1;d.re=!0;d.gd=!0;return M(!0)})})};n.se=function(a){return a instanceof Wv?this.w.C===a.w.C:!1};n.ue=function(){return 10};function kw(a){Om.call(this);this.C=a}v(kw,Om);kw.prototype.qf=function(a){var b=this.C.b;return jl(a,this.C)||b.j?(jl(a,this.C)||a.K||!b||(b.Cc=!1,b.gd=!1),new iw(this.C)):new gw(this.C)};function hw(a){this.C=a}v(hw,Hm);
hw.prototype.Cd=function(a){var b=this.C,c=a.w,d=b.b;if(c.parent&&b.j===c.parent.M){switch(c.u){case "header":if(d.zc)c.u="none";else return Zv(d,c),M(!0);break;case "footer":if(d.yc)c.u="none";else return $v(d,c),M(!0)}d.g||(d.g=c.M)}return Hm.prototype.Cd.call(this,a)};hw.prototype.tc=function(a){var b=this.C,c=a.w;c.M===b.j&&(b.b.J=a.ld&&a.ld.M,a.Vb=!0);return"header"===c.u||"footer"===c.u?M(!0):Hm.prototype.tc.call(this,a)};function lw(){}v(lw,Lp);
lw.prototype.je=function(a,b,c){if(xo(b,a))return Ho(b,a);var d=a.C;return Xv(d,a)?(c&&Uv(a.parent,b),jl(a,d)?Lp.prototype.je.call(this,a,b,c):Pm(new kw(d),a,b)):Jo(b,a)};lw.prototype.Ze=function(a){var b=uo(a).b;if(!b)return!1;b.h||b.A!==a.M&&b.l!==a.M||a.B.parentNode.removeChild(a.B);return!1};
function jw(a,b){var c=a.C,d=L("doLayout"),e=Gm(b.j,a,!1);Io(e,b).then(function(a){var e=a;Fe(function(a){for(var d={};e;){d.Oa=!0;Bp(b,e,!1).then(function(d){return function(f){e=f;Jn(b.l)?Q(a):b.g?Q(a):e&&b.u&&e&&e.xa?Q(a):e&&e.K&&e.M==c.j?Q(a):d.Oa?d.Oa=!1:P(a)}}(d));if(d.Oa){d.Oa=!1;return}d={Oa:d.Oa}}Q(a)}).then(function(){O(d,e)})});return d.result()}lw.prototype.Na=function(a,b,c,d){return Lp.prototype.Na.call(this,a,b,c,d)};lw.prototype.Fd=function(a,b,c,d){Lp.prototype.Fd(a,b,c,d)};
function ro(a){for(var b=[],c=a;c;c=c.Md)c.A.forEach(function(c){if(c instanceof Wv){var d=c.w.C.b;b.push(d)}c instanceof mw&&(d=new nw(c.w,c.f),b.push(d));c instanceof ow&&pw(c,a).forEach(function(a){b.push(a)})});return b}var qw=new lw;ge("RESOLVE_LAYOUT_PROCESSOR",function(a){return a instanceof zp&&!(a instanceof yp)?qw:null});function rw(a,b){if(!a||!a.J||a.K||xo(b,a))return M(a);var c=a.J;return sw(c,b,a).ea(function(d){var e=a.B;e.appendChild(d);var f=Op(d,b,a.b);e.removeChild(d);b.A.push(new mw(a,c,f));return M(a)})}function tw(a,b,c){this.b=a;this.f=b;this.Nb=c}tw.prototype.matches=function(){var a=uw[this.b];return!!a&&null!=a.Sa&&Ci(a.Sa,this.f,this.Nb)};function uj(a){this.b=a}uj.prototype.matches=function(){return this.b.some(function(a){return a.matches()})};function vj(a){this.b=a}vj.prototype.matches=function(){return this.b.every(function(a){return a.matches()})};
function tj(a,b){var c=b.split("_");if("NFS"==c[0])return new tw(a,parseInt(c[1],10),parseInt(c[2],10));sa("unknown view condition. condition="+b);return null}function Wj(a,b,c){tr(c,function(c){Yj(a,c,b)})}function tr(a,b){var c=a._viewConditionalStyles;c&&c.forEach(function(a){a.Cg.matches()&&b(a.Mg)})}function Er(a,b,c){var d=uw;if(!d[a]||d[a].cb<=c)d[a]={Sa:b,cb:c}}var uw={};function Nr(a,b){this.b=b;this.M=a}
function sw(a,b,c){var d=c.B.ownerDocument.createElement("div"),e=new Im(b,d,c),f=e.za.g;e.za.g=null;return Lm(e,vw(a)).ea(function(){a.b.f["after-if-continues"]=!1;e.za.g=f;var b=d.firstChild;x(b,"display","block");return M(b)})}function vw(a){var b=nr.createElementNS("http://www.w3.org/1999/xhtml","div");pr(b,"after-if-continues");a=new $k(a.M,b,null,null,null,3,a.b);return new kl({pa:[{node:b,kb:a.type,wa:a,Ja:null,Ga:null}],na:0,K:!1,Qa:null})}function mw(a,b,c){this.w=a;this.b=b;this.f=c}n=mw.prototype;
n.ke=function(a,b){return b&&!a||a&&a.xa?!1:!0};n.nd=function(){return!1};n.cd=function(){};n.Na=function(a,b){var c=this;return(new nw(this.w,this.f)).f(a)?sw(this.b,b,this.w).ea(function(a){c.w.B.appendChild(a);return M(!0)}):M(!0)};n.se=function(a){return a instanceof mw?this.b==a.b:!1};n.ue=function(){return 9};function nw(a,b){this.w=a;this.g=b}nw.prototype.b=function(a){return this.f(a)?this.g:0};nw.prototype.F=function(a){return this.b(a)};
nw.prototype.f=function(a){if(!a)return!1;var b=a.wa?a.wa.oa:a.M;if(b===this.w.M)return!!a.K;for(a=b.parentNode;a;a=a.parentNode)if(a===this.w.M)return!0;return!1};function Io(a,b){return a.ea(function(a){return rw(a,b)})}function Ip(a,b){var c=L("vivliostyle.selectors.processAfterIfContinuesOfAncestors"),d=a;Ee(function(){if(d){var a=rw(d,b);d=d.parent;return a.Hc(!0)}return M(!1)}).then(function(){O(c,!0)});return c.result()};function ww(a){var b=xw.findIndex(function(b){return b.root===a});0<=b&&xw.splice(b,1)}function yw(a){var b=xw.findIndex(function(b){return b.root===a});return(b=xw[b])?b.Og:null}
function zw(a,b,c){var d=a.w,e=d.display,f=d.parent?d.parent.display:null,g=!1;if("inline-table"===f&&!(d.C instanceof yp))for(var h=d.parent;h;h=h.parent)if(h.C instanceof yp){g=h.C===b;break}return g||"table-row"===e&&!Aw(f)&&"table"!==f&&"inline-table"!==f||"table-cell"===e&&"table-row"!==f&&!Aw(f)&&"table"!==f&&"inline-table"!==f||d.C instanceof yp&&d.C!==b?Jo(c,d).ea(function(b){a.w=b;return M(!0)}):null}
function Aw(a){return"table-row-group"===a||"table-header-group"===a||"table-footer-group"===a}function Bw(a,b){this.rowIndex=a;this.M=b;this.b=[]}function Cw(a){return Math.min.apply(null,a.b.map(function(a){return a.height}))}function Dw(a,b,c){this.rowIndex=a;this.Ra=b;this.g=c;this.f=c.colSpan||1;this.rowSpan=c.rowSpan||1;this.height=0;this.b=null}function Ew(a,b,c){this.rowIndex=a;this.Ra=b;this.bc=c}function Fw(a,b,c){this.g=a;this.b=c;this.lc=new Im(a,b,c);this.f=!1}
Fw.prototype.ec=function(){var a=this.b.B,b=this.b.Z;"middle"!==b&&"bottom"!==b||x(a,"vertical-align","top");var c=this.lc.ec(!0);x(a,"vertical-align",b);return c};function Gw(a,b){this.B=a;this.b=b}function Hw(a,b,c,d){Nm.call(this,a,b,c,d);this.C=a.C;this.rowIndex=this.l=null}v(Hw,Nm);Hw.prototype.f=function(a,b){var c=Nm.prototype.f.call(this,a,b);return b<this.b()?null:Iw(this).every(function(a){return!!a.w})?c:null};
Hw.prototype.b=function(){var a=Nm.prototype.b.call(this);Iw(this).forEach(function(b){a+=b.Eb.b()});return a};function Iw(a){a.l||(a.l=Jw(a).map(function(a){return a.ec()}));return a.l}function Jw(a){return Kw(a.C,null!=a.rowIndex?a.rowIndex:a.rowIndex=Lw(a.C,a.position.M)).map(a.C.Sd,a.C)}function Mw(a,b,c){this.rowIndex=a;this.j=b;this.C=c;this.h=null}v(Mw,no);
Mw.prototype.f=function(a,b){if(b<this.b())return null;var c=Nw(this),d=Ow(this),e=d.every(function(a){return!!a.w})&&d.some(function(a,b){var d=c[b].lc,e=a.w,f=d.tf[0];return!(f.B===e.B&&f.K===e.K&&f.na===e.na)&&!Uk(fl(e),d.za.xb)});this.j.xa=d.some(function(a){return a.w&&a.w.xa});return e?this.j:null};Mw.prototype.b=function(){var a=this.C,b=0;Cw(a.g[this.rowIndex])>a.N/2||(b+=10);Ow(this).forEach(function(a){b+=a.Eb.b()});return b};
function Ow(a){a.h||(a.h=Nw(a).map(function(a){return a.ec()}));return a.h}function Nw(a){return Pw(a.C,a.rowIndex).map(a.C.Sd,a.C)}function yp(a,b){zp.call(this,a,b);this.F=b;this.u=!1;this.G=-1;this.N=0;this.H=[];this.J=this.A=null;this.S=0;this.g=[];this.l=[];this.f=[];this.D=null;this.h=[];this.b=null}v(yp,zp);n=yp.prototype;n.We=function(){return"Table formatting context (vivliostyle.table.TableFormattingContext)"};
n.ff=function(a,b){if(!b)return b;switch(a.display){case "table-row":return!this.h.length;case "table-cell":return!this.h.some(function(b){return b.Id.pa[0].node===a.M});default:return b}};function Qw(a,b){var c=a.l[b];c||(c=a.l[b]=[]);return c}function Lw(a,b){return a.g.findIndex(function(a){return b===a.M})}function Pw(a,b){return Qw(a,b).reduce(function(a,b){return b.bc!==a[a.length-1]?a.concat(b.bc):a},[])}function Kw(a,b){return Pw(a,b).filter(function(a){return a.rowIndex+a.rowSpan-1>b})}
n.Sd=function(a){return this.f[a.rowIndex]&&this.f[a.rowIndex][a.Ra]};function Rw(a){0>a.G&&(a.G=Math.max.apply(null,a.g.map(function(a){return a.b.reduce(function(a,b){return a+b.f},0)})));return a.G}function Sw(a,b){a.g.forEach(function(a){a.b.forEach(function(a){var c=Kk(b,a.g);a.g=null;a.height=this.u?c.width:c.height},this)},a)}
function Tw(a,b){if(!b)return null;var c=null,d=0;a:for(;d<a.f.length;d++)if(a.f[d])for(var e=0;e<a.f[d].length;e++)if(a.f[d][e]&&b===a.f[d][e].lc.za){c=a.g[d].b[e];break a}if(!c)return null;for(;d<a.l.length;d++)for(;e<a.l[d].length;e++){var f=a.l[d][e];if(f.bc===c)return{rowIndex:f.rowIndex,Ra:f.Ra}}return null}function Uw(a,b){var c=[];return a.l.reduce(function(d,e,f){if(f>=b.rowIndex)return d;e=a.Sd(e[b.Ra].bc);if(!e||c.includes(e))return d;Vw(e.lc.za,d);c.push(e);return d},[])}
function Ww(a){var b=[];a.g.forEach(function(c){c.b.forEach(function(c,e){b[e]||(b[e]={Jf:[],elements:[]});var d=b[e],g=a.Sd(c);g&&!d.Jf.includes(g)&&(Vw(g.lc.za,d.elements),d.Jf.push(g))})});return[new Xw(b.map(function(a){return a.elements}))]}function Vw(a,b){a.A.forEach(function(a){a instanceof Wv&&b.push(a.w.C.b);a instanceof ow&&pw(a,null).forEach(function(a){b.push(a)})})}n.Ye=function(){return[].concat(this.h)};n.Xe=function(a){this.h=a};function Xw(a){this.f=a}
Xw.prototype.b=function(a){return Yw(this,a,function(a){return a.current})};Xw.prototype.F=function(a){return Yw(this,a,function(a){return a.He})};function Yw(a,b,c){var d=0;a.f.forEach(function(a){a=oo(b,a);d=Math.max(d,c(a))});return d}function Zw(a,b){this.C=a;this.h=b;this.rowIndex=-1;this.Ra=0;this.g=!1;this.f=[]}v(Zw,Hm);n=Zw.prototype;
n.Cd=function(a){var b=this.C,c=zw(a,b,this.h);if(c)return c;$w(this,a);var c=a.w,d=b.b;switch(c.display){case "table":b.S=c.sa;break;case "table-caption":b.H.push(new Gw(c.B,c.la));break;case "table-header-group":return d.zc||(this.b=!0,Zv(d,c)),M(!0);case "table-footer-group":return d.yc||(this.b=!0,$v(d,c)),M(!0);case "table-row":this.b||(this.g=!0,this.rowIndex++,this.Ra=0,b.g[this.rowIndex]=new Bw(this.rowIndex,c.M),d.g||(d.g=c.M))}return Hm.prototype.Cd.call(this,a)};
n.tc=function(a){var b=this.C,c=a.w,d=c.display,e=this.h.f;$w(this,a);if(c.M===b.F)d=Qn(e,Xv(b,c)),b.N=parseFloat(d[b.u?"height":"width"]),b.b.J=a.ld&&a.ld.M,a.Vb=!0;else switch(d){case "table-header-group":case "table-footer-group":if(this.b)return this.b=!1,M(!0);break;case "table-row":this.b||(b.D=c.B,this.g=!1);break;case "table-cell":if(!this.b){this.g||(this.rowIndex++,this.Ra=0,this.g=!0);d=this.rowIndex;c=new Dw(this.rowIndex,this.Ra,c.B);e=b.g[d];e||(b.g[d]=new Bw(d,null),e=b.g[d]);e.b.push(c);
for(var e=d+c.rowSpan,f=Qw(b,d),g=0;f[g];)g++;for(;d<e;d++)for(var f=Qw(b,d),h=g;h<g+c.f;h++){var l=f[h]=new Ew(d,h,c);c.b||(c.b=l)}this.Ra++}}return Hm.prototype.tc.call(this,a)};n.uf=function(a){ax(this,a)};n.Df=function(a){ax(this,a)};n.kg=function(a){ax(this,a)};n.Cf=function(a){ax(this,a)};function ax(a,b){var c=b.w;c&&c.B&&!Fo(c)&&a.f.push(c.clone())}function $w(a,b){0<a.f.length&&Ko(a.h,b.w,a.f);a.f=[]}
function bx(a,b){this.gc=!0;this.C=a;this.f=b;this.l=!1;this.b=-1;this.g=0;this.u=b.u;b.u=!1}v(bx,Hm);var cx={"table-caption":!0,"table-column-group":!0,"table-column":!0};
function dx(a,b,c,d){var e=b.rowIndex,f=b.Ra,g=c.B;if(1<b.f){x(g,"box-sizing","border-box");for(var h=a.C.J,l=0,k=0;k<b.f;k++)l+=h[b.b.Ra+k];l+=a.C.S*(b.f-1);x(g,a.C.u?"height":"width",l+"px")}b=g.ownerDocument.createElement("div");g.appendChild(b);c=new Fw(a.f,b,c);a=a.C;(g=a.f[e])||(g=a.f[e]=[]);g[f]=c;1===d.f.pa.length&&d.f.K&&(c.f=!0);return Lm(c.lc,d).Hc(!0)}function ex(a,b){var c=a.C.h[0];return c?c.bc.b.Ra===b:!1}
function fx(a){var b=a.C.h;if(!b.length)return[];var c=[],d=0;do{var e=b[d],f=e.bc.rowIndex;if(f<a.b){var g=c[f];g||(g=c[f]=[]);g.push(e);b.splice(d,1)}else d++}while(d<b.length);return c}
function gx(a,b){var c=a.C,d=fx(a),e=d.reduce(function(a){return a+1},0);if(0===e)return M(!0);var f=a.f.j,g=b.w;g.B.parentNode.removeChild(g.B);var h=L("layoutRowSpanningCellsFromPreviousFragment"),l=M(!0),k=0,m=[];d.forEach(function(a){var b=this;l=l.ea(function(){var d=Xk(a[0].Id.pa[1],g.parent);return Ao(f,d,!1).ea(function(){function g(a){for(;l<a;){if(!m.includes(l)){var b=d.B.ownerDocument.createElement("td");x(b,"padding","0");d.B.appendChild(b)}l++}}var h=M(!0),l=0;a.forEach(function(a){var b=
this;h=h.ea(function(){var c=a.bc;g(c.b.Ra);var h=a.Id,p=Xk(h.pa[0],d);p.na=h.na;p.K=h.K;p.Sa=h.pa[0].Sa+1;return Ao(f,p,!1).ea(function(){for(var d=a.Hf,f=0;f<c.f;f++)m.push(l+f);l+=c.f;return dx(b,c,p,d).ea(function(){p.B.rowSpan=c.rowIndex+c.rowSpan-b.b+e-k;return M(!0)})})})},b);return h.ea(function(){g(Rw(c));k++;return M(!0)})})})},a);l.then(function(){Ao(f,g,!0,b.Gd).then(function(){O(h,!0)})});return h.result()}
function hx(a,b){if(a.j||a.h)return M(!0);var c=b.w,d=a.C;0>a.b?a.b=Lw(d,c.M):a.b++;a.g=0;a.l=!0;return gx(a,b).ea(function(){ix(a);up(a.f,b.ld,null,!0,b.dd)&&!Kw(d,a.b-1).length&&(a.f.u=a.u,c.xa=!0,b.Vb=!0);return M(!0)})}function ix(a){a.C.g[a.b].b.forEach(function(b){var c=a.C.h[b.Ra];c&&c.bc.b.Ra==b.b.Ra&&(b=c.Id.pa[0],c=hk(a.f.j.da,b.node),Er(c,b.Sa+1,1))})}
function jx(a,b){if(a.j||a.h)return M(!0);var c=b.w;a.l||(0>a.b?a.b=0:a.b++,a.g=0,a.l=!0);var d=a.C.g[a.b].b[a.g],e=Zk(c).modify();e.K=!0;b.w=e;var f=L("startTableCell");ex(a,d.b.Ra)?(e=a.C.h.shift(),c.Sa=e.Id.pa[0].Sa+1,e=M(e.Hf)):e=Go(a.f,c,b.Gd).ea(function(a){a.B&&c.B.removeChild(a.B);return M(new kl(Vk(a)))});e.then(function(e){dx(a,d,c,e).then(function(){a.tc(b);a.g++;O(f,!0)})});return f.result()}
bx.prototype.lg=function(a){var b=zw(a,this.C,this.f);if(b)return b;var b=a.w,c=this.C.b,d=b.display;return"table-header-group"===d&&c&&c.A===b.M?(this.j=!0,M(!0)):"table-footer-group"===d&&c&&c.l===b.M?(this.h=!0,M(!0)):"table-row"===d?hx(this,a):"table-cell"===d?jx(this,a):M(!0)};bx.prototype.Nf=function(a){a=a.w;"table-row"===a.display&&(this.l=!1,this.j||this.h||(a=Zk(a).modify(),a.K=!1,this.f.N.push(new Mw(this.b,a,this.C))));return M(!0)};
bx.prototype.tc=function(a){var b=a.w,c=this.C.b,d=b.display;"table-header-group"===d?c&&!c.h&&c.A===b.M?(this.j=!1,b.B.parentNode.removeChild(b.B)):x(b.B,"display","table-row-group"):"table-footer-group"===d&&(c&&!c.h&&c.l===b.M?(this.h=!1,b.B.parentNode.removeChild(b.B)):x(b.B,"display","table-row-group"));if(d&&cx[d])b.B.parentNode.removeChild(b.B);else if(b.M===this.C.F)b.xa=tp(this.f,b,null),this.f.u=this.u,a.Vb=!0;else return Hm.prototype.tc.call(this,a);return M(!0)};var xw=[];
function kx(){}function lx(a,b,c,d){for(var e=a.ownerDocument,f=e.createElement("tr"),g=[],h=0;h<b;h++){var l=e.createElement("td");f.appendChild(l);g.push(l)}a.parentNode.insertBefore(f,a.nextSibling);b=g.map(function(a){a=Kk(d,a);return c?a.height:a.width});a.parentNode.removeChild(f);return b}function mx(a){var b=[];for(a=a.firstElementChild;a;)"colgroup"===a.localName&&b.push(a),a=a.nextElementSibling;return b}
function nx(a){var b=[];a.forEach(function(a){var c=a.span;a.removeAttribute("span");for(var e=a.firstElementChild;e;){if("col"===e.localName){var f=e.span;e.removeAttribute("span");for(c-=f;1<f--;){var g=e.cloneNode(!0);a.insertBefore(g,e);b.push(g)}b.push(e)}e=e.nextElementSibling}for(;0<c--;)e=a.ownerDocument.createElement("col"),a.appendChild(e),b.push(e)});return b}
function ox(a,b,c,d){if(a.length<c){var e=d.ownerDocument.createElement("colgroup");b.push(e);for(b=a.length;b<c;b++){var f=d.ownerDocument.createElement("col");e.appendChild(f);a.push(f)}}}function px(a,b,c){var d=a.u,e=a.D;if(e){a.D=null;var f=e.ownerDocument.createDocumentFragment(),g=Rw(a);if(0<g){var h=a.J=lx(e,g,d,c.f);c=mx(b);e=nx(c);ox(e,c,g,b);e.forEach(function(a,b){x(a,d?"height":"width",h[b]+"px")});c.forEach(function(a){f.appendChild(a.cloneNode(!0))})}a.A=f}}
function qx(a,b,c){var d=b.C;d.u=b.b;Or(d,b.b);var e=yw(b.M);ww(b.M);var f=L("TableLayoutProcessor.doInitialLayout"),g=Zk(b);Fm(new Em(new Zw(b.C,c),c.j),b).then(function(a){var h=a.B,k=Kk(c.f,h),k=c.b?k.left:k.bottom,k=k+(c.b?-1:1)*oo(b,ro(c)).current;so(c,k)||e&&e.tg?(px(d,h,c),Sw(d,c.f),O(f,null)):(c.N.push(new rx(g)),O(f,a))}.bind(a));return f.result()}function sx(a,b,c){var d=a.H;d.forEach(function(a,f){a&&(b.insertBefore(a.B,c),"top"===a.b&&(d[f]=null))})}
function tx(a,b){if(a.A&&b){var c=mx(b);c&&c.forEach(function(a){b.removeChild(a)})}}function ux(a,b){var c=a.C,d=Xv(c,a),e=d.firstChild;sx(c,d,e);c.A&&!mx(d).length&&d.insertBefore(c.A.cloneNode(!0),e);c=new bx(c,b);c=new Em(c,b.j);d=L("TableFormattingContext.doLayout");Fm(c,a).Ea(d);return d.result()}n=kx.prototype;n.je=function(a,b,c){var d=a.C;return Xv(d,a)?(c&&Uv(a.parent,b),Pm(new vx(d,this),a,b)):Jo(b,a)};n.Kf=function(a,b,c,d){return new Hw(a,b,c,d)};n.Ze=function(){return!1};n.Af=function(){return!1};
n.Na=function(a,b,c,d){var e=b.C;if("table-row"===b.display){var f=Lw(e,b.M);e.h=[];var g;g=b.K?Kw(e,f):Pw(e,f);if(g.length){var h=L("TableLayoutProcessor.finishBreak"),l=0;Fe(function(a){if(l===g.length)Q(a);else{var b=g[l++],c=e.Sd(b),d=c.ec().w,h=c.b,k=fl(h),u=new kl(fl(d));e.h.push({Id:k,Hf:u,bc:b});h=h.B;Mp(c.b);f<b.rowIndex+b.rowSpan-1&&(h.rowSpan=f-b.rowIndex+1);c.f?P(a):c.lc.Na(d,!1,!0).then(function(){var b=e.b;if(b){var f=e.u,g=c.g,h=c.lc.za.element,k=c.b.B,l=Kk(g.f,k),k=Ro(g,k);f?(b=l.right-
g.la-b.b(d)-k.right,x(h,"max-width",b+"px")):(b=g.la-b.b(d)-l.top-k.top,x(h,"max-height",b+"px"));x(h,"overflow","hidden")}P(a)})}}).then(function(){lp(a,b,!1);Mp(b);e.f=[];O(h,!0)});return h.result()}}e.f=[];return pp.Na(a,b,c,d)};n.Fd=function(a,b,c,d){Lp.prototype.Fd(a,b,c,d)};function vx(a,b){Om.call(this);this.g=b;this.b=a}v(vx,Om);vx.prototype.qf=function(a){var b=this.b.b;return b&&b.j?(a.M===this.b.F&&!a.K&&b&&(b.Cc=!1,b.gd=!1),new wx(this.b)):new xx(this.b,this.g)};
vx.prototype.Jd=function(a){Om.prototype.Jd.call(this,a);tx(this.b,Xv(this.b,a))};vx.prototype.ie=function(a,b){Om.prototype.ie.call(this,a,b);this.b.f=[]};function xx(a,b){this.C=a;this.h=b}v(xx,ew);xx.prototype.b=function(a,b){ew.prototype.b.call(this,a,b);return qx(this.h,a,b)};function rx(a){Nm.call(this,a,null,a.xa,0)}v(rx,Nm);rx.prototype.b=function(){if(!this.h)throw Error("EdgeBreakPosition.prototype.updateEdge not called");return(this.j?3:0)+(this.position.parent?this.position.parent.j:0)};
rx.prototype.u=function(a){a.A.push(new yx(this.position.M))};function yx(a){this.b=a}n=yx.prototype;n.ke=function(){return!1};n.nd=function(){return!0};n.cd=function(a,b){xw.push({root:b.M,Og:{tg:!0}})};n.Na=function(){return M(!0)};n.se=function(a){return a instanceof yx&&a.b===this.b};n.ue=function(){return 0};function wx(a){this.C=a}v(wx,fw);wx.prototype.b=function(a,b){var c=this.C.b;if(c&&!aw(c,a)){var d=new ow(a);b.A.some(function(a){return d.se(a)})||b.A.unshift(d)}return ux(a,b)};
function ow(a){Wv.call(this,a);this.b=[]}v(ow,Wv);n=ow.prototype;n.ke=function(a,b,c){var d=this.w.C.b;return!d||c.Md||Po(this.w.B)||!dw(d)?!0:b&&!a||a&&a.xa?!1:!0};n.nd=function(a){return zx(a,this.w.C).some(function(b){return b.Kd.some(function(b){return b.nd(a)})})?!0:Wv.prototype.nd.call(this,a)};n.cd=function(a,b,c,d){var e=this.w.C;this.b=zx(b,e);this.b.forEach(function(b){b.Kd.forEach(function(e){e.cd(a,b.Eb,c,d)})});a||(tx(e,Xv(e,this.w)),Ax(c));Wv.prototype.cd.call(this,a,b,c,d)};
n.Na=function(a,b){var c=this,d=L("finishBreak"),e=this.b.reduce(function(a,b){return a.concat(b.Kd.map(function(a){return{vg:a,Eb:b.Eb}}))},[]),f=0;Ee(function(){if(f<e.length){var a=e[f++];return a.vg.Na(a.Eb,b).Hc(!0)}return M(!1)}).then(function(){O(d,!0)});return d.result().ea(function(){return Wv.prototype.Na.call(c,a,b)})};function Ax(a){if(a&&"table-row"===a.display&&a.B)for(;a.B.previousElementSibling;){var b=a.B.previousElementSibling;b.parentNode&&b.parentNode.removeChild(b)}}
function zx(a,b){return Bx(a,b).map(function(a){return{Kd:a.yg.lc.za.A,Eb:a.Eb}})}function Bx(a,b){var c=Number.MAX_VALUE;a&&"table-row"===a.display&&(c=Lw(b,a.M)+1);for(var c=Math.min(b.f.length,c),d=[],e=0;e<c;e++)b.f[e]&&b.f[e].forEach(function(a){a&&d.push({yg:a,Eb:a.ec().w})});return d}function pw(a,b){var c=a.w.C,d=Tw(c,b);return d?Uw(c,d):Ww(c)}n.se=function(a){return a instanceof ow?this.w.C===a.w.C:!1};var Cx=new kx;
ge("RESOLVE_FORMATTING_CONTEXT",function(a,b,c){return b?c===Od?(b=a.parent,new yp(b?b.C:null,a.M)):null:null});ge("RESOLVE_LAYOUT_PROCESSOR",function(a){return a instanceof yp?Cx:null});Array.from||(Array.from=function(a,b,c){b&&c&&(b=b.bind(c));c=[];for(var d=a.length,e=0;e<d;e++)c[e]=b?b(a[e],e):a[e];return c});
Array.prototype.findIndex||Object.defineProperty(Array.prototype,"findIndex",{value:function(a,b){if(null==this)throw new TypeError("Array.prototype.findIndex called on null or undefined");if("function"!==typeof a)throw new TypeError("predicate must be a function");for(var c=Object(this),d=c.length>>>0,e,f=0;f<d;f++)if(e=c[f],a.call(b,e,f,c))return f;return-1},enumerable:!1,configurable:!1,writable:!1});
Object.assign||(Object.assign=function(a,b){if(!b)return a;Object.keys(b).forEach(function(c){a[c]=b[c]});return a});function Dx(a){function b(a){return"number"===typeof a?a:null}function c(a){return"string"===typeof a?{url:a,wb:null,nc:null}:{url:a.url,wb:b(a.startPage),nc:b(a.skipPagesBefore)}}return Array.isArray(a)?a.map(c):a?[c(a)]:null}function Ex(a){var b={};Object.keys(a).forEach(function(c){var d=a[c];switch(c){case "autoResize":b.autoresize=d;break;case "pageBorderWidth":b.pageBorder=d;break;default:b[c]=d}});return b}
function Fx(a,b){ak=a.debug;this.g=!1;this.h=a;this.gb=new Tu(a.window||window,a.viewportElement,"main",this.wg.bind(this));this.f={autoResize:!0,fontSize:16,pageBorderWidth:1,renderAllPages:!0,pageViewMode:"autoSpread",zoom:1,fitToScreen:!1,defaultPaperSize:void 0};b&&this.jg(b);this.b=new fb;Object.defineProperty(this,"readyState",{get:function(){return this.gb.u}})}n=Fx.prototype;n.jg=function(a){var b=Object.assign({a:"configure"},Ex(a));this.gb.h(b);Object.assign(this.f,a)};
n.wg=function(a){var b={type:a.t};Object.keys(a).forEach(function(c){"t"!==c&&(b[c]=a[c])});gb(this.b,b)};n.Pg=function(a,b){this.b.addEventListener(a,b,!1)};n.Sg=function(a,b){this.b.removeEventListener(a,b,!1)};n.Bg=function(a,b,c){a||gb(this.b,{type:"error",content:"No URL specified"});Gx(this,a,null,b,c)};n.Qg=function(a,b,c){a||gb(this.b,{type:"error",content:"No URL specified"});Gx(this,null,a,b,c)};
function Gx(a,b,c,d,e){function f(a){if(a)return a.map(function(a){return{url:a.url||null,text:a.text||null}})}d=d||{};var g=f(d.authorStyleSheet),h=f(d.userStyleSheet);e&&Object.assign(a.f,e);b=Object.assign({a:b?"loadXML":"loadPublication",userAgentRootURL:a.h.userAgentRootURL,url:Dx(b)||c,document:d.documentObject,fragment:d.fragment,authorStyleSheet:g,userStyleSheet:h},Ex(a.f));a.g?a.gb.h(b):(a.g=!0,uv(a.gb,b))}n.fc=function(){return this.gb.fc()};
n.Eg=function(a,b){if("epage"===a)this.gb.h({a:"moveTo",epage:b});else{var c;a:switch(a){case "left":c="ltr"===this.fc()?"previous":"next";break a;case "right":c="ltr"===this.fc()?"next":"previous";break a;default:c=a}this.gb.h({a:"moveTo",where:c})}};n.Dg=function(a){this.gb.h({a:"moveTo",url:a})};n.Rc=function(){return this.gb.b&&this.gb.b.O&&(this.gb.b.O.Yb||this.gb.b.O.lf)?!!this.gb.b.Rc():null};n.Uc=function(a,b){this.gb.h({a:"toc",v:null==a?"toggle":a?"show":"hide",autohide:b})};
n.Rg=function(a){a:{var b=this.gb;if(!b.g)throw Error("no page exists.");switch(a){case "fit inside viewport":a=pv(b,b.$.ub?ov(b,b.j):b.g.g);break a;default:throw Error("unknown zoom type: "+a);}}return a};n.zg=function(){return this.gb.Z};oa("vivliostyle.viewer.Viewer",Fx);Fx.prototype.setOptions=Fx.prototype.jg;Fx.prototype.addListener=Fx.prototype.Pg;Fx.prototype.removeListener=Fx.prototype.Sg;Fx.prototype.loadDocument=Fx.prototype.Bg;Fx.prototype.loadPublication=Fx.prototype.Qg;
Fx.prototype.getCurrentPageProgression=Fx.prototype.fc;Fx.prototype.navigateToPage=Fx.prototype.Eg;Fx.prototype.navigateToInternalUrl=Fx.prototype.Dg;Fx.prototype.isTOCVisible=Fx.prototype.Rc;Fx.prototype.showTOC=Fx.prototype.Uc;Fx.prototype.queryZoomFactor=Fx.prototype.Rg;Fx.prototype.getPageSizes=Fx.prototype.zg;oa("vivliostyle.viewer.ZoomType",qv);qv.FIT_INSIDE_VIEWPORT="fit inside viewport";oa("vivliostyle.viewer.PageViewMode",Su);Su.SINGLE_PAGE="singlePage";Su.SPREAD="spread";
Su.AUTO_SPREAD="autoSpread";Lv.call(Xu,"load_vivliostyle","end",void 0);var Hx=16,Ix="ltr";function Jx(a){window.adapt_command(a)}function Kx(){Jx({a:"moveTo",where:"ltr"===Ix?"previous":"next"})}function Lx(){Jx({a:"moveTo",where:"ltr"===Ix?"next":"previous"})}
function Mx(a){var b=a.key,c=a.keyIdentifier,d=a.location;if("End"===b||"End"===c)Jx({a:"moveTo",where:"last"}),a.preventDefault();else if("Home"===b||"Home"===c)Jx({a:"moveTo",where:"first"}),a.preventDefault();else if("ArrowUp"===b||"Up"===b||"Up"===c)Jx({a:"moveTo",where:"previous"}),a.preventDefault();else if("ArrowDown"===b||"Down"===b||"Down"===c)Jx({a:"moveTo",where:"next"}),a.preventDefault();else if("ArrowRight"===b||"Right"===b||"Right"===c)Lx(),a.preventDefault();else if("ArrowLeft"===
b||"Left"===b||"Left"===c)Kx(),a.preventDefault();else if("0"===b||"U+0030"===c)Jx({a:"configure",fontSize:Math.round(Hx)}),a.preventDefault();else if("t"===b||"U+0054"===c)Jx({a:"toc",v:"toggle",autohide:!0}),a.preventDefault();else if("+"===b||"Add"===b||"U+002B"===c||"U+00BB"===c||"U+004B"===c&&d===KeyboardEvent.b)Hx*=1.2,Jx({a:"configure",fontSize:Math.round(Hx)}),a.preventDefault();else if("-"===b||"Subtract"===b||"U+002D"===c||"U+00BD"===c||"U+004D"===c&&d===KeyboardEvent.b)Hx/=1.2,Jx({a:"configure",
fontSize:Math.round(Hx)}),a.preventDefault()}
function Nx(a){switch(a.t){case "loaded":a=a.viewer;var b=Ix=a.fc();a.ge.setAttribute("data-vivliostyle-page-progression",b);a.ge.setAttribute("data-vivliostyle-spread-view",a.$.ub);window.addEventListener("keydown",Mx,!1);document.body.setAttribute("data-vivliostyle-viewer-status","complete");a=document.getElementById("vivliostyle-page-navigation-left");a.addEventListener("click",Kx,!1);b=document.getElementById("vivliostyle-page-navigation-right");b.addEventListener("click",Lx,!1);[a,b].forEach(function(a){a.setAttribute("data-vivliostyle-ui-state",
"attention");window.setTimeout(function(){a.removeAttribute("data-vivliostyle-ui-state")},1E3)});break;case "nav":(a=a.cfi)&&location.replace(Ha(location.href,Va(a||"")));break;case "hyperlink":a.internal&&Jx({a:"moveTo",url:a.href})}}
oa("vivliostyle.viewerapp.main",function(a){var b=a&&a.fragment||Fa("f"),c=a&&a.pubURL||Fa("b"),d=a&&a.xmlURL||Fa("x"),e=a&&a.defaultPageWidth||Fa("w"),f=a&&a.defaultPageHeight||Fa("h"),g=a&&a.defaultPageSize||Fa("size"),h=a&&a.orientation||Fa("orientation"),l=Fa("spread"),l=a&&a.spreadView||!!l&&"false"!=l,k=a&&a.viewportElement||document.body;a={a:c?"loadPublication":"loadXML",url:c||d,autoresize:!0,fragment:b,renderAllPages:!0,userAgentRootURL:a&&a.uaRoot||null,document:a&&a.document||null,userStyleSheet:a&&
a.userStyleSheet||null,spreadView:l,pageBorder:1};var m;if(e&&f)m=e+" "+f;else{switch(g){case "A5":e="148mm";f="210mm";break;case "A4":e="210mm";f="297mm";break;case "A3":e="297mm";f="420mm";break;case "B5":e="176mm";f="250mm";break;case "B4":e="250mm";f="353mm";break;case "letter":e="8.5in";f="11in";break;case "legal":e="8.5in";f="14in";break;case "ledger":e="11in",f="17in"}e&&f&&(m=g,"landscape"===h&&(m=m?m+" landscape":null,g=e,e=f,f=g))}e&&f&&(a.viewport={width:e,height:f},g=document.createElement("style"),
g.textContent="@page { size: "+m+"; margin: 0; }",document.head.appendChild(g));uv(new Tu(window,k,"main",Nx),a)});
    return enclosingObject.vivliostyle;
}.bind(window));




}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{}]},{},[5]);
