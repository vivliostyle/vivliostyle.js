import {
    vivliostylePrint
} from "../src"


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
        resourcesUrl = '/demo/resources/',
        printCallback = iframeWin => {
            const pageCount = iframeWin.document.querySelectorAll('[data-vivliostyle-page-container]').length
            console.log(`page count: ${pageCount}`)
            iframeWin.print()
        }

    vivliostylePrint(htmlDoc, {
        title,
        resourcesUrl,
        printCallback,
        hideIframe: true, // Whether to use a hidden iframe (default: true)
        removeIframe: true // Whether to remove the iframe after use (default: true)
    })
})
