import { Platform } from "react-native";
import * as FileSystem from "expo-file-system/legacy";
import * as Sharing from "expo-sharing";

import { ordersToCsv } from "@/lib/csv-export";
import type { Order } from "@/lib/pos-types";

export { ordersToCsv } from "@/lib/csv-export";

function makeFileName() {
  const today = new Date();
  const stamp = `${today.getFullYear()}${String(today.getMonth() + 1).padStart(2, "0")}${String(today.getDate()).padStart(2, "0")}`;
  return `tap-hoa-pos-hoa-don-${stamp}.csv`;
}

export async function exportOrdersToCsv(orders: Order[]) {
  const content = `\ufeff${ordersToCsv(orders)}`;
  const filename = makeFileName();

  if (Platform.OS === "web") {
    const blob = new Blob([content], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = filename;
    anchor.style.display = "none";
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    setTimeout(() => URL.revokeObjectURL(url), 0);
    return { filename, method: "download" as const };
  }

  const fileUri = `${FileSystem.cacheDirectory}${filename}`;
  await FileSystem.writeAsStringAsync(fileUri, content, { encoding: FileSystem.EncodingType.UTF8 });
  if (await Sharing.isAvailableAsync()) {
    await Sharing.shareAsync(fileUri, { mimeType: "text/csv", dialogTitle: "Xuất lịch sử hóa đơn" });
    return { filename, method: "share" as const };
  }
  return { filename, method: "saved" as const };
}
