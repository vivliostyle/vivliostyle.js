import vivliostyle from "vivliostyle"


class VivliostylePrint {

    constructor(htmlDoc, title, resourcesUrl) {
        this.htmlDoc = htmlDoc
        this.title = title
        this.resourcesUrl = resourcesUrl // URL of 'vivliostyle/resources' folder.
    }

    init() {
        this.iframe = document.createElement('iframe')
        this.window = window
        this.window.printInstance = this
        this.iframe.srcdoc="<html><head></head><body onload='parent.printInstance.runInIframe(window)'></body></html>"
        this.iframe.style.width = 0 // We don't want the iframe to be seen, so we make it zero size with zero border.
        this.iframe.style.height = 0
        this.iframe.style.borderWidth = 0
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
        this.iframeWin.print()
    }

    cleanUp() {
        this.iframe.parentElement.removeChild(this.iframe)
        delete this.window.printInstance
    }
}

export function vivliostylePrint(htmlDoc, title, resourcesUrl) {
    const printer = new VivliostylePrint(htmlDoc, title, resourcesUrl)
    printer.init()
}
