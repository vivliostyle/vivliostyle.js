import React, { useState } from "react";
import { ReadyState } from "@vivliostyle/core";
import styled from "@emotion/styled";
import { ThemeProvider } from "@chakra-ui/core";
import { theme } from "@chakra-ui/core";
import { Spinner, Button, Flex } from "@chakra-ui/core";

import { Renderer, NavigationPayload } from "./renderer";

interface VivliostyleViewerProps {
  source: string;
}

export const VivliostyleViewer: React.FC<VivliostyleViewerProps> = ({
  source,
}) => {
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [lastNav, setLastNav] = useState<NavigationPayload>();

  function handleStateChange(state: ReadyState) {
    console.log(state);

    if (state === ReadyState.COMPLETE) {
      setLoading(false);
    } else {
      setLoading(true);
    }
  }

  function handleNavigation(payload: NavigationPayload) {
    setLastNav(payload);
  }

  function nextPage() {
    if (!lastNav?.epageCount) return;
    if (page + 1 >= lastNav.epageCount) return;
    console.log(page, lastNav.epageCount);
    setPage((page) => page + 1);
  }

  function prevPage() {
    setPage((page) => Math.max(0, page - 1));
  }

  return (
    <ThemeProvider theme={theme}>
      <Flex>
        <Button variantColor="green" onClick={prevPage}>
          Prev
        </Button>
        <Button variantColor="green" onClick={nextPage}>
          Next
        </Button>
      </Flex>
      <Container>
        <Renderer
          source={source}
          page={page}
          onReadyStateChange={handleStateChange}
          onNavigation={handleNavigation}
        />
        {loading && (
          <OverflowView>
            <Spinner
              thickness="4px"
              speed="0.65s"
              emptyColor="gray.200"
              color="blue.500"
              size="xl"
            />
          </OverflowView>
        )}
      </Container>
    </ThemeProvider>
  );
};

const Container = styled.div`
  position: relative;
  height: 100%;
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
