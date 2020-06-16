import React, { useRef, useEffect } from "react";

import { CoreViewer, Payload } from "@vivliostyle/core";

type EventCallbackFn = (payload: Payload) => void;
interface RendererProps {
  entrypoint: string;
  onLoad?: EventCallbackFn;
  onError?: EventCallbackFn;
}

function addListener(
  ref: CoreViewer,
  event: string,
  fn: EventCallbackFn | undefined,
) {
  fn && ref.addListener(event, fn);
}

export const Renderer: React.FC<RendererProps> = ({
  entrypoint,
  onLoad,
  onError,
}) => {
  const coreRef = useRef<HTMLDivElement>(null);
  const viewer = useRef<CoreViewer>();

  useEffect(() => {
    viewer.current = new CoreViewer({
      viewportElement: coreRef.current!,
    });
    viewer.current.loadDocument(entrypoint, undefined, {});
    addListener(viewer.current, "loaded", onLoad);
    addListener(viewer.current, "error", onError);
  }, [entrypoint]);
  return <div ref={coreRef} />;
};
