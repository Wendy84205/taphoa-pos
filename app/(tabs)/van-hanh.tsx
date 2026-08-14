import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { useMemo, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";

import { ScreenContainer } from "@/components/screen-container";
import { formatVnd } from "@/lib/pos-calculations";
import { usePosStore } from "@/lib/pos-store";
import { trpc } from "@/lib/trpc";

const MODES = [
  { key: "receipt", label: "Nhập hàng", icon: "local-shipping" as const },
  { key: "expiry", label: "Hạn dùng", icon: "event-busy" as const },
  { key: "shift", label: "Đóng ca", icon: "point-of-sale" as const },
  { key: "promotion", label: "Khuyến mãi", icon: "local-offer" as const },
] as const;
type Mode = (typeof MODES)[number]["key"];

function Field({ label, value, onChangeText, placeholder, keyboardType = "default" }: { label: string; value: string; onChangeText: (value: string) => void; placeholder: string; keyboardType?: "default" | "numeric" }) {
  return <View style={styles.field}><Text style={styles.label}>{label}</Text><TextInput value={value} onChangeText={onChangeText} placeholder={placeholder} placeholderTextColor="#8B968E" keyboardType={keyboardType} style={styles.input} /></View>;
}

export default function OperationsScreen() {
  const { products, stockReceipts, expiryBatches, shifts, promotions, comboRules, addSupplier, recordStockReceipt, addExpiryBatch, closeShift, addPromotion, addComboRule } = usePosStore();
  const workspaceQuery = trpc.workspace.me.useQuery(undefined, { retry: false });
  const [mode, setMode] = useState<Mode>("receipt");
  const [productId, setProductId] = useState(products[0]?.id ?? "");
  const [supplierName, setSupplierName] = useState("");
  const [quantity, setQuantity] = useState("");
  const [unitCost, setUnitCost] = useState("");
  const [paidAmount, setPaidAmount] = useState("");
  const [expiresAt, setExpiresAt] = useState("");
  const [actualCash, setActualCash] = useState("");
  const [note, setNote] = useState("");
  const [message, setMessage] = useState("");
  const [promotionName, setPromotionName] = useState("");
  const [promotionValue, setPromotionValue] = useState("");
  const [promotionKind, setPromotionKind] = useState<"percent" | "fixed">("percent");
  const [comboQuantity, setComboQuantity] = useState("2");
  const [comboPrice, setComboPrice] = useState("");
  const selectedProduct = products.find((product) => product.id === productId);
  const expiring = useMemo(() => expiryBatches.filter((batch) => new Date(batch.expiresAt).getTime() >= Date.now()).sort((a, b) => new Date(a.expiresAt).getTime() - new Date(b.expiresAt).getTime()).slice(0, 8), [expiryBatches]);

  if (workspaceQuery.data?.store.storeType === "solo") return <ScreenContainer><View style={styles.blocked}><Text style={styles.blockedTitle}>Vận hành nâng cao đang tắt</Text><Text style={styles.blockedText}>Nhập hàng, hạn dùng, đóng ca và khuyến mãi chỉ bật khi quán chọn chế độ Có nhân viên trong Tài khoản.</Text></View></ScreenContainer>;

  function saveReceipt() {
    if (!selectedProduct || !quantity || !unitCost) return setMessage("Chọn sản phẩm và nhập đủ số lượng, giá vốn.");
    const supplier = supplierName.trim() ? addSupplier({ name: supplierName.trim() }) : undefined;
    const receipt = recordStockReceipt({ supplierId: supplier?.id, supplierName: supplier?.name || supplierName.trim() || undefined, items: [{ productId: selectedProduct.id, productName: selectedProduct.name, quantity: Number(quantity), unitCost: Number(unitCost), expiresAt: expiresAt || undefined }], paidAmount: Number(paidAmount || 0), note });
    setMessage(receipt ? `Đã lưu ${receipt.id}, tổng ${formatVnd(receipt.totalAmount)}.` : "Không thể lưu phiếu nhập.");
    if (receipt) { setQuantity(""); setUnitCost(""); setPaidAmount(""); setExpiresAt(""); setNote(""); }
  }
  function saveExpiry() {
    if (!selectedProduct || !quantity || !expiresAt) return setMessage("Chọn sản phẩm, nhập số lượng và ngày hết hạn.");
    addExpiryBatch({ productId: selectedProduct.id, quantity: Number(quantity), expiresAt });
    setMessage(`Đã thêm lô hạn dùng cho ${selectedProduct.name}.`); setQuantity(""); setExpiresAt("");
  }
  function saveShift() {
    if (!actualCash) return setMessage("Nhập số tiền mặt thực tế đã kiểm.");
    const shift = closeShift(Number(actualCash), note);
    setMessage(shift ? `Đã đóng ca. Chênh lệch: ${formatVnd(shift.cashDifference ?? 0)}.` : "Không thể lưu ca.");
    if (shift) { setActualCash(""); setNote(""); }
  }
  function savePromotion() {
    if (!selectedProduct || !promotionName.trim()) return setMessage("Chọn sản phẩm và nhập tên chương trình.");
    if (comboPrice) {
      const combo = addComboRule({ name: promotionName.trim(), productIds: [selectedProduct.id], requiredQuantity: Number(comboQuantity || 2), comboPrice: Number(comboPrice), active: true });
      setMessage(`Đã tạo combo ${combo.name}.`);
    } else {
      const promotion = addPromotion({ name: promotionName.trim(), kind: promotionKind, value: Number(promotionValue || 0), productIds: [selectedProduct.id], active: true });
      setMessage(`Đã tạo khuyến mãi ${promotion.name}.`);
    }
    setPromotionName(""); setPromotionValue(""); setComboPrice("");
  }

  const renderProducts = (showPrice = false) => <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.productRow}>{products.map((product) => <Pressable key={product.id} onPress={() => setProductId(product.id)} style={[styles.productChip, product.id === productId && styles.productChipActive]}><Text numberOfLines={1} style={[styles.productChipText, product.id === productId && styles.productChipTextActive]}>{product.name}</Text><Text style={styles.productStock}>{showPrice ? formatVnd(product.price) : `Tồn ${product.stockQuantity}`}</Text></Pressable>)}</ScrollView>;

  return <ScreenContainer><ScrollView contentContainerStyle={styles.content}><View style={styles.hero}><View style={styles.heroIcon}><MaterialIcons name="warehouse" size={24} color="#F2C14E" /></View><View style={styles.heroCopy}><Text style={styles.kicker}>ĐIỀU HÀNH CỬA HÀNG</Text><Text style={styles.title}>Nhập hàng, khuyến mãi & đóng ca</Text><Text style={styles.subtitle}>Ghi nhận vận hành trong cùng một nơi.</Text></View></View>
    <View style={styles.modeRow}>{MODES.map((item) => <Pressable key={item.key} onPress={() => { setMode(item.key); setMessage(""); }} style={({ pressed }) => [styles.modeButton, mode === item.key && styles.modeActive, pressed && styles.pressed]}><MaterialIcons name={item.icon} size={18} color={mode === item.key ? "#FFFFFF" : "#1F7A4A"} /><Text style={[styles.modeText, mode === item.key && styles.modeTextActive]}>{item.label}</Text></Pressable>)}</View>
    {mode === "receipt" && <View style={styles.card}><Text style={styles.cardTitle}>Phiếu nhập mới</Text><Text style={styles.cardHint}>Tồn kho và giá vốn trung bình sẽ được cập nhật.</Text><Text style={styles.label}>Sản phẩm</Text>{renderProducts()}<Field label="Nhà cung cấp" value={supplierName} onChangeText={setSupplierName} placeholder="Tên nhà cung cấp" /><View style={styles.twoCol}><Field label="Số lượng" value={quantity} onChangeText={setQuantity} placeholder="0" keyboardType="numeric" /><Field label="Giá vốn/đơn vị" value={unitCost} onChangeText={setUnitCost} placeholder="0" keyboardType="numeric" /></View><View style={styles.twoCol}><Field label="Đã thanh toán" value={paidAmount} onChangeText={setPaidAmount} placeholder="0" keyboardType="numeric" /><Field label="Hạn dùng" value={expiresAt} onChangeText={setExpiresAt} placeholder="YYYY-MM-DD" /></View><Pressable onPress={saveReceipt} style={styles.primaryButton}><MaterialIcons name="save" size={19} color="#FFFFFF" /><Text style={styles.primaryText}>Lưu phiếu nhập</Text></Pressable></View>}
    {mode === "expiry" && <View style={styles.card}><Text style={styles.cardTitle}>Thêm lô hạn dùng</Text><Text style={styles.label}>Sản phẩm</Text>{renderProducts()}<View style={styles.twoCol}><Field label="Số lượng lô" value={quantity} onChangeText={setQuantity} placeholder="0" keyboardType="numeric" /><Field label="Ngày hết hạn" value={expiresAt} onChangeText={setExpiresAt} placeholder="YYYY-MM-DD" /></View><Pressable onPress={saveExpiry} style={styles.primaryButton}><MaterialIcons name="event" size={19} color="#FFFFFF" /><Text style={styles.primaryText}>Lưu lô hạn dùng</Text></Pressable></View>}
    {mode === "shift" && <View style={styles.card}><Text style={styles.cardTitle}>Đóng ca hôm nay</Text><Text style={styles.cardHint}>Đối chiếu tiền mặt thực tế với doanh thu tiền mặt dự kiến.</Text><Field label="Tiền mặt thực tế" value={actualCash} onChangeText={setActualCash} placeholder="0" keyboardType="numeric" /><Field label="Ghi chú" value={note} onChangeText={setNote} placeholder="Chênh lệch, hoàn đơn..." /><Pressable onPress={saveShift} style={styles.primaryButton}><MaterialIcons name="lock" size={19} color="#FFFFFF" /><Text style={styles.primaryText}>Chốt ca</Text></Pressable></View>}
    {mode === "promotion" && <View style={styles.card}><Text style={styles.cardTitle}>Tạo khuyến mãi hoặc combo</Text><Text style={styles.cardHint}>POS tự áp dụng mức giảm tốt nhất khi checkout.</Text><Text style={styles.label}>Sản phẩm áp dụng</Text>{renderProducts(true)}<Field label="Tên chương trình" value={promotionName} onChangeText={setPromotionName} placeholder="Giảm giá cuối ngày" /><View style={styles.modeRow}><Pressable onPress={() => setPromotionKind("percent")} style={[styles.modeButton, promotionKind === "percent" && styles.modeActive]}><Text style={[styles.modeText, promotionKind === "percent" && styles.modeTextActive]}>Giảm %</Text></Pressable><Pressable onPress={() => setPromotionKind("fixed")} style={[styles.modeButton, promotionKind === "fixed" && styles.modeActive]}><Text style={[styles.modeText, promotionKind === "fixed" && styles.modeTextActive]}>Giảm tiền</Text></Pressable></View><Field label="Mức giảm" value={promotionValue} onChangeText={setPromotionValue} placeholder={promotionKind === "percent" ? "10" : "5000"} keyboardType="numeric" /><View style={styles.twoCol}><Field label="Số lượng combo" value={comboQuantity} onChangeText={setComboQuantity} placeholder="2" keyboardType="numeric" /><Field label="Giá combo (bỏ trống nếu giảm thường)" value={comboPrice} onChangeText={setComboPrice} placeholder="15000" keyboardType="numeric" /></View><Pressable onPress={savePromotion} style={styles.primaryButton}><MaterialIcons name="local-offer" size={19} color="#FFFFFF" /><Text style={styles.primaryText}>Lưu chương trình</Text></Pressable></View>}
    {message ? <View style={styles.message}><MaterialIcons name="info-outline" size={18} color="#8A5200" /><Text style={styles.messageText}>{message}</Text></View> : null}
    <View style={styles.listCard}><Text style={styles.cardTitle}>{mode === "receipt" ? `Phiếu nhập gần đây (${stockReceipts.length})` : mode === "expiry" ? `Lô sắp hết hạn (${expiring.length})` : mode === "promotion" ? `Khuyến mãi & combo (${promotions.length + comboRules.length})` : `Ca đã chốt (${shifts.length})`}</Text>{mode === "receipt" && stockReceipts.slice(0, 6).map((receipt) => <View key={receipt.id} style={styles.listRow}><View style={styles.rowCopy}><Text style={styles.rowTitle}>{receipt.id} · {receipt.supplierName || "Không rõ nhà cung cấp"}</Text><Text style={styles.rowMeta}>{receipt.items.length} mặt hàng</Text></View><Text style={styles.rowAmount}>{formatVnd(receipt.totalAmount)}</Text></View>)}{mode === "expiry" && expiring.map((batch) => <View key={batch.id} style={styles.listRow}><View style={styles.rowCopy}><Text style={styles.rowTitle}>{products.find((product) => product.id === batch.productId)?.name || "Sản phẩm"}</Text><Text style={styles.rowMeta}>{batch.quantity} đơn vị · Hết hạn {batch.expiresAt}</Text></View></View>)}{mode === "promotion" && promotions.map((promotion) => <View key={promotion.id} style={styles.listRow}><View style={styles.rowCopy}><Text style={styles.rowTitle}>{promotion.name}</Text><Text style={styles.rowMeta}>{promotion.kind === "percent" ? `Giảm ${promotion.value}%` : `Giảm ${formatVnd(promotion.value)}`}</Text></View></View>)}{mode === "promotion" && comboRules.map((combo) => <View key={combo.id} style={styles.listRow}><View style={styles.rowCopy}><Text style={styles.rowTitle}>{combo.name}</Text><Text style={styles.rowMeta}>{combo.requiredQuantity} sản phẩm · {formatVnd(combo.comboPrice)}</Text></View></View>)}{mode === "shift" && shifts.slice(0, 6).map((shift) => <View key={shift.id} style={styles.listRow}><View style={styles.rowCopy}><Text style={styles.rowTitle}>{new Date(shift.closedAt || shift.openedAt).toLocaleDateString("vi-VN")}</Text><Text style={styles.rowMeta}>Dự kiến {formatVnd(shift.expectedCash || 0)} · Thực tế {formatVnd(shift.actualCash || 0)}</Text></View><Text style={[styles.rowAmount, (shift.cashDifference || 0) < 0 && styles.negative]}>{formatVnd(shift.cashDifference || 0)}</Text></View>)}</View>
  </ScrollView></ScreenContainer>;
}

