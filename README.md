# Vivliostyle.js

JavaScript library for web sites with rich paged viewing and EPUB support, shared with Vivliostyle Formatter & Browser.

## Try Vivliostyle.js

<https://vivliostyle.org/samples/>

## Bug reports & feature requests

Please send them to

- [GitHub Issues](https://github.com/vivliostyle/vivliostyle.js/issues)
- Mailing list ([English](https://groups.google.com/forum/?hl=ja#!forum/vivliostyle), [Japanese](https://groups.google.com/forum/?hl=ja#!forum/vivliostyle-ja))

## Using Vivliostyle.js

### Using an all-in-one package

Download an all-in-one package from <https://vivliostyle.org/download/> and follow the instruction in it.

See <https://github.com/vivliostyle/vivliostyle-ui> for source code of the UI.

### Integrating Vivliostyle.js into web sites

Vivliostyle.js can be installed from [npm](https://www.npmjs.com/package/vivliostyle):

```
npm install vivliostyle
```
to have vivliostyle render all pages within a specific element, do something like this:

```js
import {viewer} from vivliostyle

const HTML = "<h1>The title</h1><p>The very first paragraph</p>" // The HTML code you want to process with Vivliostyle.js.
const CSS = "h1 {background-color: red;}" // The CSS you want to apply.
const Viewer = new viewer.Viewer(
    {
      viewportElement: document.getElementById('pages'), // the element into which the rendering should happen
      userAgentRootURL: `/vivliostyle/resources/` // The URL where it can find the vivliostyle resources folder
    }
  )

Viewer.addListener('readystatechange', () => {
  if (Viewer.readyState === 'complete') {
    // We need to postprocess if we want to show all pages, as otherwise Vivliostyle will only show the first page.
    document.querySelectorAll('#pages [data-vivliostyle-page-container]').forEach(node => node.style.display = 'block')
    console.log('rendering done!')
  }
})

Viewer.loadDocument({
  url: URL.createObjectURL( // We need to create a blob of the HTML and then give the URL of that blob, as loadDocument only allows URLs.
    new Blob([`<!DOCTYPE html>\n<html><head><style>${CSS}</style></head><body>${HTML}</body></html>`], {type : 'text/html'})
  )
})
```
Look at the [API doc](doc/api.md) for more options.



## License

Licensed under [AGPL Version 3](http://www.gnu.org/licenses/agpl.html).

Vivliostyle.js is implemented based on [Peter Sorotokin's EPUB Adaptive Layout implementation](https://github.com/sorotokin/adaptive-layout), which is licensed under [Apache License, Version 2.0](http://www.apache.org/licenses/LICENSE-2.0).

Vivliostyle.js contains following components:

- [fast-diff](https://www.npmjs.com/package/fast-diff)
  - Licensed under [Apache License, Version 2.0](http://www.apache.org/licenses/LICENSE-2.0)
