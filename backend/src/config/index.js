require("dotenv").config();

module.exports = {
  port: process.env.PORT || 4000,
  env: process.env.NODE_ENV || "development",
  frontendUrl: process.env.FRONTEND_URL || "http://localhost:5173",

  jwtSecret: process.env.JWT_SECRET,
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || "7d",

  stripe: {
    secretKey: process.env.STRIPE_SECRET_KEY,
    webhookSecret: process.env.STRIPE_WEBHOOK_SECRET,
  },

  paynow: {
    integrationId: process.env.PAYNOW_INTEGRATION_ID,
    integrationKey: process.env.PAYNOW_INTEGRATION_KEY,
    returnUrl: process.env.PAYNOW_RETURN_URL,
    resultUrl: process.env.PAYNOW_RESULT_URL,
  },

  smtp: {
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT || 587),
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
    from: process.env.EMAIL_FROM || "earnvoy <no-reply@earnvoy.com>",
  },

  sms: {
    provider: process.env.SMS_PROVIDER || "twilio",
    twilioSid: process.env.TWILIO_ACCOUNT_SID,
    twilioAuthToken: process.env.TWILIO_AUTH_TOKEN,
    twilioFrom: process.env.TWILIO_FROM_NUMBER,
  },

  // Flat £1.75 fee - applies to both posting a listing and unlocking contact details
  fees: {
    listingFeeGbp: Number(process.env.LISTING_FEE_GBP || 1.75),
    unlockFeeGbp: Number(process.env.UNLOCK_FEE_GBP || 1.75),
  },

  maxListingsPerMonth: Number(process.env.MAX_LISTINGS_PER_MONTH || 2),
  termsVersion: process.env.TERMS_VERSION || "2026-07-23",
};
