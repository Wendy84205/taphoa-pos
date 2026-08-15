import { describe, expect, it } from "vitest";

import { parseProductVisionResponse } from "../server/product-vision";
import { rankProductsByVision } from "../lib/product-vision-match";

const candidates = [
  { id: "lavie", name: "Nước suối Lavie 500ml", category: "Nước giải khát", unit: "chai" },
  { id: "coca", name: "Coca-Cola lon", category: "Nước giải khát", unit: "lon" },
];

describe("product vision lookup", () => {
  it("keeps AI output to product observations without prices or product IDs", () => {
    const result = parseProductVisionResponse({ usable: true, confidence: 0.91, brand: "Lavie", productName: "Nước suối 500ml", price: 999999, id: "invented" });

    expect(result).toEqual({ usable: true, confidence: 0.91, observation: { brand: "Lavie", productName: "Nước suối 500ml", variant: undefined, size: undefined } });
  });

  it("matches only against products already stored on the device", () => {
    const matches = rankProductsByVision({ brand: "Lavie", productName: "Nước suối 500ml" }, candidates.map((candidate) => ({ ...candidate, price: 7000, stockQuantity: 10, lowStockThreshold: 2, createdAt: "", updatedAt: "" })));

    expect(matches[0]?.id).toBe("lavie");
    expect(matches.every((match) => candidates.some((candidate) => candidate.id === match.id))).toBe(true);
  });
});
