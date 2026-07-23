const prisma = require("../config/prisma");
const { logEvent } = require("../services/auditService");
const { publicUser } = require("./authController");

async function listUsers(req, res, next) {
  try {
    const { q, page = 1, pageSize = 25 } = req.query;
    const where = q
      ? { OR: [{ username: { contains: q, mode: "insensitive" } }, { email: { contains: q, mode: "insensitive" } }, { fullName: { contains: q, mode: "insensitive" } }] }
      : {};
    const [users, total] = await Promise.all([
      prisma.user.findMany({ where, orderBy: { createdAt: "desc" }, skip: (page - 1) * pageSize, take: Number(pageSize) }),
      prisma.user.count({ where }),
    ]);
    res.json({ users: users.map(publicUser), total });
  } catch (err) {
    next(err);
  }
}

async function getUser(req, res, next) {
  try {
    const user = await prisma.user.findUnique({ where: { id: req.params.id }, include: { listings: true, payments: true } });
    if (!user) return res.status(404).json({ error: "User not found." });
    res.json({ user: publicUser(user) });
  } catch (err) {
    next(err);
  }
}

async function updateUser(req, res, next) {
  try {
    const { role, isSuspended, username, email, phone } = req.body;
    const user = await prisma.user.update({ where: { id: req.params.id }, data: { role, isSuspended, username, email, phone } });
    await logEvent({ actorId: req.user.id, action: "ADMIN_UPDATED_USER", targetType: "User", targetId: user.id, metadata: req.body });
    res.json({ user: publicUser(user) });
  } catch (err) {
    next(err);
  }
}

async function deleteUser(req, res, next) {
  try {
    const user = await prisma.user.update({ where: { id: req.params.id }, data: { isDeleted: true, deletedAt: new Date() } });
    await logEvent({ actorId: req.user.id, action: "ADMIN_DELETED_USER", targetType: "User", targetId: user.id });
    res.json({ message: "User account deleted." });
  } catch (err) {
    next(err);
  }
}

async function listAllListings(req, res, next) {
  try {
    const { status, page = 1, pageSize = 25 } = req.query;
    const where = status ? { status } : {};
    const [listings, total] = await Promise.all([
      prisma.listing.findMany({
        where,
        include: { owner: { select: { id: true, username: true, email: true } } },
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * pageSize,
        take: Number(pageSize),
      }),
      prisma.listing.count({ where }),
    ]);
    res.json({ listings, total });
  } catch (err) {
    next(err);
  }
}

async function removeListing(req, res, next) {
  try {
    const listing = await prisma.listing.update({ where: { id: req.params.id }, data: { status: "REMOVED", removedAt: new Date() } });
    await logEvent({ actorId: req.user.id, action: "ADMIN_REMOVED_LISTING", targetType: "Listing", targetId: listing.id, metadata: { reason: req.body.reason } });
    res.json({ message: "Listing removed." });
  } catch (err) {
    next(err);
  }
}

async function listReports(req, res, next) {
  try {
    const { status } = req.query;
    const reports = await prisma.report.findMany({
      where: status ? { status } : {},
      include: { reporter: { select: { id: true, username: true } }, targetUser: { select: { id: true, username: true } }, listing: true },
      orderBy: { createdAt: "desc" },
    });
    res.json({ reports });
  } catch (err) {
    next(err);
  }
}

async function resolveReport(req, res, next) {
  try {
    const { status, resolvedNote } = req.body;
    const report = await prisma.report.update({
      where: { id: req.params.id },
      data: { status, resolvedNote, resolvedAt: status !== "OPEN" ? new Date() : null },
    });
    await logEvent({ actorId: req.user.id, action: "REPORT_RESOLVED", targetType: "Report", targetId: report.id, metadata: { status } });
    res.json({ report });
  } catch (err) {
    next(err);
  }
}

async function getAnalytics(req, res, next) {
  try {
    const [userCount, verifiedCount, listingCount, matchedCount, payments, openReports] = await Promise.all([
      prisma.user.count({ where: { isDeleted: false } }),
      prisma.user.count({ where: { isVerifiedBadge: true } }),
      prisma.listing.count(),
      prisma.listing.count({ where: { status: "MATCHED" } }),
      prisma.payment.findMany({ where: { status: "SUCCEEDED" } }),
      prisma.report.count({ where: { status: "OPEN" } }),
    ]);

    const revenueByType = payments.reduce((acc, p) => {
      acc[p.type] = (acc[p.type] || 0) + p.amount;
      return acc;
    }, {});

    res.json({
      userCount, verifiedCount, listingCount, matchedCount, openReports,
      totalRevenue: payments.reduce((sum, p) => sum + p.amount, 0),
      revenueByType,
      paymentCount: payments.length,
    });
  } catch (err) {
    next(err);
  }
}

async function getAuditLogs(req, res, next) {
  try {
    const { actorId, action, from, to, format } = req.query;
    const where = {
      ...(actorId && { actorId }),
      ...(action && { action }),
      ...((from || to) && { createdAt: { ...(from && { gte: new Date(from) }), ...(to && { lte: new Date(to) }) } }),
    };

    const logs = await prisma.auditLog.findMany({
      where,
      include: { actor: { select: { username: true, email: true } } },
      orderBy: { createdAt: "desc" },
      take: 5000,
    });

    if (format === "csv") {
      const header = "id,createdAt,actorUsername,action,targetType,targetId,ipAddress,metadata\n";
      const rows = logs
        .map((l) =>
          [
            l.id, l.createdAt.toISOString(), l.actor ? l.actor.username : "",
            l.action, l.targetType, l.targetId || "", l.ipAddress || "",
            JSON.stringify(l.metadata || {}).replace(/"/g, "'"),
          ].map((v) => `"${v}"`).join(",")
        )
        .join("\n");

      res.setHeader("Content-Type", "text/csv");
      res.setHeader("Content-Disposition", `attachment; filename="earnvoy-audit-logs-${Date.now()}.csv"`);
      return res.send(header + rows);
    }

    res.json({ logs });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  listUsers, getUser, updateUser, deleteUser,
  listAllListings, removeListing,
  listReports, resolveReport,
  getAnalytics, getAuditLogs,
};
