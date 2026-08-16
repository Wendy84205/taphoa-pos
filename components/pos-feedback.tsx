import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { Pressable, StyleSheet, Text, View } from "react-native";

const COLORS = {
  ink: "#183026",
  muted: "#6A7B72",
  green: "#176B4D",
  greenSoft: "#E2F2E7",
  border: "#D9E5DC",
  surface: "#FFFFFF",
  danger: "#B5443E",
  dangerSoft: "#FFF0EE",
};

export function CloudGuide({ kicker = "GỢI Ý NHANH", title, text, icon = "lightbulb" as const }: { kicker?: string; title: string; text?: string; icon?: React.ComponentProps<typeof MaterialIcons>["name"] }) {
  return (
    <View style={styles.cloud} accessibilityRole="summary">
      <View style={styles.cloudIcon}><MaterialIcons name={icon} size={18} color={COLORS.green} /></View>
      <View style={styles.cloudCopy}>
        <Text style={styles.cloudKicker}>{kicker}</Text>
        <Text style={styles.cloudTitle}>{title}</Text>
        {text ? <Text style={styles.cloudText}>{text}</Text> : null}
      </View>
      <View style={styles.cloudBadge}><Text style={styles.cloudMeta}>OFFLINE</Text></View>
    </View>
  );
}

export function LoadingState({ label = "Đang tải dữ liệu…" }: { label?: string }) {
  return <View style={styles.state} accessibilityRole="progressbar"><View style={styles.stateIcon}><MaterialIcons name="sync" size={24} color={COLORS.green} /></View><Text style={styles.stateTitle}>{label}</Text><Text style={styles.stateText}>Dữ liệu đang được mở từ bộ nhớ cục bộ.</Text></View>;
}

export function ErrorState({ label = "Không thể tải dữ liệu", detail = "Bạn có thể thử lại hoặc tiếp tục với dữ liệu đang lưu trên máy.", onRetry }: { label?: string; detail?: string; onRetry?: () => void }) {
  return <View style={styles.state} accessibilityRole="alert"><View style={[styles.stateIcon, styles.errorIcon]}><MaterialIcons name="error-outline" size={24} color={COLORS.danger} /></View><Text style={styles.stateTitle}>{label}</Text><Text style={styles.stateText}>{detail}</Text>{onRetry ? <Pressable onPress={onRetry} style={({ pressed }) => [styles.retry, pressed && styles.pressed]} accessibilityRole="button" accessibilityLabel="Thử tải lại dữ liệu" accessibilityHint="Gửi lại yêu cầu tới máy chủ"><MaterialIcons name="refresh" size={16} color="#FFFFFF" /><Text style={styles.retryText}>Thử lại</Text></Pressable> : null}</View>;
}

export function EmptyState({ icon = "inbox" as const, title, text, actionLabel, onAction }: { icon?: React.ComponentProps<typeof MaterialIcons>["name"]; title: string; text: string; actionLabel?: string; onAction?: () => void }) {
  return <View style={styles.state}><View style={styles.stateIcon}><MaterialIcons name={icon} size={24} color={COLORS.green} /></View><Text style={styles.stateTitle}>{title}</Text><Text style={styles.stateText}>{text}</Text>{actionLabel && onAction ? <Pressable onPress={onAction} style={({ pressed }) => [styles.retry, pressed && styles.pressed]} accessibilityRole="button" accessibilityLabel={actionLabel}><Text style={styles.retryText}>{actionLabel}</Text><MaterialIcons name="arrow-forward" size={16} color="#FFFFFF" /></Pressable> : null}</View>;
}

const styles = StyleSheet.create({
  cloud: { marginTop: 4, marginBottom: 14, padding: 12, minHeight: 68, borderRadius: 20, borderWidth: 1, borderColor: "#CFE3D4", backgroundColor: "#EFF8F0", flexDirection: "row", alignItems: "center", gap: 10, shadowColor: "#285C42", shadowOpacity: 0.06, shadowRadius: 12, shadowOffset: { width: 0, height: 5 }, elevation: 2 },
  cloudIcon: { width: 36, height: 36, borderRadius: 13, backgroundColor: "#FFFFFF", alignItems: "center", justifyContent: "center" },
  cloudCopy: { flex: 1, gap: 2 },
  cloudKicker: { color: COLORS.green, fontSize: 8, fontWeight: "900", letterSpacing: 1.1 },
  cloudTitle: { color: COLORS.ink, fontSize: 12, lineHeight: 16, fontWeight: "900" },
  cloudText: { color: "#668074", fontSize: 10, lineHeight: 14 },
  cloudBadge: { paddingHorizontal: 7, paddingVertical: 5, borderRadius: 8, backgroundColor: "#DCEFE2" },
  cloudMeta: { color: COLORS.green, fontSize: 8, fontWeight: "900", letterSpacing: 0.5 },
  state: { padding: 30, minHeight: 210, borderRadius: 24, borderWidth: 1, borderColor: COLORS.border, backgroundColor: COLORS.surface, alignItems: "center", justifyContent: "center", gap: 9, shadowColor: "#183026", shadowOpacity: 0.05, shadowRadius: 18, shadowOffset: { width: 0, height: 8 }, elevation: 2 },
  stateIcon: { width: 60, height: 60, borderRadius: 21, backgroundColor: COLORS.greenSoft, alignItems: "center", justifyContent: "center", marginBottom: 2 },
  errorIcon: { backgroundColor: COLORS.dangerSoft },
  stateTitle: { color: COLORS.ink, fontSize: 17, fontWeight: "900", textAlign: "center" },
  stateText: { color: COLORS.muted, fontSize: 13, lineHeight: 19, textAlign: "center", maxWidth: 420 },
  retry: { minHeight: 44, paddingHorizontal: 16, borderRadius: 13, backgroundColor: COLORS.green, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 7, marginTop: 6 },
  retryText: { color: "#FFFFFF", fontSize: 13, fontWeight: "900" },
  pressed: { opacity: 0.8, transform: [{ scale: 0.98 }] },
});
