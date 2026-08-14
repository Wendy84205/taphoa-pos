import * as ImagePicker from "expo-image-picker";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { useEffect, useState } from "react";
import { Alert, Image, KeyboardAvoidingView, Modal, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";

import type { Product, ProductDraft } from "@/lib/pos-types";

type Props = {
  visible: boolean;
  product?: Product;
  presetBarcode?: string;
  onClose: () => void;
  onSave: (draft: ProductDraft) => void;
};

const blankDraft: ProductDraft = { name: "", price: 0, costPrice: undefined, unit: "cái", category: "Khác", barcode: "", imageUri: undefined, stockQuantity: 0, lowStockThreshold: 3 };

function toDraft(product?: Product, presetBarcode?: string): ProductDraft {
  if (!product) return { ...blankDraft, barcode: presetBarcode ?? "" };
  const { id, createdAt, updatedAt, ...draft } = product;
  return draft;
}

export function ProductEditorSheet({ visible, product, presetBarcode, onClose, onSave }: Props) {
  const [draft, setDraft] = useState<ProductDraft>(toDraft(product, presetBarcode));

  useEffect(() => {
    if (visible) setDraft(toDraft(product, presetBarcode));
  }, [visible, product, presetBarcode]);

  const setTextField = (field: "name" | "unit" | "category" | "barcode", value: string) => setDraft((current) => ({ ...current, [field]: value }));
  const setNumberField = (field: "price" | "costPrice" | "stockQuantity" | "lowStockThreshold", value: string) => {
    const number = Number(value.replace(/[^0-9]/g, ""));
    setDraft((current) => ({ ...current, [field]: Number.isFinite(number) ? number : 0 }));
  };

  async function chooseImage() {
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ["images"], allowsEditing: true, aspect: [1, 1], quality: 0.7, base64: Platform.OS === "web" });
    if (!result.canceled) setDraft((current) => ({ ...current, imageUri: result.assets[0].uri }));
  }

  async function takeImage() {
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) {
      Alert.alert("Cần quyền camera", "Hãy cho phép dùng camera để chụp ảnh sản phẩm.");
      return;
    }
    const result = await ImagePicker.launchCameraAsync({ allowsEditing: true, aspect: [1, 1], quality: 0.7, base64: Platform.OS === "web" });
    if (!result.canceled) setDraft((current) => ({ ...current, imageUri: result.assets[0].uri }));
  }

  function save() {
    if (!draft.name.trim()) {
      Alert.alert("Chưa có tên hàng", "Nhập tên sản phẩm để lưu.");
      return;
    }
    if (draft.price <= 0) {
      Alert.alert("Giá bán chưa hợp lệ", "Nhập giá bán lớn hơn 0 đồng.");
      return;
    }
    onSave({ ...draft, name: draft.name.trim(), barcode: draft.barcode?.trim() || undefined, costPrice: draft.costPrice || undefined });
    onClose();
  }

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.iconButton} accessibilityLabel="Đóng biểu mẫu"><MaterialIcons name="close" size={24} color="#1D2A23" /></TouchableOpacity>
          <Text style={styles.title}>{product ? "Sửa sản phẩm" : "Thêm sản phẩm"}</Text>
          <TouchableOpacity onPress={save} style={styles.saveButton}><Text style={styles.saveText}>Lưu</Text></TouchableOpacity>
        </View>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <View style={styles.imageRow}>
            {draft.imageUri ? <Image source={{ uri: draft.imageUri }} style={styles.image} /> : <View style={styles.imagePlaceholder}><MaterialIcons name="image" size={32} color="#6E7B71" /></View>}
            <View style={styles.imageActions}>
              <Text style={styles.label}>Ảnh nhận diện</Text>
              <Text style={styles.help}>Hữu ích cho hàng không có mã vạch.</Text>
              <View style={styles.row}>
                <TouchableOpacity onPress={chooseImage} style={styles.secondaryButton}><MaterialIcons name="photo-library" size={18} color="#1F7A4A" /><Text style={styles.secondaryText}>Chọn ảnh</Text></TouchableOpacity>
                <TouchableOpacity onPress={takeImage} style={styles.secondaryButton}><MaterialIcons name="photo-camera" size={18} color="#1F7A4A" /><Text style={styles.secondaryText}>Chụp</Text></TouchableOpacity>
              </View>
            </View>
          </View>
          <FormField label="Tên sản phẩm" value={draft.name} onChangeText={(value) => setTextField("name", value)} placeholder="Ví dụ: Dầu ăn 1 lít" autoFocus />
          <View style={styles.twoColumns}>
            <View style={styles.flex}><FormField label="Giá bán (đ)" value={draft.price ? String(draft.price) : ""} onChangeText={(value) => setNumberField("price", value)} placeholder="0" keyboardType="numeric" /></View>
            <View style={styles.flex}><FormField label="Giá vốn (tùy chọn)" value={draft.costPrice ? String(draft.costPrice) : ""} onChangeText={(value) => setNumberField("costPrice", value)} placeholder="0" keyboardType="numeric" /></View>
          </View>
          <View style={styles.twoColumns}>
            <View style={styles.flex}><FormField label="Đơn vị" value={draft.unit} onChangeText={(value) => setTextField("unit", value)} placeholder="cái, gói, kg" /></View>
            <View style={styles.flex}><FormField label="Nhóm hàng" value={draft.category} onChangeText={(value) => setTextField("category", value)} placeholder="Ví dụ: Bánh kẹo" /></View>
          </View>
          <FormField label="Mã vạch (tùy chọn)" value={draft.barcode ?? ""} onChangeText={(value) => setTextField("barcode", value)} placeholder="Quét hoặc nhập mã" keyboardType="numeric" />
          <View style={styles.twoColumns}>
            <View style={styles.flex}><FormField label="Tồn hiện tại" value={String(draft.stockQuantity)} onChangeText={(value) => setNumberField("stockQuantity", value)} placeholder="0" keyboardType="numeric" /></View>
            <View style={styles.flex}><FormField label="Cảnh báo khi còn" value={String(draft.lowStockThreshold)} onChangeText={(value) => setNumberField("lowStockThreshold", value)} placeholder="3" keyboardType="numeric" /></View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </Modal>
  );
}

