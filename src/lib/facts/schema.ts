import { z } from "zod";

// OpenAI Structured Outputs reject JSON Schema `format: "uri"` from z.string().url().
const httpUrlString = z.string().describe("Absolute http or https URL");
const optionalHttpUrlString = z
  .string()
  .nullable()
  .describe("Absolute http or https URL, or null");

export const factProvenanceSchema = z.object({
  sourceUrl: httpUrlString,
  excerpt: z.string().nullable(),
});

export const productFactSchema = z.object({
  name: z.string(),
  description: z.string().nullable(),
  category: z.string().nullable(),
  price: z.number().nullable(),
  currency: z.string().nullable(),
  unit: z.string().nullable(),
  sourceUrl: optionalHttpUrlString,
});

export const testimonialFactSchema = z.object({
  quote: z.string(),
  author: z.string().nullable(),
  sourceUrl: optionalHttpUrlString,
});

export const businessFactsSchema = z.object({
  businessName: z.string().nullable(),
  shortName: z.string().nullable(),
  description: z.string().nullable(),
  brandStory: z.string().nullable(),
  productCategories: z.array(z.string()),
  products: z.array(productFactSchema),
  address: z.string().nullable(),
  city: z.string().nullable(),
  region: z.string().nullable(),
  phone: z.string().nullable(),
  email: z.string().nullable(),
  workingHours: z.string().nullable(),
  socialProfiles: z.array(
    z.object({
      network: z.string(),
      url: httpUrlString,
    }),
  ),
  orderingMethods: z.array(z.string()),
  deliveryInformation: z.string().nullable(),
  awards: z.array(z.string()),
  certifications: z.array(z.string()),
  testimonials: z.array(testimonialFactSchema),
  importantClaims: z.array(
    z.object({
      claim: z.string(),
      sourceUrl: optionalHttpUrlString,
    }),
  ),
  missingInformation: z.array(z.string()),
  provenance: z.array(factProvenanceSchema),
  confidence: z.number().min(0).max(1),
  warnings: z.array(z.string()),
});

export type BusinessFacts = z.infer<typeof businessFactsSchema>;

export function emptyBusinessFacts(): BusinessFacts {
  return {
    businessName: null,
    shortName: null,
    description: null,
    brandStory: null,
    productCategories: [],
    products: [],
    address: null,
    city: null,
    region: null,
    phone: null,
    email: null,
    workingHours: null,
    socialProfiles: [],
    orderingMethods: [],
    deliveryInformation: null,
    awards: [],
    certifications: [],
    testimonials: [],
    importantClaims: [],
    missingInformation: [],
    provenance: [],
    confidence: 0,
    warnings: [],
  };
}
