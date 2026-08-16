import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { useMemo, useState } from "react";
import { Alert, FlatList, Image, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";

import { BarcodeScannerModal } from "@/components/barcode-scanner-modal";
import { ProductEditorSheet } from "@/components/product-editor-sheet";
import { ProductVisionModal } from "@/components/product-vision-modal";
import { ScreenContainer } from "@/components/screen-container";
import { filterProducts, formatVnd, isLowStock } from "@/lib/pos-calculations";
import { usePosStore } from "@/lib/pos-store";
import type { Product, ProductUnit } from "@/lib/pos-types";
import { PRODUCT_CATEGORIES } from "@/lib/pos-types";
import { getProductUnits } from "@/lib/product-units";

type LookupNotice = { label: string; productId?: string; tone: "found" | "missing" };

export default function PriceLookupScreen() {
  const { products, addToCart, getProductByBarcode, addProduct, initialized, cart } = usePosStore();
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("Tất cả");
  const [scannerVisible, setScannerVisible] = useState(false);
  const [visionVisible, setVisionVisible] = useState(false);
  const [quickAddBarcode, setQuickAddBarcode] = useState<string | undefined>();
  const [notice, setNotice] = useState<LookupNotice | null>(null);
  const results = useMemo(() => filterProducts(products, query, category), [products, query, category]);
  const selected = notice?.productId ? products.find((product) => product.id === notice.productId) : undefined;
  const lowStockCount = products.filter(isLowStock).length;

  function addProductToCart(productId: string, unit?: ProductUnit) {
    const product = products.find((item) => item.id === productId);
    if (!product) return;
    if (product.stockQuantity <= 0) {
      Alert.alert("Đã hết hàng", "Sản phẩm này không còn tồn kho để thêm vào giỏ.");
      return;
    }
    addToCart(product, unit);
    setNotice({ label: `${product.name} đã thêm vào giỏ`, productId: product.id, tone: "found" });
  }

  function handleBarcode(barcode: string) {
    setScannerVisible(false);
    const product = getProductByBarcode(barcode);
    if (product) {
      setQuery(product.name);
      setNotice({ label: "Đã tìm thấy bằng mã vạch", productId: product.id, tone: "found" });
    } else {
      setNotice({ label: `Chưa có mã ${barcode} trong quán`, tone: "missing" });
      setQuickAddBarcode(barcode);
    }
  }

  function handleVisionProduct(product: Product) {
    setQuery(product.name);
    setNotice({ label: "Đã tìm thấy từ ảnh sản phẩm", productId: product.id, tone: "found" });
  }

  if (!initialized) return <ScreenContainer><View style={styles.loading}><Text style={styles.muted}>Đang mở dữ liệu tại máy…</Text></View></ScreenContainer>;

  return (
    <ScreenContainer edges={["top", "left", "right"]}>
      <FlatList
        data={results}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        keyboardShouldPersistTaps="handled"
        ListHeaderComponent={
          <View style={styles.headerContent}>
            <View style={styles.topRow}><View><Text style={styles.eyebrow}>TẠI QUẦY</Text><Text style={styles.title}>Tra giá nhanh</Text></View><View style={styles.cartPill}><MaterialIcons name="shopping-cart" size={17} color="#176B4D" /><Text style={styles.cartPillText}>{cart.length} dòng</Text></View></View>
            <Text style={styles.subtitle}>Cầm hàng lên, chụp bao bì hoặc quét mã. Giá luôn lấy từ danh mục của quán.</Text>
            <View style={styles.searchBox}><MaterialIcons name="search" size={22} color="#66776D" /><TextInput value={query} onChangeText={(value) => { setQuery(value); setNotice(null); }} placeholder="Tìm tên hàng, thương hiệu…" placeholderTextColor="#89968E" style={styles.searchInput} returnKeyType="search" /><Pressable onPress={() => setQuery("")} style={styles.clearButton} accessibilityLabel="Xóa tìm kiếm">{query ? <MaterialIcons name="close" size={19} color="#66776D" /> : null}</Pressable></View>
            <View style={styles.captureRow}><Pressable onPress={() => setVisionVisible(true)} style={({ pressed }) => [styles.photoAction, pressed && styles.pressed]}><View style={styles.photoIcon}><MaterialIcons name="photo-camera" size={23} color="#176B4D" /></View><View style={styles.photoCopy}><Text style={styles.photoTitle}>Chụp sản phẩm</Text><Text style={styles.photoText}>Nhận diện mặt trước bao bì</Text></View><MaterialIcons name="arrow-forward" size={20} color="#176B4D" /></Pressable><Pressable onPress={() => setScannerVisible(true)} style={({ pressed }) => [styles.scanAction, pressed && styles.pressed]} accessibilityLabel="Quét mã vạch"><MaterialIcons name="qr-code-scanner" size={25} color="#FFFFFF" /><Text style={styles.scanText}>Quét mã</Text></Pressable></View>
            {lowStockCount ? <View style={styles.stockHint}><MaterialIcons name="inventory" size={18} color="#A65E13" /><Text style={styles.stockHintText}>{lowStockCount} mặt hàng sắp hết — xem trong Tiện ích › Sản phẩm</Text></View> : null}
            {notice ? <LookupNoticeCard notice={notice} product={selected} onAdd={addProductToCart} /> : null}
            <View style={styles.sectionHeading}><Text style={styles.sectionTitle}>{query ? `${results.length} kết quả` : "Hàng hóa trong quán"}</Text><Text style={styles.sectionSub}>{query ? "Chạm để thêm vào giỏ" : "Tìm, chụp hoặc quét để tra nhanh"}</Text></View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categories}>{PRODUCT_CATEGORIES.map((item) => <Pressable key={item} onPress={() => setCategory(item)} style={[styles.category, category === item && styles.categoryActive]}><Text style={[styles.categoryText, category === item && styles.categoryTextActive]}>{item}</Text></Pressable>)}</ScrollView>
          </View>
        }
        ListEmptyComponent={<View style={styles.empty}><MaterialIcons name="search-off" size={38} color="#A65E13" /><Text style={styles.emptyTitle}>Chưa có sản phẩm phù hợp</Text><Text style={styles.muted}>Thử chụp mặt trước bao bì, quét mã hoặc đổi từ khóa.</Text></View>}
        renderItem={({ item }) => <ProductCard item={item} onAdd={addProductToCart} />}
      />
      {scannerVisible ? <BarcodeScannerModal visible onClose={() => setScannerVisible(false)} onScanned={handleBarcode} /> : null}
      {visionVisible ? <ProductVisionModal visible products={products} onClose={() => setVisionVisible(false)} onProductSelected={handleVisionProduct} /> : null}
      <ProductEditorSheet visible={Boolean(quickAddBarcode)} presetBarcode={quickAddBarcode} onClose={() => setQuickAddBarcode(undefined)} onSave={(draft) => { addProduct(draft); setNotice(null); }} />
    </ScreenContainer>
  );
}

