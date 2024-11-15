import React from "react";
import { action } from "@storybook/addon-actions";
import { withKnobs, text, boolean, number, color, select } from "@storybook/addon-knobs";

import { Renderer } from "../renderer";

export default {
  title: "Renderer",
  decorators: [withKnobs],
  component: Renderer,
};

const SOURCES = [
  "https://vivliostyle.github.io/vivliostyle_doc/samples/gon/index.html",
  "https://vivliostyle.github.io/vivliostyle_doc/samples/gutenberg/Alice.html",
  "https://vivliostyle.github.io/vivliostyle_doc/ja/vivliostyle-user-group-vol4/artifacts/content/",
  "https://github.com/IDPF/epub3-samples/tree/master/30/accessible_epub_3",
];

export const Basic = () => (
  <Renderer
    source={select("Source", SOURCES, SOURCES[0])}
    page={number("Page", 1)}
    zoom={number("Zoom", 1)}
    bookMode={boolean("Book Mode", true)}
    fontSize={number("Font Size", 16)}
    background={color("Background", "#ececec")}
    renderAllPages={boolean("Render All Pages", true)}
    autoResize={boolean("Auto Resize", true)}
    pageViewMode={select(
      "Page View Mode",
      ["singlePage", "spread", "autoSpread"],
      "singlePage",
    )}
    defaultPaperSize={text("Default Paper Size", undefined)}
    fitToScreen={boolean("Fit to Screen", false)}
    pageBorderWidth={number("Page Border Width", 1)}
    authorStyleSheet={text("Author Stylesheet", undefined)}
    userStyleSheet={text("User Stylesheet", undefined)}
    onLoad={action("loaded")}
    onError={action("error")}
    onNavigation={action("navigation")}
    onMessage={(msg, type) => action("message")(type, msg)}
    onReadyStateChange={action("readyStateChange")}
    onHyperlink={action("hyperlink")}
  />
);

export const Narrowed = () => (
  <div
    style={{
      background: "black",
      width: "100%",
      height: "100%",
      position: "absolute",
    }}>
    <div
      style={{
        width: "50vw",
        height: "100%",
        background: "red",
        border: "1px solid red",
        display: "flex",
        flexDirection: "row",
        justifyContent: "center",
        alignItems: "center",
      }}>
      <Renderer
        source={select("Source", SOURCES, SOURCES[0])}
        page={number("Page", 1)}
        zoom={number("Zoom", 1)}
        bookMode={boolean("Book Mode", true)}
        fontSize={number("Font Size", 16)}
        background={color("Background", "#ececec")}
        renderAllPages={boolean("Render All Pages", true)}
        autoResize={boolean("Auto Resize", true)}
        pageViewMode={select(
          "Page View Mode",
          ["singlePage", "spread", "autoSpread"],
          "singlePage",
        )}
        defaultPaperSize={text("Default Paper Size", undefined)}
        fitToScreen={boolean("Fit to Screen", true)}
        pageBorderWidth={number("Page Border Width", 1)}
        authorStyleSheet={text("Author Stylesheet", undefined)}
        userStyleSheet={text("User Stylesheet", undefined)}
        onLoad={action("loaded")}
        onError={action("error")}
        onNavigation={action("navigation")}
        onMessage={(msg, type) => action("message")(type, msg.messages[0])}
        onReadyStateChange={action("readyStateChange")}
        onHyperlink={action("hyperlink")}
      />
    </div>
  </div>
);
