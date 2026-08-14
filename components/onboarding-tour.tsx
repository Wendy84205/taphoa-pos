import AsyncStorage from "@react-native-async-storage/async-storage";
import { usePathname } from "expo-router";
import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import { Dimensions, Modal, Platform, Pressable, StyleSheet, Text, View } from "react-native";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";

const STORAGE_KEY = "taphoa_pos_onboarding_v1";

type TourStep = { kicker: string; title: string; text: string; icon: React.ComponentProps<typeof MaterialIcons>["name"] };

const STEPS: TourStep[] = [
  { kicker: "BƯỚC 1 / TRA GIÁ", title: "Bắt đầu bằng ô tra cứu", text: "Nhập tên hàng hoặc mã vạch để thấy giá, tồn kho và đơn vị bán ngay tại quầy.", icon: "search" },
  { kicker: "BƯỚC 2 / QUẢN LÝ", title: "Các màn hình nằm ở thanh điều hướng", text: "Mở Sản phẩm, Hóa đơn, Báo cáo và Công nợ từ menu bên trái hoặc thanh tab trên điện thoại.", icon: "dashboard" },
  { kicker: "BƯỚC 3 / BÁN HÀNG", title: "Giỏ hàng luôn ở trong tầm tay", text: "Thêm hàng, đổi đơn vị chai/lốc/thùng rồi hoàn tất bằng tiền mặt, chuyển khoản hoặc VietQR.", icon: "shopping-cart" },
  { kicker: "BƯỚC 4 / TỒN KHO", title: "Để cảnh báo nhắc việc cho bạn", text: "Khi hàng chạm ngưỡng thấp, POS đưa cảnh báo lên trang Tra cứu để bạn nhập thêm kịp thời.", icon: "warning" },
  { kicker: "BƯỚC 5 / OFFLINE-FIRST", title: "Mất mạng vẫn bán được", text: "Dữ liệu được giữ trên thiết bị; khi có LAN hoặc cloud, bạn có thể đồng bộ lại từ Tài khoản/Kết nối.", icon: "cloud-done" },
];

type TourContextValue = { replay: () => void };
const TourContext = createContext<TourContextValue | null>(null);

export function useOnboardingTour() {
  const value = useContext(TourContext);
  if (!value) throw new Error("useOnboardingTour must be used inside OnboardingTourProvider");
  return value;
}

function getSpotlight(step: number, width: number, height: number) {
  const wide = width >= 800 || Platform.OS === "web";
  if (wide) {
    const positions = [
      { top: 112, left: 260, width: Math.min(600, width - 320), height: 110 },
      { top: 82, left: 8, width: 240, height: 365 },
      { top: 10, left: Math.max(760, width - 260), width: 245, height: 58 },
      { top: 410, left: 250, width: Math.min(930, width - 290), height: 200 },
      { top: 78, left: 250, width: Math.min(950, width - 290), height: 86 },
    ];
    return positions[step] ?? positions[0];
  }
  const horizontal = Math.max(18, width - 36);
  const positions = [
    { top: 120, left: 18, width: horizontal, height: 110 },
    { top: 80, left: 12, width: horizontal, height: 180 },
    { top: 76, left: width - 150, width: 132, height: 52 },
    { top: Math.min(390, height - 270), left: 18, width: horizontal, height: 150 },
    { top: 90, left: 18, width: horizontal, height: 100 },
  ];
  return positions[step] ?? positions[0];
}

