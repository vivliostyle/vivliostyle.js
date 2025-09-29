import React from "react";
import { fn } from "storybook/test";

import { Renderer } from "../renderer";

const SOURCES = [
  "https://vivliostyle.github.io/vivliostyle_doc/samples/gon/index.html",
  "https://vivliostyle.github.io/vivliostyle_doc/samples/gutenberg/Alice.html",
  "https://vivliostyle.github.io/vivliostyle_doc/ja/vivliostyle-user-group-vol4/artifacts/content/",
  "https://github.com/IDPF/epub3-samples/tree/master/30/accessible_epub_3",
];

export default {
  title: "Renderer",
  component: Renderer,
  argTypes: {
    source: {
      control: { type: "select" },
      options: SOURCES,
    },
    page: {
      control: { type: "number" },
    },
    zoom: {
      control: { type: "number" },
    },
    bookMode: {
      control: { type: "boolean" },
    },
    fontSize: {
      control: { type: "number" },
    },
    background: {
      control: { type: "color" },
    },
    renderAllPages: {
      control: { type: "boolean" },
    },
    autoResize: {
      control: { type: "boolean" },
    },
    pageViewMode: {
      control: { type: "select" },
      options: ["singlePage", "spread", "autoSpread"],
    },
    defaultPaperSize: {
      control: { type: "text" },
    },
    fitToScreen: {
      control: { type: "boolean" },
    },
    pageBorderWidth: {
      control: { type: "number" },
    },
    authorStyleSheet: {
      control: { type: "text" },
    },
    userStyleSheet: {
      control: { type: "text" },
    },
  },
  args: {
    source: SOURCES[0],
    page: 1,
    zoom: 1,
    bookMode: true,
    fontSize: 16,
    background: "#ececec",
    renderAllPages: true,
    autoResize: true,
    pageViewMode: "singlePage",
    fitToScreen: false,
    pageBorderWidth: 1,
    onLoad: fn(),
    onError: fn(),
    onNavigation: fn(),
    onMessage: fn(),
    onReadyStateChange: fn(),
    onHyperlink: fn(),
  },
};

export const Basic = (args) => <Renderer {...args} />;

export const Narrowed = (args) => (
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
      <Renderer {...args} fitToScreen={true} />
    </div>
  </div>
);
