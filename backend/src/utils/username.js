const prisma = require("../config/prisma");

// Short, readable word lists - combined they read like "swift-falcon-4821",
// which is friendly, memorable, and gives no clue to the user's real identity.
const ADJECTIVES = [
  "swift", "quiet", "bold", "brisk", "keen", "steady", "bright", "calm", "sharp", "spry",
  "prime", "true", "clear", "sound", "ready", "quick", "fair", "sure", "wise", "able",
];

const NOUNS = [
  "falcon", "harbor", "compass", "voyager", "summit", "meridian", "beacon", "current", "atlas", "cabin",
  "runway", "anchor", "horizon", "transit", "cargo", "route", "traveller", "porter", "courier", "wing",
];

function randomFrom(list) {
  return list[Math.floor(Math.random() * list.length)];
}

/**
 * Generates a unique username like "swift-falcon4821", retrying on collision.
 * Falls back to a longer random suffix if the word-based attempts keep colliding
 * (astronomically unlikely, but handled rather than left to crash).
 */
async function generateUniqueUsername() {
  for (let attempt = 0; attempt < 8; attempt++) {
    const suffixLength = attempt < 5 ? 4 : 6; // widen the random space if we keep colliding
    const suffix = Math.floor(Math.random() * 10 ** suffixLength)
      .toString()
      .padStart(suffixLength, "0");
    const candidate = `${randomFrom(ADJECTIVES)}-${randomFrom(NOUNS)}${suffix}`;

    const existing = await prisma.user.findUnique({ where: { username: candidate } });
    if (!existing) return candidate;
  }
  // Last-resort fallback: virtually guaranteed unique, just less pretty.
  return `traveller-${Date.now().toString(36)}`;
}

module.exports = { generateUniqueUsername };
