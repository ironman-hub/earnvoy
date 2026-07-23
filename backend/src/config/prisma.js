const { PrismaClient } = require("@prisma/client");

const prisma = global.__earnvoyPrisma || new PrismaClient();

if (process.env.NODE_ENV !== "production") {
  global.__earnvoyPrisma = prisma;
}

module.exports = prisma;
