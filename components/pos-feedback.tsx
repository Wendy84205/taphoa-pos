import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { Pressable, StyleSheet, Text, View } from "react-native";

export function CloudGuide({ kicker = "GỢI Ý NHANH", title, text, icon = "lightbulb" as const }: { kicker?: string; title: string; text?: string; icon?: React.ComponentProps<typeof MaterialIcons>["name"] }) {
  return <View style={styles.cloud}><View style={styles.cloudIcon}><MaterialIcons name={icon} size={18} color="#1F7A4A" /></View><View style={styles.cloudCopy}><Text style={styles.cloudKicker}>{kicker}</Text><Text style={styles.cloudTitle}>{title}</Text>{text ? <Text style={styles.cloudText}>{text}</Text> : null}</View><Text style={styles.cloudMeta}>Offline-first</Text></View>;
}

export function LoadingState({ label = "Đang tải dữ liệu…" }: { label?: string }) {
  return <View style={styles.state}><View style={styles.stateIcon}><MaterialIcons name="sync" size={24} color="#1F7A4A" /></View><Text style={styles.stateTitle}>{label}</Text><Text style={styles.stateText}>Dữ liệu đang được mở từ bộ nhớ cục bộ.</Text></View>;
}

export function ErrorState({ label = "Không thể tải dữ liệu", detail = "Bạn có thể thử lại hoặc tiếp tục với dữ liệu đang lưu trên máy.", onRetry }: { label?: string; detail?: string; onRetry?: () => void }) {
  return <View style={styles.state}><View style={[styles.stateIcon, styles.errorIcon]}><MaterialIcons name="error-outline" size={24} color="#B5443E" /></View><Text style={styles.stateTitle}>{label}</Text><Text style={styles.stateText}>{detail}</Text>{onRetry ? <Pressable onPress={onRetry} style={styles.retry}><MaterialIcons name="refresh" size={16} color="#FFFFFF" /><Text style={styles.retryText}>Thử lại</Text></Pressable> : null}</View>;
}

export function EmptyState({ icon = "inbox" as const, title, text, actionLabel, onAction }: { icon?: React.ComponentProps<typeof MaterialIcons>["name"]; title: string; text: string; actionLabel?: string; onAction?: () => void }) {
  return <View style={styles.state}><View style={styles.stateIcon}><MaterialIcons name={icon} size={24} color="#1F7A4A" /></View><Text style={styles.stateTitle}>{title}</Text><Text style={styles.stateText}>{text}</Text>{actionLabel && onAction ? <Pressable onPress={onAction} style={styles.retry}><Text style={styles.retryText}>{actionLabel}</Text><MaterialIcons name="arrow-forward" size={16} color="#FFFFFF" /></Pressable> : null}</View>;
}

const styles = StyleSheet.create({ cloud: { marginTop: 4, marginBottom: 12, paddingHorizontal: 13, paddingVertical: 10, minHeight: 58, borderRadius: 15, borderWidth: 1, borderColor: "#C8E1CD", backgroundColor: "#EAF5EB", flexDirection: "row", alignItems: "center", gap: 10 }, cloudIcon: { width: 32, height: 32, borderRadius: 11, backgroundColor: "#FFFFFF", alignItems: "center", justifyContent: "center" }, cloudCopy: { flex: 1, gap: 2 }, cloudKicker: { color: "#1F7A4A", fontSize: 8, fontWeight: "900", letterSpacing: 1 }, cloudTitle: { color: "#173B2A", fontSize: 11, lineHeight: 15, fontWeight: "900" }, cloudText: { color: "#6C8873", fontSize: 10, lineHeight: 14 }, cloudMeta: { color: "#6C8873", fontSize: 9, fontWeight: "800" }, state: { padding: 30, minHeight: 190, borderRadius: 18, borderWidth: 1, borderColor: "#DFE5DF", backgroundColor: "#FFFFFF", alignItems: "center", justifyContent: "center", gap: 8 }, stateIcon: { width: 52, height: 52, borderRadius: 18, backgroundColor: "#E5F0E7", alignItems: "center", justifyContent: "center" }, errorIcon: { backgroundColor: "#FFF0EE" }, stateTitle: { color: "#1D2A23", fontSize: 16, fontWeight: "900", textAlign: "center" }, stateText: { color: "#6E7B71", fontSize: 12, lineHeight: 18, textAlign: "center", maxWidth: 420 }, retry: { minHeight: 40, paddingHorizontal: 13, borderRadius: 10, backgroundColor: "#1F7A4A", flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, marginTop: 4 }, retryText: { color: "#FFFFFF", fontSize: 12, fontWeight: "900" } });
