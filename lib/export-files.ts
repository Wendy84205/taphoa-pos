import * as FileSystem from "expo-file-system/legacy";
import * as Print from "expo-print";
import * as Sharing from "expo-sharing";
import { Platform } from "react-native";
import * as XLSX from "xlsx";

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
