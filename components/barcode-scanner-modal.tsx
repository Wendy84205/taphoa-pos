import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { CameraView, type BarcodeScanningResult, type BarcodeType, useCameraPermissions } from "expo-camera";
import { useCallback, useEffect, useRef, useState } from "react";
import { BackHandler, Linking, Modal, Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { normalizeBarcode, shouldAcceptBarcodeScan } from "@/lib/barcode-lookup";

type Props = { visible: boolean; onClose: () => void; onScanned: (barcode: string) => void };
const BARCODE_TYPES: BarcodeType[] = ["ean13", "ean8", "upc_a", "upc_e", "code128", "code93", "code39", "itf14", "codabar"];

export function BarcodeScannerModal({ visible, onClose, onScanned }: Props) {
  const cameraRef = useRef<CameraView>(null);
  const scannedRef = useRef(false);
  const [permission, requestPermission] = useCameraPermissions();
  const insets = useSafeAreaInsets();
  const [scanned, setScanned] = useState(false);
  const [manualBarcode, setManualBarcode] = useState("");
  const [cameraError, setCameraError] = useState<string | null>(null);

  const close = useCallback(() => {
    scannedRef.current = false;
    setScanned(false);
    setManualBarcode("");
    void cameraRef.current?.pausePreview();
    onClose();
  }, [onClose]);

  useEffect(() => {
    scannedRef.current = false;
    setScanned(false);
    setManualBarcode("");
    setCameraError(null);
    const camera = cameraRef.current;
    if (!visible) {
      void camera?.pausePreview();
      return;
    }
    const subscription = BackHandler.addEventListener("hardwareBackPress", () => {
      close();
      return true;
    });
    return () => {
      subscription.remove();
      void camera?.pausePreview();
    };
  }, [close, visible]);

  function finishScan(raw: unknown) {
    if (!shouldAcceptBarcodeScan(scannedRef.current, raw)) return;
    const barcode = normalizeBarcode(raw);
    if (!barcode) return;
    scannedRef.current = true;
    setScanned(true);
    void cameraRef.current?.pausePreview();
    onScanned(barcode);
  }

  if (!visible) return null;

  return <Modal visible animationType="slide" onRequestClose={close} presentationStyle="fullScreen" statusBarTranslucent>
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: Math.max(insets.top, 12) }]}>
        <Pressable onPress={close} style={({ pressed }) => [styles.iconButton, pressed && styles.pressed]} accessibilityRole="button" accessibilityLabel="Đóng quét mã vạch"><MaterialIcons name="close" size={26} color="#FFFFFF" /></Pressable>
        <View style={styles.headerCopy}><Text style={styles.headerTitle}>Quét mã vạch</Text><Text style={styles.headerSub}>Tra trong hàng hóa của quán</Text></View>
        <View style={styles.iconButton} />
      </View>
      {!permission ? <StatePanel icon="photo-camera" title="Đang kiểm tra camera…" detail="Vui lòng đợi trong giây lát." /> : !permission.granted ? <StatePanel icon="photo-camera" title="Cho phép dùng camera" detail="Camera chỉ được dùng để quét mã vạch sản phẩm." primaryLabel="Cho phép camera" onPrimary={requestPermission} secondaryLabel={!permission.canAskAgain ? "Mở Cài đặt thiết bị" : "Nhập mã thủ công"} onSecondary={!permission.canAskAgain ? () => Linking.openSettings() : () => setCameraError("manual")} /> : cameraError === "manual" ? <ManualPanel value={manualBarcode} onChange={setManualBarcode} onSubmit={() => finishScan(manualBarcode)} scanned={scanned} bottomInset={insets.bottom} onCamera={() => setCameraError(null)} /> : cameraError ? <StatePanel icon="error-outline" title="Không thể mở camera" detail={cameraError} primaryLabel="Thử lại" onPrimary={() => setCameraError(null)} secondaryLabel="Nhập mã thủ công" onSecondary={() => setCameraError("manual")} /> : <>
        <View style={styles.cameraArea}>
          <CameraView ref={cameraRef} style={styles.camera} facing="back" barcodeScannerSettings={{ barcodeTypes: BARCODE_TYPES }} onBarcodeScanned={scanned ? undefined : (result: BarcodeScanningResult) => finishScan(result.data)} onMountError={(event) => setCameraError(event.message || "Thiết bị không hỗ trợ camera quét mã.")} />
          <View pointerEvents="none" style={styles.overlay}><View style={styles.frame} /><View style={styles.hint}><MaterialIcons name="center-focus-strong" size={17} color="#FFFFFF" /><Text style={styles.hintText}>{scanned ? "Đang tra sản phẩm…" : "Đưa mã vạch vào trong khung"}</Text></View></View>
        </View>
        <ManualPanel value={manualBarcode} onChange={setManualBarcode} onSubmit={() => finishScan(manualBarcode)} scanned={scanned} bottomInset={insets.bottom} />
      </>}
    </View>
  </Modal>;
}

