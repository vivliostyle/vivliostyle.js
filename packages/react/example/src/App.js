import React, { useState } from "react";
import { VivliostyleViewer } from "@vivliostyle/react";
// import "@vivliostyle/react/dist/index.css";

const App = () => {
  const [source, setSource] = useState(
    "https://vivliostyle.github.io/vivliostyle_doc/samples/gon/index.html",
  );

  function change(url) {
    setSource(url);
  }

  return (
    <>
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
      <VivliostyleViewer source={source} />
    </>
  );
};

export default App;
