document.addEventListener("DOMContentLoaded", function() {
    var href = window.location.href;
    if (href.match(/^http/)) {
        var root = href.replace(/\/docs\/.*$/, "");
        var rootUrls = document.getElementsByClassName("root-url");
        for (var i = 0; i < rootUrls.length; i++) {
            rootUrls[i].textContent = root;
        }
        var replaceHrefs = document.getElementsByClassName("replace-href");
        for (var i = 0; i < replaceHrefs.length; i++) {
            var el = replaceHrefs[i];
            el.href = el.href.replace(/^http:\/\/localhost:8000/, root);
        }
    }

    function makeEventListener(input, fragment, link, isEpub) {
        return function() {
            var filePath = input.value;
            if (!filePath.match(/^https?:\/\//)) {
                filePath = "../" + filePath.replace(/^\//, "");
            }
            if (isEpub && filePath.substring(filePath.length-1) !== "/") {
                filePath += "/";
            }
            fragment.textContent = filePath;
            var regexp = isEpub ? /#b=.*$/ : /#x=.*$/;
            var f = isEpub ? "#b=" : "#x=";
            link.href = link.href.replace(regexp, f + filePath);
        }
    }

    var filePathInput = document.getElementById("file-path-input");
    var inputFilePathFragment = document.getElementById("input-file-path-fragment");
    var inputFilePathLink = document.getElementById("input-file-path-link");
    filePathInput.addEventListener("input",
        makeEventListener(filePathInput, inputFilePathFragment, inputFilePathLink, false));

    var epubPathInput = document.getElementById("epub-path-input");
    var inputEpubPathFragment = document.getElementById("input-epub-path-fragment");
    var inputEpubPathLink = document.getElementById("input-epub-path-link");
    epubPathInput.addEventListener("input",
        makeEventListener(epubPathInput, inputEpubPathFragment, inputEpubPathLink, true));
});
