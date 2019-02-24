import vivliostyle from "vivliostyle"

class VivliostylePrint {

    constructor(
        htmlDoc, {
            title = '',
            resourcesUrl = 'resources/',
            printCallback = iframeWin => iframeWin.print(),
            hideIframe = true,
            removeIframe = true
        }) {
        this.htmlDoc = htmlDoc
        this.title = title
        this.resourcesUrl = resourcesUrl // URL of 'vivliostyle/resources' folder.
        this.printCallback = printCallback
        this.hideIframe = hideIframe
        this.removeIframe = removeIframe
    }

    init() {
        this.iframe = document.createElement('iframe')
        if (this.hideIframe) {
            this.iframe.style.width = 0 // We don't want the iframe to be seen, so we make it zero size with zero border.
            this.iframe.style.height = 0
            this.iframe.style.borderWidth = 0
        }
        this.window = window
        this.window.printInstance = this
        this.iframe.srcdoc = `<!DOCTYPE html>
        <html data-vivliostyle-paginated="true">
            <head>
                <meta charset='utf-8'/>
                <meta name='viewport' content='width=device-width, initial-scale=1.0'/>
                <title>${this.title}</title>
                <link rel="stylesheet" href="${this.resourcesUrl}vivliostyle-viewport-screen.css" media="screen"/>
                <link rel="stylesheet" href="${this.resourcesUrl}vivliostyle-viewport.css"/>
                <style>
                    html[data-vivliostyle-paginated] {
                        width: 100%;
                        height: 100%;
                    }
                    html[data-vivliostyle-paginated] body,
                    html[data-vivliostyle-paginated] [data-vivliostyle-viewer-viewport] {
                        width: 100% !important;
                        height: 100% !important;
                    }
                    html[data-vivliostyle-paginated],
                    html[data-vivliostyle-paginated] body {
                        margin: 0;
                        padding: 0;
                    }
                </style>
                <style id='vivliostyle-page-rules'></style>
            </head>
            <body onload='parent.printInstance.runInIframe(window)'>
                <div id="vivliostyle-viewer-viewport"></div>
            </body>
        </html>`
        document.body.appendChild(this.iframe)
    }

    runInIframe(iframeWin) {
        this.iframeWin = iframeWin
        return this.preparePrint().then(
            () => this.browserPrint()
        ).then(
            () => this.cleanUp()
        )
    }

    preparePrint() {
        this.iframeWin.document.title = this.title
        const docBlob = new Blob([this.htmlDoc], {
                type: 'text/html'
            }),
            docURL = URL.createObjectURL(docBlob),
            Viewer = new vivliostyle.viewer.Viewer({
                viewportElement: this.iframeWin.document.body.firstElementChild,
                window: this.iframeWin,
                userAgentRootURL: `${this.resourcesUrl}`
            })
        return new Promise(resolve => {
            Viewer.addListener('readystatechange', () => {
                if (Viewer.readyState === 'complete') {
                    resolve()
                }
            })
            Viewer.loadDocument({
                url: docURL
            })
        })
    }

    browserPrint() {
        this.printCallback(this.iframeWin)
    }

    cleanUp() {
        delete this.window.printInstance
        if (this.removeIframe) {
            this.iframe.parentElement.removeChild(this.iframe)
        }
    }
}

export function vivliostylePrint(htmlDoc, config) {
    const printer = new VivliostylePrint(htmlDoc, config)
    printer.init()
}
