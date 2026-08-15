import { z } from "zod";

import { invokeLLM } from "./_core/llm";

const MAX_IMAGE_DATA_URL_CHARS = 1_600_000;

export const productVisionInputSchema = z.object({
  imageDataUrl: z
    .string()
    .regex(/^data:image\/(?:jpeg|png|webp);base64,/, "Ảnh cần ở định dạng JPG, PNG hoặc WebP.")
    .max(MAX_IMAGE_DATA_URL_CHARS, "Ảnh quá lớn. Hãy chụp lại gần hơn hoặc chọn ảnh nhỏ hơn."),
});

export type ProductVisionInput = z.infer<typeof productVisionInputSchema>;
export type ProductVisionResult = {
  usable: boolean;
  confidence: number;
  observation: { brand?: string; productName?: string; variant?: string; size?: string };
};

const text = (value: unknown, max = 120): string | undefined =>
  typeof value === "string" && value.trim() ? value.trim().slice(0, max) : undefined;

const confidence = (value: unknown): number => {
  const score = typeof value === "number" ? value : Number(value);
  return Number.isFinite(score) ? Math.max(0, Math.min(1, score)) : 0;
};

/**
 * Treat model output as an untrusted observation. Catalog matching is deliberately
 * done on-device so a tenant's product names, prices, and stock never reach the model.
 */
export function parseProductVisionResponse(raw: unknown): ProductVisionResult {
  const payload = raw && typeof raw === "object" ? raw as Record<string, unknown> : {};

  return {
    usable: payload.usable === true,
    confidence: confidence(payload.confidence),
    observation: {
      brand: text(payload.brand),
      productName: text(payload.productName),
      variant: text(payload.variant),
      size: text(payload.size, 60),
    },
  };
}

export async function identifyProductFromImage(input: ProductVisionInput): Promise<ProductVisionResult> {
  const response = await invokeLLM({
    model: "gemini-3-flash-preview",
    maxTokens: 900,
    responseFormat: { type: "json_object" },
    messages: [
      {
        role: "system",
        content: "Bạn nhận diện hàng hóa bán lẻ Việt Nam từ ảnh. Chỉ trích xuất các đặc điểm nhìn thấy, tuyệt đối không suy đoán giá. Nếu ảnh mờ, không thấy rõ bao bì hoặc không chắc chắn, đặt usable=false. Trả về JSON thuần theo dạng {usable:boolean, confidence:number, brand?:string, productName?:string, variant?:string, size?:string}. confidence từ 0 đến 1.",
      },
      {
        role: "user",
        content: [
          { type: "text", text: "Ảnh này là một hàng hóa tại quán. Hãy nhận diện tên, thương hiệu, phiên bản và dung tích nếu nhìn thấy được." },
          { type: "image_url", image_url: { url: input.imageDataUrl, detail: "low" } },
        ],
      },
    ],
  });

  const content = response.choices[0]?.message.content;
  if (typeof content !== "string") throw new Error("Vision returned an empty result");

  try {
    return parseProductVisionResponse(JSON.parse(content));
  } catch {
    throw new Error("Vision returned invalid JSON");
  }
}
