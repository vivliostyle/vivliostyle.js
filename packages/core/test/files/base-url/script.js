// Loaded relative to the document URL (base-url/)
for (const elem of document.querySelectorAll(".script-doc")) {
  elem.style.background = "#2a2";
  elem.textContent = "script src (document): PASS";
}
