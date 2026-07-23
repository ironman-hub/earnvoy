const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const rateLimit = require("express-rate-limit");
const config = require("./config");
const errorHandler = require("./middleware/errorHandler");
const paymentsCtrl = require("./controllers/paymentsController");

const authRoutes = require("./routes/auth");
const listingsRoutes = require("./routes/listings");
const paymentsRoutes = require("./routes/payments");
const adminRoutes = require("./routes/admin");
const reportsRoutes = require("./routes/reports");
const usersRoutes = require("./routes/users");

const app = express();

app.use(helmet());
app.use(cors({ origin: config.frontendUrl, credentials: true }));
app.use(morgan(config.env === "development" ? "dev" : "combined"));

// Stripe webhook needs the raw body to verify its signature - mounted BEFORE express.json()
app.post(
  "/api/payments/stripe/webhook",
  express.raw({ type: "application/json" }),
  paymentsCtrl.stripeWebhook
);

app.use(express.json());
app.use(express.urlencoded({ extended: true })); // Paynow posts form-encoded webhooks

app.use(rateLimit({ windowMs: 15 * 60 * 1000, max: 300, standardHeaders: true, legacyHeaders: false }));

const authLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 20 });
app.use("/api/auth/login", authLimiter);
app.use("/api/auth/register", authLimiter);

app.get("/health", (req, res) => res.json({ status: "ok" }));

app.use("/api/auth", authRoutes);
app.use("/api/listings", listingsRoutes);
app.use("/api/payments", paymentsRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/reports", reportsRoutes);
app.use("/api/users", usersRoutes);

app.use((req, res) => res.status(404).json({ error: "Not found." }));
app.use(errorHandler);

app.listen(config.port, () => {
  console.log(`earnvoy API listening on port ${config.port} (${config.env})`);
});

module.exports = app;
