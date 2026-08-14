import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { CameraView, type BarcodeScanningResult, useCameraPermissions } from "expo-camera";
import { useState } from "react";
import { Modal, StyleSheet, Text, TouchableOpacity, View } from "react-native";

type Props = { visible: boolean; onClose: () => void; onScanned: (value: string) => void };

export function LanQrScanner({ visible, onClose, onScanned }: Props) {
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);
  function close() { setScanned(false); onClose(); }
  function scan(result: BarcodeScanningResult) { if (scanned) return; setScanned(true); onScanned(result.data); }
  return <Modal visible={visible} animationType="slide" onRequestClose={close}><View style={styles.screen}><View style={styles.header}><TouchableOpacity onPress={close} style={styles.close}><MaterialIcons name="close" size={25} color="#FFFFFF" /></TouchableOpacity><Text style={styles.headerText}>Quét mã kết nối</Text><View style={styles.close} /></View>{!permission ? <View style={styles.center}><Text style={styles.message}>Đang kiểm tra camera…</Text></View> : !permission.granted ? <View style={styles.center}><MaterialIcons name="qr-code-scanner" size={46} color="#E8B04C" /><Text style={styles.title}>Cho phép dùng camera</Text><Text style={styles.message}>Camera chỉ dùng để quét mã QR từ laptop tại quán.</Text><TouchableOpacity onPress={requestPermission} style={styles.button}><Text style={styles.buttonText}>Cho phép camera</Text></TouchableOpacity></View> : <View style={styles.cameraWrap}><CameraView style={styles.camera} facing="back" barcodeScannerSettings={{ barcodeTypes: ["qr"] }} onBarcodeScanned={scanned ? undefined : scan} /><View pointerEvents="none" style={styles.overlay}><View style={styles.frame} /><Text style={styles.hint}>Đưa mã QR của laptop vào trong khung</Text></View></View>}</View></Modal>;
}

const styles = StyleSheet.create({ screen: { flex: 1, backgroundColor: "#101712" }, header: { minHeight: 68, paddingHorizontal: 14, flexDirection: "row", alignItems: "center", justifyContent: "space-between" }, close: { width: 42, height: 42, alignItems: "center", justifyContent: "center" }, headerText: { color: "#FFFFFF", fontSize: 17, fontWeight: "900" }, center: { flex: 1, padding: 28, alignItems: "center", justifyContent: "center", gap: 15 }, title: { color: "#FFFFFF", fontSize: 22, fontWeight: "900" }, message: { color: "#CBD6CD", textAlign: "center", fontSize: 15, lineHeight: 22 }, button: { minHeight: 50, paddingHorizontal: 20, borderRadius: 14, backgroundColor: "#E8B04C", justifyContent: "center" }, buttonText: { color: "#1D2A23", fontSize: 15, fontWeight: "900" }, cameraWrap: { flex: 1 }, camera: { flex: 1 }, overlay: { ...StyleSheet.absoluteFillObject, alignItems: "center", justifyContent: "center", backgroundColor: "rgba(0,0,0,0.25)" }, frame: { width: "70%", aspectRatio: 1, borderWidth: 3, borderColor: "#E8B04C", borderRadius: 22 }, hint: { marginTop: 24, color: "#FFFFFF", fontSize: 15, fontWeight: "800" } });
