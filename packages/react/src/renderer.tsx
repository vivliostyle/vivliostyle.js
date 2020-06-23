import React, { useRef, useEffect } from "react";
import styled from "@emotion/styled";
import {
  CoreViewer,
  Payload,
  ReadyState,
  Navigation,
  PageViewMode,
} from "@vivliostyle/core";

import { epageFromPageNumber } from "./epage";

export type MessageType = "debug" | "info" | "warn";
export type NavigationPayload = Omit<Payload, "internal" | "href" | "content">;
export type HyperlinkPayload = Pick<Payload, "internal" | "href">;

interface VolatileState {
  docTitle: string;
  epage: number;
  epageCount: number;
  metadata: unknown;
}

type ChildrenFunction = ({
  container,
  reload,
}: {
  container: JSX.Element;
  reload: () => void;
}) => React.ReactNode;

interface RendererTheme {
  fontSize?: number;
  background?: string;
  userStylesheet?: string;
}

interface RendererProps {
  source: string;
  page?: number;
  zoom?: number;
  renderAllPages?: boolean;
  autoResize?: boolean;
  pageViewMode?: PageViewMode;
  defaultPaperSize?: {
    width: number;
    height: number;
  };
  theme?: RendererTheme;
  style?: React.CSSProperties;
  onMessage?: (message: string, type: MessageType) => void;
  onError?: (error: string) => void;
  onReadyStateChange?: (state: ReadyState) => void;
  onLoad?: (state: VolatileState) => void;
  onNavigation?: (state: VolatileState) => void;
  onHyperlink?: (payload: HyperlinkPayload) => void;
  children: React.ReactNode | ChildrenFunction;
}

export const Renderer: React.FC<RendererProps> = ({
  source,
  page = 1,
  zoom = 1,
  renderAllPages = true,
  autoResize = true,
  pageViewMode = PageViewMode.SINGLE_PAGE,
  defaultPaperSize,
  theme: { fontSize = 16, background = "#ececec", userStylesheet } = {},
  style,
  onMessage,
  onError,
  onReadyStateChange,
  onLoad,
  onNavigation,
  onHyperlink,
  children,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const instanceRef = useRef<CoreViewer>();
  const stateRef = React.useRef<VolatileState>();

  function loadSource() {
    const instance = instanceRef.current!;
    const isPublication = source.endsWith(".json");
    const documentOptions = {
      ...(userStylesheet
        ? { userStyleSheet: [{ text: userStylesheet }] }
        : null),
    };

    const viewerOptions = {
      fontSize,
      pageViewMode,
      zoom,
      renderAllPages,
      autoResize,
      defaultPaperSize,
      pageBorderWidth: 1,
      fitToScreen: false,
    };

    if (isPublication) {
      instance.loadPublication(source, documentOptions, viewerOptions);
    } else {
      instance.loadDocument(
        { url: source, startPage: page },
        documentOptions,
        viewerOptions,
      );
    }
  }

  function registerEventHandlers() {
    function handleMessage(payload: Payload, type: MessageType) {
      onMessage && onMessage(payload.content, type);
    }

    const handleDebug = (payload: Payload) => handleMessage(payload, "debug");
    const handleInfo = (payload: Payload) => handleMessage(payload, "info");
    const handleWarn = (payload: Payload) => handleMessage(payload, "warn");

    function handleError(payload: Payload) {
      onError && onError(payload.content);
    }

    function handleReadyStateChange() {
      const { readyState } = instanceRef.current!;
      onReadyStateChange && onReadyStateChange(readyState);
    }

    function handleLoaded() {
      onLoad && onLoad(stateRef.current!);
    }

    function handleNavigation(payload: NavigationPayload) {
      const { docTitle, epageCount, epage, metadata } = payload;
      const currentState = {
        docTitle,
        epageCount,
        epage: epage as number,
        metadata,
      };
      stateRef.current = currentState;
      onNavigation && onNavigation(currentState);
    }

    function handleHyperlink(payload: HyperlinkPayload) {
      onHyperlink && onHyperlink(payload);
    }

    const instance = instanceRef.current!;
    instance.addListener("debug", handleDebug);
    instance.addListener("info", handleInfo);
    instance.addListener("warn", handleWarn);
    instance.addListener("error", handleError);
    instance.addListener("readystatechange", handleReadyStateChange);
    instance.addListener("loaded", handleLoaded);
    instance.addListener("nav", handleNavigation);
    instance.addListener("hyperlink", handleHyperlink);

    return () => {
      onReadyStateChange && onReadyStateChange(ReadyState.LOADING);
      instance.removeListener("debug", handleDebug);
      instance.removeListener("info", handleInfo);
      instance.removeListener("warn", handleWarn);
      instance.removeListener("error", handleError);
      instance.removeListener("readystatechange", handleReadyStateChange);
      instance.removeListener("loaded", handleLoaded);
      instance.removeListener("nav", handleNavigation);
      instance.removeListener("hyperlink", handleHyperlink);
      containerRef.current!.innerHTML = "";
    };
  }

  function initInstance() {
    instanceRef.current = new CoreViewer({
      viewportElement: containerRef.current!,
    });
  }

  // initialize document and event handlers
  useEffect(() => {
    initInstance();
    loadSource();

    const cleanup = registerEventHandlers();
    return cleanup;
  }, [source]);

  // sync location
  useEffect(() => {
    const epage = epageFromPageNumber(page);
    instanceRef.current?.navigateToPage(Navigation.EPAGE, epage);
  }, [page]);

  const container = (
    <Container ref={containerRef} style={style} background={background} />
  );

  if (typeof children === "function" && children instanceof Function) {
    return children({ container, reload: loadSource });
  }

  return container;
};

const Container = styled.div<RendererTheme>`
  position: relative;
  display: flex;
  overflow: auto;
  background: ${({ background }) => background};

  @media screen {
    [data-vivliostyle-page-container] {
      background: white;
    }

    [data-vivliostyle-viewer-viewport] {
      /* background: #ececec; */
      display: flex;
      overflow: auto;
      position: relative;
    }

    [data-vivliostyle-outer-zoom-box] {
      margin: auto;
      overflow: hidden;
      flex: none;
    }

    [data-vivliostyle-viewer-viewport] [data-vivliostyle-spread-container] {
      display: flex;
      flex: none;
      justify-content: center;
      transform-origin: left top;
    }

    [data-vivliostyle-viewer-viewport][data-vivliostyle-page-progression="ltr"]
      [data-vivliostyle-spread-container] {
      flex-direction: row;
    }

    [data-vivliostyle-viewer-viewport][data-vivliostyle-page-progression="rtl"]
      [data-vivliostyle-spread-container] {
      flex-direction: row-reverse;
    }

    [data-vivliostyle-viewer-viewport] [data-vivliostyle-page-container] {
      margin: 0 auto;
      flex: none;
      transform-origin: center top;
    }

    [data-vivliostyle-viewer-viewport][data-vivliostyle-spread-view="true"]
      [data-vivliostyle-page-container][data-vivliostyle-page-side="left"] {
      margin-right: 1px;
      transform-origin: right top;
    }

    [data-vivliostyle-viewer-viewport][data-vivliostyle-spread-view="true"]
      [data-vivliostyle-page-container][data-vivliostyle-page-side="right"] {
      margin-left: 1px;
      transform-origin: left top;
    }

    [data-vivliostyle-viewer-viewport][data-vivliostyle-spread-view="true"]
      [data-vivliostyle-page-container][data-vivliostyle-unpaired-page="true"] {
      margin-left: auto;
      margin-right: auto;
      transform-origin: center top;
    }
  }
`;
