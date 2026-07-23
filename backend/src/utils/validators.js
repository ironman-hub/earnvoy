const { z } = require("zod");

const registerSchema = z.object({
  fullName: z.string().min(2, "Enter your full legal name as it appears on your passport or ID.").max(100),
  username: z.string().min(3).max(24).regex(/^[a-zA-Z0-9_]+$/, "Username can only contain letters, numbers, and underscores."),
  email: z.string().email(),
  phone: z.string().min(7).max(20),
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
  incentiveOffer: z.string().max(280).optional(),
  notes: z.string().max(500).optional(),
  certifiedNoProhibitedGoods: z.literal(true, {
    errorMap: () => ({ error: "You must certify your package contains no prohibited or illegal goods." }),
  }),
});

const unlockContactSchema = z.object({
  listingId: z.string().uuid(),
  method: z.enum(["STRIPE", "ECOCASH"]),
  phone: z.string().optional(), // required if method === ECOCASH
});

module.exports = { registerSchema, loginSchema, createListingSchema, unlockContactSchema };
