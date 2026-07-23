// Creates the admin account and a fully-paid demo account you can log into
// immediately to see the whole app populated with real-looking data.
// Run with: node prisma/seed.js

const bcrypt = require("bcryptjs");
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function main() {
  // ---------- Admin ----------
  const adminEmail = process.env.ADMIN_EMAIL || "admin@earnvoy.com";
  const adminUsername = process.env.ADMIN_USERNAME || "earnvoy_admin";
  const adminPhone = process.env.ADMIN_PHONE || "+447700900000";
  const adminPassword = process.env.ADMIN_PASSWORD || "ChangeMe123!";
  const adminPasswordHash = await bcrypt.hash(adminPassword, 12);

  const admin = await prisma.user.upsert({
    where: { email: adminEmail },
    update: { role: "ADMIN" },
    create: {
      fullName: "earnvoy Administrator",
      email: adminEmail,
      username: adminUsername,
      phone: adminPhone,
      passwordHash: adminPasswordHash,
      role: "ADMIN",
      emailVerified: true,
      phoneVerified: true,
      isVerifiedBadge: true,
      termsAcceptedAt: new Date(),
      termsVersion: "2026-07-23",
    },
  });
  console.log(`Admin ready: ${admin.email} / password: ${adminPassword}`);

  // ---------- Fully-paid demo account ----------
  const demoEmail = process.env.DEMO_EMAIL || "demo@earnvoy.com";
  const demoUsername = process.env.DEMO_USERNAME || "earnvoy_demo";
  const demoPhone = process.env.DEMO_PHONE || "+447700900123";
  const demoPassword = process.env.DEMO_PASSWORD || "EarnvoyDemo123!";
  const demoPasswordHash = await bcrypt.hash(demoPassword, 12);

  const demoUser = await prisma.user.upsert({
    where: { email: demoEmail },
    update: {},
    create: {
      fullName: "Demo Traveller",
      email: demoEmail,
      username: demoUsername,
      phone: demoPhone,
      passwordHash: demoPasswordHash,
      role: "USER",
      emailVerified: true,
      phoneVerified: true,
      isVerifiedBadge: true,
      termsAcceptedAt: new Date(),
      termsVersion: "2026-07-23",
    },
  });

  // A second user who will act as the sender who unlocked the demo user's contact details
  const buyer = await prisma.user.upsert({
    where: { email: "demo-buyer@earnvoy.com" },
    update: {},
    create: {
      fullName: "Demo Sender",
      email: "demo-buyer@earnvoy.com",
      username: "earnvoy_demo_sender",
      phone: "+447700900456",
      passwordHash: await bcrypt.hash("EarnvoyDemo123!", 12),
      role: "USER",
      emailVerified: true,
      phoneVerified: true,
      isVerifiedBadge: true,
      termsAcceptedAt: new Date(),
      termsVersion: "2026-07-23",
    },
  });

  // A LIVE listing (fully paid, visible on the feed) so the demo account has something to show off
  const liveListing = await prisma.listing.upsert({
    where: { id: "00000000-0000-0000-0000-000000000001" },
    update: {},
    create: {
      id: "00000000-0000-0000-0000-000000000001",
      type: "TRAVELLER",
      ownerId: demoUser.id,
      departureAirport: "LHR",
      departureCountry: "United Kingdom",
      destinationAirport: "HRE",
      destinationCountry: "Zimbabwe",
      departureDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000),
      arrivalDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000 + 12 * 60 * 60 * 1000),
      availableSpaceKg: 12,
      categories: ["DOCUMENTS", "GIFTS", "CLOTHING"],
      certifiedNoProhibitedGoods: true,
      status: "LIVE",
      listingFeePaid: true,
    },
  });

  await prisma.payment.upsert({
    where: { id: "00000000-0000-0000-0000-000000000002" },
    update: {},
    create: {
      id: "00000000-0000-0000-0000-000000000002",
      userId: demoUser.id,
      listingId: liveListing.id,
      type: "LISTING_FEE",
      method: "STRIPE",
      amount: 1.75,
      currency: "GBP",
      status: "SUCCEEDED",
      receiptNumber: "EV-DEMO-0001",
    },
  });

  // A MATCHED listing with a completed, paid contact unlock - so logging in as
  // either the demo traveller or demo sender shows a full completed transaction
  // history with a downloadable receipt.
  const matchedListing = await prisma.listing.upsert({
    where: { id: "00000000-0000-0000-0000-000000000003" },
    update: {},
    create: {
      id: "00000000-0000-0000-0000-000000000003",
      type: "TRAVELLER",
      ownerId: demoUser.id,
      departureAirport: "JNB",
      departureCountry: "South Africa",
      destinationAirport: "LHR",
      destinationCountry: "United Kingdom",
      departureDate: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
      arrivalDate: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000 + 11 * 60 * 60 * 1000),
      availableSpaceKg: 8,
      categories: ["ELECTRONICS", "DOCUMENTS"],
      certifiedNoProhibitedGoods: true,
      status: "MATCHED",
      listingFeePaid: true,
      matchedWithUserId: buyer.id,
    },
  });

  const listingFeePayment = await prisma.payment.upsert({
    where: { id: "00000000-0000-0000-0000-000000000004" },
    update: {},
    create: {
      id: "00000000-0000-0000-0000-000000000004",
      userId: demoUser.id,
      listingId: matchedListing.id,
      type: "LISTING_FEE",
      method: "STRIPE",
      amount: 1.75,
      currency: "GBP",
      status: "SUCCEEDED",
      receiptNumber: "EV-DEMO-0002",
    },
  });

  const unlockPayment = await prisma.payment.upsert({
    where: { id: "00000000-0000-0000-0000-000000000005" },
    update: {},
    create: {
      id: "00000000-0000-0000-0000-000000000005",
      userId: buyer.id,
      listingId: matchedListing.id,
      type: "UNLOCK_FEE",
      method: "ECOCASH",
      amount: 1.75,
      currency: "GBP",
      status: "SUCCEEDED",
      receiptNumber: "EV-DEMO-0003",
    },
  });

  await prisma.contactUnlock.upsert({
    where: { id: "00000000-0000-0000-0000-000000000006" },
    update: {},
    create: {
      id: "00000000-0000-0000-0000-000000000006",
      listingId: matchedListing.id,
      buyerId: buyer.id,
      paymentId: unlockPayment.id,
      accepted: true,
      decidedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
    },
  });

  console.log(`Demo traveller account ready: ${demoUser.email} / password: ${demoPassword}`);
  console.log(`Demo sender account ready: demo-buyer@earnvoy.com / password: EarnvoyDemo123!`);
  console.log("Both demo accounts are pre-verified with paid listings, a completed match, and receipts.");

  // ---------- A second traveller with a fresh, paid, unclaimed listing ----------
  // Distinct from demoUser's listings above - this one has NOT been unlocked by
  // anyone yet, so you can log in as any account and test the "pay to unlock
  // contact details" flow end-to-end without it already being spoken for.
  const demo2Email = process.env.DEMO2_EMAIL || "demo2@earnvoy.com";
  const demo2Password = process.env.DEMO2_PASSWORD || "EarnvoyDemo123!";

  const demo2User = await prisma.user.upsert({
    where: { email: demo2Email },
    update: {},
    create: {
      fullName: "Demo Traveller Two",
      email: demo2Email,
      username: "earnvoy_demo2",
      phone: "+447700900789",
      passwordHash: await bcrypt.hash(demo2Password, 12),
      role: "USER",
      emailVerified: true,
      phoneVerified: true,
      isVerifiedBadge: true,
      termsAcceptedAt: new Date(),
      termsVersion: "2026-07-23",
    },
  });

  const unclaimedListing = await prisma.listing.upsert({
    where: { id: "00000000-0000-0000-0000-000000000007" },
    update: {},
    create: {
      id: "00000000-0000-0000-0000-000000000007",
      type: "TRAVELLER",
      ownerId: demo2User.id,
      departureAirport: "CPT",
      departureCountry: "South Africa",
      destinationAirport: "LHR",
      destinationCountry: "United Kingdom",
      departureDate: new Date(Date.now() + 6 * 24 * 60 * 60 * 1000),
      arrivalDate: new Date(Date.now() + 6 * 24 * 60 * 60 * 1000 + 13 * 60 * 60 * 1000),
      availableSpaceKg: 15,
      categories: ["GIFTS", "CLOTHING", "FOOD"],
      certifiedNoProhibitedGoods: true,
      status: "LIVE",
      listingFeePaid: true,
    },
  });

  await prisma.payment.upsert({
    where: { id: "00000000-0000-0000-0000-000000000008" },
    update: {},
    create: {
      id: "00000000-0000-0000-0000-000000000008",
      userId: demo2User.id,
      listingId: unclaimedListing.id,
      type: "LISTING_FEE",
      method: "STRIPE",
      amount: 1.75,
      currency: "GBP",
      status: "SUCCEEDED",
      receiptNumber: "EV-DEMO-0004",
    },
  });

  console.log(`Second demo traveller ready: ${demo2Email} / password: ${demo2Password}`);
  console.log("Its CPT -> LHR listing is live and paid, but not yet unlocked by anyone -");
  console.log("log in as any other account and pay to unlock it to see that flow end to end.");
  console.log("IMPORTANT: change or remove these demo accounts before going live in production.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
