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
import "@vivliostyle/react/dist/index.css";

function App() {
  const sample =
    "https://vivliostyle.github.io/vivliostyle_doc/samples/gon/index.html";

  return <Renderer entrypoint={sample} />;
}
```

## License

MIT © [uetchy](https://github.com/uetchy)
