import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { Tabs } from "expo-router";
import { StyleSheet } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { HapticTab } from "@/components/haptic-tab";
import { CloudSyncProvider } from "@/lib/cloud-sync-provider";
import { LanSyncProvider } from "@/lib/lan-sync-provider";
import { PosStoreProvider } from "@/lib/pos-store";

function MobileTabs({ bottomPadding }: { bottomPadding: number }) {
  return <Tabs screenOptions={{ headerShown: false, tabBarActiveTintColor: "#1F7A4A", tabBarInactiveTintColor: "#6E7B71", tabBarButton: HapticTab, tabBarLabelStyle: styles.label, tabBarStyle: [styles.bar, { height: 58 + bottomPadding, paddingBottom: bottomPadding }] }}>
    <Tabs.Screen name="index" options={{ title: "Tra giá", tabBarIcon: ({ color }) => <MaterialIcons name="search" size={25} color={color} /> }} />
    <Tabs.Screen name="ban-hang" options={{ title: "Bán hàng", tabBarIcon: ({ color }) => <MaterialIcons name="shopping-cart" size={24} color={color} /> }} />
    <Tabs.Screen name="lich-su" options={{ title: "Hóa đơn", tabBarIcon: ({ color }) => <MaterialIcons name="receipt-long" size={24} color={color} /> }} />
    <Tabs.Screen name="tien-ich" options={{ title: "Tiện ích", tabBarIcon: ({ color }) => <MaterialIcons name="apps" size={24} color={color} /> }} />
    <Tabs.Screen name="san-pham" options={{ href: null }} />
    <Tabs.Screen name="van-hanh" options={{ href: null }} />
    <Tabs.Screen name="bao-cao" options={{ href: null }} />
    <Tabs.Screen name="cong-no" options={{ href: null }} />
    <Tabs.Screen name="ket-noi" options={{ href: null }} />
    <Tabs.Screen name="tai-khoan" options={{ href: null }} />
  </Tabs>;
}

export default function TabLayout() {
  const insets = useSafeAreaInsets();
  const bottomPadding = Math.max(insets.bottom, 8);

  return <PosStoreProvider><CloudSyncProvider><LanSyncProvider><MobileTabs bottomPadding={bottomPadding} /></LanSyncProvider></CloudSyncProvider></PosStoreProvider>;
}

const styles = StyleSheet.create({ bar: { borderTopWidth: 1, borderTopColor: "#DFE5DF", backgroundColor: "#FFFFFF", paddingTop: 7 }, label: { fontSize: 11, fontWeight: "700" } });
