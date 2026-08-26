import { z } from "zod";

export const imageKindSchema = z.enum(["hero", "product", "workshop", "people", "reject"]);

export const imageReviewSchema = z.object({
  decisions: z.array(
    z.object({
      index: z.number(),
      keep: z.boolean(),
      kind: imageKindSchema,
      reason: z.string(),
    }),
  ),
});

export type ImageReview = z.infer<typeof imageReviewSchema>;
export type ImageKind = z.infer<typeof imageKindSchema>;

export type ImageReviewInput = {
  businessName?: string | null;
  description?: string | null;
  products: string[];
  images: Array<{
    index: number;
    alt: string;
    sourceUrl: string;
    pageUrl: string;
    imageBase64: string;
  }>;
};
