import { describe, expect, it } from "vitest";
import { ordersToCsv } from "../lib/csv-export";
import { createRevenueReport } from "../lib/reporting";
import type { Order } from "../lib/pos-types";

const orders: Order[] = [
  { id: "HD-001", createdAt: "2026-08-13T08:00:00.000Z", subtotal: 30000, discount: 0, totalAmount: 30000, items: [{ productId: "p-1", name: "Nước suối", quantity: 2, unit: "chai", priceAtSale: 7000 }, { productId: "p-2", name: "Mì gói", quantity: 2, unit: "gói", priceAtSale: 8000 }] },
  { id: "HD-002", createdAt: "2026-08-14T10:00:00.000Z", subtotal: 21000, discount: 1000, totalAmount: 20000, items: [{ productId: "p-1", name: "Nước suối", quantity: 3, unit: "chai", priceAtSale: 7000 }] },
];

describe("báo cáo doanh thu và xuất CSV", () => {
  it("tổng hợp đúng doanh thu, số hóa đơn và hàng bán chạy theo ngày", () => {
    const report = createRevenueReport(orders, "day", new Date("2026-08-14T12:00:00"));
    expect(report.totalRevenue).toBe(50000);
    expect(report.orderCount).toBe(2);
    expect(report.totalItems).toBe(7);
    expect(report.bestSellers[0]).toMatchObject({ productId: "p-1", quantity: 5, revenue: 35000 });
    expect(report.buckets.reduce((sum, bucket) => sum + bucket.revenue, 0)).toBe(50000);
  });

  it("phân bổ doanh thu đúng cho chế độ tuần và tháng", () => {
    const weekly = createRevenueReport(orders, "week", new Date("2026-08-14T12:00:00"));
    const monthly = createRevenueReport(orders, "month", new Date("2026-08-14T12:00:00"));
    expect(weekly.buckets.reduce((sum, bucket) => sum + bucket.revenue, 0)).toBe(50000);
    expect(monthly.buckets.reduce((sum, bucket) => sum + bucket.revenue, 0)).toBe(50000);
    expect(weekly.buckets.some((bucket) => bucket.orderCount === 2)).toBe(true);
    expect(monthly.buckets.some((bucket) => bucket.orderCount === 2)).toBe(true);
  });

  it("tạo CSV có đầu mục, chi tiết hàng bán và định dạng phù hợp Excel", () => {
    const csv = ordersToCsv(orders);
    expect(csv).toContain("Mã hóa đơn;Thời gian;Sản phẩm");
    expect(csv).toContain("HD-001");
    expect(csv).toContain("Nước suối;2;chai;7000;14000;0;30000");
    expect(csv.split("\r\n")).toHaveLength(4);
  });
});
