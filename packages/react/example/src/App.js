import React from "react";

import { Renderer } from "@vivliostyle/react";
import "@vivliostyle/react/dist/index.css";

const App = () => {
  return (
    <Renderer entrypoint="https://vivliostyle.github.io/vivliostyle_doc/samples/gon/index.html" />
  );
};

export default App;
