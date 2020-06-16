import React, { useRef, useEffect } from "react";
import styled from "@emotion/styled";
import {
  CoreViewer,
  Payload,
  ReadyState,
  CoreViewerOptions,
  Navigation,
} from "@vivliostyle/core";

import { epageFromPageNumber } from "./epage";

export type MessageType = "debug" | "info" | "warn";
export type NavigationPayload = Omit<Payload, "internal" | "href" | "content">;
export type HyperlinkPayload = Pick<Payload, "internal" | "href">;

interface RendererProps {
  source: string;
  page: number;
  style?: React.CSSProperties;
  options?: CoreViewerOptions;
  onMessage?: (message: string, type: MessageType) => void;
  onError?: (error: string) => void;
  onReadyStateChange?: (state: ReadyState) => void;
  onLoaded?: () => void;
  onNavigation?: (payload: NavigationPayload) => void;
  onHyperlink?: (payload: HyperlinkPayload) => void;
}

export const Renderer: React.FC<RendererProps> = ({
  source,
  page,
  style,
  options,
  onMessage,
  onError,
  onReadyStateChange,
  onLoaded,
  onNavigation,
  onHyperlink,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const instanceRef = useRef<CoreViewer>();

  useEffect(() => {
    instanceRef.current = new CoreViewer(
      {
        viewportElement: containerRef.current!,
      },
      options,
    );
    const instance = instanceRef.current!;

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
      onLoaded && onLoaded();
    }

    function handleNavigation(payload: NavigationPayload) {
      onNavigation && onNavigation(payload);
    }

    function handleHyperlink(payload: HyperlinkPayload) {
      onHyperlink && onHyperlink(payload);
    }

    instance.addListener("debug", handleDebug);
    instance.addListener("info", handleInfo);
    instance.addListener("warn", handleWarn);
    instance.addListener("error", handleError);
    instance.addListener("readystatechange", handleReadyStateChange);
    instance.addListener("loaded", handleLoaded);
    instance.addListener("nav", handleNavigation);
    instance.addListener("hyperlink", handleHyperlink);

    instance.loadDocument(source, undefined, {});

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
  }, [source]);

  useEffect(() => {
    const epage = epageFromPageNumber(page);
    instanceRef.current?.navigateToPage(Navigation.EPAGE, epage);
  }, [page]);

  return <Container ref={containerRef} style={style} />;
};

const Container = styled.div`
  position: relative;
  display: flex;
  overflow: auto;
  background: #aaaaaa;
`;
