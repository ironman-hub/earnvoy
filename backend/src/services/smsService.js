const bcrypt = require("bcryptjs");
const config = require("../config");

function getTwilioClient() {
  if (!config.sms.twilioSid || config.sms.twilioSid.startsWith("AC000")) return null;
  const twilio = require("twilio"); // npm install twilio if you enable this
  return twilio(config.sms.twilioSid, config.sms.twilioAuthToken);
}

function generateOtp() {
  return String(Math.floor(100000 + Math.random() * 900000)); // 6 digits
}

async function hashOtp(otp) {
  return bcrypt.hash(otp, 8);
}

async function verifyOtp(otp, hash) {
  return bcrypt.compare(otp, hash);
}

async function sendOtpSms(phone, otp) {
  const client = getTwilioClient();
  const body = `Your earnvoy verification code is ${otp}. It expires in 10 minutes.`;

  if (!client) {
    console.warn(`[smsService] SMS provider not configured. OTP for ${phone} is ${otp}`);
    return { skipped: true };
  }
  return client.messages.create({ body, from: config.sms.twilioFrom, to: phone });
}

module.exports = { generateOtp, hashOtp, verifyOtp, sendOtpSms };
