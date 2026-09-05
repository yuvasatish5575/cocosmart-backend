const LOW_STOCK_THRESHOLD = 5;

export type StockLabel = "in-stock" | "low-stock" | "out-of-stock";

/** Derived, never stored — keeps stock status and stockQuantity from drifting apart. */
export function stockLabel(stockQuantity: number): StockLabel {
  if (stockQuantity <= 0) return "out-of-stock";
  if (stockQuantity <= LOW_STOCK_THRESHOLD) return "low-stock";
  return "in-stock";
}

export { LOW_STOCK_THRESHOLD };
