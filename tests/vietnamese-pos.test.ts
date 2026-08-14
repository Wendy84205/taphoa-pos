import { describe, expect, it } from "vitest";
import { customerDebtBalance, debtAgeDays } from "../lib/debt-utils";
import { calculateBaseQuantity, getProductUnits } from "../lib/product-units";
import { buildVietQrPayload, canGenerateVietQr } from "../lib/vietqr";
import type { DebtTransaction, Product } from "../lib/pos-types";

const debt: DebtTransaction[] = [
  { id: "d1", customerId: "c1", customerName: "Cô Lan", type: "charge", amount: 120000, note: "Bán chịu", createdAt: "2026-08-01T00:00:00Z" },
  { id: "d2", customerId: "c1", customerName: "Cô Lan", type: "payment", amount: 50000, note: "Trả một phần", createdAt: "2026-08-05T00:00:00Z" },
];
const water: Product = { id: "p1", name: "Nước ngọt", price: 12000, unit: "chai", category: "Nước giải khát", stockQuantity: 48, lowStockThreshold: 6, createdAt: "", updatedAt: "", units: [{ id: "chai", label: "chai", conversionToBase: 1, price: 12000, isBase: true }, { id: "loc", label: "lốc 6 chai", conversionToBase: 6, price: 66000 }, { id: "thung", label: "thùng 24 chai", conversionToBase: 24, price: 240000 }] };

describe("nghiệp vụ tạp hóa Việt Nam", () => {
  it("tính đúng dư nợ và số ngày nợ", () => {
    expect(customerDebtBalance(debt, "c1")).toBe(70000);
    expect(debtAgeDays(debt, "c1", new Date("2026-08-11T00:00:00Z"))).toBe(10);
  });
  it("quy đổi đơn vị lốc và thùng về đơn vị tồn cơ sở", () => {
    const units = getProductUnits(water);
    expect(calculateBaseQuantity(2, units.find((unit) => unit.id === "loc")!)).toBe(12);
    expect(calculateBaseQuantity(1, units.find((unit) => unit.id === "thung")!)).toBe(24);
  });
  it("tạo payload VietQR động từ thông tin tài khoản cục bộ", () => {
    const settings = { bankBin: "970415", accountNumber: "113366668888", accountName: "QUY VAC XIN" };
    expect(canGenerateVietQr(settings)).toBe(true);
    expect(buildVietQrPayload(settings, 79000, "HD 001")).toMatch(/^00020101021238/);
    expect(buildVietQrPayload({ ...settings, bankBin: "12" }, 79000, "HD 001")).toBeNull();
  });
});
