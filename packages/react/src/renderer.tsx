import React, { useRef, useEffect } from "react";
import styled from "@emotion/styled";
import { CoreViewer, Payload, ReadyState } from "@vivliostyle/core";

type MessageType = "debug" | "info" | "warn";

interface RendererProps {
  entrypoint: string;
  onLoad?: () => void;
  onMessage?: (message: string, type: MessageType) => void;
  onError?: (error: string) => void;
  onReadyStateChange?: (state: ReadyState) => void;
}

export const Renderer: React.FC<RendererProps> = ({
  entrypoint,
  onLoad,
  onMessage,
  onError,
  onReadyStateChange,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const instanceRef = useRef<CoreViewer>();

  useEffect(() => {
    instanceRef.current = new CoreViewer({
      viewportElement: containerRef.current!,
    });
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
      onLoad && onLoad();
    }

    instance.addListener("debug", handleDebug);
    instance.addListener("info", handleInfo);
    instance.addListener("warn", handleWarn);
    instance.addListener("error", handleError);
    instance.addListener("readystatechange", handleReadyStateChange);
    instance.addListener("loaded", handleLoaded);

    instance.loadDocument(entrypoint, undefined, {});

    return () => {
      onReadyStateChange && onReadyStateChange(ReadyState.LOADING);
      instance.removeListener("debug", handleDebug);
      instance.removeListener("info", handleInfo);
      instance.removeListener("warn", handleWarn);
      instance.removeListener("error", handleError);
      instance.removeListener("readystatechange", handleReadyStateChange);
      instance.removeListener("loaded", handleLoaded);
      containerRef.current!.innerHTML = "";
    };
  }, [entrypoint]);
  return <Container ref={containerRef} />;
};

const Container = styled.div`
  position: relative;
`;
