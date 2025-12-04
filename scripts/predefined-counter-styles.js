/**
 * This script extracts definitions contained in the "W3C Group Note - Ready-made Counter Styles".
 *
 * 1. Access the web page
 * 2. Paste into the JavaScript console
 * 3. Copy the output
 */

(() => {
  const BASE_URL = "https://www.w3.org/TR/predefined-counter-styles/";

  // Expected:
  // <div class="csWrapper">
  //   <div class="copyMe" onclick="copyTemplate('adlam')"> ... </div>
  //   <p class="name" id="adlam"><a href="#adlam">adlam</a></p>
  //   <p class="counterstyle"><code> ... </code></p>
  //   <div id="out_adlam" class="browser_output"> ... </div>
  //   <script>addExamples('adlam', 'fuf', 'rtl')</script>
  // </div>

  const result = Array.from(document.querySelectorAll("[onclick]"))
    .filter((el) => /copyTemplate\(.+\)/.test(el.getAttribute("onclick") ?? ""))
    .map((el) => el.parentElement)
    .filter((el) => el)
    .reduce((prev, el) => {
      const href = el.querySelector("p.name>a")?.getAttribute("href");
      const code = el?.querySelector("p.counterstyle>code")?.textContent.trim();
      const css = `\n/* ${BASE_URL}${href} */\n${code}\n`;
      if (!href || !code) {
        throw new Error(`href=${href},code=${code}`);
      }
      return prev + css;
    }, "");

  console.log(`String.raw\`${result}\``);
})();
