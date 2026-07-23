const axios = require("axios");
const crypto = require("crypto");
const config = require("../config");

/**
 * Paynow (paynow.co.zw) is the standard way to accept EcoCash payments
 * programmatically. Sign up for a merchant account at https://www.paynow.co.zw
 * to get PAYNOW_INTEGRATION_ID and PAYNOW_INTEGRATION_KEY.
 * Verify field names/endpoints against Paynow's current docs before going live.
 */

const INITIATE_MOBILE_URL = "https://www.paynow.co.zw/interface/remotetransaction";

function buildHash(fields, integrationKey) {
  const concatenated = Object.values(fields).join("") + integrationKey;
  return crypto.createHash("sha512").update(concatenated, "binary").digest("hex").toUpperCase();
}

function parsePaynowResponse(body) {
  const params = new URLSearchParams(body);
  const obj = {};
  for (const [key, value] of params.entries()) obj[key] = value;
  return obj;
}

async function initiateEcocashPayment({ reference, amountGbp, phone, description, userEmail }) {
  const fields = {
    id: config.paynow.integrationId,
    reference,
    amount: amountGbp.toFixed(2),
    additionalinfo: description,
    returnurl: config.paynow.returnUrl,
    resulturl: config.paynow.resultUrl,
    authemail: userEmail,
    phone,
    method: "ecocash",
    status: "Message",
  };

  const hash = buildHash(fields, config.paynow.integrationKey);
  const payload = new URLSearchParams({ ...fields, hash }).toString();

  const { data } = await axios.post(INITIATE_MOBILE_URL, payload, {
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
  });

  return parsePaynowResponse(data);
}

async function pollPaymentStatus(pollUrl) {
  const { data } = await axios.post(pollUrl);
  return parsePaynowResponse(data);
}

function verifyWebhookHash(body) {
  const { hash, ...fields } = body;
  const expected = buildHash(fields, config.paynow.integrationKey);
  return expected === hash;
}

module.exports = { initiateEcocashPayment, pollPaymentStatus, verifyWebhookHash };
