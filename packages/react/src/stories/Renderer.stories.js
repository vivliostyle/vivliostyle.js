import React from "react";
import { action } from "@storybook/addon-actions";
import { text, boolean, number, color, select } from "@storybook/addon-knobs";

import { Renderer } from "../renderer";

export default {
  title: "Renderer",
  component: Renderer,
};

const SOURCES = [
  "https://vivliostyle.github.io/vivliostyle_doc/samples/gon/index.html",
  "https://vivliostyle.github.io/vivliostyle_doc/samples/gutenberg/Alice.html",
];

export const Basic = () => (
  <Renderer
    source={select("Source", SOURCES, SOURCES[0])}
    page={number("Page", 1)}
    zoom={number("Zoom", 1)}
    theme={{
      fontSize: number("Font Size", 16),
      background: color("Background", "#ececec"),
      authorStyleSheet: text("Author Stylesheet", undefined),
      userStyleSheet: text("User Stylesheet", undefined),
    }}
    renderAllPages={boolean("Render All Pages", true)}
    autoResize={boolean("Auto Resize", true)}
    pageViewMode={select(
      "Page View Mode",
      ["singlePage", "spread", "autoSpread"],
      "singlePage",
    )}
    defaultPaperSize={text("Default Paper Size", undefined)}
    onLoad={action("loaded")}
    onError={action("error")}
    onNavigation={action("navigation")}
    onMessage={(msg, type) => action("message")(type, msg.messages[0])}
    onReadyStateChange={action("readyStateChange")}
    onHyperlink={action("hyperlink")}
  />
);
