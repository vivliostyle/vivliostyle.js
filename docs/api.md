---
title: API Reference
---

### Table of Contents

- [API](#api)

  - [constants](#constants)
    - [`PageProgression`](#constantspageprogression)
    - [`PageSide`](#constantspageside)
    - [`ReadyState`](#constantsreadystate)
  - [plugin](#plugin)
    - [`registerHook(name, fn)`](#pluginregisterhookname-fn)
    - [`removeHook(name, fn)`](#pluginremovehookname-fn)
  - [profile](#profile)
    - [`profiler.registerStartTiming(name, timestamp)`](#profileprofilerregisterstarttimingname-timestamp)
    - [`profiler.registerEndTiming(name, timestamp)`](##profileprofilerregisterendtimingname-timestamp)
    - [`profiler.printTimings()`](#profileprofilerprinttimings)
    - [`profiler.disable()`](#profileprofilerdisable)
    - [`profiler.enable()`](#profileprofilerenable)
  - [viewer](#viewer)
    - [`new Viewer(settings, options)`](#new-viewerviewersettings-options)
    - [`PageViewMode`](#viewerpageviewmode)
    - [`ZoomType`](#viewerzoomtype)

- [Classes](#classes)

  - [`Viewer`](#viewer-1)
    - [`addListener(type, listener)`](#vieweraddlistenertype-listener)
    - [`getCurrentPageProgression()`](#viewergetcurrentpageprogression)
    - [`getPageSizes()`](#viewergetpagesizes)
    - [`isTOCVisible()`](#vieweristocvisible)
    - [`loadDocument(singleDocumentOptions, documentOptions, viewerOptions)`](#viewerloaddocumentsingledocumentoptions-documentoptions-vieweroptions)
    - [`loadPublication(pubURL, documentOptions, viewerOptions)`](#viewerloadpublicationpubURL-documentoptions-vieweroptions)
    - [`navigateToInternalUrl()`](#viewernavigatetointernalurl)
    - [`navigateToPage()`](#viewernavigatetopage)
    - [`queryZoomFactor(type)`](#viewerqueryzoomfactortype)
    - [`removeListener(type, listener)`](#viewerremovelistenertype-listener)
    - [`setOptions(options)`](#viewersetoptionsoptions)
    - [`showTOC(opt_show, opt_autohide)`](#viewershowtocopt_show-opt_autohide)

- [TypeDefs](#typedefs)
  - [`DocumentOptions`](#documentoptions)
  - [`SingleDocumentOptions`](#singledocumentoptions)
  - [`ViewerSettings`](#viewersettings)
  - [`ViewerOptions`](#vieweroptions)

# API

## constants

### `constants.PageProgression`

Enum `PageProgression` represents page progression direction.
`PageProgression` has members, `LTR` and `RTL`.

### `constants.PageSide`

Enum `PageSide` represents page side.
`PageSide` has members, `LEFT` and `RIGHT`.

### `constants.ReadyState`

Enum `ReadyState` represents viewer ready state.
`ReadyState` has members, `LOADING`, `INTERACTIVE` and `COMPLETE`.

## plugin

### `plugin.registerHook(name, fn)`

Register a function to a hook with the specified name.
The registered function is called at appropriate timings by the core code.
Arguments passed to the function depend on the hook.
When multiple functions are registered, they are called by the order in which they are registered.

###### Parameters

- `name` (string) — Name of the hook.
- `fn` (function) — Function to be registered to the hook.

### `plugin.removeHook(name, fn)`

Remove a function already registered to the specified name.
Note that even if the same function are registered multiple times, this method removes only the first one.

###### Parameters

- `name` (string) — Name of the hook.
- `fn` (function) — Function to be removed from the hook.

## profile

### `profile.profiler.registerStartTiming(name, timestamp)`

Registers start timing of some event.

###### Parameters

- `name` (string) — Name of event.
- `timestamp` (number, optional) — Used as the actual timestamp of the event if specified, instead of "now".

### `profile.profiler.registerEndTiming(name, timestamp)`

Registers end timing of some event.

###### Parameters

- `name` (string) — Name of event.
- `timestamp` (number, optional) — Used as the actual timestamp of the event if specified, instead of "now".

### `profile.profiler.printTimings()`

Log registered timings (start/end/duration).
All values are printed in ms unit.

### `profile.profiler.disable()`

Disable profiling.

### `profile.profiler.enable()`

Enable profiling.

## viewer

### `new viewer.Viewer(settings, options)`

Vivliostyle Viewer class. Creates [`Viewer`](#viewer-1).

###### Parameters

- `settings` ([ViewerSettings](#viewersettings))
- `options` ([ViewerOptions](#vieweroptions), optional)

### `viewer.PageViewMode`

Enum `PageViewMode`.
`PageViewMode` has members, `SINGLE_PAGE`, `SPREAD` and `AUTO_SPREAD`.

### `viewer.ZoomType`

Enum `ZoomType`.
`ZoomType` has only one member, `FIT_INSIDE_VIEWPORT`.

# Classes

## `Viewer`

### `Viewer.addListener(type, listener)`

Add a listener function, which is invoked when the specified type of event is dispatched.

###### Parameters

- `type` (string) — Event type.
- `listener` (function) — Listener function.

### `Viewer.getCurrentPageProgression()`

Returns the current page progression of the viewer. If no document is loaded, returns null.

###### Returns

[PageProgression](#constantspageprogression)

### `Viewer.getPageSizes()`

###### Returns

Array<{width: number, height: number}>

### `Viewer.isTOCVisible()`

Returns true if TOC is visible, false if hidden, null if TOC is unavailable

### `Viewer.loadDocument(singleDocumentOptions, documentOptions, viewerOptions)`

Load an HTML or XML document(s).

###### Parameters

- `singleDocumentOptions` ([SingleDocumentOptions](#singledocumentoptions)|Array<[SingleDocumentOptions](#singledocumentoptions)>)
- `documentOptions` ([DocumentOptions](#documentoptions), optional)
- `viewerOptions` ([ViewerOptions](#vieweroptions), optional)

### `Viewer.loadPublication(pubURL, documentOptions, viewerOptions)`

Load a EPUB/WebPub publication.

###### Parameters

- `pubURL` (string)
- `documentOptions` ([DocumentOptions](#documentoptions), optional)
- `viewerOptions` ([ViewerOptions](#vieweroptions), optional)

### `Viewer.navigateToInternalUrl()`

Navigate to the specified internal URL.

### `Viewer.navigateToPage()`

Navigate to the specified page.

### `Viewer.queryZoomFactor(type)`

Returns zoom factor corresponding to the specified zoom type.

###### Parameters

- `type` ([ZoomType](#viewerzoomtype))

###### Returns

number

### `Viewer.removeListener(type, listener)`

Remove an event listener.

###### Parameters

- `type` (string) — Event type.
- `listener` (function) — Listener function.

### `Viewer.setOptions(options)`

Set ViewerOptions to the viewer.

###### Parameters

- `options` ([ViewerOptions](#vieweroptions))

### `Viewer.showTOC(opt_show, opt_autohide)`

Show or hide TOC box

###### Parameters

- `opt_show` (boolean) - If true show TOC, false hide TOC. If null or undefined toggle TOC.
- `opt_autohide` (boolean) - If true, automatically hide when click TOC item

# TypeDefs

### `DocumentOptions`

Options for the displayed document.

- `documentObject` (Document, optional) — Document object for the document. If provided, it is used directly without parsing the source again.
- `fragment` (string, optional) — Fragmentation identifier (EPUB CFI) of the location in the document which is to be displayed.
- `authorStyleSheet` (Array<string>, optional) — An array of author style sheets to be injected after all author style sheets referenced from the document. A single stylesheet may be a URL of the style sheet or a text content of the style sheet.
- `userStyleSheet` (Array<string>, optional) — An array of user style sheets to be injected. A single stylesheet may be a URL of the style sheet or a text content of the style sheet.

### `SingleDocumentOptions`

Options for a single source document.
`SingleDocumentOptions` is the object that has members below, or otherwise string that represents `url`.

- `url` (string) — URL of the document.
- `startPage` (number, optional) — If specified, the `page` page-based counter is set to the specified value on the first page of the document. It is equivalent to specifying `counter-reset: page [specified value - 1]` on that page.
- `skipPagesBefore` (number, optional) — If specified, the `page` page-based counter is incremented by the specified value _before_ updating page-based counters on the first page of the document. This option is ignored if `startPageNumber` option is also specified.

### `ViewerSettings`

Viewer settings that must be passed to Viewer's constructor.

- `viewportElement` (HTMLElement, **required**) — An element used as the viewport of the displayed contents.
- `userAgentRootURL` (string, optional) — URL of a directory from which viewer resource files (under resources/ directory in the source repository) are served.
- `window` (Window, optional) — Window object. If omitted, current `window` is used.
- `debug` (boolean, optional) — Debug flag.

### `ViewerOptions`

Viewer options that can be set after the Viewer object is constructed.

- `autoResize` (boolean, optional) — Run layout again when the window is resized. default: true
- `fontSize` (number, optional) — Default font size (px). default: 16
- `pageBorderWidth` (number, optional) — Width of a border between two pages in a single spread (px). Effective only in spread view mode. default: 1
- `renderAllPages` (boolean, optional) — Render all pages at the document load time. default: true
- `pageViewMode` (PageViewMode, optional) — Page view mode (singlePage / spread / autoSpread). default: singlePage
- `zoom` (number, optional) — Zoom factor with which pages are displayed. default: 1
- `fitToScreen` (boolean, optional) — Auto adjust zoom factor to fit the screen. default: false
- `defaultPaperSize` ({width: number, height: number}, optional) — Default paper size in px. Effective when @page size is set to auto. default: undefined (means the windows size is used as paper size).

## print

### `printHTML`

Allows page-layouting using the vivliostyle for printing within a website without destroying the original layout

```js
import { printHTML } from "@vivliostyle/core";

const htmlDoc = `<!doctype html>
<html>
    <head>
        <style>
        ... Add your CSS code here ...
        </style>
    </head>
    <body>
        ... Add your HTML code here ...
    </body>
</html>`;

const config = {
  title: "My printed page",
  printCallback: (iframeWin) => iframeWin.print(), // optional: only needed if calling something other than window.print() for printing.
};

printHTML(htmlDoc, config);
```