function LookupNoticeCard({ notice, product, onAdd }: { notice: LookupNotice; product?: Product; onAdd: (id: string, unit?: ProductUnit) => void }) {
  return <View style={[styles.notice, notice.tone === "found" ? styles.noticeFound : styles.noticeMissing]}>{notice.tone === "found" ? <MaterialIcons name="check-circle" size={23} color="#176B4D" /> : <MaterialIcons name="info-outline" size={23} color="#A65E13" />}<View style={styles.noticeCopy}><Text style={styles.noticeLabel}>{notice.label}</Text>{product ? <><Text numberOfLines={1} style={styles.noticeName}>{product.name}</Text><Text style={styles.noticePrice}>{formatVnd(product.price)} / {product.unit}</Text></> : <Text style={styles.noticeSub}>Bạn có thể tạo hàng mới từ mã vạch này.</Text>}</View>{product ? <Pressable onPress={() => onAdd(product.id)} style={styles.noticeAdd}><Text style={styles.noticeAddText}>Thêm</Text></Pressable> : null}</View>;
}

function ProductCard({ item, onAdd }: { item: Product; onAdd: (id: string, unit?: ProductUnit) => void }) {
  return <View style={styles.productCard}><Pressable onPress={() => onAdd(item.id)} style={({ pressed }) => [styles.productMain, pressed && styles.pressed]}><ProductVisual imageUri={item.imageUri} category={item.category} /><View style={styles.productInfo}><View style={styles.productTitleRow}><Text numberOfLines={1} style={styles.productName}>{item.name}</Text>{isLowStock(item) ? <View style={styles.lowBadge}><Text style={styles.lowBadgeText}>Sắp hết</Text></View> : null}</View><Text style={styles.productMeta}>{item.category} · còn {item.stockQuantity} {item.unit}</Text></View><View style={styles.priceInfo}><Text style={styles.price}>{formatVnd(item.price)}</Text><Text style={styles.unit}>/ {item.unit}</Text><View style={styles.plus}><MaterialIcons name="add" size={18} color="#176B4D" /></View></View></Pressable>{getProductUnits(item).length > 1 ? <View style={styles.unitChoices}>{getProductUnits(item).map((unit) => <Pressable key={unit.id} onPress={() => onAdd(item.id, unit)} style={styles.unitChoice}><Text style={styles.unitChoiceText}>{unit.label}</Text><Text style={styles.unitChoicePrice}>{formatVnd(unit.price)}</Text></Pressable>)}</View> : null}</View>;
}