function FormField({ label, ...inputProps }: { label: string } & React.ComponentProps<typeof TextInput>) {
  return <View style={styles.field}><Text style={styles.label}>{label}</Text><TextInput {...inputProps} style={styles.input} placeholderTextColor="#8B968E" /></View>;
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F7F7F2" }, header: { minHeight: 64, paddingHorizontal: 16, borderBottomWidth: 1, borderBottomColor: "#DFE5DF", backgroundColor: "#FFFFFF", flexDirection: "row", alignItems: "center", justifyContent: "space-between" }, iconButton: { padding: 10 }, title: { fontSize: 18, fontWeight: "800", color: "#1D2A23" }, saveButton: { backgroundColor: "#1F7A4A", minHeight: 40, paddingHorizontal: 16, borderRadius: 12, justifyContent: "center" }, saveText: { color: "#FFFFFF", fontSize: 15, fontWeight: "800" }, content: { padding: 20, gap: 14, paddingBottom: 44, alignSelf: "center", width: "100%", maxWidth: 720 }, imageRow: { padding: 14, backgroundColor: "#FFFFFF", borderWidth: 1, borderColor: "#DFE5DF", borderRadius: 16, flexDirection: "row", gap: 14 }, image: { width: 88, height: 88, borderRadius: 14, backgroundColor: "#E5EEE7" }, imagePlaceholder: { width: 88, height: 88, borderRadius: 14, backgroundColor: "#E5EEE7", alignItems: "center", justifyContent: "center" }, imageActions: { flex: 1, gap: 4, justifyContent: "center" }, row: { flexDirection: "row", gap: 8, marginTop: 8, flexWrap: "wrap" }, secondaryButton: { minHeight: 36, borderRadius: 10, borderWidth: 1, borderColor: "#B9CFBE", paddingHorizontal: 10, flexDirection: "row", alignItems: "center", gap: 6, justifyContent: "center" }, secondaryText: { color: "#1F7A4A", fontSize: 13, fontWeight: "700" }, field: { gap: 7 }, label: { color: "#334139", fontSize: 14, fontWeight: "800" }, help: { color: "#6E7B71", fontSize: 13, lineHeight: 18 }, input: { minHeight: 48, paddingHorizontal: 14, backgroundColor: "#FFFFFF", borderWidth: 1, borderColor: "#C9D4CB", borderRadius: 12, color: "#1D2A23", fontSize: 16 }, twoColumns: { flexDirection: "row", gap: 12 }, flex: { flex: 1 },
});
