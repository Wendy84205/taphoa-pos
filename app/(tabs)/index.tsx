import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { router } from "expo-router";
import { useMemo, useState } from "react";
import { Alert, FlatList, Image, Modal, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";

import { BarcodeScannerModal } from "@/components/barcode-scanner-modal";
import { ProductEditorSheet } from "@/components/product-editor-sheet";
import { ScreenContainer } from "@/components/screen-container";
import { filterProducts, formatVnd, isLowStock } from "@/lib/pos-calculations";
import { usePosStore } from "@/lib/pos-store";
import { PRODUCT_CATEGORIES } from "@/lib/pos-types";

export default function PriceLookupScreen() {
  const { products, addToCart, getProductByBarcode, addProduct, initialized } = usePosStore();
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("Tất cả");
  const [scannerVisible, setScannerVisible] = useState(false);
  const [quickAddBarcode, setQuickAddBarcode] = useState<string | undefined>();
  const [scanMessage, setScanMessage] = useState<{ barcode: string; productId?: string } | null>(null);
  const results = useMemo(() => filterProducts(products, query, category), [products, query, category]);
  const scannedProduct = scanMessage?.productId ? products.find((product) => product.id === scanMessage.productId) : undefined;

  function handleScanned(barcode: string) {
    setScannerVisible(false);
    const product = getProductByBarcode(barcode);
    if (product) {
      setScanMessage({ barcode, productId: product.id });
      setQuery(product.name);
      return;
    }
    setScanMessage({ barcode });
  }

  function addProductToCart(productId: string) {
    const product = products.find((item) => item.id === productId);
    if (!product) return;
    if (product.stockQuantity <= 0) {
      Alert.alert("Đã hết hàng", "Sản phẩm này không còn tồn kho để thêm vào giỏ.");
      return;
    }
    addToCart(product);
  }

  if (!initialized) return <ScreenContainer><View style={styles.loading}><Text style={styles.muted}>Đang mở dữ liệu tại máy…</Text></View></ScreenContainer>;

  return (
    <ScreenContainer className="bg-background" edges={["top", "left", "right"]}>
      <FlatList data={results} keyExtractor={(item) => item.id} contentContainerStyle={styles.list} ListHeaderComponent={<View style={styles.headerContent}>
        <View style={styles.topRow}><View><Text style={styles.kicker}>TẠP HÓA POS</Text><Text style={styles.title}>Tra giá thật nhanh</Text></View><View style={styles.storeMark}><MaterialIcons name="storefront" size={22} color="#1F7A4A" /></View></View>
        <View style={styles.searchRow}><View style={styles.searchBox}><MaterialIcons name="search" size={22} color="#526158" /><TextInput value={query} onChangeText={setQuery} placeholder="Nhập tên hàng hoặc mã vạch" placeholderTextColor="#7F8C83" style={styles.searchInput} returnKeyType="search" /><TouchableOpacity onPress={() => setQuery("")} style={styles.clearButton}>{query ? <MaterialIcons name="close" size={19} color="#526158" /> : null}</TouchableOpacity></View><TouchableOpacity onPress={() => setScannerVisible(true)} style={styles.scanButton} accessibilityLabel="Quét mã vạch"><MaterialIcons name="qr-code-scanner" size={25} color="#1D2A23" /></TouchableOpacity></View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categoryRow}>{PRODUCT_CATEGORIES.map((item) => <TouchableOpacity key={item} onPress={() => setCategory(item)} style={[styles.category, category === item && styles.categoryActive]}><Text style={[styles.categoryText, category === item && styles.categoryTextActive]}>{item}</Text></TouchableOpacity>)}</ScrollView>
        {scanMessage ? <View style={[styles.scanResult, scannedProduct ? styles.found : styles.notFound]}>{scannedProduct ? <><View style={styles.scanIcon}><MaterialIcons name="check-circle" size={24} color="#1F7A4A" /></View><View style={styles.scanText}><Text style={styles.scanLabel}>ĐÃ TÌM THẤY SẢN PHẨM</Text><Text style={styles.scanName}>{scannedProduct.name}</Text><Text style={styles.scanPrice}>{formatVnd(scannedProduct.price)} <Text style={styles.unit}>/ {scannedProduct.unit}</Text></Text></View><TouchableOpacity onPress={() => addProductToCart(scannedProduct.id)} style={styles.addResult}><MaterialIcons name="add-shopping-cart" size={20} color="#FFFFFF" /><Text style={styles.addResultText}>Thêm</Text></TouchableOpacity></> : <><View style={styles.scanIcon}><MaterialIcons name="help-outline" size={24} color="#A45C0A" /></View><View style={styles.scanText}><Text style={styles.scanLabel}>CHƯA CÓ SẢN PHẨM</Text><Text style={styles.scanName}>Mã {scanMessage.barcode}</Text><Text style={styles.muted}>Thêm ngay để tra giá ở lần sau.</Text></View><TouchableOpacity onPress={() => setQuickAddBarcode(scanMessage.barcode)} style={styles.createResult}><Text style={styles.createResultText}>Tạo nhanh</Text></TouchableOpacity></>}</View> : null}
        <View style={styles.sectionHeading}><Text style={styles.sectionTitle}>{query ? `Kết quả (${results.length})` : "Hàng hóa gần đây"}</Text><Text style={styles.resultHint}>Chạm để thêm vào giỏ</Text></View>
      </View>} ListEmptyComponent={<View style={styles.empty}><MaterialIcons name="search-off" size={38} color="#8B968E" /><Text style={styles.emptyTitle}>Không tìm thấy sản phẩm</Text><Text style={styles.muted}>Đổi từ khóa hoặc thêm sản phẩm mới.</Text></View>} renderItem={({ item }) => <TouchableOpacity onPress={() => addProductToCart(item.id)} activeOpacity={0.75} style={styles.productCard}><ProductVisual imageUri={item.imageUri} category={item.category} /><View style={styles.productInfo}><Text numberOfLines={1} style={styles.productName}>{item.name}</Text><Text style={styles.productMeta}>{item.category} · còn {item.stockQuantity} {item.unit}</Text>{isLowStock(item) ? <View style={styles.warning}><MaterialIcons name="warning-amber" size={14} color="#A45C0A" /><Text style={styles.warningText}>Sắp hết hàng</Text></View> : null}</View><View style={styles.priceInfo}><Text style={styles.price}>{formatVnd(item.price)}</Text><Text style={styles.unit}>/ {item.unit}</Text><View style={styles.plus}><MaterialIcons name="add" size={18} color="#1F7A4A" /></View></View></TouchableOpacity>} />
      <BarcodeScannerModal visible={scannerVisible} onClose={() => setScannerVisible(false)} onScanned={handleScanned} />
      <ProductEditorSheet visible={Boolean(quickAddBarcode)} presetBarcode={quickAddBarcode} onClose={() => setQuickAddBarcode(undefined)} onSave={(draft) => { addProduct(draft); setScanMessage(null); }} />
    </ScreenContainer>
  );
}

