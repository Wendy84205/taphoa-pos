import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { CameraView, type BarcodeScanningResult, useCameraPermissions } from "expo-camera";
import { useState } from "react";
import { Modal, StyleSheet, Text, TouchableOpacity, View } from "react-native";

type Props = { visible: boolean; onClose: () => void; onScanned: (barcode: string) => void };

export function BarcodeScannerModal({ visible, onClose, onScanned }: Props) {
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);

  function handleScanned(result: BarcodeScanningResult) {
    if (scanned) return;
    setScanned(true);
    onScanned(result.data);
  }

  function close() {
    setScanned(false);
    onClose();
  }

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={close}>
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={close} style={styles.closeButton}><MaterialIcons name="close" size={26} color="#FFFFFF" /></TouchableOpacity>
          <Text style={styles.headerText}>Quét mã vạch</Text>
          <View style={styles.closeButton} />
        </View>
        {!permission ? <View style={styles.permission}><Text style={styles.title}>Đang kiểm tra camera…</Text></View> : !permission.granted ? <View style={styles.permission}><MaterialIcons name="photo-camera" size={44} color="#E8B04C" /><Text style={styles.title}>Cho phép dùng camera</Text><Text style={styles.explain}>Camera chỉ được dùng để nhận diện mã vạch sản phẩm.</Text><TouchableOpacity onPress={requestPermission} style={styles.allowButton}><Text style={styles.allowText}>Cho phép camera</Text></TouchableOpacity></View> : <View style={styles.cameraArea}><CameraView style={styles.camera} facing="back" barcodeScannerSettings={{ barcodeTypes: ["ean13", "ean8", "upc_a", "upc_e", "code128", "code39"] }} onBarcodeScanned={scanned ? undefined : handleScanned} /><View pointerEvents="none" style={styles.overlay}><View style={styles.frame} /><Text style={styles.hint}>Đưa mã vạch vào trong khung</Text></View></View>}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#101712" }, header: { minHeight: 68, paddingHorizontal: 14, flexDirection: "row", justifyContent: "space-between", alignItems: "center" }, closeButton: { width: 44, height: 44, borderRadius: 22, justifyContent: "center", alignItems: "center" }, headerText: { color: "#FFFFFF", fontSize: 17, fontWeight: "800" }, cameraArea: { flex: 1, justifyContent: "center" }, camera: { flex: 1 }, overlay: { ...StyleSheet.absoluteFillObject, alignItems: "center", justifyContent: "center", backgroundColor: "rgba(0,0,0,0.24)" }, frame: { width: "78%", aspectRatio: 1.9, borderRadius: 18, borderWidth: 3, borderColor: "#E8B04C", backgroundColor: "rgba(0,0,0,0.08)" }, hint: { marginTop: 24, color: "#FFFFFF", fontSize: 16, fontWeight: "700" }, permission: { flex: 1, padding: 32, justifyContent: "center", alignItems: "center", gap: 16 }, title: { color: "#FFFFFF", fontSize: 22, fontWeight: "900", textAlign: "center" }, explain: { color: "#C7D0C9", fontSize: 15, lineHeight: 22, textAlign: "center" }, allowButton: { minHeight: 50, backgroundColor: "#E8B04C", paddingHorizontal: 22, justifyContent: "center", borderRadius: 14, marginTop: 6 }, allowText: { color: "#1D2A23", fontSize: 16, fontWeight: "900" },
});
