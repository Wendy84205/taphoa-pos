import { Link, Slot, usePathname } from "expo-router";
import { useMemo } from "react";
import { Platform, Pressable, StyleSheet, Text, View } from "react-native";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";

import { useLanSync } from "@/lib/lan-sync-provider";
import { formatVnd } from "@/lib/pos-calculations";
import { usePosStore } from "@/lib/pos-store";

const NAV_ITEMS = [
  { href: "/", label: "Tra cứu", icon: "search" as const, hint: "F2" },
  { href: "/ban-hang", label: "Bán hàng", icon: "shopping-cart" as const, hint: "F4" },
  { href: "/san-pham", label: "Sản phẩm", icon: "inventory-2" as const },
  { href: "/lich-su", label: "Hóa đơn", icon: "receipt-long" as const },
  { href: "/bao-cao", label: "Báo cáo", icon: "bar-chart" as const },
  { href: "/cong-no", label: "Công nợ", icon: "menu-book" as const },
  { href: "/ket-noi", label: "Kết nối LAN", icon: "wifi" as const },
  { href: "/tai-khoan", label: "Tài khoản", icon: "account-circle" as const },
] as const;

function isToday(value: string) {
  const date = new Date(value);
  const now = new Date();
  return date.getFullYear() === now.getFullYear() && date.getMonth() === now.getMonth() && date.getDate() === now.getDate();
}

