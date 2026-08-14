import type { Order } from "@/lib/pos-types";

export type ReportPeriod = "day" | "week" | "month";

export type RevenueBucket = {
  key: string;
  label: string;
  revenue: number;
  orderCount: number;
  start: Date;
};

export type ProductPerformance = {
  productId: string;
  name: string;
  quantity: number;
  revenue: number;
};

export type RevenueReport = {
  period: ReportPeriod;
  buckets: RevenueBucket[];
  totalRevenue: number;
  orderCount: number;
  averageOrder: number;
  totalItems: number;
  bestSellers: ProductPerformance[];
};

const DAY_FORMATTER = new Intl.DateTimeFormat("vi-VN", { weekday: "short", day: "2-digit" });
const MONTH_FORMATTER = new Intl.DateTimeFormat("vi-VN", { month: "short", year: "2-digit" });

function cloneDate(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function startOfWeek(date: Date) {
  const result = cloneDate(date);
  const day = result.getDay() || 7;
  result.setDate(result.getDate() - day + 1);
  return result;
}

function dateKey(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function weekKey(date: Date) {
  return dateKey(startOfWeek(date));
}

function monthKey(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

function getBucketKey(date: Date, period: ReportPeriod) {
  if (period === "day") return dateKey(date);
  if (period === "week") return weekKey(date);
  return monthKey(date);
}

function bucketLabel(start: Date, period: ReportPeriod) {
  if (period === "day") return DAY_FORMATTER.format(start).replace(".", "");
  if (period === "week") return `${String(start.getDate()).padStart(2, "0")}/${String(start.getMonth() + 1).padStart(2, "0")}`;
  return MONTH_FORMATTER.format(start).replace("thg", "T");
}

function buildEmptyBuckets(period: ReportPeriod, referenceDate: Date) {
  const count = period === "day" ? 7 : period === "week" ? 8 : 6;
  const buckets: RevenueBucket[] = [];
  if (period === "day") {
    const cursor = cloneDate(referenceDate);
    cursor.setDate(cursor.getDate() - (count - 1));
    for (let index = 0; index < count; index += 1) {
      const start = new Date(cursor);
      buckets.push({ key: dateKey(start), label: bucketLabel(start, period), revenue: 0, orderCount: 0, start });
      cursor.setDate(cursor.getDate() + 1);
    }
  } else if (period === "week") {
    const cursor = startOfWeek(referenceDate);
    cursor.setDate(cursor.getDate() - 7 * (count - 1));
    for (let index = 0; index < count; index += 1) {
      const start = new Date(cursor);
      buckets.push({ key: weekKey(start), label: bucketLabel(start, period), revenue: 0, orderCount: 0, start });
      cursor.setDate(cursor.getDate() + 7);
    }
  } else {
    const cursor = new Date(referenceDate.getFullYear(), referenceDate.getMonth() - (count - 1), 1);
    for (let index = 0; index < count; index += 1) {
      const start = new Date(cursor);
      buckets.push({ key: monthKey(start), label: bucketLabel(start, period), revenue: 0, orderCount: 0, start });
      cursor.setMonth(cursor.getMonth() + 1);
    }
  }
  return buckets;
}

export function createRevenueReport(orders: Order[], period: ReportPeriod, referenceDate = new Date(), sellerUserId?: number): RevenueReport {
  const buckets = buildEmptyBuckets(period, referenceDate);
  const bucketByKey = new Map(buckets.map((bucket) => [bucket.key, bucket]));
  const productMap = new Map<string, ProductPerformance>();
  let totalRevenue = 0;
  let orderCount = 0;
  let totalItems = 0;

  orders.forEach((order) => {
    if (sellerUserId !== undefined && order.sellerUserId !== sellerUserId) return;
    const createdAt = new Date(order.createdAt);
    const bucket = bucketByKey.get(getBucketKey(createdAt, period));
    if (bucket) {
      bucket.revenue += order.totalAmount;
      bucket.orderCount += 1;
      totalRevenue += order.totalAmount;
      orderCount += 1;
      order.items.forEach((item) => {
        totalItems += item.quantity;
        const current = productMap.get(item.productId) ?? { productId: item.productId, name: item.name, quantity: 0, revenue: 0 };
        current.quantity += item.quantity;
        current.revenue += item.quantity * item.priceAtSale;
        productMap.set(item.productId, current);
      });
    }
  });

  return {
    period,
    buckets,
    totalRevenue,
    orderCount,
    averageOrder: orderCount ? Math.round(totalRevenue / orderCount) : 0,
    totalItems,
    bestSellers: Array.from(productMap.values()).sort((left, right) => right.revenue - left.revenue).slice(0, 5),
  };
}
