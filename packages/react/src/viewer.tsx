import React, { useState } from "react";
import { ReadyState } from "@vivliostyle/core";
import { Spinner } from "@chakra-ui/core";
import styled from "@emotion/styled";
import { ThemeProvider } from "@chakra-ui/core";
import { theme } from "@chakra-ui/core";

import { Renderer } from "./renderer";

interface VivliostyleViewerProps {
  source: string;
}

export const VivliostyleViewer: React.FC<VivliostyleViewerProps> = ({
  source,
}) => {
  const [loading, setLoading] = useState(true);

  function handleStateChange(state: ReadyState) {
    console.log(state);

    if (state === ReadyState.COMPLETE) {
      setLoading(false);
    } else {
      setLoading(true);
    }
  }

  return (
    <ThemeProvider theme={theme}>
      <Container>
        <Renderer entrypoint={source} onReadyStateChange={handleStateChange} />
        {loading && (
          <OverflowView>
            <Spinner />
          </OverflowView>
        )}
      </Container>
    </ThemeProvider>
  );
};

const Container = styled.div`
  position: relative;
  width: fit-content;
`;

const OverflowView = styled.div`
  position: absolute;
  top: 0%;
  width: 100%;
  height: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
  /* background: #2d2d2d; */
`;
