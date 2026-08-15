import { Link } from "expo-router";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

const SECTIONS = [
  ["Dữ liệu có thể được xử lý", "Ứng dụng có thể xử lý thông tin tài khoản như tên, email hoặc số điện thoại; cùng dữ liệu do chủ quán nhập về cửa hàng, nhân viên, khách hàng, hàng hóa, hóa đơn, công nợ và báo cáo. Camera chỉ được dùng khi bạn chủ động cấp quyền để quét mã vạch hoặc chụp ảnh sản phẩm."],
  ["Mục đích sử dụng", "Dữ liệu được dùng để xác thực, vận hành workspace cửa hàng, bán hàng, quản lý tồn kho, xuất báo cáo, đồng bộ theo lựa chọn của bạn và bảo mật tài khoản. Tạp Hóa POS không bán dữ liệu cá nhân cho bên quảng cáo."],
  ["Lưu trữ và đồng bộ", "Dữ liệu có thể được lưu trên thiết bị để hỗ trợ offline-first. Khi sử dụng đồng bộ cloud hoặc LAN, dữ liệu workspace có thể được truyền tới hạ tầng do chủ dịch vụ cấu hình. Quyền truy cập được giới hạn theo workspace và vai trò owner/staff."],
  ["Quyền của bạn", "Bạn có thể từ chối quyền camera hoặc ảnh; chức năng cần quyền đó sẽ không hoạt động. Bạn có thể yêu cầu cập nhật hoặc xóa dữ liệu qua kênh hỗ trợ chính thức khi ứng dụng phát hành."],
  ["Bảo mật", "Ứng dụng sử dụng kiểm soát phiên, phân quyền workspace, PIN nhân viên, rate limit và CSRF protection. Bạn cần bảo vệ thiết bị, mật khẩu và quyền truy cập của nhân viên."],
];

export default function PrivacyPolicyScreen() {
  return <ScrollView style={styles.page} contentContainerStyle={styles.content}>
    <View style={styles.header}><Text style={styles.kicker}>TẠP HÓA POS</Text><Text style={styles.title}>Chính sách bảo mật</Text><Text style={styles.updated}>Bản dự thảo phát hành · Cập nhật trước ngày public chính thức.</Text></View>
    <View style={styles.notice}><Text style={styles.noticeText}>Trước khi submit Google Play hoặc App Store, chủ dịch vụ cần thay email hỗ trợ, pháp nhân và ngày hiệu lực bằng thông tin chính thức.</Text></View>
    {SECTIONS.map(([title, body]) => <View key={title} style={styles.card}><Text style={styles.cardTitle}>{title}</Text><Text style={styles.body}>{body}</Text></View>)}
    <View style={styles.contact}><Text style={styles.cardTitle}>Liên hệ</Text><Text style={styles.body}>Email hỗ trợ chính thức sẽ được công bố trước khi phát hành. Không dùng bản draft này như chính sách final khi chưa thay thông tin liên hệ.</Text></View>
    <Link href={"/gioi-thieu" as any} asChild><Pressable style={styles.back}><Text style={styles.backText}>Quay lại giới thiệu</Text></Pressable></Link>
  </ScrollView>;
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: "#F7F8F4" }, content: { width: "100%", maxWidth: 820, alignSelf: "center", padding: 24, paddingBottom: 56, gap: 14 }, header: { paddingTop: 24, gap: 7 }, kicker: { color: "#1F7A4A", fontSize: 11, fontWeight: "900", letterSpacing: 1.2 }, title: { color: "#173B2A", fontSize: 34, lineHeight: 41, fontWeight: "900" }, updated: { color: "#68776D", fontSize: 13, lineHeight: 20 }, notice: { padding: 16, borderRadius: 14, backgroundColor: "#FFF4D8", borderWidth: 1, borderColor: "#F1D48C" }, noticeText: { color: "#795207", fontSize: 13, lineHeight: 20, fontWeight: "700" }, card: { padding: 20, borderRadius: 16, backgroundColor: "#FFFFFF", borderWidth: 1, borderColor: "#DDE6DE", gap: 8 }, contact: { padding: 20, borderRadius: 16, backgroundColor: "#EAF2EA", borderWidth: 1, borderColor: "#C6DFC9", gap: 8 }, cardTitle: { color: "#173B2A", fontSize: 17, fontWeight: "900" }, body: { color: "#58685D", fontSize: 14, lineHeight: 22 }, back: { alignSelf: "flex-start", minHeight: 44, paddingHorizontal: 16, borderRadius: 12, backgroundColor: "#1F7A4A", justifyContent: "center" }, backText: { color: "#FFFFFF", fontSize: 13, fontWeight: "900" },
});