export function OnboardingTourProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [visible, setVisible] = useState(false);
  const [step, setStep] = useState(0);
  const [size, setSize] = useState(() => Dimensions.get("window"));

  useEffect(() => {
    const subscription = Dimensions.addEventListener("change", ({ window }) => setSize(window));
    return () => subscription.remove();
  }, []);

  useEffect(() => {
    if (pathname === "/gioi-thieu" || pathname === "/bang-gia") return;
    AsyncStorage.getItem(STORAGE_KEY).then((seen) => {
      if (!seen) setVisible(true);
    }).catch(() => setVisible(true));
  }, [pathname]);

  const replay = () => {
    setStep(0);
    setVisible(true);
  };

  const close = async () => {
    setVisible(false);
    await AsyncStorage.setItem(STORAGE_KEY, "seen");
  };

  const next = () => {
    if (step >= STEPS.length - 1) {
      void close();
      return;
    }
    setStep((value) => value + 1);
  };

  const spotlight = useMemo(() => getSpotlight(step, size.width, size.height), [step, size]);
  const current = STEPS[step];

  return <TourContext.Provider value={{ replay }}>{children}<Modal visible={visible} transparent animationType="fade" onRequestClose={() => void close()}><View style={styles.overlay}><View pointerEvents="none" style={[styles.spotlight, spotlight]} /><View style={styles.guideCard}><View style={styles.guideHeader}><View style={styles.guideIcon}><MaterialIcons name={current.icon} size={22} color="#1F7A4A" /></View><Text style={styles.guideKicker}>{current.kicker}</Text><Pressable onPress={() => void close()} style={styles.close}><MaterialIcons name="close" size={19} color="#6E7B71" /></Pressable></View><Text style={styles.guideTitle}>{current.title}</Text><Text style={styles.guideText}>{current.text}</Text><View style={styles.guideFooter}><View style={styles.dots}>{STEPS.map((item, index) => <View key={item.kicker} style={[styles.dot, index === step && styles.dotActive]} />)}</View><Pressable onPress={next} style={({ pressed }) => [styles.nextButton, pressed && styles.pressed]}><Text style={styles.nextText}>{step === STEPS.length - 1 ? "Bắt đầu dùng" : "Tiếp theo"}</Text><MaterialIcons name="arrow-forward" size={17} color="#FFFFFF" /></Pressable></View></View></View></Modal></TourContext.Provider>;
}

const styles = StyleSheet.create({ overlay: { flex: 1, backgroundColor: "rgba(10, 28, 18, 0.76)" }, spotlight: { position: "absolute", borderWidth: 2, borderColor: "#F2C14E", borderRadius: 18, backgroundColor: "rgba(242, 193, 78, 0.10)", shadowColor: "#F2C14E", shadowOpacity: 0.9, shadowRadius: 18, shadowOffset: { width: 0, height: 0 }, elevation: 8 }, guideCard: { position: "absolute", left: 18, right: 18, bottom: Platform.OS === "web" ? 26 : 34, maxWidth: 560, alignSelf: "center", padding: 18, borderRadius: 20, backgroundColor: "#FFFFFF", shadowColor: "#000000", shadowOpacity: 0.22, shadowRadius: 24, shadowOffset: { width: 0, height: 8 }, elevation: 12 }, guideHeader: { flexDirection: "row", alignItems: "center", gap: 9 }, guideIcon: { width: 38, height: 38, borderRadius: 13, backgroundColor: "#E9F3EA", alignItems: "center", justifyContent: "center" }, guideKicker: { flex: 1, color: "#1F7A4A", fontSize: 10, fontWeight: "900", letterSpacing: 1 }, close: { width: 34, height: 34, alignItems: "center", justifyContent: "center" }, guideTitle: { color: "#173B2A", fontSize: 21, lineHeight: 27, fontWeight: "900", marginTop: 14 }, guideText: { color: "#5E6D63", fontSize: 14, lineHeight: 20, marginTop: 6 }, guideFooter: { marginTop: 17, flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 12 }, dots: { flexDirection: "row", alignItems: "center", gap: 5 }, dot: { width: 7, height: 7, borderRadius: 4, backgroundColor: "#DDE6DE" }, dotActive: { width: 21, backgroundColor: "#F2C14E" }, nextButton: { minHeight: 42, paddingHorizontal: 13, borderRadius: 11, backgroundColor: "#1F7A4A", flexDirection: "row", alignItems: "center", gap: 6 }, nextText: { color: "#FFFFFF", fontSize: 13, fontWeight: "900" }, pressed: { opacity: 0.78 } });
