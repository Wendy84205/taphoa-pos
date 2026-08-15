import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { router } from "expo-router";
import { FlatList, Pressable, StyleSheet, Text, View } from "react-native";

import { ScreenContainer } from "@/components/screen-container";
import { isLowStock } from "@/lib/pos-calculations";
import { usePosStore } from "@/lib/pos-store";

type UtilityItem = {
  title: string;
  description: string;
  icon: React.ComponentProps<typeof MaterialIcons>["name"];
  href: string;
  tone: "green" | "orange" | "blue" | "ink";
};

const utilities: { title: string; items: UtilityItem[] }[] = [
  {
    title: "Hàng hóa",
    items: [
      { title: "Sản phẩm", description: "Giá, tồn, ảnh nhận diện", icon: "inventory-2", href: "/(tabs)/san-pham", tone: "green" },
      { title: "Nhập & vận hành", description: "Nhập hàng, hạn dùng, khuyến mãi", icon: "local-shipping", href: "/(tabs)/van-hanh", tone: "orange" },
    ],
  },
  {
    title: "Quản lý quán",
    items: [
      { title: "Công nợ", description: "Khách quen và nhà cung cấp", icon: "menu-book", href: "/(tabs)/cong-no", tone: "orange" },
      { title: "Báo cáo", description: "Doanh thu, hàng bán chạy", icon: "bar-chart", href: "/(tabs)/bao-cao", tone: "blue" },
      { title: "Kết nối", description: "Đồng bộ và thiết bị quầy", icon: "wifi", href: "/(tabs)/ket-noi", tone: "ink" },
      { title: "Tài khoản", description: "Nhân viên, sao lưu, cài đặt", icon: "manage-accounts", href: "/(tabs)/tai-khoan", tone: "ink" },
    ],
  },
];

export default function UtilitiesScreen() {
  const { products, orders, cart } = usePosStore();
  const lowStockCount = products.filter(isLowStock).length;
  const pendingCopy = lowStockCount ? `${lowStockCount} mặt hàng sắp hết` : cart.length ? `${cart.length} dòng đang trong giỏ` : orders.length ? "Quầy đã sẵn sàng bán" : "Bắt đầu bằng tra giá một sản phẩm";

  return (
    <ScreenContainer edges={["top", "left", "right"]}>
      <FlatList
        data={utilities}
        keyExtractor={(section) => section.title}
        contentContainerStyle={styles.list}
        ListHeaderComponent={
          <View style={styles.header}>
            <Text style={styles.eyebrow}>KHU QUẢN LÝ</Text>
            <Text style={styles.title}>Tiện ích quán</Text>
            <Text style={styles.subtitle}>Các việc không cần làm ngay tại quầy được sắp gọn ở đây.</Text>
            <Pressable onPress={() => router.push("/(tabs)" as never)} style={({ pressed }) => [styles.primaryShortcut, pressed && styles.pressed]}>
              <MaterialIcons name="search" size={21} color="#FFFFFF" />
              <View style={styles.shortcutCopy}><Text style={styles.shortcutTitle}>Quay lại tra giá</Text><Text style={styles.shortcutSub}>{pendingCopy}</Text></View>
              <MaterialIcons name="arrow-forward" size={20} color="#FFFFFF" />
            </Pressable>
          </View>
        }
        renderItem={({ item: section }) => (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{section.title}</Text>
            <View style={styles.grid}>
              {section.items.map((item) => (
                <Pressable key={item.title} onPress={() => router.push(item.href as never)} style={({ pressed }) => [styles.card, pressed && styles.pressed]} accessibilityRole="button" accessibilityLabel={`${item.title}. ${item.description}`}>
                  <View style={[styles.icon, styles[`icon${item.tone[0].toUpperCase()}${item.tone.slice(1)}` as keyof typeof styles] as object]}><MaterialIcons name={item.icon} size={22} color={item.tone === "orange" ? "#A95F11" : item.tone === "blue" ? "#266796" : item.tone === "ink" ? "#32453A" : "#176B4D"} /></View>
                  <Text style={styles.cardTitle}>{item.title}</Text>
                  <Text numberOfLines={2} style={styles.cardDescription}>{item.description}</Text>
                </Pressable>
              ))}
            </View>
          </View>
        )}
      />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  list: { padding: 20, paddingBottom: 34, gap: 24 },
  header: { gap: 7, paddingBottom: 2 },
  eyebrow: { color: "#176B4D", fontSize: 10, letterSpacing: 1.2, fontWeight: "900" },
  title: { color: "#18231E", fontSize: 30, lineHeight: 36, fontWeight: "900" },
  subtitle: { color: "#607268", fontSize: 14, lineHeight: 20, maxWidth: 310 },
  primaryShortcut: { marginTop: 13, minHeight: 76, borderRadius: 18, paddingHorizontal: 16, backgroundColor: "#176B4D", flexDirection: "row", alignItems: "center", gap: 11 },
  shortcutCopy: { flex: 1, gap: 2 },
  shortcutTitle: { color: "#FFFFFF", fontSize: 16, fontWeight: "900" },
  shortcutSub: { color: "#CBE9D8", fontSize: 12, fontWeight: "700" },
  section: { gap: 10 },
  sectionTitle: { color: "#18231E", fontSize: 17, fontWeight: "900" },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  card: { width: "48%", minHeight: 148, padding: 14, borderRadius: 18, backgroundColor: "#FFFFFF", borderColor: "#DCE5DD", borderWidth: 1, gap: 7 },
  icon: { width: 40, height: 40, borderRadius: 13, alignItems: "center", justifyContent: "center" },
  iconGreen: { backgroundColor: "#DDEFE5" },
  iconOrange: { backgroundColor: "#FFF0D4" },
  iconBlue: { backgroundColor: "#E6F2F8" },
  iconInk: { backgroundColor: "#EAF0EB" },
  cardTitle: { color: "#18231E", fontSize: 15, fontWeight: "900" },
  cardDescription: { color: "#66776D", fontSize: 11, lineHeight: 16, fontWeight: "600" },
  pressed: { opacity: 0.74, transform: [{ scale: 0.98 }] },
});
