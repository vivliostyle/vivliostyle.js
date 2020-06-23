# Vivliostyle Viewer for React

[![NPM](https://img.shields.io/npm/v/@vivliostyle/react.svg)](https://www.npmjs.com/package/@vivliostyle/react)

## Install

```bash
yarn add @vivliostyle/react
```

## Usage

```tsx
import React from "react";

import { Renderer } from "@vivliostyle/react";

function App() {
  const [page, setPage] = React.useState(1);

  function next() {
    setPage((page) => page + 1);
  }

  function prev() {
    setPage((page) => page - 1);
  }

  function onLoad(state) {
    console.log(state.epageCount, state.docTitle);
  }

  const sample =
    "https://vivliostyle.github.io/vivliostyle_doc/samples/gon/index.html";

  return (
    <div>
      <Renderer source={sample} page={page} onLoad={onLoad} />
      <button onClick={next}>Next</button>
      <button onClick={prev}>Prev</button>
    </div>
  );
}
```

See [example/src/App.js](https://github.com/vivliostyle/vivliostyle.js/tree/master/packages/react/example/src/App.js).
