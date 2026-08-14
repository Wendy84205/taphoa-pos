import { ScrollView, StyleSheet, Text, View } from "react-native";

import { formatVnd } from "@/lib/pos-calculations";
import type { RevenueBucket } from "@/lib/reporting";

export function RevenueChart({ buckets }: { buckets: RevenueBucket[] }) {
  const maximum = Math.max(...buckets.map((bucket) => bucket.revenue), 1);
  const hasRevenue = buckets.some((bucket) => bucket.revenue > 0);

  return <View style={styles.wrapper}><View style={styles.scale}><Text style={styles.scaleText}>{hasRevenue ? formatVnd(maximum) : "Chưa có doanh thu"}</Text><Text style={styles.scaleText}>0đ</Text></View><ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.scroll}><View style={styles.chart}>{buckets.map((bucket) => <View key={bucket.key} style={styles.column}><View style={styles.barArea}><View style={[styles.bar, { height: hasRevenue ? Math.max(6, (bucket.revenue / maximum) * 122) : 5 }, bucket.revenue > 0 && styles.barActive]} /></View><Text numberOfLines={1} style={styles.label}>{bucket.label}</Text><Text style={styles.orders}>{bucket.orderCount || "–"}</Text></View>)}</View></ScrollView><Text style={styles.caption}>Cột thể hiện doanh thu; số bên dưới là số hóa đơn trong kỳ.</Text></View>;
}

const styles = StyleSheet.create({ wrapper: { gap: 8 }, scale: { flexDirection: "row", justifyContent: "space-between", paddingHorizontal: 2 }, scaleText: { color: "#6E7B71", fontSize: 11, fontWeight: "700" }, scroll: { paddingHorizontal: 2 }, chart: { height: 166, minWidth: 480, flexDirection: "row", alignItems: "flex-end", justifyContent: "space-between", gap: 12, paddingTop: 2 }, column: { flex: 1, minWidth: 46, alignItems: "center", gap: 5 }, barArea: { height: 124, width: "100%", borderBottomWidth: 1, borderBottomColor: "#D9E2DA", justifyContent: "flex-end", alignItems: "center" }, bar: { width: "62%", maxWidth: 36, borderTopLeftRadius: 8, borderTopRightRadius: 8, backgroundColor: "#D8E8DB" }, barActive: { backgroundColor: "#1F7A4A" }, label: { color: "#526158", fontSize: 11, fontWeight: "800", textAlign: "center" }, orders: { color: "#8B968E", fontSize: 10, lineHeight: 11 }, caption: { color: "#6E7B71", fontSize: 12, lineHeight: 17 } });
