/**
 * K.K. International website enquiry handler.
 * Execute as: Me | Who has access: Anyone
 *
 * Required Script Property:
 *   TURNSTILE_SECRET_KEY = Cloudflare Turnstile secret key
 */

const OFFICE_RECIPIENTS = Object.freeze({
  pakistan: "info@kkinternational.com.pk",
  malaysia: "sales@kkinternational.com.pk"
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
    const captchaToken = String(p["cf-turnstile-response"] || "").trim();
    const diagnosticOnly = PropertiesService.getScriptProperties()
      .getProperty("TURNSTILE_DIAGNOSTIC_ONLY") === "true";
    const verification = verifyTurnstile_(captchaToken);

    if (diagnosticOnly) {
      // Return safe validation metadata to the page; never expose token or secret.
      return response_("diagnostic-result", requestId, verification);
    }
    if (!verification.ok) {
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
  const diagnostic = {
    tokenReceived: Boolean(cleanToken),
    tokenLength: cleanToken.length,
    siteverifyHttpStatus: null,
    siteverifySuccess: false,
    errorCodes: [],
    hostname: "",
    hostnameAllowed: false,
    action: "",
    actionAllowed: false,
    ok: false
  };

  if (!cleanToken || cleanToken.length > 2048) {
    diagnostic.errorCodes = [cleanToken ? "token-too-long" : "missing-token"];
    return diagnostic;
  }

  const secret = PropertiesService.getScriptProperties()
    .getProperty("TURNSTILE_SECRET_KEY");
  if (!secret) {
    diagnostic.errorCodes = ["missing-server-secret"];
    return diagnostic;
  }

  try {
    const response = UrlFetchApp.fetch(TURNSTILE_VERIFY_URL, {
      method: "post",
      payload: { secret: secret, response: cleanToken },
      muteHttpExceptions: true
    });

    diagnostic.siteverifyHttpStatus = response.getResponseCode();
    if (diagnostic.siteverifyHttpStatus !== 200) {
      diagnostic.errorCodes = ["siteverify-http-error"];
      return diagnostic;
    }

    const result = JSON.parse(response.getContentText());
    diagnostic.siteverifySuccess = result.success === true;
    diagnostic.errorCodes = result["error-codes"] || [];
    diagnostic.hostname = String(result.hostname || "").toLowerCase();
    diagnostic.hostnameAllowed =
      TURNSTILE_ALLOWED_HOSTNAMES.indexOf(diagnostic.hostname) !== -1;
    diagnostic.action = String(result.action || "");
    diagnostic.actionAllowed = diagnostic.action === TURNSTILE_EXPECTED_ACTION;
    diagnostic.ok = diagnostic.siteverifySuccess &&
      diagnostic.hostnameAllowed && diagnostic.actionAllowed;

    console.log("Turnstile diagnostic: " + JSON.stringify(diagnostic));
    return diagnostic;
  } catch (err) {
    console.error("Turnstile verification request failed: " + String(err && err.message || err));
    diagnostic.errorCodes = ["siteverify-request-error"];
    return diagnostic;
  }
}

function clean_(value) {
  return String(value == null ? "" : value)
    .replace(/[\u0000-\u001F\u007F]/g, " ")
    .trim()
    .slice(0, 4000);
}

function response_(status, requestId, diagnostics) {
  const safeRequestId = JSON.stringify(String(requestId || ""));
  const safeDiagnostics = JSON.stringify(diagnostics || null).replace(/</g, "\\u003c");
  const html =
    '<!doctype html><html><body><script>' +
    'window.top.postMessage({' +
    'type:"kk-enquiry-result",' +
    'status:"' + status + '",' +
    'requestId:' + safeRequestId + ',' +
    'diagnostics:' + safeDiagnostics +
    '}, "*");' +
    '</script></body></html>';

  return HtmlService.createHtmlOutput(html)
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}
