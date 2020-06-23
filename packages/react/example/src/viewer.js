import React, { useState } from "react";
import styled from "@emotion/styled";
import { ReadyState } from "@vivliostyle/core";

import { Renderer } from "../../src/renderer";

export const VivliostyleViewer = ({ source }) => {
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [lastNav, setLastNav] = useState();

  function handleStateChange(state) {
    console.log(state);

    if (state === ReadyState.COMPLETE) {
      setLoading(false);
    } else {
      setLoading(true);
    }
  }

  function handleNavigation(payload) {
    setLastNav(payload);
  }

  function nextPage() {
    if (!lastNav?.epageCount) return;
    if (page >= lastNav.epageCount) return;
    console.log(page, lastNav.epageCount);
    setPage((page) => page + 1);
  }

  function prevPage() {
    setPage((page) => Math.max(1, page - 1));
  }

  return (
    <div>
      <CSSReset />
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
        {loading && <OverflowView>Loading</OverflowView>}
      </Container>
    </div>
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
