import * as FileSystem from "expo-file-system/legacy";
import * as Sharing from "expo-sharing";
import { Platform } from "react-native";
import * as XLSX from "xlsx";

const TEMPLATE_FILE_NAME = "mau-nhap-san-pham-tap-hoa-pos.xlsx";

export function createProductTemplateWorkbook() {
  const workbook = XLSX.utils.book_new();
  const sheet = XLSX.utils.json_to_sheet([
    { "Tên sản phẩm": "Nước suối 500ml", "Giá bán": 7000, "Giá vốn": 5000, "Đơn vị": "chai", "Nhóm hàng": "Nước giải khát", "Mã vạch": "893000000001", "Tồn kho": 24, "Ngưỡng cảnh báo": 6 },
    { "Tên sản phẩm": "Mì gói", "Giá bán": 4500, "Giá vốn": 3500, "Đơn vị": "gói", "Nhóm hàng": "Thực phẩm", "Mã vạch": "893000000002", "Tồn kho": 40, "Ngưỡng cảnh báo": 12 },
  ]);
  XLSX.utils.book_append_sheet(workbook, sheet, "Sản phẩm");
  return workbook;
}

export async function downloadProductTemplate() {
  const workbook = createProductTemplateWorkbook();
  if (Platform.OS === "web") {
    const bytes = XLSX.write(workbook, { type: "array", bookType: "xlsx" });
    const blob = new Blob([bytes], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = TEMPLATE_FILE_NAME;
    anchor.click();
    setTimeout(() => URL.revokeObjectURL(url), 0);
    return;
  }
  const base64 = XLSX.write(workbook, { type: "base64", bookType: "xlsx" });
  const uri = `${FileSystem.cacheDirectory}${TEMPLATE_FILE_NAME}`;
  await FileSystem.writeAsStringAsync(uri, base64, { encoding: FileSystem.EncodingType.Base64 });
  if (await Sharing.isAvailableAsync()) await Sharing.shareAsync(uri, { mimeType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", dialogTitle: "Tải file Excel mẫu" });
}
