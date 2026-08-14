import * as XLSX from "xlsx";

import type { Product, ProductDraft } from "@/lib/pos-types";

export type ImportIssue = { rowNumber: number; message: string };
export type ProductImportPreview = {
  rows: ProductDraft[];
  issues: ImportIssue[];
  fileName: string;
};

type SpreadsheetRow = Record<string, unknown>;

const HEADER_ALIASES: Record<keyof ProductDraft, string[]> = {
  name: ["tên sản phẩm", "tên", "ten san pham", "ten", "name"],
  price: ["giá bán", "gia ban", "giaban", "price", "giá"],
  costPrice: ["giá vốn", "gia von", "giavon", "costprice", "cost"],
  unit: ["đơn vị", "don vi", "donvi", "unit"],
  category: ["nhóm hàng", "nhom hang", "nhomhang", "category", "nhóm"],
  barcode: ["mã vạch", "ma vach", "mavach", "barcode", "mã"],
  imageUri: ["ảnh", "anh", "image", "imageuri"],
  stockQuantity: ["tồn", "ton", "tồn kho", "ton kho", "stock", "stockquantity"],
  lowStockThreshold: ["ngưỡng cảnh báo", "nguong canh bao", "ngưỡng", "nguong", "lowstockthreshold"],
  units: ["đơn vị quy đổi", "don vi quy doi", "units"],
};

function normalizeHeader(value: unknown) {
  return String(value ?? "").trim().toLocaleLowerCase("vi-VN").normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[_\-]/g, " ").replace(/\s+/g, " ");
}

function numeric(value: unknown, fallback = 0) {
  if (typeof value === "number") return Number.isFinite(value) ? value : fallback;
  const cleaned = String(value ?? "").replace(/[.\s]/g, "").replace(/,/g, ".").replace(/[^0-9.-]/g, "");
  const parsed = Number(cleaned);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function getValue(row: SpreadsheetRow, field: keyof ProductDraft) {
  const aliases = HEADER_ALIASES[field];
  const entry = Object.entries(row).find(([header]) => aliases.includes(normalizeHeader(header)));
  return entry?.[1];
}

function cleanText(value: unknown) {
  return String(value ?? "").trim();
}

export function previewProductImport(rows: SpreadsheetRow[], fileName: string): ProductImportPreview {
  const validRows: ProductDraft[] = [];
  const issues: ImportIssue[] = [];
  const seenBarcodes = new Set<string>();

  rows.forEach((row, index) => {
    const rowNumber = index + 2;
    const name = cleanText(getValue(row, "name"));
    const price = numeric(getValue(row, "price"));
    const barcode = cleanText(getValue(row, "barcode"));
    if (!name) {
      issues.push({ rowNumber, message: "Thiếu tên sản phẩm." });
      return;
    }
    if (price <= 0) {
      issues.push({ rowNumber, message: "Giá bán phải lớn hơn 0." });
      return;
    }
    if (barcode && seenBarcodes.has(barcode)) {
      issues.push({ rowNumber, message: `Mã vạch ${barcode} bị lặp trong tệp.` });
      return;
    }
    if (barcode) seenBarcodes.add(barcode);
    const costPrice = numeric(getValue(row, "costPrice"));
    validRows.push({
      name,
      price: Math.round(price),
      costPrice: costPrice > 0 ? Math.round(costPrice) : undefined,
      unit: cleanText(getValue(row, "unit")) || "cái",
      category: cleanText(getValue(row, "category")) || "Khác",
      barcode: barcode || undefined,
      imageUri: cleanText(getValue(row, "imageUri")) || undefined,
      stockQuantity: Math.max(0, Math.round(numeric(getValue(row, "stockQuantity")))),
      lowStockThreshold: Math.max(0, Math.round(numeric(getValue(row, "lowStockThreshold"), 3))),
      units: undefined,
    });
  });

  return { rows: validRows, issues, fileName };
}

export function readProductSpreadsheet(buffer: ArrayBuffer, fileName: string): ProductImportPreview {
  const workbook = XLSX.read(buffer, { type: "array", cellDates: false });
  const firstSheetName = workbook.SheetNames[0];
  if (!firstSheetName) return { rows: [], issues: [{ rowNumber: 0, message: "Tệp không có trang dữ liệu." }], fileName };
  const rows = XLSX.utils.sheet_to_json<SpreadsheetRow>(workbook.Sheets[firstSheetName], { defval: "", raw: false });
  if (!rows.length) return { rows: [], issues: [{ rowNumber: 0, message: "Không tìm thấy dòng dữ liệu trong tệp." }], fileName };
  return previewProductImport(rows, fileName);
}

export function importProductsIntoCatalog(products: Product[], drafts: ProductDraft[]) {
  const timestamp = new Date().toISOString();
  const existingByBarcode = new Map(products.filter((product) => product.barcode).map((product) => [product.barcode!, product]));
  let added = 0;
  let updated = 0;
  const nextProducts = [...products];
  drafts.forEach((draft, index) => {
    const existing = draft.barcode ? existingByBarcode.get(draft.barcode) : undefined;
    if (existing) {
      const position = nextProducts.findIndex((product) => product.id === existing.id);
      nextProducts[position] = { ...existing, ...draft, imageUri: draft.imageUri || existing.imageUri, updatedAt: timestamp };
      updated += 1;
      return;
    }
    nextProducts.unshift({ ...draft, id: `p-import-${Date.now()}-${index}`, createdAt: timestamp, updatedAt: timestamp });
    added += 1;
  });
  return { products: nextProducts, added, updated };
}
