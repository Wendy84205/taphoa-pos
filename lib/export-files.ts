import * as FileSystem from "expo-file-system/legacy";
import * as Print from "expo-print";
import * as Sharing from "expo-sharing";
import { Platform } from "react-native";
import * as XLSX from "xlsx";

import type { Order, Product } from "@/lib/pos-types";

type ExportRow = Record<string, string | number | null | undefined>;

function escapeHtml(value: unknown) {
  return String(value ?? "").replace(/[&<>\"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '\"': "&quot;", "'": "&#39;" })[char] ?? char);
}

function downloadWeb(filename: string, data: Blob, mimeType: string) {
  if (Platform.OS !== "web" || typeof document === "undefined") return false;
  const url = URL.createObjectURL(data);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  return true;
}

export async function exportRowsToExcel(filename: string, rows: ExportRow[]) {
  const worksheet = XLSX.utils.json_to_sheet(rows.length ? rows : [{ "Thông báo": "Chưa có dữ liệu" }]);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Du lieu");
  const base64 = XLSX.write(workbook, { bookType: "xlsx", type: "base64" });
  if (Platform.OS === "web") {
    const binary = Uint8Array.from(atob(base64), (char) => char.charCodeAt(0));
    downloadWeb(filename, new Blob([binary], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" }), "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
    return;
  }
  const uri = `${FileSystem.cacheDirectory}${filename}`;
  await FileSystem.writeAsStringAsync(uri, base64, { encoding: FileSystem.EncodingType.Base64 });
  if (await Sharing.isAvailableAsync()) await Sharing.shareAsync(uri, { mimeType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", dialogTitle: "Chia sẻ file Excel" });
}

export async function exportJsonBackup(filename: string, payload: unknown) {
  const content = JSON.stringify({ format: "taphoa-pos-backup", version: 1, exportedAt: new Date().toISOString(), payload }, null, 2);
  if (Platform.OS === "web") {
    downloadWeb(filename, new Blob([content], { type: "application/json" }), "application/json");
    return;
  }
  const uri = `${FileSystem.documentDirectory}${filename}`;
  await FileSystem.writeAsStringAsync(uri, content, { encoding: FileSystem.EncodingType.UTF8 });
  if (await Sharing.isAvailableAsync()) await Sharing.shareAsync(uri, { mimeType: "application/json", dialogTitle: "Chia sẻ bản sao lưu" });
}

export async function readJsonBackup(uri: string) {
  const content = await FileSystem.readAsStringAsync(uri, { encoding: FileSystem.EncodingType.UTF8 });
  const parsed = JSON.parse(content) as { format?: string; version?: number; payload?: unknown };
  if (parsed.format !== "taphoa-pos-backup" || !parsed.payload) throw new Error("Tệp backup không đúng định dạng Tạp Hóa POS.");
  return parsed.payload;
}

function printWebHtml(html: string) {
  if (typeof window === "undefined") return false;
  const printWindow = window.open("", "_blank", "width=720,height=900");
  if (!printWindow) return false;
  printWindow.document.write(html);
  printWindow.document.close();
  printWindow.focus();
  printWindow.print();
  return true;
}

export async function printOrderReceipt(order: Order, storeName = "Tạp Hóa POS") {
  const rows = order.items.map((item) => `<tr><td>${escapeHtml(item.name)}<br/><small>${item.quantity} ${escapeHtml(item.unit)} × ${item.priceAtSale.toLocaleString("vi-VN")}đ</small></td><td>${(item.quantity * item.priceAtSale).toLocaleString("vi-VN")}đ</td></tr>`).join("");
  const html = `<!doctype html><html><head><meta charset="utf-8"><style>@page{size:80mm auto;margin:5mm}body{font-family:Arial,sans-serif;width:72mm;color:#17251d;font-size:12px}h1{text-align:center;font-size:18px;margin:0 0 4px}p{text-align:center;margin:3px 0;color:#536358;font-size:10px}table{width:100%;border-collapse:collapse;margin-top:10px}td{padding:5px 0;border-bottom:1px dashed #ccd6cd}td:last-child{text-align:right;font-weight:700}small{color:#68776d}.total{display:flex;justify-content:space-between;font-size:16px;font-weight:800;padding-top:10px}</style></head><body><h1>${escapeHtml(storeName)}</h1><p>Hóa đơn ${escapeHtml(order.id)}</p><p>${escapeHtml(new Date(order.createdAt).toLocaleString("vi-VN"))}</p><table>${rows}</table><div class="total"><span>Tổng</span><span>${order.totalAmount.toLocaleString("vi-VN")}đ</span></div><p>Cảm ơn quý khách!</p></body></html>`;
  if (Platform.OS === "web") { if (!printWebHtml(html)) throw new Error("Trình duyệt đã chặn cửa sổ in."); return; }
  await Print.printAsync({ html, width: 302, margins: { top: 12, bottom: 12, left: 12, right: 12 } });
}

export async function printPriceLabels(products: Product[]) {
  const rows = products.map((product) => `<div class="label"><strong>${escapeHtml(product.name)}</strong><span>${product.price.toLocaleString("vi-VN")}đ / ${escapeHtml(product.unit)}</span>${product.barcode ? `<small>${escapeHtml(product.barcode)}</small>` : ""}</div>`).join("");
  const html = `<!doctype html><html><head><meta charset="utf-8"><style>@page{margin:8mm}body{font-family:Arial,sans-serif;display:grid;grid-template-columns:repeat(3,1fr);gap:6mm}.label{border:1px dashed #59665d;padding:7mm 4mm;text-align:center;display:grid;gap:3mm;break-inside:avoid}.label strong{font-size:13px}.label span{font-size:18px;font-weight:800}.label small{font-size:10px;color:#68776d}</style></head><body>${rows || "<p>Chưa có sản phẩm</p>"}</body></html>`;
  if (Platform.OS === "web") { if (!printWebHtml(html)) throw new Error("Trình duyệt đã chặn cửa sổ in."); return; }
  await Print.printAsync({ html, margins: { top: 16, bottom: 16, left: 16, right: 16 } });
}

export async function exportRowsToPdf(filename: string, title: string, rows: ExportRow[]) {
  const columns = rows.length ? Object.keys(rows[0]) : ["Thông báo"];
  const data = rows.length ? rows : [{ "Thông báo": "Chưa có dữ liệu" }];
  const html = `<!doctype html><html><head><meta charset="utf-8"/><style>@page{margin:22px}body{font-family:Arial,sans-serif;color:#173B2A}h1{font-size:22px}p{color:#66736a;font-size:12px}table{border-collapse:collapse;width:100%;font-size:11px}th{background:#173B2A;color:#fff;text-align:left}th,td{padding:8px;border:1px solid #dbe5dc}tr:nth-child(even){background:#f3f7f3}</style></head><body><h1>${escapeHtml(title)}</h1><p>Tạp Hóa POS · Xuất lúc ${escapeHtml(new Date().toLocaleString("vi-VN"))}</p><table><thead><tr>${columns.map((column) => `<th>${escapeHtml(column)}</th>`).join("")}</tr></thead><tbody>${data.map((row) => `<tr>${columns.map((column) => `<td>${escapeHtml(row[column])}</td>`).join("")}</tr>`).join("")}</tbody></table></body></html>`;
  if (Platform.OS === "web") {
    const printWindow = window.open("", "_blank", "noopener,noreferrer");
    if (!printWindow) throw new Error("Trình duyệt đã chặn cửa sổ in PDF.");
    printWindow.document.write(html);
    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
    return;
  }
  const { uri } = await Print.printToFileAsync({ html });
  if (await Sharing.isAvailableAsync()) await Sharing.shareAsync(uri, { UTI: ".pdf", mimeType: "application/pdf", dialogTitle: `Chia sẻ ${filename}` });
}
