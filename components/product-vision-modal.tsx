import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { CameraView, useCameraPermissions } from "expo-camera";
import * as ImagePicker from "expo-image-picker";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { BackHandler, Alert, Image, Linking, Modal, Pressable, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { trpc } from "@/lib/trpc";
import type { Product } from "@/lib/pos-types";
import { rankProductsByVision } from "@/lib/product-vision-match";

type CapturedImage = { uri: string; dataUrl: string };
type Props = { visible: boolean; products: Product[]; onClose: () => void; onProductSelected: (product: Product) => void };

const MAX_IMAGE_DATA_URL_CHARS = 1_600_000;

export function ProductVisionModal({ visible, products, onClose, onProductSelected }: Props) {
  const cameraRef = useRef<CameraView>(null);
  const insets = useSafeAreaInsets();
  const [permission, requestPermission] = useCameraPermissions();
  const [cameraReady, setCameraReady] = useState(false);
  const [captured, setCaptured] = useState<CapturedImage | null>(null);
  const [result, setResult] = useState<VisionResult | null>(null);
  const identify = trpc.vision.identifyProduct.useMutation();

  const suggestedProducts = useMemo(() => {
    if (!result?.usable) return [];
    return rankProductsByVision(result.observation, products).map((match) => ({ match, product: products.find((item) => item.id === match.id) })).filter((item): item is { match: { id: string; confidence: number; reason: string }; product: Product } => Boolean(item.product));
  }, [products, result]);
  const observation = [result?.observation.brand, result?.observation.productName, result?.observation.variant, result?.observation.size].filter(Boolean).join(" · ");

  const close = useCallback(() => {
    identify.reset();
    void cameraRef.current?.pausePreview();
    onClose();
  }, [identify, onClose]);

  useEffect(() => {
    setCameraReady(false);
    if (!visible) {
      setCaptured(null);
      setResult(null);
    }
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

  function setImage(uri: string, base64?: string | null) {
    if (!base64) {
      Alert.alert("Không thể đọc ảnh", "Hãy thử chụp hoặc chọn lại ảnh sản phẩm.");
      return;
    }
    const dataUrl = `data:image/jpeg;base64,${base64}`;
    if (dataUrl.length > MAX_IMAGE_DATA_URL_CHARS) {
      Alert.alert("Ảnh quá lớn", "Hãy chụp gần hơn, chỉ lấy mặt trước bao bì rồi thử lại.");
      return;
    }
    setResult(null);
    setCaptured({ uri, dataUrl });
  }

  async function takePicture() {
    if (!cameraReady || !cameraRef.current) return;
    try {
      const photo = await cameraRef.current.takePictureAsync({ quality: 0.55, base64: true, exif: false, skipProcessing: false });
      setImage(photo.uri, photo.base64);
    } catch {
      Alert.alert("Không thể chụp ảnh", "Hãy giữ máy ổn định rồi thử lại.");
    }
  }

  async function pickImage() {
    const picked = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ["images"], quality: 0.55, base64: true, allowsEditing: false });
    if (!picked.canceled) setImage(picked.assets[0].uri, picked.assets[0].base64);
  }

  async function identifyImage() {
    if (!captured || !products.length) return;
    try {
      const next = await identify.mutateAsync({ imageDataUrl: captured.dataUrl });
      setResult(next);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Không thể nhận diện ảnh lúc này.";
      Alert.alert("Chưa tra được bằng ảnh", message.includes("Ảnh quá lớn") ? message : "Kiểm tra mạng rồi thử lại, hoặc dùng tìm tên/quét mã vạch.");
    }
  }

  function selectProduct(product: Product) {
    onProductSelected(product);
    onClose();
  }

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={close} presentationStyle="fullScreen">
      <View style={styles.container}>
        <View style={[styles.header, { paddingTop: Math.max(insets.top, 8) }]}>
          <Pressable onPress={close} style={styles.headerButton} accessibilityRole="button" accessibilityLabel="Đóng nhận diện sản phẩm"><MaterialIcons name="close" size={25} color="#FFFFFF" /></Pressable>
          <View><Text style={styles.headerTitle}>Chụp để tra giá</Text><Text style={styles.headerSub}>Chỉ tìm trong hàng hóa của quán</Text></View>
          <View style={styles.headerButton} />
        </View>

        {!permission ? <LoadingState label="Đang kiểm tra camera…" /> : !permission.granted ? (
          <View style={styles.permission}>
            <View style={styles.permissionIcon}><MaterialIcons name="photo-camera" size={34} color="#176B4D" /></View>
            <Text style={styles.permissionTitle}>Cho phép dùng camera</Text>
            <Text style={styles.permissionText}>Camera chỉ dùng để chụp bao bì, tìm gợi ý trong danh mục hàng hóa của quán.</Text>
            <Pressable onPress={requestPermission} style={styles.allowButton}><Text style={styles.allowText}>Cho phép camera</Text></Pressable>
            <Pressable onPress={pickImage} style={styles.textAction}><Text style={styles.textActionLabel}>Chọn ảnh từ thư viện</Text></Pressable>
            {!permission.canAskAgain ? <Pressable onPress={() => Linking.openSettings()} style={styles.textAction}><Text style={styles.textActionLabel}>Mở Cài đặt iPhone</Text></Pressable> : null}
          </View>
        ) : captured ? (
          <View style={styles.resultPage}>
            <Image source={{ uri: captured.uri }} style={styles.previewImage} />
            {!result ? (
              <View style={styles.capturePanel}>
                <Text style={styles.captureTitle}>Mặt trước bao bì đã rõ chưa?</Text>
                <Text style={styles.captureText}>App sẽ đọc tên, thương hiệu và dung tích để tìm trong danh mục. Giá chỉ lấy từ dữ liệu của quán.</Text>
                <Pressable onPress={identifyImage} disabled={identify.isPending} style={[styles.identifyButton, identify.isPending && styles.buttonDisabled]}>
                  <MaterialIcons name={identify.isPending ? "hourglass-top" : "auto-awesome"} size={21} color="#FFFFFF" />
                  <Text style={styles.identifyText}>{identify.isPending ? "Đang tìm hàng trong quán…" : "Tìm sản phẩm trong kho"}</Text>
                </Pressable>
                <View style={styles.secondaryActions}><Pressable onPress={() => { setCaptured(null); setResult(null); }} disabled={identify.isPending} style={styles.secondaryButton}><MaterialIcons name="photo-camera" size={19} color="#176B4D" /><Text style={styles.secondaryText}>Chụp lại</Text></Pressable><Pressable onPress={pickImage} disabled={identify.isPending} style={styles.secondaryButton}><MaterialIcons name="photo-library" size={19} color="#176B4D" /><Text style={styles.secondaryText}>Đổi ảnh</Text></Pressable></View>
              </View>
            ) : (
              <View style={styles.matchesPanel}>
                <Text style={styles.matchesEyebrow}>GỢI Ý TỪ ẢNH</Text>
                <Text style={styles.matchesTitle}>{observation || "Chọn sản phẩm đúng"}</Text>
                <Text style={styles.matchesSubtitle}>Luôn chọn đúng mặt hàng trước khi xem giá hoặc thêm vào giỏ.</Text>
                {suggestedProducts.length ? suggestedProducts.map(({ match, product }, index) => <Pressable key={product.id} onPress={() => selectProduct(product)} style={({ pressed }) => [styles.matchCard, index === 0 && match.confidence >= 0.7 && styles.matchCardTop, pressed && styles.pressed]}><View style={styles.matchOrder}><Text style={styles.matchOrderText}>{index + 1}</Text></View><View style={styles.matchCopy}><Text numberOfLines={1} style={styles.matchName}>{product.name}</Text><Text numberOfLines={1} style={styles.matchReason}>{match.reason}</Text></View><MaterialIcons name="chevron-right" size={23} color="#176B4D" /></Pressable>) : <View style={styles.emptyMatch}><MaterialIcons name="search-off" size={28} color="#A95F11" /><Text style={styles.emptyMatchTitle}>Chưa nhận diện được sản phẩm</Text><Text style={styles.emptyMatchText}>Ảnh có thể mờ, chưa thấy rõ mặt trước bao bì hoặc sản phẩm chưa có trong danh mục. Không có giá nào được tạo từ ảnh.</Text></View>}
                <Pressable onPress={() => { setCaptured(null); setResult(null); }} style={styles.tryAgain}><Text style={styles.tryAgainText}>Chụp sản phẩm khác</Text></Pressable>
              </View>
            )}
          </View>
        ) : (
          <View style={styles.cameraPage}>
            <CameraView ref={cameraRef} style={styles.camera} facing="back" onCameraReady={() => setCameraReady(true)} />
            <View pointerEvents="none" style={styles.cameraOverlay}><View style={styles.frame} /><Text style={styles.frameHint}>Đưa trọn mặt trước bao bì vào khung</Text></View>
            <View style={[styles.cameraControls, { paddingBottom: Math.max(insets.bottom + 12, 22) }]}>
              <Pressable onPress={pickImage} style={styles.libraryButton}><MaterialIcons name="photo-library" size={22} color="#FFFFFF" /><Text style={styles.libraryText}>Chọn ảnh</Text></Pressable>
              <Pressable onPress={takePicture} disabled={!cameraReady} style={[styles.captureButton, !cameraReady && styles.buttonDisabled]} accessibilityLabel="Chụp ảnh sản phẩm"><View style={styles.captureInner} /></Pressable>
              <View style={styles.libraryButton}><MaterialIcons name="privacy-tip" size={20} color="#CBE9D8" /><Text style={styles.libraryText}>Không lưu ảnh</Text></View>
            </View>
          </View>
        )}
      </View>
    </Modal>
  );
}

