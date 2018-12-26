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
        this.iframe.srcdoc="<html><head><style id='vivliostyle-page-rules'></style></head><body onload='parent.printInstance.runInIframe(window)'></body></html>"
        document.body.appendChild(this.iframe)
    }

    runInIframe(iframeWin) {
        this.iframeWin = iframeWin
        return this.preparePrint().then(
            () => this.fixPreparePrint()
        ).then(
            () => this.browserPrint()
        ).then(
            () => this.cleanUp()
        )
    }

    preparePrint() {
        this.iframeWin.document.title = this.title
        const docBlob = new Blob([this.htmlDoc], {type : 'text/html'}),
            docURL = URL.createObjectURL(docBlob),
            Viewer = new vivliostyle.viewer.Viewer(
                {
                    viewportElement: this.iframeWin.document.body,
                    window: this.iframeWin,
                    userAgentRootURL: `${this.resourcesUrl}`
                }
            )
        return new Promise(resolve => {
            Viewer.addListener('readystatechange', () => {
                if (Viewer.readyState === 'complete') {
                    resolve()
                }
            })
            Viewer.loadDocument({url: docURL})
        })
    }

    fixPreparePrint() {
        this.iframeWin.document.querySelectorAll('[data-vivliostyle-page-container]').forEach(node => node.style.display = 'block')
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
