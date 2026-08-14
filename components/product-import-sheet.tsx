import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import * as DocumentPicker from "expo-document-picker";
import { File } from "expo-file-system";
import { useState } from "react";
import { ActivityIndicator, Alert, Modal, Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";

import { readProductSpreadsheet, type ProductImportPreview } from "@/lib/product-import";
import type { ProductDraft } from "@/lib/pos-types";

type Props = { visible: boolean; onClose: () => void; onImport: (rows: ProductDraft[]) => { added: number; updated: number } };

export function ProductImportSheet({ visible, onClose, onImport }: Props) {
  const [preview, setPreview] = useState<ProductImportPreview | null>(null);
  const [reading, setReading] = useState(false);

  function close() { setPreview(null); onClose(); }

  async function chooseFile() {
    try {
      setReading(true);
      const result = await DocumentPicker.getDocumentAsync({ type: ["application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", "application/vnd.ms-excel", "text/csv", "application/octet-stream"], copyToCacheDirectory: true, base64: Platform.OS === "web" });
      if (result.canceled) return;
      const asset = result.assets[0];
      let buffer: ArrayBuffer;
      if (Platform.OS === "web" && asset.file) buffer = await asset.file.arrayBuffer();
      else buffer = await new File(asset.uri).arrayBuffer();
      setPreview(readProductSpreadsheet(buffer, asset.name));
    } catch (error) {
      Alert.alert("Không thể đọc tệp", error instanceof Error ? error.message : "Hãy chọn tệp Excel hoặc CSV hợp lệ.");
    } finally {
      setReading(false);
    }
  }

  function commitImport() {
    if (!preview?.rows.length) return;
    const result = onImport(preview.rows);
    Alert.alert("Đã nhập danh sách", `Thêm mới ${result.added} sản phẩm${result.updated ? `, cập nhật ${result.updated} sản phẩm trùng mã vạch` : ""}.`);
    close();
  }

  return <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={close}><View style={styles.container}><View style={styles.header}><TouchableOpacity onPress={close} style={styles.close}><MaterialIcons name="close" size={24} color="#1D2A23" /></TouchableOpacity><Text style={styles.title}>Nhập sản phẩm từ Excel</Text><View style={styles.close} /></View><ScrollView contentContainerStyle={styles.content}><View style={styles.guide}><View style={styles.guideIcon}><MaterialIcons name="table-view" size={27} color="#1F7A4A" /></View><Text style={styles.guideTitle}>Nhập nhiều mặt hàng cùng lúc</Text><Text style={styles.guideText}>Tệp Excel (.xlsx, .xls) hoặc CSV cần có cột: Tên sản phẩm, Giá bán, Đơn vị, Nhóm hàng, Mã vạch, Tồn kho và Ngưỡng cảnh báo. Chỉ Tên sản phẩm và Giá bán là bắt buộc.</Text></View><View style={styles.example}><Text style={styles.exampleTitle}>Ví dụ hàng tiêu đề</Text><Text style={styles.exampleText}>Tên sản phẩm | Giá bán | Đơn vị | Nhóm hàng | Mã vạch | Tồn kho | Ngưỡng cảnh báo</Text></View><TouchableOpacity onPress={chooseFile} disabled={reading} style={styles.chooseButton}>{reading ? <ActivityIndicator color="#FFFFFF" /> : <MaterialIcons name="upload-file" size={23} color="#FFFFFF" />}<Text style={styles.chooseText}>{reading ? "Đang đọc tệp…" : "Chọn tệp Excel hoặc CSV"}</Text></TouchableOpacity>{preview ? <View style={styles.preview}><Text style={styles.fileName} numberOfLines={1}>{preview.fileName}</Text><View style={styles.summary}><View style={styles.summaryBox}><Text style={styles.summaryNumber}>{preview.rows.length}</Text><Text style={styles.summaryLabel}>hợp lệ</Text></View><View style={[styles.summaryBox, styles.warningBox]}><Text style={[styles.summaryNumber, styles.warningNumber]}>{preview.issues.length}</Text><Text style={styles.summaryLabel}>cần xem lại</Text></View></View>{preview.rows.slice(0, 5).map((row, index) => <View key={`${row.name}-${index}`} style={styles.row}><View style={styles.rowIndex}><Text style={styles.rowIndexText}>{index + 1}</Text></View><View style={styles.rowInfo}><Text style={styles.rowName}>{row.name}</Text><Text style={styles.rowMeta}>{row.price.toLocaleString("vi-VN")}đ · {row.stockQuantity} {row.unit}</Text></View></View>)}{preview.rows.length > 5 ? <Text style={styles.moreRows}>Và {preview.rows.length - 5} sản phẩm hợp lệ khác.</Text> : null}{preview.issues.map((issue, index) => <View key={`${issue.rowNumber}-${index}`} style={styles.issue}><MaterialIcons name="error-outline" size={18} color="#B5443E" /><Text style={styles.issueText}>{issue.rowNumber ? `Dòng ${issue.rowNumber}: ` : ""}{issue.message}</Text></View>)}{preview.rows.length ? <TouchableOpacity onPress={commitImport} style={styles.importButton}><MaterialIcons name="inventory-2" size={21} color="#FFFFFF" /><Text style={styles.importText}>Nhập {preview.rows.length} sản phẩm hợp lệ</Text></TouchableOpacity> : null}</View> : null}</ScrollView></View></Modal>;
}

const styles = StyleSheet.create({ container: { flex: 1, backgroundColor: "#F7F7F2" }, header: { minHeight: 64, paddingHorizontal: 16, backgroundColor: "#FFFFFF", borderBottomWidth: 1, borderBottomColor: "#DFE5DF", flexDirection: "row", alignItems: "center", justifyContent: "space-between" }, close: { width: 40, height: 40, alignItems: "center", justifyContent: "center" }, title: { color: "#1D2A23", fontSize: 17, fontWeight: "900" }, content: { padding: 20, paddingBottom: 40, alignSelf: "center", width: "100%", maxWidth: 720, gap: 14 }, guide: { padding: 18, borderRadius: 18, backgroundColor: "#E9F3EA", alignItems: "center", gap: 7 }, guideIcon: { width: 54, height: 54, borderRadius: 17, backgroundColor: "#FFFFFF", alignItems: "center", justifyContent: "center" }, guideTitle: { color: "#1D2A23", fontSize: 18, fontWeight: "900" }, guideText: { color: "#476650", fontSize: 13, lineHeight: 19, textAlign: "center" }, example: { padding: 14, borderRadius: 14, backgroundColor: "#FFFFFF", borderWidth: 1, borderColor: "#DFE5DF", gap: 5 }, exampleTitle: { color: "#1D2A23", fontSize: 13, fontWeight: "900" }, exampleText: { color: "#526158", fontSize: 12, lineHeight: 18 }, chooseButton: { minHeight: 54, borderRadius: 14, backgroundColor: "#1F7A4A", flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8 }, chooseText: { color: "#FFFFFF", fontSize: 16, fontWeight: "900" }, preview: { padding: 14, borderRadius: 18, backgroundColor: "#FFFFFF", borderWidth: 1, borderColor: "#C8DCCB", gap: 10 }, fileName: { color: "#1D2A23", fontSize: 15, fontWeight: "900" }, summary: { flexDirection: "row", gap: 10 }, summaryBox: { flex: 1, padding: 11, borderRadius: 12, backgroundColor: "#E9F3EA", alignItems: "center" }, warningBox: { backgroundColor: "#FFF0CC" }, summaryNumber: { color: "#1F7A4A", fontSize: 22, fontWeight: "900" }, warningNumber: { color: "#A45C0A" }, summaryLabel: { color: "#526158", fontSize: 12, fontWeight: "700" }, row: { paddingVertical: 9, borderBottomWidth: 1, borderBottomColor: "#EDF0ED", flexDirection: "row", gap: 10, alignItems: "center" }, rowIndex: { width: 25, height: 25, borderRadius: 8, backgroundColor: "#E7F1E8", alignItems: "center", justifyContent: "center" }, rowIndexText: { color: "#1F7A4A", fontSize: 12, fontWeight: "900" }, rowInfo: { flex: 1, gap: 2 }, rowName: { color: "#1D2A23", fontSize: 14, fontWeight: "800" }, rowMeta: { color: "#6E7B71", fontSize: 12 }, moreRows: { color: "#6E7B71", fontSize: 12, fontStyle: "italic" }, issue: { padding: 10, borderRadius: 10, backgroundColor: "#FFF2F1", flexDirection: "row", gap: 7, alignItems: "flex-start" }, issueText: { flex: 1, color: "#B5443E", fontSize: 12, lineHeight: 17, fontWeight: "700" }, importButton: { minHeight: 52, marginTop: 4, borderRadius: 14, backgroundColor: "#1F7A4A", flexDirection: "row", justifyContent: "center", alignItems: "center", gap: 8 }, importText: { color: "#FFFFFF", fontSize: 15, fontWeight: "900" } });
