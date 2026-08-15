const BACKUP_LIMITS = {
  maxBytes: 4 * 1024 * 1024,
  maxDepth: 14,
  maxEntries: 20_000,
  maxStringLength: 32_000,
} as const;

const REQUIRED_ARRAYS = ["products", "cart", "orders"] as const;
const OPTIONAL_ARRAYS = ["inventoryActivities", "customers", "debtTransactions", "suppliers", "stockReceipts", "supplierPayments", "expiryBatches", "shifts", "paymentReconciliations", "promotions", "comboRules"] as const;
const DANGEROUS_KEYS = new Set(["__proto__", "prototype", "constructor"]);

type BackupEnvelope = { format: "taphoa-pos-backup"; version: 1; payload: Record<string, unknown> };

function byteLength(value: string) {
  if (typeof TextEncoder !== "undefined") return new TextEncoder().encode(value).length;
  return value.length * 2;
}

function ensureSafeJson(value: unknown): void {
  let entries = 0;
  const inspect = (current: unknown, depth: number): void => {
    if (depth > BACKUP_LIMITS.maxDepth) throw new Error(`Backup sâu quá ${BACKUP_LIMITS.maxDepth} tầng.`);
    if (typeof current === "string" && current.length > BACKUP_LIMITS.maxStringLength) throw new Error("Backup chứa chuỗi quá dài.");
    if (typeof current === "number" && !Number.isFinite(current)) throw new Error("Backup chứa số không hợp lệ.");
    if (current === null || typeof current !== "object") return;
    if (!Array.isArray(current) && Object.getPrototypeOf(current) !== Object.prototype && Object.getPrototypeOf(current) !== null) throw new Error("Backup chỉ chấp nhận JSON thuần.");
    for (const [key, child] of Object.entries(current)) {
      if (DANGEROUS_KEYS.has(key)) throw new Error("Backup chứa key không an toàn.");
      entries += 1;
      if (entries > BACKUP_LIMITS.maxEntries) throw new Error(`Backup vượt ${BACKUP_LIMITS.maxEntries} phần tử.`);
      inspect(child, depth + 1);
    }
  };
  inspect(value, 0);
}

/** Parse backup offline không tin cậy trước khi đưa vào reducer/local storage. */
export function parseJsonBackupContent(content: string): Record<string, unknown> {
  if (byteLength(content) > BACKUP_LIMITS.maxBytes) throw new Error("Backup vượt giới hạn 4MB.");
  let envelope: Partial<BackupEnvelope>;
  try { envelope = JSON.parse(content) as Partial<BackupEnvelope>; } catch { throw new Error("Backup không phải JSON hợp lệ."); }
  if (envelope.format !== "taphoa-pos-backup" || envelope.version !== 1 || !envelope.payload || Array.isArray(envelope.payload) || typeof envelope.payload !== "object") throw new Error("Tệp backup không đúng định dạng Tạp Hóa POS.");
  ensureSafeJson(envelope.payload);
  for (const key of REQUIRED_ARRAYS) if (!Array.isArray(envelope.payload[key])) throw new Error(`Backup thiếu danh sách ${key}.`);
  for (const key of OPTIONAL_ARRAYS) if (envelope.payload[key] !== undefined && !Array.isArray(envelope.payload[key])) throw new Error(`Backup có trường ${key} không hợp lệ.`);
  if (envelope.payload.paymentSettings !== undefined && (envelope.payload.paymentSettings === null || Array.isArray(envelope.payload.paymentSettings) || typeof envelope.payload.paymentSettings !== "object")) throw new Error("Backup có thiết lập thanh toán không hợp lệ.");
  return envelope.payload;
}
