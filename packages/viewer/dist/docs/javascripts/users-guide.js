document.addEventListener("DOMContentLoaded", function() {
  const href = window.location.href;
  if (href.match(/^http/)) {
    const root = href.replace(/\/docs\/.*$/, "");
    const rootUrls = document.getElementsByClassName("root-url");
    for (const i = 0; i < rootUrls.length; i++) {
      rootUrls[i].textContent = root;
    }
    const replaceHrefs = document.getElementsByClassName("replace-href");
    for (const i = 0; i < replaceHrefs.length; i++) {
      const el = replaceHrefs[i];
      el.href = el.href.replace(/^http:\/\/localhost:8000/, root);
    }
  }

  function makeEventListener(input, fragment, link, isEpub) {
    return function() {
      let filePath = input.value;
      if (!filePath.match(/^https?:\/\//)) {
        filePath = "../" + filePath.replace(/^\//, "");
      }
      if (isEpub && filePath.substring(filePath.length - 1) !== "/") {
        filePath += "/";
      }
      fragment.textContent = filePath;
      const regexp = isEpub ? /#b=.*$/ : /#x=.*$/;
      const f = isEpub ? "#b=" : "#x=";
      link.href = link.href.replace(regexp, f + filePath);
    };
  }

  const filePathInput = document.getElementById("file-path-input");
  const inputFilePathFragment = document.getElementById(
    "input-file-path-fragment",
  );
  const inputFilePathLink = document.getElementById("input-file-path-link");
  filePathInput.addEventListener(
    "input",
    makeEventListener(
      filePathInput,
      inputFilePathFragment,
      inputFilePathLink,
      false,
    ),
  );

  const epubPathInput = document.getElementById("epub-path-input");
  const inputEpubPathFragment = document.getElementById(
    "input-epub-path-fragment",
  );
  const inputEpubPathLink = document.getElementById("input-epub-path-link");
  epubPathInput.addEventListener(
    "input",
    makeEventListener(
      epubPathInput,
      inputEpubPathFragment,
      inputEpubPathLink,
      true,
    ),
  );
});
