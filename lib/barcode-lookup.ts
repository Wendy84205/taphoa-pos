export type BarcodeCatalogItem = { id: string; barcode?: string };

/** Removes scanner/manual whitespace without altering meaningful Code128 characters. */
export function normalizeBarcode(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const normalized = value.replace(/\s+/g, "").trim();
  return normalized || null;
}

export function findByBarcode<T extends BarcodeCatalogItem>(items: T[], scannedValue: unknown): T | undefined {
  const barcode = normalizeBarcode(scannedValue);
  return barcode ? items.find((item) => normalizeBarcode(item.barcode) === barcode) : undefined;
}

export function shouldAcceptBarcodeScan(alreadyScanned: boolean, scannedValue: unknown): boolean {
  return !alreadyScanned && Boolean(normalizeBarcode(scannedValue));
}