export function WebShell() {
  const pathname = usePathname();
  const { orders, products, cart } = usePosStore();
  const { connection, syncing } = useLanSync();
  const todayRevenue = useMemo(() => orders.filter((order) => isToday(order.createdAt)).reduce((sum, order) => sum + order.totalAmount, 0), [orders]);
  const lowStockCount = products.filter((product) => product.stockQuantity <= product.lowStockThreshold).length;
  const isConnected = Boolean(connection);

  if (Platform.OS !== "web") return <Slot />;

  return (
    <View style={styles.shell}>
      <View style={styles.sidebar}>
        <View style={styles.brandBlock}>
          <View style={styles.brandIcon}><MaterialIcons name="storefront" size={23} color="#F2C14E" /></View>
          <View><Text style={styles.brandKicker}>TẠP HÓA</Text><Text style={styles.brandTitle}>POS</Text></View>
        </View>
        <View style={styles.shiftCard}>
          <View style={styles.shiftTop}><Text style={styles.shiftLabel}>CA HÔM NAY</Text><View style={styles.liveDot} /></View>
          <Text style={styles.shiftValue}>{formatVnd(todayRevenue)}</Text>
          <Text style={styles.shiftMeta}>{orders.filter((order) => isToday(order.createdAt)).length} hóa đơn đã lưu</Text>
        </View>
        <Text style={styles.navHeading}>VẬN HÀNH</Text>
        <View style={styles.navList}>
          {NAV_ITEMS.map((item) => {
            const active = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
            return <Link key={item.href} href={item.href as any} asChild><Pressable style={({ pressed }) => [styles.navItem, active && styles.navItemActive, pressed && styles.navItemPressed]}><MaterialIcons name={item.icon} size={20} color={active ? "#FFFFFF" : "#B8D0BF"} /><Text style={[styles.navLabel, active && styles.navLabelActive]}>{item.label}</Text>{"hint" in item && item.hint ? <Text style={[styles.navHint, active && styles.navHintActive]}>{item.hint}</Text> : null}{item.label === "Sản phẩm" && lowStockCount > 0 ? <View style={styles.navBadge}><Text style={styles.navBadgeText}>{lowStockCount}</Text></View> : null}</Pressable></Link>;
          })}
        </View>
        <View style={styles.sidebarBottom}>
          <View style={styles.syncRow}><View style={[styles.syncDot, isConnected && styles.syncDotOnline]} /><Text style={styles.syncText}>{syncing ? "Đang đồng bộ…" : isConnected ? "Đã nối laptop LAN" : "Lưu trên máy này"}</Text></View>
          <Text style={styles.sidebarNote}>Offline-first · dữ liệu cục bộ</Text>
        </View>
      </View>
      <View style={styles.mainColumn}>
        <View style={styles.topbar}>
          <View><Text style={styles.eyebrow}>QUẦY BÁN HÀNG</Text><Text style={styles.pageContext}>{NAV_ITEMS.find((item) => item.href === pathname)?.label ?? "Tạp Hóa POS"}</Text></View>
          <View style={styles.topActions}>
            <Link href="/" asChild><Pressable style={styles.topAction}><MaterialIcons name="qr-code-scanner" size={18} color="#1F7A4A" /><Text style={styles.topActionText}>Quét mã</Text></Pressable></Link>
            <Link href="/san-pham" asChild><Pressable style={styles.topAction}><MaterialIcons name="add-box" size={18} color="#1F7A4A" /><Text style={styles.topActionText}>Thêm hàng</Text></Pressable></Link>
            <Link href="/ban-hang" asChild><Pressable style={styles.cartAction}><MaterialIcons name="shopping-cart" size={18} color="#FFFFFF" /><Text style={styles.cartActionText}>Giỏ hàng</Text>{cart.length > 0 ? <View style={styles.cartBadge}><Text style={styles.cartBadgeText}>{cart.length}</Text></View> : null}</Pressable></Link>
          </View>
        </View>
        <View style={styles.content}><Slot /></View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  shell: { flex: 1, flexDirection: "row", backgroundColor: "#F4F6F1", minHeight: "100%" },
  sidebar: { width: 248, backgroundColor: "#173B2A", paddingHorizontal: 18, paddingTop: 28, paddingBottom: 22, justifyContent: "flex-start" },
  brandBlock: { flexDirection: "row", alignItems: "center", gap: 11, paddingHorizontal: 9, marginBottom: 26 },
  brandIcon: { width: 42, height: 42, borderRadius: 13, backgroundColor: "#265B40", alignItems: "center", justifyContent: "center" },
  brandKicker: { color: "#B8D0BF", fontSize: 10, fontWeight: "900", letterSpacing: 1.6 },
  brandTitle: { color: "#FFFFFF", fontSize: 24, fontWeight: "900", letterSpacing: 0.3, lineHeight: 27 },
  shiftCard: { backgroundColor: "#265B40", borderRadius: 16, padding: 15, marginBottom: 28 },
  shiftTop: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  shiftLabel: { color: "#B8D0BF", fontSize: 10, fontWeight: "900", letterSpacing: 1.1 },
  liveDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: "#F2C14E" },
  shiftValue: { color: "#FFFFFF", fontSize: 25, fontWeight: "900", marginTop: 8 },
  shiftMeta: { color: "#CFE4D3", fontSize: 12, marginTop: 3 },
  navHeading: { color: "#7FA98B", fontSize: 10, fontWeight: "900", letterSpacing: 1.1, paddingHorizontal: 11, marginBottom: 8 },
  navList: { gap: 5 },
  navItem: { minHeight: 45, borderRadius: 12, paddingHorizontal: 11, flexDirection: "row", alignItems: "center", gap: 12 },
  navItemActive: { backgroundColor: "#2D8955" },
  navItemPressed: { opacity: 0.75 },
  navLabel: { flex: 1, color: "#B8D0BF", fontSize: 14, fontWeight: "700" },
  navLabelActive: { color: "#FFFFFF", fontWeight: "900" },
  navHint: { color: "#6F9680", fontSize: 10, fontWeight: "800" },
  navHintActive: { color: "#D8F0DC" },
  navBadge: { minWidth: 20, height: 20, borderRadius: 10, backgroundColor: "#E8B04C", alignItems: "center", justifyContent: "center" },
  navBadgeText: { color: "#3C2D12", fontSize: 11, fontWeight: "900" },
  sidebarBottom: { marginTop: "auto", paddingHorizontal: 9, paddingTop: 18, borderTopWidth: 1, borderTopColor: "#2C5A40" },
  syncRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  syncDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: "#F2C14E" },
  syncDotOnline: { backgroundColor: "#72D58C" },
  syncText: { color: "#D7E9D9", fontSize: 12, fontWeight: "800" },
  sidebarNote: { color: "#7FA98B", fontSize: 11, marginTop: 7 },
  mainColumn: { flex: 1, minWidth: 0 },
  topbar: { minHeight: 80, paddingHorizontal: 32, paddingVertical: 16, backgroundColor: "#FFFFFF", borderBottomWidth: 1, borderBottomColor: "#DDE6DE", flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  eyebrow: { color: "#6C7D70", fontSize: 10, fontWeight: "900", letterSpacing: 1.1 },
  pageContext: { color: "#1D2A23", fontSize: 24, fontWeight: "900", marginTop: 2 },
  topActions: { flexDirection: "row", alignItems: "center", gap: 9 },
  topAction: { minHeight: 42, paddingHorizontal: 12, borderWidth: 1, borderColor: "#DDE6DE", borderRadius: 11, backgroundColor: "#F7FAF6", flexDirection: "row", alignItems: "center", gap: 7 },
  topActionText: { color: "#345040", fontSize: 12, fontWeight: "800" },
  cartAction: { minHeight: 42, paddingHorizontal: 13, borderRadius: 11, backgroundColor: "#1F7A4A", flexDirection: "row", alignItems: "center", gap: 7 },
  cartActionText: { color: "#FFFFFF", fontSize: 12, fontWeight: "900" },
  cartBadge: { minWidth: 20, height: 20, paddingHorizontal: 5, borderRadius: 10, backgroundColor: "#F2C14E", alignItems: "center", justifyContent: "center" },
  cartBadgeText: { color: "#3C2D12", fontSize: 11, fontWeight: "900" },
  content: { flex: 1, minWidth: 0 },
});
