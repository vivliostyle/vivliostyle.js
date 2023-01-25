import styled from "@emotion/styled";
import {
  CoreViewer,
  Navigation,
  PageViewMode,
  Payload,
  ReadyState,
} from "@vivliostyle/core";
import React, { useEffect, useRef } from "react";
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

interface RendererProps {
  source: string;
  page?: number;
  zoom?: number;
  bookMode?: boolean;
  renderAllPages?: boolean;
  autoResize?: boolean;
  pageViewMode?: PageViewMode;
  defaultPaperSize?: {
    width: number;
    height: number;
  };
  pageBorderWidth?: number;
  fitToScreen?: boolean;
  fontSize?: number;
  background?: string;
  userStyleSheet?: string;
  authorStyleSheet?: string;
  style?: React.CSSProperties;
  onMessage?: (message: string, type: MessageType) => void;
  onError?: (error: string) => void;
  onReadyStateChange?: (state: ReadyState) => void;
  onLoad?: (state: VolatileState) => void;
  onNavigation?: (state: VolatileState) => void;
  onHyperlink?: (payload: HyperlinkPayload) => void;
  children?: React.ReactNode | ChildrenFunction;
}

export const Renderer = ({
  source,
  page = 1,
  zoom = 1,
  bookMode = false,
  fontSize = 16,
  background = "#ececec",
  renderAllPages = true,
  autoResize = true,
  pageViewMode = PageViewMode.SINGLE_PAGE,
  defaultPaperSize,
  pageBorderWidth = 1,
  fitToScreen = false,
  userStyleSheet,
  authorStyleSheet,
  style,
  onMessage,
  onError,
  onReadyStateChange,
  onLoad,
  onNavigation,
  onHyperlink,
  children,
}: RendererProps): ReturnType<ChildrenFunction> | JSX.Element => {
  const containerRef = useRef<HTMLDivElement>(null);
  const instanceRef = useRef<CoreViewer>();
  const stateRef = React.useRef<VolatileState>();

  function setViewerOptions() {
    const viewerOptions = {
      fontSize,
      pageViewMode,
      renderAllPages,
      autoResize,
      defaultPaperSize,
      pageBorderWidth,
    };
    instanceRef.current!.setOptions(viewerOptions);
  }

  function loadSource() {
    const instance = instanceRef.current!;
    const documentOptions = {
      ...(userStyleSheet
        ? {
            userStyleSheet: [
              {
                [userStyleSheet.endsWith(".css") ? "url" : "text"]:
                  userStyleSheet,
              },
            ],
          }
        : null),
      ...(authorStyleSheet
        ? {
            authorStyleSheet: [
              {
                [authorStyleSheet.endsWith(".css") ? "url" : "text"]:
                  authorStyleSheet,
              },
            ],
          }
        : null),
    };

    if (bookMode) {
      instance.loadPublication(source, documentOptions);
    } else {
      instance.loadDocument({ url: source }, documentOptions, {
        fontSize,
        pageViewMode,
        zoom,
        renderAllPages,
        autoResize,
        defaultPaperSize,
        pageBorderWidth,
        fitToScreen,
      });
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
    setViewerOptions();

    const cleanup = registerEventHandlers();
    return cleanup;
  }, []);

  useEffect(() => {
    loadSource();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [source, authorStyleSheet, userStyleSheet, zoom, fitToScreen]);

  useEffect(() => {
    setViewerOptions();
  }, [
    fontSize,
    pageViewMode,
    renderAllPages,
    autoResize,
    defaultPaperSize,
    pageBorderWidth,
  ]);

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

const Container = styled.div<Pick<RendererProps, "background">>`
  overflow: scroll;
  background: ${({ background }) => background} !important;
`;
