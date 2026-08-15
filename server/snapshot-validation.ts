export const SNAPSHOT_LIMITS = {
  maxBytes: 4 * 1024 * 1024,
  maxDepth: 14,
  maxEntries: 20_000,
  maxStringLength: 32_000,
} as const;

export type SnapshotValidationResult =
  | { valid: true; bytes: number; entries: number }
  | { valid: false; reason: string };

/** Rejects malformed or deliberately oversized JSON before it reaches cloud storage. */
export function validateSnapshotPayload(
  snapshot: Record<string, unknown>,
  limits = SNAPSHOT_LIMITS,
): SnapshotValidationResult {
  let serialized: string;
  try {
    serialized = JSON.stringify(snapshot);
  } catch {
    return { valid: false, reason: "Snapshot không thể chuyển thành JSON." };
  }

  const bytes = Buffer.byteLength(serialized, "utf8");
  if (bytes > limits.maxBytes) {
    return { valid: false, reason: `Snapshot vượt giới hạn ${Math.floor(limits.maxBytes / 1024 / 1024)}MB.` };
  }

  let entries = 0;
  const inspect = (value: unknown, depth: number): string | null => {
    if (depth > limits.maxDepth) return `Snapshot sâu quá ${limits.maxDepth} tầng.`;
    if (typeof value === "string" && value.length > limits.maxStringLength) {
      return `Chuỗi trong snapshot vượt ${limits.maxStringLength} ký tự.`;
    }
    if (typeof value === "number" && !Number.isFinite(value)) return "Snapshot chứa số không hợp lệ.";
    if (value === null || typeof value !== "object") return null;

    if (!Array.isArray(value)) {
      const prototype = Object.getPrototypeOf(value);
      if (prototype !== Object.prototype && prototype !== null) {
        return "Snapshot chỉ chấp nhận dữ liệu JSON thuần.";
      }
    }

    for (const child of Array.isArray(value) ? value : Object.values(value)) {
      entries += 1;
      if (entries > limits.maxEntries) return `Snapshot vượt ${limits.maxEntries} phần tử.`;
      const error = inspect(child, depth + 1);
      if (error) return error;
    }
    return null;
  };

  const error = inspect(snapshot, 0);
  return error ? { valid: false, reason: error } : { valid: true, bytes, entries };
}
