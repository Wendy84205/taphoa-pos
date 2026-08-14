import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { Tabs } from "expo-router";
import { Platform, StyleSheet } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { HapticTab } from "@/components/haptic-tab";
import { PosStoreProvider } from "@/lib/pos-store";

export default function TabLayout() {
  const insets = useSafeAreaInsets();
  const bottomPadding = Platform.OS === "web" ? 10 : Math.max(insets.bottom, 8);

  return (
    <PosStoreProvider>
      <Tabs screenOptions={{ headerShown: false, tabBarActiveTintColor: "#1F7A4A", tabBarInactiveTintColor: "#6E7B71", tabBarButton: HapticTab, tabBarLabelStyle: styles.label, tabBarStyle: [styles.bar, { height: 58 + bottomPadding, paddingBottom: bottomPadding }] }}>
        <Tabs.Screen name="index" options={{ title: "Tra cứu", tabBarIcon: ({ color }) => <MaterialIcons name="search" size={25} color={color} /> }} />
        <Tabs.Screen name="ban-hang" options={{ title: "Bán hàng", tabBarIcon: ({ color }) => <MaterialIcons name="shopping-cart" size={24} color={color} /> }} />
        <Tabs.Screen name="san-pham" options={{ title: "Sản phẩm", tabBarIcon: ({ color }) => <MaterialIcons name="inventory-2" size={23} color={color} /> }} />
        <Tabs.Screen name="lich-su" options={{ title: "Hóa đơn", tabBarIcon: ({ color }) => <MaterialIcons name="receipt-long" size={24} color={color} /> }} />
        <Tabs.Screen name="bao-cao" options={{ title: "Báo cáo", tabBarIcon: ({ color }) => <MaterialIcons name="bar-chart" size={24} color={color} /> }} />
      </Tabs>
    </PosStoreProvider>
  );
}

const styles = StyleSheet.create({ bar: { borderTopWidth: 1, borderTopColor: "#DFE5DF", backgroundColor: "#FFFFFF", paddingTop: 7 }, label: { fontSize: 11, fontWeight: "700" } });