function LoadingState({ label }: { label: string }) { return <View style={styles.permission}><Text style={styles.permissionText}>{label}</Text></View>; }

type VisionResult = { usable: boolean; confidence: number; observation: { brand?: string; productName?: string; variant?: string; size?: string } };

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#101813" }, header: { minHeight: 74, paddingHorizontal: 14, flexDirection: "row", alignItems: "center", gap: 10 }, headerButton: { width: 44, height: 44, borderRadius: 22, alignItems: "center", justifyContent: "center" }, headerTitle: { color: "#FFFFFF", fontSize: 17, fontWeight: "900" }, headerSub: { color: "#B9D8C5", fontSize: 11, fontWeight: "700", marginTop: 2 }, cameraPage: { flex: 1 }, camera: { flex: 1 }, cameraOverlay: { ...StyleSheet.absoluteFillObject, justifyContent: "center", alignItems: "center", backgroundColor: "rgba(0,0,0,0.2)" }, frame: { width: "82%", aspectRatio: 0.84, borderRadius: 26, borderWidth: 3, borderColor: "#DDEFE5", backgroundColor: "rgba(23,107,77,0.12)" }, frameHint: { marginTop: 20, paddingHorizontal: 18, color: "#FFFFFF", fontSize: 15, lineHeight: 21, fontWeight: "800", textAlign: "center" }, cameraControls: { position: "absolute", left: 0, right: 0, bottom: 0, minHeight: 118, paddingHorizontal: 22, paddingBottom: 22, backgroundColor: "rgba(16,24,19,0.92)", flexDirection: "row", alignItems: "center", justifyContent: "space-between" }, libraryButton: { width: 82, alignItems: "center", gap: 5 }, libraryText: { color: "#FFFFFF", fontSize: 10, lineHeight: 14, fontWeight: "800", textAlign: "center" }, captureButton: { width: 66, height: 66, padding: 5, borderRadius: 33, backgroundColor: "#FFFFFF", justifyContent: "center", alignItems: "center" }, captureInner: { width: 52, height: 52, borderRadius: 26, backgroundColor: "#176B4D" }, permission: { flex: 1, padding: 34, alignItems: "center", justifyContent: "center", gap: 13, backgroundColor: "#F7F4EC" }, permissionIcon: { width: 76, height: 76, borderRadius: 24, backgroundColor: "#DDEFE5", justifyContent: "center", alignItems: "center" }, permissionTitle: { color: "#18231E", fontSize: 23, fontWeight: "900", textAlign: "center" }, permissionText: { maxWidth: 300, color: "#607268", fontSize: 14, lineHeight: 21, textAlign: "center" }, allowButton: { minHeight: 52, marginTop: 8, paddingHorizontal: 20, justifyContent: "center", borderRadius: 14, backgroundColor: "#176B4D" }, allowText: { color: "#FFFFFF", fontSize: 15, fontWeight: "900" }, textAction: { minHeight: 34, paddingHorizontal: 8, justifyContent: "center" }, textActionLabel: { color: "#176B4D", fontSize: 13, fontWeight: "800" }, resultPage: { flex: 1, backgroundColor: "#F7F4EC" }, previewImage: { width: "100%", height: 260, backgroundColor: "#DCE5DD" }, capturePanel: { flex: 1, padding: 24, gap: 12 }, captureTitle: { color: "#18231E", fontSize: 23, lineHeight: 29, fontWeight: "900" }, captureText: { color: "#607268", fontSize: 14, lineHeight: 21 }, identifyButton: { minHeight: 56, marginTop: 8, borderRadius: 15, backgroundColor: "#176B4D", justifyContent: "center", alignItems: "center", flexDirection: "row", gap: 9 }, identifyText: { color: "#FFFFFF", fontSize: 15, fontWeight: "900" }, secondaryActions: { flexDirection: "row", gap: 10 }, secondaryButton: { flex: 1, minHeight: 47, borderRadius: 13, borderWidth: 1, borderColor: "#B8D0BF", backgroundColor: "#FFFFFF", justifyContent: "center", alignItems: "center", flexDirection: "row", gap: 7 }, secondaryText: { color: "#176B4D", fontSize: 13, fontWeight: "900" }, matchesPanel: { flex: 1, padding: 20, gap: 10 }, matchesEyebrow: { color: "#176B4D", fontSize: 10, letterSpacing: 1.1, fontWeight: "900" }, matchesTitle: { color: "#18231E", fontSize: 21, lineHeight: 27, fontWeight: "900" }, matchesSubtitle: { color: "#607268", fontSize: 13, lineHeight: 19, marginBottom: 5 }, matchCard: { minHeight: 78, padding: 12, borderRadius: 16, backgroundColor: "#FFFFFF", borderColor: "#DCE5DD", borderWidth: 1, flexDirection: "row", alignItems: "center", gap: 10 }, matchCardTop: { borderColor: "#8EC8A5", backgroundColor: "#F2FBF5" }, matchOrder: { width: 29, height: 29, borderRadius: 10, backgroundColor: "#DDEFE5", justifyContent: "center", alignItems: "center" }, matchOrderText: { color: "#176B4D", fontSize: 13, fontWeight: "900" }, matchCopy: { flex: 1, gap: 3 }, matchName: { color: "#18231E", fontSize: 15, fontWeight: "900" }, matchReason: { color: "#607268", fontSize: 11, lineHeight: 16 }, emptyMatch: { marginTop: 4, padding: 20, borderRadius: 16, backgroundColor: "#FFF5E2", alignItems: "center", gap: 8 }, emptyMatchTitle: { color: "#764511", fontSize: 16, fontWeight: "900" }, emptyMatchText: { color: "#8E5E24", fontSize: 12, lineHeight: 18, textAlign: "center" }, tryAgain: { minHeight: 45, marginTop: 3, justifyContent: "center", alignItems: "center" }, tryAgainText: { color: "#176B4D", fontSize: 14, fontWeight: "900" }, buttonDisabled: { opacity: 0.5 }, pressed: { opacity: 0.74, transform: [{ scale: 0.98 }] },
});
