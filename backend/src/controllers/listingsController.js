const prisma = require("../config/prisma");
const config = require("../config");
const { createListingSchema } = require("../utils/validators");
const { logEvent } = require("../services/auditService");

function stripContactInfo(listing) {
  const { owner, ...rest } = listing;
  return {
    ...rest,
    owner: owner
      ? { id: owner.id, username: owner.username, isVerifiedBadge: owner.isVerifiedBadge }
      : undefined,
  };
}

function withContactInfo(listing) {
  const { owner, ...rest } = listing;
  return {
    ...rest,
    owner: owner
      ? {
          id: owner.id,
          username: owner.username,
          isVerifiedBadge: owner.isVerifiedBadge,
          fullName: owner.fullName,
          email: owner.email,
          phone: owner.phone,
        }
      : undefined,
  };
}

async function createListing(req, res, next) {
  try {
    const data = createListingSchema.parse(req.body);

    const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const recentCount = await prisma.listing.count({
      where: { ownerId: req.user.id, createdAt: { gte: since } },
    });
    if (recentCount >= config.maxListingsPerMonth) {
      return res.status(429).json({
        error: `You've reached the limit of ${config.maxListingsPerMonth} listings per 30 days. This limit helps keep the feed genuine and spam-free.`,
      });
    }

    const listing = await prisma.listing.create({
      data: {
        type: data.type,
        ownerId: req.user.id,
        departureAirport: data.departureAirport.toUpperCase(),
        destinationAirport: data.destinationAirport.toUpperCase(),
        departureCountry: data.departureCountry,
        destinationCountry: data.destinationCountry,
        departureDate: new Date(data.departureDate),
        arrivalDate: new Date(data.arrivalDate),
        availableSpaceKg: data.availableSpaceKg,
        categories: data.categories,
        otherCategoryDetail: data.categories.includes("OTHER") ? data.otherCategoryDetail : null,
        incentiveOffer: data.incentiveOffer,
        notes: data.notes,
        certifiedNoProhibitedGoods: data.certifiedNoProhibitedGoods,
        listingFeePaid: false, // becomes true once the £1.75 payment succeeds
      },
    });

    await logEvent({ actorId: req.user.id, action: "LISTING_CREATED", targetType: "Listing", targetId: listing.id });
    res.status(201).json({ listing, feeRequired: config.fees.listingFeeGbp });
  } catch (err) {
    next(err);
  }
}

// Public live feed - filterable, never shows contact details, only shows paid+live listings
async function getFeed(req, res, next) {
  try {
    const {
      type, departureAirport, destinationAirport, destinationCountry,
      category, minWeightKg, fromDate, toDate, arrivalFromDate, arrivalToDate,
    } = req.query;

    const where = {
      status: "LIVE",
      listingFeePaid: true,
      ...(type && { type }),
      ...(departureAirport && { departureAirport: departureAirport.toUpperCase() }),
      ...(destinationAirport && { destinationAirport: destinationAirport.toUpperCase() }),
      ...(destinationCountry && { destinationCountry }),
      ...(category && { categories: { has: category } }),
      ...(minWeightKg && { availableSpaceKg: { gte: Number(minWeightKg) } }),
      ...((fromDate || toDate) && {
        departureDate: { ...(fromDate && { gte: new Date(fromDate) }), ...(toDate && { lte: new Date(toDate) }) },
      }),
      ...((arrivalFromDate || arrivalToDate) && {
        arrivalDate: { ...(arrivalFromDate && { gte: new Date(arrivalFromDate) }), ...(arrivalToDate && { lte: new Date(arrivalToDate) }) },
      }),
    };

    const listings = await prisma.listing.findMany({
      where,
      include: { owner: { select: { id: true, username: true, isVerifiedBadge: true } } },
      orderBy: { departureDate: "asc" },
      take: 100,
    });

    res.json({ listings: listings.map(stripContactInfo) });
  } catch (err) {
    next(err);
  }
}

