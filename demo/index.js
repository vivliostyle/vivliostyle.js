import {vivliostylePrint} from "../src"


document.getElementById('print').addEventListener('click', () => {
    const html = document.getElementById('html').value,
        css = document.getElementById('css').value,
        htmlDoc = `
        <!doctype html>
        <html>
            <head><style>${css}</style><head>
            <body>${html}</body>
        </html>`,
        title = 'Vivliostyle-print demo',
        resourcesUrl = 'resources/'

    vivliostylePrint(htmlDoc, title, resourcesUrl)
})
