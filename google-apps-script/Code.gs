/**
 * K.K. International website enquiry handler.
 * Execute as: Me | Who has access: Anyone
 *
 * Required Script Property:
 *   TURNSTILE_SECRET_KEY = Cloudflare Turnstile secret key
 */

const OFFICE_RECIPIENTS = Object.freeze({
  pakistan: "kkimpakistan@gmail.com",
  malaysia: "bajwa255@yahoo.com"
});

const TURNSTILE_VERIFY_URL = "https://challenges.cloudflare.com/turnstile/v0/siteverify";
const TURNSTILE_ALLOWED_HOSTNAMES = Object.freeze([
  "kkinternational.com.pk",
  "www.kkinternational.com.pk"
]);
const TURNSTILE_EXPECTED_ACTION = "business-enquiry";

const ALLOWED_FIELDS = [
  "Full name",
  "Company",
  "Your country",
  "Email",
  "Phone / WhatsApp",
  "Product category",
  "Quantity / estimated volume",
  "Destination country / port",
  "Shipping terms",
  "Payment method",
  "Trading arrangement",
  "Product origin country",
  "Production / supply capacity",
  "Minimum order quantity",
  "Certifications / documents",
  "Message"
];

function doPost(e) {
  const p = (e && e.parameter) || {};
  const requestId = clean_(p.requestId);

  try {
    // Honeypot: silently accept automated submissions without sending email.
    if (String(p.website || "").trim()) {
      return response_("success", requestId);
    }

    // Verify CAPTCHA before processing or sending any enquiry email.
    if (!verifyTurnstile_(p["cf-turnstile-response"])) {
      throw new Error("CAPTCHA verification failed.");
    }

    const office = String(p.office || "").toLowerCase();
    const recipient = OFFICE_RECIPIENTS[office];
    if (!recipient) throw new Error("Please select a valid receiving office.");

    const name = clean_(p["Full name"]);
    const email = clean_(p.Email);
    const company = clean_(p.Company);
    const message = clean_(p.Message);

    if (!name || !company || !email || !message) {
      throw new Error("Please complete all required fields.");
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      throw new Error("The sender email address is not valid.");
    }

    const enquiryType = String(p.enquiryType || "buy") === "sell"
      ? "SELLER / SUPPLIER ENQUIRY"
      : "BUYER ENQUIRY";

    const lines = [
      "New " + enquiryType + " — K.K. International",
      "Receiving office: " + (office === "pakistan" ? "Pakistan" : "Malaysia"),
      ""
    ];

    ALLOWED_FIELDS.forEach(function(field) {
      const value = clean_(p[field]);
      if (value) lines.push(field + ": " + value);
    });

    MailApp.sendEmail({
      to: recipient,
      replyTo: email,
      subject: "New " + enquiryType + " — K.K. International",
      body: lines.join("\n"),
      name: "K.K. International Website"
    });

    return response_("success", requestId);
  } catch (err) {
    console.error("Enquiry submission rejected: " + String(err && err.message || err));
    return response_("error", requestId);
  }
}

/**
 * Validate a Turnstile token with Cloudflare.
 * Fails closed if the secret is missing, the request fails, or any check fails.
 */
function verifyTurnstile_(token) {
  const cleanToken = String(token || "").trim();
  if (!cleanToken || cleanToken.length > 2048) return false;

  const secret = PropertiesService.getScriptProperties()
    .getProperty("TURNSTILE_SECRET_KEY");
  if (!secret) {
    console.error("TURNSTILE_SECRET_KEY Script Property is missing.");
    return false;
  }

  try {
    const response = UrlFetchApp.fetch(TURNSTILE_VERIFY_URL, {
      method: "post",
      payload: {
        secret: secret,
        response: cleanToken
      },
      muteHttpExceptions: true
    });

    if (response.getResponseCode() !== 200) {
      console.error("Turnstile Siteverify returned HTTP " + response.getResponseCode());
      return false;
    }

    const result = JSON.parse(response.getContentText());
    const hostname = String(result.hostname || "").toLowerCase();
    const action = String(result.action || "");

    return result.success === true &&
      TURNSTILE_ALLOWED_HOSTNAMES.indexOf(hostname) !== -1 &&
      action === TURNSTILE_EXPECTED_ACTION;
  } catch (err) {
    console.error("Turnstile verification request failed: " + String(err && err.message || err));
    return false;
  }
}

function clean_(value) {
  return String(value == null ? "" : value)
    .replace(/[\u0000-\u001F\u007F]/g, " ")
    .trim()
    .slice(0, 4000);
}

function response_(status, requestId) {
  const safeRequestId = JSON.stringify(String(requestId || ""));
  const html =
    '<!doctype html><html><body><script>' +
    'window.top.postMessage({' +
    'type:"kk-enquiry-result",' +
    'status:"' + status + '",' +
    'requestId:' + safeRequestId +
    '}, "*");' +
    '</script></body></html>';

  return HtmlService.createHtmlOutput(html)
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}
