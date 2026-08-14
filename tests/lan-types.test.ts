import { describe, expect, it } from "vitest";
import { normalizeLanServerUrl, parseLanPairingPayload } from "../lib/lan-types";

describe("ghép nối máy chủ LAN", () => {
  it("chuẩn hóa địa chỉ nội bộ và loại bỏ dấu gạch cuối", () => {
    expect(normalizeLanServerUrl("192.168.1.5:8765/")).toBe("http://192.168.1.5:8765");
    expect(normalizeLanServerUrl("https://pos.local/")).toBe("https://pos.local");
  });

  it("đọc đúng QR ghép nối từ laptop", () => {
    const server = encodeURIComponent("http://192.168.1.5:8765");
    expect(parseLanPairingPayload(`taphoa-pos://lan-connect?server=${server}&code=A1B2C3`)).toEqual({ serverUrl: "http://192.168.1.5:8765", code: "A1B2C3" });
    expect(parseLanPairingPayload("https://khong-phai-qr")).toBeNull();
  });
});
