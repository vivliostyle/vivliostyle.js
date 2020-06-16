export function epageToPageNumber(epage: number): number {
  return Math.round(epage + 1);
}

export function epageFromPageNumber(pageNumber: number): number {
  return pageNumber - 1;
}