function ProductVisual({ imageUri, category }: { imageUri?: string; category: string }) {
  return imageUri ? <Image source={{ uri: imageUri }} style={styles.productImage} /> : <View style={styles.productImage}><MaterialIcons name={category === "Nước giải khát" ? "local-drink" : category === "Bánh kẹo" ? "cookie" : "inventory-2"} size={25} color="#1F7A4A" /></View>;
}

const styles = StyleSheet.create({
  list: { paddingBottom: 28, width: "100%", maxWidth: 960, alignSelf: "center" }, headerContent: { paddingTop: 18 }, topRow: { paddingHorizontal: 20, flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 18 }, kicker: { letterSpacing: 1.2, color: "#1F7A4A", fontSize: 11, fontWeight: "900" }, title: { color: "#1D2A23", fontSize: 28, lineHeight: 34, fontWeight: "900", marginTop: 2 }, storeMark: { width: 44, height: 44, borderRadius: 14, backgroundColor: "#E5F0E7", alignItems: "center", justifyContent: "center" }, searchRow: { paddingHorizontal: 20, flexDirection: "row", gap: 10 }, searchBox: { flex: 1, minHeight: 52, borderRadius: 15, borderWidth: 1, borderColor: "#C9D4CB", backgroundColor: "#FFFFFF", flexDirection: "row", alignItems: "center", paddingLeft: 14 }, searchInput: { flex: 1, color: "#1D2A23", fontSize: 16, minHeight: 50, paddingHorizontal: 10 }, clearButton: { width: 34, height: 40, alignItems: "center", justifyContent: "center" }, scanButton: { width: 54, height: 52, borderRadius: 15, backgroundColor: "#E8B04C", alignItems: "center", justifyContent: "center" }, categoryRow: { paddingHorizontal: 20, paddingVertical: 15, gap: 8 }, category: { minHeight: 34, paddingHorizontal: 12, borderRadius: 17, backgroundColor: "#E9EEE9", justifyContent: "center" }, categoryActive: { backgroundColor: "#1F7A4A" }, categoryText: { fontSize: 13, color: "#526158", fontWeight: "700" }, categoryTextActive: { color: "#FFFFFF" }, sectionHeading: { paddingHorizontal: 20, paddingTop: 2, paddingBottom: 10, flexDirection: "row", justifyContent: "space-between", alignItems: "baseline" }, sectionTitle: { color: "#1D2A23", fontSize: 18, fontWeight: "900" }, resultHint: { color: "#6E7B71", fontSize: 12, fontWeight: "600" }, productCard: { marginHorizontal: 20, marginBottom: 10, padding: 12, backgroundColor: "#FFFFFF", borderRadius: 16, borderWidth: 1, borderColor: "#DFE5DF", flexDirection: "row", alignItems: "center", gap: 12 }, productImage: { width: 52, height: 52, borderRadius: 14, backgroundColor: "#E7F1E8", alignItems: "center", justifyContent: "center" }, productInfo: { flex: 1, gap: 3 }, productName: { color: "#1D2A23", fontSize: 16, lineHeight: 21, fontWeight: "800" }, productMeta: { color: "#6E7B71", fontSize: 13 }, priceInfo: { alignItems: "flex-end", gap: 1 }, price: { color: "#1F7A4A", fontSize: 17, fontWeight: "900" }, unit: { color: "#6E7B71", fontSize: 12, fontWeight: "600" }, plus: { width: 26, height: 26, borderRadius: 13, backgroundColor: "#E5F0E7", alignItems: "center", justifyContent: "center", marginTop: 3 }, warning: { flexDirection: "row", alignItems: "center", gap: 3 }, warningText: { fontSize: 12, color: "#A45C0A", fontWeight: "700" }, scanResult: { marginHorizontal: 20, marginBottom: 4, padding: 13, borderRadius: 16, flexDirection: "row", alignItems: "center", gap: 10, borderWidth: 1 }, found: { backgroundColor: "#EDF8EF", borderColor: "#B9DCC0" }, notFound: { backgroundColor: "#FFF7E8", borderColor: "#F0D2A1" }, scanIcon: { width: 30, alignItems: "center" }, scanText: { flex: 1, gap: 2 }, scanLabel: { color: "#55625A", fontSize: 10, letterSpacing: 0.7, fontWeight: "900" }, scanName: { color: "#1D2A23", fontSize: 15, fontWeight: "900" }, scanPrice: { color: "#1F7A4A", fontSize: 21, lineHeight: 26, fontWeight: "900" }, addResult: { minHeight: 38, borderRadius: 10, paddingHorizontal: 10, backgroundColor: "#1F7A4A", flexDirection: "row", alignItems: "center", gap: 4 }, addResultText: { color: "#FFFFFF", fontWeight: "800", fontSize: 13 }, createResult: { minHeight: 38, borderRadius: 10, paddingHorizontal: 10, backgroundColor: "#FFF0CC", justifyContent: "center" }, createResultText: { color: "#8A5200", fontWeight: "800", fontSize: 13 }, empty: { marginHorizontal: 20, marginTop: 38, padding: 28, borderRadius: 16, backgroundColor: "#FFFFFF", borderWidth: 1, borderColor: "#DFE5DF", alignItems: "center", gap: 8 }, emptyTitle: { color: "#1D2A23", fontSize: 16, fontWeight: "900" }, muted: { color: "#6E7B71", fontSize: 13, lineHeight: 18 }, loading: { flex: 1, alignItems: "center", justifyContent: "center" },
});