function StatePanel({ icon, title, detail, primaryLabel, onPrimary, secondaryLabel, onSecondary }: { icon: keyof typeof MaterialIcons.glyphMap; title: string; detail: string; primaryLabel?: string; onPrimary?: () => void | Promise<unknown>; secondaryLabel?: string; onSecondary?: () => void }) {
  return <View style={styles.state}><View style={styles.stateIcon}><MaterialIcons name={icon} size={37} color="#E8B04C" /></View><Text style={styles.stateTitle}>{title}</Text><Text style={styles.stateDetail}>{detail}</Text>{primaryLabel && onPrimary ? <Pressable onPress={onPrimary} style={({ pressed }) => [styles.primaryButton, pressed && styles.pressed]} accessibilityRole="button"><Text style={styles.primaryText}>{primaryLabel}</Text></Pressable> : null}{secondaryLabel && onSecondary ? <Pressable onPress={onSecondary} style={styles.secondaryAction} accessibilityRole="button"><Text style={styles.secondaryText}>{secondaryLabel}</Text></Pressable> : null}</View>;
}

function ManualPanel({ value, onChange, onSubmit, scanned, bottomInset, onCamera }: { value: string; onChange: (value: string) => void; onSubmit: () => void; scanned: boolean; bottomInset: number; onCamera?: () => void }) {
  return <View style={[styles.manualPanel, { paddingBottom: Math.max(bottomInset, 14) }]}><Text style={styles.manualTitle}>{onCamera ? "Nhập mã vạch" : "Không đọc được mã?"}</Text><Text style={styles.manualHint}>Nhập mã EAN hoặc Code128 in dưới vạch mã.</Text><View style={styles.manualRow}><TextInput value={value} onChangeText={onChange} onSubmitEditing={onSubmit} autoCapitalize="none" autoCorrect={false} returnKeyType="search" placeholder="Nhập mã vạch" placeholderTextColor="#89958D" style={styles.manualInput} accessibilityLabel="Nhập mã vạch thủ công" /><Pressable onPress={onSubmit} disabled={scanned || !normalizeBarcode(value)} style={({ pressed }) => [styles.searchButton, (scanned || !normalizeBarcode(value)) && styles.disabled, pressed && styles.pressed]} accessibilityRole="button" accessibilityLabel="Tra cứu mã vạch đã nhập"><MaterialIcons name="search" size={20} color="#1D2A23" /></Pressable></View>{onCamera ? <Pressable onPress={onCamera} style={styles.secondaryAction} accessibilityRole="button"><Text style={styles.secondaryText}>Quay lại camera</Text></Pressable> : null}</View>;
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#101712" }, header: { minHeight: 76, paddingHorizontal: 14, paddingBottom: 10, flexDirection: "row", alignItems: "center", gap: 8 }, iconButton: { width: 44, height: 44, borderRadius: 22, alignItems: "center", justifyContent: "center" }, headerCopy: { flex: 1 }, headerTitle: { color: "#FFFFFF", fontSize: 17, fontWeight: "900" }, headerSub: { color: "#C7D0C9", fontSize: 11, fontWeight: "700", marginTop: 2 }, cameraArea: { flex: 1 }, camera: { flex: 1 }, overlay: { ...StyleSheet.absoluteFillObject, alignItems: "center", justifyContent: "center", backgroundColor: "rgba(0,0,0,0.24)" }, frame: { width: "80%", aspectRatio: 1.9, borderRadius: 18, borderWidth: 3, borderColor: "#E8B04C" }, hint: { marginTop: 21, paddingVertical: 8, paddingHorizontal: 13, borderRadius: 15, backgroundColor: "rgba(0,0,0,0.45)", flexDirection: "row", alignItems: "center", gap: 7 }, hintText: { color: "#FFFFFF", fontSize: 13, fontWeight: "800" }, manualPanel: { paddingHorizontal: 16, paddingTop: 13, backgroundColor: "#101712", gap: 5 }, manualTitle: { color: "#D5DED7", fontSize: 13, fontWeight: "900" }, manualHint: { color: "#AEBBB2", fontSize: 11, lineHeight: 16 }, manualRow: { flexDirection: "row", gap: 8, marginTop: 4 }, manualInput: { flex: 1, minHeight: 48, borderRadius: 12, paddingHorizontal: 14, backgroundColor: "#FFFFFF", color: "#1D2A23", fontSize: 16 }, searchButton: { width: 50, minHeight: 48, borderRadius: 12, alignItems: "center", justifyContent: "center", backgroundColor: "#E8B04C" }, state: { flex: 1, padding: 32, justifyContent: "center", alignItems: "center", gap: 14 }, stateIcon: { width: 76, height: 76, borderRadius: 24, backgroundColor: "rgba(232,176,76,0.14)", justifyContent: "center", alignItems: "center" }, stateTitle: { color: "#FFFFFF", fontSize: 22, fontWeight: "900", textAlign: "center" }, stateDetail: { maxWidth: 320, color: "#C7D0C9", fontSize: 15, lineHeight: 22, textAlign: "center" }, primaryButton: { minHeight: 50, backgroundColor: "#E8B04C", paddingHorizontal: 22, justifyContent: "center", borderRadius: 14, marginTop: 5 }, primaryText: { color: "#1D2A23", fontSize: 16, fontWeight: "900" }, secondaryAction: { minHeight: 36, paddingHorizontal: 8, justifyContent: "center", alignItems: "center", marginTop: 3 }, secondaryText: { color: "#F1C66D", fontSize: 13, fontWeight: "900" }, disabled: { opacity: 0.45 }, pressed: { opacity: 0.75, transform: [{ scale: 0.98 }] },
});
