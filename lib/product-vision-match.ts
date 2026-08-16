import type { Product } from "@/lib/pos-types";

export type VisionObservation = { brand?: string; productName?: string; variant?: string; size?: string };
export type VisionCandidate = { id: string; confidence: number; reason: string };

const STOP_WORDS = new Set(["san", "pham", "hang", "loai", "vi", "cai", "goi", "chai", "lon", "hop", "kg", "ml", "l"]);

function normalize(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function tokens(value: string) {
  return normalize(value).split(" ").filter((token) => token.length > 1 && !STOP_WORDS.has(token));
}

/**
 * Scores only the catalog already present on the device. No product name, price,
 * stock level, or tenant catalog is sent to the image-recognition service.
 */
export function rankProductsByVision(observation: VisionObservation, products: Product[]): VisionCandidate[] {
  const observedText = [observation.brand, observation.productName, observation.variant, observation.size].filter(Boolean).join(" ");
  const observedTokens = [...new Set(tokens(observedText))];
  const observedNormalized = normalize(observedText);
  if (!observedTokens.length) return [];

  return products
    .map((product) => {
      const productText = `${product.name} ${product.category} ${product.unit}`;
      const productNormalized = normalize(productText);
      const productTokens = new Set(tokens(productText));
      const overlap = observedTokens.filter((token) => productTokens.has(token));
      const queryCoverage = overlap.length / observedTokens.length;
      const nameContainsObservation = observedNormalized.length > 3 && normalize(product.name).includes(observedNormalized);
      const observationContainsName = normalize(product.name).length > 3 && observedNormalized.includes(normalize(product.name));
      const score = Math.min(0.99, queryCoverage * 0.8 + (nameContainsObservation || observationContainsName ? 0.2 : 0));
      const reason = overlap.length ? `Khớp: ${overlap.slice(0, 3).join(", ")}` : "Có thông tin gần giống trên bao bì";
      return { id: product.id, confidence: Number(score.toFixed(2)), reason };
    })
    .filter((candidate) => candidate.confidence >= 0.3)
    .sort((a, b) => b.confidence - a.confidence)
    .slice(0, 3);
}
