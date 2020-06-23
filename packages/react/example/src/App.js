import React, { useState } from "react";
import { Renderer } from "@vivliostyle/react";
// import "@vivliostyle/react/dist/react-vivliostyle.css";

const App = () => {
  const [totalPage, setTotalPage] = useState(1);
  const [page, setPage] = useState(1);
  const [source, setSource] = useState(
    // "https://vivliostyle.github.io/vivliostyle_doc/samples/gon/index.html",
    "http://localhost:5000/manifest.json",
  );

  function change(url) {
    setPage(1);
    setSource(url);
  }

  function handleLoad(e) {
    console.log("LOADED", e);
  }

  function next() {
    setPage((page) => page + 1);
  }

  function handleNavigation(e) {
    setTotalPage(e.epageCount);
  }

  return (
    <Renderer
      source={source}
      page={page}
      theme={{ background: "red" }}
      onLoad={handleLoad}
      onNavigation={handleNavigation}>
      {({ container, reload }) => (
        <>
          <div>
            Page: {page}/{totalPage}
          </div>
          <button onClick={next}>Next</button>
          <button
            onClick={() =>
              change(
                "https://vivliostyle.github.io/vivliostyle_doc/samples/gon/index.html",
              )
            }>
            Gon
          </button>
          <button
            onClick={() =>
              change(
                "https://vivliostyle.github.io/vivliostyle_doc/samples/gutenberg/Alice.html",
              )
            }>
            Alice
          </button>
          {container}
        </>
      )}
    </Renderer>
  );
};

export default App;