async function getMyListings(req, res, next) {
  try {
    const listings = await prisma.listing.findMany({
      where: { ownerId: req.user.id },
      include: {
        owner: { select: { id: true, username: true, isVerifiedBadge: true } },
        unlocks: { include: { buyer: { select: { id: true, username: true } } } },
      },
      orderBy: { createdAt: "desc" },
    });
    res.json({ listings });
  } catch (err) {
    next(err);
  }
}

async function getListingById(req, res, next) {
  try {
    const listing = await prisma.listing.findUnique({
      where: { id: req.params.id },
      include: { owner: { select: { id: true, username: true, isVerifiedBadge: true, fullName: true, email: true, phone: true } } },
    });
    if (!listing || listing.status === "REMOVED") return res.status(404).json({ error: "Listing not found." });

    const isOwner = req.user && req.user.id === listing.ownerId;
    let hasUnlocked = false;
    if (req.user && !isOwner) {
      const unlock = await prisma.contactUnlock.findFirst({
        where: { listingId: listing.id, buyerId: req.user.id },
      });
      hasUnlocked = !!unlock;
    }

    res.json({ listing: isOwner || hasUnlocked ? withContactInfo(listing) : stripContactInfo(listing) });
  } catch (err) {
    next(err);
  }
}

// Owner deletes their own listing. Any buyer whose unlock was never decided gets an auto-refund.
async function deleteListing(req, res, next) {
  try {
    const listing = await prisma.listing.findUnique({ where: { id: req.params.id } });
    if (!listing || listing.ownerId !== req.user.id) return res.status(404).json({ error: "Listing not found." });

    const pendingUnlocks = await prisma.contactUnlock.findMany({
      where: { listingId: listing.id, accepted: null, refunded: false },
    });

    await prisma.$transaction([
      prisma.listing.update({ where: { id: listing.id }, data: { status: "REMOVED", removedAt: new Date() } }),
      ...pendingUnlocks.map((u) =>
        prisma.contactUnlock.update({ where: { id: u.id }, data: { refunded: true, refundedAt: new Date() } })
      ),
    ]);

    await logEvent({
      actorId: req.user.id,
      action: "LISTING_DELETED",
      targetType: "Listing",
      targetId: listing.id,
      metadata: { autoRefundedUnlocks: pendingUnlocks.map((u) => u.id) },
    });

    res.json({ message: "Listing removed.", pendingUnlockIdsToRefund: pendingUnlocks.map((u) => u.id) });
  } catch (err) {
    next(err);
  }
}

// Owner accepts or rejects a specific buyer's request after contact was unlocked.
// If they "don't agree to agree" (reject), the listing is treated as a fresh
// opportunity again - reopened to LIVE for other buyers. No refund, since
// contact details were already revealed at the point of payment.
async function decideMatch(req, res, next) {
  try {
    const { unlockId, accept } = req.body;
    const unlock = await prisma.contactUnlock.findUnique({
      where: { id: unlockId },
      include: { listing: true },
    });
    if (!unlock || unlock.listing.ownerId !== req.user.id) {
      return res.status(404).json({ error: "Request not found." });
    }
    if (unlock.accepted !== null) {
      return res.status(409).json({ error: "This request has already been decided." });
    }

    await prisma.contactUnlock.update({
      where: { id: unlockId },
      data: { accepted: !!accept, decidedAt: new Date() },
    });

    if (accept) {
      await prisma.listing.update({
        where: { id: unlock.listingId },
        data: { status: "MATCHED", matchedWithUserId: unlock.buyerId },
      });
    } else {
      await prisma.listing.update({ where: { id: unlock.listingId }, data: { status: "LIVE" } });
    }

    await logEvent({
      actorId: req.user.id,
      action: accept ? "MATCH_ACCEPTED" : "MATCH_REJECTED",
      targetType: "Listing",
      targetId: unlock.listingId,
      metadata: { unlockId, buyerId: unlock.buyerId },
    });

    res.json({ message: accept ? "Match confirmed." : "Request declined - listing is fresh and live again." });
  } catch (err) {
    next(err);
  }
}

module.exports = { createListing, getFeed, getMyListings, getListingById, deleteListing, decideMatch };
