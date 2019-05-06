interface Element {
  // `setAttribute` seems to allow non-string values.
  // https://github.com/Microsoft/TypeScript/issues/15368
  setAttribute(qualifiedName: string, value: number): void;
  setAttribute(qualifiedName: string, value: boolean): void;
}