function ProductVisual({ imageUri, category }: { imageUri?: string; category: string }) { return imageUri ? <Image source={{ uri: imageUri }} style={styles.productImage} /> : <View style={styles.productImage}><MaterialIcons name={category === "Nước giải khát" ? "local-drink" : category === "Bánh kẹo" ? "cookie" : "inventory-2"} size={25} color="#176B4D" /></View>; }

const styles = StyleSheet.create({
  list: { padding: 20, paddingBottom: 36, gap: 10 }, headerContent: { gap: 14, paddingBottom: 13 }, topRow: { flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between" }, eyebrow: { color: "#176B4D", fontSize: 10, letterSpacing: 1.25, fontWeight: "900" }, title: { color: "#18231E", fontSize: 31, lineHeight: 37, fontWeight: "900", marginTop: 2 }, cartPill: { minHeight: 34, paddingHorizontal: 10, borderRadius: 11, backgroundColor: "#DDEFE5", flexDirection: "row", alignItems: "center", gap: 5 }, cartPillText: { color: "#176B4D", fontSize: 12, fontWeight: "900" }, subtitle: { color: "#607268", fontSize: 14, lineHeight: 20, maxWidth: 330 }, searchBox: { minHeight: 56, borderRadius: 16, borderWidth: 1, borderColor: "#C9D6CD", backgroundColor: "#FFFFFF", flexDirection: "row", alignItems: "center", paddingLeft: 15 }, searchInput: { flex: 1, minHeight: 54, paddingHorizontal: 10, color: "#18231E", fontSize: 16 }, clearButton: { width: 42, height: 46, alignItems: "center", justifyContent: "center" }, captureRow: { flexDirection: "row", gap: 10 }, photoAction: { flex: 1, minHeight: 80, padding: 12, borderRadius: 18, backgroundColor: "#DDEFE5", flexDirection: "row", alignItems: "center", gap: 9 }, photoIcon: { width: 38, height: 38, borderRadius: 12, backgroundColor: "#FFFFFF", justifyContent: "center", alignItems: "center" }, photoCopy: { flex: 1, gap: 2 }, photoTitle: { color: "#176B4D", fontSize: 14, fontWeight: "900" }, photoText: { color: "#46705B", fontSize: 10, lineHeight: 14, fontWeight: "700" }, scanAction: { width: 88, minHeight: 80, paddingHorizontal: 8, borderRadius: 18, backgroundColor: "#176B4D", justifyContent: "center", alignItems: "center", gap: 5 }, scanText: { color: "#FFFFFF", fontSize: 11, fontWeight: "900" }, stockHint: { minHeight: 44, paddingHorizontal: 12, borderRadius: 13, backgroundColor: "#FFF1D8", flexDirection: "row", alignItems: "center", gap: 8 }, stockHintText: { flex: 1, color: "#845016", fontSize: 12, lineHeight: 17, fontWeight: "700" }, notice: { padding: 13, borderRadius: 16, flexDirection: "row", alignItems: "center", gap: 10, borderWidth: 1 }, noticeFound: { backgroundColor: "#F0FAF3", borderColor: "#B8DBC3" }, noticeMissing: { backgroundColor: "#FFF7E8", borderColor: "#F0D2A1" }, noticeCopy: { flex: 1, gap: 2 }, noticeLabel: { color: "#5D7164", fontSize: 10, letterSpacing: 0.6, fontWeight: "900" }, noticeName: { color: "#18231E", fontSize: 15, fontWeight: "900" }, noticePrice: { color: "#176B4D", fontSize: 19, fontWeight: "900" }, noticeSub: { color: "#8C5C20", fontSize: 12, lineHeight: 17 }, noticeAdd: { minHeight: 40, paddingHorizontal: 13, borderRadius: 11, backgroundColor: "#176B4D", justifyContent: "center" }, noticeAddText: { color: "#FFFFFF", fontSize: 12, fontWeight: "900" }, sectionHeading: { marginTop: 4, gap: 2 }, sectionTitle: { color: "#18231E", fontSize: 19, fontWeight: "900" }, sectionSub: { color: "#66776D", fontSize: 12, fontWeight: "700" }, categories: { gap: 8, paddingVertical: 2 }, category: { minHeight: 34, paddingHorizontal: 13, borderRadius: 17, backgroundColor: "#EAF0EB", justifyContent: "center" }, categoryActive: { backgroundColor: "#176B4D" }, categoryText: { color: "#526158", fontSize: 12, fontWeight: "800" }, categoryTextActive: { color: "#FFFFFF" }, productCard: { marginBottom: 10, padding: 13, backgroundColor: "#FFFFFF", borderRadius: 17, borderWidth: 1, borderColor: "#DCE6DD" }, productMain: { flexDirection: "row", alignItems: "center", gap: 12 }, productImage: { width: 55, height: 55, borderRadius: 15, backgroundColor: "#E7F1E8", alignItems: "center", justifyContent: "center" }, productInfo: { flex: 1, gap: 4 }, productTitleRow: { flexDirection: "row", gap: 7, alignItems: "center" }, productName: { flexShrink: 1, color: "#18231E", fontSize: 15, fontWeight: "900" }, productMeta: { color: "#6E7B71", fontSize: 12 }, lowBadge: { paddingHorizontal: 6, paddingVertical: 3, borderRadius: 6, backgroundColor: "#FFF0CC" }, lowBadgeText: { color: "#A45C0A", fontSize: 10, fontWeight: "900" }, priceInfo: { alignItems: "flex-end", gap: 1 }, price: { color: "#176B4D", fontSize: 17, fontWeight: "900" }, unit: { color: "#6E7B71", fontSize: 11 }, plus: { width: 27, height: 27, borderRadius: 14, backgroundColor: "#DDEFE5", alignItems: "center", justifyContent: "center", marginTop: 3 }, unitChoices: { flexDirection: "row", flexWrap: "wrap", gap: 6, paddingTop: 9, marginTop: 9, borderTopWidth: 1, borderTopColor: "#EDF0ED" }, unitChoice: { paddingHorizontal: 9, paddingVertical: 6, borderRadius: 9, backgroundColor: "#E9F3EA", flexDirection: "row", gap: 5, alignItems: "center" }, unitChoiceText: { color: "#176B4D", fontSize: 11, fontWeight: "900" }, unitChoicePrice: { color: "#526158", fontSize: 10, fontWeight: "700" }, empty: { marginTop: 12, padding: 28, borderRadius: 16, backgroundColor: "#FFFFFF", borderWidth: 1, borderColor: "#DFE5DF", alignItems: "center", gap: 8 }, emptyTitle: { color: "#18231E", fontSize: 16, fontWeight: "900" }, muted: { color: "#6E7B71", fontSize: 13, lineHeight: 18, textAlign: "center" }, pressed: { opacity: 0.74, transform: [{ scale: 0.98 }] }, loading: { flex: 1, alignItems: "center", justifyContent: "center" },
});
