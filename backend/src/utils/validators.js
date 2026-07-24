const { z } = require("zod");

const registerSchema = z.object({
  fullName: z.string().min(2, "Enter your full legal name as it appears on your passport or ID.").max(100),
  email: z.string().email(),
  phone: z.string().regex(/^\+[1-9]\d{7,14}$/, "Enter a valid phone number including country code."),
  password: z.string().min(8, "Password must be at least 8 characters."),
  acceptedTerms: z.literal(true, { errorMap: () => ({ message: "You must accept the terms and conditions." }) }),
});

const loginSchema = z.object({
  emailOrUsername: z.string(),
  password: z.string(),
});

const createListingSchema = z.object({
  type: z.enum(["TRAVELLER", "SENDER"]),
  departureAirport: z.string().min(3),
  destinationAirport: z.string().min(3),
  departureCountry: z.string().optional(),
  destinationCountry: z.string().optional(),
  departureDate: z.string(),
  arrivalDate: z.string(),
  availableSpaceKg: z.number().positive().optional(),
  categories: z.array(z.enum([
    "DOCUMENTS", "CLOTHING", "ELECTRONICS", "GIFTS", "FOOD", "MEDICINES", "FRAGILE", "OTHER",
  ])).min(1),
  otherCategoryDetail: z.string().max(200).optional(),
  incentiveOffer: z.string().max(280).optional(),
  notes: z.string().max(500).optional(),
  certifiedNoProhibitedGoods: z.literal(true, {
    errorMap: () => ({ error: "You must certify your package contains no prohibited or illegal goods." }),
  }),
}).refine(
  (data) => !data.categories.includes("OTHER") || (data.otherCategoryDetail && data.otherCategoryDetail.trim().length > 0),
  { message: "Describe what 'Other' refers to.", path: ["otherCategoryDetail"] }
);

const unlockContactSchema = z.object({
  listingId: z.string().uuid(),
  method: z.enum(["STRIPE", "ECOCASH"]),
  phone: z.string().optional(), // required if method === ECOCASH
});

module.exports = { registerSchema, loginSchema, createListingSchema, unlockContactSchema };
