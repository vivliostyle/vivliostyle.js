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

    var filePathInput = document.getElementById("file-path-input");
    var inputFilePathFragment = document.getElementById("input-file-path-fragment");
    var inputFilePathLink = document.getElementById("input-file-path-link");
    filePathInput.addEventListener("input", function() {
        var filePath = filePathInput.value;
        if (!filePath.match(/^https?:\/\//)) {
            filePath = "../" + filePath.replace(/^\//, "");
        }
        inputFilePathFragment.textContent = filePath;
        inputFilePathLink.href = inputFilePathLink.href.replace(/#x=.*$/, "#x=" + filePath);
    });
});
