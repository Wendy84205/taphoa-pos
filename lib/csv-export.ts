import type { Order } from "@/lib/pos-types";

function csvCell(value: string | number) {
  const text = String(value);
  return /[;"\n\r]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

function formatDateTime(iso: string) {
  return new Intl.DateTimeFormat("vi-VN", { dateStyle: "short", timeStyle: "short" }).format(new Date(iso));
}

export function ordersToCsv(orders: Order[]) {
  const rows: Array<Array<string | number>> = [["Mã hóa đơn", "Thời gian", "Sản phẩm", "Số lượng", "Đơn vị", "Giá bán", "Thành tiền", "Giảm giá hóa đơn", "Tổng hóa đơn"]];
  orders.forEach((order) => {
    order.items.forEach((item, index) => {
      rows.push([
        index === 0 ? order.id : "",
        index === 0 ? formatDateTime(order.createdAt) : "",
        item.name,
        item.quantity,
        item.unit,
        item.priceAtSale,
        item.quantity * item.priceAtSale,
        index === 0 ? order.discount : "",
        index === 0 ? order.totalAmount : "",
      ]);
    });
  });
  return rows.map((row) => row.map(csvCell).join(";")).join("\r\n");
}