const styles = StyleSheet.create({ blocked: { flex: 1, alignItems: "center", justifyContent: "center", padding: 28, gap: 10 }, blockedTitle: { color: "#1D2A23", fontSize: 20, fontWeight: "900", textAlign: "center" }, blockedText: { color: "#6E7B71", fontSize: 14, lineHeight: 21, textAlign: "center", maxWidth: 520 }, content: { width: "100%", maxWidth: 980, alignSelf: "center", padding: 22, paddingBottom: 42, gap: 16 }, hero: { padding: 20, borderRadius: 22, backgroundColor: "#173B2A", flexDirection: "row", gap: 14, alignItems: "center" }, heroIcon: { width: 50, height: 50, borderRadius: 16, backgroundColor: "#265B40", alignItems: "center", justifyContent: "center" }, heroCopy: { flex: 1, gap: 3 }, kicker: { color: "#A9D7B2", fontSize: 10, fontWeight: "900", letterSpacing: 1 }, title: { color: "#FFFFFF", fontSize: 24, lineHeight: 29, fontWeight: "900" }, subtitle: { color: "#D1E5D4", fontSize: 13, lineHeight: 18 }, modeRow: { flexDirection: "row", gap: 8, flexWrap: "wrap" }, modeButton: { minHeight: 42, paddingHorizontal: 14, borderRadius: 12, backgroundColor: "#E8F1E9", flexDirection: "row", alignItems: "center", gap: 7 }, modeActive: { backgroundColor: "#1F7A4A" }, modeText: { color: "#1F7A4A", fontSize: 13, fontWeight: "900" }, modeTextActive: { color: "#FFFFFF" }, pressed: { opacity: 0.75 }, card: { padding: 19, borderRadius: 18, backgroundColor: "#FFFFFF", borderWidth: 1, borderColor: "#DDE6DE", gap: 12 }, cardTitle: { color: "#1D2A23", fontSize: 17, fontWeight: "900" }, cardHint: { color: "#6E7B71", fontSize: 12, lineHeight: 17 }, label: { color: "#334139", fontSize: 12, fontWeight: "900" }, field: { gap: 5, flex: 1 }, input: { minHeight: 45, borderRadius: 11, borderWidth: 1, borderColor: "#C9D4CB", backgroundColor: "#FFFFFF", color: "#1D2A23", paddingHorizontal: 12, fontSize: 14 }, twoCol: { flexDirection: "row", gap: 10 }, productRow: { gap: 8, paddingVertical: 2 }, productChip: { width: 170, minHeight: 56, padding: 10, borderRadius: 12, borderWidth: 1, borderColor: "#DDE6DE", backgroundColor: "#F8FBF7", gap: 3 }, productChipActive: { borderColor: "#1F7A4A", backgroundColor: "#EAF5EB" }, productChipText: { color: "#45564A", fontSize: 12, fontWeight: "800" }, productChipTextActive: { color: "#1F7A4A" }, productStock: { color: "#829087", fontSize: 10 }, primaryButton: { minHeight: 47, borderRadius: 12, backgroundColor: "#1F7A4A", flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 7 }, primaryText: { color: "#FFFFFF", fontSize: 14, fontWeight: "900" }, message: { padding: 12, borderRadius: 12, backgroundColor: "#FFF7E8", flexDirection: "row", gap: 8, alignItems: "center" }, messageText: { flex: 1, color: "#8A5200", fontSize: 13, fontWeight: "800" }, listCard: { padding: 19, borderRadius: 18, backgroundColor: "#FFFFFF", borderWidth: 1, borderColor: "#DDE6DE", gap: 10 }, listRow: { paddingTop: 11, borderTopWidth: 1, borderTopColor: "#EEF2EE", flexDirection: "row", alignItems: "center", gap: 10 }, rowCopy: { flex: 1, gap: 2 }, rowTitle: { color: "#1D2A23", fontSize: 13, fontWeight: "900" }, rowMeta: { color: "#6E7B71", fontSize: 11 }, rowAmount: { color: "#1F7A4A", fontSize: 12, fontWeight: "900" }, negative: { color: "#B5443E" } });
