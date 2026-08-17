import { describe, expect, it } from "vitest";
import * as XLSX from "xlsx";
import { importProductsIntoCatalog, previewProductImport, readProductSpreadsheet } from "../lib/product-import";
import type { Product } from "../lib/pos-types";

const existing: Product[] = [{ id: "old-1", name: "Nước cũ", price: 9000, unit: "chai", category: "Nước giải khát", barcode: "893000", stockQuantity: 2, lowStockThreshold: 1, createdAt: "", updatedAt: "" }];

describe("nhập sản phẩm hàng loạt", () => {
  it("đọc tiêu đề tiếng Việt, kiểm tra dữ liệu và báo các dòng lỗi", () => {
    const preview = previewProductImport([
      { "Tên sản phẩm": "Nước mới", "Giá bán": "12.000", "Đơn vị": "chai", "Tồn kho": "10", "Ngưỡng cảnh báo": "3", "Mã vạch": "893111" },
      { "Tên sản phẩm": "Thiếu giá", "Giá bán": "0" },
      { "Tên sản phẩm": "Trùng mã", "Giá bán": "15000", "Mã vạch": "893111" },
    ], "hang-hoa.xlsx");
    expect(preview.rows).toHaveLength(1);
    expect(preview.rows[0]).toMatchObject({ name: "Nước mới", price: 12000, stockQuantity: 10, lowStockThreshold: 3 });
    expect(preview.issues).toHaveLength(2);
  });

  it("thêm mới hoặc cập nhật sản phẩm có cùng mã vạch", () => {
    const result = importProductsIntoCatalog(existing, [
      { name: "Nước đã cập nhật", price: 11000, unit: "chai", category: "Nước giải khát", barcode: "893000", stockQuantity: 8, lowStockThreshold: 2 },
      { name: "Bánh mới", price: 5000, unit: "gói", category: "Bánh kẹo", stockQuantity: 6, lowStockThreshold: 2 },
    ]);
    expect(result).toMatchObject({ added: 1, updated: 1 });
    expect(result.products.find((product) => product.id === "old-1")).toMatchObject({ name: "Nước đã cập nhật", stockQuantity: 8 });
    expect(result.products).toHaveLength(2);
  });

  it("đọc được workbook Excel và sử dụng trang dữ liệu đầu tiên", () => {
    const workbook = XLSX.utils.book_new();
    const sheet = XLSX.utils.json_to_sheet([{ "Tên sản phẩm": "Mì Excel", "Giá bán": 6500, "Đơn vị": "gói", "Tồn kho": 14 }]);
    XLSX.utils.book_append_sheet(workbook, sheet, "Sản phẩm");
    const buffer = XLSX.write(workbook, { type: "array", bookType: "xlsx" });
    const preview = readProductSpreadsheet(buffer, "san-pham.xlsx");
    expect(preview.rows).toHaveLength(1);
    expect(preview.rows[0]).toMatchObject({ name: "Mì Excel", price: 6500, stockQuantity: 14 });
  });

  it("đọc đúng CSV UTF-8 có tiêu đề và dữ liệu tiếng Việt", () => {
    const source = new TextEncoder().encode("Tên sản phẩm,Giá bán,Giá vốn,Đơn vị,Nhóm hàng,Tồn kho\nNước mắm thử,32000,27500,chai,Gia vị,12\n");
    const buffer = source.buffer.slice(source.byteOffset, source.byteOffset + source.byteLength);
    const preview = readProductSpreadsheet(buffer, "san-pham-utf8.csv");
    expect(preview.issues).toHaveLength(0);
    expect(preview.rows).toHaveLength(1);
    expect(preview.rows[0]).toMatchObject({ name: "Nước mắm thử", price: 32000, costPrice: 27500, unit: "chai", category: "Gia vị", stockQuantity: 12 });
  });
});
